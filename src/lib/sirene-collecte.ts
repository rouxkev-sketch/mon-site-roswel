import { CODES_NAF_BATIMENT, COLLECTE_SIRENE } from "@/config/roswel";
import { URL_ANNUAIRE_ENTREPRISES, nettoyerSiren } from "@/lib/siren";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * COLLECTE DES PROSPECTS DEPUIS L'ANNUAIRE SIRENE
 * -----------------------------------------------
 * Remplit la table `artisans_prospects` à partir de l'annuaire public
 * des entreprises de l'État (recherche-entreprises.api.gouv.fr, les
 * données Sirene de l'INSEE — gratuit, sans clé, officiel). C'est le
 * même service que la vérification d'un SIREN (src/lib/siren.ts).
 *
 * UNE COLLECTE = UN MÉTIER × UNE COMMUNE. Volontairement : l'exécution
 * reste courte, on voit ce qu'on ramène, et l'annuaire n'est pas
 * bousculé.
 *
 * CE QUE L'ANNUAIRE NE DONNE PAS : l'adresse e-mail. Jamais. Toute
 * ligne créée part donc avec le statut « e-mail à trouver » — c'est
 * le statut honnête, celui qui dit le travail qui reste.
 *
 * RELANÇABLE SANS DANGER : une entreprise déjà collectée n'est pas
 * dupliquée et son travail de prospection n'est jamais écrasé (voir
 * `mettreAJourDonneesSirene`).
 */

/** Statut de départ : l'annuaire ne fournit aucune adresse e-mail. */
const STATUT_INITIAL = "email_a_trouver";

/* ------------------------------------------------------------------
 * Ce que renvoie la collecte
 * ------------------------------------------------------------------ */

export type LigneResume = {
  entreprise: string;
  siren: string;
  action: "créée" | "rattachée" | "mise à jour" | "ignorée" | "erreur";
  detail: string;
};

export type ResultatCollecte = {
  ok: boolean;
  message: string;
  compteurs: {
    examinees: number;
    creees: number;
    rattachements: number;
    misesAJour: number;
    ignorees: number;
    erreurs: number;
  };
  /** Vrai si l'annuaire a fermé la porte avant la fin. */
  interrompue: boolean;
  resume: LigneResume[];
};

/* ------------------------------------------------------------------
 * La forme des données renvoyées par l'annuaire
 * ------------------------------------------------------------------ */

/**
 * ⚠️ CES TYPES SUIVENT UNE RÉPONSE RÉELLE DE L'ANNUAIRE, pas la
 * documentation — deux essais ont montré qu'elles divergent. Extrait
 * authentique d'un `matching_etablissements` :
 *
 *   "siret": "…", "activite_principale": "43.22A",
 *   "adresse": "1 AVENUE EDOUARD AYNARD 69130 ECULLY",
 *   "code_postal": "69130",
 *   "commune": "69081",              ← le code INSEE, pas "code_commune"
 *   "libelle_commune": "ECULLY",
 *   "liste_enseignes": ["…"],
 *   "etat_administratif": "A"
 *
 * Ne « corriger » aucun de ces noms d'après la documentation sans
 * l'avoir revérifié sur une vraie réponse.
 */
type EtablissementApi = {
  siret?: string;
  etat_administratif?: string; // "A" = actif
  /** LE CODE INSEE de la commune. L'annuaire le nomme « commune ». */
  commune?: string;
  libelle_commune?: string;
  code_postal?: string;
  adresse?: string;
  /** Renvoyées en TEXTE par l'annuaire (« 45.7735 »). */
  latitude?: string | number | null;
  longitude?: string | number | null;
  /** Le métier déclaré POUR CET ÉTABLISSEMENT (peut différer du siège). */
  activite_principale?: string;
  /** Les enseignes commerciales — un tableau, pas une chaîne. */
  liste_enseignes?: string[] | null;
  /** Présent sur certains établissements seulement. */
  nom_commercial?: string | null;
};

type EntrepriseApi = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  sigle?: string | null;
  date_creation?: string | null;
  etat_administratif?: string;
  activite_principale?: string;
  siege?: EtablissementApi;
  matching_etablissements?: EtablissementApi[];
};

type ReponseApi = {
  results?: EntrepriseApi[];
  total_results?: number;
  total_pages?: number;
};

/* ------------------------------------------------------------------
 * Petits outils
 * ------------------------------------------------------------------ */

