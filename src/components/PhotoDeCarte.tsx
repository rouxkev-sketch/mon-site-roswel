"use client";

import Image from "next/image";
import { PHOTO_MINIATURE, PHOTO_PORTFOLIO } from "@/config/tatouage";

/**
 * ██ LA PHOTO D'UNE CARTE — nº 366 ██
 * ==================================================================
 * CE QU'ON A MESURÉ, ET C'EST TOUTE LA CAUSE DU GRAIN. Une carte
 * servait la MINIATURE déposée au recadrage : 320 × 400 pixels, en
 * JPEG de qualité 0,72 (RecadreurPhoto). Or ce que l'écran demande,
 * lui, se compte en pixels RÉELS, densité comprise :
 *
 *   · iPhone, deux colonnes  — carte ~190 pt × 3 = ~570 px  → 320 servis
 *   · iPhone, pleine largeur — carte ~390 pt × 3 = ~1170 px → 320 servis
 *   · Mac Retina, 4 colonnes — carte ~340 pt × 2 = ~680 px  → 320 servis
 *
 * Deux à quatre fois trop peu. Le navigateur étire alors chaque pixel
 * sur deux ou trois : c'est le grain, et il ne vient PAS de la source
 * (l'original stocké fait 1080 × 1350, qualité 0,88).
 *
 * CE QU'ON FAIT, ET POURQUOI ÇA NE COÛTE PAS LE POIDS QU'ON CROIT :
 * on part de L'ORIGINAL et on laisse l'optimiseur d'images de Next
 * fabriquer la taille exacte demandée par CET écran (`sizes`), dans un
 * format MODERNE (AVIF, puis WebP — voir next.config). À qualité
 * perçue égale, l'AVIF pèse environ la moitié d'un JPEG : on quadruple
 * les pixels sans doubler les octets. Le fichier est fabriqué UNE fois
 * puis servi par le cache — aucune transformation par visiteur.
 *
 * ⚠️ CE QUI NE PASSE PAS PAR L'OPTIMISEUR, et c'est voulu :
 *  · les photos de DÉMONSTRATION (SVG dessinés à la volée) — un SVG
 *    est net à toutes les tailles, et l'optimiseur refuse le SVG sauf
 *    à ouvrir une porte qu'on ne veut pas ouvrir ;
 *  · les fiches d'AVANT le portfolio catalogué, qui n'ont qu'une
 *    adresse d'image sans original connu.
 * Dans ces deux cas, l'image est servie exactement comme avant.
 *
 * ⚠️ CE QUI NE CHANGE PAS : le chargement paresseux et la priorité des
 * premières images sont passés tels quels par l'appelant ; le cadre,
 * le format 4:5 et la réservation de hauteur sont ceux du site
 * (config/tatouage) ; aucun recadrage, aucune proportion touchée.
 * ⚠️ LA FICHE N'EST PAS CONCERNÉE : elle sert la pleine résolution
 * telle quelle, et la règle nº 280 (une photo arrive en une seule
 * fois, jamais un aperçu puis une nette) reste entière.
 */

/**
 * LA QUALITÉ DEMANDÉE À L'OPTIMISEUR — le seul bouton de cette passe.
 * 65 en AVIF tient au-dessus d'un JPEG 0,72 pour à peu près les mêmes
 * octets ; monter à 75 gagne peu à l'œil et coûte environ un tiers de
 * poids en plus, descendre à 50 fait fondre le fichier et commence à
 * se voir sur les dégradés de noir et gris — ce que ce site montre.
 * ⚠️ TOUTE VALEUR UTILISÉE ICI DOIT ÊTRE DÉCLARÉE dans
 * `images.qualities` (next.config) : Next 16 refuse les autres.
 */
export const QUALITE_CARTE = 65;

