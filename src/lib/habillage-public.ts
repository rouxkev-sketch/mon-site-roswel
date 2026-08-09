/**
 * QUI PORTE L'HABILLAGE CLAIR DU PRODUIT ARTISANS ?
 * =================================================
 * L'en-tête blanc, le pied de page complet et le bandeau cookies
 * vivent dans la mise en page racine : ils s'appliqueraient donc à
 * TOUTES les pages. Ce fichier dit lesquelles n'en veulent pas.
 *
 * UNE SEULE LISTE, DEUX LECTEURS :
 *  - src/app/layout.tsx la lit CÔTÉ SERVEUR (grâce à l'en-tête posé
 *    par le proxy) et n'affiche alors même pas l'habillage ;
 *  - src/components/CadreSitePublic.tsx la relit CÔTÉ NAVIGATEUR, en
 *    filet de sécurité : si l'en-tête venait à manquer, l'habillage
 *    resterait masqué.
 *
 * Pourquoi les deux ? Parce que masquer au navigateur ne suffit pas :
 * le serveur avait beau ne rien AFFICHER, il RENDAIT quand même
 * l'en-tête des artisans — et le navigateur allait chercher le logo
 * Roswel sur chaque page de yokofolio. Décider côté serveur supprime
 * ce reste pour de bon.
 */

export const ADRESSES_SANS_HABILLAGE_CLAIR = [
  // Les outils de travail, avec leur en-tête minimal.
  "/admin",
  // YOKOFOLIO et tout ce qui en dépend : fond sombre, barre qui porte
  // le moteur, pied de page réduit (voir src/app/(tatouage)/layout.tsx).
  // « /tatoueurs » est couvert par le préfixe « /tatoueur » ;
  // « /devenir-tatoueur » ne l'est pas (il ne COMMENCE pas par
  // « /tatoueur »), d'où sa ligne à lui.
  "/tatoueur",
  "/tatouage",
  "/devenir-tatoueur",
  "/qui-sommes-nous",
  "/mentions-legales",
  // Le CONTACT de yokofolio (celui des artisans vit désormais sous
  // /artisans/contact, qui garde l'habillage clair).
  "/contact",
  // Le SITE VITRINE de l'agence : barre fixe sans délimitation et pied
  // de page gris clair, posés par src/app/(agence)/layout.tsx.
  "/agence",
  "/rendez-vous",
];

/** Faux pour l'accueil (le site vitrine) et les adresses ci-dessus. */
export function habillageClairVisible(chemin: string | null | undefined): boolean {
  if (!chemin) return true; // adresse inconnue : on n'enlève rien
  if (chemin === "/") return false;
  return !ADRESSES_SANS_HABILLAGE_CLAIR.some((debut) => chemin.startsWith(debut));
}

/** L'en-tête posé par le proxy et relu par la mise en page racine. */
export const ENTETE_CHEMIN = "x-chemin";
