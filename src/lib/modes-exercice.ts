import {
  genreMode,
  libelleRoleCourt,
  libelleRoleStudio,
  type GenreMode,
  type RoleStudio,
} from "@/config/tatouage";
import type { Plage, SemaineStudio } from "@/lib/horaires-studio";
import type { LieuTrouve } from "@/lib/geocodage/types";
import { ligneCarte, ligneFiche } from "@/lib/adresse";

/**
 * LES MODES D'EXERCICE, LES STUDIOS ET LES ÉQUIPES
 * ================================================
 * UN SEUL endroit décrit ce qu'est un mode d'exercice, ce qu'est un
 * studio, et comment l'un et l'autre se donnent à lire. Le formulaire,
 * la fiche pleine page, la fenêtre superposée et la recherche
 * géographique lisent tous ces fonctions — jamais leur propre version.
 *
 * TROIS IDÉES, ET TOUT EN DÉCOULE
 * --------------------------------
 * 1. UN MODE EST UNE LIGNE, PAS UNE CASE. Un artiste en déclare
 *    autant qu'il veut, du même genre ou non : résident à Lyon, guest
 *    à Paris en septembre, chez lui le reste du temps.
 * 2. UN MODE SITUE TOUJOURS QUELQUE CHOSE — soit un SALON INSCRIT
 *    (`salon_id`, et l'on affiche son nom et son logo, cliquables),
 *    soit un POINT saisi à la main. L'adresse est recopiée dans les
 *    deux cas : la fiche reste lisible même si le salon disparaît.
 * 3. UNE SESSION GUEST EXPIRE TOUTE SEULE. Sa date de fin est
 *    comparée à AUJOURD'HUI à chaque lecture — aucune tâche
 *    planifiée, aucun risque d'oubli. Passée cette date, le bloc
 *    disparaît de la fiche ET l'artiste sort de l'équipe du salon.
 *
 * LA VIE PRIVÉE DU MODE « À DOMICILE »
 * -------------------------------------
 * L'artiste saisit ce qu'il veut : une ville, ou son adresse
 * complète. Il choisit sa précision. Mais l'affichage public NE
 * MONTRE JAMAIS la rue — seulement la ville et le code postal.
 * L'adresse exacte reste en base : elle sert au référencement
 * géographique (on est trouvable près de chez soi), pas à l'affichage.
 * C'est `libelleLieuDuMode` qui tient cette promesse, à un seul
 * endroit — impossible de l'oublier ailleurs.
 */

/** UN MODE D'EXERCICE, tel qu'il vit en base et à l'écran. */
export type ModeExerciceFiche = {
  id: string;
  genre: GenreMode;
  /** EN STUDIO seulement — fondateur du lieu, ou résident. Obligatoire
      pour ce genre-là ; toujours null pour les autres. */
  role: RoleStudio | null;
  /** GUEST seulement — la nature du lieu qui accueille : un SALON ou
      un STUDIO PRIVÉ (migration nº 41). FACULTATIF DANS LE TYPE, et
      c'est voulu : la colonne peut manquer sur une base où la
      migration n'est pas passée, et le site doit continuer de lire
      les fiches sans elle. */
  nature_lieu?: "salon" | "prive" | null;
  /** À DOMICILE seulement — le rayon de déplacement en kilomètres
      (migration nº 40). Facultatif pour la même raison. */
  rayon_km?: number | null;
  /** La fiche SALON liée, quand elle existe (recherche interne). */
  salon_id: string | null;
  /** Le nom et le slug du salon lié — recopiés à la lecture pour que
      l'affichage n'ait pas besoin d'une deuxième requête. */
  salon_nom?: string | null;
  salon_slug?: string | null;
  salon_photo?: string | null;
  intitule: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  region: string | null;
  pays: string | null;
  code_pays: string | null;
  latitude: number | null;
  longitude: number | null;
  lieu_id: string | null;
  /** GUEST seulement — bornes de la session, au format « AAAA-MM-JJ ». */
  debut_le: string | null;
  fin_le: string | null;
  ordre: number;
};

/** UN STUDIO — une adresse d'enseigne. */
export type StudioFiche = {
  id: string;
  /** Le nom de CE studio ; vide, on reprend celui de l'enseigne. */
  nom: string | null;
  intitule: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  region: string | null;
  pays: string | null;
  code_pays: string | null;
  latitude: number;
  longitude: number;
  lieu_id: string | null;
  /** Le studio porté par la fiche elle-même. Un seul par fiche. */
  principal: boolean;
  ordre: number;
  /** LES HORAIRES D'OUVERTURE — sept jours, 0 à 2 plages chacun.
      Facultatifs : `null` quand rien n'a été renseigné. CHAQUE studio
      a les siens (voir lib/horaires-studio). */
  horaires: Plage[][] | null;
  /** Le fuseau horaire du studio, déduit de son adresse au moment de
      l'enregistrement. C'est LUI qui décide de « ouvert maintenant ». */
  fuseau: string | null;
};

/** UN MEMBRE D'ÉQUIPE, tel que la fiche d'un salon l'affiche. */
export type MembreEquipe = {
  artiste_id: string;
  nom: string;
  slug: string | null;
  photo: string | null;
  /** « salon » = résident ; « guest » = invité, avec ses dates. */
  genre: GenreMode;
  /** FONDATEUR OU RÉSIDENT (nº 222-§4) — recopié du mode d'exercice
      qui porte la liaison. `null` quand la liaison n'en pend à aucun
      (une invitation partie DU SALON) : c'est alors un résident, par
      construction — voir `roleDuMembre`. */
  role?: RoleStudio | null;
  debut_le: string | null;
  fin_le: string | null;
};

/** UNE DEMANDE DE RATTACHEMENT, en attente de réponse. */
export type LiaisonDemande = {
  id: string;
  artiste_id: string;
  salon_id: string;
  mode_id: string | null;
  origine: "artiste" | "salon";
  statut: "demande" | "validee" | "refusee";
  demandee_le: string;
};

/* ================================================================
 * LE TEMPS QUI PASSE
 * ================================================================ */

/** AUJOURD'HUI, au format « AAAA-MM-JJ » — le même que les dates de
    session. Comparer deux chaînes dans ce format, c'est comparer deux
    dates : pas de fuseau horaire, pas de surprise. */