/** Attente entre deux appels, pour ne pas bousculer l'annuaire. */
function attendre(millisecondes: number): Promise<void> {
  return new Promise((suite) => setTimeout(suite, millisecondes));
}

/**
 * Le code NAF s'écrit tantôt « 4322A », tantôt « 43.22A » selon la
 * source : on compare toujours la version sans ponctuation.
 */
function normaliserNaf(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** L'entrée de CODES_NAF_BATIMENT correspondant à un code, ou null. */
export function offreNaf(code: string) {
  const cherche = normaliserNaf(code);
  return (
    CODES_NAF_BATIMENT.find((n) => normaliserNaf(n.code) === cherche) ?? null
  );
}

/**
 * LE CODE NAF TEL QUE L'ANNUAIRE L'ATTEND : avec le point.
 * « 4322A » → « 43.22A » (2 chiffres, point, 2 chiffres, lettre).
 *
 * Nos réglages (CODES_NAF_BATIMENT) gardent la forme SANS point, et
 * toutes les comparaisons internes ignorent la ponctuation : le point
 * n'est remis QU'AU MOMENT DE L'APPEL. Un code de forme inattendue
 * est envoyé tel quel — à l'annuaire de dire s'il le comprend.
 */
function pointerNaf(code: string): string {
  const brut = normaliserNaf(code);
  return /^\d{4}[A-Z]$/.test(brut)
    ? `${brut.slice(0, 2)}.${brut.slice(2)}`
    : code;
}

/** Un nombre exploitable, ou null (l'annuaire renvoie parfois du texte). */
function nombreOuNull(valeur: string | number | null | undefined) {
  if (valeur === null || valeur === undefined || valeur === "") return null;
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : null;
}

/** "AAAA-MM-JJ" plausible ? (même contrôle qu'à l'inscription) */
function dateOuNull(texte: string | null | undefined): string | null {
  if (typeof texte !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texte)) {
    return null;
  }
  return Number.isNaN(new Date(texte).getTime()) ? null : texte;
}

/* ------------------------------------------------------------------
 * L'appel à l'annuaire
 * ------------------------------------------------------------------ */

type PageAnnuaire =
  | { etat: "ok"; donnees: ReponseApi }
  | { etat: "bloque"; message: string }
  | { etat: "erreur"; message: string };

/**
 * L'adresse complète d'un appel.
 *
 * ⚠️ LE NOM DU PARAMÈTRE MÉTIER EST « activite_principale ».
 * Deux essais réels l'ont établi :
 *   ?activite_principale=43.22A&code_commune=69081 → plombiers d'Écully ✅
 *   ?code_naf=43.22A&code_commune=69081            → La Poste, EDF, BNP ❌
 * Le nom « code_naf », vu dans la documentation, est IGNORÉ EN
 * SILENCE : la requête réussit, mais le filtre métier ne s'applique
 * pas. Ne pas y revenir.
 *
 * La VALEUR, elle, doit porter le point (« 43.22A ») — c'est ce qui
 * manquait au tout premier essai. Voir `pointerNaf`.
 */
function construireUrl(
  codeNaf: string,
  codeInsee: string,
  page: number
): string {
  const parametres = new URLSearchParams({
    activite_principale: pointerNaf(codeNaf),
    code_commune: codeInsee,
    page: String(page),
    per_page: String(COLLECTE_SIRENE.taillePage),
  });
  return `${URL_ANNUAIRE_ENTREPRISES}?${parametres}`;
}

/** Le corps de la réponse, tronqué : de quoi diagnostiquer, pas plus. */
async function corpsLisible(reponse: Response): Promise<string> {
  try {
    const texte = await reponse.text();
    return texte.length > 400 ? `${texte.slice(0, 400)}…` : texte;
  } catch {
    return "(corps illisible)";
  }
}

/**
 * UN appel, à une adresse donnée. On ne réessaie jamais ici : en cas
 * de refus, on remonte l'information et l'appelant décide.
 */
