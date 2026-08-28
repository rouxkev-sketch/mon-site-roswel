/**
 * ██ §3 (nº 712) — LES DEUX CONSTANTES DE LA BOÎTE NOIRE, AU NEUTRE ██
 * ==================================================================
 * POURQUOI CE FICHIER EXISTE, ET IL RÉPARE UN DÉFAUT MUET DEPUIS LA
 * nº 654.
 *
 * CE QUI SE PASSAIT, TROUVÉ EN INVENTORIANT LES SONDES (nº 712) : le
 * script d'avant peinture est fabriqué par du code SERVEUR, et il
 * lisait ses deux constantes dans `lib/boite-noire` — un module
 * « use client ». Next ne fait pas traverser cette frontière : il
 * remplace ces exports par des bouchons. Le script produit portait
 * donc, NOIR SUR BLANC dans le HTML servi :
 *
 *     sessionStorage.getItem(undefined)
 *     if(li.length > function(){ throw Error("Attempted to call
 *       LIGNES_BOITE_NOIRE() from the server ...") })
 *
 * CONSÉQUENCE, MESURÉE : le script écrivait sa trace sous la clé
 * littérale « undefined », pas sous celle de la boîte noire — et la
 * comparaison de longueur, faite contre une fonction, valait toujours
 * faux, donc la liste n'était jamais taillée. Les lignes du script —
 * l'arrivée, le filet de repli, la pose de position AVANT LA PREMIÈRE
 * PEINTURE — n'ont JAMAIS paru dans le panneau de la boîte noire. Ce
 * sont précisément celles qui manquaient aux enquêtes des nº 654-673.
 *
 * LE REMÈDE, ET IL EST MINUSCULE : les deux constantes descendent ICI,
 * dans un fichier SANS « use client » — donc lisible des deux côtés.
 * `lib/boite-noire` les réexporte, si bien qu'aucun appelant ne change
 * (écriture unique, piège nº 378 : il n'y a toujours qu'UNE définition).
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, et c'est la condition pour qu'il
 * serve les deux mondes — la leçon de `millesime-script.ts`.
 */

/** La clé de rangement de la trace, dans la mémoire de l'onglet. */
export const CLE_BOITE_NOIRE = "roswel:boite-noire";

/**
 * Le nombre de lignes gardées.
 * §1 (nº 660) — CINQUANTE NE SUFFISENT PLUS : depuis cette passe, TOUT
 * ce qui déplace la page se signe — les poses, la garde de position et
 * ses recalages, la décision de restitution, les notes lues, le script
 * d'avant peinture, et l'observateur des déplacements constatés. Une
 * seule navigation peut en écrire une vingtaine ; à cinquante, le début
 * du trajet — le clic — sortait de la boîte avant que le propriétaire
 * ne la consulte, et c'est justement lui qu'il faut voir.
 * DEUX CENTS : de quoi tenir plusieurs navigations complètes. Le coût
 * reste celui d'une lecture et d'une écriture de `sessionStorage` par
 * ÉVÉNEMENT, jamais par image — la règle de la nº 654 ne bouge pas.
 */
export const LIGNES_BOITE_NOIRE = 200;
