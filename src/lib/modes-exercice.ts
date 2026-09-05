import {
  genreMode,
  libelleRoleCourt,
  libelleRoleStudio,
  //  nº 755 — le statut du mode « Autre » en toutes lettres : il monte
  //  sur la ligne du NOM de sa plaque (voir `lieuEnDeuxLignes`).
  libelleStatutIndependent,
  libelleStyle,
  type GenreMode,
  type RoleStudio,
  type StatutIndependent,
} from "@/config/tatouage";
import type { Plage, SemaineStudio } from "@/lib/horaires-studio";
import type { LieuTrouve } from "@/lib/geocodage/types";
import { ligneCarte, ligneCarteMobile, ligneFiche } from "@/lib/adresse";

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
 * LA VIE PRIVÉE DU MODE « DISPONIBLE » (nº 414 ; la règle vient du
 * mode « à domicile », supprimé à la nº 402)
 * -------------------------------------
 * L'artiste saisit ce qu'il veut : une ville, ou une adresse
 * complète. Il choisit sa précision. Mais l'affichage public NE
 * MONTRE JAMAIS la rue — seulement la ville. L'adresse exacte reste
 * en base : elle sert au référencement géographique (on est trouvable
 * près de chez soi), pas à l'affichage. C'est `libelleLieuDuMode` qui
 * tient cette promesse, à un seul endroit — impossible de l'oublier
 * ailleurs.
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
  /** LE RAYON DE DÉPLACEMENT en kilomètres — une zone INDEPENDENT
      (nº 749 ; colonne née pour « à domicile » nº 40, portée par
      « Disponible » nº 414, jamais supprimée). Facultatif pour la
      même raison que `nature_lieu`. */
  rayon_km?: number | null;
  /** INDEPENDENT seulement (nº 749) — le statut de l'artiste, un des
      cinq slugs de STATUTS_INDEPENDENT (la contrainte de base
      `modes_exercice_statut_connu` y veille ; null pour les autres
      genres). Répété sur chaque ligne de zone d'un même artiste —
      la lecture prend la première. FACULTATIF : la colonne peut
      manquer sur une base où la migration n'est pas passée, et le
      site doit continuer de lire les fiches sans elle. */
  statut?: StatutIndependent | null;
  /** CONVENTION seulement (nº 749) — le lien vers le catalogue
      (`conventions.id`), débranchable (`on delete set null`) : la
      localisation de la convention est RECOPIÉE sur la ligne à
      l'enregistrement, comme celle d'un salon lié — l'affichage ne
      dépend d'aucune jointure. Facultatif pour la même raison. */
  convention_id?: string | null;
  /** La fiche SALON liée, quand elle existe (recherche interne). */
  salon_id: string | null;
  /** Le nom et le slug du salon lié — recopiés à la lecture pour que
      l'affichage n'ait pas besoin d'une deuxième requête. */
  salon_nom?: string | null;
  salon_slug?: string | null;
  salon_photo?: string | null;
  /**
   * §3 (nº 286) — LE NOM DU LIEU SAISI À LA MAIN, et voici pourquoi il
   * manquait ici.
   * ------------------------------------------------------------------
   * La colonne `modes_exercice.nom_lieu` existe depuis la nº 266 et le
   * formulaire l'ÉCRIT correctement (voir `enregistrer-exercice`, elle
   * est même obligatoire quand le lieu n'a pas de portfolio). Mais ce
   * type-ci — celui que LIT la fiche publique — ne l'a jamais déclarée.
   * La lecture faisait donc `salon_nom ?? intitule` : sans salon lié,
   * elle prenait `intitule`, qui est L'ADRESSE du lieu. D'où le relevé
   * du propriétaire : « Résident : 44 Rue Trousseau · 44 Rue
   * Trousseau, Paris, France » — l'adresse écrite DEUX FOIS, à la
   * place d'un nom qui, lui, était bien en base.
   * ⚠️ FACULTATIF, comme `nature_lieu` et `rayon_km` : sur une base où
   * la migration nº 266 n'est pas passée, la colonne manque et la
   * lecture doit continuer de fonctionner.
   */
  nom_lieu?: string | null;
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
  /**
   * §1 (nº 410) — L'IDENTITÉ D'UNE LIGNE, ET NON D'UNE PERSONNE.
   * ------------------------------------------------------------------
   * UN MÊME ARTISTE PEUT AVOIR DEUX LIGNES chez un même lieu : résident
   * ET guest, deux modes distincts. `artiste_id` ne suffit donc plus à
   * les distinguer — ni pour la clé de liste à l'écran, ni pour savoir
   * à laquelle rattacher quelle déclaration.
   * ⚠️ FACULTATIF, comme toutes les colonnes récentes : la vue ne rend
   * `liaison_id` que depuis la migration nº 410. Sans elle, l'appelant
   * retombe sur `artiste_id` et le site se comporte exactement comme
   * avant — le cas des deux modes reste mal rendu, rien ne casse.
   */
  cle?: string;
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
  /** §3 (nº 313) — LES STYLES QUE L'ARTISTE DÉCLARE SUR SA PROPRE
      FICHE (`tatoueurs.styles`). Facultatif : l'aperçu du salon lit la
      vue `equipe_salon`, qui ne les porte pas — il n'affiche alors pas
      la troisième ligne, et rien ne bouge d'un pixel. */
  styles?: string[];
  /**
   * §6 (nº 492) — L'ÉTAT DU CARNET DE L'ARTISTE, du MÊME endroit et
   * pour la même raison que ses styles : sa déclaration sur SA fiche
   * (`tatoueurs.booking` / `booking_mois`). Rien n'est recopié dans le
   * salon, rien n'est deviné — et la vue `equipe_salon` n'a pas à les
   * porter.
   * ⚠️ FACULTATIFS : sans eux, la ligne du dessus ne dit que le
   * statut, et aucun séparateur n'apparaît (voir
   * `mentionDuMembre`).
   */
  booking?: "ouvert" | "delai" | "ferme" | null;
  booking_mois?: number | null;
};

/** §3 (nº 313) — COMBIEN DE STYLES S'ÉCRIVENT SUR UNE LIGNE D'ÉQUIPE. */
export const STYLES_EQUIPE_AFFICHES = 3;

/**
 * §3 (nº 313) — LA LIGNE DE STYLES D'UN MEMBRE D'ÉQUIPE.
 * ==================================================================
 * « Réalisme · Trash Polka », « Japonais · Irezumi ». Les libellés
 * viennent de `libelleStyle` — le catalogue, jamais un mot écrit ici —
 * et le point médian entouré d'espaces est le séparateur du site.
 *
 * AU PLUS TROIS, PUIS LE RESTE COMPTÉ : « Réalisme · Fine Line ·
 * Blackwork +2 ». Sans ce plafond, un artiste à huit styles
 * transformerait sa ligne d'équipe en paragraphe, et l'équipe d'un
 * salon en mur de texte.
 *
 * VIDE QUAND IL N'Y A RIEN : l'appelant ne rend alors AUCUNE
 * troisième ligne — pas une ligne vide, pas un espace. C'est ce qui
 * garantit qu'un membre sans style déclaré ne déplace rien.
 *
 * ⚠️ FONCTION PURE, ET C'EST VOULU : la page qui l'emploie exige une
 * base et une session ; écrite ici, la règle s'EXÉCUTE au banc, cas
 * par cas, au lieu d'être seulement relue.
 */
export function libelleStylesEquipe(
  styles: string[] | null | undefined
): string {
  const propres = (styles ?? []).map((s) => s.trim()).filter(Boolean);
  if (propres.length === 0) return "";
  const montres = propres.slice(0, STYLES_EQUIPE_AFFICHES).map(libelleStyle);
  const reste = propres.length - montres.length;
  return montres.join(" · ") + (reste > 0 ? ` +${reste}` : "");
}

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
export function membreDepuisVue(
  ligne: {
    artiste_id: string;
    /** §1 (nº 410) — l'identifiant de la liaison. Facultatif : la vue
        ne le rend que depuis la migration de cette passe. */
    liaison_id?: string | null;
    artiste_nom: string;
    artiste_slug: string | null;
    artiste_photo: string | null;
    genre: string | null;
    /** ⚠️ FACULTATIF : la vue ne le rend que depuis la migration nº 65. */
    role?: string | null;
    debut_le: string | null;
    fin_le: string | null;
  },
  /**
   * §3 (nº 288) — LA DÉCLARATION DE L'ARTISTE, quand on l'a lue.
   * ------------------------------------------------------------------
   * LE DÉFAUT : le même artiste était FONDATEUR sur sa propre fiche et
   * RÉSIDENT dans l'équipe de son studio. Les deux côtés calculaient le
   * rôle chacun du sien — sa fiche lisait `modes_exercice.role` (sa
   * déclaration), l'équipe lisait la vue `equipe_salon`, qui rend
   * `null` dès que la liaison ne pend à aucun mode (invitation partie
   * DU salon) ou tant que la migration nº 65 n'est pas passée. Ce
   * `null` retombait sur « résident » : une valeur DEVINÉE.
   * LA RÈGLE : il n'y a qu'UNE information — celle que l'artiste
   * déclare dans son formulaire —, et les deux écrans la LISENT. Quand
   * l'appelant a pu aller la chercher (voir `garnirFiches`), elle passe
   * ici et l'emporte sur la vue ; sinon on garde le comportement
   * d'avant, qui reste vrai dans le cas courant.
   */
  declaration?: {
    genre?: string | null;
    role?: string | null;
    /** §3 (nº 313) — LES STYLES DE L'ARTISTE, du même endroit et pour
        la même raison que son rôle : sa DÉCLARATION, sur sa propre
        fiche. La vue `equipe_salon` ne les porte pas ; l'appelant qui
        a pu aller les chercher les passe ici (voir `garnirFiches`). */
    styles?: string[] | null;
    /** §6 (nº 492) — l'état de son carnet, exactement au même titre
        que ses styles : lu sur SA fiche, jamais recopié ni deviné. */
    booking?: string | null;
    booking_mois?: number | null;
  } | null
): MembreEquipe {
  const genre = declaration?.genre ?? ligne.genre;
  const role = declaration?.role ?? ligne.role;
  return {
    artiste_id: ligne.artiste_id,
    //  §1 (nº 410) — une ligne, une clé. À défaut de liaison connue
    //  (migration pas passée), l'artiste redevient sa propre identité :
    //  c'est le comportement d'avant, ni meilleur ni pire.
    cle: ligne.liaison_id ?? ligne.artiste_id,
    nom: ligne.artiste_nom,
    slug: ligne.artiste_slug,
    photo: ligne.artiste_photo,
    genre: genre === "guest" ? "guest" : "salon",
    role: role === "fondateur" ? "fondateur" : "resident",
    debut_le: ligne.debut_le,
    fin_le: ligne.fin_le,
    //  Absents : la troisième ligne ne se rend pas (voir
    //  `libelleStylesEquipe`).
    ...(declaration?.styles ? { styles: declaration.styles } : {}),
    //  §6 (nº 492) — l'état du carnet, borné aux trois valeurs
    //  connues : tout autre mot (base plus ancienne, saisie
    //  inattendue) vaut ABSENT, et la ligne du dessus se tait sur le
    //  booking plutôt que d'afficher un état qu'on ne sait pas lire.
    ...(declaration?.booking === "ouvert" ||
    declaration?.booking === "delai" ||
    declaration?.booking === "ferme"
      ? { booking: declaration.booking }
      : {}),
    ...(typeof declaration?.booking_mois === "number"
      ? { booking_mois: declaration.booking_mois }
      : {}),
  };
}

/**
 * ██ nº 755 — LE MOT DU GUEST, ÉCRIT UNE SEULE FOIS ██
 * ==================================================================
 * « GUEST SPOT », et non plus « GUEST » : le mot du métier, en anglais
 * comme les libellés neufs des nº 749-752. Le propriétaire le veut
 * PARTOUT — sur la plaque d'un lieu de la fiche d'un artiste comme sur
 * la ligne d'un invité dans l'équipe d'un salon : ce sont deux
 * surtitres du même objet, ils ne peuvent pas dire deux mots
 * différents.
 * ⚠️ D'OÙ LA CONSTANTE : ce mot avait DEUX écritures en dur
 * (`roleDuMembre` ici, `lieuEnDeuxLignes` plus bas) — c'est ce qui
 * l'aurait fait changer d'un seul côté. Les deux la lisent désormais.
 * ⚠️ LES CAPITALES SE FONT EN CSS (`MentionAuDessus`, nº 493), jamais
 * ici : le texte reste « Guest spot » dans le code, le navigateur le
 * peint « GUEST SPOT ».
 */
