"use client";

/**
 * ██ LES BOUTS DE LIGNE DE LA PAGE « SÉCURITÉ » (nº 785, refait nº 786) ██
 * ==================================================================
 * Les lignes de cette page se terminent par deux choses, et il ne faut
 * surtout pas les confondre :
 *  · un ÉTAT — « Actif ». Ce n'est pas un objet, c'est un constat ;
 *  · un GESTE — « Délier », « Annuler ». Là, on peut appuyer.
 *
 * CE QUE LA nº 786 CHANGE, ET POURQUOI : jusqu'ici les deux avaient la
 * même forme, celle d'un bouton. Un état qui ressemble à un bouton se
 * fait toucher, et ne répond pas. Ils n'ont plus rien en commun.
 *
 * ⚠️ ET À LA nº 803, LE GESTE A PERDU SA PASTILLE : le propriétaire
 * l'a voulu en LIEN TEXTE BLEU, sans fond ni contour ni angles. Le nom
 * `PastilleAction` ment donc désormais ; il est gardé exprès, deux
 * fichiers l'appellent. Voir sa note, plus bas.
 *
 * ⚠️ UNE SEULE ÉCRITURE POUR DEUX FICHIERS (piège nº 378) : `Securite`
 * et `BlocSuppressions` s'en servent tous les deux, et le propriétaire
 * les veut identiques. Tant qu'ils vivaient chacun dans leur coin, ils
 * dérivaient — la nº 784 puis la nº 785 ont dû les rattraper.
 */

/**
 * ██ L'AIR DE RÉFÉRENCE (nº 786) ██
 * ------------------------------------------------------------------
 * LA RÈGLE DU PROPRIÉTAIRE, ET ELLE EST GÉOMÉTRIQUE : l'air qui sépare
 * le bord GAUCHE d'un champ du début de son texte — 16 px, le `px-4`
 * de toutes ces lignes — doit se retrouver À L'IDENTIQUE en haut, en
 * bas et à droite de ce qui termine la ligne.
 * CE QU'ELLE VAUT ENCORE APRÈS LA nº 787, ET CE QU'ELLE A PERDU :
 *  · À DROITE, elle tient toujours — 16 px, sur consigne expresse ;
 *  · EN HAUT ET EN BAS, elle ne peut plus. La pastille est passée à
 *    28 px (voir `HAUTEUR_PASTILLE`), il ne reste donc que 13 px de
 *    part et d'autre dans une ligne de 54. Seul un badge de 22 px
 *    rendait les quatre airs égaux, et le propriétaire l'a jugé trop
 *    petit. Entre les deux, il a choisi la taille.
 * ⚠️ CES NOMBRES SE TIENNENT (54, 28, 16). En changer un seul déplace
 * les autres ; ils vivent ici et nulle part ailleurs.
 *
 * ⚠️ CONSTAT DE LA nº 803, ET IL VAUT POUR LES TROIS CONSTANTES DE CE
 * FICHIER : AUCUNE N'EST IMPORTÉE NULLE PART. Les mesures qu'elles
 * portent sont écrites en dur dans les classes (`min-h-[54px]`,
 * `px-4`…). Elles ne sont donc pas la SOURCE de ces nombres — elles en
 * sont la MÉMOIRE, et le raisonnement qui les a fixés. C'était déjà
 * vrai avant cette passe ; on ne les retire pas, parce que ce
 * raisonnement se perdrait avec elles, et parce que ce n'est pas le
 * sujet d'aujourd'hui. Mais qu'on ne s'y trompe pas : changer un de
 * ces nombres ici ne change RIEN à l'écran.
 */
export const AIR_DE_REFERENCE = 16;
export const HAUTEUR_LIGNE = 54;

/**
 * ██ LA HAUTEUR DE PASTILLE (nº 787) — LE JUSTE MILIEU ██
 * ------------------------------------------------------------------
 * DEUX ESSAIS, DEUX REFUS : 38 px à la nº 785 (« trop grand »), 22 à
 * la nº 786 (« trop petit »). Le propriétaire a demandé le milieu ;
 * 28 px, à deux pixels près, c'est exactement lui.
 * ⚠️ CE QUE ÇA COÛTE, ET IL L'A TRANCHÉ LUI-MÊME : les quatre airs ne
 * peuvent plus être égaux. Vingt-huit dans cinquante-quatre laissent
 * TREIZE au-dessus et en dessous, contre SEIZE à droite — c'est
 * arithmétique, et seul un badge de 22 px les rendait tous égaux. Sa
 * consigne est explicite : « l'air vertical se recalcule, l'air droit
 * reste 16 px ».
 *
 * ⚠️ CETTE HAUTEUR N'A PLUS D'OBJET DEPUIS LA nº 803 : le geste n'est
 * plus une pastille, c'est un lien texte — il n'a plus ni fond ni
 * hauteur propre. Le nombre reste écrit ici comme mémoire des deux
 * essais refusés (38 px « trop grand », 22 px « trop petit ») ; il ne
 * décrit plus rien de visible.
 */
