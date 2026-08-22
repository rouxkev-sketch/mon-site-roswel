"use client";

import { createPortal } from "react-dom";
import { IconeCroix } from "@/components/Icones";

/**
 * L'EN-TÊTE DE PAGE PLEIN ÉCRAN, ET LA PAGE QUI LE PORTE (nº 465)
 * ==================================================================
 * ⚠️ POURQUOI CE FICHIER EXISTE. Au doigt, « Mon compte »,
 * « Notifications » et « Langue » quittent leurs fenêtres superposées
 * pour adopter LA MÊME APPARENCE que la page de recherche du
 * smartphone : le titre en haut précédé de son icône, la croix de
 * fermeture à l'opposé, même gabarit, mêmes marges, mêmes tailles de
 * texte. La consigne du propriétaire est de RÉUTILISER l'en-tête de la
 * page de recherche, pas d'en écrire un second : il est donc EXTRAIT
 * ici, au caractère près, et `PageRechercheMobile` le consomme — une
 * seule écriture, quatre porteurs.
 *
 * CE QUE L'EN-TÊTE PORTE, ET D'OÙ ÇA VIENT (rien n'est inventé) :
 *  · le bloc est COLLANT (`sticky top-0`), fond opaque, 24 px en haut
 *    sous l'encoche (`pt-[max(24px,env(safe-area-inset-top))]`,
 *    nº 149-§5) et `px-4 pb-1` — le gabarit exact de la recherche ;
 *  · le TITRE : 20 px, gras, BLANC, précédé de son icône au rang 22
 *    avec 10 px d'écart (`gap-2.5`) — nº 149-§1 ;
 *  · la CROIX NUE à droite : glyphe 22 (le rang de l'icône du titre,
 *    nº 401), zone tactile de 44 px (`h-11 w-11`), `-mr-2` pour que le
 *    dessin s'aligne sur la marge — nº 141-2A.
 *
 * `marqueRecherche` : SEULE la page de recherche pose
 * `data-entete-recherche` — le marqueur que globals.css libère du
 * collage pendant la remontée d'un champ (`data-clavier`, nº 180-§1).
 * Les trois autres écrans n'ont aucun champ qui remonte : ils ne le
 * portent pas.
 */
export function EnTetePleinEcran({
  icone,
  titre,
  surFermer,
  ariaLabelFermer = "Fermer",
  actions,
  marqueRecherche = false,
  children,
}: {
  /** L'icône du titre — au rang 22, en blanc (celui de la loupe). */
  icone: React.ReactNode;
  titre: string;
  /** La croix : on referme sans rien appliquer. */
  surFermer: () => void;
  ariaLabelFermer?: string;
  /** Un geste de plus à GAUCHE de la croix (la double coche des
      notifications) — rien pour les autres porteurs. */
  actions?: React.ReactNode;
  marqueRecherche?: boolean;
  /** Ce qui vit SOUS la ligne du titre, dans le bloc collant (la
      bascule Réalisation | Flash de la recherche). */
  children?: React.ReactNode;
}) {
  return (
    <div
      {...(marqueRecherche ? { "data-entete-recherche": "" } : {})}
      className="sticky top-0 z-10 bg-sombre-fond px-4 pb-1
                 pt-[max(24px,env(safe-area-inset-top))]"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2.5 text-[20px] font-bold text-white">
          {icone}
          {titre}
        </h1>
        {/*  Les gestes de droite. Le `-mr-2` de la croix opère à
             travers cette boîte (débord visible) : sa position est
             celle d'avant l'extraction, au pixel. */}
        <div className="flex shrink-0 items-center">
          {actions}
          <button
            type="button"
            onClick={surFermer}
            aria-label={ariaLabelFermer}
            className="flex h-11 w-11 -mr-2 items-center justify-center
                       text-sombre-texte-doux active:text-sombre-texte
                       transition-colors"
          >
            <IconeCroix taille={22} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * LA PAGE PLEIN ÉCRAN DU DOIGT — l'habillage des trois écrans (nº 465)
 * ==================================================================
 * Une surface OPAQUE qui couvre l'écran (`fixed inset-0`,
 * `bg-sombre-fond`), l'en-tête ci-dessus en tête, le contenu qui
 * défile dessous (l'en-tête reste collé, comme sur la recherche).
 * ⚠️ AU DOIGT SEULEMENT, et par le CSS (`hidden mobile:flex`) : les
 * habillages web — fenêtres superposées, menus ancrés — restent rendus
 * par leurs porteurs, inchangés. Aucune bifurcation d'état, donc aucun
 * éclair du mauvais habillage au montage.
 * ⚠️ ELLE NE POSE NI GEL NI ÉTAPE D'HISTORIQUE : chaque porteur garde
 * les siens (la règle du C-4, lib/etape-refermable — une surface, une
 * étape, posée par celui qui l'ouvre).
 */
export function PagePleinEcranMobile({
  titre,
  icone,
  ariaLabel,
  surFermer,
  ariaLabelFermer,
  actions,
  classeCadre = "z-[70]",
  children,
}: {
  titre: string;
  icone: React.ReactNode;
  ariaLabel: string;
  surFermer: () => void;
  ariaLabelFermer?: string;
  actions?: React.ReactNode;
  /** Le rang d'empilement du porteur (z-[70] compte, z-[85] langue et
      notifications — les valeurs de leurs fenêtres d'origine). */
  classeCadre?: string;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`hidden mobile:flex fixed inset-0 ${classeCadre} flex-col
                 overflow-y-auto overscroll-contain
                 bg-sombre-fond text-sombre-texte`}
    >
      <EnTetePleinEcran
        icone={icone}
        titre={titre}
        surFermer={surFermer}
        ariaLabelFermer={ariaLabelFermer}
        actions={actions}
      />
      {children}
    </div>,
    document.body
  );
}
