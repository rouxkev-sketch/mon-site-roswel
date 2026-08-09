import {
  DELAI_ANNULATION_FORMULAIRE_MINUTES,
  DELAIS_RELANCE_JOURS,
  FUSEAU_ENVOI,
  GABARITS_PROSPECTION,
  METIERS,
  NOMBRE_ENVOIS_MAXIMUM,
  PLAGE_ENVOI,
  PLANIFICATION_ENVOI,
  POINTS_INSTAGRAM_A_GAGNER,
  STATUTS_PROSPECTION,
} from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { adresseDuSite, envoyerEmailDetaille } from "@/lib/email";
import { calculerScoreProspect } from "@/lib/score";
import { lireIndicateursEnvoi } from "@/lib/prospection-quota";

/**
 * LE MOTEUR D'ENVOI DE LA PROSPECTION
 * ====================================
 * Trois temps, volontairement séparés :
 *
 *  1. L'APERÇU (preparerApercu) — je vois les messages EXACTS, avec
 *     les vraies données, avant que quoi que ce soit ne parte.
 *  2. LA MISE EN FILE (mettreEnFile) — je valide. Rien ne part tout
 *     de suite : chaque prospect reçoit une HEURE D'ENVOI, étalée
 *     dans la plage autorisée. Mon navigateur peut être fermé.
 *  3. L'ENVOI (envoyerCeQuiEstDu) — la tâche planifiée, côté
 *     serveur, envoie ce qui est dû et se rendort.
 *
 * POURQUOI TROIS TEMPS
 * --------------------
 * Envoyer soixante messages d'un coup depuis un navigateur, c'est :
 * une page qu'on n'ose plus fermer, aucun étalement, et une rafale
 * qui ressemble à s'y méprendre à du courrier indésirable. La file
 * d'attente vit en base (colonne `prochain_envoi_le`), pas dans
 * l'onglet.
 *
 * TOUS LES CONTRÔLES SONT REFAITS AU MOMENT D'ENVOYER. L'interface
 * empêche déjà de sélectionner un prospect désinscrit ou de dépasser
 * le quota, mais entre la mise en file et l'envoi il peut s'écouler
 * des heures : une désinscription, un rebond, une réponse ont pu
 * arriver entre-temps. Le dernier mot revient toujours à
 * `raisonDeNePasEnvoyer`, juste avant de partir.
 */

/* ------------------------------------------------------------------
 * L'HEURE DE PARIS
 * ------------------------------------------------------------------
 * L'hébergeur raisonne en UTC, PLAGE_ENVOI parle de l'heure de Paris.
 * Confondre les deux ferait écrire aux artisans à 6 h du matin en
 * hiver — exactement ce que la plage horaire cherche à éviter.
 * ------------------------------------------------------------------ */

type PartiesDate = {
  annee: number;
  mois: number;
  jour: number;
  heure: number;
  minute: number;
};

const FORMAT_PARIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU_ENVOI,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  // `h23` explicitement : sans lui, certains environnements écrivent
  // minuit « 24 » et l'heure calculée se décale d'un jour.
  hourCycle: "h23",
});

/** La date et l'heure telles qu'on les lit à Paris. */
export function partiesParis(date: Date): PartiesDate {
  const parties = Object.fromEntries(
    FORMAT_PARIS.formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  ) as Record<string, number>;
  return {
    annee: parties.year,
    mois: parties.month,
    jour: parties.day,
    // Minuit se lit « 24 » dans certains environnements : on ramène à 0.
    heure: parties.hour % 24,
    minute: parties.minute,
  };
}

/**
 * L'instant précis correspondant à une heure de Paris, le jour
 * (parisien) de `reference`. Le décalage se mesure au lieu d'être
 * supposé : +1 h en hiver, +2 h en été, et rien à changer deux fois
 * par an.
 */
export function instantParis(
  reference: Date,
  heure: number,
  minute = 0
): Date {
  const p = partiesParis(reference);
  // Première approximation : on suppose UTC, puis on corrige avec le
  // décalage réellement observé à cet instant-là.
  const suppose = Date.UTC(p.annee, p.mois - 1, p.jour, heure, minute);
  const decalage =
    Date.UTC(p.annee, p.mois - 1, p.jour, p.heure, p.minute) -
    new Date(reference).setSeconds(0, 0);
  return new Date(suppose - decalage);
}

/** Le début et la fin de la plage d'envoi, pour le jour de `reference`. */
export function plageDuJour(reference: Date): { debut: Date; fin: Date } {
  return {
    debut: instantParis(reference, PLAGE_ENVOI.heureDebut),
    fin: instantParis(reference, PLAGE_ENVOI.heureFin),
  };
}

/** Sommes-nous dans la plage où l'on s'autorise à écrire ? */
export function dansLaPlage(maintenant: Date = new Date()): boolean {
  const { debut, fin } = plageDuJour(maintenant);
  return maintenant >= debut && maintenant < fin;
}

/** Le même jour, à Paris (pour « pas deux fois le même jour »). */
function memeJourParis(a: Date, b: Date): boolean {
  const x = partiesParis(a);
  const y = partiesParis(b);
  return x.annee === y.annee && x.mois === y.mois && x.jour === y.jour;
}

/* ------------------------------------------------------------------
 * LA SÉQUENCE
 * ------------------------------------------------------------------ */

/** Les quatre messages, dans l'ordre. La clé part dans le journal. */
const SEQUENCE = [
  "premierContact",
  "relance1",
  "relance2",
  "relance3",
] as const;

export type CleGabarit = (typeof SEQUENCE)[number];

/**
 * Le gabarit à utiliser pour le prochain message, d'après le nombre
 * d'envois déjà partis. 0 → premier contact, 1 → J+7, etc.
 */
export function gabaritPour(nombreEnvois: number): CleGabarit | null {
  return SEQUENCE[nombreEnvois] ?? null;
}