export const LIBELLE_GUEST = "Guest Spot";

/**
 * LE RÔLE D'UN MEMBRE, EN UN MOT — « Fondateur », « Résident »,
 * « Guest spot » (nº 222-§4, mot revu à la nº 755).
 * Un invité est un invité : son rôle dans le lieu est sa session, pas
 * une place. Les autres portent celui de leur mode d'exercice, et à
 * défaut « Résident » — une liaison partie du salon ne pend à aucun
 * mode, donc à aucun rôle, et c'est bien un résident.
 */
export function roleDuMembre(membre: MembreEquipe): string {
  if (membre.genre === "guest") return LIBELLE_GUEST;
  return libelleRoleCourt(membre.role) || libelleRoleCourt("resident");
}

/**
 * ██ §6 (nº 492) — LA LIGNE AU-DESSUS DE L'ENCADRÉ D'UN MEMBRE ██
 * ==================================================================
 * « Résident • Booking ouvert », « Guest spot • Booking ouvert · 12
 * mois d'attente », « Fondateur » tout seul. Le STATUT d'abord — il est
 * toujours là —, puis l'état du carnet quand l'artiste l'a déclaré.
 *
 * LES DEUX SÉPARATEURS SONT DIFFÉRENTS, ET C'EST VOULU (consigne du
 * propriétaire) : le point médian « • » sépare le statut du booking,
 * le point médian bas « · » sépare le booking de son délai. Deux
 * niveaux de lecture, deux signes.
 *
 * CE QUE CHAQUE ÉTAT DONNE, ET RIEN N'EST FABRIQUÉ :
 *  · `ouvert`            → « Résident • Booking ouvert »
 *  · `delai` + des mois  → « … • Booking ouvert · 12 mois d'attente »
 *    (un délai EST un carnet ouvert, avec une attente — c'est la
 *    grammaire déjà tenue sur la fiche depuis la nº 408) ;
 *  · `delai` SANS mois   → « Résident » SEUL. Sans chiffre, écrire
 *    « Booking ouvert » ferait dire à l'artiste autre chose que ce
 *    qu'il a coché : on se tait, comme la fiche le fait déjà ;
 *  · `ferme`             → « Résident • Booking fermé » ;
 *  · absent / inconnu    → « Résident » SEUL.
 *
 * ⚠️ PAS UNE PUCE ORPHELINE : le séparateur n'existe que s'il y a
 * quelque chose des deux côtés — il est posé PAR l'appelant SEULEMENT
 * quand la seconde moitié existe (piège nº 386).
 *
 * ██ §2 (nº 493) — DEUX MORCEAUX, ET VOICI POURQUOI ██
 * Cette fonction rendait UNE chaîne. Le propriétaire veut désormais le
 * STATUT en majuscules et le booking dans sa casse : deux traitements
 * typographiques, donc deux morceaux à rendre séparément. La règle,
 * elle, ne change pas d'une virgule — mêmes mots, mêmes silences,
 * mêmes séparateurs.
 * ⚠️ LES MAJUSCULES SE FONT EN CSS, PAS ICI, et c'est ce qui permet à
 * la traduction anglaise de suivre sans travail : « Founder » passera
 * en « FOUNDER » tout seul. Un `toUpperCase()` posé dans le code
 * aurait figé la casse d'un texte français dans une fonction qui n'est
 * pas censée savoir dans quelle langue elle parle.
 *
 * ⚠️ FONCTION PURE : la règle s'exécute sans base ni session.
 */
/** Le point médian qui sépare le statut de son complément. Écrit ici,
    avec ses espaces, pour qu'aucun appelant ne le recopie. */
export const SEPARATEUR_MENTION = " • ";

/**
 * ██ §3 (nº 496) — LA MENTION EST UNE FORME, PAS UN CONTENU ██
 * ==================================================================
 * La nº 493 l'avait taillée pour un seul usage : le statut d'un membre
 * d'équipe, puis son booking. La nº 496 la demande AUSSI sur les lieux
 * d'une fiche d'artiste — statut, puis TYPE DE LIEU. Même dessin, même
 * séparateur, même gris, même place ; seul le second morceau change de
 * nature.
 * PLUTÔT QUE DE RECOPIER, ON A NOMMÉ LA FORME : deux morceaux, dont le
 * second peut manquer. `mentionDuMembre` le remplit avec le booking,
 * `mentionDuLieu` avec le type de lieu, et le dessin — un seul, dans
 * BlocLieux — ne sait pas lequel il rend.
 * ⚠️ LE CHAMP A CHANGÉ DE NOM (`booking` → `complement`) : il ne
 * décrivait plus qu'un de ses deux emplois. Aucun texte, aucune règle
 * de silence n'a bougé avec lui.
 */
export type MentionEnDeuxMorceaux = {
  /** Toujours présent, et peint en capitales par l'appelant. */
  statut: string;
  /** Absent quand la donnée manque — le séparateur part avec lui. */
  complement: string | null;
};

export function mentionDuMembre(membre: MembreEquipe): MentionEnDeuxMorceaux {
  const etat =
    membre.booking === "ouvert" || membre.booking === "delai"
      ? "Books open"
      : membre.booking === "ferme"
        ? "Books closed"
        : null;
  const attente =
    membre.booking === "delai" && membre.booking_mois
      ? `${membre.booking_mois}-month wait`
      : null;
  const muet = membre.booking === "delai" && !attente;
  return {
    statut: roleDuMembre(membre),
    complement:
      etat && !muet ? (attente ? `${etat} · ${attente}` : etat) : null,
  };
}

/**
 * §3 (nº 496) — LA MENTION D'UN LIEU, SUR UNE FICHE D'ARTISTE.
 * ------------------------------------------------------------------
 * « FONDATEUR • Salon », « RÉSIDENT • Studio », « GUEST SPOT • Salon »
 * (le mot du guest est celui de la nº 755, `LIBELLE_GUEST`).
 * Les DEUX morceaux existent déjà et ne sont pas réécrits ici : le
 * statut sort de `lieuEnDeuxLignes` (le rôle du guest compris), le
 * type de lieu de `typeDeLieuDuMode`. Cette fonction ne fait que les
 * ranger dans la forme commune.
 * ⚠️ AUCUN MOT N'EST INVENTÉ, et rien n'est deviné : un mode sans rôle
 * lisible rend un statut vide, un type de lieu absent rend `null` —
 * et le séparateur s'en va avec lui (piège nº 386).
 */
export function mentionDuLieu(mode: ModeExerciceFiche): MentionEnDeuxMorceaux {
  const { role } = lieuEnDeuxLignes(mode);
  const type = (typeDeLieuDuMode(mode) ?? "").trim();
  return { statut: role, complement: type || null };
}

/**
 * L'ÉQUIPE DANS SON ORDRE (nº 222-§4) : tous les fondateurs, puis tous
 * les résidents, puis les guests — ceux-ci du plus proche au plus
 * lointain, par date de début. Un ordre imposé, écrit une seule fois :
 * la page et la fenêtre superposée le lisent toutes les deux.
 */
/**
 * ██ §3 (nº 493) — LES FONDATEURS REPRENNENT LA TÊTE ██
 * ==================================================================
 * L'ORDRE DEMANDÉ, ET IL N'ÉTAIT PAS CELUI DU CODE :
 *  1. LES FONDATEURS, par ordre alphabétique ;
 *  2. PUIS LES RÉSIDENTS, par ordre alphabétique ;
 *  3. PUIS LES GUESTS, par date, du plus proche au plus lointain.
 *
 * ⚠️ CE QUE CETTE PASSE ANNULE, ET IL FAUT LE DIRE : la nº 411 avait
 * FONDU fondateurs et résidents en un seul rang « membres », trié par
 * nom — c'était alors une demande explicite du propriétaire, et le
 * relevé de la nº 493 montre que ce n'est plus ce qu'il attend. On
 * revient donc aux TROIS rangs de la nº 222 : un fondateur nommé Zoé
 * repasse devant une résidente nommée Angéline.
 * ⚠️ CE QUI NE BOUGE PAS DE LA nº 411 : le tri à l'intérieur d'un
 * rang. Alphabétique pour les fondateurs comme pour les résidents,
 * par date pour les guests — au caractère près.
 * ⚠️ RIEN NE CHANGE EN BASE : c'est une règle d'affichage, et les
 * rôles eux-mêmes ne bougent pas.
 * ⚠️ LE RÔLE PEUT MANQUER : une liaison partie DU salon ne pend à
 * aucun mode, donc à aucun rôle. `roleDuMembre` la lit déjà comme
 * « résident » (par construction, voir sa note) et le rang suit la
 * même règle — un membre sans rôle déclaré est un résident, jamais un
 * fondateur.
 *
 * ⚠️ LES ACCENTS SONT TRIÉS COMME ON LES LIT, et c'est `localeCompare`
 * qui le fait : « Angéline », « Émile », « Zoé » sortent dans cet
 * ordre. Une comparaison brute (`<`, `sort()` par défaut) les range
 * par POINT DE CODE — le « É » (U+00C9) tombe alors APRÈS le « Z »
 * (U+005A), et Émile se retrouve en fin de liste. L'étiquette « fr »
 * est passée explicitement : sans elle, l'ordre dépendrait de la
 * langue du navigateur ET du serveur, qui ne sont pas la même — deux
 * rendus possibles pour une page prérendue.
 *
 * ⚠️ SUR QUELLE DATE ON TRIE : LE DÉBUT (`debut_le`) — « la session la
 * plus proche d'abord » se lit sur celle qui COMMENCE le plus tôt.
 * DEUX GUESTS QUI COMMENCENT LE MÊME JOUR : c'est la FIN qui départage,
 * la plus courte d'abord — celle qui libère la place le plus tôt. Et
 * si les deux dates sont identiques, le NOM, par le même
 * `localeCompare`. Aucun couple ne reste donc départagé par le hasard
 * de la lecture en base : deux chargements rendent le même ordre, ce
 * qui compte doublement sur une page prérendue.
 */
