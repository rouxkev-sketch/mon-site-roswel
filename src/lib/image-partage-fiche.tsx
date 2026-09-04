import { ImageResponse } from "next/og";
import { libelleStyle } from "@/config/tatouage";
import { ficheLue } from "@/lib/fiche-lue";
import { photoChoisie } from "@/lib/photo-tatoueur";
import {
  CACHE_PARTAGE,
  CompositionMarque,
  coupe,
  FOND,
  imageEmbarquee,
  LARGEUR_PHOTO,
  logoDeMarque,
  Pastille,
  ROSE,
  Signature,
  TAILLE_PARTAGE,
  TEXTE,
  TEXTE_DOUX,
} from "@/lib/image-partage";

/**
 * ██ L'IMAGE DE PARTAGE D'UNE FICHE — UNE SEULE ÉCRITURE (nº 281-§2) ██
 * ==================================================================
 * ELLE ÉTAIT DANS `opengraph-image.tsx`, et elle n'en pouvait pas
 * sortir : Next appelle ce fichier avec le SLUG SEUL, jamais avec les
 * paramètres de l'adresse. Or depuis la nº 280-§3, le lien partagé
 * porte LE CARROUSEL — style, catégorie, rendu. L'aperçu montrait donc
 * la vitrine de la fiche pendant que le lien menait à des flashs en
 * réalisme : deux promesses différentes dans le même message.
 *
 * LA COMPOSITION VIT DONC ICI, et deux appelants la consomment :
 *  · `opengraph-image.tsx` — l'aperçu par défaut d'une fiche, sans
 *    carrousel : rien ne change pour lui ;
 *  · la route `/artist/<slug>/share` — la même image, mais pour LE
 *    CARROUSEL que l'adresse désigne. C'est elle que les métadonnées
 *    annoncent quand le lien porte des tags (voir la page de fiche).
 * Une seule composition, donc aucune chance que les deux divergent.
 *
 * CE QU'ELLE CONTIENT, et rien d'autre :
 *  · LA PHOTO — la PREMIÈRE du carrousel demandé (règle 1 du §0 de la
 *    nº 278) ; sans carrousel, la première de la galerie, comme avant ;
 *  · LE NOM, en grand ; LA LOCALITÉ dessous ; LE STYLE en pastille
 *    rose — celui du carrousel quand il y en a un ;
 *  · LA SIGNATURE yokofolio, discrète.
 *
 * TROIS CAS OÙ ON NE MONTRE PAS TOUT ÇA (inchangés) :
 *  1. FICHE INTROUVABLE POUR LE PUBLIC — la lecture publique rend
 *     `null`, on ne réécrit aucune règle : image de marque ;
 *  2. MODE DÉMONSTRATION — ce tatoueur n'existe pas : image de marque ;
 *  3. FICHE SANS PHOTO EXPLOITABLE : le nom et la ville en grand.
 * ⚠️ JAMAIS D'IMAGE VIDE, JAMAIS D'ERREUR : un carrousel demandé qui
 * n'existe pas (adresse bricolée) retombe sur la photo de la fiche —
 * `photoChoisie` ne rend jamais rien d'autre que quelque chose.
 */

/** Le liseré rose entre la photo et le texte. */
const LISERE = 6;
const LARGEUR_PANNEAU = TAILLE_PARTAGE.width - LARGEUR_PHOTO - LISERE;

/** LES TAGS DU CARROUSEL PARTAGÉ — tous facultatifs : une adresse sans
    tag rend l'aperçu de la fiche, exactement comme avant la nº 281. */
export type TagsPartage = {
  style?: string;
  nature?: string;
  rendu?: string;
};

/** LE TEXTE ALTERNATIF de l'image — il dit ce que l'image montre, y
    compris le style du carrousel quand l'adresse en désigne un. */
export async function texteAlternatifPartage(
  slug: string,
  tags: TagsPartage = {}
): Promise<string> {
  const { tatoueur, demonstration } = await ficheLue(slug);
  if (!tatoueur || demonstration) {
    return "YokoFolio — Your next tattoo starts with a style";
  }
  const style = tags.style || tatoueur.styles[0] || "";
  return (
    `${tatoueur.nom}'s portfolio in ${tatoueur.ville_nom}` +
    (style ? ` — ${libelleStyle(style)}` : "") +
    " · yokofolio"
  );
}

