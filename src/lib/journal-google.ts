import {
  MOIS_HISTORIQUE_GOOGLE,
  OUTILS_GOOGLE,
  SEUILS_CONSOMMATION_GOOGLE,
  TYPES_APPEL_GOOGLE,
  type OutilGoogle,
  type TypeAppelGoogle,
} from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LE JOURNAL DES APPELS GOOGLE
 * =============================
 * Google Places est la seule dépense variable du projet. Trois outils
 * y passent des appels ; aucun ne laissait de trace exploitable. Sans
 * trace, la question « où en suis-je dans la franchise du mois ? »
 * n'avait qu'une réponse : ouvrir la console Google Cloud et
 * chercher.
 *
 * Ce fichier fait deux choses, et deux seulement :
 *  - ÉCRIRE une ligne par lot d'appels (`journaliserAppelsGoogle`) ;
 *  - RELIRE de quoi afficher la consommation (`lireConsommationGoogle`).
 *
 * DEUX RÈGLES QUI NE SE DISCUTENT PAS
 * -----------------------------------
 * 1. ÉCRIRE NE DOIT JAMAIS FAIRE ÉCHOUER L'OUTIL APPELANT. L'appel
 *    Google est déjà passé et déjà facturé quand on journalise : si
 *    le journal tombe en panne, on le signale dans le terminal et on
 *    continue. Perdre une ligne de comptabilité est ennuyeux ; perdre
 *    le résultat d'appels payés l'est bien davantage.
 * 2. UN ÉCHEC SE JOURNALISE AUSSI. Un appel refusé par Google a
 *    souvent déjà été compté par Google. Ne journaliser que les
 *    succès ferait afficher une consommation plus basse que la
 *    réalité — exactement l'erreur qu'on cherche à éviter.
 */

/** Le nom de la table (fichier supabase/journal-google.sql). */
const TABLE = "journal_appels_google";

export type ResultatAppel = "ok" | "partiel" | "echec";

export type LigneJournal = {
  outil: OutilGoogle;
  typeAppel: TypeAppelGoogle;
  nombreAppels: number;
  resultat: ResultatAppel;
  detail?: string;
};

/* ------------------------------------------------------------------
 * ÉCRIRE
 * ------------------------------------------------------------------ */

/**
 * Enregistre un ou plusieurs lots d'appels. Les lots à ZÉRO appel
 * sont écartés : ils n'apprennent rien sur la facture et rempliraient
 * le journal de lignes vides.
 *
 * Ne lève JAMAIS : voir la règle 1 en tête de fichier.
 */
export async function journaliserAppelsGoogle(
  lignes: LigneJournal[]
): Promise<void> {
  const aEcrire = lignes.filter((l) => l.nombreAppels > 0);
  if (aEcrire.length === 0) return;

  try {
    const supabase = creerClientSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert(
      aEcrire.map((l) => ({
        outil: l.outil,
        type_appel: l.typeAppel,
        nombre_appels: l.nombreAppels,
        resultat: l.resultat,
        // Le tarif du JOUR de l'appel, figé : le passé doit rester
        // lisible avec les prix de l'époque.
        cout_unitaire_euro: TYPES_APPEL_GOOGLE[l.typeAppel].coutUnitaireEuro,
        detail: l.detail ?? null,
      }))
    );
    if (error) throw new Error(error.message);
  } catch (e) {
    const raison = e instanceof Error ? e.message : String(e);
    console.error(
      `[journal-google] APPELS NON JOURNALISÉS (${aEcrire
        .map((l) => `${l.nombreAppels} ${l.typeAppel}`)
        .join(", ")}) : ${raison}. ` +
        "Si la table n'existe pas encore, passer supabase/journal-google.sql."
    );
  }
}

/* ------------------------------------------------------------------
 * LE MOIS CALENDAIRE, À PARIS
 * ------------------------------------------------------------------
 * Google remet les franchises à zéro le 1er du mois. On découpe donc
 * en mois CALENDAIRES, et à l'heure de Paris : l'hébergeur, lui,
 * raisonne en UTC, et le 1er à 1 h du matin ces deux calendriers ne
 * sont pas d'accord.
 * ------------------------------------------------------------------ */

const FORMAT_PARIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partiesParis(date: Date) {
  const p = Object.fromEntries(
    FORMAT_PARIS.formatToParts(date)
      .filter((m) => m.type !== "literal")
      .map((m) => [m.type, Number(m.value)])
  ) as Record<string, number>;
  return {
    annee: p.year,
    mois: p.month,
    jour: p.day,
    heure: p.hour % 24,
    minute: p.minute,
  };
}

/**
 * L'instant précis du 1er à 00 h 00 (heure de Paris), `recul` mois
 * avant le mois en cours. Le décalage horaire est MESURÉ, jamais
 * supposé : +1 h en hiver, +2 h en été, et rien à corriger deux fois
 * par an.
 */