/**
 * La date de la prochaine relance : J+7, J+14 puis J+30 après le
 * PREMIER contact — jamais après le dernier message. Compté depuis le
 * premier, l'espacement se détend tout seul ; compté depuis le
 * dernier, il resterait de sept jours jusqu'au bout.
 */
export function dateProchaineRelance(
  premierEnvoi: Date,
  nombreEnvois: number
): Date | null {
  const jours = DELAIS_RELANCE_JOURS[nombreEnvois - 1];
  if (jours === undefined) return null;
  return new Date(premierEnvoi.getTime() + jours * 24 * 3600 * 1000);
}

/* ------------------------------------------------------------------
 * QUI PEUT RECEVOIR UN MESSAGE
 * ------------------------------------------------------------------ */

export type ProspectEnvoi = {
  id: string;
  raison_sociale: string;
  nom_commercial: string | null;
  metiers: string[] | null;
  ville_nom: string | null;
  note_google: number | null;
  nombre_avis_google: number | null;
  date_creation_entreprise: string | null;
  email: string | null;
  site_internet: string | null;
  jeton_desinscription: string;
  statut: string;
  nombre_envois: number;
  premier_envoi_le: string | null;
  dernier_envoi_le: string | null;
  prochain_envoi_le: string | null;
  contact_formulaire_le: string | null;
  desinscrit_le: string | null;
};

export const COLONNES_ENVOI =
  "id, raison_sociale, nom_commercial, metiers, ville_nom, note_google, " +
  "nombre_avis_google, date_creation_entreprise, email, site_internet, " +
  "jeton_desinscription, statut, nombre_envois, premier_envoi_le, " +
  "dernier_envoi_le, prochain_envoi_le, contact_formulaire_le, desinscrit_le";

/**
 * LES QUATRE ARRÊTS DÉFINITIFS DE LA SÉQUENCE.
 * Aucune exception, jamais : une réponse, un compte créé, une
 * désinscription ou un rebond ferment le dossier. Continuer après un
 * « non » n'a rien d'un oubli technique — c'est du harcèlement, et
 * c'est ce qui fait basculer un domaine entier en indésirable.
 */
const STATUTS_QUI_ARRETENT = new Set([
  "reponse_recue",
  "compte_cree",
  "ne_plus_contacter",
  "rebond",
]);

/**
 * Pourquoi ce prospect ne doit PAS recevoir de message — ou null s'il
 * le peut. Une seule fonction, appelée à la sélection, à la mise en
 * file ET juste avant l'envoi.
 */
export function raisonDeNePasEnvoyer(prospect: ProspectEnvoi): string | null {
  if (prospect.desinscrit_le) {
    return "Ce prospect s'est désinscrit : il ne doit plus jamais être contacté.";
  }
  if (STATUTS_QUI_ARRETENT.has(prospect.statut)) {
    const libelle =
      STATUTS_PROSPECTION.find((s) => s.cle === prospect.statut)?.label ??
      prospect.statut;
    return `Séquence arrêtée (${libelle.toLowerCase()}).`;
  }
  if (!prospect.email) return "Aucune adresse e-mail connue.";
  if (prospect.nombre_envois >= NOMBRE_ENVOIS_MAXIMUM) {
    return `${NOMBRE_ENVOIS_MAXIMUM} messages déjà envoyés : la séquence est terminée.`;
  }
  return null;
}

/* ------------------------------------------------------------------
 * LA FABRICATION DU MESSAGE
 * ------------------------------------------------------------------ */

const LIBELLE_METIER = new Map(METIERS.map(({ slug, label }) => [slug, label]));

/** Le nom le plus parlant : l'enseigne si elle existe. */
function nomLisible(prospect: ProspectEnvoi): string {
  const commercial = (prospect.nom_commercial ?? "").trim();
  if (commercial) return commercial;
  // « MAVIA DIAKITE (ASSAMARI) » → « ASSAMARI »
  const parenthese = prospect.raison_sociale.match(/\(([^()]+)\)\s*$/);
  return (parenthese?.[1] ?? prospect.raison_sociale).trim();
}

/** L'ancienneté en années entières (0 pour une entreprise toute jeune). */
function anneesDexistence(dateCreation: string | null): number {
  if (!dateCreation) return 0;
  const millisecondes = Date.now() - new Date(dateCreation).getTime();
  if (Number.isNaN(millisecondes)) return 0;
  return Math.max(0, Math.floor(millisecondes / (365.25 * 24 * 3600 * 1000)));
}

export type MessagePret = {
  prospectId: string;
  entreprise: string;
  email: string | null;
  siteInternet: string | null;
  numeroRelance: number;
  gabarit: CleGabarit;
  sujet: string;
  texte: string;
  lienDesinscription: string;
};

/**
 * LE MESSAGE, AVEC LES VRAIES DONNÉES.
 * Aucun texte n'est écrit ici : tout vient de GABARITS_PROSPECTION
 * (src/config/roswel.ts). Cette fonction ne fait que remplacer les
 * étiquettes {nom}, {score}, {lien}…
 */