export function equipeOrdonnee(
  equipe: MembreEquipe[] | null | undefined
): MembreEquipe[] {
  //  §3 (nº 493) — TROIS RANGS, plus deux : 0 fondateur, 1 résident,
  //  2 guest. Un membre sans rôle déclaré tombe sur 1, comme
  //  `roleDuMembre` le lit déjà.
  const rang = (membre: MembreEquipe) =>
    membre.genre === "guest" ? 2 : membre.role === "fondateur" ? 0 : 1;
  const parNom = (a: MembreEquipe, b: MembreEquipe) =>
    a.nom.localeCompare(b.nom, "en");
  return membresActifs(equipe)
    .slice()
    .sort((a, b) => {
      const ecart = rang(a) - rang(b);
      if (ecart !== 0) return ecart;
      if (rang(a) !== 2) return parNom(a, b);
      //  LES GUESTS : début, puis fin, puis nom.
      const debut = (a.debut_le ?? "").localeCompare(b.debut_le ?? "");
      if (debut !== 0) return debut;
      const fin = (a.fin_le ?? "").localeCompare(b.fin_le ?? "");
      return fin !== 0 ? fin : parNom(a, b);
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
  return mois && jour ? `${mois}/${jour}` : iso;
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function dateLongue(iso: string | null | undefined): string {
  if (!iso) return "";
  const [annee, mois, jour] = iso.split("-");
  const nom = MOIS_EN_TOUTES_LETTRES[Number(mois) - 1];
  if (!annee || !nom || !jour) return iso;
  //  « 1er septembre », comme on l'écrit en français.
  return `${nom} ${Number(jour)}, ${annee}`;
}

/**
 * ██ §3 (nº 413) — LA PÉRIODE D'UN GUEST, SUR UNE SEULE LIGNE ██
 * ==================================================================
 * CE QU'IL Y AVAIT : deux lignes, « Du 23 août 2026 » / « Au 18
 * octobre 2026 » — l'année répétée, et deux lignes là où une suffit.
 * CE QUE ÇA DEVIENT : « 23 août – 18 octobre », avec le TIRET DEMI-CADRATIN
 * (U+2013), celui des intervalles en typographie française — pas le
 * trait d'union, qui joint des mots.
 *
 * ██ L'ANNÉE : UNE RÈGLE, PAS UNE MESURE ██
 * Elle ne s'écrit PAS quand TOUTE la période tombe dans l'année en
 * cours — c'est le cas courant, et l'année n'y apprend rien.
 * Elle s'écrit dès qu'un des deux bouts sort de l'année en cours, et
 * alors SUR LES DEUX DATES, jamais sur une seule :
 *      « 18 déc. 2026 – 12 janv. 2027 »
 * Écrire l'année d'un seul côté ferait lire « du 18 décembre [de
 * quelle année ?] au 12 janvier 2027 » : l'ambiguïté qu'on voulait
 * lever reviendrait par l'autre bout.
 *
 * ██ LES MOIS : LA MÊME RÈGLE, ET C'EST VOULU ██
 * Le propriétaire préfère « une règle prévisible à une mesure
 * fragile ». La règle est donc SANS MESURE ET SANS SEUIL DE
 * LONGUEUR : les mois s'écrivent EN ENTIER quand l'année est tue,
 * ABRÉGÉS quand elle s'écrit. Un seul booléen commande les deux
 * décisions — la ligne ne peut donc jamais porter à la fois deux
 * années et deux mois longs, qui est le seul cas où elle déborderait.
 * Aucune police n'est interrogée, aucun pixel n'est compté : la même
 * période produit toujours exactement la même chaîne, sur le serveur
 * prérendu comme dans le navigateur.
 * L'ABRÉVIATION EST CELLE DE L'USAGE : trois lettres et un point
 * (« janv. », « oct. »), sauf mai, juin et juillet qui ne s'abrègent
 * pas — les abréger n'économise rien et se lit mal.
 *
 * ██ LES CAS QUI NE DOIVENT RIEN LAISSER D'ORPHELIN ██
 *  · UN SEUL JOUR (début = fin) → la date SEULE, sans tiret :
 *    « 23 août ». Un intervalle d'un jour n'est pas un intervalle ;
 *  · PAS DE DATE DE FIN → « À partir du 23 août ». La session est
 *    ouverte, on le dit — jamais « 23 août – », qui laisserait un
 *    tiret pendant ;
 *  · PAS DE DATE DE DÉBUT (donnée incomplète) → « Jusqu'au 18
 *    octobre », par symétrie ;
 *  · AUCUNE DES DEUX → la chaîne VIDE. L'appelant teste cette chaîne
 *    avant de rendre quoi que ce soit : ni ligne vide, ni tiret seul.
 * ⚠️ L'ANNÉE EN COURS EST CELLE DU RENDU, et cette page est prérendue
 * toutes les cinq minutes : le 31 décembre à minuit, une période de
 * l'année suivante gagne ses années au plus cinq minutes plus tard.
 */
const MOIS_ABREGES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Un jour écrit — « 23 août », « 1er oct. 2027 ». */
function jourEcrit(iso: string, avecAnnee: boolean): string {
  const [annee, mois, jour] = iso.split("-");
  const table = avecAnnee ? MOIS_ABREGES : MOIS_EN_TOUTES_LETTRES;
  const nom = table[Number(mois) - 1];
  if (!annee || !nom || !jour) return iso;
  return avecAnnee
    ? `${nom} ${Number(jour)}, ${annee}`
    : `${nom} ${Number(jour)}`;
}

export function periodeDeSession(
  debut: string | null | undefined,
  fin: string | null | undefined,
  /** L'année en cours, injectée pour rester une fonction pure. */
  anneeCourante = new Date().getFullYear()
): string {
  const d = (debut ?? "").trim() || null;
  const f = (fin ?? "").trim() || null;
  if (!d && !f) return "";
  //  L'ANNÉE S'ÉCRIT DÈS QU'UN BOUT SORT DE L'ANNÉE EN COURS — et
  //  alors sur les deux dates (voir la note ci-dessus).
  const horsAnnee = [d, f].some(
    (iso) => iso && Number(iso.slice(0, 4)) !== anneeCourante
  );
  if (d && f) {
    if (d === f) return jourEcrit(d, horsAnnee);
    return `${jourEcrit(d, horsAnnee)} – ${jourEcrit(f, horsAnnee)}`;
  }
  if (d) return `From ${jourEcrit(d, horsAnnee)}`;
  return `Until ${jourEcrit(f as string, horsAnnee)}`;
}

/** « (du 01/09 au 15/09) » — la parenthèse d'une session guest. */
export function periodeCourte(mode: {
  debut_le: string | null;
  fin_le: string | null;
}): string {
  if (!mode.debut_le || !mode.fin_le) return "";
  return `(${dateCourte(mode.debut_le)} – ${dateCourte(mode.fin_le)})`;
}

/* ================================================================
 * CE QUI S'ÉCRIT SUR LA FICHE
 * ================================================================ */

/**
 * ██ §3 (nº 417) — LA VILLE D'UN MODE, SANS DOUBLER LE PAYS ██
 * ==================================================================
 * LE RELEVÉ : un artiste saisit un PAYS SEUL, et la fiche écrit
 * « Espagne, Espagne ».
 *
 * LA CAUSE, ET ELLE EST DANS L'AFFICHAGE — la donnée est SAINE.
 * Le repli `mode.ville ?? mode.intitule` était écrit à cinq endroits.
 * Il existe pour les lignes ANCIENNES, où la ville n'avait pas encore
 * sa colonne et vivait dans `intitule`. Or `intitule` n'est pas « la
 * ville » : c'est L'ÉTIQUETTE de ce qui a été choisi dans la liste
 * (`ligneRue ?? nom ?? ville ?? region ?? pays`, lib/geocodage/photon).
 * Choisir « Espagne » écrit donc `intitule = "Espagne"`, `ville =
 * null`, `pays = "Espagne"` — et le repli promeut le nom du pays au
 * rang de ville, que `ligneCarteMobile` écrit ensuite AVANT le pays.
 * D'où le doublon. C'est arrivé à la nº 416 sans se voir parce que
 * mon relevé d'alors construisait le mode à la main, avec un
 * `intitule` vide — une saisie réelle en a toujours un.
 *
 * ⚠️ UN SECOND CAS TOMBAIT DANS LE MÊME TROU, et il est réparé du
 * même geste : un ÉTAT AMÉRICAIN affichait « Texas, TX, USA » —
 * l'État écrit deux fois, en toutes lettres puis abrégé.
 *
 * LA RÈGLE POSÉE : `intitule` ne sert de ville QUE s'il n'est pas
 * DÉJÀ dit par une autre colonne (la région ou le pays). Comparaison
 * insensible à la casse et aux espaces.
 * CE QUI NE CHANGE PAS, et c'est ce qui compte :
 *  · « Luxembourg, Luxembourg » RESTE — la ville y est une VRAIE
 *    donnée (`mode.ville`), le repli n'est même pas consulté ;
 *  · « Bordeaux, France » sur une ligne ancienne (ville seulement
 *    dans `intitule`) RESTE — « Bordeaux » n'est ni la région ni le
 *    pays, le repli joue son rôle d'origine ;
 *  · « Bavière, Allemagne » (région seule) RESTE — `villeEtPays`
 *    écrit alors la division à la place de la ville.
 */
function villeDuMode(mode: ModeExerciceFiche): string | null {
  if (mode.ville) return mode.ville;
  const etiquette = (mode.intitule ?? "").trim();
  if (!etiquette) return null;
  const memeMot = (autre: string | null) =>
    (autre ?? "").trim().toLocaleLowerCase() === etiquette.toLocaleLowerCase();
  //  L'ÉTIQUETTE NE RÉPÈTE RIEN → c'est bien une ville sans colonne.
  return memeMot(mode.region) || memeMot(mode.pays) ? null : etiquette;
}

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
    ville: villeDuMode(mode),
    region: mode.region,
    pays: mode.pays,
    code_pays: mode.code_pays,
  };
  // ⚠️ LE STUDIO PRIVÉ NE MONTRE JAMAIS LA RUE : il est privé, c'est
  // tout son sens. (« À domicile » partageait cette promesse jusqu'à
  // la nº 402 ; le mode sans lieu des nº 414-417 aussi — tous deux
  // sont supprimés du site, celui-ci par la nº 418.)
  if (mode.genre === "prive") {
    return ligneCarte(lieu);
  }
  return ligneFiche({ ...lieu, adresse: mode.adresse });
}

/* ================================================================
 * §4 (nº 286) — LA GRAMMAIRE DES LIEUX, EN TROIS LIGNES
 * ================================================================
 * LA FORME ABANDONNÉE : « En salon · Résident : Hand In Glove · 44 Rue
 * Trousseau, Paris ». Ton administratif, deux-points superflu, double
 * séparateur, et l'adresse répétée quand aucun nom n'était lu.
 *
 * LA FORME, DÉSORMAIS — trois lignes, comme partout ailleurs sur une
 * fiche (une étiquette grise en capitales, une valeur blanche) :
 *
 *      RÉSIDENT DU SALON         ← l'étiquette (ECRITURE_TITRE_SECTION)
 *      Hand In Glove Tattoo      ← le nom, en blanc (un LIEN s'il a
 *                                  sa fiche)
 *      44 Rue Trousseau, Paris   ← l'adresse, en gris
 *
 * ⚠️ §2 (nº 288) — LES ÉTIQUETTES SONT DU FRANÇAIS, PAS DU TÉLÉGRAPHE.
 * « SALON · RÉSIDENT » (nº 286) ne se comprenait pas : sept étiquettes
 * les remplacent, et elles se lisent — FONDATEUR DU SALON, RÉSIDENT DU
 * SALON, EN GUEST AU SALON, les trois mêmes AU STUDIO, et REÇOIT À
 * DOMICILE. Le mot « artiste » n'y apparaît nulle part.
 *
 * ⚠️ L'ÉTIQUETTE PORTE TOUJOURS LE TYPE DE LIEU — salon ou studio. Un
 * visiteur qui arrive directement sur la page doit savoir où il met
 * les pieds ; « Résident » seul ne le dit pas.
 * ⚠️ « À DOMICILE » N'A NI NOM NI ADRESSE : personne ne publie
 * l'adresse de son domicile. La VILLE prend la ligne blanche, le RAYON
 * la ligne grise. C'est la promesse de `libelleLieuDuMode`, tenue une
 * seconde fois, ici, par construction.
 * ⚠️ L'ADRESSE NE S'ÉCRIT JAMAIS DEUX FOIS : sans fiche liée ET sans
 * nom saisi, c'est elle qui monte sur la ligne blanche, et il n'y a
 * pas de troisième ligne (voir `troisLignesDuMode`).
 * ================================================================ */

/**
 * LE TYPE DE LIEU D'UN MODE, EN UN MOT — « SALON » ou « STUDIO ».
 * ⚠️ POUR UN GUEST, C'EST LE LIEU VISITÉ qui décide (`nature_lieu`,
 * migration nº 41) : on est guest DANS un salon ou DANS un studio.
 * Sans cette indication (base ancienne), on n'invente rien : la
 * chaîne est vide et l'étiquette se réduit à « GUEST ».
 */
export function typeDeLieuDuMode(mode: ModeExerciceFiche): string {
  if (mode.genre === "salon") return "Tattoo Shop";
  if (mode.genre === "prive") return "Private Studio";
  if (mode.genre === "guest") {
    if (mode.nature_lieu === "salon") return "Tattoo Shop";
    if (mode.nature_lieu === "prive") return "Private Studio";
  }
  return "";
}

/**
 * L'ÉTIQUETTE D'UN MODE — « SALON · RÉSIDENT », « STUDIO · FONDATEUR »,
 * « SALON · GUEST ». (« À domicile » : supprimé, nº 402.)
 * ⚠️ ELLE EST RENDUE EN CAPITALES PAR LA FEUILLE DE STYLE
 * (`ECRITURE_TITRE_SECTION`, `uppercase`), jamais par le texte : les
 * mots restent ceux du formulaire, et une seule écriture décide de
 * leur apparence — celle des étiquettes STYLES, RENDU, TECHNIQUE.
 */
export function etiquetteDuLieu(mode: ModeExerciceFiche): string {
  //  « Salon » ou « Studio », en toutes lettres dans la phrase.
  const lieu = typeDeLieuDuMode(mode).toLowerCase();
  //  EN GUEST AU SALON / AU STUDIO — la préposition suit le lieu ;
  //  sans lieu connu (base ancienne, `nature_lieu` absent), « En
  //  guest » se suffit : on n'invente pas un type.
  if (mode.genre === "guest") {
    return lieu ? `Guest spot at ${lieu}` : "Guest spot";
  }
  //  FONDATEUR / RÉSIDENT DU SALON — DU STUDIO. Le rôle vient de
  //  `libelleRoleCourt` (« Fondateur », « Résident »), le mot même du
  //  formulaire : la fiche et le formulaire ne peuvent pas diverger.
  const role = libelleRoleCourt(mode.role);
  if (role && lieu) return `${role} du ${lieu}`;
  //  Un rôle sans type de lieu (ou l'inverse) : on dit ce qu'on sait,
  //  jamais plus.
  return role || (lieu ? `At ${lieu}` : genreMode(mode.genre).label);
}

/**
 * LE NOM DU LIEU — celui de sa fiche quand il en a une, SINON CELUI
 * QUE L'ARTISTE A SAISI (`nom_lieu`, §3 de la nº 286 : c'est ce que la
 * lecture ne prenait pas). Jamais `intitule` : c'est l'adresse.
 */
export function nomDuLieuDuMode(mode: ModeExerciceFiche): string {
  return (mode.salon_nom || mode.nom_lieu || "").trim();
}

/**
 * LES TROIS LIGNES D'UN MODE, décidées UNE SEULE FOIS — l'affichage
 * n'a plus qu'à les poser.
 *  · `etiquette` : toujours présente ;
 *  · `nom`       : la ligne blanche ;
 *  · `adresse`   : la ligne grise, vide quand il n'y a rien à écrire
 *    de plus (le nom manquait, l'adresse a pris sa place).
 */
/**
 * ██ §6 (nº 408) — LA VILLE ET LE PAYS D'UN MODE, SANS LA RUE ██
 * ==================================================================
 * LA QUESTION POSÉE : « d'où tires-tu la ville et le pays ? d'un
 * champ existant, ou en découpant l'adresse complète ? »
 * RÉPONSE : DE CHAMPS EXISTANTS, ET RIEN N'EST DÉCOUPÉ. Un mode porte
 * `ville`, `region`, `pays` et `code_pays` en colonnes séparées,
 * remplies par le choix DANS LA LISTE de suggestions — la même source
 * que les cartes et la barre de recherche. La rue vit dans `adresse`,
 * une autre colonne : ne pas l'écrire suffit à la faire disparaître,
 * il n'y a aucune chaîne à couper.
 * ⚠️ IL N'Y A DONC PAS D'« ADRESSE MAL FORMÉE » POSSIBLE ICI : le pire
 * cas n'est pas une découpe ratée, c'est un CHAMP VIDE — une fiche
 * ancienne sans ville. `ligneCarteMobile` joint alors ce qu'elle a
 * (`joindre` écarte les vides), et si elle n'a rien, elle rend la
 * chaîne VIDE. L'appelant teste cette chaîne avant d'écrire la puce :
 * ni ligne vide, ni puce orpheline, ni bout de rue.
 *
 * ⚠️ POURQUOI `ligneCarteMobile` ET NON `ligneCarte` : c'est la seule
 * des deux qui abrège le pays QUAND UNE DIVISION S'ÉCRIT — « Austin,
 * TX, USA » aux États-Unis, « Paris, France » ailleurs. C'est mot pour
 * mot la règle demandée. Son nom garde la trace de l'écran où elle est
 * née (nº 212-§6) ; sa RÈGLE, elle, n'a rien de propre au téléphone,
 * et aucune table d'abréviations n'est recopiée — elle réutilise celle
 * de la barre de recherche.
 */
export function villeEtPaysDuMode(mode: ModeExerciceFiche): string {
  return ligneCarteMobile({
    ville: villeDuMode(mode),
    region: mode.region,
    pays: mode.pays,
    code_pays: mode.code_pays,
  });
}

/**
 * ██ §4 (nº 409) — LES DEUX LIGNES D'UN LIEU, VERSION PUBLIQUE ██
 * ==================================================================
 * CE QU'IL Y AVAIT (nº 408) : une étiquette en capitales grises
 * (« RÉSIDENT DU SALON ») au-dessus de « Nom • Ville, Pays ».
 * CE QUE LE PROPRIÉTAIRE VEUT :
 *       Hand In Glove Tattoo          (gras, blanc)
 *       Résident • Salon • Paris, France
 * où SEUL LE RÔLE est blanc ; la puce, le type de lieu, la ville et le
 * pays sont gris.
 *
 * CETTE FONCTION NE PEINT RIEN : elle rend les MORCEAUX, et l'appelant
 * pose les couleurs. C'est ce qui permet à la fiche d'artiste et à la
 * section des guests d'un salon de dire la même chose sans se recopier.
 *
 * ⚠️ LA PUCE NE S'ÉCRIT QU'ENTRE DEUX MORCEAUX PRÉSENTS, et c'est
 * garanti ICI plutôt que dans le rendu : `suite` ne contient JAMAIS de
 * vide (elle est filtrée), donc l'appelant peut joindre sans réfléchir.
 * Les trois cas que le propriétaire demande de traiter en découlent :
 *  · un lieu SANS VILLE NI PAYS → `suite` n'a que le type de lieu ;
 *  · un GUEST SANS TYPE DE LIEU → `suite` n'a que la ville et le pays ;
 *  · les DEUX manquants → `suite` est VIDE, la ligne se réduit au rôle
 *    seul, et si le rôle lui-même manque (cas impossible aujourd'hui,
 *    `genreMode` rendant toujours un mot) la ligne ne se rend pas.
 * Aucune ligne vide, aucune puce orpheline ne peut donc être écrite.
 *
 * ⚠️ LE RÔLE : « Résident », « Fondateur » — les mots du formulaire,
 * par `libelleRoleCourt` (nº 403) — ou `LIBELLE_GUEST` pour une
 * session (« Guest spot » depuis la nº 755).
 * Un invité est un invité : sa place dans le lieu EST sa session,
 * c'est la règle de `roleDuMembre` (nº 222-§4), reprise telle quelle.
 * ⚠️ LE TYPE DE LIEU : « Salon » ou « Studio », le vocabulaire de la
 * nº 402, par `typeDeLieuDuMode` — jamais deviné, jamais réécrit.
 * ██ nº 414 — LE MODE SANS LIEU PREND LA PLACE DU RÔLE ██
 * Un mode Independent n'a ni nom de lieu (il n'y a pas de lieu — c'est
 * tout le sens du mode) ni type : `nom` est vide, `suite` n'a que la
 * ville. Le MOT monte donc dans `role`, le morceau BLANC de la
 * seconde ligne.
 * ⚠️ PLUS PERSONNE NE LIT CE CAS DEPUIS LA nº 415, et c'est voulu : le
 * mode sans lieu a QUITTÉ la liste des lieux de la fiche (`BlocProfilsArtiste`
 * ne reçoit plus que les modes qui ont un lieu — voir `modesDeLieu`)
 * pour devenir UNE LIGNE DU PROFIL, sous les styles (ContenuFiche).
 * La branche reste ici parce qu'elle est la réponse juste à la
 * question posée — quel mot blanc pour ce mode — et qu'un appelant
 * futur ne doit pas retomber sur une chaîne vide.
 */
export function lieuEnDeuxLignes(mode: ModeExerciceFiche): {
  /** La première ligne : le nom du lieu. Vide = pas de nom connu. */
  nom: string;
  /** Le premier mot de la seconde ligne, en blanc. */
  role: string;
  /** Ce qui suit, en gris — déjà purgé de ses vides. */
  suite: string[];
} {
  /*  ██ nº 753 — LES DEUX NOUVEAUX MODES ONT LEUR MOT ██
      · CONVENTION — « Convention », le mot du genre : la plaque porte
        le NOM de la convention en blanc, la mention au-dessus dit de
        quoi il s'agit. Sans elle, une plaque nommée « Mondial du
        Tatouage » ne se distinguerait pas d'un salon ;
      · AUTRE (`independent`) — la nº 753 ne lui donnait RIEN : son
        statut s'écrivait une fois en tête de ses villes.
      ██ nº 755 — LE SURTITRE POUR TOUS, ET LE STATUT DANS LA PLAQUE ██
      Le propriétaire a jugé à l'écran : cette ligne de statut posée
      au-dessus du groupe n'avait ni le gris ni l'espacement des autres
      surtitres, et elle faisait DOUBLON dès que le statut redescendait
      dans la plaque. « Autre » prend donc le dessin commun —
      « INDEPENDENT » en surtitre, le STATUT sur la ligne du nom — et la
      ligne de groupe disparaît (voir BlocLieux).
      · GUEST — « Guest spot », et non plus « Guest » : le mot du
        métier, en anglais comme les libellés neufs. Il vient de
        `LIBELLE_GUEST`, la MÊME constante que la ligne d'un invité dans
        l'équipe d'un salon (`roleDuMembre`) — deux écritures en dur
        auraient divergé à la première retouche. Le surtitre s'écrit en
        capitales tout seul (`MentionAuDessus`). */
  const role =
    mode.genre === "guest"
      ? LIBELLE_GUEST
      : mode.genre === "convention"
        ? "Convention"
        : mode.genre === "independent"
          ? "Independent"
          : libelleRoleCourt(mode.role) || "";
  /*  ██ nº 755 — LA LIGNE DU NOM, QUAND IL N'Y A PAS D'ENSEIGNE ██
      DEUX MODES N'ONT PAS DE LIEU À NOMMER, et leur plaque restait donc
      sans première ligne — la ville y remontait (nº 753), ce qui la
      privait à la fois de son rang de nom ET de sa couleur de lien.
      CE QU'ILS PORTENT MAINTENANT :
       · AUTRE — LE STATUT (« Guest spots only », « On break »…) : c'est
         ce que le visiteur cherche, et c'est ce qui distingue ces
         plaques les unes des autres quand l'artiste a trois villes ;
       · GUEST SANS LIEU — « Location shared after booking », la phrase
         du propriétaire : l'artiste ne dit pas encore chez qui, et la
         plaque le dit franchement au lieu de laisser un vide.
      ⚠️ LA VILLE REDESCEND DONC EN SECONDE LIGNE dans les deux cas, où
      elle est un LIEN (nº 754) : c'est sa place, et sa couleur le dit. */
  const nom =
    mode.genre === "independent"
      ? libelleStatutIndependent(mode.statut)
      : guestSansLieuDeclare(mode)
        ? "Location shared after booking"
        : nomDuLieuDuMode(mode);
  const suite = [typeDeLieuDuMode(mode), villeEtPaysDuMode(mode)]
    .map((morceau) => (morceau ?? "").trim())
    .filter(Boolean);
  return { nom, role, suite };
}

/**
 * ██ nº 753 — CE MODE SE LIT-IL COMME UNE DATE, OU COMME UN LIEU ? ██
 * ==================================================================
 * C'est ce qui décide l'ICÔNE du rond d'une plaque sans fiche (la
 * « plaque-info ») : un CALENDRIER pour ce qui est daté, le glyphe
 * d'ADRESSE pour ce qui ne l'est pas (décision du propriétaire,
 * nº 753-3).
 *  · DATÉ — une session guest, une présence en convention : les deux
 *    portent `debut_le`/`fin_le`, les deux expirent seules ;
 *  · LIEU — un salon ou un studio saisi à la main, une ville du mode
 *    « Autre » : ils disent OÙ, sans quand.
 * ⚠️ ÉCRITE ICI, LUE PAR L'AFFICHAGE SEUL : elle ne décide d'aucune
 * donnée, seulement d'un glyphe.
 */
export function modeEstDate(mode: ModeExerciceFiche): boolean {
  return mode.genre === "guest" || mode.genre === "convention";
}

/**
 * ██ nº 755 — CE GUEST DIT-IL CHEZ QUI, OU SEULEMENT OÙ ? ██
 * ==================================================================
 * LA RÈGLE, POSÉE À LA nº 752 ET ÉCRITE ICI DEPUIS LA nº 755 : le
 * parcours d'un guest se lit dans la FORME de sa ligne, sans colonne
 * de plus.
 *  · une nature d'établissement, un salon lié ou un nom de lieu → il a
 *    dit CHEZ QUI (le parcours « Oui ») ;
 *  · rien de tout cela → il n'a dit qu'une VILLE (le parcours « Non »).
 * ⚠️ ELLE VIVAIT EN DEUX EXEMPLAIRES : une copie locale dans
 * `chargerModes` (FormulaireFiche, qui reconstitue `sansLieu`) et,
 * depuis la nº 755, le besoin de l'AFFICHAGE — la plaque d'un tel
 * guest ne dit pas la même chose que celle d'un guest reçu quelque
 * part. Deux copies d'une règle finissent toujours par diverger : elle
 * est donc écrite ici, et les deux la lisent.
 * ⚠️ LE CAS RÉSIDUEL RESTE CELUI DE LA nº 752 : un guest enregistré
 * avant les migrations nº 41 et nº 266 n'a rien qui qualifie son
 * adresse ; il se lit « sans lieu ». Rien n'est perdu, et la personne
 * peut le repasser en « Oui » depuis son formulaire.
 */
export function guestSansLieuDeclare(mode: ModeExerciceFiche): boolean {
  return (
    mode.genre === "guest" &&
    !mode.nature_lieu &&
    !mode.salon_id &&
    !(mode.nom_lieu ?? "").trim()
  );
}

/**
 * ██ nº 753 — CETTE PLAQUE MÈNE-T-ELLE QUELQUE PART ? ██
 * ------------------------------------------------------------------
 * OUI quand le lieu a SA FICHE sur le site : la plaque est un lien —
 * fond, avatar, chevron (l'habillage de la nº 496, inchangé).
 * NON dans tous les autres cas : c'est une PLAQUE-INFO — un contour
 * fin, pas de fond, pas de chevron (règle du propriétaire, nº 753-2).
 * ⚠️ UNE SEULE ÉCRITURE POUR LES DEUX QUESTIONS : « quel habillage ? »
 * et « le nom est-il cliquable ? ». Deux règles finiraient par se
 * contredire — c'est exactement ce que la nº 496 avait déjà noté.
 */
export function plaqueMeneAUneFiche(mode: ModeExerciceFiche): boolean {
  return Boolean(mode.salon_slug && mode.salon_nom);
}

export function troisLignesDuMode(mode: ModeExerciceFiche): {
  etiquette: string;
  nom: string;
  adresse: string;
} {
  const etiquette = etiquetteDuLieu(mode);
  const adresse = libelleLieuDuMode(mode);
  const nom = nomDuLieuDuMode(mode);
  //  NI FICHE NI NOM SAISI : l'adresse monte sur la ligne blanche, et
  //  il n'y a pas de troisième ligne — elle ne s'écrit jamais deux
  //  fois (c'était tout le défaut du §3).
  if (!nom) return { etiquette, nom: adresse, adresse: "" };
  return { etiquette, nom, adresse };
}

/**
 * LA LIGNE COMPLÈTE D'UN MODE — ce que l'œil lit, de gauche à droite.
 * Cinq cas, exactement ceux du cahier des charges :
 *   · salon lié      → « Résident chez X — 12 rue de la Paix, Lyon »
 *   · salon à la main → « Artiste en studio fixe — 12 rue…, 69000 Lyon »
 *   · guest lié      → « En Guest chez X (du 01/09 au 15/09) — 45 av… »
 *   · guest à la main → « En session Guest à Paris (du…) — 45 av… »
 *   · studio privé   → « Studio privé / Secteur : Lyon (69000) »
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

  if (mode.genre === "prive") {
    return { avant: `${genre.phrase} ${lieu}`, nomSalon: null, apres: "" };
  }

  // EN STUDIO : le RÔLE précède le reste — « Fondateur de », « Résident
  // chez ». C'est la première chose qu'on veut savoir d'un artiste
  // rattaché à un lieu, et elle manquait.
  if (mode.genre === "salon" && mode.role === "fondateur") {
    const queueF = lieu ? `— ${lieu}` : "";
    if (lie) {
      return {
        avant: "Founder of ",
        nomSalon: mode.salon_nom ?? "",
        apres: queueF ? ` ${queueF}` : "",
      };
    }
    return {
      avant: "Founder of their private studio",
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
 * 1. Studio   2. Salon   3. Guest
 * (« à domicile » : supprimé nº 402 ; le mode SANS LIEU, né à la
 * nº 414 et nommé « Independent » à la nº 416, est ABANDONNÉ par le
 * propriétaire — nº 418. Il ne reste que ces trois-là.)
 * (nº 749 — le CATALOGUE repasse à cinq : `convention` et
 * `independent` existent en base et dans GENRES_MODE, mais aucun
 * écran n'en écrit encore. Leur rang d'affichage sera décidé à la
 * fiche publique, nº 753 ; d'ici là un genre absent de cette table
 * tombe sur 9 — après les trois connus, jamais entre eux.)
 * ██ nº 753 — LES CINQ SONT LÀ, DANS L'ORDRE DICTÉ ██
 * Studio · Salon · Guest · Convention · Autre — le même que le
 * sélecteur du formulaire (ORDRE_SELECTEUR, nº 751) et que le
 * catalogue (GENRES_MODE). Les trois listes disent désormais la même
 * chose ; le filtre du moteur (FILTRE_MODE_ACTIVITE) les rejoint à la
 * nº 754.
 * Il vaut PARTOUT où plusieurs profils se suivent : le sous-titre du
 * nom, la liste des profils d'un artiste, et tout ce qui viendra. Un
 * ordre écrit une seule fois ne peut pas diverger d'un écran à
 * l'autre. (Les slugs de genre ne sont pas les libellés : `prive`
 * s'affiche « Studio », `salon` s'affiche « Salon » — nº 402.)
 */
const RANG_DU_GENRE: Record<string, number> = {
  prive: 0,
  salon: 1,
  guest: 2,
  convention: 3,
  independent: 4,
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
      //  ⚠️ nº 753 — ET DEUX CONVENTIONS DE MÊME : elles sont datées
      //  comme un guest (mêmes colonnes, même expiration), et la
      //  prochaine est celle qui intéresse le visiteur.
      if (
        a.genre === b.genre &&
        (a.genre === "guest" || a.genre === "convention")
      ) {
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
  //  §10 (nº 852) — le mot du type, comme `libelleTypeFiche`.
  if (ordonnes.length === 0) return "Tattoo Artist";
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
  //  §10 (nº 852) — le mot du type, comme `libelleTypeFiche`.
  if (actifs.length === 0) return "Tattoo Artist";
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
 * `rayonKm` ne vaut QUE pour une ZONE DE DÉPLACEMENT — le genre
 * `independent` (nº 749 ; la mécanique fut celle d'« à domicile »
 * nº 40-402 puis de « Disponible » nº 414-418) : c'est la distance
 * que l'artiste accepte de parcourir autour de ce point. Un lieu
 * ordinaire est un point ; une zone est un DISQUE.
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
      //  nº 418 avait remis tous les rayons à zéro (mode sans lieu
      //  abandonné) ; nº 749 — UNE ZONE INDEPENDENT EST UN DISQUE :
      //  son rayon est la distance que l'artiste accepte de parcourir
      //  autour de la ville choisie.
      //  ⚠️ MÊME RÈGLE QUE LES VUES `lieux_tatoueur` / `zones_tatoueur`
      //  en base (yokofolio-conventions-et-independent.sql, nº 749) :
      //  les deux chemins répondent pareil — voir `modeAvecRayon`.
      rayonKm: modeAvecRayon(mode) ? (mode.rayon_km ?? 0) : 0,
    });
  }
  return lieux;
}

