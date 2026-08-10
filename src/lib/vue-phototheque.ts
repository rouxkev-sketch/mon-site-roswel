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
 * à part, bâti sur le même modèle.
 *
 * ⚠️ LA VALEUR VIT EN MÉMOIRE, LE STOCKAGE N'EST QU'UNE SAUVEGARDE
 * (nº 164) — le magasin est le JUMEAU de disposition-grille, et il
 * hérite de la même correction : `getSnapshot` ne lit plus
 * `localStorage` à chaque rendu (des dizaines de fois par image, une
 * exception intermittente suffisant à faire rebasculer la mosaïque).
 * Le raisonnement complet est dans lib/disposition-grille.ts.
 */

const CLE = "yokofolio-vue-phototheque";
const EVENEMENT = "yokofolio-vue-phototheque-changee";

/** LA source de vérité. `null` tant que le stockage n'a pas été lu. */
let valeur: boolean | null = null;

/** La lecture du stockage — UNE SEULE FOIS, et jamais bloquante. */
function depuisLeStockage(): boolean {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    return false; // stockage refusé : le défaut, sans bruit
  }
}

/** La vue en cours — éteinte tant que rien n'est mémorisé. */
export function lirePhototheque(): boolean {
  if (valeur === null) valeur = depuisLeStockage();
  return valeur;
}

/** Ce que voit le serveur (et la première peinture) : le défaut. */
export function lirePhototequeServeur(): boolean {
  return false;
}

/**
 * POSER LA VUE VOULUE — explicite, donc idempotente (nº 164) : deux
 * fois la même demande ne font qu'un seul changement.
 */
export function poserPhototheque(voulue: boolean) {
  if (lirePhototheque() === voulue) return;
  valeur = voulue;
  try {
    window.localStorage.setItem(CLE, voulue ? "1" : "0");
  } catch {
    // Stockage refusé : la vue vivra le temps de la page.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Bascule et prévient tous les abonnés (grille, cartes, boutons). */
export function basculerPhototheque() {
  poserPhototheque(!lirePhototheque());
}

export function souscrirePhototheque(rappel: () => void) {
  //  L'autre onglet est le seul cas où le stockage a raison contre la
  //  mémoire : on relit alors, et alors seulement.
  const auStockage = (evenement: StorageEvent) => {
    if (evenement.key !== null && evenement.key !== CLE) return;
    valeur = depuisLeStockage();
    rappel();
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", auStockage);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", auStockage);
  };
}