export function construireMessage(prospect: ProspectEnvoi): MessagePret | null {
  const gabarit = gabaritPour(prospect.nombre_envois);
  if (!gabarit) return null;

  const modele = GABARITS_PROSPECTION[gabarit];
  const site = adresseDuSite();
  const score = calculerScoreProspect(
    prospect.note_google,
    prospect.nombre_avis_google,
    prospect.date_creation_entreprise
  );
  const metier =
    (prospect.metiers ?? [])
      .map((m) => LIBELLE_METIER.get(m) ?? m)
      .join(" · ")
      .toLowerCase() || "artisan";

  const valeurs: Record<string, string> = {
    nom: nomLisible(prospect),
    metier,
    ville: prospect.ville_nom ?? "votre commune",
    // La note s'écrit à la française : 4,8 et non 4.8.
    note: prospect.note_google
      ? String(prospect.note_google).replace(".", ",")
      : "—",
    avis: String(prospect.nombre_avis_google ?? 0),
    annees: String(anneesDexistence(prospect.date_creation_entreprise)),
    score: String(score.points),
    maximum: String(score.maximum),
    aGagner: String(POINTS_INSTAGRAM_A_GAGNER),
    lien: `${site}/devenir-artisan`,
    desinscription: `${site}/desinscription/${prospect.jeton_desinscription}`,
  };

  const remplir = (texte: string) =>
    texte.replace(/\{(\w+)\}/g, (entier, cle: string) => valeurs[cle] ?? entier);

  return {
    prospectId: prospect.id,
    entreprise: prospect.raison_sociale,
    email: prospect.email,
    siteInternet: prospect.site_internet,
    numeroRelance: prospect.nombre_envois,
    gabarit,
    sujet: remplir(modele.sujet),
    texte: remplir(modele.texte),
    lienDesinscription: valeurs.desinscription,
  };
}

/* ------------------------------------------------------------------
 * 1. L'APERÇU AVANT ENVOI
 * ------------------------------------------------------------------ */

export type ApercuEnvoi = {
  /** Ceux qui partiront tout seuls. */
  automatiques: MessagePret[];
  /** Ceux qu'il faudra recopier dans leur formulaire de contact. */
  aLaMain: MessagePret[];
  /** Ce qui a été écarté, et pourquoi. */
  ecartes: Array<{ entreprise: string; raison: string }>;
  /** Combien d'envois restent possibles sur les 24 dernières heures. */
  quotaRestant: number;
  /** Vrai si l'on est en dehors de la plage horaire d'envoi. */
  horsPlage: boolean;
  /** Quand partira le premier message si l'on valide maintenant. */
  premierDepart: string;
};

type ClientAdmin = ReturnType<typeof creerClientSupabaseAdmin>;

async function lireProspects(
  supabase: ClientAdmin,
  ids: string[]
): Promise<ProspectEnvoi[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ProspectEnvoi[]).map((p) => ({
    ...p,
    nombre_envois: p.nombre_envois ?? 0,
  }));
}

/**
 * L'APERÇU : les messages exacts, avant toute décision.
 *
 * Deux populations dans le même écran, parce que ce sont deux gestes
 * différents pour la même journée de travail :
 *  - ceux qui ont une adresse → l'outil s'en charge ;
 *  - ceux qui n'en ont pas mais ont un SITE → le message est prêt à
 *    être recopié dans leur formulaire de contact. Ces contacts-là ne
 *    consomment pas le quota : ils ne passent pas par Resend et ne
 *    pèsent pas sur la réputation de l'adresse d'expéditeur.
 */
export async function preparerApercu(
  ids: string[],
  filtres: { commune?: string } = {},
  maximumALaMain = 25
): Promise<ApercuEnvoi> {
  const supabase = creerClientSupabaseAdmin();
  const maintenant = new Date();

  const automatiques: MessagePret[] = [];
  const ecartes: Array<{ entreprise: string; raison: string }> = [];

  for (const prospect of await lireProspects(supabase, ids)) {
    const raison = raisonDeNePasEnvoyer(prospect);
    if (raison) {
      ecartes.push({ entreprise: prospect.raison_sociale, raison });
      continue;
    }
    const message = construireMessage(prospect);
    if (message) automatiques.push(message);
  }

  // ----- Ceux qu'il faudra faire à la main -----
  // Pas d'adresse, mais un site : leur formulaire de contact est la
  // seule porte d'entrée. Jamais ceux qui sont déjà passés par là.
  let requete = supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .is("email", null)
    .is("contact_formulaire_le", null)
    .is("desinscrit_le", null)
    .not("site_internet", "is", null)
    .eq("nombre_envois", 0)
    .order("collecte_le", { ascending: false })
    .limit(maximumALaMain);
  if (filtres.commune && filtres.commune !== "toutes") {
    requete = requete.eq("ville_code_insee", filtres.commune);
  }
  const { data: sansAdresse, error } = await requete;
  if (error) throw new Error(error.message);

  const aLaMain: MessagePret[] = [];
  for (const prospect of (sansAdresse ?? []) as unknown as ProspectEnvoi[]) {
    if (STATUTS_QUI_ARRETENT.has(prospect.statut)) continue;
    const message = construireMessage({ ...prospect, nombre_envois: 0 });
    if (message) aLaMain.push(message);
  }

  const indicateurs = await lireIndicateursEnvoi(maintenant);
  const { debut, fin } = plageDuJour(maintenant);
  const horsPlage = !dansLaPlage(maintenant);
  const premierDepart =
    maintenant < debut
      ? debut
      : maintenant < fin
        ? maintenant
        : // Après 18 h : le premier départ sera à l'ouverture de demain.
          new Date(debut.getTime() + 24 * 3600 * 1000);

  return {
    automatiques,
    aLaMain,
    ecartes,
    quotaRestant: indicateurs.restant,
    horsPlage,
    premierDepart: premierDepart.toISOString(),
  };
}

/* ------------------------------------------------------------------
 * 2. LA MISE EN FILE D'ATTENTE
 * ------------------------------------------------------------------ */

export type ResultatMiseEnFile = {
  ok: boolean;
  message: string;
  misEnFile: number;
  ecartes: Array<{ entreprise: string; raison: string }>;
  /** L'heure du premier et du dernier départ programmés. */
  premierDepart: string | null;
  dernierDepart: string | null;
  /** L'écart calculé entre deux envois, en minutes. */
  ecartMinutes: number;
};