function debutDeMoisParis(reference: Date, recul: number): Date {
  const p = partiesParis(reference);
  const cible = new Date(Date.UTC(p.annee, p.mois - 1 - recul, 1));
  const q = partiesParis(cible);
  const suppose = Date.UTC(q.annee, q.mois - 1, q.jour, 0, 0);
  const decalage =
    Date.UTC(q.annee, q.mois - 1, q.jour, q.heure, q.minute) -
    new Date(cible).setSeconds(0, 0);
  return new Date(suppose - decalage);
}

const NOMS_MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « juillet 2026 », pour un début de mois donné. */
function nomDuMois(debut: Date): string {
  const p = partiesParis(new Date(debut.getTime() + 36e5 * 12));
  return `${NOMS_MOIS[p.mois - 1]} ${p.annee}`;
}

/* ------------------------------------------------------------------
 * RELIRE
 * ------------------------------------------------------------------ */

export type ConsommationType = {
  cle: TypeAppelGoogle;
  label: string;
  palier: string;
  champs: string;
  aQuoiCaSert: string;
  appels: number;
  franchise: number;
  /** Part de la franchise consommée, entre 0 et 1 (peut dépasser 1). */
  part: number;
  niveau: "bon" | "attention" | "critique" | "depasse";
  coutUnitaireEuro: number;
  /** Coût des appels AU-DELÀ de la franchise. Zéro tant qu'elle tient. */
  coutDepassementEuro: number;
  /** Ce que chaque outil a consommé sur ce type, ce mois-ci. */
  parOutil: Array<{ outil: string; label: string; appels: number }>;
};

export type ConsommationMois = {
  debut: string;
  nom: string;
  /** Total par type d'appel, dans l'ordre de TYPES_APPEL_GOOGLE. */
  parType: Array<{ cle: TypeAppelGoogle; label: string; appels: number }>;
  total: number;
};

export type ConsommationGoogle = {
  /** Faux quand la table n'existe pas encore (migration non passée). */
  journalPresent: boolean;
  /** Message d'explication quand la lecture n'a pas pu se faire. */
  probleme: string | null;
  moisEnCours: string;
  /** Date du tout premier appel journalisé — « depuis quand on sait ». */
  premierAppelLe: string | null;
  types: ConsommationType[];
  historique: ConsommationMois[];
  /** Le type le plus proche de sa limite (pour le rappel discret). */
  plusTendu: ConsommationType | null;
  echecs: number;
};

type EnregistrementJournal = {
  appele_le: string;
  outil: string;
  type_appel: string;
  nombre_appels: number;
  resultat: string;
};

const CLES_TYPES = Object.keys(TYPES_APPEL_GOOGLE) as TypeAppelGoogle[];

function niveauPour(part: number): ConsommationType["niveau"] {
  if (part >= 1) return "depasse";
  if (part >= SEUILS_CONSOMMATION_GOOGLE.critique) return "critique";
  if (part >= SEUILS_CONSOMMATION_GOOGLE.attention) return "attention";
  return "bon";
}

/** Un état vide mais COHÉRENT : la page s'affiche, à zéro, et le dit. */
function consommationVide(
  probleme: string | null,
  journalPresent: boolean,
  moisEnCours: string
): ConsommationGoogle {
  const types = CLES_TYPES.map((cle) => construireType(cle, [], new Map()));
  return {
    journalPresent,
    probleme,
    moisEnCours,
    premierAppelLe: null,
    types,
    historique: [],
    plusTendu: null,
    echecs: 0,
  };
}

function construireType(
  cle: TypeAppelGoogle,
  lignesDuMois: EnregistrementJournal[],
  labelsOutils: Map<string, string>
): ConsommationType {
  const reglage = TYPES_APPEL_GOOGLE[cle];
  const miennes = lignesDuMois.filter((l) => l.type_appel === cle);
  const appels = miennes.reduce((somme, l) => somme + (l.nombre_appels ?? 0), 0);

  const parOutil = new Map<string, number>();
  for (const ligne of miennes) {
    parOutil.set(ligne.outil, (parOutil.get(ligne.outil) ?? 0) + ligne.nombre_appels);
  }

  const franchise = reglage.franchiseMensuelle;
  const part = franchise > 0 ? appels / franchise : 0;

  return {
    cle,
    label: reglage.label,
    palier: reglage.palier,
    champs: reglage.champs,
    aQuoiCaSert: reglage.aQuoiCaSert,
    appels,
    franchise,
    part,
    niveau: niveauPour(part),
    coutUnitaireEuro: reglage.coutUnitaireEuro,
    coutDepassementEuro:
      Math.max(0, appels - franchise) * reglage.coutUnitaireEuro,
    parOutil: [...parOutil.entries()]
      .map(([outil, nombre]) => ({
        outil,
        label: labelsOutils.get(outil) ?? outil,
        appels: nombre,
      }))
      .sort((a, b) => b.appels - a.appels),
  };
}