export function aujourdhui(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

/** UNE SESSION EST-ELLE TERMINÉE ? La date de fin est INCLUSE : on est
    encore guest le dernier jour annoncé. */
export function modeExpire(mode: ModeExerciceFiche): boolean {
  return Boolean(mode.fin_le) && mode.fin_le! < aujourdhui();
}

/** LES MODES À AFFICHER — les sessions terminées disparaissent
    d'elles-mêmes, dans l'ordre déclaré par l'artiste. */
export function modesActifs(
  modes: ModeExerciceFiche[] | null | undefined
): ModeExerciceFiche[] {
  return (modes ?? [])
    .filter((mode) => !modeExpire(mode))
    .sort((a, b) => a.ordre - b.ordre);
}

/**
 * UNE LIGNE DE LA VUE `equipe_salon`, ramenée au membre qu'on affiche.
 * ⚠️ ÉCRITE UNE SEULE FOIS, et lue des deux côtés : la fiche publique
 * (serveur) et l'aperçu du salon (navigateur). Deux traductions
 * séparées auraient fini par diverger — et l'aperçu aurait montré
 * autre chose que la vraie page, ce qui est le pire défaut d'un
 * aperçu.
 * LE GENRE ABSENT VAUT « salon » : une invitation partie DU SALON ne
 * pend à aucun mode d'exercice (`mode_id` est null), donc à aucune
 * date — c'est un résident, et il ne périme pas.
 */
export function membreDepuisVue(ligne: {
  artiste_id: string;
  artiste_nom: string;
  artiste_slug: string | null;
  artiste_photo: string | null;
  genre: string | null;
  /** ⚠️ FACULTATIF : la vue ne le rend que depuis la migration nº 65.
      Sans lui, `roleDuMembre` répond « résident », qui est la valeur
      d'une liaison sans mode — jamais un fondateur inventé. */
  role?: string | null;
  debut_le: string | null;
  fin_le: string | null;
}): MembreEquipe {
  return {
    artiste_id: ligne.artiste_id,
    nom: ligne.artiste_nom,
    slug: ligne.artiste_slug,
    photo: ligne.artiste_photo,
    genre: ligne.genre === "guest" ? "guest" : "salon",
    role: ligne.role === "fondateur" ? "fondateur" : "resident",
    debut_le: ligne.debut_le,
    fin_le: ligne.fin_le,
  };
}

/**
 * LE RÔLE D'UN MEMBRE, EN UN MOT — « Fondateur », « Résident »,
 * « Guest » (nº 222-§4).
 * Un invité est un invité : son rôle dans le lieu est sa session, pas
 * une place. Les autres portent celui de leur mode d'exercice, et à
 * défaut « Résident » — une liaison partie du salon ne pend à aucun
 * mode, donc à aucun rôle, et c'est bien un résident.
 */
export function roleDuMembre(membre: MembreEquipe): string {
  if (membre.genre === "guest") return "Guest";
  return libelleRoleCourt(membre.role) || libelleRoleCourt("resident");
}

/**
 * L'ÉQUIPE DANS SON ORDRE (nº 222-§4) : tous les fondateurs, puis tous
 * les résidents, puis les guests — ceux-ci du plus proche au plus
 * lointain, par date de début. Un ordre imposé, écrit une seule fois :
 * la page et la fenêtre superposée le lisent toutes les deux.
 */
export function equipeOrdonnee(
  equipe: MembreEquipe[] | null | undefined
): MembreEquipe[] {
  const rang = (membre: MembreEquipe) =>
    membre.genre === "guest" ? 2 : membre.role === "fondateur" ? 0 : 1;
  return membresActifs(equipe)
    .slice()
    .sort((a, b) => {
      const ecart = rang(a) - rang(b);
      if (ecart !== 0) return ecart;
      if (rang(a) === 2) {
        //  Les guests : la session la plus proche d'abord.
        return (a.debut_le ?? "").localeCompare(b.debut_le ?? "");
      }
      return a.nom.localeCompare(b.nom, "fr");
    });
}

/** LES MEMBRES D'ÉQUIPE ENCORE VALABLES — même règle, côté salon. */
export function membresActifs(
  membres: MembreEquipe[] | null | undefined
): MembreEquipe[] {
  const jour = aujourdhui();
  return (membres ?? []).filter((m) => !m.fin_le || m.fin_le >= jour);
}

/** « 01/09 » — le format court des dates de session, celui de la
    demande : jour et mois, sans l'année qui n'apprend rien. */
export function dateCourte(iso: string | null): string {
  if (!iso) return "";
  const [, mois, jour] = iso.split("-");
  return mois && jour ? `${jour}/${mois}` : iso;
}

/**
 * « 18 septembre 2026 » — la date en toutes lettres (nº 222-§4/§5).
 * Les deux bornes d'une session guest s'écrivent ainsi, sur deux
 * lignes : c'est un engagement de plusieurs semaines, pas un horaire.
 * Rendu SANS `Intl` sur un objet Date construit à la volée : la chaîne
 * « AAAA-MM-JJ » est déjà une date civile, sans fuseau — la relire
 * comme un instant la décalerait d'un jour selon l'endroit du monde.
 */
const MOIS_EN_TOUTES_LETTRES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function dateLongue(iso: string | null | undefined): string {
  if (!iso) return "";
  const [annee, mois, jour] = iso.split("-");
  const nom = MOIS_EN_TOUTES_LETTRES[Number(mois) - 1];
  if (!annee || !nom || !jour) return iso;
  //  « 1er septembre », comme on l'écrit en français.
  const quantieme = Number(jour) === 1 ? "1er" : String(Number(jour));
  return `${quantieme} ${nom} ${annee}`;
}

/** « (du 01/09 au 15/09) » — la parenthèse d'une session guest. */
export function periodeCourte(mode: {
  debut_le: string | null;
  fin_le: string | null;
}): string {
  if (!mode.debut_le || !mode.fin_le) return "";
  return `(du ${dateCourte(mode.debut_le)} au ${dateCourte(mode.fin_le)})`;
}

/* ================================================================
 * CE QUI S'ÉCRIT SUR LA FICHE
 * ================================================================ */

/**
 * LE LIEU D'UN MODE, TEL QU'IL S'AFFICHE.
 * ⚠️ LE MODE « À DOMICILE » NE MONTRE JAMAIS LA RUE — c'est ici, et
 * nulle part ailleurs, que cette promesse est tenue. L'adresse exacte
 * reste en base pour le référencement géographique, elle ne sort pas
 * d'ici.
 *
 * ⚠️ PLUS DE CODE POSTAL À L'AFFICHAGE (passe nº 114), et plus de
 * région hors des pays qui l'écrivent : la règle est celle de
 * lib/adresse, la même que sur les cartes et les fiches.
 *   · à domicile / studio privé → « Lyon, France » ;
 *   · en salon / en guest      → « 12 rue de la Paix, Lyon, France ».
 */
export function libelleLieuDuMode(mode: ModeExerciceFiche): string {
  const lieu = {
    ville: mode.ville ?? mode.intitule,
    region: mode.region,
    pays: mode.pays,
    code_pays: mode.code_pays,
  };
  // ⚠️ LES DEUX MODES SANS VITRINE — « à domicile » et « studio
  // privé » — ne montrent JAMAIS la rue. La promesse vaut pour les
  // deux : un studio privé est privé, c'est tout son sens.
  if (mode.genre === "domicile" || mode.genre === "prive") {
    return ligneCarte(lieu);
  }
  return ligneFiche({ ...lieu, adresse: mode.adresse });
}

/**
 * §6 · LE SECTEUR D'UN MODE « À DOMICILE », avec son rayon :
 * « Lyon, France · Rayon 200 km ».
 * ⚠️ « SECTEUR », PAS « ZONE » : le mot `zone` a désigné jusqu'à la
 * migration nº 48 les ZONES DU CORPS du portfolio, abandonnées depuis.
 * Le reprendre ici pour un secteur géographique rouvrirait une
 * confusion qu'une passe entière a servi à fermer — et c'est déjà le
 * mot que la fiche emploie (« Private / Secteur : … »).
 * ⚠️ PAS DE RAYON AUTOUR D'UN ÉTAT NI D'UN PAYS : « FL, États-Unis »
 * s'affiche seul. Un cercle autour du centre d'un pays ne veut rien
 * dire — c'est exactement le bug corrigé à la passe nº 69, et la
 * règle vaut aussi ici.
 */
export function libelleSecteurDuMode(mode: ModeExerciceFiche): string {
  const lieu = {
    ville: mode.ville ?? mode.intitule,
    region: mode.region,
    pays: mode.pays,
    code_pays: mode.code_pays,
  };
  const ligne = ligneCarte(lieu);
  const rayon = mode.rayon_km ?? 0;
  //  Sans ville, le lieu est une division ou un pays : aucun rayon.
  if (!lieu.ville || rayon <= 0) return ligne;
  return `${ligne} · Rayon ${rayon} km`;
}

/**
 * LA LIGNE COMPLÈTE D'UN MODE — ce que l'œil lit, de gauche à droite.
 * Cinq cas, exactement ceux du cahier des charges :
 *   · salon lié      → « Résident chez X — 12 rue de la Paix, Lyon »
 *   · salon à la main → « Artiste en studio fixe — 12 rue…, 69000 Lyon »
 *   · guest lié      → « En Guest chez X (du 01/09 au 15/09) — 45 av… »
 *   · guest à la main → « En session Guest à Paris (du…) — 45 av… »
 *   · domicile       → « Private / Secteur : Lyon (69000) »
 * `nomSalon` est renvoyé à part : c'est LUI, et lui seul, qui devient
 * cliquable — le reste de la ligne est du texte brut.
 */
export function ligneDuMode(mode: ModeExerciceFiche): {
  avant: string;
  nomSalon: string | null;
  apres: string;
} {
  const genre = genreMode(mode.genre);
  const lie = Boolean(mode.salon_id && mode.salon_nom);
  const lieu = libelleLieuDuMode(mode);

  if (mode.genre === "domicile" || mode.genre === "prive") {
    //  ⚠️ LE MODE « À DOMICILE » DIT SA ZONE ET SON RAYON (passe
    //  nº 114) : « Lyon, France · Rayon 200 km ». C'est l'information
    //  qui compte pour qui cherche quelqu'un qui se déplace — sans
    //  elle, une ville seule laisse croire qu'il ne bouge pas.
    const secteur =
      mode.genre === "domicile" ? libelleSecteurDuMode(mode) : lieu;
    return { avant: `${genre.phrase} ${secteur}`, nomSalon: null, apres: "" };
  }

  // EN STUDIO : le RÔLE précède le reste — « Fondateur de », « Résident
  // chez ». C'est la première chose qu'on veut savoir d'un artiste
  // rattaché à un lieu, et elle manquait.
  if (mode.genre === "salon" && mode.role === "fondateur") {
    const queueF = lieu ? `— ${lieu}` : "";
    if (lie) {
      return {
        avant: "Fondateur de ",
        nomSalon: mode.salon_nom ?? "",
        apres: queueF ? ` ${queueF}` : "",
      };
    }
    return {
      avant: "Fondateur de son studio",
      nomSalon: null,
      apres: queueF ? ` ${queueF}` : "",
    };
  }

  const periode = mode.genre === "guest" ? periodeCourte(mode) : "";
  const queue = [periode, lieu ? `— ${lieu}` : ""]
    .filter(Boolean)
    .join(" ");

  if (lie) {
    return {
      avant: `${genre.phraseLiee} `,
      nomSalon: mode.salon_nom ?? "",
      apres: queue ? ` ${queue}` : "",
    };
  }
  // À la main : « En session Guest à Paris », « Artiste en studio fixe ».
  const ou =
    mode.genre === "guest" && mode.ville ? ` ${mode.ville}` : "";
  return {
    avant: `${genre.phrase}${ou}`,
    nomSalon: null,
    apres: queue ? ` ${queue}` : "",
  };
}

/**
 * L'ORDRE IMPOSÉ DES PROFILS (passe nº 222-§1g)
 * ==================================================================
 * 1. À domicile   2. En studio   3. En salon   4. Guest
 * Il vaut PARTOUT où plusieurs profils se suivent : le sous-titre du
 * nom, la liste des profils d'un artiste, et tout ce qui viendra. Un
 * ordre écrit une seule fois ne peut pas diverger d'un écran à
 * l'autre. (Les slugs de genre ne sont pas les libellés : `prive`
 * s'affiche « En studio », `salon` s'affiche « En salon ».)
 */
const RANG_DU_GENRE: Record<string, number> = {
  domicile: 0,
  prive: 1,
  salon: 2,
  guest: 3,
};

export function modesOrdonnes(
  modes: ModeExerciceFiche[] | null | undefined
): ModeExerciceFiche[] {
  return modesActifs(modes)
    .slice()
    .sort((a, b) => {
      const ecart = (RANG_DU_GENRE[a.genre] ?? 9) - (RANG_DU_GENRE[b.genre] ?? 9);
      if (ecart !== 0) return ecart;
      //  Deux sessions guest : la plus proche d'abord.
      if (a.genre === "guest" && b.genre === "guest") {
        return (a.debut_le ?? "").localeCompare(b.debut_le ?? "");
      }
      return a.ordre - b.ordre;
    });
}

/**
 * CE QUI S'ÉCRIT SOUS LE NOM D'UN ARTISTE (passe nº 222-§1f)
 * ==================================================================
 * UN SEUL LIEU, UN SEUL RÔLE, RIEN D'AUTRE :
 *   « En salon · Résident », « En studio · Fondateur », « À domicile ».
 *
 * ⚠️ CE QUI EST SUPPRIMÉ, ET POURQUOI. On énumérait TOUS les genres
 * déclarés, séparés par des barres obliques — un artiste résident en
 * salon qui reçoit aussi chez lui affichait « En salon · Artiste
 * résident / À domicile ». Deux défauts en une ligne : un sous-titre
 * n'est pas un inventaire (la liste complète des profils est plus bas,
 * c'est sa place), et le rôle y était écrit dans sa forme longue, qui
 * répète le lieu qu'on vient de nommer.
 *
 * LEQUEL DES PROFILS ? Celui qui porte un RÔLE — c'est le seul qui
 * dise une place tenue quelque part. À défaut, le premier dans l'ordre
 * imposé. Sans aucun profil : « Artiste », comme avant (une fiche
 * neuve ne montre pas un vide sous son nom).
 */
export function sousTitreArtiste(
  modes: ModeExerciceFiche[] | null | undefined
): string {
  const ordonnes = modesOrdonnes(modes);
  if (ordonnes.length === 0) return "Artiste";
  const principal = ordonnes.find((mode) => mode.role) ?? ordonnes[0];
  const lieu = genreMode(principal.genre).label;
  const role = libelleRoleCourt(principal.role);
  return role ? `${lieu} · ${role}` : lieu;
}

/**
 * CE QUI REMPLACE LE MOT « ARTISTE » SOUS LE NOM.
 * Les genres déclarés, DANS L'ORDRE DE LA LISTE, sans doublon :
 * « En salon », « En salon / Guest », « Guest / À domicile ».
 * Aucun mode déclaré ? On retombe sur « Artiste » — une fiche neuve
 * ne doit pas afficher un vide sous son nom.
 */
export function libelleModesActifs(
  modes: ModeExerciceFiche[] | null | undefined
): string {
  const actifs = modesActifs(modes);
  if (actifs.length === 0) return "Artiste";
  const vus: string[] = [];
  for (const mode of actifs) {
    // « En studio » NE SUFFIT PLUS : le sous-choix vient s'y accoler,
    // séparé par un point médian — « En studio · Résident ». C'est la
    // moitié de l'information, et elle tient en un mot.
    const role =
      mode.genre === "salon" ? libelleRoleStudio(mode.role) : "";
    const label = role
      ? `${genreMode(mode.genre).label} · ${role}`
      : genreMode(mode.genre).label;
    if (!vus.includes(label)) vus.push(label);
  }
  return vus.join(" / ");
}

/* ================================================================
 * LA RECHERCHE GÉOGRAPHIQUE
 * ================================================================ */

/** UN POINT CHERCHABLE — la fiche en a autant que d'adresses. */
export type PointFiche = { latitude: number; longitude: number };

/**
 * TOUS LES POINTS D'UNE FICHE.
 * Une enseigne à Lyon ET à Paris doit sortir dans les deux
 * recherches ; un artiste résident à Lyon et guest à Paris en
 * septembre aussi. La recherche par rayon retient donc LE PLUS PROCHE
 * de ces points, jamais le seul point « historique » de la fiche.
 * Les sessions guest terminées n'en font pas partie : elles ne sont
 * plus vraies.
 */
export function pointsDeLaFiche(fiche: {
  latitude: number;
  longitude: number;
  modes?: ModeExerciceFiche[] | null;
  studios?: StudioFiche[] | null;
}): PointFiche[] {
  const points: PointFiche[] = [
    { latitude: fiche.latitude, longitude: fiche.longitude },
  ];
  for (const mode of modesActifs(fiche.modes)) {
    if (mode.latitude !== null && mode.longitude !== null) {
      points.push({ latitude: mode.latitude, longitude: mode.longitude });
    }
  }
  for (const studio of fiche.studios ?? []) {
    points.push({ latitude: studio.latitude, longitude: studio.longitude });
  }
  return points;
}

/**
 * TOUS LES LIEUX D'UNE FICHE, DÉCRITS — le pendant exact de la vue
 * `lieux_tatoueur` (migration nº 42).
 * ============================================================
 * ⚠️ ÉCRIT DEUX FOIS, EN SQL ET ICI, ET IL LE FAUT. La recherche se
 * fait EN BASE ; ce chemin-ci ne sert que lorsque la base est
 * injoignable (fiches de démonstration). Mais s'il répondait
 * autrement, la démonstration montrerait un autre site que le vrai —
 * c'est le pire défaut d'une démonstration. Les deux se relisent donc
 * ensemble : toute règle changée d'un côté doit l'être de l'autre.
 *
 * `rayonKm` ne vaut QUE pour « à domicile » : c'est la distance que
 * l'artiste accepte de parcourir autour de ce point. Un lieu ordinaire
 * est un point ; un lieu « à domicile » est un DISQUE.
 */
export type LieuDeFiche = {
  /** 0 = l'adresse de la fiche, 1 = un studio, 2 = un mode. Départage
      quand plusieurs lieux répondent : on montre le plus stable. */
  rang: number;
  latitude: number;
  longitude: number;
  ville: string | null;
  region: string | null;
  pays: string | null;
  codePays: string | null;
  adresse: string | null;
  codePostal: string | null;
  rayonKm: number;
};

export function lieuxDeLaFiche(fiche: {
  latitude: number;
  longitude: number;
  ville_nom?: string | null;
  region?: string | null;
  pays?: string | null;
  code_pays?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  modes?: ModeExerciceFiche[] | null;
  studios?: StudioFiche[] | null;
}): LieuDeFiche[] {
  const lieux: LieuDeFiche[] = [
    {
      rang: 0,
      latitude: fiche.latitude,
      longitude: fiche.longitude,
      ville: fiche.ville_nom ?? null,
      region: fiche.region ?? null,
      pays: fiche.pays ?? null,
      codePays: fiche.code_pays ?? null,
      adresse: fiche.adresse ?? null,
      codePostal: fiche.code_postal ?? null,
      rayonKm: 0,
    },
  ];
  for (const studio of fiche.studios ?? []) {
    lieux.push({
      rang: 1,
      latitude: studio.latitude,
      longitude: studio.longitude,
      ville: studio.ville,
      region: studio.region,
      pays: studio.pays,
      codePays: studio.code_pays,
      adresse: studio.adresse,
      codePostal: studio.code_postal,
      rayonKm: 0,
    });
  }
  //  LES SESSIONS GUEST TERMINÉES N'EN SONT PAS : `modesActifs` les
  //  écarte, exactement comme la vue `modes_exercice_actifs` en base.
  for (const mode of modesActifs(fiche.modes)) {
    if (mode.latitude === null || mode.longitude === null) continue;
    lieux.push({
      rang: 2,
      latitude: mode.latitude,
      longitude: mode.longitude,
      ville: mode.ville,
      region: mode.region,
      pays: mode.pays,
      codePays: mode.code_pays,
      adresse: mode.adresse,
      codePostal: mode.code_postal,
      rayonKm: mode.genre === "domicile" ? (mode.rayon_km ?? 0) : 0,
    });
  }
  return lieux;
}

/* ================================================================
 * CE QUE LE FORMULAIRE ENVOIE
 * ================================================================ */

/** Un mode en cours de saisie — l'identifiant est local tant que la
    fiche n'a pas été enregistrée. */
export type ModeEnSaisie = {
  /** Clé locale, stable le temps de la saisie (React en a besoin). */
  cle: string;
  /** L'identifiant EN BASE, quand la ligne y existe déjà. C'est lui
      qui permet de MODIFIER plutôt que d'effacer-recréer — et donc de
      ne pas détruire les liaisons validées à chaque enregistrement. */
  id?: string | null;
  /** LE GENRE, OU RIEN ENCORE. Depuis la refonte du bloc, un encadré
      s'ouvre AVANT qu'on ait choisi : les quatre modes sont dans
      l'encadré, pas dans un menu. Tant que rien n'est coché, le genre
      est vide — et le bloc 1 n'est pas complet (voir `modeComplet`). */
  genre: GenreMode | "";
  /** GUEST seulement — le lieu qui l'accueille est-il un SALON ou un
      STUDIO PRIVÉ ? Rien à voir avec le genre du mode (toujours
      « guest ») : c'est la nature de l'ÉTABLISSEMENT visité, la même
      distinction que `etablissement` sur une fiche de lieu. Null tant
      que le choix n'est pas fait — et le bloc 1 reste incomplet. */
  natureLieu?: "salon" | "prive" | null;
  /** À DOMICILE seulement — jusqu'où l'artiste se déplace autour de la
      ville choisie (10, 25, 50, 100 ou 200 km). Null ailleurs, et null
      tant qu'aucun rayon n'est choisi. */
  rayonKm?: number | null;
  /** EN STUDIO seulement — fondateur ou résident, obligatoire. */
  role?: RoleStudio | null;
  /** QUELLE DES DEUX RÉPONSES a été choisie : le studio est déjà sur
      yokofolio (« inscrit »), ou on saisit son adresse (« manuel »).
      Une seule question, une seule réponse — le champ de l'autre
      n'existe même pas à l'écran. */
  source?: "inscrit" | "manuel";
  /** Le salon inscrit choisi dans la recherche interne, s'il y en a —
      avec son adresse, qui situe le mode sans rien ressaisir. */
  salon: {
    id: string;
    nom: string;
    slug: string;
    photo: string | null;
    adresse?: string | null;
    code_postal?: string | null;
    ville?: string | null;
    region?: string | null;
    pays?: string | null;
    code_pays?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    lieu_id?: string | null;
  } | null;
  /** Le lieu Photon saisi à la main, s'il n'y a pas de salon. */
  lieu: LieuTrouve | null;
  /** §1 (nº 266) — LE NOM DU LIEU QUI N'EST PAS SUR YOKOFOLIO. Quand
      l'adresse est saisie à la main (le portfolio du lieu n'existe
      pas), un champ apparaît sous elle et demande comment ce lieu
      s'appelle — « Nom du salon » ou « Nom du studio ». Il est
      OBLIGATOIRE : sans lui, une adresse sur la fiche ne dit pas chez
      QUI l'on travaille (voir `modeComplet`).
      ⚠️ IL N'EXISTE QUE FACE À UNE ADRESSE SAISIE : un lieu trouvé
      par la recherche porte déjà son nom, celui de sa fiche — le
      champ disparaît alors avec l'adresse. */
  nomLieu?: string | null;
  debut_le: string;
  fin_le: string;
};

/** Un studio en cours de saisie (formulaire d'un salon). */
export type StudioEnSaisie = {
  cle: string;
  /** L'identifiant en base — même raison que pour les modes. */
  id?: string | null;
  /** « inscrit » = ce studio a déjà sa fiche (rien à ressaisir) ;
      « manuel » = on saisit son adresse ici. */
  source?: "inscrit" | "manuel";
  /** La fiche de studio trouvée dans la recherche interne, quand
      c'est la réponse choisie : c'est elle qui donne le nom, l'adresse
      et les coordonnées — rien à ressaisir. */
  fiche?: {
    id: string; nom: string; slug: string; ville_nom: string | null;
    photo_profil: string | null; adresse?: string | null;
    code_postal?: string | null; region?: string | null;
    pays?: string | null; code_pays?: string | null;
    latitude?: number | null; longitude?: number | null;
    lieu_id?: string | null;
  } | null;
  nom: string;
  lieu: LieuTrouve | null;
  /** LES HORAIRES D'OUVERTURE DE CE STUDIO — sept jours, 0 à 2 plages
      chacun. Facultatifs : une fiche sans horaires reste valide.
      CHAQUE studio a les siens : une enseigne à Lyon et à Bordeaux
      n'ouvre pas aux mêmes heures. */
  horaires?: SemaineStudio;
};

/** Une clé locale neuve — jamais deux fois la même dans une session. */
let compteurCle = 0;
export function cleNeuve(prefixe: string): string {
  compteurCle += 1;
  return `${prefixe}-${compteurCle}`;
}

/* ================================================================
 * LE BLOC 1 EST-IL REMPLI ? — LA RÈGLE, ÉCRITE UNE SEULE FOIS
 * ================================================================
 * ⚠️ CE BLOC A ÉTÉ REPRIS DEPUIS ZÉRO après un bug bloquant : le
 * bouton « Je confirme » restait éteint alors que le mode était
 * rempli, et plus aucune fiche ne pouvait être créée.
 *
 * LA CAUSE tenait en une phrase : la condition demandait des
 * COORDONNÉES au premier mode, et le chemin « le studio est déjà sur
 * yokofolio » — celui qui est coché PAR DÉFAUT — n'en produisait pas.
 * La recherche interne rend pourtant l'adresse et les coordonnées du
 * salon trouvé ; le formulaire n'en gardait que le nom et le logo.
 *
 * LA RÈGLE EST DONC ÉCRITE ICI, ET NULLE PART AILLEURS. Trois
 * fonctions, et tout en découle :
 *   · `pointDuMode`   — CE QUI PLACE un mode sur la carte ;
 *   · `modeComplet`   — un mode est-il renseigné ;
 *   · `blocExerciceComplet` — le bloc 1 entier, artiste ou salon.
 *
 * CE QUE « COMPLET » VEUT DIRE, MODE PAR MODE :
 *   · EN SALON   → un lieu, et un seul suffit : le STUDIO INSCRIT
 *     choisi dans la recherche, OU une adresse retenue dans la liste
 *     de suggestions. Aucune date.
 *   · GUEST      → le même lieu, PLUS deux dates cohérentes (la fin
 *     ne précède pas le début). Une session sans dates n'est pas une
 *     session.
 *   · À DOMICILE → une adresse (une ville suffit). Pas de studio
 *     inscrit : on ne devient pas résident de son propre salon.
 *   · SALON (la fiche) → l'adresse de son STUDIO PRINCIPAL, le
 *     premier de la liste. Les autres studios peuvent attendre.
 * ET DANS TOUS LES CAS : le lieu retenu doit porter des COORDONNÉES.
 * C'est ce qui place la fiche sur la carte ; sans elles, elle
 * n'existe pour personne.
 * ================================================================ */

/**
 * CE QUI PLACE UN MODE — les coordonnées, d'où qu'elles viennent.
 * Deux sources, et une seule à la fois :
 *  · le SALON INSCRIT choisi (ses coordonnées sont publiques : elles
 *    figurent déjà sur sa page) ;
 *  · le LIEU saisi et RETENU dans la liste Photon.
 * Rend null quand le mode n'est pas encore situé — c'est le cas
 * normal d'un mode qu'on vient d'ajouter, pas une anomalie.
 */
export function pointDuMode(mode: ModeEnSaisie): LieuTrouve | null {
  if (mode.lieu) return mode.lieu;
  const salon = mode.salon;
  if (salon && salon.latitude != null && salon.longitude != null) {
    return {
      identifiant: salon.lieu_id ?? `salon:${salon.id}`,
      intitule: salon.adresse ?? salon.nom,
      contexte: [salon.ville, salon.region, salon.pays]
        .filter(Boolean)
        .join(", "),
      adresse: salon.adresse ?? null,
      ville: salon.ville ?? null,
      code_postal: salon.code_postal ?? null,
      region: salon.region ?? null,
      pays: salon.pays ?? null,
      code_pays: salon.code_pays ?? null,
      latitude: salon.latitude,
      longitude: salon.longitude,
      precision: salon.adresse ? "adresse" : "ville",
    };
  }
  return null;
}

/**
 * CE MODE EST-IL ENCORE VIERGE ? — rien de SAISI dedans.
 * ⚠️ LE GENRE NE COMPTE PAS : depuis le sélecteur horizontal (passe
 * nº 124), regarder un onglet CRÉE un mode de ce genre — c'est le prix
 * d'un panneau toujours prêt à recevoir. Le rôle et la nature du lieu
 * non plus : ce sont des positions de bascule posées d'office, pas un
 * choix de la personne. Un mode vierge N'EST PAS UNE DÉCLARATION : la
 * validation l'ignore (voir `modesDeclares`), l'enregistrement aussi
 * (voir enregistrer-exercice) — visiter un onglet ne doit ni bloquer
 * « Je confirme », ni écrire une ligne en base.
 */
export function modeVide(mode: ModeEnSaisie): boolean {
  return (
    !mode.salon &&
    !mode.lieu &&
    !mode.debut_le &&
    !mode.fin_le &&
    mode.rayonKm == null &&
    //  §1 (nº 266) — un nom de lieu saisi est une saisie comme une
    //  autre : l'encadré n'est plus vierge.
    !(mode.nomLieu ?? "").trim()
  );
}

/**
 * LE NOM DU LIEU EST-IL EXIGIBLE SUR CE MODE ? (§1, nº 266)
 * ------------------------------------------------------------------
 * OUI quand les trois conditions tiennent :
 *  · le mode se passe CHEZ QUELQU'UN — un salon, un studio, un lieu
 *    de guest ; « à domicile » n'a pas de nom d'enseigne ;
 *  · le lieu N'EST PAS sur YokoFolio (aucune fiche retenue) — sinon
 *    son nom est déjà celui de sa fiche, et le champ n'existe pas ;
 *  · une adresse a été CHOISIE : le champ ne s'ouvre qu'après elle.
 * ⚠️ UNE SEULE ÉCRITURE : le formulaire l'interroge pour AFFICHER le
 * champ, `modeComplet` pour l'exiger et `premierManque` pour le
 * désigner — les trois ne peuvent pas diverger.
 */
export function nomLieuRequis(mode: ModeEnSaisie): boolean {
  if (mode.genre !== "salon" && mode.genre !== "prive" && mode.genre !== "guest") {
    return false;
  }
  if (mode.salon) return false;
  return Boolean(mode.lieu);
}

/** LES MODES QUI COMPTENT — ceux où quelque chose a été saisi. C'est
    sur EUX que portent la validation et l'enregistrement ; les
    encadrés vierges (un onglet ouvert par curiosité) n'existent pas. */
export function modesDeclares(modes: ModeEnSaisie[]): ModeEnSaisie[] {
  return modes.filter((mode) => !modeVide(mode));
}

/**
 * LE RAYON EST-IL EXIGIBLE sur ce mode « à domicile » ?
 * ⚠️ MÊME RÈGLE QUE SON AFFICHAGE (voir `leRayon` dans
 * BlocModesExercice) : un rayon n'a de sens qu'autour d'un POINT —
 * une ville ou une adresse. Autour d'une région ou d'un pays, le
 * sélecteur ne s'affiche même pas : exiger là ce qu'on ne montre pas
 * bloquerait sans rien désigner.
 */
export function rayonRequis(mode: ModeEnSaisie): boolean {
  if (mode.genre !== "domicile") return false;
  const precision = mode.lieu?.precision;
  return precision === "ville" || precision === "adresse";
}

/** CE MODE EST-IL COMPLET ? La règle est la même à l'écran et en
    base (voir la contrainte `modes_exercice_dates_coherentes`). */
export function modeComplet(mode: ModeEnSaisie): boolean {
  // RIEN DE COCHÉ : l'encadré est ouvert mais vide. Ce n'est pas une
  // anomalie — c'est l'état de départ depuis la refonte du bloc.
  if (!mode.genre) return false;
  // EN STUDIO SANS SOUS-CHOIX : la moitié de l'information manque.
  if (mode.genre === "salon" && !mode.role) return false;
  //  GUEST SANS NATURE DE LIEU : même chose. Tant qu'on ne sait pas si
  //  l'artiste est reçu par un SALON ou par un STUDIO PRIVÉ, les deux
  //  champs qui suivent posent une question sans sujet.
  if (mode.genre === "guest" && !mode.natureLieu) return false;
  if (!pointDuMode(mode)) return false;
  //  §1 (nº 266) — LE NOM DU LIEU EST OBLIGATOIRE quand l'adresse est
  //  saisie à la main : sans lui, la fiche dit OÙ l'on travaille sans
  //  dire CHEZ QUI. Un lieu trouvé par la recherche porte déjà le sien.
  if (nomLieuRequis(mode) && !(mode.nomLieu ?? "").trim()) return false;
  //  ⚠️ LE RAYON EST OBLIGATOIRE À DOMICILE (passe nº 124) : une ville
  //  sans rayon laissait croire que l'artiste ne bouge pas — et la
  //  recherche par distance n'avait rien à mesurer.
  if (rayonRequis(mode) && mode.rayonKm == null) return false;
  if (mode.genre !== "guest") return true;
  return Boolean(mode.debut_le && mode.fin_le && mode.fin_le >= mode.debut_le);
}

/**
 * LE LIEU DE RÉFÉRENCE DE LA FICHE — celui qui lui donne sa ville,
 * son adresse de page et sa place sur la carte.
 *  · SALON   → l'adresse du PREMIER studio ;
 *  · ARTISTE → le point du PREMIER MODE QUI EN A UN. On ne bloque pas
 *    sur le mode nº 1 : un artiste qui déclare d'abord une session
 *    guest sans lieu, puis son salon fixe, a bien une adresse — la
 *    lui refuser serait absurde.
 * Les autres adresses ne sont pas perdues : chacune devient un point
 * de recherche (voir `pointsDeLaFiche`). Ce lieu-ci ne décide que de
 * l'identité de la fiche.
 */
export function lieuDeReference(
  typeFiche: "artiste" | "salon" | null,
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[]
): LieuTrouve | null {
  if (typeFiche === "salon") return studios[0]?.lieu ?? null;
  for (const mode of modes) {
    const point = pointDuMode(mode);
    if (point) return point;
  }
  return null;
}

/** LE BLOC 1 EST-IL REMPLI ? C'est la condition du bouton « Je
    confirme », et EXACTEMENT celle de l'envoi du formulaire : deux
    règles différentes finiraient par se contredire. */
/**
 * ⚠️ UN SALON ET UN STUDIO PRIVÉ N'ONT PAS LA MÊME EXIGENCE D'ADRESSE.
 * ---------------------------------------------------------------------
 * · UN SALON reçoit du public : sans numéro ni rue, personne ne peut
 *   venir. Une VILLE SEULE est donc refusée — c'est une information,
 *   pas une adresse.
 * · UN STUDIO PRIVÉ reçoit sur rendez-vous, souvent chez lui, et NE
 *   SOUHAITE PAS publier son adresse. Lui imposer la rue le
 *   forcerait à mentir ou à renoncer. La ville suffit.
 * La même règle est écrite dans l'indication du champ (« Adresse
 * complète » / « Ville ou adresse complète ») : ce qu'on demande et
 * ce qu'on exige disent la même chose.
 */
export function adresseSuffisante(
  lieu: { precision?: string | null } | null | undefined,
  etablissement: string | null | undefined
): boolean {
  if (!lieu) return false;
  if (etablissement === "prive") {
    return lieu.precision === "adresse" || lieu.precision === "ville";
  }
  return lieu.precision === "adresse";
}

export function blocExerciceComplet(
  typeFiche: "artiste" | "salon" | null,
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[],
  etablissement?: string | null
): boolean {
  if (!typeFiche) return false;
  if (typeFiche === "salon") {
    return adresseSuffisante(studios[0]?.lieu, etablissement);
  }
  //  ⚠️ SEULS LES MODES DÉCLARÉS COMPTENT (passe nº 124) : ouvrir un
  //  onglet du sélecteur crée un encadré vierge, et un encadré vierge
  //  n'est pas une déclaration — il ne doit pas éteindre « Je
  //  confirme » pendant qu'un autre onglet porte un mode complet.
  const declares = modesDeclares(modes);
  return (
    declares.length > 0 &&
    declares.every(modeComplet) &&
    Boolean(lieuDeReference("artiste", declares, studios))
  );
}

/**
 * CE QUI MANQUE — DÉSIGNÉ, PAS RACONTÉ
 * =====================================
 * ⚠️ LE PAVÉ DE TEXTE A DISPARU DE L'ÉCRAN. L'encadré de confirmation
 * ne porte plus qu'une ligne et un bouton ; il n'y a donc plus de
 * place pour expliquer ce qui bloque — et c'était de toute façon une
 * mauvaise façon de le dire : on lit rarement un paragraphe rouge, on
 * regarde son formulaire.
 *
 * CETTE FONCTION REND DONC TROIS CHOSES, pas une phrase :
 *   · `cle`     — QUEL mode est en cause (le champ s'allume) ;
 *   · `champ`   — LEQUEL de ses champs (genre, rôle, lieu, dates) ;
 *   · `message` — une phrase courte, pour l'infobulle du bouton et
 *                 pour les lecteurs d'écran, qui n'ont pas la couleur.
 *
 * Elle rend `null` quand le bloc est complet.
 */
export type ManqueBloc = {
  /** La clé du mode en cause — null quand c'est le bloc entier. */
  cle: string | null;
  champ: "type" | "genre" | "role" | "lieu" | "nomLieu" | "rayon" | "dates";
  message: string;
};

export function premierManque(
  typeFiche: "artiste" | "salon" | null,
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[],
  etablissement?: string | null
): ManqueBloc | null {
  if (!typeFiche) {
    return {
      cle: null,
      champ: "type",
      message: "Choisis d'abord artiste ou salon.",
    };
  }
  if (typeFiche === "salon") {
    if (adresseSuffisante(studios[0]?.lieu, etablissement)) return null;
    //  ⚠️ DEUX MESSAGES, PARCE QUE DEUX RÈGLES. Dire « choisis une
    //  adresse » à un studio privé qui a saisi sa ville serait faux :
    //  la ville lui suffit. Ce qui lui manque, c'est d'avoir choisi
    //  DANS LA LISTE.
    return {
      cle: studios[0]?.cle ?? null,
      champ: "lieu",
      message:
        etablissement === "prive"
          ? "Choisis ta ville (ou ton adresse) DANS LA LISTE de suggestions."
          : "Choisis l'ADRESSE COMPLÈTE de ton salon DANS LA LISTE — une ville seule ne suffit pas.",
    };
  }
  //  ⚠️ MÊME FILTRE QUE `blocExerciceComplet` (passe nº 124) : un
  //  encadré vierge — l'onglet qu'on a ouvert sans rien y saisir —
  //  n'est pas un manque. Deux règles différentes finiraient par se
  //  contredire : l'une éteindrait le bouton, l'autre n'aurait rien à
  //  désigner.
  const declares = modesDeclares(modes);
  if (declares.length === 0) {
    //  RIEN DE SAISI NULLE PART. Si un onglet est déjà ouvert (un mode
    //  porte son genre), c'est SON lieu qu'on désigne — le champ
    //  rougit là où la personne se trouve. Sinon, c'est le sélecteur
    //  lui-même : les quatre mots rougissent.
    const ouvert = modes.find((mode) => mode.genre);
    if (ouvert) {
      return {
        cle: ouvert.cle,
        champ: "lieu",
        message: "Renseigne le lieu de ce mode.",
      };
    }
    return {
      cle: null,
      champ: "genre",
      message: "Choisis un mode d'activité.",
    };
  }
  for (const mode of declares) {
    if (!mode.genre) {
      return {
        cle: mode.cle,
        champ: "genre",
        message: "Choisis un mode d'activité parmi les quatre.",
      };
    }
    if (mode.genre === "salon" && !mode.role) {
      return {
        cle: mode.cle,
        champ: "role",
        message: "Précise si tu es fondateur ou résident du salon.",
      };
    }
    if (!pointDuMode(mode)) {
      //  ⚠️ LES PHRASES-CONSIGNES ONT DISPARU (passe nº 116). Les deux
      //  variantes qui apprenaient à « choisir dans la liste » ne
      //  s'affichent plus nulle part : le manque ENCADRE DE ROUGE les
      //  champs concernés (la recherche ET la saisie d'adresse), et
      //  c'est tout. Ce message-ci ne sert plus qu'à l'infobulle du
      //  bouton et aux lecteurs d'écran.
      return {
        cle: mode.cle,
        champ: "lieu",
        message: "Renseigne le lieu de ce mode.",
      };
    }
    //  §1 (nº 266) — LE NOM DU LIEU SAISI À LA MAIN. Même règle que
    //  les autres manques : le champ s'encadre de rouge, et cette
    //  phrase ne sert qu'à l'infobulle et aux lecteurs d'écran.
    if (nomLieuRequis(mode) && !(mode.nomLieu ?? "").trim()) {
      return {
        cle: mode.cle,
        champ: "nomLieu",
        message: "Donne le nom de ce lieu.",
      };
    }
    //  ⚠️ LE RAYON EST OBLIGATOIRE À DOMICILE (passe nº 124), mais
    //  seulement là où il s'affiche : autour d'une ville ou d'une
    //  adresse (voir `rayonRequis`). Les badges rougissent, et cette
    //  phrase ne sert qu'à l'infobulle et aux lecteurs d'écran.
    if (rayonRequis(mode) && mode.rayonKm == null) {
      return {
        cle: mode.cle,
        champ: "rayon",
        message: "Choisis ton rayon de déplacement.",
      };
    }
    if (mode.genre === "guest" && !(mode.debut_le && mode.fin_le)) {
      return {
        cle: mode.cle,
        champ: "dates",
        message: "Une session guest a besoin de ses deux dates.",
      };
    }
    if (
      mode.genre === "guest" &&
      mode.debut_le &&
      mode.fin_le &&
      mode.fin_le < mode.debut_le
    ) {
      return {
        cle: mode.cle,
        champ: "dates",
        message: "La date de fin précède la date de début.",
      };
    }
  }
  return null;
}

/** La même règle, ramenée à sa phrase — l'infobulle du bouton, et le
    message d'erreur de l'envoi du formulaire. */
export function raisonBlocIncomplet(
  typeFiche: "artiste" | "salon" | null,
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[],
  etablissement?: string | null
): string | null {
  return premierManque(typeFiche, modes, studios, etablissement)?.message ?? null;
}

/** Le lieu d'un mode en saisie, ramené aux colonnes de la base. */
export function colonnesDuLieu(lieu: LieuTrouve | null) {
  if (!lieu) return {};
  return {
    intitule: lieu.intitule,
    adresse: lieu.adresse ?? null,
    code_postal: lieu.code_postal ?? null,
    ville: lieu.ville ?? null,
    region: lieu.region ?? null,
    pays: lieu.pays ?? null,
    code_pays: lieu.code_pays ?? null,
    latitude: lieu.latitude,
    longitude: lieu.longitude,
    lieu_id: lieu.identifiant ?? null,
  };
}
