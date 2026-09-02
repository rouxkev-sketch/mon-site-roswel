import { libelleStyle } from "@/config/tatouage";
import {
  galerieOrdonnee,
  libelleRendu,
  NATURE_PAR_DEFAUT,
  natureConnue,
  photosDuStyle,
  RENDU_PAR_DEFAUT,
  stylesDuPortfolio,
  vignetteDe,
  type PhotoTatoueur,
} from "@/lib/photos-tatoueur";

/**
 * QUELLE PHOTO MONTRER ? — la règle de yokofolio
 * ==============================================
 * ⚠️ ELLE A CHANGÉ AVEC LE PORTFOLIO CATALOGUÉ.
 *
 * AVANT : une photo par style, et la carte montrait celle du style
 * cherché — sinon la « photo principale », choisie par le site.
 *
 * MAINTENANT, dans cet ordre :
 *  1. LA RECHERCHE PORTE SUR UN STYLE ou SUR UN RENDU → la carte
 *     montre une photo QUI CORRESPOND. Chercher « couleur » et tomber
 *     sur du noir et gris serait un mensonge d'affichage ;
 *  2. SANS RIEN DE TEL → LA PREMIÈRE PHOTO DE LA GALERIE. C'est le
 *     tatoueur qui l'a mise là : c'est sa vitrine, pas la nôtre ;
 *  3. GALERIE VIDE (fiche pas encore reprise) → l'ancien modèle,
 *     `photos_styles` puis `photo_principale`. Rien ne disparaît.
 *
 * ET C'EST LA MINIATURE QUI SORT quand elle existe : une carte de
 * 300 px n'a aucune raison de télécharger une image de 1080.
 *
 * POURQUOI UN FICHIER À PART, et pas dans lib/tatoueurs.ts ? Parce que
 * les CARTES sont affichées côté navigateur : elles ne peuvent pas
 * importer un fichier qui, lui, parle à la base de données côté
 * serveur. Cette règle-ci ne dépend de rien — elle vit donc seule, et
 * les deux côtés s'en servent.
 */
export function photoPourStyle(
  tatoueur: {
    photo_principale: string;
    photos_styles?: Record<string, string>;
    galerie?: PhotoTatoueur[] | null;
  },
  style: string,
  /** LE RENDU cherché, quand la recherche en désigne UN SEUL. */
  rendu?: string,
  /** ⚠️ LA CATÉGORIE CHERCHÉE (nº 216-§1) — réalisation ou flash. Elle
      manquait ici, et c'est tout le défaut : la carte montrait la
      première photo DU STYLE, quelle que soit sa catégorie. Chercher
      des flashs d'aquarelle et voir une réalisation est le même
      mensonge d'affichage que chercher de la couleur et voir du noir
      et gris — `photoChoisie` savait déjà l'éviter, personne ne le lui
      demandait. */
  nature?: string
): string {
  const choisie = photoChoisie(tatoueur, style, rendu, nature);
  if (choisie) return vignetteDe(choisie);
  // L'ANCIEN MODÈLE, tant qu'une fiche n'a pas été reprise.
  return (style && tatoueur.photos_styles?.[style]) || tatoueur.photo_principale;
}

/**
 * LA PHOTO RETENUE — l'objet, pas seulement son adresse.
 * Même règle que ci-dessus, mais elle rend la LIGNE : c'est ce qu'il
 * faut pour écrire un texte de remplacement qui dise ce qu'on voit
 * (voir `legendeDeCarte`). Null quand la galerie est vide.
 */
