import { libelleStyle } from "@/config/tatouage";
import {
  galerieOrdonnee,
  libelleRendu,
  NATURE_PAR_DEFAUT,
  natureConnue,
  photosDuStyle,
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
  rendu?: string
): string {
  const choisie = photoChoisie(tatoueur, style, rendu);
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
  rendu?: string
): string {
  const debut = `Portfolio de ${tatoueur.nom} à ${tatoueur.ville_nom}`;
  const photo = photoChoisie(tatoueur, style, rendu);
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

/**
 * SUR QUOI LE CARROUSEL S'OUVRE — la règle, en un seul endroit
 * =============================================================
 * 1. UNE RECHERCHE PAR STYLE → ce style, et sa première photo. C'est
 *    la continuité exacte de la carte cliquée ;
 * 2. UNE RECHERCHE PAR RENDU (noir et gris, ou couleur) → une photo
 *    QUI CORRESPOND. Le style cherché garde la main s'il y en avait
 *    un ; sinon on ouvre le premier style qui en possède une ;
 * 3. NI L'UN NI L'AUTRE → le premier style de la fiche, première
 *    photo.
 */
export function ouvertureGalerie(
  groupes: StyleGalerie[],
  styleCherche: string,
  renduCherche: string
): { groupes: StyleGalerie[]; style: string; indice: number } {
  let ordonnes = ordonnerParStyle(groupes, styleCherche);
  const aLeRendu = (groupe: StyleGalerie) =>
    Boolean(renduCherche) &&
    groupe.photos.some((photo) => photo.rendu === renduCherche);

  // Rendu cherché SANS style : on ouvre le premier style qui en a une.
  if (renduCherche && !styleCherche) {
    const rang = ordonnes.findIndex(aLeRendu);
    if (rang > 0) {
      ordonnes = [ordonnes[rang], ...ordonnes.filter((_, i) => i !== rang)];
    }
  }

  const tete = ordonnes[0];
  const indice =
    tete && renduCherche
      ? Math.max(
          0,
          tete.photos.findIndex((photo) => photo.rendu === renduCherche)
        )
      : 0;
  return { groupes: ordonnes, style: tete?.slug ?? "", indice };
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
