import type { MetadataRoute } from "next";
import {
  COULEURS_SOMBRE,
  MARQUE_YOKOFOLIO,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";

/**
 * LA CARTE D'IDENTITÉ DE L'APPLICATION
 * =====================================
 * C'est ce fichier qui donne son nom et son icône au site quand on
 * l'installe sur l'écran d'accueil d'un téléphone.
 *
 * IL Y EN A UN SEUL PAR ADRESSE DE SITE, et c'est celui de YOKOFOLIO —
 * le site à la racine. Il y en avait deux : celui-ci, aux couleurs d'un
 * ancien produit, et un second pour yokofolio. Le premier était servi à
 * toutes les pages qui ne réclamaient pas le second, et il ramenait son
 * icône dans l'onglet. Un seul, désormais.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MARQUE_YOKOFOLIO.nom} — ${MARQUE_YOKOFOLIO.slogan}`,
    short_name: MARQUE_YOKOFOLIO.nom,
    description: TEXTES_TATOUAGE.descriptionSite,
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone", // plein écran, sans la barre du navigateur
    background_color: COULEURS_SOMBRE.fond,
    theme_color: COULEURS_SOMBRE.fond,
    // Le CŒUR de yokofolio, déposé à la main par le propriétaire. Le
    // téléphone lit lui-même les dimensions du fichier.
    icons: [
      { src: MARQUE_YOKOFOLIO.icone, type: "image/png" },
      {
        // Version « maskable » : le téléphone applique lui-même la
        // forme (rond, arrondi…) sur la même image.
        src: MARQUE_YOKOFOLIO.icone,
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
