/**
 * ██ « PAS DE PHOTO EN HAUT » — §3 (nº 295) ██
 * ==================================================================
 * LE COMPORTEMENT VOULU, AU DOIGT :
 *  · une fiche ouverte DEPUIS UNE CARTE → la photo du carrousel en
 *    haut, comme toujours ;
 *  · une fiche ouverte DEPUIS UN LIEN INTERNE À UNE AUTRE FICHE
 *    (équipe, guest, salon, studio, adresse) → AUCUNE photo en haut,
 *    la page commence par Profil / Portfolio.
 *
 * ⚠️ POURQUOI CE MODULE EXISTE, ET POURQUOI LES DEUX ESSAIS
 * PRÉCÉDENTS ONT ÉCHOUÉ. Les nº 293 et 294 ont traité la chose comme
 * un problème de « QUEL carrousel choisir » — en repêchant un groupe
 * garni, puis en cessant de le repêcher. Ce n'en est pas un : sur ce
 * chemin d'arrivée, il n'y a AUCUN carrousel à montrer, quel que soit
 * le contenu de la fiche. La page ne peut pas le deviner : rien, dans
 * la fiche d'arrivée, ne dit d'où l'on vient.
 *
 * C'EST DONC LE LIEN QUI PORTE LA CONSIGNE, et la page OBÉIT. Aucun
 * repli, aucune déduction, aucune devinette.
 *
 * ⚠️ ET LA CONSIGNE NE VOYAGE PAS DANS L'ADRESSE. Si elle y était, un
 * lien partagé sur WhatsApp l'emporterait chez un visiteur qui, lui,
 * arrive de l'extérieur et doit voir la photo. Elle vit donc dans le
 * `sessionStorage` — propre à l'onglet, jamais copiable, jamais
 * indexable —, elle nomme le chemin exact qu'elle vise, et elle SE
 * CONSOMME À LA PREMIÈRE LECTURE : rouvrir ou recharger la même
 * adresse rend la photo.
 */

const CLE = "yokofolio:fiche-sans-photo";

/**
 * L'ATTRIBUT POSÉ SUR LA RACINE — il double la consigne pour l'œil.
 * Le clic le pose AVANT que la navigation ne rende la page d'arrivée :
 * la règle de style qui masque la photo (globals.css) s'applique donc
 * dès le premier pixel, sans le clignotement d'une photo qui
 * s'afficherait puis disparaîtrait.
 */
const ATTRIBUT = "data-fiche-sans-photo";

/** LE LIEN DÉPOSE LA CONSIGNE, juste avant de laisser la navigation
    se faire. `chemin` : « /tatoueur/<slug> », la cible exacte. */
export function poserArriveeSansPhoto(chemin: string): void {
  try {
    window.sessionStorage.setItem(CLE, chemin);
  } catch {
    //  Navigation privée, stockage refusé : on n'insiste pas — la
    //  fiche s'ouvrira avec sa photo, ce qui n'a jamais cassé personne.
  }
  document.documentElement.setAttribute(ATTRIBUT, "");
}

/**
 * LA PAGE D'ARRIVÉE LIT, UNE SEULE FOIS. Vrai si la consigne visait
 * CE chemin-ci. Dans tous les cas la consigne est effacée, et
 * l'attribut retiré quand elle ne s'appliquait pas — sans quoi il
 * suivrait le visiteur de fiche en fiche.
 */
export function consommerArriveeSansPhoto(chemin: string): boolean {
  let vise: string | null = null;
  try {
    vise = window.sessionStorage.getItem(CLE);
    window.sessionStorage.removeItem(CLE);
  } catch {
    vise = null;
  }
  const pourNous = vise === chemin;
  if (!pourNous) document.documentElement.removeAttribute(ATTRIBUT);
  return pourNous;
}

/** À la sortie de la fiche : la consigne ne survit pas à son écran. */
export function oublierArriveeSansPhoto(): void {
  document.documentElement.removeAttribute(ATTRIBUT);
}
