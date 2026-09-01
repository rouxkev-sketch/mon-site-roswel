"use client";

/**
 * ██ LES PASTILLES DE BOUT DE LIGNE (passe nº 785) ██
 * ==================================================================
 * Les lignes de la page « Sécurité » se terminent toutes par la même
 * chose : un petit rectangle qui dit un ÉTAT (« actif ») ou qui offre
 * un GESTE (« Délier », « Annuler »). Ils ont la même géométrie, et
 * c'est tout ce qu'ils ont en commun — leurs couleurs disent
 * précisément ce qui les sépare.
 *
 * ⚠️ UNE SEULE ÉCRITURE POUR DEUX FICHIERS (piège nº 378) : `Securite`
 * et `BlocSuppressions` s'en servent tous les deux, et le propriétaire
 * les veut identiques. Tant qu'ils vivaient chacun dans leur coin, ils
 * dérivaient — c'est ce que la nº 784 avait déjà dû rattraper une
 * première fois, dans un seul fichier.
 *
 * LA GÉOMÉTRIE, ET D'OÙ VIENNENT SES CHIFFRES :
 *  · ANGLES DROITS, sur consigne (nº 785). Ils étaient ronds ;
 *  · 38 px de haut, 13 px de texte — LES MESURES DU BOUTON « Annuler
 *    la suppression » d'avant cette passe. Rien n'est inventé : c'est
 *    la référence que le propriétaire a nommée ;
 *  · CE 38 N'EST PAS LIBRE. Les lignes font 54 px de haut ; il reste
 *    donc 8 px au-dessus et 8 en dessous. Les encadrés portent un
 *    `pr-2` (8 px) pour que l'air à DROITE vaille exactement les deux
 *    autres — les trois côtés à l'identique, c'est la consigne. Changer
 *    l'un des deux nombres sans l'autre casse cet accord.
 */
const FORME =
  "shrink-0 inline-flex items-center justify-center " +
  "px-4 min-h-[38px] text-[13px] font-semibold";

/**
 * UN GESTE — « Délier », « Annuler ».
 * ⚠️ LE SURVOL CHANGE LE FOND, PAS LE TEXTE (nº 785) : il faisait
 * l'inverse, et il le faisait en ROUGE — la couleur que ce site
 * réserve à ce qu'on ne peut pas défaire. Annuler une suppression
 * n'est pas un geste dangereux ; le lui peindre était un contresens.
 * Le fond monte d'un cran sur l'échelle des gris (`eleveClair` →
 * `haut`), celui-là même qu'emploie un champ qui prend le focus.
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
      className={`${FORME} bg-sombre-eleve-clair text-sombre-texte
                  transition-colors hover:bg-sombre-haut
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

/**
 * UN ÉTAT — « actif ».
 * ⚠️ CE N'EST PAS UN BOUTON, ET ÇA NE DOIT PLUS Y RESSEMBLER (nº 785) :
 * il portait le gris et le survol de la pastille d'à côté, si bien
 * qu'on pouvait le croire cliquable et attendre qu'il fasse quelque
 * chose. Fond BLANC, texte de la couleur du fond du site : le
 * contraire d'un bouton de cette page, et aucun survol.
 */
export function PastilleEtat({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${FORME} bg-white text-sombre-fond`}>{children}</span>
  );
}