/**
 * LES GENRES DONT LE LIEU EST UN DISQUE — le pendant exact du
 * `case when m.genre in ('disponible', 'independent')` des trois vues
 * géographiques (nº 749). `disponible` n'est plus dans `GenreMode`
 * (l'entrée a quitté le catalogue à la nº 418) mais la base l'accepte
 * toujours par prudence : on le lit donc ici aussi, par la même
 * prudence — aucune ligne n'en existe, et si une réapparaissait, les
 * deux chemins la liraient pareil.
 */
function modeAvecRayon(mode: ModeExerciceFiche): boolean {
  const genre: string = mode.genre;
  return genre === "independent" || genre === "disponible";
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
      s'ouvre AVANT qu'on ait choisi : les CINQ modes sont dans
      l'encadré (nº 751 — ils étaient trois, puis quatre), pas dans un
      menu. Tant que rien n'est coché, le genre est vide — et le bloc 1
      n'est pas complet (voir `modeComplet`). */
  genre: GenreMode | "";
  /** GUEST seulement — le lieu qui l'accueille est-il un SALON ou un
      STUDIO PRIVÉ ? Rien à voir avec le genre du mode (toujours
      « guest ») : c'est la nature de l'ÉTABLISSEMENT visité, la même
      distinction que `etablissement` sur une fiche de lieu. Null tant
      que le choix n'est pas fait — et le bloc 1 reste incomplet.
      ⚠️ nº 752 — NULL VEUT AUSSI DIRE « PAS DE LIEU » : c'est ce que
      le parcours « Non » écrit en base, et c'est ainsi qu'on le relit
      (voir `sansLieu`). */
  natureLieu?: "salon" | "prive" | null;
  /**
   * ██ GUEST seulement (nº 752) — « INDIQUES-TU LE LIEU ? » ██
   * ------------------------------------------------------------------
   * LA RÉPONSE À LA QUESTION QUI OUVRE L'ENCADRÉ, juste sous les dates.
   *  · FAUX (« Oui », la position d'ouverture) — le parcours
   *    historique, INCHANGÉ : nature du lieu, recherche de portfolio,
   *    adresse à défaut, nom du lieu ;
   *  · VRAI (« Non ») — l'artiste ne dit pas CHEZ QUI il sera, mais OÙ :
   *    une ou plusieurs VILLES, en capsules. Chaque ville est alors une
   *    ligne `modes_exercice` de genre guest, aux mêmes dates, sans
   *    `nature_lieu` ni `nom_lieu` — c'est à cela qu'on la reconnaît à
   *    la relecture.
   * ⚠️ IL N'EST PAS EN BASE, et il n'a pas à y être : la forme des
   * lignes le dit déjà. Un guest qui porte un salon lié ou un nom de
   * lieu a répondu « Oui » ; un guest qui n'a qu'un point a répondu
   * « Non » (voir `chargerModes`, FormulaireFiche).
   */
  sansLieu?: boolean;
  /**
   * ██ GUEST seulement (nº 752) — L'ENCADRÉ AUQUEL CETTE LIGNE APPARTIENT
   * ------------------------------------------------------------------
   * Le parcours « Non » met PLUSIEURS VILLES dans UN SEUL encadré, et
   * chaque ville est une ligne à part (une ligne = un point, la règle
   * du site depuis toujours). Il faut donc dire lesquelles vont
   * ensemble : elles partagent cette clé.
   * ⚠️ EN MÉMOIRE SEULEMENT, comme `cle` : la base n'en sait rien, et
   * la relecture la reconstruit — les guests sans lieu qui partagent
   * LES MÊMES DATES sont le même séjour, en plusieurs villes.
   * Absente, le mode est seul dans son encadré (sa `cle` fait office).
   */
  groupe?: string | null;
  /** INDEPENDENT seulement — jusqu'où l'artiste se déplace autour de
      la ville choisie (10, 25, 50, 100 ou 200 km). Null ailleurs, et
      null tant qu'aucun rayon n'est choisi.
      ⚠️ nº 751 — CE CHAMP REVIT. Il fut celui d'« à domicile », puis
      de « Disponible » (nº 414) ; la nº 418 a supprimé ce mode et
      plus rien ne l'écrivait. Le mode « Autre » le reprend TEL QUEL —
      mêmes paliers (`RAYONS_DEPLACEMENT`), même colonne en base
      (`rayon_km`), même lecture par les trois vues géographiques
      (`case when m.genre in ('disponible','independent')`, nº 749).
      ⚠️ NULL SUR UNE ZONE SANS RAYON : une région ou un pays n'en
      prend pas — « 50 km autour de la France » ne veut rien dire
      (la règle de `rayonRequis`, écrite dans RAYONS_DEPLACEMENT). */
  rayonKm?: number | null;
  /**
   * ██ INDEPENDENT seulement (nº 751) — LE STATUT DE L'ARTISTE ██
   * ------------------------------------------------------------------
   * Un des cinq slugs de `STATUTS_INDEPENDENT`, le premier champ du
   * mode « Autre » et le seul qui ne soit pas un lieu.
   * ⚠️ IL EST RÉPÉTÉ SUR CHAQUE ZONE, et c'est le schéma de la base :
   * un artiste à trois zones a trois lignes `modes_exercice`, chacune
   * portant le même statut (colonne `statut`, contrainte
   * `modes_exercice_statut_connu` — nº 749). L'écran, lui, n'en
   * montre qu'un : le bloc « Autre » est unique, le menu écrit sur
   * toutes ses lignes en une seule écriture (voir BlocModesExercice).
   * Null pour les quatre autres genres.
   */
  statut?: StatutIndependent | null;
  /**
   * ██ CONVENTION seulement (nº 750) — LE PAYS DU PREMIER MENU ██
   * ------------------------------------------------------------------
   * Le code à deux lettres choisi dans « Country ». Il ne décrit RIEN
   * de l'activité de l'artiste : il ne fait que filtrer la liste des
   * conventions (conception nº 748-B1). C'est pourquoi il ne compte
   * PAS comme une saisie (voir `modeVide`) — regarder les conventions
   * d'un pays puis s'en aller ne déclare rien et ne bloque rien.
   * Null tant qu'aucun pays n'est choisi.
   */
  paysConvention?: string | null;
  /**
   * ██ CONVENTION seulement (nº 750) — LA CONVENTION RETENUE ██
   * ------------------------------------------------------------------
   * L'identifiant du catalogue (`conventions.id`) et le NOM retenu.
   * ⚠️ SA LOCALISATION N'EST PAS ICI, ET C'EST VOULU : choisir une
   * convention pose aussi `lieu` (le point de la convention, recopié
   * du catalogue — voir BlocModesExercice). Tout ce qui SITUE un mode
   * passe donc par le même champ que les trois autres genres :
   * `pointDuMode`, `colonnesDuLieu` et l'enregistrement n'ont pas une
   * ligne à apprendre. Le NOM, lui, est recopié en base dans
   * `nom_lieu` — la fiche reste lisible si la convention quitte un
   * jour le catalogue (le motif de `salon_id`, nº 26).
   */
  convention?: { id: string; nom: string } | null;
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
/**
 * ██ §4 (nº 407) — C'EST LA SEULE DÉFINITION DE « VIDE » DU BLOC ██
 * ------------------------------------------------------------------
 * Depuis la nº 407, LES TROIS lectures du bloc s'y branchent :
 * `blocExerciceComplet` (le bouton), `premierManque` (la remontée) et
 * `tousLesManques` (le rouge). Aucune ne peut plus être plus sévère
 * que les autres.
 *
 * CE QUI COMPTE — et c'est une liste de SAISIES, uniquement des
 * gestes que personne n'a faits à la place de l'artiste :
 *  · `salon`    — une fiche YokoFolio retenue dans la recherche ;
 *  · `lieu`     — une ville ou une adresse choisie dans la liste ;
 *  · `debut_le`, `fin_le` — les dates d'une session guest ou d'une
 *                 convention (nº 750) ;
 *  · `rayonKm`  — le rayon d'une zone du mode « Autre » (nº 751 ; il
 *                 fut celui d'« à domicile », puis de « Disponible »
 *                 nº 414, et resta nul entre la nº 418 et la nº 751).
 *                 Une capsule cliquée est une saisie ;
 *  · `nomLieu`  — le nom saisi à la main (§1, nº 266) ;
 *  · `convention` — la convention retenue dans l'écran (nº 750) ;
 *  · `statut`   — le statut du mode « Autre » (nº 751).
 *
 * CE QUI NE COMPTE PAS, ET C'EST TOUT LE SUJET : les valeurs que le
 * FORMULAIRE pose lui-même en ouvrant un encadré. Les compter ferait
 * naître un lieu « commencé » d'un simple clic d'onglet :
 *  · `genre`     — posé par l'ouverture de l'onglet (`modeVierge`) ;
 *  · `role`      — « resident » d'office depuis la nº 405 ;
 *  · `natureLieu`— « Studio » d'office sur un guest neuf (nº 128).
 * ⚠️ CES TROIS-LÀ SONT DES DÉFAUTS D'AFFICHAGE, pas des réponses. Un
 * encadré qui ne porte QU'EUX n'a jamais rien reçu : il est vide, il
 * reste facultatif, et il redevient facultatif si on le revide.
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
    !(mode.nomLieu ?? "").trim() &&
    //  nº 750 — UNE CONVENTION RETENUE EST UNE SAISIE. Elle pose
    //  d'ordinaire `lieu` avec elle (le point du catalogue, testé
    //  juste au-dessus) ; on la nomme quand même, pour qu'une
    //  convention SANS coordonnées — une ligne du catalogue que
    //  l'administration n'a pas située — ne fasse pas passer l'encadré
    //  pour vierge : il serait sauté à l'enregistrement, en silence.
    //  ⚠️ LE PAYS, LUI, NE COMPTE PAS : il ne fait que filtrer la
    //  liste (voir `paysConvention`). C'est la règle du §4 nº 407 —
    //  ne comptent que les gestes qui DÉCLARENT quelque chose.
    !mode.convention &&
    //  nº 751 — UN STATUT CHOISI EST UNE SAISIE. C'est une réponse à
    //  une question posée, comme un rayon cliqué : l'encadré « Autre »
    //  n'est plus vierge, il est INCOMPLET (il lui manque une zone), et
    //  `premierManque` le dira. Le distinguer importe : sans cette
    //  ligne, un artiste qui ne choisit QUE son statut verrait
    //  « Enregistrer » passer, et sa ligne serait sautée en silence.
    !mode.statut
  );
}

/**
 * LE NOM DU LIEU EST-IL EXIGIBLE SUR CE MODE ? (§1, nº 266)
 * ------------------------------------------------------------------
 * OUI quand les trois conditions tiennent :
 *  · le mode se passe CHEZ QUELQU'UN — un salon, un studio, un lieu
 *    de guest ; « Disponible » (nº 414) n'a pas de nom d'enseigne :
 *    il n'y a pas de lieu, l'artiste en cherche un ;
 *  · le lieu N'EST PAS sur YokoFolio (aucune fiche retenue) — sinon
 *    son nom est déjà celui de sa fiche, et le champ n'existe pas ;
 *  · une adresse a été CHOISIE : le champ ne s'ouvre qu'après elle.
 * ⚠️ UNE SEULE ÉCRITURE : le formulaire l'interroge pour AFFICHER le
 * champ, `modeComplet` pour l'exiger et `premierManque` pour le
 * désigner — les trois ne peuvent pas diverger.
 */
export function nomLieuRequis(mode: ModeEnSaisie): boolean {
  //  ⚠️ nº 754 — LES DEUX PREMIÈRES CONDITIONS VIVENT MAINTENANT DANS
  //  `nomPorteParLeMode`, juste dessous : elles répondent à une autre
  //  question — « ce mode porte-t-il un nom d'enseigne ? » —, et
  //  l'écriture en base a besoin de celle-là seule (voir sa note).
  if (!nomPorteParLeMode(mode)) return false;
  return Boolean(mode.lieu);
}

/**
 * ██ nº 754 — CE MODE PORTE-T-IL UN NOM D'ENSEIGNE ? ██
 * ------------------------------------------------------------------
 * LA MOITIÉ STABLE DE `nomLieuRequis`, ISOLÉE — et ce n'est pas un
 * découpage de confort : les deux questions n'ont pas la même durée.
 *  · CELLE-CI décrit le mode lui-même : un salon, un studio ou un
 *    guest QUI DIT CHEZ QUI il est reçu, et dont le lieu n'a pas sa
 *    fiche sur le site (elle porterait alors son propre nom). Elle ne
 *    change pas tant que le genre ne change pas ;
 *  · `nomLieuRequis` y ajoute « … ET une adresse a été choisie », ce
 *    qui décide de MONTRER le champ et de l'EXIGER. Cette part-là
 *    varie au fil de la saisie.
 * ⚠️ L'ÉCRITURE EN BASE LIT CELLE-CI, ET C'EST TOUT LE SUJET DE LA
 * nº 754 : lire l'autre faisait repartir à `null` un nom déjà
 * enregistré dès que l'adresse manquait un instant (voir
 * enregistrer-exercice). Un nom saisi ne disparaît que si on le vide.
 */
export function nomPorteParLeMode(mode: ModeEnSaisie): boolean {
  if (mode.genre !== "salon" && mode.genre !== "prive" && mode.genre !== "guest") {
    return false;
  }
  //  nº 752 — UN GUEST QUI NE DIT PAS SON LIEU N'A PAS DE NOM À DONNER.
  //  Il ne déclare qu'une VILLE : il n'y a pas d'enseigne derrière, et
  //  la question « chez qui ? » n'a plus de sujet. C'est la même raison
  //  que pour le mode « Autre » — l'artiste dit OÙ, pas CHEZ QUI.
  if (mode.genre === "guest" && mode.sansLieu) return false;
  return !mode.salon;
}

/**
 * ██ §1 (nº 419) — LE LIEU EST-IL RENSEIGNÉ ? ██
 * ==================================================================
 * C'est la question de L'AFFICHAGE des dates d'une session guest : on
 * ne demande pas QUAND avant de savoir OÙ. Deux façons de renseigner
 * un lieu, et la réponse vaut pour les deux :
 *  · LE LIEU A SA FICHE sur le site → `salon` retenu, et c'est tout :
 *    son nom et son adresse viennent avec ;
 *  · LE LIEU N'A PAS DE FICHE → il faut LES DEUX : l'adresse choisie
 *    dans la liste (`lieu`) ET le nom saisi (`nomLieu`). Une adresse
 *    sans nom ne dit pas CHEZ QUI l'on est reçu — c'est déjà la règle
 *    de `nomLieuRequis` (nº 266), interrogée ici plutôt que recopiée.
 *
 * ⚠️ CETTE QUESTION N'EST PAS CELLE DE `datesSuiventLeLieu`, ET LA
 * DIFFÉRENCE EST VOULUE (elle répond mot pour mot à la demande du
 * propriétaire, « elles s'effacent quand LES DEUX sont vidés — pas
 * quand un seul l'est ») :
 *  · AFFICHER demande un lieu COMPLET — on sait chez qui ;
 *  · EFFACER demande que le lieu ait DISPARU — il n'y a plus rien à
 *    quoi rattacher des dates.
 * Entre les deux vit un état intermédiaire : adresse choisie, nom pas
 * encore tapé (ou effacé). Les dates s'y CACHENT sans être perdues —
 * retaper le nom les ramène telles quelles. C'est exactement ce qu'il
 * faut : effacer sur la disparition d'un seul des deux champs
 * détruirait du travail à la première faute de frappe.
 */
export function lieuRenseigne(mode: ModeEnSaisie): boolean {
  if (mode.salon) return true;
  if (!mode.lieu) return false;
  //  `nomLieuRequis` est vrai dès qu'une adresse est choisie sans
  //  fiche : c'est donc bien « les deux » qu'on exige ici.
  return !nomLieuRequis(mode) || Boolean((mode.nomLieu ?? "").trim());
}

/**
 * ██ §5 (nº 413) — PLUS DE LIEU, PLUS DE DATES ██
 * ==================================================================
 * LE RELEVÉ : on supprime l'établissement d'une session guest — qu'il
 * vienne de la recherche (`salon`) ou d'une adresse saisie à la main
 * (`lieu`) — et LES DATES RESTENT, orphelines : une période sans
 * endroit, qui bloque « Je confirme » sans qu'on voie pourquoi.
 *
 * ⚠️ C'EST UNE TRANSITION QU'ON REGARDE, PAS UN ÉTAT, et c'est toute
 * la finesse demandée : « ne l'applique qu'à la SUPPRESSION du lieu ;
 * modifier ou remplacer un établissement ne doit pas effacer des dates
 * déjà saisies ». Un état (« ce mode n'a pas de lieu ») ne distingue
 * pas les deux — il effacerait aussi les dates de qui saisit ses dates
 * AVANT son lieu, ce que le formulaire autorise (les deux champs sont
 * toujours à l'écran pour un guest).
 * LA RÈGLE COMPARE DONC L'AVANT ET L'APRÈS :
 *  · AVAIT un lieu et N'EN A PLUS      → les dates s'effacent ;
 *  · avait un lieu et EN A UN AUTRE    → rien (remplacement) ;
 *  · n'en avait pas et n'en a toujours pas → rien (saisie en cours).
 * « Avoir un lieu », c'est porter L'UN OU L'AUTRE : `salon` (une fiche
 * retenue) ou `lieu` (une adresse choisie dans la liste). Les deux
 * façons sont donc couvertes par la même ligne, sans les nommer.
 *
 * ⚠️ ELLE NE VAUT QUE POUR UN GUEST : lui seul a des dates. Sur les
 * autres genres, `debut_le` et `fin_le` sont déjà nuls et le resteront.
 *
 * ██ §1 (nº 419) — CETTE RÈGLE EST GARDÉE TELLE QUELLE, ET VOICI CE
 * QU'ELLE COUVRE ██
 * Vérifiée cas par cas contre la demande du propriétaire :
 *  · fiche retenue puis RETIRÉE → `salon` disparaît, rien ne le
 *    remplace : les dates s'effacent. ✔ (Si DeuxZonesLieu restitue une
 *    adresse mise de côté — nº 105 —, `lieu` prend le relais : rien ne
 *    s'efface, et c'est juste, le mode a encore un lieu.)
 *  · adresse choisie puis EFFACÉE par la croix → même transition, les
 *    dates s'effacent. ✔ Le nom saisi, lui, n'est plus atteignable
 *    (son champ ne s'affiche qu'avec une adresse) : le compter comme
 *    « un lieu » ferait manquer cet effacement. C'est pourquoi cette
 *    fonction ne regarde QUE `salon` et `lieu`, et c'était déjà juste.
 *  · NOM effacé seul, adresse toujours là → aucune transition : les
 *    dates restent en mémoire et se CACHENT (voir `lieuRenseigne`). ✔
 *    « pas quand un seul l'est ».
 *  · établissement REMPLACÉ par un autre → aucune transition : les
 *    dates sont préservées. ✔ C'est ce que la nº 413 protégeait, et
 *    rien ici ne l'entame.
 * ⚠️ ELLE NE TOURNE QU'À LA SAISIE (`modifier`, BlocModesExercice) et
 * JAMAIS À LA LECTURE : un guest déjà enregistré rouvre son formulaire
 * avec ses dates intactes — `chargerModes` ne passe pas par ici.
 *
 * ██ §2 (nº 420) — « LIEU SAISI À LA MAIN → FICHE RETENUE » CONSERVE
 * LES DATES, ET C'EST DÉJÀ CE QUE FAIT CETTE LIGNE ██
 * Le propriétaire soupçonnait cette règle (ou `lieuRenseigne`) d'y
 * lire une disparition du lieu. VÉRIFIÉ EN L'EXÉCUTANT, pas en la
 * relisant : sur cette transition, `avant.lieu` est renseigné ET
 * `apres.salon` l'est — `aUnLieu` est donc VRAI, la fonction rend
 * `apres` inchangé, et les deux dates passent telles quelles.
 * C'est le sens même du test : ce qui compte n'est pas QUEL lieu, mais
 * qu'il y EN AIT un de chaque côté. Remplacer une adresse par une
 * fiche est un remplacement comme un autre — exactement comme
 * remplacer une fiche par une autre, que la nº 413 protégeait déjà.
 * ⚠️ LE CHEMIN QUI PERD LES DATES, ET IL N'EST PAS CELUI-CI : RETIRER
 * L'ADRESSE D'ABORD (la croix du champ de localité), PUIS chercher la
 * fiche. Le retrait est alors une vraie disparition — plus rien ne
 * porte le lieu à cet instant —, les dates s'effacent, et la fiche
 * retenue ensuite trouve les champs vides. C'est la règle du retrait,
 * celle que le propriétaire veut garder pour la fiche ; on ne peut pas
 * l'annuler ici sans l'annuler là-bas.
 * ⚠️ IL N'Y A RIEN À RETIRER POUR CHERCHER : la zone de recherche
 * reste ouverte en permanence, adresse saisie ou non (règle d'en-tête
 * de DeuxZonesLieu). Le chemin direct — chercher, puis retenir — est
 * donc toujours disponible, et c'est lui qui conserve les dates.
 */
/*  ██ nº 752 — CETTE RÈGLE EST DÉSORMAIS SANS OBJET, ET C'EST LA
    REFONTE DU GUEST QUI LA RETIRE ██
    ------------------------------------------------------------------
    ELLE AVAIT UN SENS TANT QUE LES DATES VENAIENT APRÈS LE LIEU : on
    demandait OÙ, puis QUAND ; le lieu retiré, le « quand » ne disait
    plus de quoi il parlait, et la nº 413 l'effaçait.
    LE PARCOURS EST INVERSÉ DEPUIS LA nº 752 : les dates ouvrent
    l'encadré, le lieu vient ensuite — ET IL EST FACULTATIF (la
    question « Souhaitez-vous indiquer le lieu ? »). Les dates ne
    dépendent donc plus de rien : un guest peut n'avoir aucun lieu et
    rester complet.
    ⚠️ ET LA GARDER FERAIT PIRE QUE RIEN : passer de « Oui » à « Non »
    lâche le lieu — la règle effacerait alors les dates que la personne
    vient de saisir, au moment précis où elle répond à la question
    suivante. C'est un défaut, pas une protection.
    La fonction reste (le formulaire l'appelle à chaque écriture) mais
    ne touche plus à rien : une seule écriture à changer le jour où le
    parcours rebougera.  */
export function datesSuiventLeLieu(
  _avant: ModeEnSaisie,
  apres: ModeEnSaisie
): ModeEnSaisie {
  return apres;
}

/** LES MODES QUI COMPTENT — ceux où quelque chose a été saisi. C'est
    sur EUX que portent la validation et l'enregistrement ; les
    encadrés vierges (un onglet ouvert par curiosité) n'existent pas. */
export function modesDeclares(modes: ModeEnSaisie[]): ModeEnSaisie[] {
  return modes.filter((mode) => !modeVide(mode));
}

/** CE MODE EST-IL COMPLET ? La règle est la même à l'écran et en
    base (voir la contrainte `modes_exercice_dates_coherentes`). */
export function modeComplet(mode: ModeEnSaisie): boolean {
  // RIEN DE COCHÉ : l'encadré est ouvert mais vide. Ce n'est pas une
  // anomalie — c'est l'état de départ depuis la refonte du bloc.
  if (!mode.genre) return false;
  // EN STUDIO SANS SOUS-CHOIX : la moitié de l'information manque.
  if (mode.genre === "salon" && !mode.role) return false;
  /*  ██ GUEST (nº 752) — DEUX PARCOURS, DEUX RÈGLES ██
      SANS LIEU (« Non ») : les DEUX DATES et UNE VILLE, rien d'autre.
      Ni nature d'établissement, ni nom : l'artiste dit OÙ il sera, pas
      chez qui. Chaque ville est une ligne, chacune se juge seule.
      AVEC LIEU (« Oui ») : le parcours historique, inchangé — la
      nature du lieu d'abord (sans elle, les champs qui suivent posent
      une question sans sujet), puis le lieu, son nom si l'adresse est
      saisie à la main, et les dates. */
  if (mode.genre === "guest" && mode.sansLieu) {
    if (!pointDuMode(mode)) return false;
    return Boolean(
      mode.debut_le && mode.fin_le && mode.fin_le >= mode.debut_le
    );
  }
  if (mode.genre === "guest" && !mode.natureLieu) return false;
  /*  ██ CONVENTION (nº 750) — DEUX RÉPONSES, ET ELLES SUFFISENT ██
      La convention retenue dans le menu, et LES DATES DE L'ARTISTE
      (conception nº 748-B1 : « il peut n'être là qu'un jour sur
      sept »). Le PAYS n'est pas une réponse : il ne fait que filtrer
      la liste, et il est forcément choisi dès qu'une convention l'est.
      ⚠️ LE POINT VIENT DE LA CONVENTION, recopié du catalogue dans
      `lieu` au moment du choix — c'est donc le test commun à tous les
      genres qui le vérifie, pas une règle à part. Une convention que
      l'administration n'a pas située n'a pas de point : l'encadré
      reste incomplet, et le dit, plutôt que de poser une fiche que
      personne ne pourrait trouver sur une carte. */
  if (mode.genre === "convention") {
    if (!mode.convention) return false;
    if (!pointDuMode(mode)) return false;
    return Boolean(
      mode.debut_le && mode.fin_le && mode.fin_le >= mode.debut_le
    );
  }
  /*  ██ « AUTRE » (nº 751) — DEUX RÉPONSES, ET ELLES SUFFISENT ██
      LE STATUT (un des cinq, obligatoire) et LA ZONE (la ville
      choisie, qui donne le point). Rien d'autre : ce mode n'a ni
      établissement, ni nom de lieu, ni dates — l'artiste dit d'où il
      rayonne, pas chez qui ni quand.
      ⚠️ LE RAYON N'EST PAS EXIGÉ, et c'est voulu : il n'a de sens
      qu'autour d'une VILLE ou d'une ADRESSE (`rayonRequis`) — une
      région ou un pays en fait une zone sans rayon, parfaitement
      valide. Exiger le rayon rendrait ces zones-là impossibles.
      ⚠️ UNE LIGNE PAR ZONE, LE STATUT RÉPÉTÉ (voir `statut`) : chaque
      ligne se juge donc seule, exactement comme les autres genres —
      l'écran en montre une seule (le bloc « Autre » est unique), la
      règle n'en sait rien et n'a pas à le savoir. */
  if (mode.genre === "independent") {
    if (!mode.statut) return false;
    return Boolean(pointDuMode(mode));
  }
  if (!pointDuMode(mode)) return false;
  //  §1 (nº 266) — LE NOM DU LIEU EST OBLIGATOIRE quand l'adresse est
  //  saisie à la main : sans lui, la fiche dit OÙ l'on travaille sans
  //  dire CHEZ QUI. Un lieu trouvé par la recherche porte déjà le sien.
  if (nomLieuRequis(mode) && !(mode.nomLieu ?? "").trim()) return false;
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
  /**
   * §5 (nº 408) — `aucun-lieu` EST À PART, ET C'EST TOUT SON RÔLE.
   * ------------------------------------------------------------------
   * Les neuf autres valeurs DÉSIGNENT UN CHAMP : un encadré rougit,
   * la page y remonte. Celle-ci n'en désigne aucun — elle dit qu'il
   * n'y a RIEN à désigner, parce que rien n'a été commencé. Aucun
   * consommateur ne la reconnaît (ni `manque.champ === "genre"` du
   * sélecteur, ni la comparaison par `cle` des encadrés), donc AUCUN
   * ROUGE ne se pose : c'est la phrase à côté du bouton qui parle,
   * et elle seule (FormulaireFiche).
   */
  champ:
    | "type"
    | "genre"
    | "role"
    | "lieu"
    //  nº 750 — LE MENU DES CONVENTIONS. Un champ à part, et pas
    //  `lieu` : le panneau Convention n'a NI recherche de portfolio NI
    //  saisie d'adresse — désigner « lieu » ferait chercher un rouge
    //  sur des champs qui n'existent pas dans cet onglet.
    | "convention"
    //  nº 751 — LES DEUX CHAMPS DU MODE « AUTRE », et pour la même
    //  raison que `convention` : son panneau n'a NI recherche de
    //  portfolio NI saisie d'adresse — désigner « lieu » ferait
    //  chercher un rouge sur des champs que cet onglet n'a pas.
    | "statut"
    | "zone"
    //  nº 752 — LA VILLE D'UN GUEST SANS LIEU. Un champ à part, encore
    //  une fois : ce parcours-là n'a ni recherche de portfolio ni
    //  saisie d'adresse, seulement un champ de ville et des capsules.
    | "ville"
    | "nomLieu"
    | "rayon"
    | "dates"
    | "aucun-lieu";
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
      message: "Choose artist or shop first.",
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
          ? "Pick your city (or your address) FROM THE LIST of suggestions."
          : "Pick your shop's FULL ADDRESS FROM THE LIST — a city alone isn't enough.",
    };
  }
  //  ⚠️ MÊME FILTRE QUE `blocExerciceComplet` (passe nº 124) : un
  //  encadré vierge — l'onglet qu'on a ouvert sans rien y saisir —
  //  n'est pas un manque. Deux règles différentes finiraient par se
  //  contredire : l'une éteindrait le bouton, l'autre n'aurait rien à
  //  désigner.
  const declares = modesDeclares(modes);
  if (declares.length === 0) {
    /*  ██ §5 (nº 408) — RIEN DE COMMENCÉ : ON N'ENCADRE PLUS RIEN ██
         CE QU'IL Y AVAIT, ET LE RELEVÉ DU PROPRIÉTAIRE : si un onglet
         était ouvert — et le formulaire en ouvre un d'office —, on
         désignait SON lieu. Comme Studio ouvre la marche depuis la
         nº 403, c'est Studio qui se cadrait de rouge, seul, « ce qui
         laisse croire qu'il est obligatoire ». Il ne l'est pas : les
         trois lieux sont interchangeables, il en faut UN, n'importe
         lequel. Le second cas (aucun onglet ouvert) rougissait le
         sélecteur entier — même reproche, en plus large.
         CE QUE C'EST DEVENU : UN SEUL manque, qui ne désigne AUCUN
         champ (`aucun-lieu`, voir le type ci-dessus). Personne ne le
         reconnaît, donc rien ne rougit ; le formulaire l'affiche en
         toutes lettres à côté du bouton « Je confirme mon choix ».
         ⚠️ CE N'EST PAS UN ASSOUPLISSEMENT : la fonction rend toujours
         un manque, donc `blocExerciceComplet` reste faux et
         l'enregistrement reste bloqué. Ce qui change, c'est OÙ on le
         dit — une phrase au lieu d'un cadre mensonger. */
    return {
      cle: null,
      champ: "aucun-lieu",
      message: "Choose a place where you work",
    };
  }
  for (const mode of declares) {
    if (!mode.genre) {
      return {
        cle: mode.cle,
        champ: "genre",
        message: "Choose one of the five ways you work.",
      };
    }
    if (mode.genre === "salon" && !mode.role) {
      return {
        cle: mode.cle,
        champ: "role",
        message: "Say whether you're the shop's founder or a resident.",
      };
    }
    //  nº 752 — LA MÊME BRANCHE QUE `tousLesManques`, et à la même
    //  place : les deux fonctions lisent la même règle, l'une s'arrête
    //  au premier manque, l'autre les liste tous (§1 nº 267).
    if (mode.genre === "guest" && mode.sansLieu) {
      if (!(mode.debut_le && mode.fin_le)) {
        return {
          cle: mode.cle,
          champ: "dates",
          message: "A guest spot needs both dates.",
        };
      }
      if (mode.fin_le < mode.debut_le) {
        return {
          cle: mode.cle,
          champ: "dates",
          message: "The end date is before the start date.",
        };
      }
      if (!pointDuMode(mode)) {
        return {
          cle: mode.cle,
          champ: "ville",
          message: "Add at least one city for this guest spot.",
        };
      }
      continue;
    }
    //  nº 750 — LA CONVENTION A SES DEUX MANQUES À ELLE, et ils
    //  passent AVANT le test de lieu commun : sans cette branche, un
    //  encadré Convention sans convention retenue serait désigné
    //  « lieu » — un champ que son panneau n'a pas.
    if (mode.genre === "convention") {
      if (!mode.convention || !pointDuMode(mode)) {
        return {
          cle: mode.cle,
          champ: "convention",
          message: "Choose the convention you'll be at.",
        };
      }
      if (!(mode.debut_le && mode.fin_le)) {
        return {
          cle: mode.cle,
          champ: "dates",
          message: "A convention needs both your dates.",
        };
      }
      if (mode.fin_le < mode.debut_le) {
        return {
          cle: mode.cle,
          champ: "dates",
          message: "The end date is before the start date.",
        };
      }
      continue;
    }
    //  nº 751 — LE MODE « AUTRE » A SES DEUX MANQUES À LUI, dans
    //  l'ordre où l'écran pose les questions : le statut d'abord, la
    //  zone ensuite. Ils passent AVANT le test de lieu commun, pour
    //  la même raison que ceux de la convention.
    if (mode.genre === "independent") {
      if (!mode.statut) {
        return {
          cle: mode.cle,
          champ: "statut",
          message: "Choose your status.",
        };
      }
      if (!pointDuMode(mode)) {
        return {
          cle: mode.cle,
          champ: "zone",
          message: "Add at least one service area.",
        };
      }
      continue;
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
        message: "Fill in the place for this mode.",
      };
    }
    //  §1 (nº 266) — LE NOM DU LIEU SAISI À LA MAIN. Même règle que
    //  les autres manques : le champ s'encadre de rouge, et cette
    //  phrase ne sert qu'à l'infobulle et aux lecteurs d'écran.
    if (nomLieuRequis(mode) && !(mode.nomLieu ?? "").trim()) {
      return {
        cle: mode.cle,
        champ: "nomLieu",
        message: "Give this place a name.",
      };
    }
    if (mode.genre === "guest" && !(mode.debut_le && mode.fin_le)) {
      return {
        cle: mode.cle,
        champ: "dates",
        message: "A guest spot needs both dates.",
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
        message: "The end date is before the start date.",
      };
    }
  }
  return null;
}

