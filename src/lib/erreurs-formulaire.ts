/**
 * LE MANQUE, SANS UN MOT
 * ======================
 * ⚠️ POURQUOI CE FICHIER EXISTE (passe nº 111).
 * Le formulaire disait à voix haute ce que la couleur montrait déjà :
 * « Ton nom (ou celui de ton atelier) est nécessaire. » sous un champ
 * déjà cerclé de rouge, « Ta photo de profil est nécessaire : c'est
 * elle qu'on voit en premier… » sous un encadré déjà rouge. Six
 * phrases pour six manques, toutes redondantes, et qui allongeaient la
 * page à l'instant précis où l'on cherchait à la parcourir.
 *
 * LE SIGNALEMENT VISUEL SUFFIT : encadré rouge sur un champ, titre
 * rouge sur une section. Reste qu'un champ fautif doit RESTER fautif
 * pour le code — c'est ce que porte `MANQUE` : une valeur d'erreur
 * VRAIE (donc rouge partout où l'on teste sa présence) mais MUETTE
 * (aucun texte à afficher).
 *
 * ⚠️ ATTENTION À NE PAS ÉTENDRE CETTE RÈGLE AUX MESSAGES QUI
 * APPRENNENT QUELQUE CHOSE. « Ce lien Instagram n'a pas la bonne forme
 * (ex. https://www.instagram.com/tonatelier/) » n'est pas un manque :
 * c'est une saisie qu'on ne sait pas lire, et là, le rouge seul
 * laisserait quelqu'un buter sans comprendre. Ces phrases-là restent.
 */

/** Une erreur VRAIE mais MUETTE : le champ rougit, rien ne s'écrit. */
export const MANQUE = "manque";

/** Le texte à AFFICHER pour une erreur — rien, si c'est un manque. */
export function texteErreur(valeur?: string | null): string | null {
  return valeur && valeur !== MANQUE ? valeur : null;
}