export const HAUTEUR_PASTILLE = 28;

/**
 * ██ LA TAILLE DE TEXTE DES BOUTS DE LIGNE (nº 787) ██
 * ------------------------------------------------------------------
 * UNE SEULE, POUR LES QUATRE : « Actif », « Délier », « Annuler » et
 * « Supprimer ». Elles avaient dérivé sans que personne le décide —
 * 13 px pour deux d'entre elles, 12 pour les deux autres, selon la
 * passe où chacune avait été touchée. Un écart d'un pixel ne se nomme
 * pas, mais il se voit : sur une même colonne, deux mots de rang égal
 * n'avaient pas le même poids.
 * 13 px, c'est la valeur MAJORITAIRE — on ramène les deux qui ont
 * glissé, on ne déplace pas les deux autres.
 * ⚠️ ELLE EST EXPORTÉE parce que `BlocSuppressions` en a besoin pour
 * son bouton « Supprimer », qui n'est pas une pastille (pas de fond) et
 * ne peut donc pas passer par les composants ci-dessous.
 */
export const TEXTE_BOUT_DE_LIGNE = "text-[13px] font-semibold";

/**
 * ██ UN GESTE — « Délier », « Lier », « Annuler » (nº 803) ██
 * ==================================================================
 * ⚠️ CE N'EST PLUS UNE PASTILLE, ET LE NOM MENT DÉSORMAIS. Il est
 * gardé exprès : deux fichiers l'appellent, et renommer une écriture
 * partagée pour un mot est le genre de changement qui coûte plus qu'il
 * ne rapporte. La note vaut mieux que le renommage.
 *
 * CE QUE LE PROPRIÉTAIRE A DÉCIDÉ À LA nº 803, et rien de plus : plus
 * de capsule du tout — ni fond, ni contour, ni angles. LE MOT SEUL, EN
 * BLEU, celui des liens du profil (`sombre-lien`, #7FA9EE, posé à la
 * nº 388). C'est un GESTE qu'on propose, pas un objet qu'on pose.
 *
 * CE QUI NE CHANGE PAS, et c'est ce qui les tient ensemble : la TAILLE
 * et la GRAISSE restent celles des quatre bouts de ligne
 * (`TEXTE_BOUT_DE_LIGNE`, 13 px), et la place reste la même — en fin
 * de ligne, donc à droite, comme « Actif » et « Supprimer ».
 *
 * ⚠️ CE QUI DISPARAÎT AVEC LA CAPSULE : `rounded-md`, `px-3`,
 * `min-h-[28px]` et le fond `sombre-eleve-clair`. Le survol ne peut
 * donc plus changer le fond — il éclaircit le texte, comme TOUS les
 * liens du site (`sombre-lien-clair`).
 * ⚠️ MAIS LA CIBLE DE TOUCHE RESTE PRENABLE AU DOIGT. Treize pixels de
 * haut ne se visent pas avec un pouce. `py-2 -my-2` ajoute huit pixels
 * de zone sensible au-dessus et en dessous, PUIS les reprend en marge
 * négative : la cible fait 36 px — mesurée, pas estimée : 20 px de
 * hauteur de ligne plus les deux fois huit — et la ligne ne bouge pas
 * d'un pixel. Rien ne se voit, tout se touche. (Deux propriétés
 * différentes, padding et marge : aucun conflit de classes, piège
 * nº 389.)
 */
export function PastilleAction({
  children,
  onClick,
  disabled,
  titre,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Ce que le geste fait vraiment, quand le mot seul ne suffit pas
      (« Annuler » n'annule pas n'importe quoi). */
  titre?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      className={`shrink-0 inline-flex items-center justify-center
                  py-2 -my-2 ${TEXTE_BOUT_DE_LIGNE}
                  text-sombre-lien transition-colors hover:text-sombre-lien-clair
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

/**
 * ██ UN ÉTAT — « Actif » (nº 786) ██
 * ------------------------------------------------------------------
 * UN POINT VERT ET UN MOT, rien d'autre : pas de fond, pas d'encadré,
 * rien qui puisse passer pour un bouton. C'est la façon dont les
 * interfaces disent « ça marche » depuis longtemps, et elle a
 * l'avantage de ne rien promettre.
 * CE QU'ELLE REMPLACE : une pastille blanche à coins droits (nº 785),
 * qui avait exactement l'allure du bouton d'à côté. Le propriétaire
 * l'a dit : ce n'est pas un lien d'action, c'est un indicatif.
 * ⚠️ LE POINT N'EST PAS LU À VOIX HAUTE (`aria-hidden`) : il redit ce
 * que le mot dit déjà, et une couleur ne se prononce pas.
 */
export function EtatActif() {
  return (
    <span className={`shrink-0 inline-flex items-center gap-2 ${TEXTE_BOUT_DE_LIGNE} text-sombre-texte`}>
      <span
        aria-hidden
        className="block h-2 w-2 rounded-full bg-sombre-succes"
      />
      Actif
    </span>
  );
}