/**
 * L'ÉTALEMENT
 * -----------
 * On ne choisit pas un écart « au jugé » : on prend le temps qui
 * reste dans la plage et on le divise par le nombre de messages. Cinq
 * messages à 9 h du matin partiront donc à deux heures d'intervalle,
 * et quarante à un quart d'heure. Le dernier part toujours AVANT la
 * fin de la plage, jamais le lendemain.
 *
 * En dehors de la plage (le soir, la nuit), la file est programmée
 * sur la plage SUIVANTE : rien ne se perd, rien ne part à 23 h.
 */
export async function mettreEnFile(ids: string[]): Promise<ResultatMiseEnFile> {
  const supabase = creerClientSupabaseAdmin();
  const maintenant = new Date();

  const retenus: ProspectEnvoi[] = [];
  const ecartes: Array<{ entreprise: string; raison: string }> = [];

  for (const prospect of await lireProspects(supabase, ids)) {
    const raison = raisonDeNePasEnvoyer(prospect);
    if (raison) {
      ecartes.push({ entreprise: prospect.raison_sociale, raison });
      continue;
    }
    retenus.push(prospect);
  }

  // ----- Le quota du moment a le dernier mot -----
  const indicateurs = await lireIndicateursEnvoi(maintenant);
  if (retenus.length > indicateurs.restant) {
    const trop = retenus.splice(indicateurs.restant);
    for (const prospect of trop) {
      ecartes.push({
        entreprise: prospect.raison_sociale,
        raison: `Quota des ${indicateurs.fenetreHeures} dernières heures atteint (${indicateurs.plafond} messages).`,
      });
    }
  }

  if (retenus.length === 0) {
    return {
      ok: false,
      message:
        "Aucun prospect ne peut être mis en file d'attente. Détail ligne par ligne ci-dessous.",
      misEnFile: 0,
      ecartes,
      premierDepart: null,
      dernierDepart: null,
      ecartMinutes: 0,
    };
  }

  // ----- Le calendrier -----
  const { debut, fin } = plageDuJour(maintenant);
  let depart: Date;
  let finPlage: Date;
  if (maintenant < debut) {
    depart = debut; // avant l'ouverture : on commence à l'ouverture
    finPlage = fin;
  } else if (maintenant < fin) {
    depart = maintenant; // en pleine plage : dès maintenant
    finPlage = fin;
  } else {
    // Après la fermeture : tout est programmé pour demain matin.
    depart = new Date(debut.getTime() + 24 * 3600 * 1000);
    finPlage = new Date(fin.getTime() + 24 * 3600 * 1000);
  }

  const tempsDisponible = finPlage.getTime() - depart.getTime();
  const ecart = tempsDisponible / retenus.length;

  // Une seule exécution planifiée par jour : l'étalement à la minute
  // n'aurait aucun effet (voir PLANIFICATION_ENVOI). On programme
  // alors tout le paquet à l'ouverture, ce qui est ce qui se passera
  // réellement — mieux vaut une heure honnête qu'une heure décorative.
  const unSeulPaquet = PLANIFICATION_ENVOI.executionsParJour <= 1;

  const horaires = retenus.map((_, index) =>
    unSeulPaquet ? depart : new Date(depart.getTime() + index * ecart)
  );

  for (let i = 0; i < retenus.length; i += 1) {
    const { error } = await supabase
      .from("artisans_prospects")
      .update({ prochain_envoi_le: horaires[i].toISOString() })
      .eq("id", retenus[i].id);
    if (error) {
      return {
        ok: false,
        message: `Mise en file interrompue : ${error.message}`,
        misEnFile: i,
        ecartes,
        premierDepart: horaires[0]?.toISOString() ?? null,
        dernierDepart: horaires[i - 1]?.toISOString() ?? null,
        ecartMinutes: Math.round(ecart / 60000),
      };
    }
  }

  const dernier = horaires[horaires.length - 1];
  const message =
    `${retenus.length} message(s) en file d'attente. ` +
    (unSeulPaquet
      ? `Départ en un seul paquet, à partir de ${heureLisible(horaires[0])}.`
      : `Premier départ ${heureLisible(horaires[0])}, dernier ${heureLisible(dernier)}, ` +
        `soit un écart d'environ ${Math.max(1, Math.round(ecart / 60000))} minutes.`) +
    (maintenant >= fin
      ? " (Programmé pour demain : la plage d'envoi du jour est terminée.)"
      : "") +
    (ecartes.length > 0 ? ` ${ecartes.length} prospect(s) écarté(s).` : "");

  return {
    ok: true,
    message,
    misEnFile: retenus.length,
    ecartes,
    premierDepart: horaires[0].toISOString(),
    dernierDepart: dernier.toISOString(),
    ecartMinutes: Math.max(1, Math.round(ecart / 60000)),
  };
}

