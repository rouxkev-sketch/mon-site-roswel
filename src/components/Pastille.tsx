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
 * CE QUE ÇA IMPOSE, ET CE N'EST PAS UN CHOIX : les lignes font 54 px
 * de haut. Seize en haut, seize en bas, il reste VINGT-DEUX pour la
 * pastille. C'est ce nombre-là qui la rend « plus petite », comme
 * demandé — il n'a pas été choisi, il a été déduit.
 * ⚠️ LES TROIS VALEURS SE TIENNENT (54, 22, 16). En changer une seule
 * défait l'accord ; les trois vivent ici et nulle part ailleurs.
 */
export const AIR_DE_REFERENCE = 16;
export const HAUTEUR_LIGNE = 54;
export const HAUTEUR_PASTILLE = HAUTEUR_LIGNE - 2 * AIR_DE_REFERENCE;  //  22

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
      className="shrink-0 inline-flex items-center justify-center rounded-md
                 px-2.5 min-h-[22px] text-[12px] font-semibold
                 bg-sombre-eleve-clair text-sombre-texte
                 transition-colors hover:bg-sombre-haut
                 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <span className="shrink-0 inline-flex items-center gap-2 text-[13px] font-semibold text-sombre-texte">
      <span
        aria-hidden
        className="block h-2 w-2 rounded-full bg-sombre-succes"
      />
      Actif
    </span>
  );
}
