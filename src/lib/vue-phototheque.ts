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
 * ⚠️ LE CHOIX VIT DANS L'ADRESSE (nº 203-§1b) — « ?texte=sans », rien
 * pour le défaut (les cartes avec leur texte). Même raisonnement, même
 * mécanique et mêmes conséquences que lib/disposition-grille — le
 * JUMEAU de ce magasin, où tout est expliqué : serveur qui rend le bon
 * affichage du premier coup, remplacement d'adresse sans étape
 * d'historique, relecture au retour, clé de position qui contient le
 * paramètre, et adresse nue = défaut (le contrat des critères).
 */

const EVENEMENT = "yokofolio-vue-phototheque-changee";

/** Le paramètre d'adresse — écrit seulement quand le texte est masqué. */
export const PARAMETRE_TEXTE = "texte";

/** LE FILET DE LA VISITE (nº 212-§3) — le JUMEAU de celui de
    lib/disposition-grille, où tout est expliqué : l'adresse reste la
    source, le stockage de session ne sert qu'à survivre au rendu que
    le routeur restitue depuis son cache au retour. */
const CLE_SESSION = "yokofolio-texte-visite";

function memoriser(voulue: boolean) {
  try {
    sessionStorage.setItem(CLE_SESSION, voulue ? "sans" : "avec");
  } catch {
    // Stockage refusé : la préférence vivra le temps de la page.
  }
}

function memorisee(): boolean | null {
  try {
    const lue = sessionStorage.getItem(CLE_SESSION);
    return lue === "sans" ? true : lue === "avec" ? false : null;
  } catch {
    return null;
  }
}

/** Remettre la vue au pas après une navigation — l'adresse d'abord, la
    préférence de la visite à défaut. */
export function reprendrePhototheque() {
  const dansLAdresse = new URLSearchParams(window.location.search).has(
    PARAMETRE_TEXTE
  );
  if (dansLAdresse) {
    valeur = depuisLAdresse();
    memoriser(valeur);
    window.dispatchEvent(new Event(EVENEMENT));
    return;
  }
  const retenue = memorisee();
  if (!retenue) {
    valeur = false;
    window.dispatchEvent(new Event(EVENEMENT));
    return;
  }
  valeur = false;
  poserPhototheque(true);
}

/** LA source de vérité entre deux relectures de l'adresse. */
let valeur: boolean | null = null;

/** La lecture de l'adresse — la vue éteinte sans paramètre. */
function depuisLAdresse(): boolean {
  try {
    return (
      new URLSearchParams(window.location.search).get(PARAMETRE_TEXTE) ===
      "sans"
    );
  } catch {
    return false;
  }
}

/** Écrit (ou efface) le paramètre — un remplacement, jamais une étape. */
function ecrireDansLAdresse(voulue: boolean) {
  try {
    const parametres = new URLSearchParams(window.location.search);
    if (voulue) parametres.set(PARAMETRE_TEXTE, "sans");
    else parametres.delete(PARAMETRE_TEXTE);
    const requete = parametres.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (requete ? `?${requete}` : "") + window.location.hash
    );
  } catch {
    // Adresse inaccessible : la vue vivra le temps de la page.
  }
}

/** La vue en cours — celle de l'adresse. */
export function lirePhototheque(): boolean {
  if (valeur === null) valeur = depuisLAdresse();
  return valeur;
}

/**
 * POSER LA VUE VOULUE — explicite, donc idempotente (nº 164) : deux
 * fois la même demande ne font qu'un seul changement.
 */
export function poserPhototheque(voulue: boolean) {
  if (lirePhototheque() === voulue) return;
  valeur = voulue;
  ecrireDansLAdresse(voulue);
  memoriser(voulue);
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Bascule et prévient tous les abonnés (grille, cartes, boutons). */
export function basculerPhototheque() {
  poserPhototheque(!lirePhototheque());
}

/** Abonnement — le RETOUR (popstate) est le seul moment où l'adresse a
    raison contre la mémoire : on relit alors, et alors seulement. */
export function souscrirePhototheque(rappel: () => void) {
  const auRetour = () => {
    valeur = depuisLAdresse();
    rappel();
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("popstate", auRetour);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("popstate", auRetour);
  };
}
