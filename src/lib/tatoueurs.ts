import {
  CARTES_PAR_PAGE,
  genreDuModeFiltre,
  GROUPES_FILTRES,
  profilDeLaFiche,
  rayonRetenu,
  renduCherche,
  slugDuGenreMode,
  SLUGS_FILTRES,
  styleDuCatalogue,
} from "@/config/tatouage";
import { distanceKm } from "@/lib/geo";
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
  natureConnue,
  SLUGS_NATURES,
  type PhotoTatoueur,
} from "@/lib/photos-tatoueur";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { COMPTE_ADMIN_DEMO, TATOUEURS_DEMO } from "@/lib/tatoueurs-demo";
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
      publiques (il n'est pas dans `COLONNES`) : le masquage des fiches
      d'administrateur se fait DANS LA REQUÊTE, côté serveur — voir
      lib/fiches-admin. Il n'existe ici que pour les fiches de
      DÉMONSTRATION, qui reproduisent la règle sans base. */
  user_id?: string | null;
  /** L'ADRESSE D'AVANT : les liens déjà partagés restent bons — la
      page de fiche redirige l'ancien slug vers le nouveau. */
  ancien_slug?: string | null;
  /** « artiste » ou « salon » — le choix qui structure la fiche. */
  type_fiche?: string | null;
  /** LA NATURE DU LIEU — « salon » ou « prive ». Lue uniquement quand
      `type_fiche` vaut « salon » (voir config/tatouage :
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
  /** TikTok : facultatif. Vide ou absent = pas de bouton TikTok. */
  lien_tiktok?: string | null;
  /** La chaîne YouTube — facultative (migration nº 34). */
  lien_youtube?: string | null;
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
  /** FICHE D'ESSAI D'UN ADMINISTRATEUR, RENDUE PUBLIQUE MALGRÉ TOUT
      (migration nº 43). Éteint par défaut, et sans le moindre effet
      sur la fiche d'un vrai tatoueur : cet interrupteur ne fait que
      LEVER le masquage qui frappe les comptes administrateurs.
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
  /** Rayon en km autour du point. ZÉRO = la ville seule, sans
      extension aux alentours. Ignoré aux niveaux région et pays. */
  rayonKm?: number;
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
      commune : ici on veut LA page /tatouage/blackwork/lyon-1er. */
  slugVille?: string;
  /** CLASSER PAR POPULARITÉ AVANT DE COUPER, et pas seulement à
      l'intérieur de la page. Les pages « style + ville » le font
      depuis toujours (elles montrent les plus consultés de la ville) ;
      l'accueil, lui, tire au hasard du jour puis reclasse la page. */
  prioriserClics?: boolean;
};

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
  | "rayonKm"
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
  rayonKm: number
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
    rayonKm: autourDUnPoint ? rayonRetenu(rayonKm) : 0,
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
  `user_id`;

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
    adresse: ligne.adresse ?? null,
    code_postal: ligne.code_postal ?? null,
    bio: ligne.bio ?? null,
    site_web: ligne.site_web ?? null,
    titre_site_web: ligne.titre_site_web ?? null,
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
 * LA POPULARITÉ — le total de clics « carte → fiche » par slug, lu
 * dans la vue `clics_tatoueurs` (supabase/yokofolio-popularite.sql).
 * Vue absente (migration pas passée) ou base injoignable : une carte
 * vide — le classement retombe sur l'ordre actuel, sans bruit.
 */
async function lireClics(): Promise<Map<string, number>> {
  try {
    const supabase = await creerClientSupabaseServeur();
    const { data, error } = await supabase
      .from("clics_tatoueurs")
      .select("slug, total");
    if (error || !data) return new Map();
    return new Map(
      (data as Array<{ slug: string; total: number }>).map((ligne) => [
        ligne.slug,
        Number(ligne.total) || 0,
      ])
    );
  } catch {
    return new Map();
  }
}

/**
 * LE CLASSEMENT PAR POPULARITÉ : les fiches les plus consultées
 * d'abord. Le tri est STABLE — à égalité de clics (ou sans aucun
 * clic), l'ordre existant est conservé : mélange du jour sans ville,
 * proximité avec une ville.
 */
