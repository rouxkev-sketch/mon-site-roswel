import {
  FORMES_JURIDIQUES,
  GOOGLE_PROSPECTS,
  METIERS,
} from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { URL_PLACES } from "@/lib/google-rafraichissement";

/**
 * RECHERCHE DES FICHES GOOGLE DES PROSPECTS
 * ------------------------------------------
 * Retrouve, pour chaque prospect collecté depuis l'annuaire Sirene,
 * sa fiche Google : note, nombre d'avis, site internet, téléphone.
 * C'est ce qui rend un prospect démarchable — sans site, pas
 * d'adresse e-mail à trouver.
 *
 * ⚠️ CET OUTIL COÛTE DE L'ARGENT. Google ne permet pas de fixer un
 * plafond de dépenses sur l'API Places : les garde-fous sont ICI, et
 * nulle part ailleurs.
 *   1. un prospect ayant déjà un identifiant Google est ignoré, sans
 *      le moindre appel ;
 *   2. deux appels au plus par prospect, et le second (le plus cher)
 *      n'est passé QUE si la correspondance est nette ;
 *   3. plafond dur d'appels par exécution
 *      (GOOGLE_PROSPECTS.appelsMaximumParExecution) ;
 *   4. arrêt immédiat après quelques échecs d'affilée — une clé
 *      invalide ne doit pas produire des centaines d'appels perdus ;
 *   5. le nombre d'appels RÉELLEMENT passés est compté, journalisé et
 *      affiché : c'est ce chiffre qui correspond à la facture.
 *
 * LE VRAI DANGER N'EST PAS LA FACTURE, C'EST LE FAUX RATTACHEMENT.
 * Google se trompe : « MAVIA DIAKITE (ASSAMARI) » peut renvoyer le
 * restaurant d'à côté. Un mauvais rattachement afficherait la note et
 * les avis de QUELQU'UN D'AUTRE sur une fiche Roswel — pire que pas
 * de rattachement du tout. On ne rattache donc que sur une
 * concordance NETTE du nom ET de l'adresse ; le doute part dans les
 * notes, pour arbitrage à la main.
 *
 * L'outil manuel /admin/avis-google (recherche, association et
 * rafraîchissement fiche par fiche, pour la table `artisans`) n'est
 * pas touché : il reste le recours au cas par cas.
 */

/* ------------------------------------------------------------------
 * Ce que renvoie la recherche
 * ------------------------------------------------------------------ */

export type LigneResumeGoogle = {
  entreprise: string;
  action:
    | "rattaché"
    | "proposition à valider"
    | "aucun résultat"
    | "erreur";
  detail: string;
};

export type CompteursGoogle = {
  examines: number;
  rattaches: number;
  propositions: number;
  aucunResultat: number;
  metiersConfirmes: number;
  erreurs: number;
  /** Appels RÉELLEMENT passés — c'est ce qui est facturé. */
  appelsRecherche: number;
  appelsDetails: number;
};

export type ResultatGoogleProspects = {
  ok: boolean;
  message: string;
  compteurs: CompteursGoogle;
  resume: LigneResumeGoogle[];
  /** Prospects sans fiche Google restant après cette exécution. */
  restants: number;
  interrompu: boolean;
};

/* ------------------------------------------------------------------
 * Les champs demandés à Google — et rien de plus
 * ------------------------------------------------------------------ */

/**
 * LA RECHERCHE : juste de quoi RECONNAÎTRE l'entreprise. Ni note, ni
 * avis, ni site à ce stade — ce sont les champs chers, et il serait
 * absurde de les payer pour une fiche qu'on va peut-être rejeter.
 */
const CHAMPS_RECHERCHE = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.primaryType",
  "places.types",
].join(",");

/**
 * LES DÉTAILS : uniquement ce qu'on enregistre. Chaque champ ajouté
 * peut faire changer de palier de facturation — ne rien ajouter ici
 * sans vérifier la grille tarifaire.
 */
