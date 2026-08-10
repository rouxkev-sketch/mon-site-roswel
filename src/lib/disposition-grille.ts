/**
 * LA DISPOSITION DE LA MOSAÏQUE (smartphone) — deux colonnes ou une
 * ==================================================================
 * Le bouton rond de la barre fixe bascule la grille entre :
 *  - « deux » : deux colonnes façon Instagram (le défaut, toujours) ;
 *  - « une »  : une image par ligne, bord à bord, textes agrandis.
 *
 * LE CHOIX EST MÉMORISÉ d'une visite à l'autre (stockage local du
 * navigateur — aucune donnée personnelle, juste un mot).
 *
 * Seuls les VRAIS MOBILES voient le bouton : sur un ordinateur, la
 * valeur reste « deux » pour toujours.
 */

/**
 * ⚠️ LA VALEUR VIT EN MÉMOIRE, LE STOCKAGE N'EST QU'UNE SAUVEGARDE
 * (passe nº 164 — HUITIÈME passe sur « la mosaïque saute »)
 * ==================================================================
 * CE QUE LA SONDE A MESURÉ CHEZ LE PROPRIÉTAIRE. Un seul clic, et la
 * disposition bascule TROIS fois en 1,4 seconde :
 *
 *     t=0     docH 10224   (une colonne)
 *     t=37    docH  2879   (deux colonnes)   ← le clic
 *     t=609   docH 10224   (une colonne)     ← personne n'a cliqué
 *     t=1377  docH  2879   (deux colonnes)   ← ni là
 *
 * LA CAUSE, ET ELLE EST ICI. `lireDisposition` était le `getSnapshot`
 * de `useSyncExternalStore` : React l'appelle À CHAQUE RENDU, pour
 * CHAQUE abonné — la grille, l'en-tête, et LES SOIXANTE CARTES. Soit
 * des dizaines de lectures de `localStorage` par rendu, et autant
 * d'occasions de se tromper :
 *
 *  · `localStorage` est SYNCHRONE et peut LEVER — Safari le fait par
 *    intermittence (pression mémoire, cloisonnement, quota). Le
 *    `catch` rendait alors « deux » : LE DÉFAUT, c'est-à-dire souvent
 *    l'ANCIENNE valeur. React voyait donc l'instantané changer sans
 *    que personne n'ait cliqué, et repeignait toute la mosaïque dans
 *    l'ancienne disposition. À la lecture suivante, qui réussissait,
 *    il la repeignait dans la nouvelle. D'où le va-et-vient ;
 *  · deux abonnés pouvaient lire deux valeurs DIFFÉRENTES dans la
 *    même image — une carte en deux colonnes sous une grille en une.
 *
 * L'ÉTAT ÉTAIT ÉCRIT À DEUX ENDROITS QUI SE CONTREDISAIENT : la
 * mémoire de React et le stockage du navigateur, ce dernier ayant le
 * dernier mot à chaque lecture.
 *
 * DÉSORMAIS : UNE SEULE SOURCE DE VÉRITÉ, une variable de ce module.
 * `getSnapshot` la rend telle quelle — instantané, stable, insensible
 * à tout aléa du stockage. Le stockage est lu UNE FOIS (à la première
 * demande) et RÉÉCRIT à chaque changement : il sert la visite
 * SUIVANTE, il ne commande plus celle-ci. Un stockage qui refuse ne
 * peut plus faire sauter la mosaïque — au pire, le choix ne survit
 * pas à la fermeture de l'onglet.
 */

const CLE = "yokofolio-disposition-grille";
const EVENEMENT = "yokofolio-disposition-grille-changee";

export type DispositionGrille = "deux" | "une";

/** LA source de vérité. `null` tant que le stockage n'a pas été lu. */
let valeur: DispositionGrille | null = null;

/** La lecture du stockage — UNE SEULE FOIS, et jamais bloquante. */
function depuisLeStockage(): DispositionGrille {
  try {
    return window.localStorage.getItem(CLE) === "une" ? "une" : "deux";
  } catch {
    return "deux"; // stockage refusé : le défaut, sans bruit
  }
}

/** La disposition en cours — « deux » tant que rien n'est mémorisé. */
export function lireDisposition(): DispositionGrille {
  if (valeur === null) valeur = depuisLeStockage();
  return valeur;
}

/** Ce que voit le serveur (et la première peinture) : le défaut. */
export function lireDispositionServeur(): DispositionGrille {
  return "deux";
}

/**
 * POSER LA DISPOSITION VOULUE — et prévenir les abonnés.
 * ⚠️ UNE VALEUR EXPLICITE, PAS UNE INVERSION (nº 164) : « inverser »
 * transforme le moindre appel en double (un clic fantôme d'iOS, un
 * événement rejoué) en aller-retour visible. Demander « je veux DEUX
 * colonnes » est idempotent : deux fois la même demande ne font qu'un
 * seul changement, et rien du tout si l'on y est déjà.
 */
export function poserDisposition(voulue: DispositionGrille) {
  if (lireDisposition() === voulue) return;
  valeur = voulue;
  try {
    window.localStorage.setItem(CLE, voulue);
  } catch {
    // Stockage refusé : la bascule vivra le temps de la page.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Bascule et prévient tous les abonnés (grille, cartes, bouton). */
export function basculerDisposition() {
  poserDisposition(lireDisposition() === "une" ? "deux" : "une");
}

/** Abonnement pour `useSyncExternalStore` (autre onglet compris). */
export function souscrireDisposition(rappel: () => void) {
  //  ⚠️ L'AUTRE ONGLET EST LE SEUL CAS où le stockage a raison contre
  //  la mémoire : on relit ALORS, et alors seulement.
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