async function appelerAnnuaire(url: string): Promise<PageAnnuaire> {
  try {
    const reponse = await fetch(url, {
      headers: {
        accept: "application/json",
        // Recommandé par la documentation : l'État sait ainsi qui
        // l'interroge.
        "user-agent": COLLECTE_SIRENE.userAgent,
      },
    });

    // 429 = trop de requêtes ; 5xx = annuaire en difficulté. Dans les
    // deux cas on arrête : insister ne ferait qu'allonger le blocage.
    if (reponse.status === 429) {
      return {
        etat: "bloque",
        message:
          "l'annuaire a répondu « 429 — trop de requêtes ». Il faut le laisser " +
          "souffler quelques minutes, puis relancer la collecte (rien n'est perdu).",
      };
    }
    if (reponse.status >= 500) {
      return {
        etat: "bloque",
        message: `l'annuaire a répondu « ${reponse.status} » : service momentanément indisponible, réessayer plus tard.`,
      };
    }
    if (!reponse.ok) {
      // Message DÉTAILLÉ : sans l'adresse appelée et la réponse de
      // l'annuaire, on diagnostique à l'aveugle.
      return {
        etat: "erreur",
        message:
          `l'annuaire a répondu « ${reponse.status} ». Adresse appelée : ${url} — ` +
          `réponse : ${await corpsLisible(reponse)}`,
      };
    }

    return { etat: "ok", donnees: (await reponse.json()) as ReponseApi };
  } catch (e) {
    return {
      etat: "bloque",
      message: `annuaire injoignable (${
        e instanceof Error ? e.message : String(e)
      }).`,
    };
  }
}

/** UNE page de résultats. Les filtres seuls suffisent (essai réel). */
function lireUnePage(
  codeNaf: string,
  codeInsee: string,
  page: number
): Promise<PageAnnuaire> {
  return appelerAnnuaire(construireUrl(codeNaf, codeInsee, page));
}

/* ------------------------------------------------------------------
 * Le tri des entreprises reçues
 * ------------------------------------------------------------------ */

/** Tous les établissements connus d'une entreprise (siège compris). */
function etablissements(entreprise: EntrepriseApi): EtablissementApi[] {
  return [
    entreprise.siege,
    ...(entreprise.matching_etablissements ?? []),
  ].filter((e): e is EtablissementApi => Boolean(e));
}

/**
 * L'établissement ACTIF situé dans la commune demandée, ou null.
 *
 * ⚠️ Le champ à comparer s'appelle « commune » (et contient le code
 * INSEE), PAS « code_commune ». Chercher « code_commune » revenait à
 * comparer `undefined` : plus aucune entreprise n'était retenue.
 *
 * Ce contrôle est refait ICI même si l'annuaire filtre déjà : on
 * n'écrit jamais une entreprise d'une autre commune.
 */
function etablissementDansLaCommune(
  entreprise: EntrepriseApi,
  codeInsee: string
): EtablissementApi | null {
  return (
    etablissements(entreprise).find(
      (e) => e.commune === codeInsee && e.etat_administratif === "A"
    ) ?? null
  );
}

/**
 * LE GARDE-FOU DU FILTRE MÉTIER
 * -----------------------------
 * Un paramètre mal nommé est ignoré EN SILENCE par l'annuaire : la
 * requête réussit et renvoie n'importe quoi (les plus grosses
 * entreprises de France). C'est exactement ce qui a coûté deux
 * essais.
 *
 * On vérifie donc que la page reçue porte bien le métier demandé —
 * au niveau de l'entreprise ou de l'un de ses établissements. Une
 * seule correspondance suffit à prouver que le filtre s'applique.
 */
function pageConformeAuMetier(
  entreprises: EntrepriseApi[],
  codeNaf: string
): boolean {
  const attendu = normaliserNaf(codeNaf);
  return entreprises.some((entreprise) => {
    if (normaliserNaf(entreprise.activite_principale ?? "") === attendu) {
      return true;
    }
    return etablissements(entreprise).some(
      (e) => normaliserNaf(e.activite_principale ?? "") === attendu
    );
  });
}

/* ------------------------------------------------------------------
 * L'écriture en base
 * ------------------------------------------------------------------ */

type ClientAdmin = ReturnType<typeof creerClientSupabaseAdmin>;

/** Les colonnes issues de Sirene — les seules qu'une relance réécrit. */
type DonneesSirene = {
  siren: string;
  siret_etablissement: string | null;
  raison_sociale: string;
  nom_commercial: string | null;
  code_naf: string;
  libelle_naf: string;
  date_creation_entreprise: string | null;
  etat_administratif: string;
  adresse: string | null;
  ville_code_insee: string;
  ville_nom: string;
  ville_code_postal: string | null;
  latitude: number | null;
  longitude: number | null;
};

