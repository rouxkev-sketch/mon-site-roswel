import { ImageResponse } from "next/og";
import { libelleStyle } from "@/config/tatouage";
import { chargerStyleVille } from "@/lib/style-ville";
import { photoChoisie } from "@/lib/photo-tatoueur";
import { villeAffichee } from "@/lib/adresse";
import {
  CACHE_PARTAGE,
  CompositionMarque,
  coupe,
  FOND,
  imageEmbarquee,
  logoDeMarque,
  ROSE,
  Signature,
  TAILLE_PARTAGE,
  TEXTE,
  TYPE_PARTAGE,
} from "@/lib/image-partage";

/**
 * L'IMAGE DE PARTAGE D'UNE PAGE STYLE + VILLE
 * ============================================
 * « Tatoueurs blackwork à Lyon » : la page répond à une question, et
 * l'aperçu doit répondre à la MÊME question, en un coup d'œil.
 *
 * LA LISIBILITÉ D'ABORD, comme demandé. La phrase est écrite en grand
 * sur l'aplat anthracite, jamais par-dessus une photo : une photo de
 * tatouage est très contrastée, un texte posé dessus deviendrait
 * illisible dès que l'aperçu est réduit dans une conversation.
 *
 * LES PHOTOS VIENNENT EN DESSOUS, dans un bandeau à part : trois
 * portfolios, trois tatoueurs DIFFÉRENTS de cette ville et de ce style.
 * Elles prouvent la promesse sans jamais gêner la phrase. Moins de
 * trois photos disponibles : le bandeau se partage entre celles qu'on
 * a. Aucune : la phrase occupe toute l'image, et c'est très bien.
 *
 * DEUX CAS SANS PHOTO DU TOUT :
 *  · MODE DÉMONSTRATION — les portfolios affichés sont des dessins de
 *    remplissage : on garde la phrase (elle, reste vraie) et on retire
 *    les photos, plutôt que d'exposer de faux travaux ;
 *  · STYLE INCONNU OU VILLE ABSENTE — la page est introuvable :
 *    l'image de marque, sans une seule lecture de plus.
 */

export const size = TAILLE_PARTAGE;
export const contentType = TYPE_PARTAGE;

/** ⚠️ À LA DEMANDE, PAS À LA CONSTRUCTION — même raison exactement que
    pour l'image d'une fiche : la lecture en base a besoin des cookies,
    qui n'existent pas pendant une préfabrication. Voir le commentaire
    détaillé dans tatoueur/[slug]/opengraph-image.tsx. */
export const dynamic = "force-dynamic";

/** LA HAUTEUR DU BANDEAU DE PHOTOS. Assez pour qu'on voie un tatouage,
    assez peu pour que la phrase garde les deux tiers de l'image. */
const BANDEAU = 232;
/** L'épaisseur du filet rose qui borde et sépare les portfolios. */
const FILET = 3;
/** Combien de portfolios au maximum. Trois : au-delà, chaque photo
    devient une vignette qu'on ne lit plus. */
const PHOTOS_MAX = 3;

export async function generateImageMetadata({
  params,
}: {
  params: { style: string; ville: string };
}) {
  const { style, ville } = await chargerStyleVille(params.style, params.ville);
  const titre =
    style && ville
      ? `${libelleStyle(style)} tattoo artists in ${villeAffichee(ville.nom)}`
      : "";
  return [
    {
      id: "partage",
      size,
      contentType,
      alt: titre
        ? `${titre} — yokofolio`
        : "yokofolio — Your next tattoo starts with a style",
    },
  ];
}

export default async function ImagePartageStyleVille({
  params,
}: {
  params: Promise<{ style: string; ville: string }>;
}) {
  const { style: styleSlug, ville: villeSlug } = await params;
  const logo = await logoDeMarque();
  const commun = { ...size, headers: { "cache-control": CACHE_PARTAGE } };

  const { style, ville, tatoueurs, demonstration } = await chargerStyleVille(
    styleSlug,
    villeSlug
  );

  if (!style || !ville) {
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

  const titre = `${libelleStyle(style)} tattoo artists in ${villeAffichee(ville.nom)}`;

  // UNE PHOTO PAR TATOUEUR, et celle DU STYLE DEMANDÉ : c'est la même
  // règle que les cartes de la mosaïque — montrer ce qu'on est venu
  // voir, jamais autre chose.
  const photos = demonstration
    ? []
    : (
        await Promise.all(
          tatoueurs
            .slice(0, PHOTOS_MAX)
            .map((t) =>
              imageEmbarquee(
                photoChoisie(t, style)?.url ?? t.photo_principale
              )
            )
        )
      ).filter((image): image is string => Boolean(image));

  // AUCUNE PHOTO À MONTRER (mode démonstration, ville sans tatoueur de
  // ce style, portfolios injoignables) : la composition de marque, avec
  // la phrase de la page en titre. Elle est faite pour tenir toute
  // seule — bien mieux qu'un bandeau vide sous un grand trou.
  if (photos.length === 0) {
    return new ImageResponse(
      (
        <CompositionMarque
          logo={logo}
          titre={coupe(titre, 62)}
          sousTitre="Compare tattoo artists' portfolios, by style and city."
          largeurTitre={1010}
        />
      ),
      commun
    );
  }

  const hauteurTexte = TAILLE_PARTAGE.height - BANDEAU;
  /** Les photos se partagent la largeur, filets déduits. */
  const largeurPhoto = Math.floor(
    (TAILLE_PARTAGE.width - FILET * (photos.length - 1)) / photos.length
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: FOND,
          backgroundImage: `radial-gradient(circle at 6% 60%, ${ROSE}33 0%, ${ROSE}00 52%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: hauteurTexte,
            padding: 60,
          }}
        >
          <Signature logo={logo} taille={34} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                width: 76,
                height: 5,
                borderRadius: 999,
                background: ROSE,
                marginBottom: 26,
              }}
            />
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: TEXTE,
                lineHeight: 1.1,
                letterSpacing: -1.5,
                maxWidth: 1000,
              }}
            >
              {coupe(titre, 62)}
            </div>
          </div>
        </div>

        {/* LE BANDEAU — le rose est le FOND, les photos sont posées
            dessus avec 3 px d'écart : c'est ce qui trace le filet du
            haut et les séparations, sans jamais décaler une image
            (une bordure, elle, s'ajoute à la largeur et fait déborder
            la dernière photo hors du cadre). */}
        <div
          style={{
            display: "flex",
            gap: FILET,
            paddingTop: FILET,
            height: BANDEAU,
            background: ROSE,
          }}
        >
          {photos.map((image, rang) => (
            <img
              key={rang}
              src={image}
              alt=""
              width={largeurPhoto}
              height={BANDEAU - FILET}
              style={{
                width: largeurPhoto,
                height: BANDEAU - FILET,
                objectFit: "cover",
              }}
            />
          ))}
        </div>
      </div>
    ),
    commun
  );
}