/**
 * L'IMAGE ELLE-MÊME. `tags` vide : l'aperçu de la fiche (le
 * comportement d'avant). `tags` renseignés : l'aperçu DU CARROUSEL.
 */
export async function imagePartageDeLaFiche(
  slug: string,
  tags: TagsPartage = {}
): Promise<ImageResponse> {
  const logo = await logoDeMarque();
  const commun = {
    ...TAILLE_PARTAGE,
    headers: { "cache-control": CACHE_PARTAGE },
  };

  const { tatoueur, demonstration } = await ficheLue(slug);

  // CAS 1 et 2 — rien de vrai à montrer : l'image de marque, telle
  // quelle. Aucune photo n'est même demandée.
  if (!tatoueur || demonstration) {
    return new ImageResponse(
      (
        <CompositionMarque
          logo={logo}
          titre="Your next tattoo starts with a style"
          sousTitre="Compare tattoo artists' portfolios, by style and city."
        />
      ),
      commun
    );
  }

  //  §2 (nº 281) — LA PHOTO EST CELLE DU CARROUSEL DEMANDÉ. C'est la
  //  MÊME cascade que la carte et que la fiche (`photoChoisie`, nº 216)
  //  — style, puis catégorie, puis rendu, et la première de la galerie
  //  à défaut : l'aperçu montre donc exactement ce que le lien ouvre.
  const choisie = photoChoisie(
    tatoueur,
    tags.style ?? "",
    tags.rendu,
    tags.nature
  );
  const style = tags.style || choisie?.style || tatoueur.styles[0] || "";
  const photo = await imageEmbarquee(
    choisie?.url ?? tatoueur.photo_principale
  );

  // CAS 3 — pas de photo exploitable : le nom et la ville en grand.
  if (!photo) {
    return new ImageResponse(
      (
        <CompositionMarque
          logo={logo}
          titre={coupe(tatoueur.nom, 44)}
          sousTitre={
            `Tattoo artist in ${tatoueur.ville_nom}` +
            (style ? ` — ${libelleStyle(style)}` : "")
          }
        />
      ),
      commun
    );
  }

  // LE NOM S'ADAPTE À SA LONGUEUR. « Encre Vive » et « Maison Vermillon
  // Tatouage » ne peuvent pas s'écrire dans le même corps : on descend
  // par paliers plutôt que de couper un nom propre.
  const nom = coupe(tatoueur.nom, 44);
  const tailleNom = nom.length <= 16 ? 66 : nom.length <= 26 ? 54 : 44;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: FOND }}>
        {/* LA PHOTO — 504 px de large sur 630 de haut, soit un 4:5
            debout à pleine hauteur : le cadrage exact du portfolio,
            aucun recadrage, aucune bande noire. */}
        {/* eslint-disable-next-line @next/next/no-img-element --
            ceci n'est pas du HTML : `next/og` dessine une IMAGE à
            partir de ce balisage, `next/image` n'y existe pas. */}
        <img
          src={photo}
          alt=""
          width={LARGEUR_PHOTO}
          height={TAILLE_PARTAGE.height}
          style={{
            width: LARGEUR_PHOTO,
            height: TAILLE_PARTAGE.height,
            objectFit: "cover",
          }}
        />
        {/* Le liseré rose : il sépare franchement la photo du texte,
            même quand la photo est très sombre. */}
        <div style={{ display: "flex", width: LISERE, height: "100%", background: ROSE }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: LARGEUR_PANNEAU,
            height: "100%",
            padding: 54,
            background: FOND,
            backgroundImage: `radial-gradient(circle at 110% 110%, ${ROSE}30 0%, ${ROSE}00 55%)`,
          }}
        >
          <Signature logo={logo} taille={32} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            {style && <Pastille>{libelleStyle(style)}</Pastille>}
            <div
              style={{
                marginTop: style ? 26 : 0,
                fontSize: tailleNom,
                fontWeight: 700,
                color: TEXTE,
                lineHeight: 1.06,
                letterSpacing: -1.2,
              }}
            >
              {nom}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 32,
                color: TEXTE_DOUX,
              }}
            >
              {coupe(tatoueur.ville_nom, 34)}
            </div>
          </div>
        </div>
      </div>
    ),
    commun
  );
}
