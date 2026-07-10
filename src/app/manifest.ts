import type { MetadataRoute } from "next";
import { COULEURS, MARQUE } from "@/config/roswel";

/**
 * Le "manifest" est la carte d'identité de l'application :
 * c'est lui qui permet d'installer Roswel sur l'écran d'accueil
 * d'un téléphone, comme une vraie application (PWA).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MARQUE.nom} — ${MARQUE.slogan}`,
    short_name: MARQUE.nom,
    description: MARQUE.description,
    lang: "fr",
    start_url: "/",
    display: "standalone", // plein écran, sans la barre du navigateur
    background_color: COULEURS.fond,
    theme_color: COULEURS.fond,
    // Icônes provisoires en SVG (dessin vectoriel).
    // Quand le vrai logo sera fourni, les remplacer par des PNG :
    // icon-192.png (192x192), icon-512.png (512x512),
    // icon-maskable-512.png (512x512, plein cadre) et
    // apple-touch-icon.png (180x180) dans public/icons/.
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        // Version "maskable" : l'icône remplit tout le carré,
        // le téléphone applique lui-même la forme (rond, arrondi…)
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