/** « 14 h 05 », heure de Paris. */
function heureLisible(date: Date): string {
  const p = partiesParis(date);
  return `${p.heure} h ${String(p.minute).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------
 * 3. L'ENVOI (la tâche planifiée)
 * ------------------------------------------------------------------ */

export type ResultatEnvoi = {
  ok: boolean;
  message: string;
  envoyes: number;
  simules: number;
  echecs: number;
  ignores: number;
  restants: number;
  horsPlage: boolean;
  journal: Array<{ entreprise: string; action: string; detail: string }>;
};

/** Un envoi déjà parti à ce prospect aujourd'hui ? Alors on passe. */
async function dejaEnvoyeAujourdhui(
  supabase: ClientAdmin,
  prospectId: string,
  maintenant: Date
): Promise<boolean> {
  const { data } = await supabase
    .from("prospection_envois")
    .select("envoye_le")
    .eq("prospect_id", prospectId)
    .order("envoye_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  const dernier = (data as { envoye_le?: string } | null)?.envoye_le;
  return Boolean(dernier) && memeJourParis(new Date(dernier as string), maintenant);
}

/**
 * LA TÂCHE PLANIFIÉE : envoyer ce qui est dû, et rien d'autre.
 *
 * ORDRE DE PASSAGE : les PREMIERS CONTACTS d'abord, les relances
 * ensuite. Si le quota du jour est mangé par de nouveaux prospects,
 * les relances attendent le lendemain — elles, au moins, ont déjà
 * reçu un message. Un prospect qui n'a jamais rien reçu passe devant.
 */
export async function envoyerCeQuiEstDu(
  maintenant: Date = new Date()
): Promise<ResultatEnvoi> {
  const journal: Array<{ entreprise: string; action: string; detail: string }> =
    [];
  let envoyes = 0;
  let simules = 0;
  let echecs = 0;
  let ignores = 0;

  // ----- La plage horaire, avant toute chose -----
  // Ce contrôle passe AVANT la connexion à la base : c'est la sortie
  // la plus fréquente (la tâche peut être appelée à toute heure), et
  // elle ne coûte alors rien du tout.
  if (!dansLaPlage(maintenant)) {
    return {
      ok: true,
      message:
        `Hors de la plage d'envoi (${PLAGE_ENVOI.heureDebut} h – ` +
        `${PLAGE_ENVOI.heureFin} h, heure de Paris) : rien n'est parti.`,
      envoyes: 0,
      simules: 0,
      echecs: 0,
      ignores: 0,
      restants: 0,
      horsPlage: true,
      journal,
    };
  }

  const supabase = creerClientSupabaseAdmin();

  // ----- Ce qui est dû -----
  // Avec une seule exécution par jour, ou tout près de la fermeture,
  // on vide la file du jour : sinon la moitié des messages
  // attendraient demain pour une poignée de minutes.
  const { fin } = plageDuJour(maintenant);
  const minutesAvantFin = (fin.getTime() - maintenant.getTime()) / 60000;
  const toutLeJour =
    PLANIFICATION_ENVOI.executionsParJour <= 1 ||
    minutesAvantFin <= PLANIFICATION_ENVOI.rattrapageAvantFinMinutes;
  const limite = toutLeJour ? fin : maintenant;

  const { data, error } = await supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .not("prochain_envoi_le", "is", null)
    .lte("prochain_envoi_le", limite.toISOString())
    .order("nombre_envois", { ascending: true }) // les premiers contacts d'abord
    .order("prochain_envoi_le", { ascending: true })
    .limit(PLANIFICATION_ENVOI.lotMaximumParExecution * 2);
  if (error) {
    return {
      ok: false,
      message: `File d'attente illisible : ${error.message}`,
      envoyes: 0,
      simules: 0,
      echecs: 0,
      ignores: 0,
      restants: 0,
      horsPlage: false,
      journal,
    };
  }

  const enFile = ((data ?? []) as unknown as ProspectEnvoi[]).map((p) => ({
    ...p,
    nombre_envois: p.nombre_envois ?? 0,
  }));

  // ----- Le quota, recalculé à la seconde -----
  const indicateurs = await lireIndicateursEnvoi(maintenant);
  const aEnvoyer = Math.min(
    indicateurs.restant,
    PLANIFICATION_ENVOI.lotMaximumParExecution
  );

  let partis = 0;
  for (const prospect of enFile) {
    if (partis >= aEnvoyer) break;

    // Tout est revérifié ICI : la mise en file peut dater de ce matin.
    const raison = raisonDeNePasEnvoyer(prospect);
    if (raison) {
      ignores += 1;
      // Le dossier est-il DÉFINITIVEMENT clos ? Alors la ligne sort de
      // la file, inutile de la relire demain. Mais s'il ne manque
      // qu'une ADRESSE, on garde la date : c'est un travail qui
      // m'attend (le formulaire de contact de son site), et l'effacer
      // le ferait disparaître de mon écran sans que je le sache.
      if (prospect.email) {
        await supabase
          .from("artisans_prospects")
          .update({ prochain_envoi_le: null })
          .eq("id", prospect.id);
      }
      journal.push({
        entreprise: prospect.raison_sociale,
        action: "ignoré",
        detail: raison,
      });
      continue;
    }

    if (await dejaEnvoyeAujourdhui(supabase, prospect.id, maintenant)) {
      ignores += 1;
      journal.push({
        entreprise: prospect.raison_sociale,
        action: "ignoré",
        detail: "un message lui est déjà parti aujourd'hui.",
      });
      continue;
    }

    const message = construireMessage(prospect);
    if (!message || !prospect.email) {
      ignores += 1;
      continue;
    }

    // ----- L'envoi -----
    const { resultat, id } = await envoyerEmailDetaille(
      prospect.email,
      message.sujet,
      message.texte,
      { desinscription: message.lienDesinscription }
    );

    // ----- Le journal, TOUJOURS écrit, même en cas d'échec -----
    const { error: erreurJournal } = await supabase
      .from("prospection_envois")
      .insert({
        prospect_id: prospect.id,
        email: prospect.email,
        numero_relance: prospect.nombre_envois,
        gabarit: message.gabarit,
        envoye_le: new Date().toISOString(),
        resultat,
        id_resend: id,
      });
    if (erreurJournal) {
      journal.push({
        entreprise: prospect.raison_sociale,
        action: "⚠ journal",
        detail: erreurJournal.message,
      });
    }

    if (resultat === "echec") {
      echecs += 1;
      // On laisse la ligne en file : elle repartira à la prochaine
      // exécution. Un échec technique n'est pas un refus.
      journal.push({
        entreprise: prospect.raison_sociale,
        action: "échec",
        detail: "Resend a refusé le message ; nouvelle tentative plus tard.",
      });
      continue;
    }

    // ----- Le prospect avance dans la séquence -----
    const envoisApres = prospect.nombre_envois + 1;
    const premier = prospect.premier_envoi_le
      ? new Date(prospect.premier_envoi_le)
      : new Date();
    const prochaine =
      envoisApres < NOMBRE_ENVOIS_MAXIMUM
        ? dateProchaineRelance(premier, envoisApres)
        : null;

    const { error: erreurMaj } = await supabase
      .from("artisans_prospects")
      .update({
        statut: "relance_en_cours",
        nombre_envois: envoisApres,
        premier_envoi_le: premier.toISOString(),
        dernier_envoi_le: new Date().toISOString(),
        prochain_envoi_le: prochaine ? prochaine.toISOString() : null,
      })
      .eq("id", prospect.id);
    if (erreurMaj) {
      journal.push({
        entreprise: prospect.raison_sociale,
        action: "⚠ suivi",
        detail: erreurMaj.message,
      });
    }

    if (resultat === "simule") simules += 1;
    else envoyes += 1;
    partis += 1;

    journal.push({
      entreprise: prospect.raison_sociale,
      action: resultat === "simule" ? "simulé" : "envoyé",
      detail: `${message.gabarit} → ${prospect.email}`,
    });
  }

  const restants = Math.max(0, enFile.length - partis - ignores);
  const message =
    `${envoyes + simules} message(s) parti(s)` +
    (simules > 0 ? ` (dont ${simules} simulé(s), sans clé Resend)` : "") +
    (echecs > 0 ? `, ${echecs} échec(s)` : "") +
    (ignores > 0 ? `, ${ignores} ignoré(s)` : "") +
    `. Quota restant sur ${indicateurs.fenetreHeures} h : ` +
    `${Math.max(0, indicateurs.restant - partis)} sur ${indicateurs.plafond}.` +
    (restants > 0 ? ` ${restants} encore en file.` : "");

  return {
    ok: true,
    message,
    envoyes,
    simules,
    echecs,
    ignores,
    restants,
    horsPlage: false,
    journal,
  };
}