/**
 * TOUS LES MANQUES, PAS SEULEMENT LE PREMIER (§1, nº 267)
 * ==================================================================
 * LE RELEVÉ : « à domicile » avec son adresse mais SANS RAYON, et un
 * guest SANS DATES — rien ne rougissait. La nº 266 avait bien posé le
 * rouge, mais elle le branchait sur `premierManque`, qui s'ARRÊTE au
 * premier trouvé : un seul mode pouvait être désigné à la fois, et si
 * ce premier manque était ailleurs, les deux autres restaient muets.
 *
 * UN ARTISTE CUMULE LES QUATRE MODES. S'il a oublié quelque chose
 * dans les quatre, les quatre encadrements de badge, les quatre
 * titres et tous les champs concernés doivent rougir EN MÊME TEMPS.
 * Cette fonction rend donc LA LISTE COMPLÈTE — un manque par champ
 * manquant, dans l'ordre des modes puis des champs.
 *
 * ⚠️ UNE SEULE RÈGLE, DEUX LECTURES : `premierManque` n'est plus
 * qu'une vue de celle-ci (`tousLesManques(...)[0]`), et c'est elle qui
 * commande la remontée — la page mène toujours au PREMIER endroit à
 * corriger. Les deux ne peuvent plus diverger.
 *
 * LES CHAMPS OBLIGATOIRES, PAR MODE (la liste que le code connaît) :
 *  · EN STUDIO       — le lieu (le portfolio du studio OU une ville /
 *    (studio privé)    adresse), et LE NOM DU LIEU si l'adresse est
 *                      saisie à la main (nº 266). Le rôle y est
 *                      PROPOSÉ mais pas exigé : la migration nº 44
 *                      l'autorise pour un studio sans l'imposer, et
 *                      les lignes d'avant n'en ont pas ;
 *  · EN SALON        — LE RÔLE (fondateur / résident), le lieu (le
 *                      portfolio du salon OU l'adresse complète), et
 *                      le nom du lieu si saisi à la main ;
 *  · GUEST           — la nature du lieu (studio ou salon), le lieu,
 *                      le nom du lieu si saisi à la main, et LES DEUX
 *                      DATES (début et fin, la fin jamais avant le
 *                      début) ;
 *  · CONVENTION      — LA CONVENTION retenue dans l'écran (elle porte
 *    (nº 750)          le point, recopié du catalogue) et LES DEUX
 *                      DATES de l'artiste. Ni rôle, ni nom de lieu :
 *                      son panneau n'a pas ces champs ;
 *  · AUTRE           — LE STATUT (un des cinq) et LA ZONE (la ville
 *    (nº 751)          choisie, qui porte le point). Le RAYON n'est
 *                      pas exigé : il n'a de sens qu'autour d'une
 *                      ville ou d'une adresse. Une ligne par zone, le
 *                      statut répété sur chacune.
 * Et pour le bloc entier : le type de fiche, puis au moins un mode
 * choisi.
 */
