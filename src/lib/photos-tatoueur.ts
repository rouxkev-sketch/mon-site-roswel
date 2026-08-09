import { libelleStyle } from "@/config/tatouage";

/**
 * LE PORTFOLIO — une photo, deux tags
 * ====================================
 * Une photo de yokofolio est une LIGNE, qui porte deux tags :
 *
 *   1. LE STYLE — celui du badge où elle a été déposée (22 valeurs) ;
 *   2. LE RENDU — noir et gris, ou couleur (2 valeurs).
 *
 * ⚠️ LES ZONES DU CORPS ONT ÉTÉ ABANDONNÉES (passe nº 109, migration
 * nº 48). Le tag « zone » — 19 valeurs, un couple unique zone + rendu
 * par style — s'était révélé LOURD À REMPLIR, et son interface de
 * catalogue inutilisable. Le rendu, lui, RESTE : il se lit d'un coup
 * d'œil au dépôt, et il alimente le filtre « Rendu » du moteur de
 * recherche. Les photos taguées de l'ancien système ont été effacées
 * par la migration (fiches de test uniquement, décision du
 * propriétaire).
 *
 * ⚠️ LES IDENTIFIANTS SONT EN ANGLAIS, ET FIGÉS. Le libellé français
 * (« Noir et gris ») est de l'AFFICHAGE ; ce qui part en base est
 * `black_and_grey`. Le jour où le site parlera espagnol, on ajoutera
 * une colonne de libellés — sans toucher à une seule ligne déjà
 * enregistrée.
 *
 * LE PLAFOND : VINGT PHOTOS par couple style + rendu. C'est la seule
 * borne — assez pour montrer un vrai travail, assez peu pour que la
 * galerie reste une sélection et pas un vrac.
 */

/** LE RENDU — deux entrées, et deux seulement. */
export const RENDUS_PHOTO = [
  { slug: "black_and_grey", label: "Noir et gris" },
  { slug: "color", label: "Couleur" },
] as const;

export type SlugRendu = (typeof RENDUS_PHOTO)[number]["slug"];

export const SLUGS_RENDUS = new Set<string>(RENDUS_PHOTO.map((r) => r.slug));

/**
 * LA NATURE D'UNE PHOTO — tatouage, ou flash (passe nº 110)
 * ==========================================================
 * ⚠️ UN FLASH N'EST PAS UN STYLE, C'EST UN ÉTAT DU DESSIN. C'est un
 * motif DÉJÀ dessiné, prêt à tatouer, qu'on ne modifie pas — et il
 * appartient toujours à un style : un flash de réalisme reste du
 * réalisme. Le ranger parmi les styles aurait donc été une faute de
 * classement ; il devient un TROISIÈME TAG, à côté du style et du
 * rendu.
 *
 * CE QUE ÇA DONNE : QUATRE GALERIES PAR STYLE, une par croisement —
 * Noir et gris · Tatouage, Noir et gris · Flash, Couleur · Tatouage,
 * Couleur · Flash. Chacune garde son plafond de vingt photos, sa
 * fenêtre de recadrage et son glisser-déposer.
 *
 * ⚠️ « FLASH » ÉTAIT UNE CASE À COCHER (filtre « Types de projets »)
 * jusqu'à cette passe. Une case ne montre rien : on annonçait des
 * flashs sans jamais pouvoir en voir un seul. La déclaration est
 * supprimée par la migration nº 49 ; ce qui la remplace se REGARDE.
 *
 * LE DÉFAUT EST « tatouage », et c'est ce qui rend la bascule
 * indolore : toute photo déposée avant cette passe est un tatouage
 * réalisé — c'était le seul sens possible.
 */
//  ⚠️ LE MOT A CHANGÉ, PAS LA CLÉ (passe nº 111). Une photo de cette
//  nature s'appelle désormais une RÉALISATION : le tatoueur montre ce
//  qu'il a réalisé, et « tatouage » disait à la fois le métier, le
//  dessin, la séance et la photo — trop de choses pour un seul mot.
//  LA CLÉ `tatouage` NE BOUGE PAS : elle est écrite en base, dans les
//  adresses de recherche et dans la migration nº 49. Renommer un
//  libellé ne coûte rien ; renommer une clé casse tout ce qui est
//  déjà enregistré.
export const NATURES_PHOTO = [
  { slug: "tatouage", label: "Réalisation" },
  { slug: "flash", label: "Flash" },
] as const;

export type SlugNature = (typeof NATURES_PHOTO)[number]["slug"];

export const SLUGS_NATURES = new Set<string>(NATURES_PHOTO.map((n) => n.slug));

/** La nature par défaut — celle de toutes les photos d'avant la nº 49. */
export const NATURE_PAR_DEFAUT: SlugNature = "tatouage";

/** Une nature connue, ou celle par défaut (adresse ou base malmenée). */
export function natureConnue(slug: string | null | undefined): string {
  return slug && SLUGS_NATURES.has(slug) ? slug : NATURE_PAR_DEFAUT;
}

