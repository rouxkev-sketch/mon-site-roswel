/**
 * ██ §1 (nº 514) — CE QUI EST SURLIGNÉ EST CE QUI EST COPIÉ ██
 * ==================================================================
 * LE SYMPTÔME (relevé du propriétaire, web) : sur une fiche, il
 * surligne une adresse — la nº 513 le lui a rendu possible — puis il
 * copie, et le presse-papiers reçoit L'ADRESSE GOOGLE MAPS au lieu du
 * texte qu'il voyait en bleu.
 *
 * LA CAUSE, ET ELLE N'EST PAS DANS LE SITE. Il n'y a AUCUN
 * gestionnaire de copie dans le code (les `writeText` du dépôt sont
 * tous des boutons « Copier » explicites, qui ne partent qu'au clic).
 * C'est le NAVIGATEUR : quand une sélection est entièrement contenue
 * dans un lien, WebKit — donc Safari, et Chrome sur iPhone — écrit
 * l'URL du lien dans la variante texte du presse-papiers, à la place
 * du texte. C'est un comportement voulu de sa part, ancien : il
 * suppose que copier un lien entier, c'est vouloir son adresse.
 * ⚠️ CE N'EST PAS UNE RÉGRESSION DE LA nº 513 : ce comportement a
 * toujours été là. Il était seulement invisible, puisqu'on ne pouvait
 * rien surligner dans ces liens avant.
 *
 * LE REMÈDE : DIRE EXPLICITEMENT CE QU'IL FAUT COPIER. Au moment de la
 * copie, on lit la sélection telle que l'œil la voit et on la pose
 * soi-même dans le presse-papiers. Le navigateur n'a plus à deviner.
 *
 * ⚠️ POURQUOI C'EST NEUTRE POUR LES NAVIGATEURS QUI ALLAIENT DÉJÀ
 * BIEN, et c'est ce qui rend ce remède sûr sans avoir à trancher
 * lequel fautait : sur un navigateur qui copiait correctement le
 * texte, on pose EXACTEMENT le texte qu'il allait poser. Rien ne
 * change pour lui. On ne corrige pas un navigateur — on cesse de
 * laisser la question ouverte.
 *
 * ⚠️ SEULE LA VARIANTE TEXTE EST POSÉE, et c'est voulu : coller dans
 * un message, un champ, un traitement de texte rend le texte nu, sans
 * lien caché derrière. C'est ce que le propriétaire demande — « le
 * texte, pas l'URL ».
 *
 * ⚠️ UNE SÉLECTION VIDE NE FAIT RIEN : on laisse alors le navigateur
 * faire son travail ordinaire, on ne vide jamais le presse-papiers.
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, comme `millesime-script` : il est
 * importé par des composants CLIENT, et une seule écriture sert tous
 * les liens qui portent du texte à copier.
 */
import type { ClipboardEvent } from "react";

export function garderLeTexteALaCopie(evenement: ClipboardEvent) {
  const vu = window.getSelection()?.toString() ?? "";
  if (!vu) return;
  evenement.clipboardData.setData("text/plain", vu);
  evenement.preventDefault();
}
