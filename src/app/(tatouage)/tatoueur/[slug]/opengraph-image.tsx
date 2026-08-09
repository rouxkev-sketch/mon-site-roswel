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
  TYPE_PARTAGE,
} from "@/lib/image-partage";

/**
 * L'IMAGE DE PARTAGE D'UNE FICHE — le cœur de la passe
 * =====================================================
 * C'est l'adresse qu'on partage vraiment : « regarde ce tatoueur ».
 * L'aperçu doit donc montrer LE TRAVAIL, pas un logo.
 *
 * CE QU'ELLE CONTIENT, et rien d'autre :
 *  · LA PHOTO du portfolio — la PREMIÈRE de la galerie, exactement
 *    celle qui sert de vignette sur la carte. C'est le tatoueur qui l'a
 *    mise là : c'est sa vitrine, on ne la choisit pas à sa place ;
 *  · LE NOM, en grand — c'est lui qu'on cherche du regard ;
 *  · LA LOCALITÉ, juste dessous ;
 *  · LE STYLE PRINCIPAL, en pastille rose ;
 *  · LA SIGNATURE yokofolio, discrète, en haut.
 *
 * TROIS CAS OÙ ON NE MONTRE PAS TOUT ÇA :
 *  1. FICHE INTROUVABLE POUR LE PUBLIC — pas publiée, fiche d'essai
 *     d'un administrateur, compte en cours de suppression : c'est la
 *     lecture publique elle-même qui rend `null`, on n'a AUCUNE règle
 *     à réécrire ici. Image de marque, et zéro photo rapatriée ;
 *  2. MODE DÉMONSTRATION — ce tatoueur N'EXISTE PAS. Un faux nom et
 *     une fausse ville partagés sur WhatsApp, ce serait un mensonge :
 *     image de marque, là encore ;
 *  3. FICHE SANS PHOTO (fiche d'avant le portfolio, ou photo
 *     injoignable) : le nom et la ville EN GRAND sur le fond de marque
 *     — propre, vrai, et jamais un cadre gris.
 */

export const size = TAILLE_PARTAGE;
export const contentType = TYPE_PARTAGE;

/**
 * ⚠️ CETTE IMAGE SE FABRIQUE À LA DEMANDE, PAS À LA CONSTRUCTION.
 * ================================================================
 * Sans cette ligne, Next essaie de la préfabriquer comme un fichier
 * statique. Or la lire suppose de lire la fiche en base — et la
 * lecture publique passe par un client Supabase qui consulte les
 * cookies. Pendant une préfabrication, les cookies n'existent pas :
 * la lecture échoue silencieusement, la fiche paraît introuvable, et
 * TOUTES les fiches retombent sur l'image de marque. Le défaut est
 * invisible (aucune erreur, une image correcte s'affiche) et rend la
 * passe entière inutile — d'où ce mot, et ce commentaire.
 *
 * Le nombre de fabrications, lui, est tenu par l'en-tête de cache
 * (`CACHE_PARTAGE`) : voir lib/image-partage.
 */
export const dynamic = "force-dynamic";

/** La colonne de texte : tout ce qui reste à droite de la photo et du
    liseré rose qui la borde. */
const LISERE = 6;
const LARGEUR_PANNEAU = TAILLE_PARTAGE.width - LARGEUR_PHOTO - LISERE;

/**
 * LE TEXTE ALTERNATIF, ÉCRIT POUR CETTE FICHE-LÀ.
 * `generateImageMetadata` existe pour ça : sans elle, `alt` serait une
 * constante, la même pour tout le monde — donc inutile. Ici, un lecteur
 * d'écran (et le réseau qui l'affiche) entend le nom, la ville et le
 * style, comme n'importe quel visiteur les voit.
 *
 * ⚠️ La lecture faite ici est PARTAGÉE avec les métadonnées et le corps
 * de la page (`ficheLue`) : elle n'ajoute aucune requête.
 */
export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { tatoueur, demonstration } = await ficheLue(params.slug);
  const montrable = tatoueur && !demonstration;
  const style = montrable ? tatoueur.styles[0] : "";
  return [
    {
      id: "partage",
      size,
      contentType,
      alt: montrable
        ? `Portfolio de ${tatoueur.nom} à ${tatoueur.ville_nom}` +
          (style ? ` — ${libelleStyle(style)}` : "") +
          " · yokofolio"
        : "yokofolio — Ton prochain tatouage commence par un style",
    },
  ];
}

export default async function ImagePartageFiche({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const logo = await logoDeMarque();
  const commun = { ...size, headers: { "cache-control": CACHE_PARTAGE } };

  const { tatoueur, demonstration } = await ficheLue(slug);

  // CAS 1 et 2 — rien de vrai à montrer : l'image de marque, telle
  // quelle. Aucune photo n'est même demandée.
  if (!tatoueur || demonstration) {
    return new ImageResponse(
      (
        <CompositionMarque
          logo={logo}
          titre="Ton prochain tatouage commence par un style"
          sousTitre="Compare les portfolios des tatoueurs, par style et par ville."
        />
      ),
      commun
    );
  }

  const style = tatoueur.styles[0] ?? "";
  const photo = await imageEmbarquee(
    photoChoisie(tatoueur, "")?.url ?? tatoueur.photo_principale
  );

  // CAS 3 — pas de photo exploitable : le nom et la ville en grand.
  if (!photo) {
    return new ImageResponse(
      (
        <CompositionMarque
          logo={logo}
          titre={coupe(tatoueur.nom, 44)}
          sousTitre={
            `Tatoueur à ${tatoueur.ville_nom}` +
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