/**
 * TOUT CE QU'IL FAUT POUR AFFICHER LA CONSOMMATION — en une lecture.
 * On lit les six derniers mois d'un coup et on trie en mémoire : le
 * journal reste petit (quelques lignes par exécution), et une seule
 * requête vaut mieux que sept.
 *
 * Ne lève JAMAIS : une table absente ou une base injoignable rend un
 * état à zéro accompagné de son explication, jamais une page en
 * erreur.
 */
export async function lireConsommationGoogle(): Promise<ConsommationGoogle> {
  const maintenant = new Date();
  const debutMoisCourant = debutDeMoisParis(maintenant, 0);
  const moisEnCours = nomDuMois(debutMoisCourant);
  const debutHistorique = debutDeMoisParis(
    maintenant,
    MOIS_HISTORIQUE_GOOGLE - 1
  );

  let lignes: EnregistrementJournal[];
  try {
    const supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("appele_le, outil, type_appel, nombre_appels, resultat")
      .gte("appele_le", debutHistorique.toISOString())
      .order("appele_le", { ascending: true });

    if (error) {
      const absente =
        error.message.includes(TABLE) ||
        error.message.toLowerCase().includes("does not exist");
      return consommationVide(
        absente
          ? "La table du journal n'existe pas encore : passer supabase/journal-google.sql dans l'éditeur SQL de Supabase. En attendant, tous les compteurs restent à zéro."
          : `Lecture impossible : ${error.message}`,
        !absente,
        moisEnCours
      );
    }
    lignes = (data ?? []) as unknown as EnregistrementJournal[];
  } catch (e) {
    return consommationVide(
      `Base injoignable : ${e instanceof Error ? e.message : String(e)}`,
      false,
      moisEnCours
    );
  }

  // DEPUIS QUAND CE JOURNAL SAIT QUELQUE CHOSE. Cherché à part, sans
  // borne de date : la ligne la plus ancienne peut être plus vieille
  // que les six mois affichés, et c'est justement elle qui dit à
  // partir de quand les chiffres ci-dessous ont un sens.
  let premierAppelLe: string | null = null;
  try {
    const supabase = creerClientSupabaseAdmin();
    const { data } = await supabase
      .from(TABLE)
      .select("appele_le")
      .order("appele_le", { ascending: true })
      .limit(1)
      .maybeSingle();
    premierAppelLe = (data as { appele_le?: string } | null)?.appele_le ?? null;
  } catch {
    // Sans importance : la page se contente alors de ne pas dater le
    // début du journal.
  }

  const labelsOutils = new Map(
    Object.entries(OUTILS_GOOGLE).map(([cle, o]) => [cle, o.label])
  );

  const lignesDuMois = lignes.filter(
    (l) => new Date(l.appele_le) >= debutMoisCourant
  );
  const types = CLES_TYPES.map((cle) =>
    construireType(cle, lignesDuMois, labelsOutils)
  );

  // L'historique : du plus ancien au plus récent, pour lire la courbe
  // dans le sens du temps.
  const historique: ConsommationMois[] = [];
  for (let recul = MOIS_HISTORIQUE_GOOGLE - 1; recul >= 0; recul -= 1) {
    const debut = debutDeMoisParis(maintenant, recul);
    const fin = debutDeMoisParis(maintenant, recul - 1);
    const dedans = lignes.filter((l) => {
      const quand = new Date(l.appele_le);
      return quand >= debut && quand < fin;
    });
    const parType = CLES_TYPES.map((cle) => ({
      cle,
      label: TYPES_APPEL_GOOGLE[cle].label,
      appels: dedans
        .filter((l) => l.type_appel === cle)
        .reduce((somme, l) => somme + (l.nombre_appels ?? 0), 0),
    }));
    historique.push({
      debut: debut.toISOString(),
      nom: nomDuMois(debut),
      parType,
      total: parType.reduce((somme, t) => somme + t.appels, 0),
    });
  }

  // Le plus tendu : celui dont la PART consommée est la plus haute —
  // jamais celui qui affiche le plus gros nombre. 900 appels sur
  // 10 000 inquiètent moins que 900 sur 1 000.
  const plusTendu =
    types.length > 0
      ? types.reduce((pire, t) => (t.part > pire.part ? t : pire))
      : null;

  return {
    journalPresent: true,
    probleme: null,
    moisEnCours,
    premierAppelLe,
    types,
    historique,
    plusTendu,
    echecs: lignesDuMois.filter((l) => l.resultat === "echec").length,
  };
}