function classerParPopularite(
  liste: Tatoueur[],
  clics: Map<string, number>
): Tatoueur[] {
  if (clics.size === 0) return liste;
  return [...liste].sort(
    (a, b) => (clics.get(b.slug) ?? 0) - (clics.get(a.slug) ?? 0)
  );
}

/** Le style demandé est-il connu ? Sinon on l'ignore plutôt que de vider la page. */
export function styleConnu(slug: string | undefined): string {
  return slug && styleDuCatalogue(slug) ? slug : "";
}

/** LA NATURE CHERCHÉE — « tatouage », « flash », ou la chaîne vide.
    ⚠️ DIFFÉRENT DE `natureConnue` (lib/photos-tatoueur), qui rend
    « tatouage » par défaut : ici, l'absence est une VRAIE réponse —
    « je n'ai rien demandé » — et ne doit surtout pas devenir un
    filtre. Une adresse bricolée à la main ne vide donc pas la page,
    elle cherche simplement tout. */
export function natureCherchee(slug: string | undefined): string {
  return slug && SLUGS_NATURES.has(slug) ? slug : "";
}

/** Ne garde que les slugs de filtre CONNUS (adresse ou API malmenée). */
export function filtresConnus(slugs: string[] | undefined): string[] {
  return (slugs ?? []).filter((slug) => SLUGS_FILTRES.has(slug));
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
 */
function melangerDuJour<T>(liste: T[]): T[] {
  const jour = Math.floor(Date.now() / 86_400_000);
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
 * LES FICHES DES ADMINISTRATEURS, RETIRÉES DU PUBLIC
 * ===================================================
 * La règle porte sur le COMPTE PROPRIÉTAIRE, jamais sur un réglage de
 * la fiche (voir lib/fiches-admin). Elle s'applique ICI, dans la
 * couche qui lit la base — donc pour TOUT ce qui est public à la
 * fois : la mosaïque, la recherche, l'API, les pages style + ville,
 * le plan du site et la page de fiche. Aucun affichage n'a à s'en
 * soucier, et aucune adresse devinée ne les fait réapparaître.
 */
function sansFichesAdmin<
  T extends { user_id?: string | null; admin_publique?: boolean | null },
>(liste: T[], proprietaires: string[]): T[] {
  if (proprietaires.length === 0) return liste;
  const masques = new Set(proprietaires);
  return liste.filter(
    (fiche) =>
      !fiche.user_id ||
      !masques.has(fiche.user_id) ||
      //  L'INTERRUPTEUR DE LA MIGRATION Nº 43 : une fiche d'essai
      //  ALLUMÉE se comporte comme n'importe quelle autre. Éteinte —
      //  le cas par défaut, et celui de toutes les fiches d'avant la
      //  migration — la règle ne bouge pas d'un iota.
      fiche.admin_publique === true
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
  // Bordeaux a sa place sur /tatouage/blackwork/bordeaux. Les modes et
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
      )
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
      )
    );
  } else if (ville) {
    // AUTOUR D'UN POINT — la même fonction de distance que les
    // artisans (src/lib/geo.ts) : un seul calcul dans tout le projet.
    const rayon = filtres.rayonKm ?? 0;
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
    retenus = melangerDuJour(retenus);
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
    nom: filtres.lieu?.trim() || "ce lieu",
    latitude: latitude as number,
    longitude: longitude as number,
  };
}