export function photoChoisie(
  tatoueur: { galerie?: PhotoTatoueur[] | null },
  style: string,
  rendu?: string,
  /** LA NATURE cherchée (« flash ») — passe nº 110. Chercher des
      flashs et voir une photo de tatouage serait le même mensonge
      d'affichage que chercher « couleur » et voir du noir et gris. */
  nature?: string
): PhotoTatoueur | null {
  const galerie = galerieOrdonnee(tatoueur.galerie);
  if (galerie.length === 0) return null;

  //  LA NATURE PASSE AVANT TOUT LE RESTE quand elle est demandée :
  //  c'est la question posée en premier dans le menu « Explorer », et
  //  la carte doit y répondre. On restreint donc la galerie AVANT de
  //  jouer les préférences de style et de rendu — et l'on ne
  //  restreint que s'il reste quelque chose à montrer.
  const duGenre = nature
    ? galerie.filter((photo) => natureConnue(photo.nature) === nature)
    : galerie;
  const candidates = duGenre.length > 0 ? duGenre : galerie;

  // 1. CE QUI COCHE LES DEUX CRITÈRES, s'ils sont demandés.
  const correspond = candidates.find(
    (photo) =>
      (!style || photo.style === style) && (!rendu || photo.rendu === rendu)
  );
  if (correspond) return correspond;
  // À défaut, le style cherché prime sur le rendu : c'est lui qu'on
  // est venu voir.
  if (style) {
    const duStyle = candidates.find((photo) => photo.style === style);
    if (duStyle) return duStyle;
  }
  if (rendu) {
    const duRendu = candidates.find((photo) => photo.rendu === rendu);
    if (duRendu) return duRendu;
  }
  // 2. LA VIGNETTE CHOISIE PAR LE TATOUEUR — la première.
  return candidates[0];
}

/**
 * LE TEXTE DE REMPLACEMENT D'UNE CARTE — ce qu'on voit vraiment
 * ==============================================================
 * Une carte montre LA PHOTO D'UN STYLE PRÉCIS, faite par quelqu'un
 * qui travaille DANS UNE VILLE PRÉCISE. « Portfolio de Untel » ne
 * disait ni l'un ni l'autre : ni pour un lecteur d'écran, ni pour
 * Google Images, qui est la moitié du trafic d'un site de photos.
 *
 * On écrit donc tout ce qu'on SAIT, et rien de plus :
 *   « Portfolio de Atelier Corvus à Lyon 1er — Blackwork ·
 *     Noir et gris »
 * (⚠️ La ZONE DU CORPS a quitté ces textes avec l'abandon des tags de
 * zone, passe nº 109.) Une photo sans rendu : on s'arrête au style.
 * Aucune galerie du tout : on s'arrête à la ville. Jamais de tag
 * inventé — un texte de remplacement qui ment est pire que rien.
 */
export function legendeDeCarte(
  tatoueur: {
    nom: string;
    ville_nom: string;
    galerie?: PhotoTatoueur[] | null;
  },
  style: string,
  rendu?: string,
  /** LA CATÉGORIE CHERCHÉE (nº 216-§1) — le texte doit décrire LA
      photo montrée, donc la même règle de choix. */
  nature?: string
): string {
  const debut = `${tatoueur.nom}'s portfolio in ${tatoueur.ville_nom}`;
  const photo = photoChoisie(tatoueur, style, rendu, nature);
  const morceaux = photo
    ? [
        libelleStyle(photo.style),
        photo.rendu ? libelleRendu(photo.rendu) : "",
      ].filter(Boolean)
    : style
      ? [libelleStyle(style)]
      : [];
  return morceaux.length > 0 ? `${debut} — ${morceaux.join(" · ")}` : debut;
}

/* ================================================================
 * LA GALERIE DE LA FICHE — les photos GROUPÉES PAR STYLE
 * ================================================================ */

/** Une photo, telle que la fiche publique la montre. */
export type PhotoGalerie = {
  /** Clé de rendu (l'identifiant en base, ou l'adresse à défaut). */
  cle: string;
  /** L'image PLEINE RÉSOLUTION — celle qu'on regarde. */
  url: string;
  /** LA MINIATURE — celle qui s'affiche d'abord (voir PhotoProgressive).
      Égale à `url` pour une photo d'avant la refonte. */
  miniature: string;
  rendu: string | null;
  /** `tatouage` ou `flash` — la CATÉGORIE dans laquelle la photo a été
      déposée. Elle voyage avec la photo depuis la nº 197 : l'affiche
      range désormais le portfolio par catégorie, puis par style. */
  nature: string;
  /** « Couleur » — vide quand la photo n'a pas de rendu. */
  legende: string;
};