const CHAMPS_DETAILS = [
  "rating",
  "userRatingCount",
  "websiteUri",
  "nationalPhoneNumber",
].join(",");

/* ------------------------------------------------------------------
 * Comparer deux noms, deux adresses
 * ------------------------------------------------------------------ */

/** Sans accents, sans ponctuation, sans majuscules. */
function simplifier(texte: string): string {
  return (texte ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Les mots utiles d'un nom : sans formes juridiques ni mots vides. */
function motsSignifiants(texte: string): string[] {
  const inutiles = new Set([
    ...FORMES_JURIDIQUES.map((f) => f.toLowerCase()),
    "et", "de", "du", "des", "la", "le", "les", "aux", "au", "en", "sur",
  ]);
  return simplifier(texte)
    .split(" ")
    .filter((mot) => mot.length >= 2 && !inutiles.has(mot));
}

/**
 * La ressemblance entre deux noms, de 0 à 1. On compare les MOTS, pas
 * les caractères : « DIAKITE MAVIA » et « Mavia Diakité Plomberie »
 * doivent se reconnaître, alors que l'ordre et les compléments
 * changent.
 */
export function ressemblanceNom(a: string, b: string): number {
  const motsA = new Set(motsSignifiants(a));
  const motsB = new Set(motsSignifiants(b));
  if (motsA.size === 0 || motsB.size === 0) return 0;
  let communs = 0;
  for (const mot of motsA) if (motsB.has(mot)) communs += 1;
  // Rapporté au nom le PLUS COURT : un nom Google très bavard ne doit
  // pas faire chuter la note d'une correspondance par ailleurs bonne.
  return communs / Math.min(motsA.size, motsB.size);
}

export type Prospect = {
  id: string;
  raison_sociale: string;
  nom_commercial: string | null;
  adresse: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  metiers: string[];
  metier_confirme?: boolean;
  notes_admin: string | null;
};

export type CandidatGoogle = {
  id: string;
  nom: string;
  adresse: string;
  typePrincipal: string | null;
  types: string[];
};

export type Correspondance = {
  points: number;
  niveau: "haute" | "moyenne" | "basse";
  explication: string;
};

/**
 * L'INDICE DE CONFIANCE, sur 100
 * -------------------------------
 *  - le NOM vaut 60 points (ressemblance des mots) ;
 *  - l'ADRESSE vaut 40 points : la commune (20), le code postal (10),
 *    le numéro de rue (10).
 *
 * RÈGLE DE SÛRETÉ : sans concordance géographique — ni commune, ni
 * code postal — la confiance est plafonnée à « moyenne », même avec
 * un nom parfait. Deux entreprises peuvent porter le même nom à
 * 400 km l'une de l'autre, et c'est exactement l'erreur qu'on ne veut
 * pas commettre.
 */
export function evaluerCorrespondance(
  prospect: Prospect,
  candidat: CandidatGoogle
): Correspondance {
  // ON COMPARE PLUSIEURS NOMS, ET ON GARDE LE MEILLEUR.
  // L'annuaire nomme un entrepreneur individuel « MAVIA DIAKITE
  // (ASSAMARI) » : son nom civil, puis son enseigne. Google, lui,
  // connaît « Assamari Plomberie » — l'ENSEIGNE. Comparer le nom
  // complet donnerait une ressemblance faible et ferait passer à côté
  // d'une correspondance pourtant évidente.
  // L'enseigne n'est retenue que si elle porte un mot d'au moins
  // quatre lettres : une enseigne de trois lettres se retrouverait
  // partout, et n'identifie personne.
  const enseigneEntreParentheses =
    prospect.raison_sociale.match(/\(([^()]+)\)/)?.[1] ?? null;
  const nomsAEssayer = [
    prospect.raison_sociale,
    prospect.nom_commercial,
    enseigneEntreParentheses,
  ].filter((nom): nom is string => {
    if (!nom) return false;
    return motsSignifiants(nom).some((mot) => mot.length >= 4);
  });

  const similarite = Math.max(
    0,
    ...nomsAEssayer.map((nom) => ressemblanceNom(nom, candidat.nom))
  );
  const pointsNom = Math.round(similarite * 60);

  const adresseGoogle = simplifier(candidat.adresse);
  const commune = prospect.ville_nom ? simplifier(prospect.ville_nom) : "";
  const codePostal = prospect.ville_code_postal ?? "";

  const memeCommune = Boolean(commune) && adresseGoogle.includes(commune);
  const memeCodePostal =
    Boolean(codePostal) && candidat.adresse.includes(codePostal);

  // Le numéro de rue : le signal le plus discriminant quand on l'a.
  const numero = prospect.adresse?.match(/^\s*(\d+)/)?.[1] ?? "";
  const memeNumero =
    Boolean(numero) && new RegExp(`(^|\\D)${numero}(\\D|$)`).test(candidat.adresse);

  const pointsAdresse =
    (memeCommune ? 20 : 0) + (memeCodePostal ? 10 : 0) + (memeNumero ? 10 : 0);

  const points = pointsNom + pointsAdresse;
  const geographieConcorde = memeCommune || memeCodePostal;

  let niveau: Correspondance["niveau"];
  if (points >= GOOGLE_PROSPECTS.confianceHaute && geographieConcorde) {
    niveau = "haute";
  } else if (points >= GOOGLE_PROSPECTS.confianceMoyenne) {
    niveau = "moyenne";
  } else {
    niveau = "basse";
  }

  const explication =
    `nom ${Math.round(similarite * 100)} %` +
    (memeCommune ? ", même commune" : ", commune différente") +
    (memeCodePostal ? ", même code postal" : "") +
    (memeNumero ? ", même numéro de rue" : "") +
    (!geographieConcorde && points >= GOOGLE_PROSPECTS.confianceHaute
      ? " — bloqué à « moyenne » faute de concordance géographique"
      : "");

  return { points, niveau, explication };
}

/* ------------------------------------------------------------------
 * Déduire le métier, quand c'est SANS AMBIGUÏTÉ
 * ------------------------------------------------------------------ */

const SLUGS_METIERS = new Set(METIERS.map((m) => m.slug));

/**
 * LE MÉTIER, SI GOOGLE LE DIT CLAIREMENT
 * ---------------------------------------
 * On regarde le type d'activité déclaré à Google et les mots du nom.
 * On ne conclut QUE si un seul et même métier ressort. « Plomberie
 * Chauffage Durand » désigne deux métiers : on ne touche à rien, et
 * la ligne reste « à déterminer ». Un métier faux est pire qu'un
 * métier absent.
 */
export function metierSelonGoogle(candidat: CandidatGoogle): string | null {
  const trouves = new Set<string>();

  const typesGoogle = [candidat.typePrincipal, ...(candidat.types ?? [])].filter(
    (t): t is string => Boolean(t)
  );
  for (const type of typesGoogle) {
    const metier = GOOGLE_PROSPECTS.typesGoogleVersMetier[type];
    if (metier && SLUGS_METIERS.has(metier)) trouves.add(metier);
  }

  for (const mot of simplifier(candidat.nom).split(" ")) {
    const metier = GOOGLE_PROSPECTS.motsClesMetier[mot];
    if (metier && SLUGS_METIERS.has(metier)) trouves.add(metier);
  }

  return trouves.size === 1 ? [...trouves][0] : null;
}

/* ------------------------------------------------------------------
 * Les appels à Google
 * ------------------------------------------------------------------ */

type ReponseRecherche =
  | { etat: "ok"; candidats: CandidatGoogle[] }
  | { etat: "echec"; message: string };

async function chercherFiche(
  requete: string,
  cle: string
): Promise<ReponseRecherche> {
  try {
    const reponse = await fetch(`${URL_PLACES}:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cle,
        "X-Goog-FieldMask": CHAMPS_RECHERCHE,
      },
      body: JSON.stringify({
        textQuery: requete,
        languageCode: "fr",
        regionCode: "FR",
        maxResultCount: GOOGLE_PROSPECTS.candidatsMaximum,
      }),
    });
    if (!reponse.ok) {
      return {
        etat: "echec",
        message:
          `Google a répondu « ${reponse.status} »` +
          (reponse.status === 403
            ? " — vérifier que l'API Places (New) est activée pour cette clé"
            : ""),
      };
    }
    const donnees = (await reponse.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        primaryType?: string;
        types?: string[];
      }>;
    };
    return {
      etat: "ok",
      candidats: (donnees.places ?? [])
        .filter((lieu) => Boolean(lieu.id))
        .map((lieu) => ({
          id: lieu.id as string,
          nom: lieu.displayName?.text ?? "",
          adresse: lieu.formattedAddress ?? "",
          typePrincipal: lieu.primaryType ?? null,
          types: lieu.types ?? [],
        })),
    };
  } catch (e) {
    return { etat: "echec", message: e instanceof Error ? e.message : String(e) };
  }
}

type DetailsGoogle = {
  note: number | null;
  avis: number;
  site: string | null;
  telephone: string | null;
  /** Compte Instagram, quand Google l'expose (voir estInstagram). */
  instagram: string | null;
};

/**
 * L'API Places (New) n'a AUCUN champ « réseaux sociaux ». Le seul cas
 * où Google donne l'Instagram d'une entreprise, c'est quand celle-ci
 * a déclaré sa page Instagram comme site internet — ce que font
 * beaucoup d'artisans qui n'ont pas de site. On le reconnaît, on le
 * range dans la bonne colonne, et surtout on ne l'enregistre PAS
 * comme un site internet : ce n'en est pas un.
 *
 * Aucun champ supplémentaire n'est demandé à Google : ce repérage ne
 * change donc pas le palier de facturation.
 */
export function estInstagram(adresse: string): boolean {
  try {
    return /(^|\.)instagram\.com$/i.test(new URL(adresse).hostname);
  } catch {
    return /(^|\/\/|\.)instagram\.com\//i.test(adresse);
  }
}

type ReponseDetails =
  | { etat: "ok"; details: DetailsGoogle }
  | { etat: "echec"; message: string };

async function lireDetails(
  placeId: string,
  cle: string
): Promise<ReponseDetails> {
  try {
    const reponse = await fetch(
      `${URL_PLACES}/${encodeURIComponent(placeId)}`,
      { headers: { "X-Goog-Api-Key": cle, "X-Goog-FieldMask": CHAMPS_DETAILS } }
    );
    if (!reponse.ok) {
      return { etat: "echec", message: `Google a répondu « ${reponse.status} »` };
    }
    const lieu = (await reponse.json()) as {
      rating?: number;
      userRatingCount?: number;
      websiteUri?: string;
      nationalPhoneNumber?: string;
    };
    const adresseWeb = lieu.websiteUri ?? null;
    const versInstagram = adresseWeb !== null && estInstagram(adresseWeb);
    return {
      etat: "ok",
      details: {
        note: lieu.rating ?? null,
        avis: lieu.userRatingCount ?? 0,
        // Une adresse Instagram n'est pas un site internet : elle part
        // dans sa propre colonne, et `site` reste vide.
        site: versInstagram ? null : adresseWeb,
        telephone: lieu.nationalPhoneNumber ?? null,
        instagram: versInstagram ? adresseWeb : null,
      },
    };
  } catch (e) {
    return { etat: "echec", message: e instanceof Error ? e.message : String(e) };
  }
}

/* ------------------------------------------------------------------
 * La recherche complète
 * ------------------------------------------------------------------ */

type ClientAdmin = ReturnType<typeof creerClientSupabaseAdmin>;

const COLONNES =
  "id, raison_sociale, nom_commercial, adresse, ville_nom, " +
  "ville_code_postal, metiers, metier_confirme, notes_admin";

/** Attente entre deux prospects. */
function attendre(millisecondes: number): Promise<void> {
  return new Promise((suite) => setTimeout(suite, millisecondes));
}

/** Ajoute une ligne aux notes, sans jamais effacer ce qui s'y trouve. */
function completerNotes(existantes: string | null, ajout: string): string {
  const base = (existantes ?? "").trim();
  return base ? `${base}\n${ajout}` : ajout;
}

/** Vrai si l'erreur vient d'une colonne pas encore créée. */
function colonneManquante(message: string, colonne: string): boolean {
  return message.includes(colonne);
}

/** Les prospects SANS fiche Google, dans le périmètre des filtres. */
async function prospectsSansGoogle(
  supabase: ClientAdmin,
  filtres: { statut?: string; metier?: string; commune?: string }
): Promise<{ liste: Prospect[]; sansColonneConfirme: boolean }> {
  const construire = (colonnes: string) => {
    let requete = supabase
      .from("artisans_prospects")
      .select(colonnes)
      .is("place_id_google", null)
      .order("raison_sociale", { ascending: true })
      .limit(5000);
    if (filtres.statut && filtres.statut !== "tous") {
      requete = requete.eq("statut", filtres.statut);
    }
    if (filtres.metier && filtres.metier !== "tous") {
      requete = requete.contains("metiers", [filtres.metier]);
    }
    if (filtres.commune && filtres.commune !== "toutes") {
      requete = requete.eq("ville_code_insee", filtres.commune);
    }
    return requete;
  };

  let { data, error } = await construire(COLONNES);
  let sansColonneConfirme = false;
  if (error && colonneManquante(error.message, "metier_confirme")) {
    sansColonneConfirme = true;
    ({ data, error } = await construire(COLONNES.replace(", metier_confirme", "")));
  }
  if (error) throw new Error(error.message);
  return {
    liste: (data ?? []) as unknown as Prospect[],
    sansColonneConfirme,
  };
}

/** Combien de prospects seraient traités — SANS aucun appel Google. */
export async function compterProspectsSansGoogle(filtres: {
  statut?: string;
  metier?: string;
  commune?: string;
}): Promise<number> {
  const supabase = creerClientSupabaseAdmin();
  const { liste } = await prospectsSansGoogle(supabase, filtres);
  return liste.length;
}

export async function chercherFichesGoogle({
  statut,
  metier,
  commune,
}: {
  statut?: string;
  metier?: string;
  commune?: string;
}): Promise<ResultatGoogleProspects> {
  const resume: LigneResumeGoogle[] = [];
  const compteurs: CompteursGoogle = {
    examines: 0,
    rattaches: 0,
    propositions: 0,
    aucunResultat: 0,
    metiersConfirmes: 0,
    erreurs: 0,
    appelsRecherche: 0,
    appelsDetails: 0,
  };
  const rien = (message: string): ResultatGoogleProspects => ({
    ok: false,
    message,
    compteurs,
    resume,
    restants: 0,
    interrompu: false,
  });

  const cle = process.env.GOOGLE_PLACES_API_KEY;
  if (!cle) {
    return rien(
      "Aucun appel : la clé GOOGLE_PLACES_API_KEY n'est pas renseignée dans .env.local."
    );
  }

  let supabase: ClientAdmin;
  let candidats: Prospect[];
  let sansMetierConfirme = false;
  try {
    supabase = creerClientSupabaseAdmin();
    const lecture = await prospectsSansGoogle(supabase, { statut, metier, commune });
    candidats = lecture.liste;
    sansMetierConfirme = lecture.sansColonneConfirme;
  } catch (e) {
    return rien(
      `Base injoignable : ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // Ces colonnes existent-elles ? On le découvre à la première
  // écriture, et on n'insiste pas ensuite.
  let sansGoogleConfirme = false;
  let sansInstagram = false;
  let echecsDAffilee = 0;
  let interrompu = false;
  let traites = 0;

  for (const [index, prospect] of candidats.entries()) {
    // ----- Les garde-fous, avant tout appel -----
    const appelsFaits = compteurs.appelsRecherche + compteurs.appelsDetails;
    if (appelsFaits >= GOOGLE_PROSPECTS.appelsMaximumParExecution) break;
    if (echecsDAffilee >= GOOGLE_PROSPECTS.echecsConsecutifsMaximum) {
      interrompu = true;
      break;
    }

    compteurs.examines += 1;
    traites = index + 1;
    if (index > 0) await attendre(GOOGLE_PROSPECTS.pauseMs);

    try {
      // ----- 1. La recherche (un appel, toujours) -----
      const requete = [
        prospect.raison_sociale,
        prospect.adresse ?? "",
        prospect.ville_code_postal ?? "",
        prospect.ville_nom ?? "",
      ]
        .filter(Boolean)
        .join(" ");

      const recherche = await chercherFiche(requete, cle);
      compteurs.appelsRecherche += 1;

      if (recherche.etat === "echec") {
        compteurs.erreurs += 1;
        echecsDAffilee += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "erreur",
          detail: recherche.message,
        });
        continue;
      }
      echecsDAffilee = 0;

      if (recherche.candidats.length === 0) {
        compteurs.aucunResultat += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "aucun résultat",
          detail: "Google ne connaît pas cette entreprise à cette adresse",
        });
        continue;
      }

      // Le meilleur candidat, et lui seul.
      const evalues = recherche.candidats
        .map((c) => ({ candidat: c, note: evaluerCorrespondance(prospect, c) }))
        .sort((a, b) => b.note.points - a.note.points);
      const meilleur = evalues[0];

      // ----- Confiance insuffisante : on n'écrit RIEN dans les
      // colonnes Google, et on ne paie PAS le second appel. -----
      if (meilleur.note.niveau !== "haute") {
        compteurs.propositions += 1;
        const proposition =
          `Proposition Google (confiance ${meilleur.note.niveau}, ` +
          `${meilleur.note.points}/100 — ${meilleur.note.explication}) : ` +
          `« ${meilleur.candidat.nom} », ${meilleur.candidat.adresse} ` +
          `[${meilleur.candidat.id}]. À valider ou rejeter à la main.`;
        const { error } = await supabase
          .from("artisans_prospects")
          .update({ notes_admin: completerNotes(prospect.notes_admin, proposition) })
          .eq("id", prospect.id);
        if (error) throw new Error(error.message);

        resume.push({
          entreprise: prospect.raison_sociale,
          action: "proposition à valider",
          detail: `« ${meilleur.candidat.nom} » — ${meilleur.note.explication}`,
        });
        continue;
      }

      // ----- 2. Les détails (le second appel, seulement ici) -----
      const details = await lireDetails(meilleur.candidat.id, cle);
      compteurs.appelsDetails += 1;

      if (details.etat === "echec") {
        compteurs.erreurs += 1;
        echecsDAffilee += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "erreur",
          detail: `fiche reconnue mais détails illisibles — ${details.message}`,
        });
        continue;
      }
      echecsDAffilee = 0;

      const aEcrire: Record<string, unknown> = {
        place_id_google: meilleur.candidat.id,
        note_google: details.details.note,
        nombre_avis_google: details.details.avis,
        date_maj_google: new Date().toISOString(),
      };
      // On ne remplace jamais un site ou un téléphone déjà connus :
      // ces colonnes ne sont écrites que si Google apporte l'information.
      if (details.details.site) aEcrire.site_internet = details.details.site;
      if (details.details.telephone) aEcrire.telephone = details.details.telephone;
      if (details.details.instagram && !sansInstagram) {
        aEcrire.lien_instagram = details.details.instagram;
      }
      if (!sansGoogleConfirme) aEcrire.google_confirme = true;

      // ----- Le métier, si Google le dit SANS AMBIGUÏTÉ -----
      let metierDeduit: string | null = null;
      if (!sansMetierConfirme && prospect.metier_confirme !== true) {
        metierDeduit = metierSelonGoogle(meilleur.candidat);
        if (metierDeduit) {
          aEcrire.metiers = [metierDeduit];
          aEcrire.metier_confirme = true;
        }
      }

      let { error } = await supabase
        .from("artisans_prospects")
        .update(aEcrire)
        .eq("id", prospect.id);

      // Migration pas encore passée : on réessaie sans la colonne.
      if (error && colonneManquante(error.message, "google_confirme")) {
        sansGoogleConfirme = true;
        delete aEcrire.google_confirme;
        ({ error } = await supabase
          .from("artisans_prospects")
          .update(aEcrire)
          .eq("id", prospect.id));
      }
      if (error && colonneManquante(error.message, "lien_instagram")) {
        sansInstagram = true;
        delete aEcrire.lien_instagram;
        ({ error } = await supabase
          .from("artisans_prospects")
          .update(aEcrire)
          .eq("id", prospect.id));
      }
      if (error) throw new Error(error.message);

      compteurs.rattaches += 1;
      if (metierDeduit) compteurs.metiersConfirmes += 1;
      const libelleMetier =
        METIERS.find((m) => m.slug === metierDeduit)?.label ?? null;
      resume.push({
        entreprise: prospect.raison_sociale,
        action: "rattaché",
        detail:
          `« ${meilleur.candidat.nom} » (${meilleur.note.points}/100) — ` +
          `note ${details.details.note ?? "—"}, ${details.details.avis} avis` +
          (details.details.site ? ", site trouvé" : "") +
          (details.details.instagram ? ", Instagram trouvé" : "") +
          (details.details.telephone ? ", téléphone trouvé" : "") +
          (libelleMetier ? `, métier confirmé : ${libelleMetier}` : ""),
      });
    } catch (e) {
      compteurs.erreurs += 1;
      resume.push({
        entreprise: prospect.raison_sociale,
        action: "erreur",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const appels = compteurs.appelsRecherche + compteurs.appelsDetails;
  const cout =
    compteurs.appelsRecherche * GOOGLE_PROSPECTS.coutRechercheEuro +
    compteurs.appelsDetails * GOOGLE_PROSPECTS.coutDetailsEuro;
  const restants = Math.max(0, candidats.length - traites);

  const message =
    (interrompu
      ? `ARRÊTÉ après ${GOOGLE_PROSPECTS.echecsConsecutifsMaximum} échecs d'affilée — ` +
        "vérifier la clé Google et le quota du compte. "
      : "") +
    `${compteurs.examines} prospect(s) examiné(s) — ` +
    `${compteurs.rattaches} rattaché(s) automatiquement, ` +
    `${compteurs.propositions} proposition(s) à valider dans les notes, ` +
    `${compteurs.aucunResultat} sans résultat` +
    (compteurs.erreurs > 0 ? `, ${compteurs.erreurs} erreur(s)` : "") +
    (compteurs.metiersConfirmes > 0
      ? `. ${compteurs.metiersConfirmes} métier(s) confirmé(s) par Google`
      : "") +
    `. ${appels} appel(s) Google passé(s) ` +
    `(${compteurs.appelsRecherche} recherche(s) + ${compteurs.appelsDetails} détail(s)), ` +
    `coût estimé ${cout.toFixed(2)} €.` +
    (restants > 0
      ? ` Il reste ${restants} prospect(s) sans fiche Google : relancer pour la suite.`
      : "") +
    (sansGoogleConfirme
      ? " ⚠ La colonne google_confirme n'existe pas encore (migration" +
        " supabase/prospection-google-confirme.sql à passer)."
      : "") +
    (sansInstagram
      ? " ⚠ La colonne lien_instagram n'existe pas encore (migration" +
        " supabase/prospection-instagram.sql à passer) : les comptes" +
        " Instagram trouvés n'ont pas été enregistrés."
      : "");

  return {
    ok: !interrompu,
    message,
    compteurs,
    resume,
    restants,
    interrompu,
  };
}