/**
 * LE POINT DE RÉFÉRENCE D'UNE PAGE « style + ville » (adresses de
 * référencement : /tatouage/realisme/lyon-1er).
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
): Promise<ResultatTatoueurs["ville"]> {
  try {
    const supabase = await creerClientSupabaseServeur();
    const { data } = await supabase
      .from("tatoueurs")
      .select("ville_nom, latitude, longitude")
      .eq("ville_slug", slug)
      .eq("publie", true)
      .limit(1)
      .maybeSingle();
    const ligne = data as {
      ville_nom?: string;
      latitude?: number;
      longitude?: number;
    } | null;
    if (ligne && Number.isFinite(ligne.latitude) && Number.isFinite(ligne.longitude)) {
      return {
        nom: nomVilleCourt(ligne.ville_nom ?? ""),
        latitude: ligne.latitude as number,
        longitude: ligne.longitude as number,
      };
    }
  } catch {
    // Base injoignable : on retombe sur les fiches de démonstration.
  }
  const demo = TATOUEURS_DEMO.find((t) => t.ville_slug === slug);
  return demo
    ? {
        nom: nomVilleCourt(demo.ville_nom),
        latitude: demo.latitude,
        longitude: demo.longitude,
      }
    : null;
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
  supabase: Awaited<ReturnType<typeof creerClientSupabaseServeur>>,
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
      PhotoTatoueur & { tatoueur_id: string }
    >) {
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

    const equipeParSalon = new Map<string, MembreEquipe[]>();
    for (const ligne of (equipe.data ?? []) as unknown as {
      salon_id: string;
      artiste_id: string;
      artiste_nom: string;
      artiste_slug: string | null;
      artiste_photo: string | null;
      genre: string | null;
      debut_le: string | null;
      fin_le: string | null;
    }[]) {
      const liste = equipeParSalon.get(ligne.salon_id) ?? [];
      // LA MÊME TRADUCTION QUE L'APERÇU DU SALON, au mot près : elle
      // vit dans lib/modes-exercice, et nulle part ailleurs.
      liste.push(membreDepuisVue(ligne));
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
  // LES FICHES D'ESSAI DE L'ADMINISTRATEUR N'EXISTENT PAS POUR LE
  // PUBLIC (voir lib/fiches-admin) : on les retire à la source.
  const proprietairesMasques = await identifiantsAdmin();

  // LE CHEMIN COURT — tout le travail en base, une seule requête.
  const enBase = await rechercheEnBase(filtres, ville, proprietairesMasques);
  if (enBase) return enBase;

  // Le total de clics par fiche — pour CLASSER les résultats par
  // popularité (les plus consultées d'abord, à égalité l'ordre
  // actuel). Carte vide tant que la migration n'est pas passée.
  const clics = await lireClics();

  try {
    const supabase = await creerClientSupabaseServeur();
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
      sansFichesAdmin(
        ((reponse.data ?? []) as unknown as Tatoueur[]).map(normaliser),
        proprietairesMasques
      )
    );
    return pageDeResultats(filtrer(liste, filtres, ville), filtres, clics, {
      demonstration: false,
      message: null,
      ville,
    });
  } catch (e) {
    const raison = e instanceof Error ? e.message : String(e);
    return pageDeResultats(
      // La démonstration reproduit la règle : sa fiche
      // d'administrateur est masquée elle aussi.
      filtrer(
        sansFichesAdmin(TATOUEURS_DEMO, [COMPTE_ADMIN_DEMO]),
        filtres,
        ville
      ),
      filtres,
      clics,
      {
        demonstration: true,
        message: tableAbsente(raison)
          ? "Douze tatoueurs de DÉMONSTRATION sont affichés : la table n'existe pas encore. Passer supabase/tatoueurs.sql dans l'éditeur SQL de Supabase."
          : `Douze tatoueurs de DÉMONSTRATION sont affichés : la base est injoignable (${raison}).`,
        ville,
      }
    );
  }
}

/**
 * LA PAGE DEMANDÉE, découpée dans la liste complète — et le TOTAL.
 * L'ordre est celui de `filtrer` ; le classement par popularité
 * réordonne ENSUITE la page seule, exactement comme avant cette passe
 * (il change l'ordre d'affichage, jamais la sélection).
 */