/** Un style de la fiche, et TOUTES ses photos. */
export type StyleGalerie = {
  slug: string;
  label: string;
  photos: PhotoGalerie[];
};

/**
 * LA GALERIE DE LA FICHE, GROUPÉE PAR STYLE
 * ==========================================
 * ⚠️ C'EST LA FIN DE « UNE PHOTO PAR STYLE ». La fiche montre
 * désormais TOUT le portfolio : chaque style porte ses photos, dans
 * l'ordre que le tatoueur a choisi dans sa galerie (glisser-déposer
 * du formulaire — voir BlocPortfolio).
 *
 * QUELS STYLES ? CEUX QUI ONT DES PHOTOS, et eux seuls. Un style
 * déclaré mais jamais rempli n'a rien à montrer : il reste dans les
 * badges « Styles » de la fiche, pas dans le sélecteur du carrousel —
 * un menu qui ouvre sur une case vide serait une promesse trahie.
 *
 * FICHE D'AVANT LA REFONTE (aucune ligne dans `photos_tatoueur`) : on
 * retombe sur l'ancien modèle, une photo par style déclaré, exactement
 * comme avant. Rien ne disparaît, et le sélecteur fonctionne pareil.
 */
export function galerieParStyles(tatoueur: {
  photo_principale: string;
  photos_styles?: Record<string, string>;
  styles: string[];
  galerie?: PhotoTatoueur[] | null;
}): StyleGalerie[] {
  const galerie = galerieOrdonnee(tatoueur.galerie);

  if (galerie.length > 0) {
    return stylesDuPortfolio(galerie).map((slug) => ({
      slug,
      label: libelleStyle(slug),
      //  ⚠️ TOUT CE QUI EST DÉPOSÉ EST VISIBLE (nº 204-§2 — le plafond
      //  d'affichage de la nº 203-§3 est annulé). La limite de vingt
      //  est une limite AU DÉPÔT, par galerie (style + catégorie +
      //  rendu), jamais une limite à l'affichage : c'est le sélecteur
      //  de rendu (nº 204-§3) qui ramène une série ouverte à une seule
      //  galerie de dépôt, sans rien tronquer.
      photos: photosDuStyle(galerie, slug).map((photo) => ({
        cle: photo.id,
        url: photo.url,
        miniature: vignetteDe(photo),
        rendu: photo.rendu,
        nature: natureConnue(photo.nature),
        // La légende ne redit PAS le style : il est déjà annoncé par
        // le sélecteur, juste au-dessus de la photo.
        legende: photo.rendu ? libelleRendu(photo.rendu) : "",
      })),
    }));
  }

  // L'ANCIEN MODÈLE — une image par style déclaré.
  return tatoueur.styles.map((slug) => {
    const image = photoPourStyle(tatoueur, slug);
    return {
      slug,
      label: libelleStyle(slug),
      photos: [
        {
          cle: `${slug}-${image}`,
          url: image,
          miniature: image,
          rendu: null,
          nature: NATURE_PAR_DEFAUT,
          legende: "",
        },
      ],
    };
  });
}

/* ================================================================
 * LA SÉRIE MONTRÉE PAR UN CARROUSEL — UNE SEULE ÉCRITURE
 * ================================================================ */

/** Ce qu'une enveloppe demande à voir : une catégorie, et un rendu
    quand il en reste un seul (`rendu` vide = tous les rendus). */
export type SerieDemandee = { nature: string; rendu: string } | null;

