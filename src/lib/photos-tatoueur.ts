import { libelleStyle } from "@/config/tatouage";

/**
 * ██ CE QU'EST UN CARROUSEL — LA DÉFINITION DU SITE (nº 278-§0) ██
 * ==================================================================
 * ⚠️ CES QUATRE RÈGLES SONT LA RÉFÉRENCE. Elles valent PARTOUT, sans
 * exception, et aucune passe ne doit les défaire sans le savoir : si
 * une correction future paraît les contredire, c'est la correction
 * qu'il faut revoir, ou le propriétaire qu'il faut consulter.
 *
 * UN CARROUSEL N'EST PAS UNE PHOTO : C'EST UNE GALERIE, définie par
 * trois choses et trois seulement —
 *   · UN STYLE de tatouage (réalisme, maori, aquarelle…) ;
 *   · UNE CATÉGORIE : réalisation ou flash ;
 *   · UN RENDU : noir et gris, ou couleur.
 * C'est exactement `cleDEnsemble` (plus bas) : le style, la nature et
 * le rendu, replis compris. L'artiste y range ses photos dans l'ordre
 * qu'il choisit, et CET ORDRE EST LA VÉRITÉ — il vit dans la colonne
 * `photos_tatoueur.ordre` (migration nº 31, `integer not null default
 * 0` : aussi durable que la nature de la nº 49, et posée avant elle),
 * écrite par le glisser-déposer du formulaire (lib/enregistrer-photos).
 *
 *  1. LA PREMIÈRE PHOTO DE L'ARTISTE EST LA PREMIÈRE PHOTO AFFICHÉE,
 *     partout — sur une carte, dans les favoris, sur la fiche, dans
 *     une fenêtre. Aucune surface ne choisit sa propre vignette ;
 *  2. L'ORDRE DES SUIVANTES NE CHANGE JAMAIS NON PLUS. Une surface qui
 *     affiche des photos les trie par `ordre`, et par rien d'autre —
 *     ni date d'ajout aux favoris, ni ordre de lecture en base, ni
 *     ordre d'arrivée d'une requête `in(...)` ;
 *  3. UN CARROUSEL NE MÊLE JAMAIS LES PHOTOS D'UN AUTRE — ni d'un
 *     autre style, ni d'une autre catégorie, ni d'un autre rendu.
 *     C'est `ensembleDeLaPhoto` qui tranche, jamais un filtre écrit à
 *     la main ailleurs ;
 *  4. LE CŒUR PORTE SUR LE CARROUSEL ENTIER, pas sur une photo : aimer
 *     une photo, c'est aimer la galerie, et c'est la galerie COMPLÈTE
 *     qui se range dans les favoris, DANS L'ORDRE DE L'ARTISTE.
 *
 * ⚠️ CE QUI N'EST PAS UN CARROUSEL, et n'a donc pas à suivre la règle
 * 1 : une bande CHRONOLOGIQUE, qui montre « les dernières
 * publications » d'un artiste tous carrousels confondus (la rangée
 * « Ses dernières réalisations » de « Ma sélection »). Elle l'annonce
 * en toutes lettres à l'écran, et son ordre est la date de
 * publication — c'est sa raison d'être. Dès qu'une rangée prétend
 * montrer UNE galerie, en revanche, les quatre règles s'appliquent.
 *
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

/** LE RENDU PAR DÉFAUT — celui qu'on prête à une ligne qui n'en porte
    pas : photo d'avant la migration nº 48, ou ligne écrite par les
    migrations nº 55 et 57, qui font le même choix. « Noir et gris » est
    celui qui se trompe le moins, et deux gestes le corrigent.
    ⚠️ IL SERT À MONTRER, JAMAIS À CACHER : une photo sans rendu doit
    apparaître dans le formulaire comme sur la fiche — l'écarter
    revenait à l'effacer au premier enregistrement (passe nº 151). */
export const RENDU_PAR_DEFAUT: SlugRendu = "black_and_grey";

