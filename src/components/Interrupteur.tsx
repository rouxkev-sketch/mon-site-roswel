"use client";

/**
 * L'INTERRUPTEUR — un bouton bascule (rail + pastille qui glisse)
 * ================================================================
 * Le MÊME composant pour les deux usages, aux logiques inverses et
 * VOULUES telles quelles (voir FILTRES_TATOUAGE dans la config) :
 *  - la RECHERCHE l'affiche TOUT ALLUMÉ : on éteint ce qu'on ne veut
 *    pas voir ;
 *  - le FORMULAIRE du tatoueur l'affiche TOUT ÉTEINT : il allume ce
 *    qu'il pratique.
 * Allumé : rail ROSE, pastille à droite, libellé en pleine couleur.
 * Éteint : rail gris, pastille à gauche, libellé adouci.
 * `role="switch"` + `aria-checked` : les lecteurs d'écran annoncent
 * « activé / désactivé », pas « coché ».
 */
export function Interrupteur({
  allume,
  surBascule,
  libelle,
}: {
  allume: boolean;
  surBascule: () => void;
  libelle: string;
}) {
  return (
    //  ⚠️ ÉLARGI À LA PASSE Nº 116 (point 13) : la piste s'ALLONGE et
    //  le curseur devient OVALE — un petit rond au centre d'une piste
    //  courte se lisait mal dans les Spécificités. Au DOIGT (sous
    //  640 px) : piste 56×26, curseur 28×20 ; sur le web (dès `sm:`) :
    //  piste 50×22, curseur 24×16. L'ensemble gagne en largeur et en
    //  lisibilité sans devenir disproportionné — la hauteur, elle, ne
    //  bouge pas d'un pixel. L'état ÉTEINT garde ce qui le rend
    //  lisible (piste vide cernée d'un filet, curseur gris à gauche :
    //  « vu, non retenu ») ; allumé : piste rose pleine, curseur
    //  blanc à droite.
    <button
      type="button"
      role="switch"
      aria-checked={allume}
      onClick={surBascule}
      className="flex items-center gap-2.5 min-h-[44px] text-left sm:min-h-[36px]"
    >
      <span
        aria-hidden
        className={`relative inline-block h-[26px] w-[56px] shrink-0 rounded-full
                   transition-colors sm:h-[22px] sm:w-[50px] ${
                     allume
                       ? "bg-primaire"
                       : "bg-sombre-eleve border border-sombre-bordure"
                   }`}
      >
        {/* CENTRÉ PAR CONSTRUCTION : top-1/2 + remontée de moitié —
            aucun arrondi de pixel ne peut plus le décaler du rail.
            OVALE : plus large que haut, aux bouts pleinement ronds. */}
        <span
          className={`absolute left-0 top-1/2 h-[20px] w-[28px] rounded-full
                     transition-[transform,background-color]
                     sm:h-[16px] sm:w-[24px] ${
                       allume
                         ? "translate-x-[25px] -translate-y-1/2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] sm:translate-x-[23px]"
                         : "translate-x-[3px] -translate-y-1/2 bg-sombre-texte-doux"
                     }`}
        />
      </span>
      <span
        className={`text-[15px] leading-tight transition-colors sm:text-[14.5px] ${
          allume ? "text-sombre-texte" : "text-sombre-texte-doux"
        }`}
      >
        {libelle}
      </span>
    </button>
  );
}