/**
 * LES PHOTOS D'UNE SÉRIE — ET JAMAIS CELLES D'UNE AUTRE CATÉGORIE
 * ==================================================================
 * (passe nº 247-§1 — LA correction du défaut, écrite UNE fois)
 *
 * CE QUI SE PASSAIT. Les deux enveloppes de fiche — la page
 * (`FicheTatoueur`) et la fenêtre superposée (`FenetreFiche`) —
 * portaient CHACUNE leur copie de ce filtre, suivie du même repli :
 * « série vide → on montre le style entier ». Ce repli est le chemin
 * par lequel une RÉALISATION entrait dans un carrousel de FLASHS : il
 * suffisait que la catégorie demandée n'arrive pas jusqu'ici (c'était
 * le cas depuis « Ma sélection », voir PageFavoris) ou que le style
 * ouvert n'en possède aucune.
 *
 * LA RÈGLE, DÉSORMAIS, N'A PLUS D'EXCEPTION : une catégorie demandée
 * n'est jamais violée.
 *  · la CATÉGORIE filtre, et ne s'élargit jamais — rien de cette
 *    catégorie ici ? on rend une liste VIDE, et l'appelant sait qu'il
 *    n'a pas de série (il montre alors le style, sans prétendre
 *    montrer une catégorie : voir `data-serie-nature`) ;
 *  · le RENDU, lui, peut s'élargir à toute la catégorie : c'est le
 *    même dessin, dans l'autre encre — jamais un autre genre d'image.
 */
/**
 * §2 (nº 278) — LA SÉRIE D'OUVERTURE QUAND ON N'A RIEN CHERCHÉ
 * ==================================================================
 * LA RÈGLE 3 DU CARROUSEL (voir lib/photos-tatoueur) : un carrousel ne
 * mêle JAMAIS les photos d'un autre — ni d'une autre catégorie, ni
 * d'un autre rendu. Une fiche ouverte SANS recherche (lien direct,
 * favoris, ligne d'équipe) montrait pourtant LE STYLE ENTIER : les
 * réalisations et les flashs d'un même style défilaient dans le même
 * cadre, noir et gris et couleur mêlés. C'était la consigne de la
 * nº 272 (« sans recherche, montre tout ») — elle est ANNULÉE par la
 * définition posée en nº 278-§0, qui vaut « partout sans exception ».
 *
 * CE QUI S'OUVRE DÉSORMAIS : l'ensemble de LA PREMIÈRE PHOTO du style
 * — la vitrine de l'artiste (règle 1). Rien n'est perdu : les autres
 * séries du même style vivent dans l'onglet Portfolio, chacune sous sa
 * vignette (nº 276-§3).
 */
/**
 * §3 (nº 280) — L'ADRESSE D'UN CARROUSEL, écrite une seule fois.
 * ==================================================================
 * C'est celle que partage le bouton de partage, celle que pousse la
 * fenêtre superposée à l'ouverture (nº 279-§2) et celle que porte le
 * lien d'une carte : les trois disent la même chose, donc elles
 * s'écrivent au même endroit. Une fiche ouverte sans série connue rend
 * l'adresse nue — elle ouvrira sa première galerie (nº 278-§2).
 */
export function cheminDuCarrousel(
  slug: string,
  style: string,
  serie: { nature: string; rendu: string } | null
): string {
  if (!style && !serie) return `/tatoueur/${slug}`;
  const suite = new URLSearchParams();
  if (style) suite.set("style", style);
  if (serie?.nature) suite.set("nature", serie.nature);
  if (serie?.rendu) suite.set("rendu", serie.rendu);
  const requete = suite.toString();
  return requete ? `/tatoueur/${slug}?${requete}` : `/tatoueur/${slug}`;
}

/*  §1 (nº 602) — `cheminDeLaFenetreCarrousel` EST SUPPRIMÉE, CODE
    COMPRIS. Elle écrivait l'adresse `/tatoueur/<slug>/carrousel` de la
    page plein écran de la nº 284. La nº 455 lui avait déjà retiré son
    dernier appelant ; la nº 602 supprime la page, sa route serveur et
    la surveillance d'adresse qui la montait — cette écriture n'a donc
    plus de destination.
    ⚠️ NE PAS LA CONFONDRE AVEC `cheminDuCarrousel`, juste au-dessus,
    qui est bien vivante : c'est l'adresse PARTAGEABLE d'un carrousel
    de fiche (nº 280-§3), celle que porte le bouton de partage. */

