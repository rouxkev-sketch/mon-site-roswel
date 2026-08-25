/**
 * ██ LE MILLÉSIME DU SCRIPT — UNE CONSTANTE, PLUS UNE LECTURE ██
 * ==================================================================
 * (§B nº 347 pour le millésime lui-même ; §1 nº 495 pour ce fichier.)
 *
 * POURQUOI CE FICHIER EXISTE, ET C'EST TOUT LE POINT DE LA PASSE.
 * Le millésime était écrit à UN endroit — dans le texte du script
 * d'avant peinture — et RELU sur `<html>` par l'enregistrement du
 * service worker (`document.documentElement.dataset.versionScript`).
 * Cette relecture est une bombe à retardement : elle suppose que le
 * script a DÉJÀ tourné au moment où l'effet React s'exécute. Sur une
 * page STREAMÉE, c'est faux — l'effet peut lire `<html>` avant que
 * l'analyseur n'ait atteint le script, qui vit plus bas dans le
 * document. La lecture rend alors `undefined`, le repli `"0"` entre
 * dans l'ADRESSE du service worker, et le navigateur croit à un
 * programme neuf : il réinstalle, purge tous les caches, prend la
 * main, et la page se recharge. Au chargement suivant le millésime est
 * lisible, l'adresse redevient celle d'avant — et tout recommence.
 *
 * LA RÈGLE, DÉSORMAIS : le millésime est une CONSTANTE DE COMPILATION.
 * Le script l'écrit, le service worker la lit ICI. Les deux ne peuvent
 * plus se contredire, et plus rien ne dépend de l'ordre d'arrivée des
 * morceaux du document.
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, et c'est délibéré : il est importé
 * par un composant CLIENT (l'enregistrement du service worker) autant
 * que par le script du serveur. Une seule constante, aucun import —
 * la leçon de `lignes-profil.ts`.
 *
 * ⚠️ À INCRÉMENTER À CHAQUE PASSE qui modifie le script d'avant
 * peinture. C'est ici, et nulle part ailleurs, que le numéro s'écrit.
 */
export const MILLESIME_SCRIPT = "566";
