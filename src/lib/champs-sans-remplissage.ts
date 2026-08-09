/**
 * NEUTRALISER LE REMPLISSAGE AUTOMATIQUE — DEUXIÈME VERSION
 * ==========================================================
 * SYMPTÔME : en tapant une adresse (et dans d'autres champs du
 * formulaire), un menu de CONTACTS PERSONNELS du navigateur se pose
 * par-dessus nos suggestions, avec une petite silhouette dans le coin
 * du champ.
 *
 * ⚠️ POURQUOI LA PREMIÈRE VERSION N'A PAS SUFFI — trois raisons, et
 * la première est de notre fait :
 *
 *  1. LE `name` QU'ON POSAIT NOURRISSAIT LA DEVINETTE qu'il devait
 *     déjouer. Il valait `champ-libre-<identifiant>`, donc
 *     « champ-libre-fiche-NOM », « champ-libre-studio-NOM-… »,
 *     « champ-libre-…-ADRESSE ». Or c'est exactement sur ces mots-là
 *     que Chrome et Safari reconnaissent un champ de carnet
 *     d'adresses — heuristiques FRANÇAISES comprises (nom, prénom,
 *     adresse, ville, code postal, téléphone). On leur tendait la
 *     perche.
 *
 *  2. `autocomplete="off"` EST DÉLIBÉRÉMENT IGNORÉ. Safari ne
 *     l'honore pas pour le remplissage de contacts, et Chrome ne
 *     l'honore pas pour les profils d'adresse : les deux considèrent
 *     que trop de sites l'ont posé à tort, au détriment de leurs
 *     utilisateurs. Ce n'est pas un bogue, c'est une décision
 *     assumée de leur part. En revanche, une valeur qu'ils ne
 *     RECONNAISSENT PAS ne déclenche pas ce contournement : le champ
 *     n'est alors rattaché à aucun type de donnée connue. C'est ce
 *     qu'on fait ici.
 *
 *  3. LA SILHOUETTE DANS LE CHAMP N'EST PAS DU HTML. WebKit la
 *     dessine lui-même (`::-webkit-contacts-auto-fill-button`) :
 *     aucun attribut ne la retire, seul du CSS le peut. Il vit dans
 *     src/app/globals.css, accroché à `[data-sans-remplissage]`.
 *
 * CE QUE CETTE VERSION POSE :
 *  · `autocomplete` sur une valeur NON STANDARD (voir ci-dessus) ;
 *  · un `name` OPAQUE, sans un seul mot de dictionnaire ;
 *  · `autocorrect` / `autocapitalize` / `spellCheck` — iOS, qui
 *    corrige et met des majuscules dans un nom propre ;
 *  · les marqueurs des gestionnaires de mots de passe (1Password,
 *    LastPass, Bitwarden, Dashlane) ;
 *  · `data-sans-remplissage`, la prise du CSS.
 *
 * ⚠️ CE MODULE NE VA PAS SUR LES CHAMPS OÙ LE REMPLISSAGE REND
 * SERVICE : l'adresse e-mail et le mot de passe d'une connexion, le
 * formulaire de contact. Y couper l'autocomplétion serait une gêne,
 * pas une correction.
 *
 * À étaler sur tout champ de saisie libre :
 *     <input {...sansRemplissageAuto("un-identifiant")} … />
 */

/**
 * UNE VALEUR D'AUTOCOMPLÉTION QUE PERSONNE NE CONNAÎT.
 * Ni « off » (ignoré exprès), ni un jeton valide (« name »,
 * « street-address »…) : une chaîne inconnue, que le modèle de
 * traitement du HTML ramène à « aucun type de donnée » — donc rien à
 * proposer. Elle est FIXE : une valeur qui changerait à chaque rendu
 * ferait repartir la devinette de zéro à chaque frappe.
 */
const JETON_INCONNU = "hors-carnet";

/**
 * UN NOM OPAQUE, STABLE, SANS MOT RECONNAISSABLE.
 * Un condensé court de la clé logique — « fiche-nom » devient
 * « q1f8b3d2 ». Stable d'un rendu à l'autre (le navigateur n'y voit
 * pas un nouveau champ à chaque frappe), et illisible pour une
 * heuristique : c'est tout ce qu'on lui demande.
 */
function nomOpaque(cle: string): string {
  let condense = 0x811c9dc5;
  for (let rang = 0; rang < cle.length; rang++) {
    condense ^= cle.charCodeAt(rang);
    condense = Math.imul(condense, 0x01000193) >>> 0;
  }
  // Une lettre en tête : un `name` ne commence jamais par un chiffre.
  return `q${condense.toString(36)}`;
}

/** Les attributs communs, sans le `name` (voir `sansRemplissageAuto`). */
export const SANS_REMPLISSAGE_AUTO = {
  autoComplete: JETON_INCONNU,
  autoCorrect: "off",
  autoCapitalize: "none",
  spellCheck: false,
  // Les gestionnaires de mots de passe, chacun avec sa clé à lui.
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  // LA PRISE DU CSS — c'est elle qui retire la silhouette de WebKit.
  "data-sans-remplissage": "",
} as const;

/**
 * LE JEU COMPLET, `name` opaque compris. La clé passée sert à
 * fabriquer ce nom : elle doit être unique dans la page, mais elle
 * n'apparaît jamais telle quelle dans le document.
 */
export function sansRemplissageAuto(cle: string) {
  return { ...SANS_REMPLISSAGE_AUTO, name: nomOpaque(cle) };
}