/**
 * §4 (nº 302) — LA SÉRIE ET LE RANG D'UNE PHOTO DEMANDÉE.
 * ==================================================================
 * `ouvertureGalerie` met le bon STYLE en tête et donne le rang de la
 * photo DANS CE STYLE ENTIER. Or les deux enveloppes n'affichent pas
 * un style entier : elles le restreignent à une SÉRIE (catégorie +
 * rendu — la règle 3 du carrousel, nº 278, qui interdit de mêler deux
 * galeries de dépôt). Le rang du style entier n'y correspond donc pas,
 * et la photo demandée peut même en être absente.
 * CETTE FONCTION REND LES DEUX RÉPONSES D'UN COUP : la série à ouvrir
 * (celle de la photo, jamais celle de la première du style) et le rang
 * de la photo DANS cette série. Une seule écriture pour la page, la
 * fenêtre superposée et la fenêtre de carrousel — la corriger ici les
 * corrige toutes les trois.
 * `null` quand aucune photo n'est demandée, ou qu'elle est introuvable :
 * l'appelant retombe alors sur son comportement d'avant, à la lettre.
 */
export function ouvertureSurUnePhoto(
  groupes: StyleGalerie[],
  photoCherchee: string
): { serie: { nature: string; rendu: string }; indice: number } | null {
  if (!photoCherchee) return null;
  const groupe = groupes.find((entree) =>
    entree.photos.some((photo) => photo.cle === photoCherchee)
  );
  const visee = groupe?.photos.find((photo) => photo.cle === photoCherchee);
  if (!groupe || !visee) return null;
  const serie = {
    nature: visee.nature || NATURE_PAR_DEFAUT,
    rendu: visee.rendu ?? RENDU_PAR_DEFAUT,
  };
  const indice = serieMontree(groupe.photos, serie).findIndex(
    (photo) => photo.cle === photoCherchee
  );
  return { serie, indice: Math.max(0, indice) };
}

export function serieDeLOuverture(
  groupes: StyleGalerie[],
  style: string
): { nature: string; rendu: string } | null {
  const groupe =
    groupes.find((entree) => entree.slug === style) ?? groupes[0] ?? null;
  const premiere = groupe?.photos[0];
  if (!premiere) return null;
  return {
    nature: premiere.nature || NATURE_PAR_DEFAUT,
    rendu: premiere.rendu ?? RENDU_PAR_DEFAUT,
  };
}

export function serieMontree(
  photos: PhotoGalerie[],
  serie: SerieDemandee
): PhotoGalerie[] {
  if (!serie || !serie.nature) return photos;
  const deLaCategorie = photos.filter(
    (photo) => photo.nature === serie.nature
  );
  if (deLaCategorie.length === 0) return [];
  if (!serie.rendu) return deLaCategorie;
  const duRendu = deLaCategorie.filter(
    (photo) => (photo.rendu ?? RENDU_PAR_DEFAUT) === serie.rendu
  );
  return duRendu.length > 0 ? duRendu : deLaCategorie;
}