/**
 * LE RAPPROCHEMENT AVEC UNE FICHE EXISTANTE
 * -----------------------------------------
 * Inutile de démarcher quelqu'un qui est déjà inscrit : si le SIREN
 * correspond à une fiche de la table `artisans`, la ligne part
 * directement en « compte créé ».
 *
 * ⚠️ `artisans.siren` n'est PAS unique (choix assumé : imposer
 * l'unicité casserait l'enregistrement d'une fiche en cas de doublon).
 * Si plusieurs fiches partagent le SIREN, on ne rattache RIEN et on
 * laisse une note pour que l'admin tranche à la main.
 */
async function rechercherFicheExistante(
  supabase: ClientAdmin,
  siren: string
): Promise<
  | { cas: "aucune" }
  | { cas: "une"; artisanId: string; creeLe: string | null; nom: string }
  | { cas: "plusieurs"; combien: number; noms: string }
> {
  const { data, error } = await supabase
    .from("artisans")
    .select("id, nom_affiche, cree_le")
    .eq("siren", siren);
  if (error) throw new Error(`lecture des fiches : ${error.message}`);

  const fiches = data ?? [];
  if (fiches.length === 0) return { cas: "aucune" };
  if (fiches.length === 1) {
    return {
      cas: "une",
      artisanId: fiches[0].id as string,
      creeLe: (fiches[0].cree_le as string | null) ?? null,
      nom: (fiches[0].nom_affiche as string) ?? "",
    };
  }
  return {
    cas: "plusieurs",
    combien: fiches.length,
    noms: fiches.map((f) => f.nom_affiche as string).join(", "),
  };
}

/**
 * MISE À JOUR D'UN PROSPECT DÉJÀ COLLECTÉ
 * ---------------------------------------
 * On rafraîchit UNIQUEMENT ce qui vient de l'annuaire. On ne touche
 * JAMAIS au travail de prospection : statut, e-mail, nombre d'envois,
 * dates d'envoi, notes de l'admin, rattachement.
 *
 * `metiers` n'est pas réécrit non plus : il est déduit du code NAF,
 * donc destiné à être CORRIGÉ à la main dans l'interface. Une relance
 * de la collecte ne doit pas effacer cette correction.
 */
