/**
 * LA VUE PHOTOTHÈQUE (passe nº 140) — les images pures
 * =====================================================
 * Une seconde façon de regarder la mosaïque : TOUT est masqué — badge,
 * portrait, nom, adresse — il ne reste que les photos, et le cœur des
 * favoris dans l'angle. C'est voulu et assumé : qui a déjà filtré par
 * style et par ville cherche des IMAGES, pas des identités.
 *
 * ⚠️ ELLE EST INDÉPENDANTE DE LA DISPOSITION (deux colonnes / une) :
 * les deux réglages se combinent librement — c'est pour cela qu'elle
 * n'est pas un troisième état de disposition-grille, mais un magasin
 * à part, bâti sur le même modèle (stockage local, un événement,
 * `useSyncExternalStore` côté composants ; le serveur rend toujours
 * « éteinte »).
 */

const CLE = "yokofolio-vue-phototheque";
const EVENEMENT = "yokofolio-vue-phototheque-changee";

/** La vue en cours — éteinte tant que rien n'est mémorisé. */
export function lirePhototheque(): boolean {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    return false; // stockage refusé : le défaut, sans bruit
  }
}

/** Ce que voit le serveur (et la première peinture) : le défaut. */
export function lirePhototequeServeur(): boolean {
  return false;
}

/** Bascule et prévient tous les abonnés (grille, cartes, boutons). */
export function basculerPhototheque() {
  try {
    window.localStorage.setItem(CLE, lirePhototheque() ? "0" : "1");
  } catch {
    // Stockage refusé : la vue reste au défaut, sans bruit — le même
    // compromis que la disposition de la grille, dont ce magasin est
    // le jumeau.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

export function souscrirePhototheque(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}