/**
 * SUR QUOI LE CARROUSEL S'OUVRE — la règle, en un seul endroit
 * =============================================================
 * 1. UNE RECHERCHE PAR STYLE → ce style, et sa première photo. C'est
 *    la continuité exacte de la carte cliquée ;
 * 2. UNE RECHERCHE PAR CATÉGORIE ou PAR RENDU → une photo QUI
 *    CORRESPOND. Le style cherché garde la main s'il y en avait un ;
 *    sinon on ouvre le premier style qui en possède une ;
 * 3. RIEN DE TEL → le premier style de la fiche, première photo.
 *
 * ⚠️ LA CATÉGORIE MANQUAIT ICI, ET C'EST TOUTE LA CAUSE (nº 217-§3).
 * ==================================================================
 * La nº 216 a fait descendre la catégorie jusqu'à la CARTE ; le
 * carrousel de la fiche, lui, ne la recevait toujours pas. Chercher
 * « flash + aquarelle » puis ouvrir la fiche donnait donc la première
 * photo D'AQUARELLE — une réalisation. La carte disait une chose, la
 * fiche en montrait une autre, à un clic d'intervalle.
 * Cette fonction est LE point de passage des deux enveloppes (la page
 * `FicheTatoueur` et la fenêtre `FenetreFiche`) : la corriger ici les
 * corrige toutes les deux, et interdit qu'une troisième enveloppe
 * réinvente la règle.
 *
 * LES TROIS CRITÈRES SE HIÉRARCHISENT COMME DANS `photoChoisie` — la
 * carte et la fiche appliquent ainsi la MÊME cascade, ce qui est la
 * seule façon de garantir qu'elles montrent la même image.
 */
export function ouvertureGalerie(
  groupes: StyleGalerie[],
  styleCherche: string,
  renduCherche: string,
  /** LA CATÉGORIE CHERCHÉE — « tatouage » ou « flash ». Vide : on n'a
      pas cherché par catégorie, et elle ne départage rien. */
  natureCherchee = "",
  /**
   * §4 (nº 302) — L'IDENTIFIANT D'UNE PHOTO PRÉCISE — ET IL PASSE
   * AVANT TOUT LE RESTE.
   * ------------------------------------------------------------------
   * LE DÉFAUT : cliquer la 8ᵉ photo d'une galerie ouvrait le carrousel
   * SUR LA PREMIÈRE (« 1/19 »). Les trois critères existants (style,
   * catégorie, rendu) désignent une SÉRIE, jamais une image : ils ne
   * pouvaient pas répondre à la question « laquelle ».
   * LE REMÈDE : quand l'adresse porte `?photo=<id>`, on ouvre LE STYLE
   * QUI LA CONTIENT, positionné SUR ELLE. Aucun second mécanisme n'est
   * écrit : c'est la même fonction, le même point de passage unique
   * pour la page, la fenêtre superposée et la fenêtre de carrousel du
   * doigt — la corriger ici les corrige toutes les trois.
   * ⚠️ INTROUVABLE (photo retirée, adresse recopiée à la main) : on
   * retombe EXACTEMENT sur le comportement d'avant, sans erreur.
   */
  photoCherchee = ""
): { groupes: StyleGalerie[]; style: string; indice: number } {
  /*  §4 (nº 302) — LA PHOTO DEMANDÉE D'ABORD. On la cherche dans TOUS
      les styles ; celui qui la porte passe en tête, et l'indice est sa
      place exacte dans ce style. */
  if (photoCherchee) {
    //  ⚠️ `cle` EST L'IDENTIFIANT : c'est l'identifiant en base quand
    //  la photo en a un (le cas de tout portfolio catalogué), l'adresse
    //  de l'image sinon. C'est exactement ce que le lien transporte.
    const rangStyle = groupes.findIndex((groupe) =>
      groupe.photos.some((photo) => photo.cle === photoCherchee)
    );
    if (rangStyle >= 0) {
      const ordonnes =
        rangStyle === 0
          ? groupes
          : [groupes[rangStyle], ...groupes.filter((_, i) => i !== rangStyle)];
      return {
        groupes: ordonnes,
        style: ordonnes[0].slug,
        indice: ordonnes[0].photos.findIndex(
          (photo) => photo.cle === photoCherchee
        ),
      };
    }
  }
  /** Cette photo répond-elle à ce qui a été cherché ? Un critère non
      demandé ne dit jamais non. */
  const repond = (photo: PhotoGalerie) =>
    (!natureCherchee || photo.nature === natureCherchee) &&
    (!renduCherche || photo.rendu === renduCherche);

  let ordonnes = ordonnerParStyle(groupes, styleCherche);
  const critereDePhoto = Boolean(natureCherchee || renduCherche);

  /**
   * ⚠️ ON N'OUVRE JAMAIS UN STYLE QUI N'A PAS CE QU'ON DEMANDE
   * ------------------------------------------------------------------
   * (nº 247-§1 — deuxième cause du mélange de catégories)
   * La règle ne jouait QUE si aucun style n'était cherché. Un style
   * cherché qui ne possède aucune photo de la catégorie demandée
   * gardait donc la tête : la série demandée sortait VIDE, et les deux
   * enveloppes se repliaient alors sur « tout le style » — c'est-à-dire
   * sur des réalisations affichées sous le mot « flash ».
   * On regarde donc TOUJOURS si la tête répond ; si elle ne répond pas,
   * on met devant le premier style qui répond — d'abord aux deux
   * critères, à défaut à la seule CATÉGORIE (elle passe avant le rendu,
   * comme dans `photoChoisie`).
   */
  if (critereDePhoto && !ordonnes[0]?.photos.some(repond)) {
    const rang = ordonnes.findIndex((groupe) => groupe.photos.some(repond));
    const rangCategorie = natureCherchee
      ? ordonnes.findIndex((groupe) =>
          groupe.photos.some((photo) => photo.nature === natureCherchee)
        )
      : -1;
    const choisi = rang >= 0 ? rang : rangCategorie;
    if (choisi > 0) {
      ordonnes = [ordonnes[choisi], ...ordonnes.filter((_, i) => i !== choisi)];
    }
  }

  const tete = ordonnes[0];
  return {
    groupes: ordonnes,
    style: tete?.slug ?? "",
    indice: tete ? rangDOuverture(tete, repond, natureCherchee, renduCherche) : 0,
  };
}

