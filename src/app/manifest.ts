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
 *
 * ██ §5 (nº 791) — IL RESTE, ET VOICI EXACTEMENT CE QU'IL FAIT ENCORE ██
 * ------------------------------------------------------------------
 * Le service worker est parti (enquête nº 738), et l'on pourrait croire
 * que ce fichier part avec : il n'en est rien. Ce ne sont PAS les mêmes
 * choses.
 *  · CE QUI RESTE VRAI, et c'est tout ce que ce fichier a jamais fait :
 *    quand on ajoute le site à l'écran d'accueil, c'est lui qui donne
 *    le NOM, l'ICÔNE, la couleur du fond, et l'ouverture SANS la barre
 *    du navigateur (`standalone`). Rien de cela n'a jamais demandé un
 *    programme d'arrière-plan — sur iPhone, « Sur l'écran d'accueil »
 *    n'en a jamais eu besoin, et Chrome ne l'exige plus.
 *  · CE QUI N'EST PLUS VRAI : le site n'est plus consultable HORS
 *    LIGNE. C'était le service worker, et lui seul. Une visite sans
 *    réseau montre désormais la page d'erreur du navigateur — celle
 *    qu'il montre pour tout autre site. La page `offline.html` qui la
 *    remplaçait est supprimée : plus personne ne pouvait la servir.
 * ⚠️ LES ICÔNES SONT CELLES DU PROPRIÉTAIRE, déposées à la main : le
 * code n'en fabrique aucune variante (règle nº 356).
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