/**
 * §2-b (nº 309) — LE RENDU SUR LEQUEL UN STYLE S'OUVRE
 * ==================================================================
 * ON OUVRE SUR LE RENDU QUI A DÉJÀ DES PHOTOS. Jusqu'ici, ouvrir un
 * style posait toujours le premier de la liste (« Noir et gris ») : un
 * portfolio entièrement en couleur s'ouvrait donc sur une galerie
 * VIDE, et il fallait un clic pour voir son propre travail.
 *
 * LES TROIS CAS, DANS LES MOTS DU PROPRIÉTAIRE :
 *  · « si seule la couleur en contient, on ouvre sur Couleur » ;
 *  · « si les deux en contiennent, on garde le comportement actuel » ;
 *  · « si aucun n'en contient, on garde le comportement actuel ».
 * Les deux derniers se disent d'une seule façon : hors du cas
 * « EXACTEMENT UN rendu garni », on ne change rien. Le cas symétrique
 * — seul le noir et gris est garni — rend le premier, ce qui est déjà
 * ce qu'il rendait : la règle ne le dérange pas.
 *
 * ⚠️ ELLE VIT ICI, PAS DANS LE FORMULAIRE, pour être ÉPROUVABLE : la
 * page qui la consomme exige une session Supabase signée par le
 * serveur, qu'un banc ne peut pas fabriquer. Écrite en fonction pure,
 * elle s'exécute hors navigateur, cas par cas — c'est plus fort qu'une
 * capture d'écran.
 * ⚠️ LE COMPTE SE FAIT SUR LE TRIPLET, nature comprise : les deux
 * galeries comparées sont bien celles que le formulaire montre côte à
 * côte.
 */
export function renduDOuverture(
  photos: readonly { style: string; rendu: string; nature: string }[],
  style: string,
  nature: string
): string {
  const garnis = RENDUS_PHOTO.filter((rendu) =>
    photos.some(
      (photo) =>
        photo.style === style &&
        photo.rendu === rendu.slug &&
        photo.nature === nature
    )
  );
  return garnis.length === 1 ? garnis[0].slug : RENDUS_PHOTO[0].slug;
}

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

/** LA NATURE CHERCHÉE — « tatouage », « flash », ou la chaîne vide.
    ⚠️ DIFFÉRENT DE `natureConnue` juste au-dessus, qui rend
    « tatouage » par défaut : ici, l'absence est une VRAIE réponse —
    « je n'ai rien demandé » — et ne doit surtout pas devenir un
    filtre. Une adresse bricolée à la main ne vide donc pas la page,
    elle cherche simplement tout. Vivait dans lib/tatoueurs ; déménagée
    ici (nº 359) pour la même raison que `styleConnu` (config/tatouage) :
    la fiche préparée d'avance lit ses tags dans le navigateur. */
export function natureCherchee(slug: string | undefined): string {
  return slug && SLUGS_NATURES.has(slug) ? slug : "";
}

export function libelleNature(slug: string | null | undefined): string {
  return NATURES_PHOTO.find((n) => n.slug === slug)?.label ?? (slug ?? "");
}

/** VINGT PHOTOS par couple style + rendu — le plafond d'une galerie. */
export const PLAFOND_GALERIE = 20;

/**
 * DIX PHOTOS PAR CARROUSEL SUR UNE CARTE — la règle 3 (nº 283)
 * ==================================================================
 * ⚠️ CE N'EST PAS LE PLAFOND D'UNE GALERIE, et les confondre serait
 * refaire le défaut que cette passe corrige. `PLAFOND_GALERIE` dit
 * combien de photos un artiste a le DROIT DE DÉPOSER dans une galerie
 * (vingt) ; ce nombre-ci dit combien une CARTE en montre (dix).
 *
 * POURQUOI UNE LIMITE ICI, ET PLUS SUR LA FICHE. Jusqu'à la nº 283, la
 * mosaïque bornait ce qu'elle rapatriait PAR FICHE — vingt photos, la
 * fiche entière. Depuis que la carte vaut un CARROUSEL (nº 279), ce
 * plafond ne raccourcissait plus une galerie : il faisait disparaître
 * des cartes entières — un salon à cinq styles n'existait plus que par
 * celui de ses vingt premières photos. La limite se pose donc DANS le
 * carrousel, jamais sur la fiche : on ne supprime jamais un carrousel,
 * on montre au plus dix de ses photos, DANS L'ORDRE DE L'ARTISTE.
 */
