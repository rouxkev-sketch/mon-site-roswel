/**
 * TYPE DE COMPTE — indépendant / société
 * --------------------------------------
 * Seul signal visuel conservé : la FORME de la photo.
 *  - INDÉPENDANT → photo de visage en CERCLE ROND (une personne) ;
 *    on affiche « Prénom Nom » en gros, rien en dessous ;
 *  - SOCIÉTÉ → logo / photo en CARRÉ AUX ANGLES ARRONDIS (une
 *    entreprise) ; on affiche le nom de la société en gros, rien en
 *    dessous.
 * Plus aucune ligne secondaire (ni société sous le nom, ni
 * « Dirigée par … »).
 */

/** Vrai pour une société (photo carrée arrondie). */
export function estSociete(a: { type_compte: string }): boolean {
  return a.type_compte === "societe";
}