/* ------------------------------------------------------------------
 * LE CONTACT PRIS À LA MAIN
 * ------------------------------------------------------------------ */

/**
 * Les arrêts qui valent AUSSI pour un contact fait à la main. La seule
 * différence avec `raisonDeNePasEnvoyer` : l'absence d'adresse e-mail
 * n'empêche évidemment rien — c'est même la raison d'être du
 * formulaire.
 */
export function raisonDeNePasRemplirLeFormulaire(
  prospect: ProspectEnvoi
): string | null {
  if (prospect.desinscrit_le) {
    return "Ce prospect s'est désinscrit : il ne doit plus jamais être contacté.";
  }
  if (STATUTS_QUI_ARRETENT.has(prospect.statut)) {
    const libelle =
      STATUTS_PROSPECTION.find((s) => s.cle === prospect.statut)?.label ??
      prospect.statut;
    return `Séquence arrêtée (${libelle.toLowerCase()}).`;
  }
  if (prospect.nombre_envois >= NOMBRE_ENVOIS_MAXIMUM) {
    return `${NOMBRE_ENVOIS_MAXIMUM} messages déjà envoyés : la séquence est terminée.`;
  }
  return null;
}

/**
 * « CONTACTÉ PAR SON FORMULAIRE » — le contact fait à la main.
 * ------------------------------------------------------------
 * Sans adresse e-mail, la seule porte d'entrée est le formulaire de
 * contact du site de l'artisan. Ce geste-là compte EXACTEMENT comme un
 * e-mail dans la séquence : le compteur d'envois avance, la date du
 * premier contact s'inscrit, et la relance suivante est calculée
 * (J+7, J+14, J+30). Sans cela, ces prospects resteraient bloqués à
 * zéro pour toujours — c'est-à-dire abandonnés.
 *
 * Deux différences, et deux seulement :
 *  - il ne consomme PAS le quota quotidien : il ne passe pas par
 *    Resend, il ne pèse pas sur la réputation de l'adresse
 *    d'expéditeur. Rien n'est donc écrit dans `prospection_envois`,
 *    la table qui porte le quota ;
 *  - il est DATÉ dans `contact_formulaire_le`, ce qui alimente le
 *    quatrième indicateur de la page (« hors quota »).
 */
export async function marquerFormulaireEnvoye(
  prospectId: string
): Promise<{ ok: boolean; message: string; annulableSecondes?: number }> {
  const supabase = creerClientSupabaseAdmin();

  const { data, error: erreurLecture } = await supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .eq("id", prospectId)
    .maybeSingle();
  if (erreurLecture) return { ok: false, message: erreurLecture.message };
  if (!data) return { ok: false, message: "Prospect introuvable." };

  const prospect = data as unknown as ProspectEnvoi;
  prospect.nombre_envois = prospect.nombre_envois ?? 0;

  const refus = raisonDeNePasRemplirLeFormulaire(prospect);
  if (refus) return { ok: false, message: refus };

  const maintenant = new Date();
  const envoisApres = prospect.nombre_envois + 1;
  const premier = prospect.premier_envoi_le
    ? new Date(prospect.premier_envoi_le)
    : maintenant;
  const prochaine =
    envoisApres < NOMBRE_ENVOIS_MAXIMUM
      ? dateProchaineRelance(premier, envoisApres)
      : null;

  // L'ÉTAT D'AVANT, PHOTOGRAPHIÉ AVANT D'ÉCRIRE. C'est la seule
  // manière d'annuler EXACTEMENT : le statut précédent et la date du
  // dernier envoi ne se redéduisent pas une fois écrasés.
  const avant = etatFormulaire(prospect);

  const apres: EtatFormulaire = {
    contact_formulaire_le: maintenant.toISOString(),
    statut: "relance_en_cours",
    nombre_envois: envoisApres,
    premier_envoi_le: premier.toISOString(),
    dernier_envoi_le: maintenant.toISOString(),
    prochain_envoi_le: prochaine ? prochaine.toISOString() : null,
  };

  const { error } = await supabase
    .from("artisans_prospects")
    .update(apres)
    .eq("id", prospectId);
  if (error) return { ok: false, message: error.message };

  const expireA = Date.now() + DELAI_ANNULATION_FORMULAIRE_MINUTES * 60_000;
  memoriserAnnulation(prospectId, { avant, apres, expireA });

  console.log(
    `[prospection formulaire] ${prospect.raison_sociale} — contact ${envoisApres}/${NOMBRE_ENVOIS_MAXIMUM}, hors quota.`
  );
  return {
    ok: true,
    // Une DURÉE, pas une heure : le navigateur n'a rien à comparer,
    // et les deux horloges n'ont pas besoin d'être d'accord.
    annulableSecondes: DELAI_ANNULATION_FORMULAIRE_MINUTES * 60,
    message:
      `Contact par formulaire noté pour ${prospect.raison_sociale} ` +
      `(${envoisApres} sur ${NOMBRE_ENVOIS_MAXIMUM}). Il ne compte pas dans le quota` +
      (prochaine
        ? `, et la relance est prévue le ${prochaine.toLocaleDateString("fr-FR")}.`
        : " ; la séquence est terminée."),
  };
}