export const PHOTOS_PAR_CARROUSEL = 10;

export function libelleRendu(slug: string | null | undefined): string {
  return RENDUS_PHOTO.find((r) => r.slug === slug)?.label ?? (slug ?? "");
}

/**
 * §1 (nº 376) — LE TITRE D'UNE GALERIE — « Trash Polka • Couleur ».
 * ==================================================================
 * UNE SEULE ÉCRITURE POUR LES ENDROITS QUI L'AFFICHENT : les titres de
 * galerie du portfolio (PortfolioDeLAffiche), la ligne sous la photo de
 * la fiche au doigt depuis la nº 376 (FicheTatoueur) et, depuis la
 * nº 393, la ligne sous la fenêtre superposée du web (FenetreFiche).
 * La composition vivait en quatre exemplaires dans le portfolio — deux
 * titres et deux étiquettes ; elle vit ici, et ces endroits ne peuvent
 * plus diverger.
 *
 * DEUX CAS, ET PAS UN DE PLUS :
 *  · un rendu est donné → « Style • Rendu ». C'est le cas de TOUTES
 *    les galeries du portfolio : une série y vaut exactement un style,
 *    une catégorie et un rendu, le rendu n'y est donc jamais vide ;
 *  · aucun rendu → LE STYLE SEUL. Sur la fiche, un carrousel peut
 *    montrer un style ENTIER, noir & gris et couleur mêlés (`rendu`
 *    vide veut dire « tous les rendus ») : écrire un rendu là serait
 *    mentir sur ce qui est à l'écran.
 * ⚠️ SANS STYLE, RIEN — la chaîne vide, et l'appelant n'affiche pas de
 * ligne. Jamais une puce orpheline, jamais un blanc à la place du
 * texte. C'EST CETTE GARDE-LÀ, ET ELLE SEULE, qui protège les trois
 * appelants du séparateur solitaire : ils testent tous la chaîne avant
 * de rendre quoi que ce soit.
 *
 * ██ §1 (nº 393) — LE SÉPARATEUR DEVIENT « • » ██
 * ------------------------------------------------------------------
 * C'était « · » (U+00B7, le point médian) ; c'est désormais « • »
 * (U+2022, la puce) — CELLE DE LA FICHE : la même que les pratiques,
 * les styles et le bloc artiste. Une seule ponctuation pour séparer
 * deux valeurs, partout.
 * ⚠️ CORRIGÉ À LA SOURCE, ET C'EST TOUT L'INTÉRÊT DE LA nº 376 : les
 * cinq appels (quatre dans PortfolioDeLAffiche, un dans FicheTatoueur)
 * et celui de la nº 393 suivent SANS ÊTRE TOUCHÉS. Aucun endroit ne
 * peut rester en arrière.
 * ⚠️ CE QUI N'EST PAS CONCERNÉ : les autres « · » du site ne sont pas
 * ce libellé — la légende d'une photo (`legendePhoto`, plus bas), les
 * horaires, le pied de page, les sous-titres de carte, les styles d'un
 * membre d'équipe (`libelleStylesEquipe`). Ce sont d'autres textes, et
 * le propriétaire n'a demandé que celui-ci.
 */