function pageDeResultats(
  ordonnees: Tatoueur[],
  filtres: FiltresTatoueurs,
  clics: Map<string, number>,
  reste: Omit<ResultatTatoueurs, "tatoueurs" | "total">
): ResultatTatoueurs {
  const debut = Math.max(filtres.decalage ?? 0, 0);
  const combien = filtres.limite ?? CARTES_PAR_PAGE;
  // LES PAGES « style + ville » montrent les plus consultés de la
  // ville : le classement précède la coupe. Partout ailleurs il ne
  // réordonne que la page — c'est le comportement d'origine.
  const base = filtres.prioriserClics
    ? classerParPopularite(ordonnees, clics)
    : ordonnees;
  const page = base.slice(debut, debut + combien);
  return {
    ...reste,
    total: base.length,
    tatoueurs: (filtres.prioriserClics
      ? page
      : classerParPopularite(page, clics)
    )
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
  ville: ResultatTatoueurs["ville"],
  proprietairesMasques: string[]
): Promise<ResultatTatoueurs | null> {
  try {
    const supabase = await creerClientSupabaseServeur();
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
      p_rayon_km: filtres.rayonKm ?? 0,
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
      p_comptes_masques: proprietairesMasques,
      // LE RENDU CHERCHÉ décide de la photo que la carte montre —
      // la même règle que `photoChoisie`, appliquée en base.
      p_photo_rendu: renduCherche(filtres.exclure) || null,
      p_limite: filtres.limite ?? CARTES_PAR_PAGE,
      p_decalage: Math.max(filtres.decalage ?? 0, 0),
      p_photos_max: Math.max(filtres.photosMax ?? 1, 1),
      p_prioriser_clics: Boolean(filtres.prioriserClics),
      // LE MÉLANGE DU JOUR : la même graine que le code (voir
      // `melangerDuJour`) — le tirage ne change qu'une fois par jour.
      p_jour: Math.floor(Date.now() / 86_400_000),
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
  const demo = TATOUEURS_DEMO.find((x) => x.slug === slug) ?? null;
  if (!demo || !demo.user_id || demo.user_id !== utilisateurId) {
    return { tatoueur: null, etat: null };
  }
  return { tatoueur: sansProprietaire(demo), etat: demo.publie ? "enLigne" : "attente" };
}

/** Une fiche de DÉMONSTRATION visible du public : celle de
    l'administrateur de démonstration en est exclue, comme en base. */
function demoPublique(slug: string): Tatoueur | null {
  const demo = TATOUEURS_DEMO.find((x) => x.slug === slug) ?? null;
  if (!demo || demo.user_id === COMPTE_ADMIN_DEMO) return null;
  return sansProprietaire(demo);
}

/** Une fiche, par son slug. */
export async function lireTatoueur(slug: string): Promise<{
  tatoueur: Tatoueur | null;
  demonstration: boolean;
}> {
  try {
    const supabase = await creerClientSupabaseServeur();
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
      // Compte en cours de suppression : la fiche n'existe plus pour
      // le public (elle revient telle quelle à la reconnexion).
      if (fiche.supprime_le) return { tatoueur: null, demonstration: false };
      // FICHE D'ESSAI D'UN ADMINISTRATEUR : elle n'existe pas non plus
      // pour le public — même à son adresse exacte. Son propriétaire,
      // lui, la retrouve par `lireFicheProprietaire`.
      // ⚠️ SAUF SI L'INTERRUPTEUR EST ALLUMÉ (migration nº 43) : la
      // fiche redevient alors une page publique ordinaire, adresse
      // directe comprise. C'est bien ici, CÔTÉ SERVEUR, que ça se
      // décide — pas à l'affichage.
      const masques = await identifiantsAdmin();
      if (
        fiche.user_id &&
        masques.includes(fiche.user_id) &&
        fiche.admin_publique !== true
      ) {
        return { tatoueur: null, demonstration: false };
      }
      return { tatoueur: sansProprietaire(fiche), demonstration: false };
    }
    // Table présente mais fiche absente : on regarde tout de même la
    // démonstration, pour que /tatoueur/atelier-corvus réponde avant
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
    const supabase = await creerClientSupabaseServeur();
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
  return (
    TATOUEURS_DEMO.find((t) => t.ancien_slug === ancien)?.slug ?? null
  );
}

/**
 * LA FICHE VUE PAR SON PROPRIÉTAIRE — publiée ou non
 * ---------------------------------------------------
 * La page /tatoueur/<slug> montre au TATOUEUR CONNECTÉ sa propre
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