/**
 * LES LARGEURS D'UNE CARTE, dites au navigateur pour qu'il choisisse
 * le bon fichier. Elles suivent les colonnes de la mosaïque
 * (COLONNES_MOSAIQUE, GrilleTatoueurs) : 2 colonnes au doigt, 3 dès
 * 768, 4 dès 1280, 5 dès 1536, 6 dès 1664.
 *
 * ⚠️ ELLES NE DÉPENDENT PAS DE LA DISPOSITION, ET C'EST UNE RÈGLE
 * DATÉE (nº 175-§5, écrite dans CarteTatoueur) : « ne jamais
 * introduire une source choisie d'après `uneColonne` ». Le
 * propriétaire avait vu l'écran SE VIDER à chaque bascule de
 * disposition — le navigateur écartait les images qu'il avait pour en
 * redemander d'autres. Une seule liste, la même en deux colonnes et
 * en pleine largeur : le fichier déjà chargé reste valable, la
 * bascule ne redemande rien.
 *
 * CE QUE ÇA COÛTE, ET C'EST DIT : en pleine largeur au doigt, l'écran
 * demanderait ~1170 px de vrais pixels ; il en reçoit ~640. C'est
 * DEUX FOIS ce qu'il recevait, pas quatre. Aller jusqu'au compte
 * exact suppose d'accepter les deux choses que la nº 175 refusait :
 * le poids d'un fichier de 1200 px sur chaque carte, et le risque de
 * l'écran vide à la bascule. C'est un choix du propriétaire, pas le
 * mien : la ligne à changer est celle-ci.
 */
export const TAILLES_CARTE =
  "(min-width: 1664px) 17vw, (min-width: 1536px) 20vw, " +
  "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

/** Une adresse que l'optimiseur peut travailler : notre stockage, et
    pas un SVG de démonstration. */
function optimisable(url: string | null | undefined): url is string {
  return Boolean(url) && /^https?:\/\//.test(url as string) && !/\.svg($|\?)/i.test(url as string);
}

export function PhotoDeCarte({
  url,
  urlPleine,
  alt,
  tailles,
  classe = "",
  chargement,
  priorite,
}: {
  /** LA MINIATURE (320 × 400) — le repli, et l'image des fiches
      anciennes ou de démonstration. */
  url: string;
  /** L'ORIGINAL (1080 × 1350), quand la photo est cataloguée : c'est
      LUI que l'optimiseur réduit à la taille exacte de l'écran. */
  urlPleine?: string | null;
  alt: string;
  /** Les largeurs d'affichage — voir les deux constantes ci-dessus. */
  tailles: string;
  classe?: string;
  /** `lazy`, ou rien pour les premières cartes : la valeur de
      l'appelant est passée telle quelle, l'ordre de priorité de la
      mosaïque ne change pas d'un cran. */
  chargement?: "lazy" | "eager";
  priorite?: "high";
}) {
  if (!optimisable(urlPleine)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element --
         image de démonstration (SVG) ou fiche d'avant le portfolio
         catalogué : servie telle quelle, comme avant la nº 366. */
      <img
        src={url}
        alt={alt}
        loading={chargement}
        fetchPriority={priorite}
        decoding="async"
        width={PHOTO_MINIATURE.largeur}
        height={PHOTO_MINIATURE.hauteur}
        className={classe}
      />
    );
  }
  return (
    <Image
      src={urlPleine}
      alt={alt}
      //  LES DIMENSIONS DE LA SOURCE : elles ne décrivent pas ce qui
      //  s'affiche (c'est `tailles` qui le dit), elles réservent la
      //  place au bon format — la hauteur de la mosaïque ne bouge pas
      //  d'un pixel pendant le chargement (règle nº 226).
      width={PHOTO_PORTFOLIO.largeur}
      height={PHOTO_PORTFOLIO.hauteur}
      sizes={tailles}
      quality={QUALITE_CARTE}
      loading={chargement}
      fetchPriority={priorite}
      className={classe}
    />
  );
}
