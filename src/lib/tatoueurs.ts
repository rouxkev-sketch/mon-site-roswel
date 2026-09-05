import {
  CARTES_PAR_PAGE,
  genreDuModeFiltre,
  GROUPES_FILTRES,
  PHOTOS_LUES_PAR_FICHE,
  PLAFOND_CARROUSELS,
  profilDeLaFiche,
  rayonRetenu,
  renduCherche,
  slugDuGenreMode,
  SLUGS_FILTRES,
  filtresVivants,
  styleConnu,
} from "@/config/tatouage";
import { distanceKm, milesEnKm } from "@/lib/geo";
import {
  membresActifs,
  membreDepuisVue,
  modesActifs,
  lieuxDeLaFiche,
  type LieuDeFiche,
  type MembreEquipe,
  type ModeExerciceFiche,
  type StudioFiche,
} from "@/lib/modes-exercice";
import type { LieuTrouve } from "@/lib/geocodage/types";
import {
  NATURE_PAR_DEFAUT,
  natureCherchee,
  natureConnue,
  type PhotoTatoueur,
} from "@/lib/photos-tatoueur";
import {
  carrouselsDesFiches,
  ficheDuCarrousel,
} from "@/lib/carrousels";
import {
  catalogueDemoAutorise,
  MESSAGE_INDISPONIBLE,
} from "@/lib/catalogue-demonstration";
import { classerCarrousels } from "@/lib/classement-carrousels";
//  nº 357 — LE CATALOGUE LIT EN ANONYME : la session n'y change rien
//  (nº 275), et la lecture des cookies rendait dynamique toute page
//  qui liste des tatoueurs — voir lib/supabase/server.
import { creerClientSupabaseAnonyme } from "@/lib/supabase/server";
import { TATOUEURS_DEMO } from "@/lib/tatoueurs-demo";
import { nomVilleCourt } from "@/lib/villes";
import { slugifier } from "@/lib/slug";

/**
 * L'INDEX DES TATOUEURS — lecture
 * ================================
 * Un seul endroit lit la table `tatoueurs` : la page d'accueil, les
 * pages style + ville, les fiches et l'API de recherche passent tous
 * par ici. Un filtre corrigé l'est donc partout à la fois.
 *
 * LE REPLI SUR LA DÉMONSTRATION
 * -----------------------------
 * Tant que supabase/tatoueurs.sql n'a pas été passé, la table
 * n'existe pas. Plutôt qu'une page en erreur, on affiche les douze
 * tatoueurs de démonstration — ET ON LE DIT, en clair, sur la page
 * (`demonstration: true`). Jamais de repli silencieux : une donnée
 * inventée présentée comme réelle est pire qu'une page vide.
 */

/**
 * UNE VILLE DE TOURNÉE — pour les artistes ITINÉRANTS.
 * Le strict nécessaire pour l'AFFICHER et la SITUER : ce qu'on a
 * choisi dans la liste mondiale, réduit à l'essentiel.
 */
export type VilleFiche = {
  intitule: string;
  ville: string | null;
  region: string | null;
  pays: string | null;
  code_pays: string | null;
  latitude: number;
  longitude: number;
  lieu_id: string | null;
};

export type Tatoueur = {
  id: string;
  nom: string;
  slug: string;
  /** LE COMPTE PROPRIÉTAIRE. ⚠️ Il n'est JAMAIS lu par les pages
      publiques (il n'est pas dans `COLONNES`), et AUCUNE règle de
      visibilité ne le consulte : le masquage des fiches
      d'administrateur a disparu (nº 178 côté site, nº 275 en base).
      Il ne sert qu'à répondre « cette fiche est-elle la MIENNE ? » —
      le formulaire, la suppression, l'aperçu du propriétaire — et aux
      fiches de DÉMONSTRATION, qui rejouent la même question. */
  user_id?: string | null;
  /** L'ADRESSE D'AVANT : les liens déjà partagés restent bons — la
      page de fiche redirige l'ancien slug vers le nouveau. */
  ancien_slug?: string | null;
  /** « artiste » ou « salon » — le choix qui structure la fiche. */
  type_fiche?: string | null;
  /** LA NATURE DU LIEU — « salon » ou « prive ». Lue uniquement quand
      `type_fiche` vaut « salon » (voir config/tattoo :
      natureDeLaFiche). Absente des fiches d'artiste. */
  etablissement?: string | null;
  /** HÉRITAGE (migration nº 21) — plus lu depuis la nº 26 : les modes
      d'exercice sont devenus des LIGNES (voir `modes`). Conservé pour
      les fiches qui n'ont pas encore été réenregistrées. */
  mode_exercice?: string | null;
  /** HÉRITAGE — l'ancien rayon du mode « sur zone ». */
  rayon_zone_km?: number | null;
  /** HÉRITAGE — les villes de l'ancien mode « itinérant ». */
  villes?: VilleFiche[] | null;
  /** LES MODES D'EXERCICE d'un ARTISTE — cumulatifs, répétables, avec
      leurs dates pour les sessions guest (voir lib/modes-exercice). */
  modes?: ModeExerciceFiche[] | null;
  /** LES STUDIOS d'un SALON — une adresse, ou plusieurs. */
  studios?: StudioFiche[] | null;
  /** L'ÉQUIPE d'un SALON — déduite des liaisons validées. */
  equipe?: MembreEquipe[] | null;
  /** LE PORTFOLIO — une ligne par photo, taguée style + rendu
      (migration nº 31 ; les zones du corps ont été abandonnées à la
      nº 48). Vide pour une fiche qui n'a pas encore été rouverte :
      `photos_styles` prend alors le relais, et rien ne disparaît de
      l'écran. */
  galerie?: PhotoTatoueur[] | null;
  /**
   * §1 (nº 279) — LE CARROUSEL QUE CETTE CARTE MONTRE.
   * ------------------------------------------------------------------
   * ⚠️ IL N'EST POSÉ QUE SUR LES FICHES SERVIES À UNE MOSAÏQUE, où
   * l'unité n'est plus l'artiste mais LA GALERIE (lib/carrousels) :
   * un artiste à trois galeries donne trois fiches, identiques sauf
   * leur `galerie` (restreinte) et ce champ. Il porte :
   *  · `cle` — unique et stable : clé de rendu de la carte, et repère
   *    de position dans la mosaïque (l'identifiant de la fiche ne peut
   *    plus servir, deux cartes le partageraient) ;
   *  · les trois tags du carrousel, que la carte utilise pour sa photo,
   *    son lien et son cœur — à la place des critères de la recherche,
   *    qui sont les mêmes pour toute la page.
   * Absent partout ailleurs (fiche, favoris, aperçu) : ces écrans
   * n'affichent pas une liste de carrousels.
   */
  carrousel?: {
    cle: string;
    style: string;
    nature: string;
    rendu: string;
  } | null;
  /** Les BESOINS pris en charge : cover, cicatrice. */
  filtres_besoins?: string[] | null;
  /** LA PHOTO DE PROFIL, carrée en fichier, RONDE à l'affichage.
      Obligatoire depuis la refonte : une fiche sans visage n'existe
      pas. Null pour les fiches d'avant, tant qu'elles n'ont pas été
      réenregistrées. */
  photo_profil?: string | null;
  /** La date de DEMANDE de suppression du compte. Tant qu'elle est
      posée, la fiche est INVISIBLE partout — sans rien perdre : une
      reconnexion la remet à null et tout revient. */
  supprime_le?: string | null;
  ville_nom: string;
  ville_slug: string;
  latitude: number;
  longitude: number;
  /** SANS LIMITE : un tatoueur peut couvrir tous les styles du site.
      C'est la photo qui est limitée — une par style (photos_styles). */
  styles: string[];
  lien_instagram: string;
  /**
   * §2 (nº 408) — L'ARTISTE ACCEPTE-T-IL LES DEMANDES PAR DM ?
   * DÉCLARÉ par lui dans le formulaire, jamais deviné. Vrai → la fiche
   * écrit « Instagram • DM » à la place de « Instagram ».
   * ⚠️ FACULTATIF DANS LE TYPE, comme les autres colonnes récentes : la
   * migration `yokofolio-dm-instagram.sql` peut ne pas être passée, et
   * le site doit lire les fiches sans elle. Absent se lit « non ».
   */
  dm_instagram?: boolean | null;
  /** TikTok : facultatif. Vide ou absent = pas de bouton TikTok. */
  lien_tiktok?: string | null;
  /** La chaîne YouTube — facultative (migration nº 34). */
  lien_youtube?: string | null;
  /** L'ÉTAT DES CARNETS (passe nº 270, migration yokofolio-booking) :
      'ouvert', 'delai' ou 'ferme' — DÉCLARÉ par l'artiste, jamais
      deviné. NULL tant qu'une fiche n'a pas été réenregistrée : sa
      page publique n'affiche alors RIEN à cette place. */
  /**
   * ██ §6 (nº 853) — LE NOMBRE DE VUES DU PORTFOLIO ██
   * La colonne du SQL nº 852 (`docs/SQL-852-VUES.md`), passée en base
   * par le propriétaire. Elle n'est écrite QUE par la fonction
   * `compter_vue_portfolio` (jamais un `update` depuis le navigateur) et
   * lue ici comme n'importe quelle autre colonne publique.
   * ⚠️ FACULTATIVE, ET IL LE FAUT : une base où le SQL n'est pas passé
   * répond « colonne inconnue », et la lecture la retire d'elle-même
   * (`lireEnRetirantLInconnu`, plus bas) — le site continue sans le
   * nombre, il ne s'arrête pas.
   */
  vues?: number | null;
  booking?: "ouvert" | "delai" | "ferme" | null;
  /** Le nombre de mois d'attente (1 à 12) — n'a de sens qu'avec
      l'état 'delai' (« Booking · 3 mois »). NULL sinon. */
  booking_mois?: number | null;
  /** LA PAGE DE LIENS — Linktree ou Beacons. Un champ À PART du site
      depuis la passe nº 102 (migration nº 46) : ce ne sont pas la
      même chose pour le visiteur, et beaucoup de tatoueurs ont les
      deux. Facultatif. */
  page_de_liens?: string | null;
  /** LES TITRES DES DEUX LIENS LIBRES (passe nº 116, migration
      nº 51) : depuis la refonte du formulaire, le tatoueur NOMME ses
      liens lui-même (« Mon book », « Prendre RDV »…) — plus aucun
      service n'est deviné. Null sur une fiche d'avant la migration :
      l'affichage retombe alors sur `libelleDuLien` (le nom du
      service, ou le domaine), exactement comme avant. */
  titre_site_web?: string | null;
  titre_page_de_liens?: string | null;
  /** L'adresse du salon (numéro et rue), pour la fiche. */
  adresse?: string | null;
  /** Le code postal du salon. */
  code_postal?: string | null;
  /** L'ÉTAT, LA PROVINCE OU LA RÉGION — pour les pays qui en ont
      (États-Unis, Canada, Allemagne, Brésil…). Null ailleurs. */
  region?: string | null;
  /** Le pays, en toutes lettres, et son code ISO à deux lettres. */
  pays?: string | null;
  code_pays?: string | null;
  /** L'identifiant du lieu chez le fournisseur de géocodage
      (« photon:relation:7444 ») : il permet de le RETROUVER plus
      tard — vérification, mise à jour, changement de fournisseur. */
  lieu_id?: string | null;
  /** LA BIO : présentation libre du tatoueur, affichée sur la fiche
      JUSTE SOUS LE NOM. Bornes de saisie : 80 à 150 caractères (config
      BIO_MINIMUM / BIO_MAXIMUM). Null tant qu'elle n'est pas écrite. */
  bio?: string | null;
  /** LE SITE WEB du tatoueur : facultatif. Affiché sous l'adresse de
      la fiche (domaine seul, sans www ni https). Null si absent. */
  site_web?: string | null;
  /** LES FILTRES SECONDAIRES — interrupteurs allumés au formulaire
      (config FILTRES_TATOUAGE), un tableau de slugs par groupe. Vides
      tant que le tatoueur n'a rien allumé (ils sont facultatifs). */
  filtres_technique?: string[];
  filtres_composition?: string[];
  /** La photo montrée quand AUCUN style n'est demandé. */
  photo_principale: string;
  /**
   * UNE PHOTO PAR STYLE — la règle de yokofolio.
   * Le tatoueur qui coche « réalisme » et « floral » fournit une image
   * pour chacun ; c'est celle-là qu'on montre quand on cherche ce
   * style. Clé = slug du style, valeur = adresse de l'image.
   * Vide tant que l'inscription (étape 2) ne les demande pas.
   */
  photos_styles: Record<string, string>;
  /** Photos supplémentaires (galerie de la fiche). */
  photos: string[];
  publie: boolean;
  /** L'INTERRUPTEUR DE L'ÉCRAN DE DÉMARCHAGE (migration nº 43).
      ⚠️ IL NE DÉCIDE PLUS DE LA VISIBILITÉ (nº 275) : le masquage
      qu'il levait n'existe plus, ni côté site (nº 178) ni en base
      (migration yokofolio-recherche-sans-masquage.sql). C'est `publie`
      qui fait qu'une fiche est publique, pour tout le monde et sans
      exception. Cette colonne ne sert plus qu'au TABLEAU DE
      DÉMARCHAGE : l'interrupteur l'écrit avec `publie`, et le tableau
      la relit pour dire « en ligne ».
      Facultatif dans le type — la colonne peut manquer sur une base
      où la migration n'est pas passée, et le site doit continuer. */
  admin_publique?: boolean | null;
};

// La règle « quelle photo montrer ? » vit dans src/lib/photo-tatoueur.ts :
// les cartes en ont besoin CÔTÉ NAVIGATEUR, et ne peuvent donc pas
// importer ce fichier-ci, qui parle à la base côté serveur.
export { photoPourStyle } from "@/lib/photo-tatoueur";
import { photoChoisie } from "@/lib/photo-tatoueur";