export function titreDeGalerie(
  label: string | null | undefined,
  rendu: string | null | undefined
): string {
  const style = (label ?? "").trim();
  if (!style) return "";
  const precision = rendu ? libelleRendu(rendu) : "";
  return precision ? `${style} • ${precision}` : style;
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
  /** QUAND ELLE A ÉTÉ DÉPOSÉE (colonne de la migration nº 31, lue
      depuis la nº 279) — c'est elle qui donne son ÂGE au carrousel, et
      donc son vieillissement au classement (lib/classement). Absente
      sur une base ancienne ou en démonstration : le carrousel est
      alors traité comme neuf, jamais puni pour une donnée manquante. */
  cree_le?: string | null;
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

/**
 * L'ENSEMBLE D'UNE PHOTO — la définition, en un seul endroit
 * ==========================================================
 * (passe nº 209-§3/§4)
 *
 * UN ENSEMBLE, c'est le groupe de photos d'un MÊME STYLE, dans une
 * MÊME CATÉGORIE et un MÊME RENDU — « réalisation + réalisme + noir et
 * gris ». C'est exactement une galerie de dépôt (voir le plafond de
 * vingt), et c'est l'unité que le cœur manipule PARTOUT sur le site :
 * mosaïque de recherche, fiche, portfolio, « Ma sélection ». Aucun
 * écran n'y échappe, et aucun ne redéfinit la règle : ils appellent
 * tous cette fonction.
 *
 * LES DEUX REPLIS SONT CEUX DE TOUJOURS : une ligne sans catégorie est
 * une réalisation (migration nº 49), une ligne sans rendu est du noir
 * et gris (migration nº 48). Deux photos d'avant ces migrations
 * tombent donc dans le même ensemble, ce qui est le comportement
 * voulu.
 */
type PhotoClassable = {
  /** ⚠️ FACULTATIF, et ce n'est pas un relâchement : sur une fiche, les
      photos sont DÉJÀ groupées par style (StyleGalerie) et ne portent
      donc pas le leur. Les comparer entre elles sans style revient au
      même — elles ont le même. Partout où le style voyage avec la
      photo (mosaïque, « Ma sélection »), il compte normalement. */
  style?: string;
  rendu: string | null;
  nature?: string | null;
  /** §2 (nº 278) — la place voulue par l'artiste, quand la source la
      porte : `ensembleDeLaPhoto` s'en sert pour rendre le carrousel
      DANS SON ORDRE, quelle que soit la surface qui l'appelle. */
  ordre?: number | null;
};

/** Les trois tags d'une photo, replis compris — deux photos du même
    ensemble rendent la même chaîne. */
export function cleDEnsemble(photo: PhotoClassable): string {
  return [
    photo.style ?? "",
    natureConnue(photo.nature),
    photo.rendu ?? RENDU_PAR_DEFAUT,
  ].join("·");
}

/**
 * LES PHOTOS DE L'ENSEMBLE AUQUEL APPARTIENT `photo`.
 * §2 (nº 278) — ET DANS L'ORDRE DE L'ARTISTE, par construction : la
 * règle 1 du carrousel ne dépend plus de la source qui a fourni la
 * galerie. Un appelant qui lui passe des photos rangées autrement (les
 * favoris, rangés par date de cœur) obtient quand même la première de
 * l'artiste en premier. Une source sans `ordre` garde son ordre à elle
 * — le tri est stable.
 */
export function ensembleDeLaPhoto<T extends PhotoClassable>(
  galerie: T[] | null | undefined,
  photo: PhotoClassable
): T[] {
  const cle = cleDEnsemble(photo);
  return ordreDeLArtiste(
    (galerie ?? []).filter((autre) => cleDEnsemble(autre) === cle)
  );
}

/**
 * §1 (nº 278) — REMETTRE DES PHOTOS DANS L'ORDRE DE LEUR AUTEUR
 * ==================================================================
 * LES RÈGLES 1 ET 2 DU CARROUSEL, en une fonction : la place voulue
 * par l'artiste (`ordre`) commande, et rien d'autre. Le tri est STABLE
 * — deux photos de même rang gardent l'ordre où elles arrivent —, ce
 * qui rend la fonction sûre même sur une base d'avant la migration
 * nº 31, où tout le monde vaut 0.
 *
 * ⚠️ ELLE NE SE SUBSTITUE PAS À `galerieOrdonnee` : celle-là trie une
 * galerie DÉJÀ complète et typée. Celle-ci sert aux listes qui
 * arrivent d'ailleurs — les favoris, dont les lignes sont rangées par
 * date d'enregistrement, et non par volonté de l'artiste.
 */
export function ordreDeLArtiste<T extends { ordre?: number | null }>(
  photos: T[]
): T[] {
  return photos
    .map((photo, rang) => ({ photo, rang }))
    .sort(
      (a, b) =>
        (a.photo.ordre ?? 0) - (b.photo.ordre ?? 0) || a.rang - b.rang
    )
    .map(({ photo }) => photo);
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
