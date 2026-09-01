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
 * UN GESTE — « Délier », « Annuler ».
 * · ANGLES ARRONDIS (nº 786) : ils étaient droits depuis la 785, le
 *   propriétaire les veut adoucis. `rounded-md` — 6 px, l'arrondi le
 *   plus discret de l'échelle, celui qui convient à 22 px de haut ;
 * · LE SURVOL CHANGE LE FOND, PAS LE TEXTE (acquis nº 785, conservé) :
 *   il faisait l'inverse, et en ROUGE — la couleur que ce site réserve
 *   à ce qu'on ne peut pas défaire. Le fond monte d'un cran sur
 *   l'échelle des gris (`eleveClair` → `haut`), celui-là même
 *   qu'emploie un champ qui prend le focus.
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
      className={`shrink-0 inline-flex items-center justify-center rounded-md
                  px-3 min-h-[28px] ${TEXTE_BOUT_DE_LIGNE}
                  bg-sombre-eleve-clair text-sombre-texte
                  transition-colors hover:bg-sombre-haut
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
