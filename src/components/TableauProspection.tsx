"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CODES_NAF_BATIMENT,
  DELAI_ANNULATION_FORMULAIRE_MINUTES,
  DELAIS_RELANCE_JOURS,
  FORMES_JURIDIQUES,
  METIERS,
  NOMBRE_ENVOIS_MAXIMUM,
  PLAFOND_QUOTIDIEN_PAR_SEMAINE,
  STATUTS_PROSPECTION,
} from "@/config/roswel";
import { IconeEnveloppe, IconeLienExterne } from "@/components/Icones";
import {
  BadgeChoix,
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_CHAMP_ADMIN,
  CLASSE_CHAMP_COMPACT,
  CLASSE_ETIQUETTE,
  MenuAdmin,
} from "@/components/champs-admin";
import { ChampVille, type VilleChoisie } from "@/components/ChampVille";
import {
  ApercuEnvoiProspection,
  type Apercu as ApercuEnvoi,
} from "@/components/ApercuEnvoiProspection";
import type { IndicateursEnvoi } from "@/lib/prospection-quota";
import type { ConsommationGoogle } from "@/lib/journal-google";

/**
 * TABLEAU DE PROSPECTION (admin)
 * ------------------------------
 * Une liste pour DÉMARCHER. Elle répond à trois questions, dans cet
 * ordre : puis-je encore envoyer aujourd'hui ? à qui ? et où en
 * suis-je avec lui ?
 *
 * LE MOTEUR D'ENVOI N'EXISTE PAS ENCORE. Tout ce qui en dépend est
 * néanmoins construit et affiché — indicateurs à zéro, cases à
 * cocher, compteur d'envois, date de relance. Le jour où le moteur
 * arrive, il remplit des colonnes qui sont déjà là, plutôt que
 * d'imposer une nouvelle refonte.
 *
 * CE QUI N'EST PAS ICI, ET POURQUOI
 * ---------------------------------
 * Le MÉTIER s'affiche mais ne se modifie plus : il est rempli par la
 * recherche Google quand elle peut trancher, et l'artisan choisira le
 * sien à l'inscription. Le STATUT non plus ne se modifie pas : il
 * suit le travail réel (adresse trouvée, e-mail parti, rebond,
 * désinscription, compte créé).
 *
 * Seule l'adresse e-mail reste saisissable : c'est la seule donnée
 * qu'on récupère parfois à la main.
 *
 * ⚠️ RÈGLE À NE PAS ENFREINDRE ICI : la liste affichée n'est JAMAIS
 * recopiée dans un état React. Voir `corrections` plus bas — une copie
 * fige la liste au premier affichage et les nouvelles lignes
 * n'apparaissent plus jamais.
 */

export type LigneProspect = {
  id: string;
  raison_sociale: string;
  nom_commercial: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  siren: string;
  date_creation_entreprise: string | null;
  email: string | null;
  site_internet: string | null;
  lien_instagram: string | null;
  metiers: string[];
  statut: string;
  nombre_envois: number;
  premier_envoi_le: string | null;
  dernier_envoi_le: string | null;
  prochain_envoi_le: string | null;
  /** Date du contact pris par le formulaire du site de l'artisan. */
  contact_formulaire_le: string | null;
  notes_admin: string | null;
  /** Encore en base, plus affichés. */
  code_naf?: string | null;
  metier_confirme?: boolean;
};

export type CommuneProspect = {
  code_insee: string;
  nom: string;
  nombre: number;
};

/**
 * LA COULEUR DU RAPPEL DE QUOTA GOOGLE. Gris tant qu'on est loin de
 * la limite : un rappel qui crie tout le temps ne se lit plus.
 */
const CLASSE_NIVEAU_GOOGLE: Record<string, string> = {
  bon: "text-encre-douce",
  attention: "text-alerte font-semibold",
  critique: "text-erreur font-semibold",
  depasse: "text-erreur font-semibold",
};

/** La fiche que l'outil de correction montre avant de retirer. */
type FicheRetrait = {
  id: string;
  raison_sociale: string;
  ville_nom: string | null;
  siren: string;
  statut: string;
  nombre_envois: number;
  contact_formulaire_le: string;
};

const LIBELLE_METIER = new Map(METIERS.map(({ slug, label }) => [slug, label]));

/**
 * LA COULEUR DES STATUTS
 * ----------------------
 * Un seul endroit fait le lien entre la couleur décidée dans
 * src/config/roswel.ts (« vert », « bleu »…) et les classes du site.
 * « orange sur fond sombre » : le seul statut qui demande une action
 * de MA part — il doit sauter aux yeux sans crier au drame.
 */
const CLASSES_STATUT: Record<string, string> = {
  vert: "border-succes/40 bg-succes/10 text-succes",
  bleu: "border-pastille-recommande/40 bg-pastille-recommande/10 text-pastille-recommande",
  orange_sombre: "border-encre bg-encre text-alerte",
  rouge: "border-erreur/40 bg-erreur/10 text-erreur",
  gris: "border-bordure bg-fond-doux text-encre-douce",
};

/** Le code d'activité s'écrit « 4322A » ou « 43.22A » : on compare sans point. */
function sansPonctuation(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * LE MÉTIER À AFFICHER — ou rien du tout
 * ---------------------------------------
 * L'annuaire ne connaît pas le métier : il connaît une CASE
 * ADMINISTRATIVE. Certaines ne désignent qu'un métier (43.21A →
 * électricien, 43.32A → menuisier bois, 43.99C → maçon) ; d'autres en
 * couvrent plusieurs (43.22A → plombier OU chauffagiste, 43.34Z →
 * peintre OU vitrier).
 *
 * Afficher « Plombier · Chauffagiste » parce que la case est partagée,
 * c'est présenter une SUPPOSITION comme un fait. Tant que Google n'a
 * pas tranché, la colonne montre donc « — ».
 *
 * La colonne `metiers` reste remplie en base dans les deux cas : c'est
 * seulement l'affichage qui se tait.
 */
function metierAffiche(ligne: LigneProspect): string | null {
  const enClair = (slugs: string[]) =>
    slugs.map((m) => LIBELLE_METIER.get(m) ?? m).join(" · ");

  // Google a tranché : on affiche ce qui est enregistré.
  if (ligne.metier_confirme === true) {
    return enClair(ligne.metiers ?? []) || null;
  }

  const entree = ligne.code_naf
    ? CODES_NAF_BATIMENT.find(
        (n) => sansPonctuation(n.code) === sansPonctuation(ligne.code_naf ?? "")
      )
    : undefined;

  // Une case administrative = un seul métier : aucune ambiguïté.
  if (entree && entree.metiers.length === 1) return enClair(entree.metiers);

  return null;
}

/** Nombre de semaines de montée en charge prévues (6). */
const SEMAINES_MONTEE = PLAFOND_QUOTIDIEN_PAR_SEMAINE.paliers.length;

/**
 * À partir de combien de jours la relance prévue s'affiche. Au-delà,
 * elle n'apprend rien et encombre la colonne.
 */
const JOURS_RELANCE_VISIBLE = 7;

/** Une note d'avertissement laissée par la collecte demande un arbitrage. */
function aUnAvertissement(notes: string | null): boolean {
  return typeof notes === "string" && notes.includes("⚠");
}

/**
 * L'ancienneté, en années et rien d'autre : « 18 ». Une colonne de
 * chiffres se lit d'un coup d'œil, une colonne de phrases non.
 * « 0 » = moins d'un an — une entreprise toute jeune, pas une donnée
 * manquante ; l'absence de date, elle, s'écrit « — ».
 */
function ancienneteEnAnnees(dateCreation: string | null): string {
  if (!dateCreation) return "—";
  const millisecondes = Date.now() - new Date(dateCreation).getTime();
  if (Number.isNaN(millisecondes)) return "—";
  const annees = Math.floor(millisecondes / (365.25 * 24 * 3600 * 1000));
  return String(Math.max(0, annees));
}

/**
 * Une date courte, calculée en UTC. Le serveur tourne en UTC et le
 * navigateur à l'heure de Paris : passer par le fuseau local ferait
 * afficher deux dates différentes pour la même donnée, et React
 * signalerait une incohérence au chargement.
 */
function dateCourte(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const jour = String(date.getUTCDate()).padStart(2, "0");
  const mois = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${jour}/${mois}/${date.getUTCFullYear()}`;
}

/**
 * Le jour et le mois seuls : « 12/07 ». Même calcul en UTC que
 * `dateCourte`, pour la même raison. L'année est inutile ici : ce
 * repère accompagne une ligne qu'on est en train de travailler.
 */
function dateJourMois(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const jour = String(date.getUTCDate()).padStart(2, "0");
  const mois = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${jour}/${mois}`;
}

/** Le domaine seul : « https://www.plomberie-durand.fr/contact » → « plomberie-durand.fr ». */
function domaineSeul(adresse: string): string {
  try {
    return new URL(adresse).hostname.replace(/^www\./i, "");
  } catch {
    return adresse.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0];
  }
}