/* ------------------------------------------------------------------
 * DÉFAIRE UN CONTACT PAR FORMULAIRE
 * ------------------------------------------------------------------ */

/**
 * LES SIX CHAMPS QUE `marquerFormulaireEnvoye` ÉCRASE — pas un de
 * plus. Une annulation les remet tels quels, et ne touche à rien
 * d'autre (ni l'adresse e-mail, ni les notes, ni le métier).
 */
type EtatFormulaire = {
  contact_formulaire_le: string | null;
  statut: string;
  nombre_envois: number;
  premier_envoi_le: string | null;
  dernier_envoi_le: string | null;
  prochain_envoi_le: string | null;
};

function etatFormulaire(prospect: ProspectEnvoi): EtatFormulaire {
  return {
    contact_formulaire_le: prospect.contact_formulaire_le ?? null,
    statut: prospect.statut,
    nombre_envois: prospect.nombre_envois ?? 0,
    premier_envoi_le: prospect.premier_envoi_le ?? null,
    dernier_envoi_le: prospect.dernier_envoi_le ?? null,
    prochain_envoi_le: prospect.prochain_envoi_le ?? null,
  };
}

/**
 * LA MÉMOIRE DES ANNULATIONS POSSIBLES
 * -------------------------------------
 * Elle ne vit QUE dans le processus, quelques minutes, et c'est
 * volontaire : cette fenêtre sert à rattraper un clic qu'on vient de
 * faire, pas à retoucher des compteurs plus tard. Rien n'est écrit en
 * base — donc aucune migration, et aucune trace d'un geste annulé.
 *
 * Redémarrer `npm run dev` vide cette mémoire : l'annulation devient
 * alors impossible et le message le dit, en renvoyant vers l'outil de
 * correction sous le tableau. C'est une limite assumée, pas un oubli.
 */
const ANNULATIONS = new Map<
  string,
  { avant: EtatFormulaire; apres: EtatFormulaire; expireA: number }
>();

function memoriserAnnulation(
  prospectId: string,
  entree: { avant: EtatFormulaire; apres: EtatFormulaire; expireA: number }
) {
  // Ménage au passage : sans cela la table grossirait sans fin.
  for (const [id, vieille] of ANNULATIONS) {
    if (vieille.expireA <= Date.now()) ANNULATIONS.delete(id);
  }
  ANNULATIONS.set(prospectId, entree);
}

/**
 * Deux dates désignent-elles le MÊME instant ? Postgres renvoie
 * « 2026-07-27T15:04:05.123+00:00 » là où l'on a écrit
 * « 2026-07-27T15:04:05.123Z » : comparer les textes échouerait
 * toujours.
 */
function memeInstant(a: string | null, b: string | null): boolean {
  if (!a || !b) return a === b || (!a && !b);
  return new Date(a).getTime() === new Date(b).getTime();
}

/**
 * « ANNULER » — le retour en arrière EXACT, dans la fenêtre courte.
 * ------------------------------------------------------------------
 * On ne recalcule rien : on repose les six champs tels qu'ils étaient
 * juste avant le clic. Deux garde-fous avant d'écrire : la fenêtre
 * doit être ouverte, et la fiche ne doit pas avoir bougé entre-temps
 * (un envoi automatique, une réponse reçue). Sinon on refuse : mieux
 * vaut un refus clair qu'un compteur remis à une valeur périmée.
 */
export async function annulerFormulaireEnvoye(
  prospectId: string
): Promise<{ ok: boolean; message: string }> {
  const memoire = ANNULATIONS.get(prospectId);
  if (!memoire || memoire.expireA <= Date.now()) {
    ANNULATIONS.delete(prospectId);
    return {
      ok: false,
      message:
        `Le délai d'annulation (${DELAI_ANNULATION_FORMULAIRE_MINUTES} minutes) est passé, ` +
        "ou le serveur a redémarré depuis. Passer par « Corriger un contact par formulaire », sous le tableau.",
    };
  }

  const supabase = creerClientSupabaseAdmin();
  const { data, error: erreurLecture } = await supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .eq("id", prospectId)
    .maybeSingle();
  if (erreurLecture) return { ok: false, message: erreurLecture.message };
  if (!data) return { ok: false, message: "Prospect introuvable." };

  const prospect = data as unknown as ProspectEnvoi;
  const actuel = etatFormulaire(prospect);
  if (
    actuel.nombre_envois !== memoire.apres.nombre_envois ||
    !memeInstant(actuel.contact_formulaire_le, memoire.apres.contact_formulaire_le)
  ) {
    ANNULATIONS.delete(prospectId);
    return {
      ok: false,
      message:
        "La fiche a changé depuis le clic : l'annulation est refusée pour ne rien écraser. " +
        "Vérifier la ligne, puis corriger à la main si besoin.",
    };
  }

  const { error } = await supabase
    .from("artisans_prospects")
    .update(memoire.avant)
    .eq("id", prospectId);
  if (error) return { ok: false, message: error.message };

  ANNULATIONS.delete(prospectId);
  console.log(
    `[prospection formulaire] ${prospect.raison_sociale} — contact ANNULÉ, compteur revenu à ${memoire.avant.nombre_envois}.`
  );
  return {
    ok: true,
    message:
      `Contact annulé pour ${prospect.raison_sociale} : le compteur d'envois ` +
      `revient à ${memoire.avant.nombre_envois} sur ${NOMBRE_ENVOIS_MAXIMUM}.`,
  };
}

