/**
 * ██ nº 796 — CÔTÉ SERVEUR, ON POSE LA SESSION, ON NE L'EFFACE JAMAIS ██
 * ====================================================================
 * ██ LE DÉFAUT, MESURÉ ██ Un onglet laissé ouvert finissait déconnecté.
 * Reproduit au banc en rejouant l'onglet qui dort puis se réveille :
 * QUARANTE tentatives de renouvellement pour UN SEUL jeton, trente-neuf
 * refus du serveur, et SIX ORDRES D'EFFACEMENT DU COOKIE renvoyés par
 * le site lui-même. Après quoi : cookie absent, écran « Se connecter ».
 * Ce n'est pas Supabase qui déconnecte : c'est le site.
 *
 * ██ LA CHAÎNE, LIEN PAR LIEN, TOUTE VÉRIFIABLE DANS LES SOURCES ██
 *  1. LE SERVEUR N'A PAS UN RAFRAÎCHISSEUR, IL EN A AUTANT QUE DE
 *     REQUÊTES. Le proxy tourne une fois par REQUÊTE (pas une fois par
 *     navigation : un réveil d'onglet en émet plusieurs d'un coup — la
 *     page, ses préchargements, ses appels d'API), et chaque route API
 *     fabrique encore le sien. Chacun de ces clients ignore totalement
 *     les autres : aucun ne peut se coordonner avec personne.
 *  2. « Supabase refresh tokens are single-use » — la documentation de
 *     la bibliothèque employée ici le dit mot pour mot
 *     (node_modules/@supabase/ssr/README.md, « Concurrent requests with
 *     the same expired session »). Un seul gagne ; les autres reçoivent
 *     « refresh_token_already_used ».
 *  3. Chez le perdant, auth-js voit un échec non réessayable ET un
 *     jeton d'accès réellement mort : il en conclut « the session is
 *     genuinely dead » et appelle `_removeSession()` (GoTrueClient,
 *     `_callRefreshToken`).
 *  4. `_removeSession` passe par l'adaptateur de cookies, dont
 *     `removeItem` pose `value: ""` + `maxAge: 0` (@supabase/ssr,
 *     cookies.js).
 *  5. L'écrivain de cookies l'envoyait au navigateur. FIN DE LA SESSION.
 *
 * ██ POURQUOI LE PERDANT A TORT, ET C'EST TOUT LE POINT ██
 * Son raisonnement est JUSTE DANS UN NAVIGATEUR, où il n'y a qu'un seul
 * stockage et une seule vérité : si le jeton de reprise est refusé, la
 * session est morte. Ici il est FAUX : le « stockage » d'un client
 * serveur est une PHOTOGRAPHIE des cookies d'UNE requête, prise avant
 * la course. Le perdant relit sa photo, y voit l'ancien jeton, et croit
 * constater un décès alors qu'il constate SA PROPRE DÉFAITE — pendant
 * qu'un autre passage, à la même seconde, a parfaitement renouvelé la
 * session.
 *
 * ██ LA RÈGLE ██ Un écrivain de cookies CÔTÉ SERVEUR pose des cookies ;
 * il n'en efface aucun. Un effacement PUR est ignoré ; tout le reste
 * passe à l'identique.
 *
 * ⚠️ ON NE JETTE PAS LES VIDES D'UNE ÉCRITURE, et la nuance est vitale :
 * quand la session change de taille, l'adaptateur efface les MORCEAUX
 * devenus inutiles DANS LE MÊME LOT que les nouveaux. Jeter ces vides-là
 * laisserait traîner un vieux morceau capable de ressusciter une
 * ancienne session. On ne renonce donc QUE lorsque le lot ENTIER est
 * vide — c'est exactement la signature de `removeItem`, et de rien
 * d'autre.
 * ⚠️ UNE VRAIE DÉCONNEXION N'EST PAS CONCERNÉE : `signOut()` n'existe
 * QUE dans le navigateur (BlocSuppressions, MenuEspace) et efface le
 * cookie depuis là, sans passer par aucun de ces écrivains.
 * ⚠️ CE N'EST PAS UN ÉCRIVAIN QUI DÉSOBÉIT SANS PRÉCÉDENT :
 * `creerClientSupabaseServeur` renonçait déjà, en silence, aux écritures
 * qu'il ne peut pas faire sûrement depuis un composant serveur. Même
 * principe, même raison : n'écrire que ce qu'on est en position de
 * savoir juste.
 * ⚠️ CE QUE ÇA COÛTE, ET IL FAUT LE DIRE : une session RÉELLEMENT morte
 * (jeton révoqué ailleurs) laisse son cookie en place au lieu d'être
 * balayée par le serveur. C'est le NAVIGATEUR qui s'en charge — lui n'a
 * qu'un stockage, sa conclusion est fiable — à sa première tentative de
 * renouvellement.
 */

/** Ce que l'adaptateur de @supabase/ssr passe à `setAll`. */
type CookieAPoser = { name: string; value: string };

/**
 * Vrai quand le lot ENTIER est vide — la signature de `removeItem`, et
 * d'elle seule. Un lot vide (jamais vu en pratique) n'efface rien : il
 * ne doit donc pas compter comme un effacement.
 */
export function estUnEffacementPur(cookiesAPoser: readonly CookieAPoser[]) {
  return (
    cookiesAPoser.length > 0 && cookiesAPoser.every(({ value }) => value === "")
  );
}