/** « https://www.instagram.com/roswel.fr/ » → « @roswel.fr ». */
function compteInstagram(adresse: string): string {
  const chemin = adresse
    .replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, "")
    .split(/[/?#]/)[0]
    .trim();
  return chemin ? `@${chemin}` : "Instagram";
}

/* ------------------------------------------------------------------
 * LES NOMS
 * ------------------------------------------------------------------ */

function contientFormeJuridique(texte: string): boolean {
  const mots = texte
    .toUpperCase()
    .replace(/\./g, "")
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  return mots.some((mot) => (FORMES_JURIDIQUES as readonly string[]).includes(mot));
}

/**
 * L'annuaire ne sépare pas la personne de l'entreprise : il renvoie
 * un seul nom. Deux formes reviennent :
 *   « MAVIA DIAKITE (ASSAMARI) »  → une personne, puis son enseigne
 *   « CLADINVEST CONSTRUCTION »   → une société, sans personne
 *
 * RÈGLE : on ne sépare que sur un signal CERTAIN — la parenthèse d'un
 * entrepreneur individuel. Mieux vaut ne rien afficher qu'un nom de
 * personne inventé à partir d'une dénomination.
 */
export function separerNoms(
  raisonSociale: string,
  nomCommercial: string | null
): { artisan: string | null; societe: string; enseigne: string | null } {
  const brut = (raisonSociale ?? "").trim();
  const parenthese = brut.match(/^(.+?)\s*\(([^()]+)\)\s*$/);

  let artisan: string | null = null;
  let societe = brut;
  let enseigne: string | null = null;

  if (parenthese) {
    const avant = parenthese[1].trim();
    const dedans = parenthese[2].trim();
    if (contientFormeJuridique(avant)) {
      // « BATI SARL (LES COMPAGNONS) » : deux noms d'entreprise.
      societe = avant;
      enseigne = dedans;
    } else {
      // « MAVIA DIAKITE (ASSAMARI) » : la personne, puis son enseigne.
      artisan = avant;
      societe = dedans;
    }
  }

  const commercial = (nomCommercial ?? "").trim();
  if (
    commercial &&
    commercial !== societe &&
    commercial !== artisan &&
    commercial !== enseigne
  ) {
    enseigne = enseigne ?? commercial;
  }

  return { artisan, societe, enseigne };
}

/** Comparaison « à l'œil » : sans accents, sans ponctuation, sans casse. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * LE NOM À AFFICHER, EN UNE SEULE LIGNE
 * -------------------------------------
 * Si les deux noms se ressemblent (l'un contient l'autre une fois
 * normalisés), on ne garde que le PLUS LONG — c'est celui qui porte
 * l'information. S'ils sont vraiment différents, la raison sociale
 * reste le nom principal et l'enseigne descend sur la ligne grise.
 */
function nomAffiche(
  societe: string,
  enseigne: string | null
): { principal: string; secondaire: string | null } {
  if (!enseigne) return { principal: societe, secondaire: null };

  const a = normaliser(societe);
  const b = normaliser(enseigne);
  if (a === "" || b === "" || a.includes(b) || b.includes(a)) {
    return {
      principal: enseigne.length > societe.length ? enseigne : societe,
      secondaire: null,
    };
  }
  return { principal: societe, secondaire: enseigne };
}

/* ------------------------------------------------------------------
 * L'ENVOI GROUPÉ : qui peut être coché
 * ------------------------------------------------------------------ */

/**
 * Pourquoi cette ligne ne peut PAS être sélectionnée — ou null si
 * elle le peut. Le texte sert d'infobulle sur la case grisée : une
 * case désactivée sans explication est une case suspecte.
 */
function raisonNonSelectionnable(ligne: LigneProspect): string | null {
  if (ligne.statut === "ne_plus_contacter") {
    return "Désinscrit ou refus explicite : on ne le recontacte jamais.";
  }
  if (ligne.statut === "rebond") {
    return "L'adresse a rebondi : continuer abîmerait la réputation de l'expéditeur.";
  }
  if (!ligne.email) return "Aucune adresse e-mail connue.";
  if (ligne.nombre_envois >= NOMBRE_ENVOIS_MAXIMUM) {
    return `${NOMBRE_ENVOIS_MAXIMUM} messages déjà envoyés : la séquence est terminée.`;
  }
  return null;
}

/**
 * LA RELANCE PRÉVUE, quand elle approche.
 * J+7, J+14 puis J+30 après le PREMIER envoi (DELAIS_RELANCE_JOURS).
 * On affiche `prochain_envoi_le` s'il est déjà calculé en base ;
 * sinon on le déduit. Au-delà d'une semaine d'avance, on n'affiche
 * rien : ça n'apprend rien et ça encombre.
 */
function relanceProche(
  ligne: LigneProspect
): { date: string; enRetard: boolean } | null {
  const envois = ligne.nombre_envois ?? 0;
  if (envois < 1 || envois >= NOMBRE_ENVOIS_MAXIMUM) return null;

  let quand: Date | null = null;
  if (ligne.prochain_envoi_le) {
    quand = new Date(ligne.prochain_envoi_le);
  } else if (ligne.premier_envoi_le) {
    const jours = DELAIS_RELANCE_JOURS[envois - 1];
    if (jours === undefined) return null;
    quand = new Date(
      new Date(ligne.premier_envoi_le).getTime() + jours * 24 * 3600 * 1000
    );
  }
  if (!quand || Number.isNaN(quand.getTime())) return null;

  const restant = quand.getTime() - Date.now();
  if (restant > JOURS_RELANCE_VISIBLE * 24 * 3600 * 1000) return null;
  return { date: quand.toISOString(), enRetard: restant <= 0 };
}

/** Les compteurs renvoyés par la route de collecte, pour une activité. */
type CompteursCollecte = {
  examinees: number;
  creees: number;
  rattachements: number;
  misesAJour: number;
  ignorees: number;
  erreurs: number;
};

/**
 * LE MENU « MÉTIER À COLLECTER »
 * ------------------------------
 * Il suit le DÉCOUPAGE RÉEL de l'annuaire, mais en français courant.
 * Impossible de faire autrement : l'annuaire ne sait pas séparer un
 * plombier d'un chauffagiste (même case), ni un menuisier bois d'un
 * menuisier métallique (deux cases distinctes).
 *
 * Les libellés viennent de CODES_NAF_BATIMENT.menu (src/config/
 * roswel.ts) — jamais du vocabulaire de l'INSEE.
 *
 * Les codes MIS DE CÔTÉ (`collecteSuspendue`) n'ont pas de badge : on
 * ne va plus en chercher de nouveaux. Ils restent connus par ailleurs,
 * pour lire le métier des prospects déjà collectés sous ce code.
 */
const ACTIVITES_A_COLLECTER = CODES_NAF_BATIMENT.filter(
  (n) => n.collecteSuspendue !== true
).map(({ code, menu }) => ({ code, menu }));

export function TableauProspection({
  lignes,
  communes,
  indicateurs,
  filtreCommune,
  nombreSansGoogle,
  nombreAvecSite,
  lienBase,
  page,
  taillePage,
  totalFiltre,
  consommationGoogle = null,
  apercu = false,
  apercuFictif = null,
}: {
  lignes: LigneProspect[];
  /** Les communes qui ONT DÉJÀ des prospects (menu de filtre + compteur). */
  communes: CommuneProspect[];
  indicateurs: IndicateursEnvoi;
  /** Code INSEE de la commune filtrée, ou « toutes ». */
  filtreCommune: string;
  /** Prospects sans fiche Google dans le filtre (périmètre du bouton). */
  nombreSansGoogle: number;
  /** Prospects sans adresse mais avec un site (périmètre du bouton). */
  nombreAvecSite: number;
  /** L'adresse de la page, pour les liens de filtre et de pagination. */
  lienBase: string;
  page: number;
  taillePage: number;
  /** Le nombre TOTAL de lignes correspondant aux filtres courants. */
  totalFiltre: number;
  /** Où en est la consommation Google du mois (null sur l'aperçu). */
  consommationGoogle?: ConsommationGoogle | null;
  /** Aperçu : les modifications restent à l'écran, rien n'est enregistré. */
  apercu?: boolean;
  /** Messages fictifs de l'écran d'envoi (page de démonstration). */
  apercuFictif?: ApercuEnvoi | null;
}) {
  const router = useRouter();

  /**
   * LES CORRECTIONS EN COURS — et RIEN d'autre.
   * -------------------------------------------
   * On garde ici uniquement ce que l'admin vient de modifier, par
   * identifiant. La LISTE, elle, reste celle du serveur : à chaque
   * rafraîchissement (collecte, filtre, page) les nouvelles lignes
   * apparaissent aussitôt.
   *
   * La toute première version recopiait `lignes` dans un `useState`.
   * Or la valeur passée à `useState` ne sert QU'AU PREMIER rendu :
   * après une collecte, le compteur montait bien à 32 mais le tableau
   * restait bloqué sur les 12 lignes du premier affichage. Ne jamais
   * recopier une donnée du serveur dans un état React.
   */
  const [corrections, setCorrections] = useState<
    Record<string, Partial<LigneProspect>>
  >({});
  const affichees = lignes.map((l) => ({ ...l, ...(corrections[l.id] ?? {}) }));

  const [enregistrees, setEnregistrees] = useState<Record<string, boolean>>({});
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  // La sélection pour l'ENVOI GROUPÉ, puis l'écran d'aperçu qui
  // montre les messages avant que quoi que ce soit ne parte.
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [apercuOuvert, setApercuOuvert] = useState(false);

  // Le marquage « contacté par formulaire », ligne par ligne.
  const [formulaireEnCours, setFormulaireEnCours] = useState<string | null>(null);
  const [annulationEnCours, setAnnulationEnCours] = useState<string | null>(null);
  /**
   * Les contacts notés À L'INSTANT, encore annulables. On n'y garde
   * AUCUNE heure : c'est le minuteur ouvert par le clic qui retire
   * l'entrée quand le délai tombe. Un affichage qui lirait l'horloge
   * à chaque rendu serait imprévisible — et la table, vide au premier
   * rendu, reste identique côté serveur et côté navigateur.
   */
  const [annulables, setAnnulables] = useState<Record<string, true>>({});

  // L'outil de correction d'un contact ancien, sous le tableau.
  const [sirenRetrait, setSirenRetrait] = useState("");
  const [retraitEnCours, setRetraitEnCours] = useState(false);
  const [ficheRetrait, setFicheRetrait] = useState<FicheRetrait | null>(null);
  const [resultatRetrait, setResultatRetrait] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // La barre de collecte — une ACTIVITÉ du menu, jamais un code visible.
  const [activites, setActivites] = useState<string[]>([
    ACTIVITES_A_COLLECTER[0].code,
  ]);
  const [commune, setCommune] = useState<VilleChoisie | null>(null);
  const [collecteEnCours, setCollecteEnCours] = useState(false);
  const [resultatCollecte, setResultatCollecte] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // La recherche des fiches Google (le seul outil qui coûte de l'argent)
  const [googleEnCours, setGoogleEnCours] = useState(false);
  const [resultatGoogle, setResultatGoogle] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // La recherche d'adresses e-mail (par petits lots, pour voir avancer)
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [avancement, setAvancement] = useState(0);
  const [resultatRecherche, setResultatRecherche] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  /** Combien de prospects sont déjà collectés dans chaque commune. */
  const dejaCollectes = new Map(
    communes.map(({ code_insee, nombre }) => [code_insee, nombre])
  );
  const collectesIci = commune
    ? (dejaCollectes.get(commune.code_insee) ?? 0)
    : null;

  /** Une adresse de page qui garde les filtres en cours. */
  function lienAvec(remplacements: Record<string, string>) {
    const parametres = new URLSearchParams({
      commune: filtreCommune,
      page: String(page),
      ...remplacements,
    });
    // Une valeur vide veut dire « retirer ce filtre ».
    for (const [cle, valeur] of [...parametres.entries()]) {
      if (valeur === "") parametres.delete(cle);
    }
    return `${lienBase}?${parametres}`;
  }

  /** Envoie une modification et retient la valeur telle qu'enregistrée. */
  async function modifier(id: string, champs: Record<string, unknown>) {
    // Affichage immédiat : l'admin ne doit pas attendre le réseau.
    setCorrections((c) => ({ ...c, [id]: { ...(c[id] ?? {}), ...champs } }));
    setErreurs((e) => ({ ...e, [id]: "" }));

    if (apercu) {
      confirmer(id);
      return;
    }

    try {
      const reponse = await fetch("/api/admin/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: id, champs }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message: string;
        ligne?: Partial<LigneProspect>;
      };
      if (!donnees.ok) {
        setErreurs((e) => ({ ...e, [id]: donnees.message }));
        return;
      }
      if (donnees.ligne) {
        // La ligne telle qu'elle est VRAIMENT en base (le statut a pu
        // changer tout seul).
        const recalee = donnees.ligne;
        setCorrections((c) => ({ ...c, [id]: { ...(c[id] ?? {}), ...recalee } }));
      }
      confirmer(id);
    } catch {
      setErreurs((e) => ({
        ...e,
        [id]: "Pas de réponse du serveur. Vérifier que `npm run dev` tourne, puis réessayer.",
      }));
    }
  }

  /** Le « ✓ » discret, qui s'efface tout seul. */
  function confirmer(id: string) {
    setEnregistrees((e) => ({ ...e, [id]: true }));
    setTimeout(() => setEnregistrees((e) => ({ ...e, [id]: false })), 1800);
  }

  /**
   * OUVRIR LA FENÊTRE D'ANNULATION, et la refermer toute seule.
   * Le minuteur est armé DANS LE GESTIONNAIRE DE CLIC, pas dans un
   * effet : c'est le clic qui ouvre la fenêtre, c'est donc à lui de
   * programmer sa fermeture. On raisonne en DURÉE, jamais en heure
   * absolue : rien à comparer, donc rien qui puisse dériver entre
   * l'horloge du serveur et celle du navigateur.
   */
  function ouvrirAnnulation(id: string, dureeSecondes: number) {
    setAnnulables((a) => ({ ...a, [id]: true }));
    setTimeout(() => fermerAnnulation(id), dureeSecondes * 1000);
  }

  function fermerAnnulation(id: string) {
    setAnnulables((a) => {
      if (!(id in a)) return a;
      const restantes = { ...a };
      delete restantes[id];
      return restantes;
    });
  }

  /**
   * « CONTACTÉ PAR FORMULAIRE » — depuis la ligne, en un clic.
   * Le serveur fait le reste : compteur d'envois, date du premier
   * contact, relance suivante. Hors quota (voir
   * marquerFormulaireEnvoye dans src/lib/prospection-envoi.ts).
   *
   * Ce clic AVANCE LA SÉQUENCE : fait par erreur sur la mauvaise
   * ligne, il fausse un compteur. Le serveur garde donc l'état
   * d'avant en mémoire quelques minutes, et la ligne propose
   * « Annuler » pendant tout ce temps.
   */
  async function marquerFormulaire(id: string) {
    if (formulaireEnCours) return;
    setFormulaireEnCours(id);
    setErreurs((e) => ({ ...e, [id]: "" }));

    const duree = DELAI_ANNULATION_FORMULAIRE_MINUTES * 60;

    if (apercu) {
      // Sans base de données, on simule ce que le serveur écrirait :
      // la page de démonstration doit montrer les trois états.
      const ligne = affichees.find((l) => l.id === id);
      setCorrections((c) => ({
        ...c,
        [id]: {
          ...(c[id] ?? {}),
          contact_formulaire_le: new Date().toISOString(),
          nombre_envois: (ligne?.nombre_envois ?? 0) + 1,
        },
      }));
      ouvrirAnnulation(id, duree);
      confirmer(id);
      setFormulaireEnCours(null);
      return;
    }

    try {
      const reponse = await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulaireEnvoye: id }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message: string;
        annulableSecondes?: number;
      };
      if (!donnees.ok) {
        setErreurs((e) => ({ ...e, [id]: donnees.message }));
      } else {
        ouvrirAnnulation(id, donnees.annulableSecondes ?? duree);
        confirmer(id);
        router.refresh();
      }
    } catch {
      setErreurs((e) => ({
        ...e,
        [id]: "Pas de réponse du serveur. Le contact n'a pas été noté.",
      }));
    }
    setFormulaireEnCours(null);
  }

  /**
   * « ANNULER » — le clic d'à côté, défait. Le serveur repose les six
   * champs tels qu'ils étaient : compteur, dates d'envoi, date de
   * relance et statut. Rien n'est recalculé, donc rien ne dérive.
   */
  async function annulerFormulaire(id: string) {
    if (annulationEnCours) return;
    setAnnulationEnCours(id);
    setErreurs((e) => ({ ...e, [id]: "" }));

    if (apercu) {
      setCorrections((c) => {
        const ligne = { ...(c[id] ?? {}) };
        delete ligne.contact_formulaire_le;
        delete ligne.nombre_envois;
        return { ...c, [id]: ligne };
      });
      fermerAnnulation(id);
      setAnnulationEnCours(null);
      return;
    }

    try {
      const reponse = await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annulerFormulaire: id }),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message: string };
      if (!donnees.ok) {
        setErreurs((e) => ({ ...e, [id]: donnees.message }));
        fermerAnnulation(id);
      } else {
        fermerAnnulation(id);
        router.refresh();
      }
    } catch {
      setErreurs((e) => ({
        ...e,
        [id]: "Pas de réponse du serveur. Le contact n'a pas été annulé.",
      }));
    }
    setAnnulationEnCours(null);
  }

  /**
   * L'OUTIL DE CORRECTION D'UN CONTACT ANCIEN — en deux temps.
   * On CHERCHE d'abord (aucune écriture), on lit ce qu'on va toucher,
   * et c'est un second clic qui retire. Un outil rare et destructeur
   * ne doit jamais se déclencher sur une frappe.
   */
  async function chercherPourRetrait() {
    const siren = sirenRetrait.replace(/\D/g, "");
    if (retraitEnCours || siren.length !== 9) return;
    setRetraitEnCours(true);
    setFicheRetrait(null);
    setResultatRetrait(null);

    if (apercu) {
      setResultatRetrait({
        ok: false,
        message: "Aperçu : aucune fiche n'est lue depuis cette page.",
      });
      setRetraitEnCours(false);
      return;
    }

    try {
      const reponse = await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chercherFormulaire: siren }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message: string;
        fiche?: FicheRetrait;
      };
      if (donnees.ok && donnees.fiche) setFicheRetrait(donnees.fiche);
      else setResultatRetrait({ ok: false, message: donnees.message });
    } catch {
      setResultatRetrait({
        ok: false,
        message: "Pas de réponse du serveur. Vérifier que `npm run dev` tourne.",
      });
    }
    setRetraitEnCours(false);
  }

  async function retirerLeContact() {
    if (retraitEnCours || !ficheRetrait) return;
    setRetraitEnCours(true);

    try {
      const reponse = await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retirerFormulaire: ficheRetrait.id }),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message: string };
      setResultatRetrait(donnees);
      if (donnees.ok) {
        setFicheRetrait(null);
        setSirenRetrait("");
        router.refresh();
      }
    } catch {
      setResultatRetrait({
        ok: false,
        message: "Pas de réponse du serveur. Le contact n'a pas été retiré.",
      });
    }
    setRetraitEnCours(false);
  }

  /** Un badge de métier s'allume ou s'éteint. */
  function basculerActivite(code: string) {
    setActivites((choisies) =>
      choisies.includes(code)
        ? choisies.filter((c) => c !== code)
        : [...choisies, code]
    );
  }

  /**
   * LA COLLECTE — un ou plusieurs métiers, une commune.
   * ---------------------------------------------------
   * Une case de l'annuaire = UN appel : plusieurs métiers, ce sont
   * donc plusieurs collectes, ENCHAÎNÉES l'une après l'autre. On les
   * fait à la suite (jamais en parallèle) : l'annuaire public limite
   * le débit, et six appels simultanés se font refouler.
   *
   * Le compte rendu est UNIQUE : c'est le total qui m'intéresse, pas
   * six messages à recoller à la main.
   */
  async function collecter() {
    if (collecteEnCours || !commune || activites.length === 0) return;
    setCollecteEnCours(true);
    setResultatCollecte(null);

    const nomCommune = commune.nom;
    const libelles = ACTIVITES_A_COLLECTER.filter((a) =>
      activites.includes(a.code)
    ).map((a) => a.menu);

    if (apercu) {
      setResultatCollecte({
        ok: true,
        message: "Aperçu : aucune collecte n'est lancée depuis cette page.",
      });
      setCollecteEnCours(false);
      return;
    }

    const total: CompteursCollecte = {
      examinees: 0,
      creees: 0,
      rattachements: 0,
      misesAJour: 0,
      ignorees: 0,
      erreurs: 0,
    };
    const echecs: string[] = [];
    let faites = 0;

    for (const code of activites) {
      const libelle =
        ACTIVITES_A_COLLECTER.find((a) => a.code === code)?.menu ?? code;
      try {
        const reponse = await fetch("/api/admin/collecte-sirene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codeNaf: code,
            codeInsee: commune.code_insee,
          }),
        });
        const donnees = (await reponse.json()) as {
          ok: boolean;
          message: string;
          compteurs?: CompteursCollecte;
        };
        if (donnees.compteurs) {
          for (const cle of Object.keys(total) as Array<keyof CompteursCollecte>) {
            total[cle] += donnees.compteurs[cle] ?? 0;
          }
        }
        if (donnees.ok) faites += 1;
        else echecs.push(`${libelle} : ${donnees.message}`);
      } catch {
        echecs.push(
          `${libelle} : pas de réponse (vérifier que \`npm run dev\` tourne)`
        );
      }
      // Le tableau se remplit au fur et à mesure, sans attendre la fin.
      router.refresh();
    }

    const chiffres =
      `${total.examinees} entreprise(s) examinée(s) — ${total.creees} créée(s)` +
      (total.rattachements > 0
        ? ` (dont ${total.rattachements} déjà inscrite(s))`
        : "") +
      `, ${total.misesAJour} mise(s) à jour, ${total.ignorees} ignorée(s), ` +
      `${total.erreurs} erreur(s).`;

    setResultatCollecte({
      ok: echecs.length === 0,
      message:
        `${nomCommune} — ${faites} métier(s) collecté(s) sur ${activites.length} ` +
        `(${libelles.join(", ")}) : ${chiffres}` +
        (echecs.length > 0 ? ` ARRÊTS : ${echecs.join(" · ")}` : ""),
    });

    router.refresh();
    setCollecteEnCours(false);
  }

  /**
   * LA RECHERCHE D'ADRESSES E-MAIL
   * ------------------------------
   * Elle porte sur les prospects du FILTRE COURANT qui n'ont pas
   * encore d'adresse. Le travail part par petits lots : on rappelle la
   * route tant qu'il reste des prospects, en lui donnant ceux qui sont
   * déjà passés. L'avancement se voit, aucun appel ne s'éternise, et
   * un site injoignable n'est jamais repris en boucle.
   */
  async function chercherLesAdresses() {
    if (rechercheEnCours) return;
    setRechercheEnCours(true);
    setAvancement(0);
    setResultatRecherche(null);

    if (apercu) {
      setResultatRecherche({
        ok: true,
        message: "Aperçu : aucune recherche n'est lancée depuis cette page.",
      });
      setRechercheEnCours(false);
      return;
    }

    const total = {
      examines: 0,
      trouves: 0,
      sansSite: 0,
      injoignables: 0,
      sansAdresse: 0,
      robotsInterdit: 0,
      erreurs: 0,
    };
    const traites: string[] = [];
    let echec = "";

    // Garde-fou : jamais plus de lots que de lignes à traiter.
    for (let tour = 0; tour < 200; tour += 1) {
      try {
        const reponse = await fetch("/api/admin/recherche-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commune: filtreCommune,
            ignorer: traites,
          }),
        });
        const donnees = (await reponse.json()) as {
          ok: boolean;
          message: string;
          compteurs?: typeof total;
          traites?: string[];
          restants?: number;
        };
        if (donnees.compteurs) {
          for (const cle of Object.keys(total) as Array<keyof typeof total>) {
            total[cle] += donnees.compteurs[cle] ?? 0;
          }
        }
        if (donnees.traites?.length) traites.push(...donnees.traites);
        setAvancement(traites.length);

        if (!donnees.ok) {
          echec = donnees.message;
          break;
        }
        // Plus rien à traiter : on s'arrête.
        if (!donnees.traites?.length || (donnees.restants ?? 0) <= 0) break;
      } catch {
        echec =
          "Pas de réponse. Vérifier que `npm run dev` tourne, puis réessayer.";
        break;
      }
    }

    const aLaMain =
      total.sansSite +
      total.injoignables +
      total.sansAdresse +
      total.robotsInterdit;
    const chiffres =
      `${total.examines} prospect(s) examiné(s) — ${total.trouves} adresse(s) trouvée(s). ` +
      `${aLaMain} restent sans adresse et devront être contactés à la main ` +
      `(${total.sansSite} sans site, ${total.injoignables} injoignable(s), ` +
      `${total.sansAdresse} site(s) lu(s) sans résultat, ` +
      `${total.robotsInterdit} lecture(s) refusée(s))` +
      (total.erreurs > 0 ? `, ${total.erreurs} erreur(s)` : "") +
      ".";

    setResultatRecherche({
      ok: !echec,
      message: echec ? `Recherche ARRÊTÉE. ${chiffres} Détail : ${echec}` : chiffres,
    });

    router.refresh();
    setRechercheEnCours(false);
  }

  /**
   * LA RECHERCHE DES FICHES GOOGLE — la seule qui dépense
   * ------------------------------------------------------
   * On COMPTE d'abord (aucun appel Google, donc aucun euro), on
   * annonce le nombre de prospects concernés et le coût maximum, et
   * on ne lance qu'après confirmation. Sur un outil facturé à
   * l'appel, on ne clique pas à l'aveugle.
   */
  async function chercherSurGoogle() {
    if (googleEnCours) return;
    setResultatGoogle(null);

    if (apercu) {
      setResultatGoogle({
        ok: true,
        message: "Aperçu : aucune recherche Google n'est lancée depuis cette page.",
      });
      return;
    }

    const filtres = { commune: filtreCommune };

    // ----- 1. Combien, et pour combien ? (gratuit) -----
    let compte: {
      ok: boolean;
      message?: string;
      nombre?: number;
      appelsMaximum?: number;
      coutMaximum?: number;
      rechercheMaximum?: number;
      detailsMaximum?: number;
      plafond?: number;
    };
    try {
      const reponse = await fetch("/api/admin/google-prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compter: true, ...filtres }),
      });
      compte = await reponse.json();
    } catch {
      setResultatGoogle({
        ok: false,
        message: "Pas de réponse. Vérifier que `npm run dev` tourne, puis réessayer.",
      });
      return;
    }

    if (!compte.ok) {
      setResultatGoogle({ ok: false, message: compte.message ?? "Comptage impossible." });
      return;
    }
    const nombre = compte.nombre ?? 0;
    if (nombre === 0) {
      setResultatGoogle({
        ok: true,
        message:
          "Aucun prospect sans fiche Google dans ce filtre : rien à chercher, rien à payer.",
      });
      return;
    }

    // ----- 2. La confirmation, chiffres en main -----
    // ON ANNONCE L'ÉTAT DES QUOTAS APRÈS L'EXÉCUTION, type d'appel par
    // type d'appel : les franchises de Google ne sont pas mutualisées,
    // et c'est celle qui sature le plus vite qui décide.
    const plafond = compte.plafond ?? 0;
    const traitesMaintenant = Math.min(
      nombre,
      Math.floor((compte.appelsMaximum ?? 0) / 2) || nombre
    );
    const ajouts: Record<string, number> = {
      recherche: compte.rechercheMaximum ?? 0,
      details_avis: compte.detailsMaximum ?? 0,
    };

    const lignesQuota =
      consommationGoogle?.types
        .filter((t) => (ajouts[t.cle] ?? 0) > 0)
        .map(
          (t) =>
            `${t.label} : ${t.appels} sur ${t.franchise.toLocaleString("fr-FR")}` +
            ` (au plus +${ajouts[t.cle]})`
        ) ?? [];

    // LE COÛT NE S'AFFICHE QUE S'IL PEUT VRAIMENT ARRIVER. Annoncer un
    // montant alors que le gratuit couvre tout ferait hésiter à lancer
    // un outil qui ne coûte rien — c'est trompeur, pas prudent.
    const risques =
      consommationGoogle?.types.filter(
        (t) => t.appels + (ajouts[t.cle] ?? 0) > t.franchise
      ) ?? [];
    const coutPossible = risques.reduce(
      (somme, t) =>
        somme +
        Math.max(0, t.appels + (ajouts[t.cle] ?? 0) - t.franchise) *
          t.coutUnitaireEuro,
      0
    );

    const accepte = window.confirm(
      `${nombre} prospect(s) sans fiche Google dans ce filtre.\n\n` +
        (lignesQuota.length > 0
          ? `Franchises gratuites de ce mois :\n${lignesQuota
              .map((l) => `  • ${l}`)
              .join("\n")}\n\n`
          : "") +
        `Cette exécution passera au plus ${compte.appelsMaximum} appel(s) à Google.\n\n` +
        (nombre > traitesMaintenant
          ? `Le plafond de ${plafond} appels par exécution s'appliquera : il faudra relancer pour la suite.\n\n`
          : "") +
        (risques.length > 0
          ? `⚠ Une franchise peut être dépassée (${risques
              .map((t) => t.label.toLowerCase())
              .join(", ")}) : environ ${coutPossible
              .toFixed(2)
              .replace(".", ",")} € au maximum.\n\n`
          : "Aucun coût tant que les franchises ne sont pas dépassées.\n\n") +
        "Lancer la recherche ?"
    );
    if (!accepte) return;

    // ----- 3. La recherche (c'est ici que ça coûte) -----
    setGoogleEnCours(true);
    try {
      const reponse = await fetch("/api/admin/google-prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtres),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message: string };
      setResultatGoogle(donnees);
      router.refresh();
    } catch {
      setResultatGoogle({
        ok: false,
        message:
          "Pas de réponse pendant la recherche. Des appels ont pu être passés : " +
          "vérifier le terminal (`[google-prospects]`) avant de relancer.",
      });
    }
    setGoogleEnCours(false);
  }

  // ----- La sélection pour l'envoi groupé -----
  const selectionnables = affichees.filter(
    (l) => raisonNonSelectionnable(l) === null
  );
  const idsSelectionnes = selectionnables
    .filter((l) => selection[l.id])
    .map((l) => l.id);
  const nombreSelectionnes = idsSelectionnes.length;

  /**
   * LE PLAFOND DU JOUR EST UNE BUTÉE, PAS UN AVERTISSEMENT.
   * On ne peut pas sélectionner plus que le quota restant sur les
   * 24 dernières heures : au-delà, la case ne répond plus. C'est ce
   * qui garantit qu'aucun envoi ne déborde sur le lendemain — un
   * message programmé qu'on ne peut pas honorer aujourd'hui, c'est
   * une file qui grossit et un étalement qui ne veut plus rien dire.
   */
  const quotaRestant = Math.max(0, indicateurs.restant);
  const quotaAtteint = nombreSelectionnes >= quotaRestant;

  const cochablesRestantes = selectionnables.filter((l) => !selection[l.id]);
  const toutCoche =
    selectionnables.length > 0 && cochablesRestantes.length === 0;

  function cocherTout(coche: boolean) {
    setSelection((s) => {
      const suite = { ...s };
      if (!coche) {
        for (const ligne of selectionnables) suite[ligne.id] = false;
        return suite;
      }
      // On ne coche que ce que le quota du jour permet encore.
      let place = quotaRestant - nombreSelectionnes;
      for (const ligne of cochablesRestantes) {
        if (place <= 0) break;
        suite[ligne.id] = true;
        place -= 1;
      }
      return suite;
    });
  }

  // Pagination
  const pages = Math.max(1, Math.ceil(totalFiltre / taillePage));
  const premiere = totalFiltre === 0 ? 0 : (page - 1) * taillePage + 1;
  const derniere = Math.min(page * taillePage, totalFiltre);

  return (
    // `min-w-0` : sans lui, un élément de colonne flex refuse de
    // rétrécir sous la largeur de son contenu — le TABLEAU pousserait
    // alors la page entière et c'est la fenêtre qui défilerait, au
    // lieu du seul tableau.
    <div className="flex flex-col gap-6 min-w-0">
      {/* ---------- Barre de collecte ---------- */}
      <div className="rounded-2xl border border-bordure bg-fond-doux p-4 flex flex-col gap-3">
        {/* LES MÉTIERS EN BADGES, plusieurs à la fois. Un menu
            déroulant obligeait à collecter sept fois de suite en
            revenant le changer entre chaque : ici je choisis tout ce
            que je veux, et les collectes s'enchaînent toutes seules. */}
        <div>
          <p className={CLASSE_ETIQUETTE}>Métiers à collecter</p>
          <div className="flex flex-wrap gap-2">
            <BadgeChoix
              actif={activites.length === ACTIVITES_A_COLLECTER.length}
              titre="Tout sélectionner (une collecte par métier, à la suite)"
              surClic={() =>
                setActivites(
                  activites.length === ACTIVITES_A_COLLECTER.length
                    ? []
                    : ACTIVITES_A_COLLECTER.map((a) => a.code)
                )
              }
            >
              Tous
            </BadgeChoix>
            {ACTIVITES_A_COLLECTER.map(({ code, menu }) => (
              <BadgeChoix
                key={code}
                actif={activites.includes(code)}
                surClic={() => basculerActivite(code)}
              >
                {menu}
              </BadgeChoix>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* TOUTES les communes de France, cherchables — et pas
              seulement celles où j'ai déjà collecté : on collecte
              justement là où il n'y a encore personne. Même champ que
              le moteur de recherche du site (ChampVille) : il connaît
              déjà le format « Écully (69130) ». */}
          <div className="min-w-[260px]">
            <ChampVille
              id="collecte-commune"
              etiquette="Commune à collecter"
              texteIndicatif="Taper les premières lettres…"
              surChoix={setCommune}
            />
          </div>

          <button
            type="button"
            onClick={collecter}
            disabled={collecteEnCours || !commune || activites.length === 0}
            className={CLASSE_BOUTON_PRINCIPAL}
          >
            {collecteEnCours
              ? "Collecte en cours…"
              : activites.length > 1
                ? `Collecter (${activites.length} métiers)`
                : "Collecter"}
          </button>
        </div>

        <p className="text-sm text-encre-douce">
          {activites.length === 0
            ? "Choisir au moins un métier."
            : commune === null
              ? "Choisir une commune : le champ propose toutes les communes de France."
              : collectesIci === 0
                ? `${commune.nom} : aucun prospect collecté pour le moment.`
                : `${commune.nom} : ${collectesIci} prospect${
                    (collectesIci ?? 0) > 1 ? "s" : ""
                  } déjà collecté${(collectesIci ?? 0) > 1 ? "s" : ""}.`}
        </p>

        {resultatCollecte && (
          <p
            className={`text-sm rounded-xl border p-3 ${
              resultatCollecte.ok
                ? "border-succes/40 bg-succes/5"
                : "border-erreur/40 bg-erreur/5"
            }`}
          >
            {resultatCollecte.ok ? "✅ " : "❌ "}
            {resultatCollecte.message}
          </p>
        )}
      </div>

      {/* ---------- Les quatre indicateurs d'envoi ---------- */}
      <IndicateursDEnvoi indicateurs={indicateurs} />

      {/* ---------- Filtre commune et outils ---------- */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px]">
          <label htmlFor="filtre-commune" className={CLASSE_ETIQUETTE}>
            N&apos;afficher qu&apos;une commune
          </label>
          <MenuAdmin
            id="filtre-commune"
            valeur={filtreCommune}
            surChoix={(valeur) =>
              router.push(lienAvec({ commune: valeur, page: "1" }))
            }
          >
            <option value="toutes">Toutes les communes</option>
            {communes.map(({ code_insee, nom, nombre }) => (
              <option key={code_insee} value={code_insee}>
                {nom} ({nombre})
              </option>
            ))}
          </MenuAdmin>
        </div>

        {filtreCommune !== "toutes" && (
          <Link
            href={lienAvec({ commune: "toutes", page: "1" })}
            className="text-sm text-primaire underline min-h-[48px] flex items-center"
          >
            Tout afficher
          </Link>
        )}

        {/* LES DEUX RECHERCHES ANNONCENT LEUR PÉRIMÈTRE.
            Un bouton qui ne dit pas sur quoi il va travailler, c'est un
            bouton qu'on n'ose pas cliquer — surtout quand l'un des
            deux est facturé à l'appel. À zéro, il est désactivé : il
            n'y a rien à faire, autant que ça se voie. */}
        <button
          type="button"
          onClick={chercherSurGoogle}
          disabled={googleEnCours || nombreSansGoogle === 0}
          title={
            nombreSansGoogle === 0
              ? "Tous les prospects de ce filtre ont déjà une fiche Google."
              : "Cherche la fiche Google de chaque prospect : note, avis, site, Instagram, téléphone. Cet outil est facturé à l'appel."
          }
          className={CLASSE_BOUTON_SECONDAIRE}
        >
          {googleEnCours
            ? "Recherche Google en cours…"
            : `Chercher sur Google (${nombreSansGoogle} sans fiche)`}
        </button>

        {/* LE RAPPEL DE CONSOMMATION, juste à côté du bouton qui
            dépense. Il montre le type d'appel LE PLUS PROCHE DE SA
            LIMITE — pas le plus gros total : 900 appels sur 10 000
            inquiètent moins que 900 sur 1 000. Discret tant que tout
            va bien, coloré quand il faut regarder. */}
        {consommationGoogle?.plusTendu && (
          <Link
            href="/admin/consommation-google"
            title={`${consommationGoogle.plusTendu.label} : ${consommationGoogle.plusTendu.appels} appel(s) sur ${consommationGoogle.plusTendu.franchise} offerts ce mois-ci. Voir le détail.`}
            className={`text-xs underline tabular-nums min-h-[36px] flex items-center ${
              CLASSE_NIVEAU_GOOGLE[consommationGoogle.plusTendu.niveau]
            }`}
          >
            Quota Google : {consommationGoogle.plusTendu.label.toLowerCase()}{" "}
            {consommationGoogle.plusTendu.appels} / {consommationGoogle.plusTendu.franchise}
            {consommationGoogle.plusTendu.niveau !== "bon" &&
              ` (${Math.round(consommationGoogle.plusTendu.part * 100)} %)`}
          </Link>
        )}

        <button
          type="button"
          onClick={chercherLesAdresses}
          disabled={rechercheEnCours || nombreAvecSite === 0}
          title={
            nombreAvecSite === 0
              ? "Aucun prospect sans adresse n'a de site internet à lire."
              : "Lit le site de chaque prospect sans adresse e-mail, page d'accueil et page de contact."
          }
          className={CLASSE_BOUTON_SECONDAIRE}
        >
          {rechercheEnCours
            ? `Recherche en cours… ${avancement} traité${avancement > 1 ? "s" : ""}`
            : `Chercher les adresses e-mail (${nombreAvecSite} avec site)`}
        </button>
      </div>

      {resultatGoogle && (
        <p
          className={`text-sm rounded-xl border p-3 ${
            resultatGoogle.ok
              ? "border-succes/40 bg-succes/5"
              : "border-erreur/40 bg-erreur/5"
          }`}
        >
          {resultatGoogle.ok ? "✅ " : "❌ "}
          {resultatGoogle.message}
        </p>
      )}

      {resultatRecherche && (
        <p
          className={`text-sm rounded-xl border p-3 ${
            resultatRecherche.ok
              ? "border-succes/40 bg-succes/5"
              : "border-erreur/40 bg-erreur/5"
          }`}
        >
          {resultatRecherche.ok ? "✅ " : "❌ "}
          {resultatRecherche.message}
        </p>
      )}

      {/* ---------- Le tableau ---------- */}
      {affichees.length === 0 ? (
        <p className="text-sm text-encre-douce">
          Aucun prospect avec ces filtres.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-bordure bg-fond-doux p-3 flex flex-wrap items-center gap-3">
            <p className="text-sm">
              <span className="font-semibold tabular-nums">
                {nombreSelectionnes}
              </span>{" "}
              prospect{nombreSelectionnes > 1 ? "s" : ""} sélectionné
              {nombreSelectionnes > 1 ? "s" : ""}{" "}
              <span className="text-encre-douce">
                sur {quotaRestant} possible{quotaRestant > 1 ? "s" : ""}{" "}
                aujourd&apos;hui
              </span>
            </p>

            <button
              type="button"
              onClick={() => setApercuOuvert(true)}
              disabled={nombreSelectionnes === 0}
              className="bg-primaire hover:bg-primaire-fonce text-white font-semibold text-sm rounded-full px-5 min-h-[36px] transition-colors disabled:opacity-60"
            >
              Préparer l&apos;envoi
            </button>

            {quotaAtteint && (
              <p className="text-sm text-alerte basis-full">
                {quotaRestant === 0
                  ? "Plafond des 24 dernières heures atteint : plus aucun envoi n'est possible aujourd'hui. Les cases restent grisées jusqu'à ce que la fenêtre glissante se libère."
                  : `Plafond du jour atteint (${quotaRestant} message${
                      quotaRestant > 1 ? "s" : ""
                    } sur les 24 dernières heures). Les autres cases ne répondent plus : c'est ce qui évite qu'un envoi déborde sur demain.`}
              </p>
            )}
          </div>

          <div className="w-full min-w-0 overflow-x-auto defilement-discret">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-bordure text-left text-xs text-encre-douce">
                  <th scope="col" className="py-2 pr-3 font-semibold w-px">
                    <input
                      type="checkbox"
                      checked={toutCoche}
                      onChange={(e) => cocherTout(e.target.checked)}
                      disabled={
                        selectionnables.length === 0 ||
                        (quotaAtteint && !toutCoche)
                      }
                      aria-label="Tout sélectionner sur cette page"
                      title={
                        quotaAtteint && !toutCoche
                          ? `Plafond du jour atteint (${quotaRestant} sur les 24 dernières heures).`
                          : "Tout sélectionner, dans la limite du quota du jour"
                      }
                      className="w-4 h-4 accent-primaire align-middle"
                    />
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[120px]">Commune</th>
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[110px]">Métier</th>
                  {/* Société : LARGEUR PLAFONNÉE. Une raison sociale
                      interminable passe à la ligne (et se coupe au
                      besoin) plutôt que d'étirer la colonne et de
                      pousser tout le reste hors de l'écran. */}
                  <th scope="col" className="py-2 pr-3 font-semibold">Société</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">SIREN</th>
                  <th
                    scope="col"
                    className="py-2 pr-3 font-semibold text-center whitespace-nowrap w-px"
                  >
                    Ancienneté (ans)
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[120px]">Site internet</th>
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[110px]">Instagram</th>
                  {/* La place reprise à Société profite ici : une
                      adresse doit se lire en entier, sans coupure. */}
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[240px]">E-mail</th>
                  <th
                    scope="col"
                    className="py-2 pr-3 font-semibold text-center whitespace-nowrap w-px"
                  >
                    Envois
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold min-w-[140px]">Dernier envoi</th>
                  <th scope="col" className="py-2 font-semibold whitespace-nowrap">Statut</th>
                </tr>
              </thead>

              <tbody>
                {affichees.map((ligne) => {
                  const alerte = aUnAvertissement(ligne.notes_admin);
                  const noms = separerNoms(
                    ligne.raison_sociale,
                    ligne.nom_commercial
                  );
                  const { principal, secondaire } = nomAffiche(
                    noms.societe,
                    noms.enseigne
                  );
                  // Deux lignes, pas trois : la personne physique
                  // (quand elle existe) et l'autre nom tiennent
                  // ensemble sur la ligne grise.
                  const details = [noms.artisan, secondaire]
                    .filter(Boolean)
                    .join(" · ");
                  const empeche = raisonNonSelectionnable(ligne);
                  const termine = ligne.nombre_envois >= NOMBRE_ENVOIS_MAXIMUM;
                  const relance = relanceProche(ligne);
                  const metiers = metierAffiche(ligne);
                  // La fenêtre d'annulation est-elle encore ouverte ?
                  // La présence dans la table SUFFIT : le minuteur en
                  // retire l'entrée le moment venu.
                  const annulable = annulables[ligne.id] === true;

                  return (
                    <tr
                      key={ligne.id}
                      className={`border-b border-bordure align-top ${
                        termine ? "opacity-60" : ""
                      } ${alerte ? "bg-alerte/5" : ""}`}
                    >
                      {/* --- Case à cocher (envoi groupé) --- */}
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={empeche === null && selection[ligne.id] === true}
                          // Butée du quota : une case DÉJÀ cochée reste
                          // décochable, les autres ne répondent plus.
                          disabled={
                            empeche !== null ||
                            (quotaAtteint && selection[ligne.id] !== true)
                          }
                          onChange={(e) =>
                            setSelection((s) => ({
                              ...s,
                              [ligne.id]: e.target.checked,
                            }))
                          }
                          aria-label={`Sélectionner ${principal}`}
                          title={
                            empeche ??
                            (quotaAtteint && selection[ligne.id] !== true
                              ? `Plafond du jour atteint (${quotaRestant} sur les 24 dernières heures).`
                              : `Sélectionner ${principal}`)
                          }
                          className="w-4 h-4 accent-primaire disabled:opacity-40"
                        />
                      </td>

                      {/* --- Commune + code postal --- */}
                      <td className="py-3 pr-3">
                        {ligne.ville_nom ? (
                          <>
                            <p>{ligne.ville_nom}</p>
                            {ligne.ville_code_postal && (
                              <p className="text-xs text-encre-douce tabular-nums">
                                {ligne.ville_code_postal}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-encre-douce">—</span>
                        )}
                      </td>

                      {/* --- Métier (rempli par Google, lecture seule) --- */}
                      <td className="py-3 pr-3">
                        {metiers ? (
                          metiers
                        ) : (
                          <span className="text-encre-douce">—</span>
                        )}
                      </td>

                      {/* --- Société --- */}
                      <td className="py-3 pr-3">
                        {/* `max-w` sur le contenu, pas sur la colonne :
                            c'est la seule façon de borner VRAIMENT une
                            colonne de tableau, dont la largeur est
                            calculée d'après son contenu le plus large.
                            Au-delà de deux lignes, le nom se coupe et
                            l'infobulle le donne en entier. */}
                        <div
                          className={`max-w-[190px] ${
                            alerte ? "border-l-4 border-alerte pl-2.5" : ""
                          }`}
                        >
                          <p
                            className="font-semibold break-words line-clamp-2"
                            title={principal}
                          >
                            {principal}
                          </p>
                          {details && (
                            <p
                              className="text-xs text-encre-douce break-words line-clamp-2"
                              title={details}
                            >
                              {details}
                            </p>
                          )}
                          {alerte && (
                            <p
                              className="text-xs font-semibold text-alerte mt-1"
                              title={ligne.notes_admin ?? undefined}
                            >
                              ⚠ à arbitrer
                            </p>
                          )}
                        </div>
                      </td>

                      {/* --- SIREN --- */}
                      <td className="py-3 pr-3 tabular-nums whitespace-nowrap">
                        {ligne.siren}
                      </td>

                      {/* --- Ancienneté, en années --- */}
                      <td className="py-3 pr-3 tabular-nums text-center whitespace-nowrap text-encre-douce">
                        {ancienneteEnAnnees(ligne.date_creation_entreprise)}
                      </td>

                      {/* --- Site internet --- */}
                      <td className="py-3 pr-3">
                        {ligne.site_internet ? (
                          <a
                            href={ligne.site_internet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primaire underline inline-flex items-center gap-1 break-all"
                          >
                            {domaineSeul(ligne.site_internet)}
                            <IconeLienExterne taille={12} />
                          </a>
                        ) : (
                          <span className="text-encre-douce">—</span>
                        )}
                      </td>

                      {/* --- Instagram --- */}
                      <td className="py-3 pr-3">
                        {ligne.lien_instagram ? (
                          <a
                            href={ligne.lien_instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primaire underline inline-flex items-center gap-1 break-all"
                          >
                            {compteInstagram(ligne.lien_instagram)}
                            <IconeLienExterne taille={12} />
                          </a>
                        ) : (
                          <span className="text-encre-douce">—</span>
                        )}
                      </td>

                      {/* --- E-mail, ou le contact par formulaire --- */}
                      <td className="py-3 pr-3">
                        <ChampEmail
                          ligne={ligne}
                          surValidation={(email) => modifier(ligne.id, { email })}
                        />

                        {/* SANS ADRESSE, LE CIRCUIT NE DOIT PAS S'ARRÊTER.
                            Pas d'adresse = pas de case à cocher = ce
                            prospect ne pouvait jamais avancer. Ce bouton
                            note le contact fait par le formulaire de son
                            site : il compte comme un envoi dans la
                            séquence, mais PAS dans le quota.
                            Les deux ne coexistent jamais : dès qu'une
                            adresse est saisie, c'est la case à cocher qui
                            prend le relais.

                            TROIS ÉTATS, dans cet ordre :
                             1. rien de noté → le lien qui note ;
                             2. noté à l'instant → « Contacté à l'instant ·
                                Annuler », le temps de rattraper un clic
                                sur la mauvaise ligne ;
                             3. passé ce délai → une date, et plus rien à
                                cliquer. Sauf si la relance est due : le
                                lien revient, sinon la séquence de ce
                                prospect s'arrêterait là. */}
                        {!ligne.email && !termine && (
                          annulable ? (
                            <p className="mt-1.5 text-xs">
                              <span className="font-semibold text-succes">
                                Contacté à l&apos;instant
                              </span>
                              <span className="text-encre-douce"> · </span>
                              <button
                                type="button"
                                onClick={() => annulerFormulaire(ligne.id)}
                                disabled={annulationEnCours === ligne.id}
                                title={`Défaire ce contact : le compteur d'envois redescend d'un cran. Possible pendant ${DELAI_ANNULATION_FORMULAIRE_MINUTES} minutes.`}
                                className="font-semibold text-primaire underline disabled:opacity-60"
                              >
                                {annulationEnCours === ligne.id
                                  ? "Annulation…"
                                  : "Annuler"}
                              </button>
                            </p>
                          ) : ligne.contact_formulaire_le ? (
                            <>
                              <p className="mt-1.5 text-xs text-encre-douce">
                                Contacté par formulaire le{" "}
                                <span className="tabular-nums">
                                  {dateJourMois(ligne.contact_formulaire_le)}
                                </span>
                              </p>
                              {relance?.enRetard && (
                                <button
                                  type="button"
                                  onClick={() => marquerFormulaire(ligne.id)}
                                  disabled={formulaireEnCours === ligne.id}
                                  title="Noter la relance faite par le formulaire — hors quota"
                                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primaire underline disabled:opacity-60"
                                >
                                  <IconeEnveloppe taille={14} />
                                  {formulaireEnCours === ligne.id
                                    ? "Enregistrement…"
                                    : "Relancé par formulaire"}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => marquerFormulaire(ligne.id)}
                              disabled={formulaireEnCours === ligne.id}
                              title={
                                ligne.site_internet
                                  ? `Noter un contact via le formulaire de ${domaineSeul(
                                      ligne.site_internet
                                    )} — hors quota`
                                  : "Noter un contact pris à la main — hors quota"
                              }
                              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primaire underline disabled:opacity-60"
                            >
                              <IconeEnveloppe taille={14} />
                              {formulaireEnCours === ligne.id
                                ? "Enregistrement…"
                                : "Contacté par formulaire"}
                            </button>
                          )
                        )}
                        {erreurs[ligne.id] && (
                          <p className="text-xs text-erreur mt-1">
                            {erreurs[ligne.id]}
                          </p>
                        )}
                        {enregistrees[ligne.id] && !erreurs[ligne.id] && (
                          <p className="text-xs text-succes mt-1">✓ enregistré</p>
                        )}
                      </td>

                      {/* --- Nombre d'envois --- */}
                      <td className="py-3 pr-3 tabular-nums text-center whitespace-nowrap">
                        {ligne.nombre_envois} / {NOMBRE_ENVOIS_MAXIMUM}
                      </td>

                      {/* --- Dernier envoi, et la relance qui approche --- */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {ligne.dernier_envoi_le ? (
                          <p className="tabular-nums">
                            {dateCourte(ligne.dernier_envoi_le)}
                          </p>
                        ) : (
                          <span className="text-encre-douce">—</span>
                        )}
                        {relance && (
                          <p
                            className={`text-xs tabular-nums ${
                              relance.enRetard
                                ? "text-alerte font-semibold"
                                : "text-encre-douce"
                            }`}
                          >
                            {relance.enRetard ? "relance due " : "relance le "}
                            {dateCourte(relance.date)}
                          </p>
                        )}
                      </td>

                      {/* --- Statut, en couleur --- */}
                      <td className="py-3">
                        <PastilleStatut statut={ligne.statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---------- Pagination ---------- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-encre-douce tabular-nums">
              {pages > 1
                ? `Lignes ${premiere} à ${derniere} sur ${totalFiltre} · page ${page} sur ${pages}`
                : `${totalFiltre} ligne${totalFiltre > 1 ? "s" : ""}`}
            </p>

            {pages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={lienAvec({ page: String(page - 1) })}
                    className="text-xs font-semibold rounded-full px-3.5 min-h-[36px] flex items-center border border-bordure hover:bg-fond-doux transition-colors"
                  >
                    ← Précédente
                  </Link>
                ) : (
                  <span className="text-xs rounded-full px-3.5 min-h-[36px] flex items-center border border-bordure text-encre-douce opacity-50">
                    ← Précédente
                  </span>
                )}
                {page < pages ? (
                  <Link
                    href={lienAvec({ page: String(page + 1) })}
                    className="text-xs font-semibold rounded-full px-3.5 min-h-[36px] flex items-center border border-bordure hover:bg-fond-doux transition-colors"
                  >
                    Suivante →
                  </Link>
                ) : (
                  <span className="text-xs rounded-full px-3.5 min-h-[36px] flex items-center border border-bordure text-encre-douce opacity-50">
                    Suivante →
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------- Corriger un contact ancien (rare, replié) ----------
          Hors du tableau, et replié : ce n'est pas un geste de travail
          courant, c'est un rattrapage. Il ne doit encombrer aucune
          ligne ni tenter personne au passage. */}
      <details className="rounded-xl border border-bordure bg-fond-doux p-3">
        <summary className="text-xs text-encre-douce cursor-pointer select-none">
          Corriger un contact par formulaire noté par erreur
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-encre-douce max-w-[720px] leading-relaxed">
            Passé les {DELAI_ANNULATION_FORMULAIRE_MINUTES} minutes
            d&apos;annulation, un contact ne se retire plus depuis la ligne.
            Saisir ici le SIREN de la fiche : le contact noté est effacé, le
            compteur d&apos;envois redescend d&apos;un cran et la relance est
            recalculée. La date du dernier envoi, elle, ne se devine pas — elle
            n&apos;est remise à zéro que si le compteur retombe à 0.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="siren-retrait" className={CLASSE_ETIQUETTE}>
                SIREN de la fiche
              </label>
              <input
                id="siren-retrait"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                value={sirenRetrait}
                onChange={(e) => {
                  setSirenRetrait(e.target.value);
                  setFicheRetrait(null);
                  setResultatRetrait(null);
                }}
                placeholder="123456789"
                className={`${CLASSE_CHAMP_ADMIN} w-[180px] tabular-nums`}
              />
            </div>
            <button
              type="button"
              onClick={chercherPourRetrait}
              disabled={
                retraitEnCours || sirenRetrait.replace(/\D/g, "").length !== 9
              }
              className={CLASSE_BOUTON_SECONDAIRE}
            >
              {retraitEnCours && !ficheRetrait ? "Recherche…" : "Chercher"}
            </button>
          </div>

          {/* La fiche trouvée : on lit AVANT de retirer. */}
          {ficheRetrait && (
            <div className="rounded-xl border border-bordure bg-fond p-3 flex flex-col gap-3">
              <div className="text-sm">
                <p className="font-semibold">{ficheRetrait.raison_sociale}</p>
                <p className="text-xs text-encre-douce mt-0.5">
                  {ficheRetrait.ville_nom ?? "commune inconnue"} · SIREN{" "}
                  <span className="tabular-nums">{ficheRetrait.siren}</span>
                </p>
                <p className="text-xs mt-2">
                  Contact par formulaire noté le{" "}
                  <span className="font-semibold tabular-nums">
                    {dateCourte(ficheRetrait.contact_formulaire_le)}
                  </span>{" "}
                  · compteur actuel{" "}
                  <span className="font-semibold tabular-nums">
                    {ficheRetrait.nombre_envois} / {NOMBRE_ENVOIS_MAXIMUM}
                  </span>{" "}
                  → il passera à{" "}
                  <span className="font-semibold tabular-nums">
                    {Math.max(0, ficheRetrait.nombre_envois - 1)} /{" "}
                    {NOMBRE_ENVOIS_MAXIMUM}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={retirerLeContact}
                  disabled={retraitEnCours}
                  className={CLASSE_BOUTON_PRINCIPAL}
                >
                  {retraitEnCours ? "Retrait…" : "Retirer ce contact"}
                </button>
                <button
                  type="button"
                  onClick={() => setFicheRetrait(null)}
                  className={CLASSE_BOUTON_SECONDAIRE}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {resultatRetrait && (
            <p
              className={`text-sm rounded-xl border p-3 ${
                resultatRetrait.ok
                  ? "border-succes/40 bg-succes/5"
                  : "border-erreur/40 bg-erreur/5"
              }`}
            >
              {resultatRetrait.ok ? "✅ " : "❌ "}
              {resultatRetrait.message}
            </p>
          )}
        </div>
      </details>

      {/* L'écran d'aperçu : le dernier arrêt avant que des messages
          partent à de vraies personnes. Monté SEULEMENT à l'ouverture,
          pour que chaque ouverture reparte de données fraîches. */}
      {apercuOuvert && (
      <ApercuEnvoiProspection
        surFermeture={() => setApercuOuvert(false)}
        prospectIds={idsSelectionnes}
        commune={filtreCommune}
        apercu={apercu}
        donneesFictives={apercuFictif}
        surEnvoiEffectue={() => {
          setSelection({});
          router.refresh();
        }}
      />
      )}
    </div>
  );
}

/**
 * LES QUATRE INDICATEURS D'ENVOI
 * ===============================
 * Ce qu'on doit savoir AVANT d'écrire à qui que ce soit. Tous
 * calculés sur une FENÊTRE GLISSANTE de 24 heures : jamais de remise
 * à zéro à minuit, qui provoquerait une rafale juste après minuit.
 *
 * Le moteur d'envoi n'existe pas encore : ces chiffres sont à zéro
 * aujourd'hui, et c'est la vérité, pas une panne.
 */
function IndicateursDEnvoi({ indicateurs }: { indicateurs: IndicateursEnvoi }) {
  const {
    tauxPlainte,
    seuilCritique,
    niveauPlainte,
    envoyes,
    plafond,
    semaine,
    enCroisiere,
    restant,
    formulaires,
    fenetreHeures,
    journalManquant,
  } = indicateurs;

  const couleurPlainte =
    niveauPlainte === "critique"
      ? "text-erreur"
      : niveauPlainte === "alerte"
        ? "text-alerte"
        : niveauPlainte === "bon"
          ? "text-succes"
          : "text-encre-douce";

  const pourcentage = (valeur: number) =>
    `${(valeur * 100).toFixed(2).replace(".", ",")} %`;

  const cartes = [
    {
      cle: "plainte",
      label: "Taux de plainte",
      valeur: tauxPlainte === null ? "—" : pourcentage(tauxPlainte),
      couleur: couleurPlainte,
      detail:
        tauxPlainte === null
          ? `aucun envoi sur ${fenetreHeures} h`
          : `seuil critique ${pourcentage(seuilCritique)}`,
    },
    {
      cle: "envoyes",
      label: `E-mails envoyés (${fenetreHeures} h glissantes)`,
      valeur: `${envoyes} / ${plafond}`,
      couleur: "",
      detail: enCroisiere
        ? "vitesse de croisière"
        : `semaine ${semaine} sur ${SEMAINES_MONTEE} de montée en charge`,
    },
    {
      cle: "restant",
      label: "Encore possible aujourd'hui",
      valeur: String(restant),
      couleur: "text-alerte",
      detail: "avant d'atteindre le plafond",
    },
    {
      cle: "formulaires",
      label: `Formulaires remplis (${fenetreHeures} h)`,
      valeur: String(formulaires),
      couleur: "",
      detail: "hors quota",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-3">
        {cartes.map(({ cle, label, valeur, couleur, detail }) => (
          <div key={cle} className="rounded-2xl border border-bordure bg-fond p-4">
            <dt className="text-xs text-encre-douce">{label}</dt>
            <dd
              className={`text-2xl font-bold tabular-nums mt-0.5 ${couleur}`}
            >
              {valeur}
            </dd>
            <p className="text-xs text-encre-douce mt-0.5">{detail}</p>
          </div>
        ))}
      </dl>

      {journalManquant && (
        <p className="text-xs text-encre-douce">
          Le journal des envois (<code>prospection_envois</code>) n&apos;est pas
          encore lisible : passer <code>supabase/prospection.sql</code> dans
          l&apos;éditeur SQL de Supabase. En attendant, ces quatre chiffres
          restent à zéro.
        </p>
      )}
    </div>
  );
}

/** Le statut, en couleur — la colonne qu'on lit en diagonale. */
function PastilleStatut({ statut }: { statut: string }) {
  const entree = STATUTS_PROSPECTION.find((s) => s.cle === statut);
  const classes =
    CLASSES_STATUT[entree?.couleur ?? "gris"] ?? CLASSES_STATUT.gris;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${classes}`}
    >
      {entree?.label ?? statut}
    </span>
  );
}

/**
 * LA CASE E-MAIL
 * --------------
 * Adresse connue : affichée EN ENTIER, avec un « modifier » discret
 * (une adresse mal recopiée doit pouvoir être corrigée ici).
 * Adresse absente : champ de saisie dans la case. C'est la SEULE
 * donnée encore modifiable dans ce tableau.
 */
function ChampEmail({
  ligne,
  surValidation,
}: {
  ligne: LigneProspect;
  surValidation: (email: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const enSaisie = ouvert || !ligne.email;

  if (!enSaisie) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-all">{ligne.email}</span>
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="text-xs text-primaire underline shrink-0"
        >
          modifier
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const champ = e.currentTarget.elements.namedItem(
          `email-${ligne.id}`
        ) as HTMLInputElement;
        surValidation(champ.value);
        setOuvert(false);
      }}
    >
      <label htmlFor={`email-${ligne.id}`} className="sr-only">
        Adresse e-mail de {ligne.raison_sociale}
      </label>
      <input
        id={`email-${ligne.id}`}
        name={`email-${ligne.id}`}
        type="email"
        inputMode="email"
        autoComplete="off"
        defaultValue={ligne.email ?? ""}
        placeholder="adresse@entreprise.fr"
        onBlur={(e) => {
          if (e.target.value === (ligne.email ?? "")) {
            setOuvert(false);
            return; // rien n'a changé : aucun appel
          }
          surValidation(e.target.value);
          setOuvert(false);
        }}
        className={CLASSE_CHAMP_COMPACT}
      />
    </form>
  );
}