export function tousLesManques(
  typeFiche: "artiste" | "salon" | null,
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[],
  etablissement?: string | null
): ManqueBloc[] {
  //  LES DEUX CAS QUI NE PARLENT PAS D'UN MODE — le type de fiche et
  //  le cas « salon » — n'ont qu'un seul manque possible : la vue
  //  d'ensemble et le premier manque disent alors la même chose.
  if (!typeFiche || typeFiche === "salon") {
    const seul = premierManque(typeFiche, modes, studios, etablissement);
    return seul ? [seul] : [];
  }
  const manques: ManqueBloc[] = [];
  /*  §4 (nº 269) — UN MODE OUVERT DISAIT TOUS SES MANQUES, MÊME VIERGE.
      Le filtre était ici `!modeVide(mode) || Boolean(mode.genre)` : il
      gardait les encadrés SEULEMENT OUVERTS, pour qu'un guest neuf
      laissé vide montre d'un coup tout ce qui lui manque.
      ██ §4 (nº 407) — CE `|| genre` EST SUPPRIMÉ, C'ÉTAIT LE DÉFAUT ██
      OUVRIR UN ONGLET POSE SON GENRE (`modeVierge`, BlocModesExercice)
      — c'est un choix de navigation, pas une déclaration. Le relevé du
      propriétaire : on ouvre Studio, on n'y saisit rien, on va remplir
      Salon en oubliant un champ, et « Je confirme » rougit LES DEUX.
      Le Studio n'avait jamais rien reçu.
      ⚠️ ET CETTE LIGNE MENTAIT AUX DEUX AUTRES. `blocExerciceComplet`
      et `premierManque` filtrent par `modesDeclares` — un encadré vide
      n'y compte pas et ne bloque donc rien. Ce filtre-ci en gardait
      plus : il posait du ROUGE sur un encadré qui n'empêchait pas
      d'enregistrer. Les trois lisent désormais la même liste, et une
      seule règle décide.
      ⚠️ CE QUE LE CAS DE LA nº 269 DEVIENT — un guest ouvert et vide,
      SEUL sur la fiche : `declares` est alors VIDE, et la branche
      juste au-dessus rend `premierManque`, qui désigne le lieu de
      l'onglet ouvert. Le cas reste traité ; il l'est par un seul
      rouge, à l'endroit où la personne se trouve, au lieu de quatre. */
  const declares = modesDeclares(modes);
  if (declares.length === 0) {
    const seul = premierManque(typeFiche, modes, studios, etablissement);
    return seul ? [seul] : [];
  }
  for (const mode of declares) {
    if (!mode.genre) {
      manques.push({
        cle: mode.cle,
        champ: "genre",
        message: "Choose one of the five ways you work.",
      });
      continue;
    }
    if (mode.genre === "salon" && !mode.role) {
      manques.push({
        cle: mode.cle,
        champ: "role",
        message: "Say whether you're the shop's founder or a resident.",
      });
    }
    //  nº 752 — LE GUEST SANS LIEU A SES DEUX MANQUES À LUI, et ils
    //  passent AVANT les règles du parcours « Oui » : ce panneau-là
    //  n'a ni bascule de nature, ni recherche de portfolio, ni nom de
    //  lieu — les désigner ferait chercher un rouge sur des champs
    //  qu'il n'a pas.
    if (mode.genre === "guest" && mode.sansLieu) {
      if (!(mode.debut_le && mode.fin_le)) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "A guest spot needs both dates.",
        });
      } else if (mode.fin_le < mode.debut_le) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "The end date is before the start date.",
        });
      }
      if (!pointDuMode(mode)) {
        manques.push({
          cle: mode.cle,
          champ: "ville",
          message: "Add at least one city for this guest spot.",
        });
      }
      continue;
    }
    if (mode.genre === "guest" && !mode.natureLieu) {
      manques.push({
        cle: mode.cle,
        champ: "genre",
        message: "Say whether the place hosting you is a studio or a shop.",
      });
    }
    //  nº 750 — LA MÊME BRANCHE QUE `premierManque`, et à la même
    //  place : les deux fonctions lisent la même règle, l'une s'arrête
    //  au premier manque, l'autre les liste tous (§1 nº 267).
    if (mode.genre === "convention") {
      if (!mode.convention || !pointDuMode(mode)) {
        manques.push({
          cle: mode.cle,
          champ: "convention",
          message: "Choose the convention you'll be at.",
        });
      }
      if (!(mode.debut_le && mode.fin_le)) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "A convention needs both your dates.",
        });
      } else if (mode.fin_le < mode.debut_le) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "The end date is before the start date.",
        });
      }
      continue;
    }
    //  nº 751 — LA MÊME BRANCHE QUE `premierManque`, et à la même
    //  place : les deux fonctions lisent la même règle, l'une s'arrête
    //  au premier manque, l'autre les liste tous (§1 nº 267).
    if (mode.genre === "independent") {
      if (!mode.statut) {
        manques.push({
          cle: mode.cle,
          champ: "statut",
          message: "Choose your status.",
        });
      }
      if (!pointDuMode(mode)) {
        manques.push({
          cle: mode.cle,
          champ: "zone",
          message: "Add at least one service area.",
        });
      }
      continue;
    }
    if (!pointDuMode(mode)) {
      manques.push({
        cle: mode.cle,
        champ: "lieu",
        message: "Fill in the place for this mode.",
      });
    }
    if (nomLieuRequis(mode) && !(mode.nomLieu ?? "").trim()) {
      manques.push({
        cle: mode.cle,
        champ: "nomLieu",
        message: "Give this place a name.",
      });
    }
    //  LES DATES d'une session guest : les deux, et dans l'ordre.
    if (mode.genre === "guest") {
      if (!(mode.debut_le && mode.fin_le)) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "A guest spot needs both dates.",
        });
      } else if (mode.fin_le < mode.debut_le) {
        manques.push({
          cle: mode.cle,
          champ: "dates",
          message: "The end date is before the start date.",
        });
      }
    }
  }
  return manques;
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