/**
 * DANS LE STYLE OUVERT, SUR QUELLE PHOTO ON TOMBE — la cascade est
 * celle de `photoChoisie`, et c'est ce qui garantit que la carte et la
 * fiche montrent LA MÊME image :
 *  1. la première photo qui répond aux DEUX critères demandés ;
 *  2. à défaut, la première de la CATÉGORIE cherchée — elle passe
 *     avant le rendu, c'est la question posée en premier dans le menu
 *     « Explorer » ;
 *  3. à défaut, la première du rendu cherché ;
 *  4. à défaut, la première du style — la vitrine du tatoueur.
 */
function rangDOuverture(
  groupe: StyleGalerie,
  repond: (photo: PhotoGalerie) => boolean,
  natureCherchee: string,
  renduCherche: string
): number {
  if (!natureCherchee && !renduCherche) return 0;
  const rangs = [
    groupe.photos.findIndex(repond),
    natureCherchee
      ? groupe.photos.findIndex((photo) => photo.nature === natureCherchee)
      : -1,
    renduCherche
      ? groupe.photos.findIndex((photo) => photo.rendu === renduCherche)
      : -1,
  ];
  return rangs.find((rang) => rang >= 0) ?? 0;
}

/**
 * L'ORDRE DES PHOTOS QUAND UN STYLE EST CHERCHÉ
 * ==============================================
 * Le style cherché passe EN PREMIER — il devient la photo « 1/8 », et
 * pas « 6/8 » : celle qu'on voit à l'ouverture EST le début de la
 * série, on ne revient donc jamais en arrière pour voir « les
 * précédentes ». Les autres gardent leur ordre d'origine.
 *
 * Aucun style cherché, ou style que ce tatoueur ne pratique pas :
 * l'ordre d'origine, inchangé.
 */
export function ordonnerParStyle<T extends { slug: string }>(
  styles: T[],
  styleCherche: string
): T[] {
  if (!styleCherche) return styles;
  const rang = styles.findIndex((style) => style.slug === styleCherche);
  if (rang <= 0) return styles;
  return [styles[rang], ...styles.filter((_, index) => index !== rang)];
}