export function libelleNature(slug: string | null | undefined): string {
  return NATURES_PHOTO.find((n) => n.slug === slug)?.label ?? (slug ?? "");
}

/** VINGT PHOTOS par couple style + rendu — le plafond d'une galerie. */
export const PLAFOND_GALERIE = 20;

export function libelleRendu(slug: string | null | undefined): string {
  return RENDUS_PHOTO.find((r) => r.slug === slug)?.label ?? (slug ?? "");
}

/* ================================================================
 * LA PHOTO
 * ================================================================ */

/** UNE PHOTO DU PORTFOLIO, telle qu'elle vit en base et à l'écran. */
export type PhotoTatoueur = {
  id: string;
  /** Le style dans lequel elle a été déposée. */
  style: string;
  /** `black_and_grey` ou `color`. NULLABLE À LA LECTURE SEULEMENT :
      une base où la migration nº 48 n'est pas passée peut encore
      porter d'anciennes lignes sans rendu — le site doit les lire
      sans casser. Toute photo DÉPOSÉE porte son rendu. */
  rendu: string | null;
  /** `tatouage` ou `flash` (migration nº 49). Une base où elle n'est
      pas passée ne rend rien : on lit alors « tatouage », qui était
      le seul sens possible avant. */
  nature?: string | null;
  /** L'image PLEINE RÉSOLUTION (1080 × 1350) — celle de la fiche. */
  url: string;
  /** LA MINIATURE (320 × 400) — celle des cartes et des galeries du
      formulaire. À défaut, on retombe sur la pleine résolution. */
  miniature: string | null;
  /** La place dans la galerie. Le rang 0 sert de vignette. */
  ordre: number;
};

/**
 * LE RENDU D'UN PORTFOLIO — ce que les photos disent, pas la fiche
 * =================================================================
 * « Noir et gris », « Couleur » : ces deux-là ne se déclarent nulle
 * part. Ils se LISENT dans les tags des photos déposées, exactement
 * comme le filtre de recherche les lit (voir FILTRE_RENDU). La fiche
 * publique les affiche donc au même titre que Styles ou Technique —
 * mais sans que personne n'ait rien eu à cocher.
 *
 * L'ORDRE EST CELUI DE LA CONFIGURATION (noir et gris, puis couleur)
 * et non celui des photos : deux fiches ne doivent pas ranger la même
 * information dans deux ordres différents.
 */
export function rendusDuPortfolio(
  galerie: Array<{ rendu: string | null }> | null | undefined
): string[] {
  const presents = new Set(
    (galerie ?? []).map((photo) => photo.rendu).filter(Boolean) as string[]
  );
  return RENDUS_PHOTO.map((r) => r.slug).filter((slug) => presents.has(slug));
}

/** La miniature si elle existe, la pleine résolution sinon. */
export function vignetteDe(photo: PhotoTatoueur): string {
  return photo.miniature || photo.url;
}

/** LA GALERIE, DANS L'ORDRE — c'est `ordre` qui commande, et le rang
    0 est la vignette de la fiche. */
export function galerieOrdonnee(
  photos: PhotoTatoueur[] | null | undefined
): PhotoTatoueur[] {
  return [...(photos ?? [])].sort((a, b) => a.ordre - b.ordre);
}

/** LES STYLES RÉELLEMENT REMPLIS, dans l'ordre de la galerie. Ce sont
    eux, et eux seuls, qui s'affichent sur la fiche — un style sans
    photo n'existe pas pour le sélecteur du carrousel. */
export function stylesDuPortfolio(
  photos: PhotoTatoueur[] | null | undefined
): string[] {
  const vus: string[] = [];
  for (const photo of galerieOrdonnee(photos)) {
    if (!vus.includes(photo.style)) vus.push(photo.style);
  }
  return vus;
}

/** Les photos d'un style, dans l'ordre. */
export function photosDuStyle(
  photos: PhotoTatoueur[] | null | undefined,
  style: string
): PhotoTatoueur[] {
  return galerieOrdonnee(photos).filter((photo) => photo.style === style);
}

/** LES NATURES RÉELLEMENT PRÉSENTES dans un portfolio — comme le
    rendu, elles ne se déclarent pas : elles se lisent dans les photos.
    C'est ce qui permet au moteur de dire « ce tatoueur a des flashs »
    sans que personne n'ait rien coché. */
export function naturesDuPortfolio(
  galerie: Array<{ nature?: string | null }> | null | undefined
): string[] {
  const presentes = new Set(
    (galerie ?? []).map((photo) => natureConnue(photo.nature))
  );
  return NATURES_PHOTO.map((n) => n.slug).filter((slug) =>
    presentes.has(slug)
  );
}

/** « Réalisme · Couleur » — la légende d'une photo. Un FLASH le dit :
    « Réalisme · Couleur · Flash ». Un tatouage ne le dit pas — c'est
    le cas ordinaire, le nommer serait du bruit. */
export function legendePhoto(photo: PhotoTatoueur): string {
  return [
    libelleStyle(photo.style),
    libelleRendu(photo.rendu),
    natureConnue(photo.nature) === "flash" ? libelleNature("flash") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