export type FiltresTatoueurs = {
  /** Slug d'un style, ou vide pour tous les styles. */
  style?: string;
  /** LA NATURE DE PHOTO cherchée — « tatouage » ou « flash » (passe
      nº 110), ou vide. ⚠️ ELLE NE FILTRE PAS SUR UNE DÉCLARATION mais
      sur les PHOTOS elles-mêmes : chercher des flashs remonte les
      tatoueurs qui en ont DÉPOSÉ, pas ceux qui en annoncent. */
  nature?: string;
  /** LE POINT DE RÉFÉRENCE de la recherche par rayon — les
      coordonnées du lieu choisi dans la liste mondiale (Photon /
      OpenStreetMap, voir lib/geocodage). Absentes = pas de rayon =
      le monde entier. Ce sont elles, et plus aucune base de villes
      françaises, qui décident de la distance. */
  latitude?: number;
  longitude?: number;
  /** Ce que le lieu s'appelle — pour l'annoncer dans les résultats. */
  lieu?: string;
  /** LE NIVEAU DU LIEU CHOISI — c'est LUI qui décide du mode de
      recherche (voir `filtrer`) :
       « adresse » / « ville » → distance GPS, avec le rayon ;
       « region »             → toutes les fiches de cette région ;
       « pays »               → toutes les fiches de ce pays.
      Absent = « ville » (le comportement d'origine). */
  niveau?: "adresse" | "ville" | "region" | "pays";
  /** Le code pays du lieu (« DE », « CA »…) — critère du niveau
      « pays ». AUCUNE liste n'est écrite dans le code : c'est celui
      que le géocodeur a donné, comparé à celui des fiches. */
  codePays?: string;
  /** Le nom de la région/État — critère du niveau « region ». */
  region?: string;
  /** Le nom de la ville du lieu — critère de la recherche SANS rayon
      (rayon à zéro : la commune choisie, pas un cercle vide). */
  villeNom?: string;
  /** Rayon en MILES autour du point (nº 806 : le site parle en miles,
      la base en km — `milesEnKm` convertit à la frontière, voir
      lib/geo). ZÉRO = la ville seule, sans extension aux alentours.
      Ignoré aux niveaux région et pays. */
  rayonMi?: number;
  /** LES INTERRUPTEURS ÉTEINTS par la personne qui cherche : des
      slugs de FILTRES_TATOUAGE à EXCLURE. Vide = tout allumé = aucun
      filtrage (voir passeLesFiltres pour la règle exacte). */
  exclure?: string[];
  limite?: number;
  /** COMBIEN DE RÉSULTATS SAUTER — la pagination. 0 = la première
      page. C'est le seul ajout de la passe « performance » : la base
      rend désormais UNE page, pas tout le catalogue. */
  decalage?: number;
  /** COMBIEN DE PHOTOS rapporter par fiche. UNE suffit à une carte —
      c'est celle qu'elle affiche. La fiche complète, elle, passe par
      `lireTatoueur` et les reçoit toutes. */
  photosMax?: number;
  /** LA VILLE D'UNE PAGE « style + ville » — son slug exact, celui de
      l'adresse. Rien à voir avec `villeNom`, qui compare des noms de
      commune : ici on veut LA page /tattoo/blackwork/lyon-1er. */
  slugVille?: string;
  /** CLASSER PAR POPULARITÉ AVANT DE COUPER, et pas seulement à
      l'intérieur de la page. Les pages « style + ville » le font
      depuis toujours (elles montrent les plus consultés de la ville) ;
      l'accueil, lui, tire au hasard du jour puis reclasse la page. */
  prioriserClics?: boolean;
  /**
   * ██ §2 (nº 425) — LA GRAINE DU MÉLANGE, TRANSMISE PAR LA PAGINATION ██
   * ------------------------------------------------------------------
   * Le mélange du jour (`melangerDuJour`, et `p_jour` de la fonction de
   * base) se fonde sur le jour UTC. Deux rendus d'une même journée
   * voient donc le même ordre… sauf à cheval sur minuit UTC — 1 h ou
   * 2 h du matin en France : un « Voir plus » cliqué là recevait la
   * page 2 D'UN AUTRE JOUR que la page 1 affichée. Le lien de
   * pagination transmet désormais le jour du rendu affiché
   * (`?melange=…`), et le serveur le reprend — borné par
   * `jourDuMelange` : une adresse bricolée n'impose rien.
   * Absent : le jour courant, comme avant.
   */
  jourMelange?: number;
};

/**
 * §2 (nº 425) — LE JOUR QUE LE MÉLANGE UTILISE. La demande (le
 * `?melange=` d'une pagination) n'est retenue que si elle désigne un
 * jour à moins de deux jours du courant : assez pour traverser minuit
 * UTC et la régénération de l'accueil, trop peu pour rejouer un ordre
 * ancien depuis une adresse fabriquée.
 */
export function jourDuMelange(demande?: number): number {
  const courant = Math.floor(Date.now() / 86_400_000);
  if (
    demande !== undefined &&
    Number.isInteger(demande) &&
    Math.abs(demande - courant) <= 2
  ) {
    return demande;
  }
  return courant;
}

/** Les critères que le LIEU décide à lui seul. */
type CriteresDeLieu = Pick<
  FiltresTatoueurs,
  | "latitude"
  | "longitude"
  | "lieu"
  | "niveau"
  | "codePays"
  | "region"
  | "villeNom"
  | "rayonMi"
>;

/**
 * LE LIEU CHOISI → LE MODE DE RECHERCHE.
 * ---------------------------------------
 * UN SEUL endroit traduit « ce que la personne a choisi dans la
 * liste » en « comment on cherche » : la page d'accueil et l'API de
 * recherche s'en servent toutes les deux — elles ne peuvent donc pas
 * se contredire.
 *
 * Le RAYON n'a de sens qu'autour d'un point : une ville, une adresse.
 * Au niveau d'une région ou d'un pays, il est ignoré ici — exactement
 * comme il est masqué dans le moteur. Sans lieu du tout : aucun
 * critère, le monde entier.
 */
export function criteresDeLieu(
  lieu: LieuTrouve | null | undefined,
  rayonMi: number
): CriteresDeLieu {
  if (!lieu) return {};
  const autourDUnPoint =
    lieu.precision === "ville" || lieu.precision === "adresse";
  return {
    latitude: lieu.latitude,
    longitude: lieu.longitude,
    lieu: lieu.intitule,
    niveau: lieu.precision,
    codePays: lieu.code_pays ?? undefined,
    region: lieu.region ?? undefined,
    villeNom: lieu.ville ?? undefined,
    // Autour d'un POINT, le rayon est toujours d'au moins un palier
    // (voir `rayonRetenu`) ; sur une région ou un pays, il n'a pas
    // d'objet : zéro veut alors dire « la zone entière ».
    rayonMi: autourDUnPoint ? rayonRetenu(rayonMi) : 0,
  };
}

export type ResultatTatoueurs = {
  tatoueurs: Tatoueur[];
  /** Vrai quand les données viennent du jeu de démonstration. */
  demonstration: boolean;
  /** Ce qu'il faut dire à la personne, ou null si tout va bien. */
  message: string | null;
  /** La ville de référence retenue (pour le titre et le rayon). */
  ville: { nom: string; latitude: number; longitude: number } | null;
  /** COMBIEN DE FICHES RÉPONDENT EN TOUT à cette recherche — pas
      seulement celles de la page. C'est lui qui décide s'il faut
      proposer « Voir plus », et qui donne le compte annoncé. */
  total: number;
};

// Les deux listes sont annoncées comme de simples `string` : sans ça,
// Supabase déduit du texte exact une forme de résultat différente pour
// chacune, et les deux lectures (avec et sans les nouvelles colonnes)
// deviennent incompatibles entre elles. La forme réelle est posée plus
// bas, par `normaliser`.

/** Les colonnes présentes depuis la création de la table. */
const COLONNES_BASE: string =
  "id, nom, slug, ville_nom, ville_slug, latitude, " +
  "longitude, styles, lien_instagram, photo_principale, photos, publie";

/** Les colonnes ajoutées par les migrations yokofolio successives
    (photos par style, adresse, bio, site web, page de liens, filtres). */
const COLONNES: string =
  `${COLONNES_BASE}, photos_styles, lien_tiktok, lien_youtube, page_de_liens, ` +
  `adresse, code_postal, bio, site_web, titre_site_web, titre_page_de_liens, ` +
  `filtres_technique, filtres_composition, filtres_besoins, region, pays, code_pays, lieu_id, ` +
  `type_fiche, etablissement, mode_exercice, rayon_zone_km, villes, photo_profil, ancien_slug, supprime_le, ` +
  `user_id, booking, booking_mois, dm_instagram, vues`;

/**
 * LA MIGRATION N'EST PAS ENCORE PASSÉE ?
 * --------------------------------------
 * Tant qu'un fichier de supabase/ n'a pas été exécuté, les colonnes
 * qu'il ajoute n'existent pas : Supabase répond par une erreur de
 * colonne inconnue. On relit alors avec les SEULES colonnes d'origine
 * — le site continue de tourner comme avant la migration, au lieu de
 * basculer sur la démonstration et de faire croire que la table a
 * disparu.
 *
 * ⚠️ ON RECONNAÎT LA FORME DE L'ERREUR, PLUS LA LISTE DES NOMS. Cette
 * fonction énumérait les quinze colonnes ajoutées une à une. Une liste
 * pareille se périme au premier oubli : `etablissement` (migration
 * nº 37) y a manqué, et une base sans cette colonne ne renvoyait plus
 * les vraies fiches mais les douze fiches de DÉMONSTRATION — pour les
 * pages de fiche comme pour la recherche. Le nom de la colonne n'a
 * aucune importance ici : ce qui compte, c'est que la base dise « je
 * ne connais pas cette colonne ». Deux formulations existent, l'une
 * de PostgreSQL, l'autre de PostgREST :
 *   · `column tatoueurs.etablissement does not exist`  (code 42703)
 *   · `Could not find the 'x' column of 'y' in the schema cache`
 *     (code PGRST204, après un changement de schéma non rechargé).
 * Une TABLE absente dit « relation … does not exist » : le mot
 * « column » manque, la relecture n'est donc pas tentée pour rien.
 */
function colonneAbsente(message: string): boolean {
  const texte = message.toLowerCase();
  return (
    /column\b[^]*\bdoes not exist/.test(texte) ||
    /could not find the .* column/.test(texte) ||
    texte.includes("schema cache")
  );
}

