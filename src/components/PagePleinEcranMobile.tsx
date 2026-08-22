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
  sousLeTitre,
  classeCadre = "z-[70]",
  children,
}: {
  titre: string;
  icone: React.ReactNode;
  ariaLabel: string;
  surFermer: () => void;
  ariaLabelFermer?: string;
  actions?: React.ReactNode;
  /** §2-b (nº 475) — CE QUI VIT SOUS LA LIGNE DU TITRE, DANS LE BLOC
      COLLANT : le canal existait déjà dans `EnTetePleinEcran` (les
      `children` — la bascule Réalisation | Flash de la recherche) ;
      cette page ne le transmettait simplement pas. Il s'ouvre ici pour
      la ligne de séparation de « Ajouter un style », et il est
      FACULTATIF : les porteurs qui ne le passent pas (Mon compte,
      Notifications, Langue) ne changent pas d'un pixel. */
  sousLeTitre?: React.ReactNode;
  /** Le rang d'empilement du porteur (z-[70] compte, z-[85] langue et
      notifications — les valeurs de leurs fenêtres d'origine). */
  classeCadre?: string;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      {/*  ██ §3 (nº 476) — LE CLAVIER NE DÉCOUVRE PLUS LA PAGE DU
           DESSOUS ██
           LA CAUSE, NOMMÉE : cette surface est `fixed inset-0` (juste
           en dessous) — elle est donc ancrée au VIEWPORT DE MISE EN
           PAGE. Or à l'ouverture du clavier, iOS ne rétrécit pas ce
           viewport-là : il fait GLISSER le viewport VISUEL vers le bas
           pour amener le champ au-dessus des touches. La surface, elle,
           reste accrochée au haut de la page — donc elle sort de
           l'écran par le haut, et le bas de ce qu'on voit n'est plus
           couvert : le formulaire qui vit dessous apparaît.
           POURQUOI LA PAGE DE RECHERCHE N'A JAMAIS EU CE DÉFAUT : une
           fois posée, elle n'est PAS fixe — elle est en flux
           (`relative min-h-[100dvh]`, PageRechercheMobile l. 444) :
           « le navigateur fait défiler le document pour dégager le
           champ, et c'est tout ». Il n'y a rien dessous à découvrir.
           LE REMÈDE, SANS TOUCHER AU POSITIONNEMENT DES QUATRE
           PORTEURS : un fond de la même couleur, ancré au même
           viewport, qui DESCEND BIEN PLUS BAS QUE L'ÉCRAN. Quel que
           soit le glissement du viewport visuel, ce qui se découvre
           sous la surface est ce fond — jamais la page. Il est inerte
           (ni pointeur, ni lecteur d'écran), il vit au même rang que la
           surface mais AVANT elle dans le document : elle se peint
           par-dessus, rien ne change à l'écran clavier fermé.
           ⚠️ LES QUATRE PORTEURS EN BÉNÉFICIENT (le gabarit est
           partagé) : « Mon compte », « Notifications » et « Langue »
           n'ouvrent aucun clavier — ils avaient donc la même faiblesse
           sans jamais la montrer ; elle est fermée pour eux aussi. */}
      <div
        aria-hidden="true"
        className={`hidden mobile:block fixed inset-x-0 top-0 h-[200dvh]
                   ${classeCadre} pointer-events-none bg-sombre-fond`}
      />
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
        >
          {sousLeTitre}
        </EnTetePleinEcran>
        {children}
      </div>
    </>,
    document.body
  );
}