/** Ce que l'outil de correction montre AVANT de proposer le retrait. */
export type FicheARetirer = {
  id: string;
  raison_sociale: string;
  ville_nom: string | null;
  siren: string;
  statut: string;
  nombre_envois: number;
  contact_formulaire_le: string;
};

/**
 * L'outil de correction cherche par SIREN — le seul identifiant
 * visible dans le tableau, et le seul qu'on puisse recopier sans se
 * tromper. Il ne modifie RIEN : il montre, et c'est un second clic
 * qui retire.
 */
export async function chercherContactFormulaire(
  siren: string
): Promise<{ ok: boolean; message: string; fiche?: FicheARetirer }> {
  const propre = siren.replace(/\D/g, "");
  if (propre.length !== 9) {
    return { ok: false, message: "Un SIREN compte exactement 9 chiffres." };
  }

  const supabase = creerClientSupabaseAdmin();
  const { data, error } = await supabase
    .from("artisans_prospects")
    .select("id, raison_sociale, ville_nom, siren, statut, nombre_envois, contact_formulaire_le")
    .eq("siren", propre)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) {
    return { ok: false, message: `Aucun prospect avec le SIREN ${propre}.` };
  }

  const fiche = data as unknown as FicheARetirer & {
    contact_formulaire_le: string | null;
  };
  if (!fiche.contact_formulaire_le) {
    return {
      ok: false,
      message: `${fiche.raison_sociale} : aucun contact par formulaire n'est noté sur cette fiche.`,
    };
  }
  return { ok: true, message: "Fiche trouvée.", fiche: fiche as FicheARetirer };
}

/**
 * « RETIRER UN CONTACT ANCIEN » — la correction reconstruite.
 * ------------------------------------------------------------------
 * Passé la fenêtre d'annulation, l'état d'avant n'est plus en
 * mémoire : on ne peut plus restaurer, seulement RECONSTRUIRE ce qui
 * est déductible, et le dire.
 *
 * Déductible : le compteur (un cran de moins), la date du contact
 * (effacée), la relance (recalculée depuis le premier contact).
 * Pas déductible : la date du DERNIER envoi, écrasée à l'époque.
 * Elle n'est donc remise à zéro que si le compteur retombe à 0 —
 * dans ce cas, et dans ce cas seulement, on sait qu'il n'y a plus
 * rien eu.
 *
 * Le statut n'est touché que s'il vaut encore « relance en cours » et
 * que le compteur retombe à zéro : une réponse reçue ou un compte
 * créé depuis ne doivent jamais être effacés par une correction de
 * compteur.
 */
export async function retirerContactFormulaire(
  prospectId: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = creerClientSupabaseAdmin();

  const { data, error: erreurLecture } = await supabase
    .from("artisans_prospects")
    .select(COLONNES_ENVOI)
    .eq("id", prospectId)
    .maybeSingle();
  if (erreurLecture) return { ok: false, message: erreurLecture.message };
  if (!data) return { ok: false, message: "Prospect introuvable." };

  const prospect = data as unknown as ProspectEnvoi;
  if (!prospect.contact_formulaire_le) {
    return {
      ok: false,
      message: "Aucun contact par formulaire n'est noté sur cette fiche.",
    };
  }

  const envoisApres = Math.max(0, (prospect.nombre_envois ?? 0) - 1);
  const aEcrire: Record<string, unknown> = {
    contact_formulaire_le: null,
    nombre_envois: envoisApres,
  };

  if (envoisApres === 0) {
    aEcrire.premier_envoi_le = null;
    aEcrire.dernier_envoi_le = null;
    aEcrire.prochain_envoi_le = null;
    if (prospect.statut === "relance_en_cours") {
      aEcrire.statut = prospect.email ? "non_contacte" : "email_a_trouver";
    }
  } else if (prospect.premier_envoi_le) {
    const prochaine = dateProchaineRelance(
      new Date(prospect.premier_envoi_le),
      envoisApres
    );
    aEcrire.prochain_envoi_le = prochaine ? prochaine.toISOString() : null;
  }

  const { error } = await supabase
    .from("artisans_prospects")
    .update(aEcrire)
    .eq("id", prospectId);
  if (error) return { ok: false, message: error.message };

  ANNULATIONS.delete(prospectId);
  console.log(
    `[prospection formulaire] ${prospect.raison_sociale} — contact RETIRÉ à la main, compteur ${envoisApres}/${NOMBRE_ENVOIS_MAXIMUM}.`
  );
  return {
    ok: true,
    message:
      `Contact par formulaire retiré pour ${prospect.raison_sociale} : ` +
      `le compteur passe à ${envoisApres} sur ${NOMBRE_ENVOIS_MAXIMUM}` +
      (envoisApres === 0
        ? ", et la fiche repart de zéro (dates d'envoi effacées)."
        : ". La relance a été recalculée ; la date du dernier envoi, elle, n'est pas modifiable — elle reste telle quelle."),
  };
}
