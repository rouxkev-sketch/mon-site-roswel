/**
 * ON NE POSE UNE POSITION QUE SUR DU CONTENU
 * ==================================================================
 * §1 (nº 337) — L'ÉCRITURE UNIQUE DE L'ATTENTE.
 *
 * CE QUE LE PROPRIÉTAIRE VOYAIT, ET IL AVAIT LE DIAGNOSTIC JUSTE.
 * « En haut de l'accueil, je reviens : rien à signaler. Après avoir
 * descendu la page, je reviens : écran de la couleur du fond, sans rien
 * dessus, puis la page arrive. » Le défaut n'apparaît QUE s'il y a une
 * position à restituer — et c'est notre propre mécanisme qu'on voit.
 *
 * MESURÉ, RÉSEAU RALENTI (4G lente) ET PROCESSEUR BRIDÉ (×6), AU
 * RETOUR SUR UN DOCUMENT NEUF DEPUIS 900 px :
 *
 *     +0 ms     écran vide · y=0   · document 844   ← rien n'est arrivé
 *     +2436 ms  écran vide · y=900 · document 1744  ← NOTRE RÉSERVE, NUE
 *     +2601 ms  12 éléments · y=900 · document 3523
 *
 * 1744 = 900 + 844 : c'est EXACTEMENT `position + innerHeight`, la
 * réserve de hauteur que nous posions nous-mêmes. Nous rendions le
 * document grand et VIDE, nous nous posions à 900, et à 900 il n'y avait
 * encore rien à peindre. L'écran vide qu'il voit, c'est notre réserve.
 *
 * LA RÈGLE, MAINTENANT :
 *
 *      UNE POSITION NE SE POSE QUE QUAND IL Y A QUELQUE CHOSE À
 *      PEINDRE À CETTE POSITION.
 *
 * C'est la PREMIÈRE des deux directions que le propriétaire proposait.
 * POURQUOI CELLE-LÀ ET PAS L'AUTRE (« ne pas jeter le contenu déjà
 * peint ») : garder le contenu peint d'un document à l'autre n'est PAS
 * à la portée d'une page — c'est le navigateur qui décide de conserver
 * ou non son image (bfcache, maintien de peinture), et aucune ligne
 * d'ici ne le lui commande. La première direction, elle, est
 * entièrement de notre côté : c'est nous qui posions la position trop
 * tôt, c'est nous qui cessons de le faire.
 *
 * COMMENT ON ATTEND, SANS QUE RIEN NE BOUGE À L'ÉCRAN :
 *  · on regarde la hauteur RÉELLE du corps, image par image ;
 *  · dès qu'elle atteint la position visée, on pose la réserve ET le
 *    défilement DANS LA MÊME IMAGE — un rappel d'animation s'exécute
 *    AVANT la peinture, donc l'image où le contenu arrive est déjà
 *    celle qui est à la bonne place. Aucune image intermédiaire,
 *    aucun mouvement visible (exigence nº 334, et borne nº 3 de la
 *    nº 337) ;
 *  · pendant l'attente, le document est MASQUÉ : sans cela on verrait
 *    le HAUT de la page défiler pendant qu'elle se remplit — ce que le
 *    propriétaire interdit explicitement. Le fond du site reste peint
 *    (il vient du canevas, que la visibilité ne concerne pas).
 *
 * ⚠️ ON N'ATTEND PAS ÉTERNELLEMENT. Passé le délai, on pose quand même
 * et l'on démasque : mieux vaut une page à peu près placée qu'un écran
 * qui ne revient jamais.
 *
 * ⚠️ ON NE GARDE RIEN EN MÉMOIRE. Aucune page, aucune liste, aucune
 * copie — zéro (borne nº 2 de la nº 337). Ce module n'a pas d'état
 * persistant : il regarde une hauteur et rend la main.
 *
 * ⚠️ ET QUAND LE CONTENU EST DÉJÀ LÀ — le dégel d'une surface, une
 * navigation de client où React n'a rien démonté — la toute première
 * mesure suffit : on pose immédiatement, rien n'est retardé d'une
 * image.
 */

/**
 * La marque de l'attente, sur `<html>`. Le document est masqué tant
 * qu'elle est là.
 * §1 (nº 339) — ELLE PORTE L'INSTANT OÙ ELLE A ÉTÉ POSÉE, pas « 1 ».
 * Le masque peut être posé par le script d'avant peinture, donc AVANT
 * que React n'existe : sans cet horodatage, la sonde du retour, qui
 * monte plus tard, n'aurait aucun moyen de savoir depuis quand l'écran
 * est masqué. Elle a besoin de trancher entre « le navigateur refait la
 * page » et « c'est notre propre masque » — et c'est la question du
 * propriétaire, mot pour mot. Aucun comportement ne change : la marque
 * sert de drapeau, sa valeur n'a jamais été lue par le code.
 */
export const MARQUE_ATTENTE = "placeEnAttente";

/** Au-delà, on pose quand même : le contenu ne viendra plus. */
export const ATTENTE_MAX_MS = 2500;

/**
 * LA CONDITION, ÉCRITE UNE FOIS.
 * « Y a-t-il quelque chose à voir à cette position ? » — oui dès que le
 * contenu réel descend au moins jusqu'au HAUT de l'écran visé. On ne
 * demande pas l'écran entier : le bas d'une liste est légitimement plus
 * court que l'écran, et l'exiger ferait attendre pour rien.
 *
 * ⚠️ LA HAUTEUR DU CORPS, PAS CELLE DU DOCUMENT : c'est la seule que
 * notre réserve (`min-height` sur `<html>`) n'atteint pas. Mesurer le
 * document reviendrait à se demander à soi-même si l'on est prêt.
 */
export function contenuAtteint(position: number): boolean {
  return document.body.getBoundingClientRect().height >= position;
}

/**
 * LE MÊME TEXTE, POUR LE SCRIPT D'AVANT PEINTURE.
 * Il s'exécute avant tout module : il ne peut pas appeler ce qui
 * précède. Il ne doit pas non plus en garder une copie à la main — la
 * leçon des passes nº 328 à 334. On lui rend donc la boucle TOUTE
 * FAITE, construite à partir des mêmes constantes.
 *
 * `poser` est le texte de ce qu'il faut faire quand le contenu est là ;
 * `position` le nom de la variable qui porte la position visée.
 */
export function boucleDAttentePourLeScript(
  position: string,
  poser: string
): string {
  return `(function(){
var fin=Date.now()+${ATTENTE_MAX_MS};
var essayer=function(){
if(document.body&&document.body.getBoundingClientRect().height>=${position}||Date.now()>fin){${poser};r.style.visibility="";delete r.dataset[${JSON.stringify(MARQUE_ATTENTE)}];return}
requestAnimationFrame(essayer)};
r.dataset[${JSON.stringify(MARQUE_ATTENTE)}]=String(Date.now());r.style.visibility="hidden";
requestAnimationFrame(essayer)})()`;
}