async function mettreAJourDonneesSirene(
  supabase: ClientAdmin,
  prospectId: string,
  sourcesActuelles: string[],
  donnees: DonneesSirene
): Promise<void> {
  const sources = sourcesActuelles.includes("sirene")
    ? sourcesActuelles
    : [...sourcesActuelles, "sirene"];

  const { error } = await supabase
    .from("artisans_prospects")
    .update({ ...donnees, sources, maj_le: new Date().toISOString() })
    .eq("id", prospectId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------
 * La collecte complète
 * ------------------------------------------------------------------ */

export async function collecterSirene({
  codeNaf,
  codeInsee,
  maximum,
}: {
  codeNaf: string;
  codeInsee: string;
  maximum?: number;
}): Promise<ResultatCollecte> {
  const resume: LigneResume[] = [];
  const compteurs = {
    examinees: 0,
    creees: 0,
    rattachements: 0,
    misesAJour: 0,
    ignorees: 0,
    erreurs: 0,
  };
  const rien = (message: string): ResultatCollecte => ({
    ok: false,
    message,
    compteurs,
    interrompue: false,
    resume,
  });

  // ----- 1. Le métier demandé -----
  const offre = offreNaf(codeNaf);
  if (!offre) {
    return rien(
      `Code NAF inconnu : « ${codeNaf} ». Codes acceptés : ` +
        `${CODES_NAF_BATIMENT.map((n) => n.code).join(", ")} ` +
        "(liste modifiable dans src/config/roswel.ts)."
    );
  }

  // Combien d'entreprises au plus : la demande, bornée par le plafond
  // de la configuration — jamais au-dessus.
  const demande = Number(maximum);
  const plafond =
    Number.isFinite(demande) && demande > 0
      ? Math.min(Math.floor(demande), COLLECTE_SIRENE.entreprisesMaximum)
      : COLLECTE_SIRENE.entreprisesMaximum;

  // ----- 2. La commune demandée (nom officiel, code postal, GPS) -----
  let supabase: ClientAdmin;
  let commune: {
    code_insee: string;
    nom: string;
    codes_postaux: string[] | null;
    latitude: number | null;
    longitude: number | null;
  };
  try {
    supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from("communes")
      .select("code_insee, nom, codes_postaux, latitude, longitude")
      .eq("code_insee", codeInsee)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return rien(
        `Commune inconnue : « ${codeInsee} ». Ce code INSEE n'est pas dans la ` +
          "table des communes (l'import a-t-il été fait ?)."
      );
    }
    commune = data as typeof commune;
  } catch (e) {
    return rien(
      `Base injoignable : ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // ----- 3. Les pages de l'annuaire -----
  let interrompue = false;
  let messageArret = "";
  let page = 1;

  while (compteurs.examinees < plafond) {
    // Temporisation AVANT chaque appel sauf le premier
    if (page > 1) await attendre(COLLECTE_SIRENE.pauseMs);

    const resultat = await lireUnePage(offre.code, codeInsee, page);
    if (resultat.etat !== "ok") {
      interrompue = resultat.etat === "bloque";
      messageArret = resultat.message;
      break;
    }

    const entreprises = resultat.donnees.results ?? [];
    if (entreprises.length === 0) break; // plus rien à lire

    // GARDE-FOU : le filtre métier a-t-il vraiment été appliqué ?
    // Mieux vaut s'arrêter que remplir la base de n'importe quoi.
    if (!pageConformeAuMetier(entreprises, offre.code)) {
      const exemples = entreprises
        .slice(0, 3)
        .map(
          (e) =>
            `${e.nom_raison_sociale ?? e.nom_complet ?? "?"} (${
              e.activite_principale ?? "sans code"
            })`
        )
        .join(", ");
      messageArret =
        `LE FILTRE MÉTIER SEMBLE IGNORÉ PAR L'ANNUAIRE — aucune des ` +
        `${entreprises.length} entreprises de la page ${page} ne porte le code ` +
        `${pointerNaf(offre.code)}, ni au niveau de l'entreprise, ni au niveau ` +
        `de ses établissements. Reçu par exemple : ${exemples}. ` +
        "Collecte arrêtée avant toute écriture — le nom du paramètre envoyé " +
        "à l'annuaire est probablement à revoir (voir `construireUrl`).";
      break;
    }

    for (const entreprise of entreprises) {
      if (compteurs.examinees >= plafond) break;
      compteurs.examinees += 1;

      const nomLisible =
        entreprise.nom_raison_sociale ??
        entreprise.nom_complet ??
        "(sans nom)";
      const siren = nettoyerSiren(entreprise.siren ?? "");

      try {
        // -- Filtres : SIREN lisible, entreprise active, bonne commune --
        if (siren.length !== 9) {
          compteurs.ignorees += 1;
          resume.push({
            entreprise: nomLisible,
            siren: entreprise.siren ?? "—",
            action: "ignorée",
            detail: "SIREN illisible",
          });
          continue;
        }
        if (entreprise.etat_administratif !== "A") {
          compteurs.ignorees += 1;
          resume.push({
            entreprise: nomLisible,
            siren,
            action: "ignorée",
            detail: "entreprise cessée",
          });
          continue;
        }
        const etablissement = etablissementDansLaCommune(entreprise, codeInsee);
        if (!etablissement) {
          compteurs.ignorees += 1;
          resume.push({
            entreprise: nomLisible,
            siren,
            action: "ignorée",
            detail: `aucun établissement actif à ${commune.nom}`,
          });
          continue;
        }

        // -- Les données issues de l'annuaire --
        const donnees: DonneesSirene = {
          siren,
          siret_etablissement: etablissement.siret ?? null,
          raison_sociale: nomLisible,
          // L'enseigne commerciale : l'annuaire renvoie un TABLEAU
          // (`liste_enseignes`). On prend la première, sinon le nom
          // commercial de l'établissement, sinon le sigle.
          nom_commercial:
            etablissement.liste_enseignes?.[0] ??
            etablissement.nom_commercial ??
            entreprise.sigle ??
            null,
          // Le métier RÉELLEMENT exercé par l'établissement retenu :
          // il peut différer de celui du siège (une entreprise de
          // maçonnerie dont l'agence d'Écully fait de la plomberie).
          // À défaut, celui de l'entreprise ; à défaut, le code demandé.
          code_naf:
            etablissement.activite_principale ??
            entreprise.activite_principale ??
            offre.code,
          // Le libellé vient de NOTRE liste (src/config/roswel.ts) :
          // toujours le même mot pour le même code, quelle que soit la
          // façon dont l'annuaire l'écrit.
          libelle_naf: offre.libelle,
          date_creation_entreprise: dateOuNull(entreprise.date_creation),
          etat_administratif: entreprise.etat_administratif,
          adresse: etablissement.adresse ?? null,
          ville_code_insee: commune.code_insee,
          ville_nom: commune.nom,
          ville_code_postal:
            etablissement.code_postal ?? commune.codes_postaux?.[0] ?? null,
          latitude: nombreOuNull(etablissement.latitude) ?? commune.latitude,
          longitude: nombreOuNull(etablissement.longitude) ?? commune.longitude,
        };

        // -- Déjà collectée ? --
        const { data: existant, error: erreurLecture } = await supabase
          .from("artisans_prospects")
          .select("id, sources, statut")
          .eq("siren", siren)
          .maybeSingle();
        if (erreurLecture) throw new Error(erreurLecture.message);

        if (existant) {
          await mettreAJourDonneesSirene(
            supabase,
            existant.id as string,
            (existant.sources as string[] | null) ?? [],
            donnees
          );
          compteurs.misesAJour += 1;
          resume.push({
            entreprise: nomLisible,
            siren,
            action: "mise à jour",
            detail: `données Sirene rafraîchies (statut « ${existant.statut} » conservé)`,
          });
          continue;
        }

        // -- Nouvelle ligne : rattachement éventuel à une fiche --
        const fiche = await rechercherFicheExistante(supabase, siren);
        const nouvelle: Record<string, unknown> = {
          ...donnees,
          source: "sirene",
          sources: ["sirene"],
          metiers: offre.metiers,
          statut: STATUT_INITIAL,
        };
        let action: LigneResume["action"] = "créée";
        let detail = "à démarcher — e-mail à trouver";

        if (fiche.cas === "une") {
          nouvelle.statut = "compte_cree";
          nouvelle.artisan_id = fiche.artisanId;
          nouvelle.compte_cree_le = fiche.creeLe;
          action = "rattachée";
          detail = `déjà inscrit sur Roswel (fiche « ${fiche.nom} ») — aucun démarchage`;
        } else if (fiche.cas === "plusieurs") {
          // On ne devine pas : l'admin tranchera.
          nouvelle.notes_admin =
            `⚠ ${fiche.combien} fiches partagent ce SIREN (${fiche.noms}) : ` +
            "rattachement à faire à la main.";
          detail = `${fiche.combien} fiches partagent ce SIREN — rattachement à trancher`;
        }

        const { error: erreurEcriture } = await supabase
          .from("artisans_prospects")
          .insert(nouvelle);
        if (erreurEcriture) throw new Error(erreurEcriture.message);

        compteurs.creees += 1;
        if (action === "rattachée") compteurs.rattachements += 1;
        resume.push({ entreprise: nomLisible, siren, action, detail });
      } catch (e) {
        compteurs.erreurs += 1;
        resume.push({
          entreprise: nomLisible,
          siren: siren || "—",
          action: "erreur",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Y a-t-il une page suivante ? L'annuaire l'annonce
    // (`total_pages`) ; s'il ne le dit pas, on continue tant que les
    // pages reviennent PLEINES.
    const totalPages = resultat.donnees.total_pages;
    const encore =
      totalPages != null
        ? page < totalPages
        : entreprises.length === COLLECTE_SIRENE.taillePage;
    if (!encore) break;
    page += 1;
  }

  // ----- 4. Le compte rendu -----
  const entete = `${offre.libelle} à ${commune.nom} :`;
  const chiffres =
    `${compteurs.examinees} entreprise(s) examinée(s) — ` +
    `${compteurs.creees} créée(s)` +
    (compteurs.rattachements > 0
      ? ` (dont ${compteurs.rattachements} déjà inscrite(s))`
      : "") +
    `, ${compteurs.misesAJour} mise(s) à jour, ` +
    `${compteurs.ignorees} ignorée(s), ${compteurs.erreurs} erreur(s).`;

  const message = messageArret
    ? `${entete} collecte ARRÊTÉE — ${messageArret} ${chiffres} ` +
      "Les lignes déjà enregistrées sont conservées."
    : `${entete} ${chiffres}` +
      (compteurs.examinees >= plafond
        ? ` Plafond de ${plafond} atteint : relancer pour la suite.`
        : "");

  return {
    ok: !messageArret,
    message,
    compteurs,
    interrompue,
    resume,
  };
}