/** LAQUELLE, exactement ? Les deux messages nomment la colonne. */
function colonneEnCause(message: string): string | null {
  const trouve =
    message.match(/column\s+(?:"?[a-z0-9_]+"?\.)?"?([a-z0-9_]+)"?\s+does not exist/i) ??
    message.match(/could not find the ['"]?([a-z0-9_]+)['"]? column/i);
  return trouve ? trouve[1] : null;
}

/**
 * RELIRE EN NE PERDANT QUE CE QUI MANQUE VRAIMENT.
 * ------------------------------------------------
 * Le repli d'origine était brutal : à la première colonne inconnue, on
 * relisait avec les DOUZE colonnes de la table d'origine. Une seule
 * migration en retard faisait donc disparaître la bio, l'adresse, les
 * filtres, le type de fiche… — tout ce qu'ont apporté les trente-six
 * autres. Ici, on retire UNIQUEMENT la colonne que l'erreur nomme, et
 * on recommence : la page perd exactement ce que la base ignore, et
 * rien d'autre.
 * Le repli d'origine reste le dernier recours, pour le cas où l'erreur
 * ne nommerait aucune colonne connue de la liste.
 */
async function lireEnRetirantLInconnu<T>(
  requete: (colonnes: string) => PromiseLike<{
    data: T | null;
    error: { message: string } | null;
  }>
): Promise<{ data: T | null; error: { message: string } | null }> {
  let liste = COLONNES;
  let reponse = await requete(liste);
  //  Une passe par colonne possible, et pas une de plus : la boucle
  //  s'arrête de toute façon dès qu'une réponse n'a plus d'erreur.
  const maximum = COLONNES.split(",").length;
  for (
    let essai = 0;
    essai < maximum && reponse.error && colonneAbsente(reponse.error.message);
    essai++
  ) {
    const nom = colonneEnCause(reponse.error.message);
    const restantes = liste
      .split(",")
      .map((colonne) => colonne.trim())
      .filter((colonne) => colonne !== nom);
    if (!nom || restantes.length === liste.split(",").length) {
      return requete(COLONNES_BASE);
    }
    liste = restantes.join(", ");
    reponse = await requete(liste);
  }
  return reponse;
}

/** Complète une ligne lue en base : jamais de champ manquant en aval.
    LES FICHES D'AVANT LA REFONTE n'ont ni type ni mode : elles sont
    des SALONS à une adresse — c'est exactement ce que la migration
    nº 21 écrit en base, et ce qu'on suppose ici tant qu'elle n'est
    pas passée. */
function normaliser(ligne: Tatoueur): Tatoueur {
  return {
    ...ligne,
    styles: ligne.styles ?? [],
    photos: ligne.photos ?? [],
    photos_styles: ligne.photos_styles ?? {},
    lien_tiktok: ligne.lien_tiktok ?? null,
    lien_youtube: ligne.lien_youtube ?? null,
    page_de_liens: ligne.page_de_liens ?? null,
    //  §6 (nº 853) — absente d'une base sans le SQL nº 852 : elle vaut
    //  alors `null`, et le pied de carte ne montre rien.
    vues: ligne.vues ?? null,
    booking: ligne.booking ?? null,
    booking_mois: ligne.booking_mois ?? null,
    adresse: ligne.adresse ?? null,
    code_postal: ligne.code_postal ?? null,
    bio: ligne.bio ?? null,
    site_web: ligne.site_web ?? null,
    titre_site_web: ligne.titre_site_web ?? null,
    //  §2 (nº 408) — absent (migration pas passée) se lit « non ».
    dm_instagram: ligne.dm_instagram ?? false,
    titre_page_de_liens: ligne.titre_page_de_liens ?? null,
    filtres_technique: ligne.filtres_technique ?? [],
    filtres_composition: ligne.filtres_composition ?? [],
    filtres_besoins: ligne.filtres_besoins ?? [],
    type_fiche: ligne.type_fiche ?? "salon",
    etablissement: ligne.etablissement ?? "salon",
    mode_exercice: ligne.mode_exercice ?? "adresse",
    rayon_zone_km: ligne.rayon_zone_km ?? null,
    villes: ligne.villes ?? [],
    // LES MODES ET LES STUDIOS sont lus À PART (voir `garnirFiches`) :
    // ce sont des tables, pas des colonnes. Une fiche qui n'en a pas
    // encore — parce que la migration nº 26 vient de passer, ou parce
    // qu'elle n'a jamais été réenregistrée — n'en affiche aucun, sans
    // que rien ne casse.
    modes: modesActifs(ligne.modes),
    studios: (ligne.studios ?? []).slice().sort((a, b) => a.ordre - b.ordre),
    equipe: membresActifs(ligne.equipe),
    photo_profil: ligne.photo_profil ?? null,
    ancien_slug: ligne.ancien_slug ?? null,
    supprime_le: ligne.supprime_le ?? null,
  };
}

/*  ⚠️ PLUS DE JEU FIGÉ (passe nº 122) : le catalogue s'agrandit en
    cours de vie (styles suggérés puis acceptés). Un `Set` construit au
    chargement du module aurait ignoré tout style né après le démarrage
    du serveur — et la page style + ville d'un style neuf serait restée
    introuvable. `styleDuCatalogue` relit le catalogue à chaque appel. */

/**
 * LE SCORE DE POPULARITÉ — lu dans la vue, jamais recalculé ici
 * ==================================================================
 * (passe nº 218-§5, migration nº 62)
 *
 * `popularite_tatoueurs` définit le score UNE SEULE FOIS, en base :
 *     consultations + 3 × cœurs + 8 × abonnés
 * La fonction de recherche s'en sert, et ce chemin-ci — le repli, quand
 * la base n'a pas la migration nº 32 — lit exactement la même vue. Deux
 * classements qui cohabitent finissent toujours par diverger ; c'est ce
 * genre de désaccord qui a produit le défaut de la nº 217-§2.
 *
 * ⚠️ REPLI SUR LES SEULS CLICS : une base où la nº 62 n'est pas passée
 * n'a pas la vue. On retombe alors sur `clics_tatoueurs` (nº 7), qui
 * donne déjà un ordre sensé. Et si elle manque aussi : une carte vide,
 * et le classement redevient le tirage du jour, sans bruit.
 */
/*  §1 (nº 620) — EXPORTÉE, ET RIEN D'AUTRE NE CHANGE : le catalogue de
    styles (lib/catalogue-styles) a besoin de la MÊME popularité pour
    départager deux photos à égalité de cœurs. La recopier ailleurs
    ferait cohabiter deux classements — exactement ce que la note
    ci-dessus dit d'éviter. */
export async function lirePopularite(): Promise<Map<string, number>> {
  try {
    const supabase = creerClientSupabaseAnonyme();
    const { data, error } = await supabase
      .from("popularite_tatoueurs")
      .select("slug, score");
    if (!error && data) {
      return new Map(
        (data as Array<{ slug: string; score: number }>).map((ligne) => [
          ligne.slug,
          Number(ligne.score) || 0,
        ])
      );
    }
    const secours = await supabase.from("clics_tatoueurs").select("slug, total");
    if (secours.error || !secours.data) return new Map();
    return new Map(
      (secours.data as Array<{ slug: string; total: number }>).map((ligne) => [
        ligne.slug,
        Number(ligne.total) || 0,
      ])
    );
  } catch {
    return new Map();
  }
}

/**
 * §3 (nº 279) — LE CLASSEMENT PAR POPULARITÉ A DÉMÉNAGÉ, ET CHANGÉ
 * ==================================================================
 * `classerParPopularite` vivait ici : un simple tri décroissant sur le
 * score brut (`consultations + 3 × cœurs + 8 × abonnés`). Elle est
 * SUPPRIMÉE, code compris — remplacée par `lib/classement-carrousels`,
 * l'écriture unique que consomment TOUTES les listes de cartes du
 * site. Deux différences, et ce sont les deux consignes du §3 :
 *  · LE SCORE VIEILLIT — un total qui ne décroît jamais fige la tête
 *    de liste pour toujours, et décourage ceux qui publient ;
 *  · L'UNITÉ EST LE CARROUSEL, pas la fiche (§1).
 * CE QUI NE CHANGE PAS, et qui reste la contrainte absolue (nº 218-§5,
 * migrations nº 61 et nº 63) : le classement porte sur LA LISTE
 * ENTIÈRE, jamais sur une tranche — `pageDeResultats` l'appelle avant
 * sa coupe, et nulle part ailleurs.
 */

/*  `styleConnu` et `natureCherchee` vivaient ici (leur histoire est
    restée sur leurs nouvelles définitions). Déménagées chez leurs
    données (nº 359) pour que FicheSelonLAdresse — composant client —
    puisse les lire sans entraîner ce module, qui parle à la base.
    Importées en tête (ce fichier s'en sert), ré-exportées ici : aucun
    appelant serveur n'a bougé. */
export { natureCherchee, styleConnu };

/** Ne garde que les slugs de filtre CONNUS (adresse ou API malmenée)
    ET ENCORE VIVANTS — nº 444 : les groupes ARTISTE (`mode`) et LIEU
    (`type`) ont quitté l'écran, un vieux lien qui les porte encore est
    ignoré proprement (voir SLUGS_FILTRES_RETIRES, config/tattoo).
    C'est LA porte unique de la recherche : la garde y suffit pour le
    serveur, la base et l'API. */
export function filtresConnus(slugs: string[] | undefined): string[] {
  return filtresVivants(
    (slugs ?? []).filter((slug) => SLUGS_FILTRES.has(slug))
  );
}

/**
 * LES GROUPES OÙ « RIEN DÉCLARÉ » VEUT DIRE « NON »
 * ==================================================
 * ⚠️ C'EST ICI QUE « BESOINS » ET « RENDU » NE FILTRAIENT RIEN.
 *
 * La règle d'origine épargnait toute fiche muette dans un groupe :
 * « les cases du formulaire sont facultatives, on n'écarte personne
 * sur un silence ». Elle est JUSTE pour Technique et Composition, où
 * le formulaire EXIGE au moins une case cochée — une fiche muette y
 * est forcément une vieille fiche d'avant ces groupes, et la punir
 * serait injuste.
 *
 * ELLE EST FAUSSE POUR LES DEUX AUTRES, et elle les annulait :
 *  · BESOINS est FACULTATIF dans le formulaire. Presque personne ne
 *    le remplit — donc presque toutes les fiches étaient « muettes »,
 *    donc épargnées, donc le filtre ne retirait jamais personne. Or un
 *    besoin n'est pas un goût : chercher « Cover », c'est chercher
 *    quelqu'un qui l'a DIT. Ne rien avoir dit, c'est non.
 *  · RENDU ne se déclare nulle part : il se lit dans les tags des
 *    photos. Une fiche sans photo taguée n'est ni noir et gris ni
 *    couleur — elle ne peut pas répondre « oui » à l'un des deux.
 *
 * Ces deux groupes-là écartent donc les fiches muettes. Technique,
 * Types de projets et le profil gardent la règle d'origine, au mot
 * près. La MÊME distinction est écrite dans la fonction de base
 * (supabase/yokofolio-filtres-besoins-rendu.sql, migration nº 35) :
 * les deux chemins doivent répondre pareil.
 *
 * ⚠️ ET « OÙ IL TATOUE » ? INDULGENT LUI AUSSI (migration nº 38). Un
 * artiste qui n'a déclaré aucun mode a une fiche incomplète, pas une
 * fiche qui dit non. Le masquer sur ce silence reviendrait à le punir
 * d'un oubli, alors que le formulaire réclame déjà ses modes au bloc
 * 1. On ne cache jamais quelqu'un par accident.
 */
const GROUPES_SANS_INDULGENCE = new Set(["besoins", "rendu"]);

/**
 * LES INTERRUPTEURS, appliqués à une fiche — par EXCLUSIONS.
 * Dans un groupe où des interrupteurs sont éteints, la fiche reste
 * visible si elle a déclaré AU MOINS UNE pratique encore allumée — ou
 * si elle n'a RIEN déclaré dans ce groupe ET que le groupe est
 * indulgent (voir ci-dessus). Les groupes se cumulent. Tout allumé
 * (aucune exclusion) = tout passe.
 */
function passeLesFiltres(tatoueur: Tatoueur, exclus: string[]): boolean {
  if (exclus.length === 0) return true;
  const eteints = new Set(exclus);
  for (const groupe of GROUPES_FILTRES) {
    const options: string[] = groupe.options.map((o) => o.slug);
    if (!options.some((slug) => eteints.has(slug))) continue; // groupe intact
    //  ⚠️ GROUPE ENTIÈREMENT ÉTEINT = CRITÈRE ABANDONNÉ (nº 148-§2),
    //  exactement comme en base (`allumesDuGroupe`) : vider un groupe
    //  de badges élargit la recherche, il ne la vide pas. Sans cette
    //  ligne, ce chemin-ci écarterait TOUT LE MONDE là où la base
    //  n'écarte personne — deux réponses différentes pour une même
    //  recherche.
    if (options.every((slug) => eteints.has(slug))) continue;

    // ⚠️ « OÙ IL TATOUE » NE PARLE QUE DES ARTISTES. Un salon n'a pas
    // de mode d'exercice, il a des adresses : éteindre « En guest » ne
    // doit lui retirer personne. Sans cette ligne, les deux groupes se
    // contrediraient à nouveau — c'est exactement le défaut corrigé.
    if (groupe.groupe === "mode" && (tatoueur.type_fiche ?? "salon") !== "artiste") {
      continue;
    }

    // CE QUE LA FICHE DÉCLARE dans ce groupe. Technique, projets et
    // besoins sont des PRATIQUES (des listes, parfois vides) ; le
    // profil est une valeur UNIQUE, toujours présente ; les modes sont
    // les genres que l'artiste a déclarés, sessions guest périmées
    // exclues (`modes` est déjà passé par `modesActifs`).
    const declares =
      groupe.groupe === "technique"
        ? (tatoueur.filtres_technique ?? [])
        : groupe.groupe === "composition"
          ? (tatoueur.filtres_composition ?? [])
          : groupe.groupe === "besoins"
            ? (tatoueur.filtres_besoins ?? [])
            : groupe.groupe === "rendu"
              ? // LE RENDU NE SE DÉCLARE PAS : il se DÉDUIT des photos.
                // Cocher « Couleur » remonte les tatoueurs qui ont AU
                // MOINS UNE photo en couleur — c'est la galerie qui
                // répond, pas une case à cocher de plus.
                Array.from(
                  new Set(
                    (tatoueur.galerie ?? [])
                      .map((photo) => photo.rendu)
                      .filter(Boolean) as string[]
                  )
                )
              : groupe.groupe === "mode"
                ? // ⚠️ `modesActifs` ICI AUSSI, ET PAS SEULEMENT À LA
                  // LECTURE DE LA BASE. Les fiches venues de la base
                  // sont déjà nettoyées par `normaliser`, mais celles
                  // de la DÉMONSTRATION portent leurs modes bruts —
                  // sessions guest terminées comprises. Sans ce filtre,
                  // « En guest » remontait ici trois artistes là où la
                  // base n'en rendait qu'un : une session finie en mars
                  // répondait encore « oui » en août. Mesuré, corrigé.
                  // Repasser une liste déjà nettoyée ne coûte rien.
                  Array.from(
                    new Set(
                      modesActifs(tatoueur.modes ?? [])
                        .map((mode) => slugDuGenreMode(mode.genre))
                        .filter(Boolean) as string[]
                    )
                  )
                : [profilDeLaFiche(tatoueur.type_fiche, tatoueur.etablissement)];
    if (declares.length === 0) {
      // RIEN DÉCLARÉ. Indulgent (technique, composition, type) : on
      // n'écarte pas. Besoins et rendu : un silence vaut « non ».
      if (GROUPES_SANS_INDULGENCE.has(groupe.groupe)) return false;
      continue;
    }
    const allumes = options.filter((slug) => !eteints.has(slug));
    if (!declares.some((slug) => allumes.includes(slug))) return false;
  }
  return true;
}

/**
 * UN ORDRE STABLE MAIS QUI CHANGE CHAQUE JOUR
 * -------------------------------------------
 * « Des cartes au hasard » à l'arrivée : sans ville ni style, on
* mélange. Mais un vrai hasard changerait à chaque rendu — la page
 * serait différente entre le serveur et le navigateur, et React
 * signalerait une incohérence. On mélange donc avec une graine
 * fondée sur LE JOUR : identique des deux côtés, renouvelée chaque
 * matin.
 * §2 (nº 425) — LE JOUR EST REÇU, plus calculé ici : c'est
 * `jourDuMelange` qui le fixe (le jour courant, ou celui qu'une
 * pagination transmet pour prolonger l'ordre de sa page 1).
 */
function melangerDuJour<T>(liste: T[], jour: number): T[] {
  return [...liste]
    .map((element, index) => ({
      element,
      rang: Math.sin((index + 1) * (jour + 1) * 12.9898) * 43758.5453,
    }))
    .sort((a, b) => (a.rang % 1) - (b.rang % 1))
    .map((x) => x.element);
}

/** Deux noms désignent-ils la MÊME COMMUNE ? Comme `memeNom`, mais
    le numéro d'arrondissement est mis de côté : « Paris 11e » et
    « Paris » sont la même ville, « Lyon 1er » et « Lyon » aussi. */
function memeCommune(a: string | null | undefined, b: string | null | undefined) {
  const sansArrondissement = (texte: string | null | undefined) =>
    (texte ?? "").replace(/\s+\d+\s*(er|e|ème|eme)?\s*$/i, "").trim();
  return memeNom(sansArrondissement(a), sansArrondissement(b));
}

/** Deux textes désignent-ils le même lieu ? Comparaison tolérante :
    casse, accents et espaces mis de côté — « Île-de-France » et
    « ile de france » sont le même endroit, et un géocodeur ne rend
    pas toujours exactement ce qu'une fiche a enregistré. */
function memeNom(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const normaliserTexte = (texte: string) =>
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return normaliserTexte(a) === normaliserTexte(b);
}

/**
 * Applique style, interrupteurs et LIEU à une liste déjà chargée.
 *
 * LE MODE DE RECHERCHE SUIT LA PRÉCISION DU LIEU CHOISI :
 *  - PAYS   : toutes les fiches dont le code pays correspond. Aucun
 *             rayon — 25 km autour du centre de la France ne
 *             couvriraient presque rien, c'était le bug.
 *  - RÉGION : toutes les fiches de cette région (dans ce pays, quand
 *             il est connu : deux « Córdoba » existent).
 *  - VILLE ou ADRESSE : calcul de distance, avec le rayon. Un rayon à
 *             ZÉRO ne garde que la ville elle-même.
 * Rien n'est codé en dur : le code pays et le nom de région viennent
 * du géocodeur et sont comparés à ceux des fiches.
 */
/**
 * « EN LIGNE » — LA RÈGLE DE LA BASE, RECOPIÉE ICI ET NULLE PART
 * AILLEURS (passe nº 178)
 * ==================================================================
 * LE DÉFAUT CORRIGÉ : la base répondait OUI (20 fiches visibles par un
 * visiteur, dont 2 rattachées à un compte) et la page répondait NON —
 * « Cette fiche n'est pas encore en ligne ». Deux règles cohabitaient,
 * et celle du site était PLUS SÉVÈRE que celle de la base : elle
 * masquait, EN PLUS, toute fiche appartenant à un compte
 * administrateur (`COURRIELS_ADMIN`) tant que `admin_publique` n'était
 * pas allumée. Or le propriétaire du site EST l'administrateur : ses
 * propres fiches tombaient sous cette règle, à leur adresse exacte
 * comme dans la mosaïque.
 *
 * IL N'Y A PLUS QU'UNE RÈGLE, et c'est celle de la base (migration
 * nº 60, fonction `fiche_en_ligne`) :
 *    publiée par l'administrateur (`publie`, colonne que le
 *    déclencheur `tatoueurs_garde_fou` lui réserve)
 *    ET pas en cours de suppression
 *    ET pas mise hors ligne
 *    ET pas refusée.
 *
 * ⚠️ RIEN N'EST RENDU PUBLIC AU-DELÀ : les trois conditions autres que
 * `publie` sont des VERROUS SUPPLÉMENTAIRES, que la page ne vérifiait
 * même pas jusqu'ici. Une fiche non publiée reste invisible ; une
 * fiche d'essai se cache désormais comme n'importe quelle autre — en
 * ne la publiant pas.
 */
export function estEnLigne(fiche: {
  publie?: boolean | null;
  supprime_le?: string | null;
  hors_ligne?: boolean | null;
  statut?: string | null;
}): boolean {
  return (
    fiche.publie === true &&
    !fiche.supprime_le &&
    fiche.hors_ligne !== true &&
    fiche.statut !== "refusee"
  );
}

/**
 * ██ §1 (nº 694) — LA MÊME RÈGLE, POSÉE SUR UNE LECTURE ██
 * ==================================================================
 * CE QUE L'AUDIT nº 691 A TROUVÉ (R2, rouge) : « Ma sélection » et la
 * bande des suivis filtraient `publie` TOUT SEUL, quand le reste du
 * site filtre `estEnLigne` (juste au-dessus). Un portfolio en
 * suppression différée reste `publie = true` pendant trente jours — il
 * disparaissait donc du public et RESTAIT dans ces deux listes, avec sa
 * carte, sa photo, et un lien qui menait à « Ce portfolio n'est pas
 * encore en ligne » : un message faux, en plus d'un lien mort.
 *
 * POURQUOI CE N'ÉTAIT PAS QU'UN OUBLI : `estEnLigne` lit QUATRE
 * colonnes, et une lecture qui n'en demande qu'une ne peut pas
 * l'appliquer. Corriger endroit par endroit aurait voulu dire recopier
 * cinq fois la même liste de colonnes et le même repli — donc cinq
 * occasions de diverger. Cette fonction-ci est cette liste, ce repli et
 * ce filtre, écrits UNE FOIS.
 *
 * ⚠️ LE REPLI EXISTE PARCE QUE DEUX COLONNES SONT RÉCENTES :
 * `hors_ligne` et `statut` manquent sur une base à qui il manque une
 * migration. On redemande alors sans elles, et `estEnLigne` se contente
 * de ce qu'elle a (`publie` et `supprime_le`) — le site marche comme
 * avant, jamais moins.
 * ⚠️ ELLE NE LÈVE JAMAIS : une lecture qui échoue rend une liste vide.
 * Une liste personnelle vide est désagréable ; une page en erreur l'est
 * davantage.
 */
export const VERROUS_EN_LIGNE = "publie, supprime_le, hors_ligne, statut";
const VERROUS_EN_LIGNE_SOBRES = "publie, supprime_le";

export async function listeEnLigne<T>(
  lire: (verrous: string) => PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  let reponse;
  try {
    reponse = await lire(VERROUS_EN_LIGNE);
    if (reponse.error) reponse = await lire(VERROUS_EN_LIGNE_SOBRES);
  } catch {
    return [];
  }
  if (reponse.error || !Array.isArray(reponse.data)) return [];
  return (reponse.data as T[]).filter((ligne) =>
    estEnLigne(ligne as Parameters<typeof estEnLigne>[0])
  );
}

/** LE PROPRIÉTAIRE NE QUITTE JAMAIS LE SERVEUR. Il est lu pour
    masquer, puis retiré : les fiches partent vers le navigateur sans
    lui, exactement comme avant cette passe. */
function sansProprietaire<T extends { user_id?: string | null }>(fiche: T): T {
  const copie = { ...fiche };
  delete copie.user_id;
  return copie;
}

function filtrer(
  liste: Tatoueur[],
  filtres: FiltresTatoueurs,
  ville: ResultatTatoueurs["ville"]
): Tatoueur[] {
  // PUBLIÉE, et pas en cours de suppression : un compte dont la
  // suppression est demandée disparaît du public IMMÉDIATEMENT, sans
  // rien perdre (voir `supprime_le`).
  let retenus = liste.filter((t) => t.publie && !t.supprime_le);

  //  ============================================================
  //  LE STYLE SE LIT DANS LES PHOTOS (passe nº 151, migration nº 58)
  //  ------------------------------------------------------------
  //  AVANT : `t.styles.includes(style)` — la DÉCLARATION de la fiche.
  //  Un style annoncé et jamais rempli remontait donc dans une
  //  photothèque, pour n'y rien montrer.
  //  MAINTENANT : il faut une PHOTO CATALOGUÉE de ce style. Un style
  //  n'existe pour la recherche que s'il porte au moins une image.
  //  ⚠️ LE MÊME TEST QU'EN BASE, mot pour mot : ce chemin-ci sert
  //  quand la recherche en base ne peut pas se faire, et deux chemins
  //  qui ne disent pas la même chose valent un défaut qui n'apparaît
  //  qu'une fois sur dix.
  //  Une fiche sans catalogue du tout (portfolio pas encore repris)
  //  ne répond donc plus à un style : c'est ce que la migration nº 57
  //  corrige en cataloguant ses images.
  //  ============================================================
  const style = styleConnu(filtres.style);
  if (style) {
    retenus = retenus.filter((t) =>
      (t.galerie ?? []).some((photo) => photo.style === style)
    );
  }

  //  LA NATURE (tatouage / flash) SE LIT DANS LES PHOTOS, jamais dans
  //  une déclaration : c'est là toute la différence avec l'ancienne
  //  case « Flash ». Combinée au style quand il y en a un — « des
  //  flashs EN réalisme », et pas « des flashs ET du réalisme ».
  //
  //  ⚠️ LE REPLI DE LA PASSE Nº 148 A ÉTÉ RETIRÉ (passe nº 151,
  //  migration nº 58). Il gardait la fiche « quand on n'avait rien à
  //  lui opposer » — aucune photo cataloguée sur le style cherché,
  //  donc le style déclaré faisait foi. C'est cette règle-là que le
  //  propriétaire a annulée : un style sans photo n'a rien à montrer.
  //  La nature redevient une simple lecture des photos, sans
  //  exception — et sans rattrapage.
  const nature = natureCherchee(filtres.nature);
  if (nature) {
    retenus = retenus.filter((t) =>
      (t.galerie ?? []).some(
        (photo) =>
          natureConnue(photo.nature) === nature &&
          (!style || photo.style === style)
      )
    );
  }

  // LA VILLE D'UNE PAGE DE RÉFÉRENCEMENT — le slug de l'adresse, tel
  // quel : c'est lui qui fait la page, quel que soit le pays.
  // ⚠️ SUR N'IMPORTE LEQUEL DE SES LIEUX : un artiste en guest à
  // Bordeaux a sa place sur /tattoo/blackwork/bordeaux. Les modes et
  // les studios n'ont pas de colonne « slug » — on le calcule, avec la
  // MÊME fonction que partout ailleurs.
  if (filtres.slugVille) {
    const cible = filtres.slugVille;
    retenus = retenus.filter(
      (t) =>
        t.ville_slug === cible ||
        lieuxDeLaFiche(t).some((lieu) => slugifier(lieu.ville ?? "") === cible)
    );
  }

  // Les interrupteurs éteints par la personne, s'il y en a.
  const exclus = filtresConnus(filtres.exclure);
  if (exclus.length > 0) {
    retenus = retenus.filter((t) => passeLesFiltres(t, exclus));
  }

  const niveau = filtres.niveau ?? "ville";

  if (niveau === "pays" && filtres.codePays) {
    // TOUT LE PAYS — le code ISO de N'IMPORTE LEQUEL de ses lieux
    // contre celui cherché. Une enseigne française avec une adresse à
    // Berlin répond « oui » à l'Allemagne : c'est vrai, elle y tatoue.
    const cible = filtres.codePays.trim().toUpperCase();
    retenus = melangerDuJour(
      retenus.filter((t) =>
        lieuxDeLaFiche(t).some(
          (lieu) => (lieu.codePays ?? "").toUpperCase() === cible
        )
      ),
      jourDuMelange(filtres.jourMelange)
    );
  } else if (niveau === "region" && filtres.region) {
    // TOUTE LA RÉGION — son nom, comparé sans casse ni accents. Le
    // pays vient en garde-fou quand on le connaît (deux régions
    // homonymes dans deux pays différents ne se mélangent pas).
    // ⚠️ LES DEUX SE VÉRIFIENT SUR LE MÊME LIEU, jamais l'un sur la
    // fiche et l'autre sur un lieu : sinon un artiste français en
    // guest en Catalogne ressortirait pour « Catalogne, France ».
    const cible = filtres.codePays?.trim().toUpperCase();
    retenus = melangerDuJour(
      retenus.filter((t) =>
        lieuxDeLaFiche(t).some(
          (lieu) =>
            memeNom(lieu.region, filtres.region) &&
            (!cible || (lieu.codePays ?? "").toUpperCase() === cible)
        )
      ),
      jourDuMelange(filtres.jourMelange)
    );
  } else if (ville) {
    // AUTOUR D'UN POINT — la même fonction de distance que les
    // artisans (src/lib/geo.ts) : un seul calcul dans tout le projet.
    const rayon = milesEnKm(filtres.rayonMi ?? 0);
    // UNE FICHE A AUTANT DE LIEUX QUE D'ADRESSES : l'enseigne qui
    // tient Lyon ET Paris doit sortir dans les deux recherches, et
    // l'artiste en guest à Paris en septembre aussi. On retient donc
    // LE PLUS PROCHE de ses lieux — jamais le seul point historique
    // de la fiche. Les sessions guest terminées n'en font pas partie :
    // elles ne sont plus vraies.
    //
    // ⚠️ ET UN LIEU « À DOMICILE » N'EST PAS UN POINT, C'EST UN
    // DISQUE. L'artiste qui se déplace à 50 km autour de Lyon est
    // chez vous si vous habitez à 40 km de Lyon : sa distance
    // EFFECTIVE est nulle. On retranche donc son rayon — ce qui le
    // fait aussi remonter en tête du classement, et c'est juste :
    // il vient, on ne se déplace pas.
    const effective = (lieu: LieuDeFiche) =>
      Math.max(
        distanceKm(
          ville.latitude,
          ville.longitude,
          lieu.latitude,
          lieu.longitude
        ) - lieu.rayonKm,
        0
      );
    const parDistance = retenus
      .map((t) => {
        const lieux = lieuxDeLaFiche(t);
        return { t, lieux, km: Math.min(...lieux.map(effective)) };
      })
      // Le plus proche d'abord : c'est ce qu'on attend d'une recherche
      // par rayon.
      .sort((a, b) => a.km - b.km);

    if (rayon > 0) {
      retenus = parDistance.filter(({ km }) => km <= rayon).map(({ t }) => t);
    } else {
      // SANS RAYON — « la ville seule ». Pas un cercle de zéro
      // kilomètre (le point du géocodeur est au centre-ville : aucun
      // salon n'est exactement dessus), mais LA COMMUNE CHOISIE : on
      // compare les noms de ville, arrondissements compris — chercher
      // « Paris » sans rayon rend bien les fiches de Paris 11e.
      // ⚠️ ET LES ZONES DE DÉPLACEMENT QUI LA COUVRENT : l'artiste qui
      // se déplace à 50 km autour de Lyon se rend à Vienne, même si
      // aucun de ses lieux ne s'appelle « Vienne ».
      // Sans nom de ville connu (cas rare), un très petit rayon prend
      // le relais : mieux vaut peu que rien.
      const commune = filtres.villeNom;
      retenus = commune
        ? parDistance
            .filter(
              ({ lieux, km }) =>
                lieux.some((lieu) => memeCommune(lieu.ville, commune)) ||
                km <= 0
            )
            .map(({ t }) => t)
        : parDistance.filter(({ km }) => km <= 2).map(({ t }) => t);
    }
  } else {
    retenus = melangerDuJour(retenus, jourDuMelange(filtres.jourMelange));
  }

  // LE LIEU AFFICHÉ EST CELUI QUI RÉPOND À LA RECHERCHE, pas
  // systématiquement l'adresse de la fiche : chercher « Paris » et
  // lire « Lyon » sur la carte serait incompréhensible. Même règle
  // qu'en base (la jointure `lc` de la migration nº 42).
  retenus = retenus.map((t) => avecLeLieuTrouve(t, filtres, ville));

  // ⚠️ AUCUNE DÉCOUPE ICI : cette fonction rend TOUT ce qui répond, dans
  // l'ordre. C'est l'appelant qui prend la page demandée — il a besoin
  // du total pour savoir s'il reste des résultats à montrer.
  return retenus;
}

/**
 * LA FICHE, AVEC LE LIEU QUI RÉPOND À LA RECHERCHE.
 * ⚠️ ON NE TOUCHE QUE L'ADRESSE : ni le nom, ni le slug, ni les
 * photos. Le slug fait le lien vers la page — le changer casserait
 * tout. Sans recherche géographique, la fiche revient telle quelle.
 */
function avecLeLieuTrouve(
  tatoueur: Tatoueur,
  filtres: FiltresTatoueurs,
  point: ResultatTatoueurs["ville"]
): Tatoueur {
  const niveau = filtres.niveau ?? "ville";
  const cible = filtres.codePays?.trim().toUpperCase();
  const lieux = lieuxDeLaFiche(tatoueur);

  let trouve: LieuDeFiche | undefined;
  if (niveau === "pays" && cible) {
    trouve = lieux.find((l) => (l.codePays ?? "").toUpperCase() === cible);
  } else if (niveau === "region" && filtres.region) {
    trouve = lieux.find(
      (l) =>
        memeNom(l.region, filtres.region) &&
        (!cible || (l.codePays ?? "").toUpperCase() === cible)
    );
  } else if (point) {
    //  LE PLUS PROCHE, rayon de déplacement défalqué — le même
    //  classement que pour retenir la fiche.
    trouve = lieux
      .slice()
      .sort(
        (a, b) =>
          Math.max(
            distanceKm(point.latitude, point.longitude, a.latitude, a.longitude) -
              a.rayonKm,
            0
          ) -
          Math.max(
            distanceKm(point.latitude, point.longitude, b.latitude, b.longitude) -
              b.rayonKm,
            0
          )
      )[0];
  }

  //  RIEN À CHANGER : pas de recherche de lieu, ou c'est déjà
  //  l'adresse de la fiche.
  if (!trouve || trouve.rang === 0) return tatoueur;
  return {
    ...tatoueur,
    ville_nom: trouve.ville ?? tatoueur.ville_nom,
    ville_slug: trouve.ville ? slugifier(trouve.ville) : tatoueur.ville_slug,
    latitude: trouve.latitude,
    longitude: trouve.longitude,
    adresse: trouve.adresse,
    code_postal: trouve.codePostal,
    region: trouve.region,
    pays: trouve.pays,
    code_pays: trouve.codePays,
  };
}

/** LE POINT DE RÉFÉRENCE de la recherche — les coordonnées portées
    par les filtres, telles que le lieu choisi les a données. Null dès
    qu'il en manque une : sans point, pas de rayon (on montre alors
    tout le monde). */
function pointDeReference(
  filtres: FiltresTatoueurs
): ResultatTatoueurs["ville"] {
  const { latitude, longitude } = filtres;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    nom: filtres.lieu?.trim() || "this place",
    latitude: latitude as number,
    longitude: longitude as number,
  };
}

/**
 * LE POINT DE RÉFÉRENCE D'UNE PAGE « style + ville » (adresses de
 * référencement : /tattoo/realisme/lyon-1er).
 * LA SOURCE A CHANGÉ : ce sont désormais LES FICHES ELLES-MÊMES qui
 * disent où se trouve une ville — chacune porte son nom de ville, son
 * slug et ses coordonnées, où qu'elle soit dans le monde. Plus besoin
 * d'une table de communes françaises : une page « berlin » ou
 * « brooklyn » fonctionne exactement comme « lyon-1er », sans rien
 * ajouter nulle part.
 * Les coordonnées retenues sont celles de la PREMIÈRE fiche trouvée
 * dans cette ville : à l'échelle d'un rayon de recherche (10 km au
 * minimum), l'écart d'un salon à l'autre ne change rien.
 */
export async function lireVilleParSlug(
  slug: string
): Promise<{ ville: ResultatTatoueurs["ville"]; panne: boolean }> {
  /**
   * ██ §1 (nº 724) — « JE N'AI RIEN TROUVÉ » N'EST PAS « JE N'AI PAS PU
   * LIRE » ██
   * ------------------------------------------------------------------
   * CE QUE CETTE FONCTION RENDAIT, ET LE DÉFAUT QUI EN DÉCOULAIT : un
   * `null`, dans les DEUX cas — la ville n'existe pas, ou la base ne
   * répond pas. L'appelant ne pouvait pas les distinguer, et la page
   * « style + ville » concluait « page introuvable » pour une panne
   * d'une heure. Google lit cela comme une adresse qui n'existe pas et
   * retire la page de son index : un coût de référencement durable
   * pour un incident passager, sur les pages FAITES pour lui.
   * ⚠️ ET IL Y AVAIT DEUX PORTES, PAS UNE. Le `catch` en aplatissait
   * une (une exception réseau) ; l'autre passait inaperçue —
   * `maybeSingle()` ne LÈVE PAS sur une erreur de base, il la range
   * dans `error`, que personne ne lisait. Une base qui répond « je
   * refuse » donnait donc `data: null`, exactement comme une ville
   * absente. On lit désormais les deux.
   */
  try {
    const supabase = creerClientSupabaseAnonyme();
    /*  §2 (nº 694) — CELLE-CI GARDE `publie` TOUT SEUL, ET C'EST UN
        CHOIX, pas un oubli. La nº 694 a aligné sur `estEnLigne` toutes
        les listes qui MONTRENT des portfolios ; ici on ne montre rien —
        on cherche le POINT DE RÉFÉRENCE d'une page « style + ville »,
        c'est-à-dire des coordonnées.
        CE QU'ON GAGNERAIT À ALIGNER : rien. CE QU'ON PERDRAIT : une
        ville dont les portfolios sont tous en suppression différée
        rendrait « page introuvable » (404) au lieu d'une page qui dit
        « Aucun tatoueur pour l'instant » — et qui porte déjà `noindex`
        quand elle est vide (voir la page). Or ces portfolios peuvent
        revenir dans les trente jours : un 404 dit « cette adresse
        n'existe pas », ce qui serait faux. La page vide, elle, dit le
        vrai.
        ⚠️ AUCUN PORTFOLIO INVISIBLE NE PASSE PAR LÀ : la LISTE de la
        page, elle, vient de `listerTatoueurs`, qui applique la règle
        entière. Cette lecture-ci ne rend qu'un nom de ville et deux
        coordonnées. */
    const { data, error } = await supabase
      .from("tatoueurs")
      .select("ville_nom, latitude, longitude")
      .eq("ville_slug", slug)
      .eq("publie", true)
      .limit(1)
      .maybeSingle();
    //  §1 (nº 724) — LA SECONDE PORTE : une erreur rendue plutôt que
    //  levée. Sans cette ligne, elle se confondait avec « rien trouvé ».
    if (error) throw new Error(error.message);
    const ligne = data as {
      ville_nom?: string;
      latitude?: number;
      longitude?: number;
    } | null;
    if (ligne && Number.isFinite(ligne.latitude) && Number.isFinite(ligne.longitude)) {
      return {
        ville: {
          nom: nomVilleCourt(ligne.ville_nom ?? ""),
          latitude: ligne.latitude as number,
          longitude: ligne.longitude as number,
        },
        panne: false,
      };
    }
    //  Lecture réussie, aucune ligne : cette ville n'existe pas. C'est
    //  un vrai « introuvable », et il doit le rester.
    return { ville: null, panne: false };
  } catch {
    //  Base injoignable ou refus : on ne sait RIEN de cette ville — et
    //  c'est très différent de savoir qu'elle n'existe pas.
    //  §4 (nº 278) — les fiches de démonstration, jamais en production.
    if (catalogueDemoAutorise()) {
      const demo = TATOUEURS_DEMO.find((t) => t.ville_slug === slug);
      if (demo) {
        return {
          ville: {
            nom: nomVilleCourt(demo.ville_nom),
            latitude: demo.latitude,
            longitude: demo.longitude,
          },
          panne: false,
        };
      }
    }
    return { ville: null, panne: true };
  }
}

/**
 * LES MODES, LES STUDIOS ET LES ÉQUIPES — LUS À PART, ET C'EST VOULU
 * ===================================================================
 * Ce ne sont pas des colonnes, ce sont des TABLES : trois lectures
 * groupées (`in(...)`) plutôt qu'une jointure imbriquée.
 *
 * POURQUOI PAS L'IMBRICATION POSTGREST (`modes_exercice(*)`) ?
 * Parce que `modes_exercice` pointe DEUX FOIS vers `tatoueurs`
 * (`tatoueur_id` et `salon_id`) : l'imbrication devient ambiguë et
 * n'accepte plus qu'un nom de contrainte écrit en dur dans la requête
 * — un détail d'implémentation de la base, dans du code d'affichage.
 *
 * ET SI LA MIGRATION Nº 26 N'EST PAS PASSÉE ? On renvoie les fiches
 * telles quelles, sans modes ni studios. Le site continue exactement
 * comme avant : aucune page en erreur pour une table qui n'existe pas
 * encore — c'est la même règle que pour les colonnes (voir
 * `colonneAbsente`).
 */
async function garnirFiches<T extends Tatoueur>(
  supabase: ReturnType<typeof creerClientSupabaseAnonyme>,
  fiches: T[]
): Promise<T[]> {
  if (fiches.length === 0) return fiches;
  const identifiants = fiches.map((fiche) => fiche.id);
  try {
    const [modes, studios, equipe, photos] = await Promise.all([
      supabase.from("modes_exercice").select("*").in("tatoueur_id", identifiants),
      supabase.from("studios").select("*").in("tatoueur_id", identifiants),
      supabase.from("equipe_salon").select("*").in("salon_id", identifiants),
      // LE PORTFOLIO — migration nº 31. Une erreur ici (table pas
      // encore créée) ne doit rien empêcher : la galerie sera vide,
      // et `photos_styles` prendra le relais partout.
      supabase
        .from("photos_tatoueur")
        .select("*")
        .in("tatoueur_id", identifiants)
        .order("ordre"),
    ]);
    if (modes.error || studios.error || equipe.error) return fiches;
    const galerieParFiche = new Map<string, PhotoTatoueur[]>();
    for (const ligne of (photos.error ? [] : (photos.data ?? [])) as unknown as Array<
      PhotoTatoueur & { tatoueur_id: string; en_attente?: boolean | null }
    >) {
      /**
       * §1 (nº 285) — RÈGLE 6 : UNE PHOTO QUI ATTEND SA RELECTURE
       * N'EXISTE PAS POUR LE PUBLIC.
       * ------------------------------------------------------------------
       * C'est ici que la règle se tient pour TOUTES les lectures qui
       * passent par ce chemin : la page d'une fiche (`lireTatoueur`) et
       * la mosaïque de secours. Le chemin rapide, lui, est filtré EN
       * BASE (migration nº 70, dans la clause qui ramasse les photos).
       * ⚠️ LA FICHE, ELLE, RESTE EN LIGNE, exactement comme elle était :
       * on retire des photos d'une galerie, on ne retire jamais une
       * fiche du site. Un carrousel dont TOUTES les photos attendent
       * n'apparaît simplement pas encore — il apparaîtra validé.
       * ⚠️ SANS LA MIGRATION Nº 70 la colonne n'existe pas : la valeur
       * est `undefined`, la photo est gardée, et le site se comporte
       * exactement comme avant cette passe.
       */
      if (ligne.en_attente === true) continue;
      const liste = galerieParFiche.get(ligne.tatoueur_id) ?? [];
      liste.push({
        id: ligne.id,
        style: ligne.style,
        rendu: ligne.rendu,
        //  Base sans la migration nº 49 : la colonne est absente,
        //  `natureConnue` rend « tatouage ». Rien ne casse.
        nature: natureConnue(ligne.nature),
        url: ligne.url,
        miniature: ligne.miniature,
        ordre: ligne.ordre,
        //  §3 (nº 279) — LA DATE DE DÉPÔT : c'est elle qui donne son
        //  âge au carrousel, donc son rang dans un classement qui
        //  vieillit. Absente d'une base ancienne : le carrousel est
        //  traité comme neuf.
        cree_le: ligne.cree_le ?? null,
      });
      galerieParFiche.set(ligne.tatoueur_id, liste);
    }

    const lignesModes = (modes.data ?? []) as unknown as (ModeExerciceFiche & {
      tatoueur_id: string;
    })[];

    // LE NOM DU SALON LIÉ, recopié une fois pour toutes : l'affichage
    // n'a plus à interroger quoi que ce soit, et le lien vers la
    // fiche du salon est prêt.
    const salonsVises = [
      ...new Set(
        lignesModes.map((mode) => mode.salon_id).filter(Boolean) as string[]
      ),
    ];
    const salons = new Map<
      string,
      { nom: string; slug: string; photo_profil: string | null }
    >();
    if (salonsVises.length > 0) {
      const reponse = await supabase
        .from("tatoueurs")
        .select("id, nom, slug, photo_profil")
        .in("id", salonsVises);
      for (const ligne of (reponse.data ?? []) as unknown as {
        id: string;
        nom: string;
        slug: string;
        photo_profil: string | null;
      }[]) {
        salons.set(ligne.id, {
          nom: ligne.nom,
          slug: ligne.slug,
          photo_profil: ligne.photo_profil,
        });
      }
    }

    const parFiche = new Map<string, ModeExerciceFiche[]>();
    for (const ligne of lignesModes) {
      const salon = ligne.salon_id ? salons.get(ligne.salon_id) : undefined;
      const liste = parFiche.get(ligne.tatoueur_id) ?? [];
      liste.push({
        ...ligne,
        salon_nom: salon?.nom ?? null,
        salon_slug: salon?.slug ?? null,
        salon_photo: salon?.photo_profil ?? null,
      });
      parFiche.set(ligne.tatoueur_id, liste);
    }

    const studiosParFiche = new Map<string, StudioFiche[]>();
    for (const ligne of (studios.data ?? []) as unknown as (StudioFiche & {
      tatoueur_id: string;
    })[]) {
      const liste = studiosParFiche.get(ligne.tatoueur_id) ?? [];
      liste.push(ligne);
      studiosParFiche.set(ligne.tatoueur_id, liste);
    }

    const lignesEquipe = (equipe.data ?? []) as unknown as {
      salon_id: string;
      artiste_id: string;
      //  §1 (nº 410) — ce qui distingue deux lignes d'un même artiste
      //  chez un même lieu. Absents tant que la migration
      //  `yokofolio-equipe-par-mode.sql` n'est pas passée.
      liaison_id?: string | null;
      mode_id?: string | null;
      artiste_nom: string;
      artiste_slug: string | null;
      artiste_photo: string | null;
      genre: string | null;
      //  ⚠️ LE RÔLE N'ARRIVE QUE DEPUIS LA MIGRATION Nº 65 : la vue ne
      //  le rendait pas. Absent, `membreDepuisVue` lit « résident ».
      role?: string | null;
      debut_le: string | null;
      fin_le: string | null;
    }[];

    /**
     * ██ §3 (nº 288) — LE RÔLE VIENT DE L'ARTISTE, ET DE LUI SEUL ██
     * ==================================================================
     * LE DÉFAUT RELEVÉ : le même artiste s'affichait FONDATEUR sur sa
     * fiche et RÉSIDENT dans l'équipe de son studio. Sa fiche lit sa
     * DÉCLARATION (`modes_exercice.role`, ce qu'il a coché dans son
     * formulaire) ; l'équipe lisait la vue `equipe_salon`, dont le rôle
     * vaut `null` dès que la liaison ne pend à aucun mode — et ce
     * `null` retombait sur « résident », une valeur DEVINÉE. Deux
     * calculs, deux réponses.
     * LA CORRECTION : on va chercher LA DÉCLARATION, une fois, pour
     * tous les membres de toutes les fiches lues, et c'est elle qui
     * décide. La vue continue de dire QUI est de l'équipe (liaisons
     * validées, artiste en ligne, guest non expiré) — elle ne dit plus
     * à quel titre.
     * ⚠️ UNE SEULE REQUÊTE DE PLUS, et seulement s'il y a une équipe.
     * ⚠️ JAMAIS BLOQUANTE : en cas d'échec, on retombe exactement sur
     * le comportement d'avant cette passe.
     */
    /**
     * ██ §1 (nº 412) — LA DÉCLARATION NE COMBLE PLUS QUE LES TROUS ██
     * ------------------------------------------------------------------
     * LE RELEVÉ DU PROPRIÉTAIRE (Gaston, trois lignes « Résident » sans
     * dates) A MONTRÉ QUE LA PRÉSÉANCE DE LA nº 288 ÉTAIT DEVENUE
     * FAUSSE. Elle faisait TOUJOURS gagner la déclaration sur la vue —
     * juste quand chaque artiste n'avait qu'un mode, faux depuis qu'il
     * peut en avoir deux : indexée par (salon, artiste), la déclaration
     * du DERNIER mode lu écrasait l'autre, puis se posait sur TOUTES
     * les lignes de la vue — le guest devenait « Résident » et, son
     * genre étant faussé, SES DATES DISPARAISSAIENT.
     * LA RÈGLE JUSTE, ET ELLE TIENT SANS LA MIGRATION nº 410-411 : une
     * ligne de la vue QUI PORTE UN MODE (genre non nul) est DÉJÀ la
     * déclaration de l'artiste — la vue joint `modes_exercice`, la
     * MÊME table que cette requête-ci. Il n'y a rien à corriger, donc
     * rien à écraser : la déclaration ne sert plus QU'AUX lignes SANS
     * mode (l'invitation partie du salon, le cas exact de la nº 288).
     * La carte par (salon, artiste) suffit à nouveau ; la clé par mode
     * de la nº 410 partait d'un bon constat mais soignait le mauvais
     * endroit — et ne marchait qu'avec la migration passée.
     */
    const declarations = new Map<string, { genre: string | null; role: string | null }>();
    const artistesDeLEquipe = [
      ...new Set(lignesEquipe.map((ligne) => ligne.artiste_id)),
    ];
    if (artistesDeLEquipe.length > 0) {
      const reponse = await supabase
        .from("modes_exercice")
        .select("tatoueur_id, salon_id, genre, role")
        .in("tatoueur_id", artistesDeLEquipe)
        .in("salon_id", identifiants);
      for (const ligne of (reponse.data ?? []) as unknown as {
        tatoueur_id: string;
        salon_id: string | null;
        genre: string | null;
        role: string | null;
      }[]) {
        if (!ligne.salon_id) continue;
        declarations.set(`${ligne.salon_id}|${ligne.tatoueur_id}`, {
          genre: ligne.genre,
          role: ligne.role,
        });
      }
    }

    /**
     * ██ §3 (nº 313) — LES STYLES VIENNENT DE L'ARTISTE, ET DE LUI SEUL ██
     * ==================================================================
     * Exactement la même règle que le rôle, juste au-dessus, et pour la
     * même raison : il n'y a qu'UNE information — celle que l'artiste
     * déclare sur SA fiche (`tatoueurs.styles`) — et l'équipe de son
     * salon la LIT. Rien n'est recopié, rien n'est deviné.
     * ⚠️ AUCUNE MIGRATION : la vue `equipe_salon` n'a pas à porter les
     * styles. Elle dit QUI est de l'équipe ; les styles se lisent là où
     * ils vivent, en UNE requête de plus, et seulement s'il y a une
     * équipe.
     * ⚠️ JAMAIS BLOQUANTE : en cas d'échec, les membres n'ont pas de
     * styles et la troisième ligne ne se rend pas — c'est exactement le
     * comportement d'avant cette passe.
     */
    /**
     * ██ §6 (nº 492) — LE CARNET DU MEMBRE VOYAGE AVEC SES STYLES ██
     * ------------------------------------------------------------------
     * La ligne posée au-dessus de l'encadré d'un membre dit son statut
     * PUIS l'état de son carnet. Cet état n'est pas une donnée du
     * salon : c'est celle que l'ARTISTE a cochée sur SA fiche, la même
     * que sa propre ligne « Booking ouvert ». On la lit donc là où elle
     * vit — dans la MÊME requête que les styles, deux colonnes de plus,
     * aucune requête supplémentaire, aucune migration.
     * ⚠️ RIEN N'EST FABRIQUÉ : un artiste qui n'a rien coché n'a pas de
     * booking, et sa ligne ne dira que son statut.
     */
    const declarationsDesMembres = new Map<
      string,
      { styles: string[] | null; booking: string | null; booking_mois: number | null }
    >();
    if (artistesDeLEquipe.length > 0) {
      const reponse = await supabase
        .from("tatoueurs")
        .select("id, styles, booking, booking_mois")
        .in("id", artistesDeLEquipe);
      for (const ligne of (reponse.data ?? []) as unknown as {
        id: string;
        styles: string[] | null;
        booking?: string | null;
        booking_mois?: number | null;
      }[]) {
        declarationsDesMembres.set(ligne.id, {
          styles: ligne.styles?.length ? ligne.styles : null,
          booking: ligne.booking ?? null,
          booking_mois: ligne.booking_mois ?? null,
        });
      }
    }

    const equipeParSalon = new Map<string, MembreEquipe[]>();
    for (const ligne of lignesEquipe) {
      const liste = equipeParSalon.get(ligne.salon_id) ?? [];
      // LA MÊME TRADUCTION QUE L'APERÇU DU SALON, au mot près : elle
      // vit dans lib/modes-exercice, et nulle part ailleurs — et elle
      // reçoit désormais la déclaration de l'artiste (§3, nº 288).
      liste.push(
        membreDepuisVue(ligne, {
          //  §1 (nº 412) — LA VUE D'ABORD : une ligne qui porte un mode
          //  dit déjà son genre et son rôle (même table que la
          //  déclaration) — on ne lui passe RIEN qui puisse l'écraser.
          //  La déclaration ne comble que la ligne SANS mode,
          //  l'invitation partie du salon (nº 288).
          ...(ligne.genre
            ? {}
            : (declarations.get(`${ligne.salon_id}|${ligne.artiste_id}`) ??
              {})),
          //  §3 (nº 313) — sa déclaration de styles, quand on l'a lue,
          //  et §6 (nº 492) — l'état de son carnet, du même endroit.
          styles: declarationsDesMembres.get(ligne.artiste_id)?.styles ?? null,
          booking: declarationsDesMembres.get(ligne.artiste_id)?.booking ?? null,
          booking_mois:
            declarationsDesMembres.get(ligne.artiste_id)?.booking_mois ?? null,
        })
      );
      equipeParSalon.set(ligne.salon_id, liste);
    }

    return fiches.map((fiche) =>
      normaliser({
        ...fiche,
        modes: parFiche.get(fiche.id) ?? [],
        studios: studiosParFiche.get(fiche.id) ?? [],
        equipe: equipeParSalon.get(fiche.id) ?? [],
        galerie: galerieParFiche.get(fiche.id) ?? [],
      }) as T
    );
  } catch {
    return fiches;
  }
}

/** Vrai si l'erreur Supabase vient d'une table qui n'existe pas encore. */
function tableAbsente(message: string): boolean {
  return (
    message.includes("tatoueurs") ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("schema cache")
  );
}

/**
 * LA RECHERCHE — style, ville, rayon.
 * Ne lève jamais : une base injoignable donne la démonstration, avec
 * son message.
 */
export async function listerTatoueurs(
  filtres: FiltresTatoueurs = {}
): Promise<ResultatTatoueurs> {
  // LE POINT DE RÉFÉRENCE arrive TOUT FAIT dans les filtres : le lieu
  // a été choisi dans la liste mondiale, avec ses coordonnées. Plus
  // aucune lecture de table de communes ici — la recherche est
  // devenue purement géographique.
  const ville = pointDeReference(filtres);
  //  ⚠️ PLUS AUCUN MASQUAGE PAR COMPTE (passe nº 178, ACHEVÉE À LA
  //  Nº 275) : la mosaïque applique la MÊME règle que la base et que
  //  la page de fiche — `estEnLigne`, rien d'autre. La nº 178 se
  //  contentait de passer un tableau VIDE à la fonction de recherche ;
  //  le paramètre `p_comptes_masques` et son exception
  //  `admin_publique` vivaient donc toujours en base, dormants mais
  //  armés. Ils en sont retirés (migration
  //  supabase/yokofolio-recherche-sans-masquage.sql), et l'appel
  //  n'envoie plus rien : il n'y a plus de machine à réveiller.

  /**
   * ██ §1 (nº 682) — LE SCORE PART AVEC LA RECHERCHE, PLUS AVANT ELLE ██
   * ------------------------------------------------------------------
   * CE QUI EST MESURÉ, ET C'EST LA SEULE RAISON DE CE CHANGEMENT. Le
   * temps serveur de « /search » suit une droite : on l'a relevé à
   * trois latences de base simulées (banc nº 681, doublure nº 670) —
   *      latence   0 ms →   38 ms
   *      latence 120 ms →  518 ms
   *      latence 240 ms → 1000 ms
   * La pente vaut 4,01 : QUATRE ALLERS-RETOURS EN SÉRIE, et seulement
   * 38 ms de calcul. Le classement n'y est pour rien — le coût est
   * dans l'ATTENTE, quatre fois de suite.
   *
   * LES QUATRE, DANS L'ORDRE : le catalogue des styles ajoutés
   * (`chargerStylesAjoutes`, nº 673), CE SCORE-CI, la recherche en
   * base, puis le lot des galeries. Or le score NE SERT À PERSONNE
   * avant `pageDeResultats`, tout en bas : il lit une vue, la recherche
   * ne lui demande rien, et rien de ce qu'elle renvoie ne le change.
   * Il attendait pour rien.
   *
   * ON LE LANCE DONC SANS L'ATTENDRE, et on l'attend là où il sert. Les
   * quatre allers-retours deviennent TROIS — le score et la recherche
   * partent ensemble. C'est la leçon de la nº 678, appliquée cette fois
   * du côté du serveur.
   *
   * ⚠️ LE CLASSEMENT NE BOUGE PAS D'UNE LIGNE, et ce n'est pas une
   * espérance : `pageDeResultats` reçoit EXACTEMENT la même carte de
   * scores, calculée par la même fonction, sur les mêmes données. Seul
   * l'INSTANT du départ change, pas la valeur. Vérifié au banc en
   * comparant l'ordre des résultats avant et après.
   *
   * ⚠️ ET ELLE NE PEUT PAS PARTIR EN FUMÉE : `lirePopularite` avale ses
   * propres échecs et rend une carte vide (voir sa note). Une promesse
   * lancée sans `await` immédiat n'a donc aucun rejet à laisser
   * échapper — la condition sans laquelle ce genre de départ anticipé
   * devient un piège.
   */
  const promesseScores = lirePopularite();

  /**
   * LE CHEMIN COURT — le FILTRE et la DISTANCE se font en base.
   * §1 (nº 279) — MAIS PLUS LA PAGINATION : l'unité de la mosaïque est
   * désormais LE CARROUSEL, et la base, elle, pagine des FICHES. Une
   * page de 24 fiches ne fait pas 24 cartes — elle en fait autant que
   * ces fiches ont de galeries. On demande donc à la base TOUT ce qui
   * répond aux critères (avec les galeries), et le classement, la
   * variété et la coupe se font ici, sur des carrousels, en une seule
   * écriture partagée par toutes les listes (lib/classement-carrousels).
   * ⚠️ CE QUE ÇA COÛTE, DIT FRANCHEMENT : on rapatrie les fiches
   * filtrées au lieu d'une page. À l'échelle du site (deux fiches
   * réelles, quelques dizaines de fiches de démarchage) c'est
   * imperceptible ; le plafond ci-dessous borne le pire des cas. Le
   * jour où le catalogue dépassera quelques milliers de carrousels, il
   * faudra descendre CE MÊME classement en base — la formule est
   * écrite une fois, elle se traduit sans se réinventer.
   */
  const enBase = await rechercheEnBase(
    { ...filtres, limite: PLAFOND_CARROUSELS, decalage: 0 },
    ville
  );
  if (enBase) {
    //  ⚠️ C'EST ICI QUE LE SCORE EST ATTENDU, et nulle part plus tôt
    //  (§1 nº 682) : il est parti en même temps que la recherche, il
    //  est donc déjà là — l'attente ne coûte rien.
    return pageDeResultats(enBase.tatoueurs, filtres, await promesseScores, {
      demonstration: false,
      message: null,
      ville,
    });
  }

  //  Le score est lancé plus haut (§1 nº 682) : il sert aux deux chemins.
  const clics = await promesseScores;

  try {
    const supabase = creerClientSupabaseAnonyme();
    // CE QUI PEUT SE FILTRER SANS LA MIGRATION Nº 32 le fait déjà ici :
    // les fiches en cours de suppression et, quand il est demandé, le
    // style. Deux `where` de plus ne coûtent rien et retirent parfois
    // les neuf dixièmes du catalogue.
    const style = styleConnu(filtres.style);
    const requete = (colonnes: string) => {
      let q = supabase.from("tatoueurs").select(colonnes).eq("publie", true);
      q = q.is("supprime_le", null);
      if (style) q = q.contains("styles", [style]);
      return q;
    };
    const reponse = await lireEnRetirantLInconnu(requete);
    if (reponse.error) throw new Error(reponse.error.message);

    const liste = await garnirFiches(
      supabase,
      //  La requête a déjà filtré `publie` ; `estEnLigne` ajoute les
      //  trois verrous de la base (suppression, hors ligne, refus).
      ((reponse.data ?? []) as unknown as Tatoueur[])
        .map(normaliser)
        .filter(estEnLigne)
    );
    return pageDeResultats(filtrer(liste, filtres, ville), filtres, clics, {
      demonstration: false,
      message: null,
      ville,
    });
  } catch (e) {
    const raison = e instanceof Error ? e.message : String(e);
    //  §4 (nº 278) — EN PRODUCTION, AUCUNE FAUSSE FICHE. La liste est
    //  VIDE et le message est honnête : le site est momentanément
    //  indisponible. Servir vingt tatoueurs inventés à un visiteur —
    //  qu'il croira vrais, et qu'un moteur de recherche pourrait
    //  indexer — est un dommage durable pour une panne d'une heure.
    if (!catalogueDemoAutorise()) {
      return pageDeResultats([], filtres, clics, {
        demonstration: false,
        message: MESSAGE_INDISPONIBLE,
        ville,
      });
    }
    return pageDeResultats(
      filtrer(TATOUEURS_DEMO, filtres, ville),
      filtres,
      clics,
      {
        demonstration: true,
        message: tableAbsente(raison)
          ? "Twelve DEMO tattoo artists are shown: the table doesn't exist yet. Run supabase/tatoueurs.sql in the Supabase SQL editor."
          : `Twelve DEMO tattoo artists are shown: the database is unreachable (${raison}).`,
        ville,
      }
    );
  }
}

/**
 * LA PAGE DEMANDÉE, découpée dans la liste complète — et le TOTAL.
 *
 * ⚠️ L'ORDRE EST DÉCIDÉ UNE FOIS, SUR LA LISTE ENTIÈRE, AVANT LA COUPE
 * (passe nº 217-§2)
 * ==================================================================
 * LE DÉFAUT CORRIGÉ. Cette fonction faisait, hors « style + ville » :
 *     classerParPopularite(page, clics)
 * — c'est-à-dire qu'elle reclassait par nombre de clics LA PAGE DÉJÀ
 * COUPÉE. Or « Voir plus » ne demande pas la page suivante : il
 * redemande la MÊME recherche avec une limite plus grande (voir
 * l'accueil, `limite: CARTES_PAR_PAGE * page`). Vingt-quatre cartes
 * puis quarante-huit, ce sont donc DEUX ENSEMBLES DIFFÉRENTS reclassés
 * chacun de son côté : une fiche très consultée qui occupait le rang 30
 * remontait en première position dès qu'elle entrait dans la page. Vu
 * de l'écran : des cartes apparaissent AU-DESSUS de celles déjà
 * affichées. (La fonction de base avait exactement le même défaut, au
 * même endroit — corrigé par la migration nº 61.)
 *
 * LA RÈGLE, MAINTENANT : un classement porte sur TOUT ce qu'on classe,
 * jamais sur une tranche. Le score de popularité (nº 218-§5) est donc
 * appliqué ICI, à `ordonnees` — la liste filtrée ENTIÈRE — puis on
 * coupe. L'accueil et les recherches suivent la même règle, comme la
 * fonction de base (migration nº 62).
 */
/**
 * ██ §1-§2 (nº 619) — « EST-CE L'ACCUEIL NU ? » ██
 * ==================================================================
 * LES DEUX RÈGLES DE LA nº 619 (réalisations seules, tours de styles)
 * ne valent QUE là, et il fallait donc une définition qui ne se
 * discute pas : L'ACCUEIL NU, C'EST « AUCUN CRITÈRE DE RECHERCHE ».
 * Pas de style, pas de catégorie, aucun lieu d'aucun niveau, aucun
 * interrupteur éteint. Dès qu'une seule de ces choses est demandée,
 * c'est une RECHERCHE, et elle rend ce qu'on lui a demandé, dans
 * l'ordre de sa note — flashs compris.
 *
 * ⚠️ « VOIR PLUS » RESTE L'ACCUEIL, et c'est voulu : il ne change que
 * la LIMITE (le décalage reste à zéro, voir la note de l'accueil).
 * Aucun critère n'apparaît, la page suivante suit donc les mêmes deux
 * règles que la première — les tours se prolongent au lieu de repartir
 * de zéro.
 * ⚠️ NI LA PAGINATION NI LE MÉLANGE NE SONT DES CRITÈRES : `limite`,
 * `decalage`, `jourMelange` et `photosMax` ne disent rien de ce qu'on
 * cherche. Ils ne sont donc pas regardés ici — sans quoi la deuxième
 * page d'accueil cesserait d'être l'accueil.
 */
function estLAccueilNu(filtres: FiltresTatoueurs): boolean {
  return (
    !styleConnu(filtres.style) &&
    !natureCherchee(filtres.nature) &&
    !filtres.slugVille &&
    !filtres.villeNom &&
    !filtres.region &&
    !filtres.codePays &&
    filtres.latitude === undefined &&
    filtres.longitude === undefined &&
    filtresConnus(filtres.exclure).length === 0
  );
}

function pageDeResultats(
  ordonnees: Tatoueur[],
  filtres: FiltresTatoueurs,
  clics: Map<string, number>,
  reste: Omit<ResultatTatoueurs, "tatoueurs" | "total">
): ResultatTatoueurs {
  const debut = Math.max(filtres.decalage ?? 0, 0);
  const combien = filtres.limite ?? CARTES_PAR_PAGE;

  /**
   * §1 (nº 279) — LA LISTE EST FAITE DE CARROUSELS, PLUS DE FICHES.
   * ------------------------------------------------------------------
   * Chaque fiche est éclatée en autant de galeries qu'elle en a
   * publiées (lib/carrousels) : un artiste à trois galeries occupe
   * trois cartes, chacune montrant SA première photo. Le total compte
   * donc des carrousels — c'est ce que le compteur annonce.
   *
   * ⚠️ L'ORDRE EST DÉCIDÉ UNE FOIS, SUR LA LISTE ENTIÈRE, AVANT LA
   * COUPE : la règle de la nº 217-§2 et des migrations nº 61 et nº 63
   * ne change pas d'unité. Le classement (lib/classement-carrousels) vieillit la
   * popularité sur un âge ANCRÉ AU JOUR — deux pages d'une même
   * journée voient exactement le même ordre — et étale les carrousels
   * d'un même artiste à raison de deux par page.
   */
  /**
   * §1 (nº 279) — ET LES CRITÈRES PORTENT SUR LE CARROUSEL, PAS SUR
   * LA FICHE. C'est la conséquence la plus visible du changement
   * d'unité, et elle se voit tout de suite sur une page « japonais à
   * Paris » : les fiches trouvées répondent au style, mais leurs
   * AUTRES galeries n'y répondent pas — on y voyait donc du blackwork
   * et du tribal. Un filtre qui a servi à choisir des fiches doit
   * maintenant choisir des CARROUSELS, sinon la page ment sur ce
   * qu'elle annonce (et la règle 3 du §0 de la nº 278 avec elle).
   * ⚠️ SEULS LES TROIS TAGS DU CARROUSEL sont concernés. Les autres
   * critères — ville, rayon, technique, besoins, profil — décrivent
   * l'ARTISTE : ils ont déjà fait leur travail sur les fiches, et
   * n'ont rien à dire sur une galerie.
   */
  const styleVoulu = styleConnu(filtres.style);
  const natureVoulue = natureCherchee(filtres.nature);
  const renduVoulu = renduCherche(filtres.exclure);
  /*  ██ §1 (nº 619) — L'ACCUEIL NE MONTRE QUE DES RÉALISATIONS ██
      ------------------------------------------------------------------
      LE FILTRE EST POSÉ ICI, avec les trois autres critères de
      carrousel, et il n'y a pas d'autre endroit qui convienne : c'est
      le seul point du site où la liste est faite de CARROUSELS et pas
      encore coupée. Les deux chemins de lecture (la base et le repli)
      y passent tous les deux.
      ⚠️ LE CATALOGUE N'EST PAS TOUCHÉ, c'est un affichage : les flashs
      restent lus, comptés, classés — ils sont seulement écartés de
      CETTE liste-ci. Le menu « Explorer » (`?nature=flash`), une
      recherche, une page de style, un filtre allumé : dès qu'un
      critère existe, `estLAccueilNu` rend faux et la ligne ci-dessous
      ne s'applique plus.
      ⚠️ ET LE COMPTEUR SUIT TOUT SEUL : le total est `classes.length`,
      calculé APRÈS ce filtre. Il annonce donc ce qu'on peut vraiment
      faire défiler. */
  const accueilNu = estLAccueilNu(filtres);
  const carrousels = carrouselsDesFiches(ordonnees, {
    populariteParFiche: clics,
  }).filter(
    (carrousel) =>
      (!styleVoulu || carrousel.style === styleVoulu) &&
      (!natureVoulue || carrousel.nature === natureVoulue) &&
      (!renduVoulu || carrousel.rendu === renduVoulu) &&
      (!accueilNu || carrousel.nature === NATURE_PAR_DEFAUT)
  );
  const classes = classerCarrousels(carrousels, {
    popularite: true,
    //  LA PROXIMITÉ NE JOUE PAS ICI : la liste arrive déjà triée par
    //  distance quand une ville est cherchée (c'est l'ordre d'entrée,
    //  qui départage les égalités). L'allumer serait compter deux fois.
    proximite: false,
    varieteDesArtistes: true,
    //  L'ÉTALEMENT SE RAPPORTE À UNE PAGE DE TAILLE FIXE — jamais à la
    //  limite demandée, qui grandit à chaque « Voir plus ».
    //  ██ §1 (nº 425) — ET CETTE TAILLE EST UNE CONSTANTE, PLUS LA
    //  TAILLE DE PAGE SERVIE. L'accueil prérendu étale au repli
    //  (24, sans cookie) quand le jumeau étalait au cookie (12 sur un
    //  téléphone) : DEUX DÉCOUPAGES pour la même liste, et l'ordre
    //  divergeait localement aux frontières — les cartes déjà
    //  affichées se réorganisaient au premier « Voir plus ». La
    //  fonction de base n'a jamais eu ce paramètre : elle étale à
    //  fenêtre constante — ce chemin de secours fait pareil désormais.
    parPage: CARTES_PAR_PAGE,
    /*  ██ §2 (nº 619) — LES TOURS DE STYLES, SUR L'ACCUEIL NU SEUL ██
        Un style ne revient qu'après que tous les autres sont passés.
        LA NOTE (popularité ÷ âge) N'EST PAS REMPLACÉE : elle décide de
        l'ordre des styles — celui de leur meilleure carte ouvre le
        premier tour — et de l'ordre des cartes à l'intérieur de chaque
        style. Les tours ne font que redistribuer ce qu'elle a produit
        (voir `enToursDeStyles`).
        ⚠️ SUR LA LISTE ENTIÈRE, AVANT LA COUPE, comme tout le reste :
        la liste servie reste un PRÉFIXE de l'ordre stable, donc
        « Voir plus » PROLONGE les tours au lieu d'en rouvrir un. */
    toursDeStyles: accueilNu,
  });
  return {
    ...reste,
    total: classes.length,
    tatoueurs: classes
      .slice(debut, debut + combien)
      .map((carrousel) => ficheDuCarrousel(carrousel))
      .map(sansProprietaire)
      .map((fiche) => sansGalerieInutile(fiche, filtres)),
  };
}

/**
 * UNE CARTE N'AFFICHE QU'UNE PHOTO — on ne lui en donne qu'une.
 * ==============================================================
 * La fonction de base (migration nº 32) le fait déjà : elle ne
 * rapporte que la photo utile. Ici, c'est l'ANCIEN chemin et le mode
 * DÉMONSTRATION qui sont mis au même régime — la galerie est en
 * mémoire, mais elle n'a aucune raison de partir vers le navigateur.
 *
 * La photo gardée est CELLE QUE LA CARTE MONTRERAIT : même règle que
 * `photoChoisie`, donc aucune différence à l'écran.
 */
function sansGalerieInutile(
  fiche: Tatoueur,
  filtres: FiltresTatoueurs
): Tatoueur {
  const combien = Math.max(filtres.photosMax ?? 1, 1);
  const galerie = fiche.galerie ?? [];
  if (galerie.length <= combien) return fiche;
  const choisie = photoChoisie(
    fiche,
    styleConnu(filtres.style),
    renduCherche(filtres.exclure),
    natureCherchee(filtres.nature)
  );
  return {
    ...fiche,
    galerie: choisie
      ? [choisie, ...galerie.filter((photo) => photo !== choisie)].slice(0, combien)
      : galerie.slice(0, combien),
  };
}

/**
 * LES INTERRUPTEURS ENCORE ALLUMÉS d'un groupe — ou `null` quand le
 * groupe est intact. C'est la forme que la fonction de base attend :
 * elle ne filtre un groupe que s'il a été touché.
 *
 * ⚠️ UN GROUPE ENTIÈREMENT ÉTEINT REND `null`, LUI AUSSI (passe
 * nº 148-§2). Depuis que l'on peut vider un groupe de badges, la
 * liste des allumés peut être VIDE — et une liste vide envoyée à la
 * base ne veut pas dire « aucun filtre », elle veut dire « aucune
 * valeur ne convient » : plus une seule fiche ne remonterait. Or
 * vider un groupe, à l'écran, veut dire qu'on ABANDONNE ce critère.
 * Les deux extrêmes — tout allumé, tout éteint — disent donc la même
 * chose au moteur : ne filtre pas là-dessus.
 */
function allumesDuGroupe(
  groupe: (typeof GROUPES_FILTRES)[number],
  eteints: Set<string>
): string[] | null {
  const options: string[] = groupe.options.map((o) => o.slug);
  if (!options.some((slug) => eteints.has(slug))) return null;
  const allumes = options.filter((slug) => !eteints.has(slug));
  return allumes.length === 0 ? null : allumes;
}

/**
 * LA RECHERCHE FAITE EN BASE — le chemin normal depuis la passe
 * « performance »
 * ================================================================
 * UNE requête rend la page demandée, sa photo de carte et le nombre
 * total de résultats. Le filtre, la distance, le tri et la limite se
 * font là où sont les données : plus jamais 10 000 lignes rapatriées
 * pour en afficher 24.
 *
 * ⚠️ ELLE REND `null` SI ELLE NE PEUT PAS SE FAIRE — fonction absente
 * (migration nº 32 pas encore passée), base injoignable, erreur
 * quelconque. L'appelant reprend alors l'ancien chemin, qui n'a pas
 * bougé : le site marche exactement comme avant, en attendant que la
 * migration soit exécutée. Aucune version du site n'exige une
 * migration pour fonctionner.
 */
async function rechercheEnBase(
  filtres: FiltresTatoueurs,
  ville: ResultatTatoueurs["ville"]
): Promise<ResultatTatoueurs | null> {
  try {
    const supabase = creerClientSupabaseAnonyme();
    const eteints = new Set(filtresConnus(filtres.exclure));
    const parGroupe = new Map<string, string[] | null>(
      GROUPES_FILTRES.map((groupe) => [
        groupe.groupe,
        allumesDuGroupe(groupe, eteints),
      ])
    );

    const { data, error } = await supabase.rpc("rechercher_tatoueurs", {
      p_style: styleConnu(filtres.style) || null,
      p_niveau: filtres.niveau ?? null,
      p_latitude: ville?.latitude ?? null,
      p_longitude: ville?.longitude ?? null,
      p_rayon_km: milesEnKm(filtres.rayonMi ?? 0),
      p_ville_nom: filtres.villeNom ?? null,
      p_ville_slug: filtres.slugVille ?? null,
      p_code_pays: filtres.codePays ?? null,
      p_region: filtres.region ?? null,
      //  LE PROFIL : « artiste », « salon », « studio-prive ». La
      //  fonction de base reconstitue la même valeur à partir de
      //  `type_fiche` et `etablissement` (migration nº 38).
      p_types: parGroupe.get("type") ?? null,
      //  OÙ IL TATOUE : on envoie les GENRES de mode (« salon »,
      //  « guest », « domicile », « prive »), pas les slugs du filtre —
      //  ce sont eux qui sont écrits dans `modes_exercice.genre`.
      p_modes:
        parGroupe
          .get("mode")
          ?.map(genreDuModeFiltre)
          .filter((genre): genre is string => Boolean(genre)) ?? null,
      p_technique: parGroupe.get("technique") ?? null,
      p_composition: parGroupe.get("composition") ?? null,
      p_besoins: parGroupe.get("besoins") ?? null,
      p_rendus: parGroupe.get("rendu") ?? null,
      //  LA NATURE cherchée (migration nº 49) — la fonction de base
      //  la croise avec le style pour ne garder que les fiches qui
      //  ont VRAIMENT une photo de ce genre-là.
      p_nature: natureCherchee(filtres.nature) || null,
      //  §2 (nº 275) — `p_comptes_masques` N'EST PLUS ENVOYÉ. Sur une
      //  base pas encore migrée, la fonction lui donne sa valeur par
      //  défaut (`'{}'`), c'est-à-dire exactement ce que la nº 178
      //  envoyait : le site marche donc identiquement, migration
      //  passée ou non.
      // LE RENDU CHERCHÉ décide de la photo que la carte montre —
      // la même règle que `photoChoisie`, appliquée en base.
      p_photo_rendu: renduCherche(filtres.exclure) || null,
      p_limite: filtres.limite ?? CARTES_PAR_PAGE,
      p_decalage: Math.max(filtres.decalage ?? 0, 0),
      //  ⚠️ RÈGLE 2 (nº 283) — ON NE DEMANDE PLUS « CE QU'UNE CARTE
      //  AFFICHE », MAIS « TOUT CE QU'IL FAUT POUR CONNAÎTRE LES
      //  CARROUSELS ». C'était `filtres.photosMax` — vingt photos par
      //  fiche sur l'accueil — et ce nombre décidait, sans que
      //  personne l'ait voulu, QUELLES CARTES EXISTENT : une galerie
      //  dont la première photo arrivait après la vingtième de la
      //  fiche n'était jamais ramassée, donc jamais affichée. On
      //  demande désormais large (voir PHOTOS_LUES_PAR_FICHE), et
      //  c'est la coupe PAR CARROUSEL qui borne — ici (lib/carrousels)
      //  et, migration nº 69 passée, en base.
      //  ⚠️ `filtres.photosMax` GARDE SON RÔLE, qui est un autre : il
      //  dit combien de photos partent vers le navigateur POUR CHAQUE
      //  CARTE (`sansGalerieInutile`).
      p_photos_max: PHOTOS_LUES_PAR_FICHE,
      p_prioriser_clics: Boolean(filtres.prioriserClics),
      // LE MÉLANGE DU JOUR : la même graine que le code (voir
      // `melangerDuJour`) — le tirage ne change qu'une fois par jour.
      // §2 (nº 425) — et une pagination peut IMPOSER son jour
      // (`?melange=`), borné par `jourDuMelange` : la page 2 prolonge
      // l'ordre de la page 1 affichée, même à cheval sur minuit UTC.
      p_jour: jourDuMelange(filtres.jourMelange),
    });
    if (error || !Array.isArray(data)) return null;

    const lignes = data as Array<{
      fiche: Tatoueur;
      distance_km: number | null;
      total_resultats: number;
    }>;
    return {
      tatoueurs: lignes.map((ligne) => normaliser(ligne.fiche)),
      demonstration: false,
      message: null,
      ville,
      total: Number(lignes[0]?.total_resultats ?? 0),
    };
  } catch {
    // Injoignable : l'appelant reprendra l'ancien chemin, qui saura
    // retomber sur la démonstration s'il le faut.
    return null;
  }
}

/**
 * LA FICHE DE DÉMONSTRATION DE SON PROPRIÉTAIRE — base injoignable.
 * La démonstration va jusqu'au bout de la règle : une fiche masquée du
 * public reste VISIBLE DE SON PROPRIÉTAIRE. Sans quoi on ne pourrait
 * pas vérifier la moitié de la règle qui compte le plus.
 */
function ficheDemoDuProprietaire(
  slug: string,
  utilisateurId: string
): { tatoueur: Tatoueur | null; etat: "attente" | "enLigne" | null } {
  //  §4 (nº 278) — jamais en production (voir catalogue-demonstration).
  if (!catalogueDemoAutorise()) return { tatoueur: null, etat: null };
  const demo = TATOUEURS_DEMO.find((x) => x.slug === slug) ?? null;
  if (!demo || !demo.user_id || demo.user_id !== utilisateurId) {
    return { tatoueur: null, etat: null };
  }
  return { tatoueur: sansProprietaire(demo), etat: demo.publie ? "enLigne" : "attente" };
}

/** Une fiche de DÉMONSTRATION visible du public — même règle que la
    base : publiée, pas supprimée, pas hors ligne, pas refusée
    (passe nº 178 : le masquage par compte administrateur a disparu). */
function demoPublique(slug: string): Tatoueur | null {
  //  §4 (nº 278) — EN PRODUCTION, AUCUNE FAUSSE FICHE N'EST JOIGNABLE :
  //  l'adresse d'une fiche de démonstration répond « page introuvable »
  //  comme n'importe quelle adresse qui n'existe pas.
  if (!catalogueDemoAutorise()) return null;
  const demo = TATOUEURS_DEMO.find((x) => x.slug === slug) ?? null;
  if (!demo || !estEnLigne(demo)) return null;
  return sansProprietaire(demo);
}

/** Une fiche, par son slug. */
export async function lireTatoueur(slug: string): Promise<{
  tatoueur: Tatoueur | null;
  demonstration: boolean;
}> {
  try {
    const supabase = creerClientSupabaseAnonyme();
    const reponse = await lireEnRetirantLInconnu((colonnes: string) =>
      supabase
        .from("tatoueurs")
        .select(colonnes)
        .eq("slug", slug)
        .eq("publie", true)
        .maybeSingle()
    );
    if (reponse.error) throw new Error(reponse.error.message);
    if (reponse.data) {
      const [fiche] = await garnirFiches(supabase, [
        normaliser(reponse.data as unknown as Tatoueur),
      ]);
      //  ⚠️ LA RÈGLE DE LA BASE, ET RIEN QU'ELLE (passe nº 178).
      //  La page ajoutait une condition que la base n'a pas — voir
      //  `estEnLigne` : c'est elle qui répondait « pas encore en
      //  ligne » alors que la base disait oui.
      if (!estEnLigne(fiche)) return { tatoueur: null, demonstration: false };
      return { tatoueur: sansProprietaire(fiche), demonstration: false };
    }
    // Table présente mais fiche absente : on regarde tout de même la
    // démonstration, pour que /artist/atelier-corvus réponde avant
    // que les vraies fiches existent.
    const demo = demoPublique(slug);
    return { tatoueur: demo, demonstration: demo !== null };
  } catch {
    const demo = demoPublique(slug);
    return { tatoueur: demo, demonstration: demo !== null };
  }
}

/**
 * L'ADRESSE ACTUELLE D'UNE FICHE, à partir d'une ANCIENNE.
 * ---------------------------------------------------------
 * Depuis que les adresses portent la ville
 * (maison-vermillon → maison-vermillon-lille), les liens déjà
 * partagés visent l'ancienne. Elle est conservée en base
 * (`ancien_slug`, migration nº 21) : la page de fiche s'en sert pour
 * REDIRIGER vers la nouvelle, définitivement (301). Un lien envoyé
 * il y a six mois continue donc de marcher.
 * Null : cet ancien slug n'a jamais existé — la page est vraiment
 * introuvable.
 */
export async function slugActuelDepuisAncien(
  ancien: string
): Promise<string | null> {
  try {
    const supabase = creerClientSupabaseAnonyme();
    const { data } = await supabase
      .from("tatoueurs")
      .select("slug")
      .eq("ancien_slug", ancien)
      .limit(1)
      .maybeSingle();
    const ligne = data as { slug?: string } | null;
    if (ligne?.slug) return ligne.slug;
  } catch {
    // Colonne pas encore créée, ou base injoignable : la
    // démonstration prend le relais, comme partout ailleurs.
  }
  //  §4 (nº 278) — jamais en production (voir catalogue-demonstration).
  if (!catalogueDemoAutorise()) return null;
  return (
    TATOUEURS_DEMO.find((t) => t.ancien_slug === ancien)?.slug ?? null
  );
}

/**
 * CETTE FICHE EXISTE-T-ELLE, SANS ÊTRE EN LIGNE ? (passe nº 176-§3)
 * -----------------------------------------------------------------
 * Une fiche qui existe mais n'est pas publiée ne doit PAS répondre
 * « cette page n'existe pas » : ce n'est pas une erreur d'adresse. Le
 * 404 reste réservé aux adresses qui n'existent vraiment pas.
 *
 * ⚠️ ELLE NE REND QU'UN OUI OU UN NON. Aucune donnée de la fiche ne
 * sort d'ici : ni le nom, ni la ville, ni l'état de modération. Un
 * visiteur apprend seulement que l'adresse est prise — ce que le
 * moindre lien partagé lui disait déjà.
 *
 * ⚠️ PAR LA CLÉ DE SERVICE, côté serveur uniquement : c'est la seule
 * façon de voir une fiche que les politiques cachent au public. Sans
 * clé de service, ou en cas de pépin, la réponse est « non » — et la
 * page redevient un 404, exactement comme avant cette passe.
 */
export async function ficheExistanteNonPubliee(
  slug: string
): Promise<boolean> {
  try {
    const { creerClientSupabaseAdmin } = await import("@/lib/supabase/admin");
    const supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from("tatoueurs")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * LA FICHE VUE PAR SON PROPRIÉTAIRE — publiée ou non
 * ---------------------------------------------------
 * La page /artist/<slug> montre au TATOUEUR CONNECTÉ sa propre
 * fiche même quand elle n'est pas (encore) publiée, avec son état :
 *  - « attente » : pas publiée, OU des modifications (`brouillon`)
 *    attendent la validation ;
 *  - « enLigne » : publiée, rien en attente.
 * Lecture par la CLÉ DE SERVICE, côté serveur uniquement : la
 * propriété est vérifiée ici même (user_id), rien ne fuit.
 */
export async function lireFicheProprietaire(
  slug: string,
  utilisateurId: string
): Promise<{
  tatoueur: Tatoueur | null;
  etat: "attente" | "enLigne" | null;
}> {
  try {
    const { creerClientSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = creerClientSupabaseAdmin();
    let reponse = await admin
      .from("tatoueurs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (reponse.error && colonneAbsente(reponse.error.message)) {
      reponse = await admin
        .from("tatoueurs")
        .select(COLONNES_BASE)
        .eq("slug", slug)
        .maybeSingle();
    }
    const ligne = reponse.data as
      | (Tatoueur & {
          user_id?: string | null;
          statut?: string | null;
          brouillon?: Record<string, unknown> | null;
        })
      | null;
    if (!ligne || ligne.user_id !== utilisateurId) {
      return { tatoueur: null, etat: null };
    }
    const enAttente =
      !ligne.publie ||
      (ligne.brouillon != null && (ligne.statut ?? "en_attente") === "en_attente");
    return {
      tatoueur: sansProprietaire(normaliser(ligne)),
      etat: enAttente && (ligne.statut ?? "en_attente") === "en_attente"
        ? "attente"
        : ligne.publie
          ? "enLigne"
          : null,
    };
  } catch {
    return ficheDemoDuProprietaire(slug, utilisateurId);
  }
}
