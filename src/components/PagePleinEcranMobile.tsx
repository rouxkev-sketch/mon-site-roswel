"use client";

import { useEffect, useRef } from "react";
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
  /**
   * ██ §1 (nº 477) — LA SURFACE ÉPOUSE CE QUI EST RÉELLEMENT VISIBLE ██
   * ==================================================================
   * POURQUOI LA nº 476 NE POUVAIT PAS MARCHER, et c'est le code qui le
   * dit : elle ajoutait un fond de secours… LUI AUSSI `fixed`, ancré au
   * même viewport de mise en page que la surface qu'il devait rattraper.
   * Deux boîtes ancrées au même repère subissent EXACTEMENT le même
   * déplacement : quand l'une sort de l'écran, l'autre sort avec elle.
   * Ce fond n'aurait servi que si le défaut avait été une HAUTEUR trop
   * courte ; il ne pouvait rien contre un DÉPLACEMENT.
   * CE QUI SE PASSE VRAIMENT, sur iPhone : à l'ouverture du clavier,
   * WebKit garde le viewport de mise en page à la taille de l'écran et
   * fait GLISSER par-dessus une fenêtre plus petite — le viewport
   * VISUEL — pour amener le champ au-dessus des touches. Tout ce qui
   * est `fixed` reste accroché au premier repère, donc se décale par
   * rapport à ce que l'œil voit : le bas de l'écran cesse d'être
   * couvert, et le formulaire qui vit dessous apparaît.
   * LE REMÈDE : ne plus DEVINER où est l'écran — le DEMANDER.
   * `visualViewport` donne à chaque image la position et la hauteur de
   * ce qui est réellement visible ; la surface s'y recale. Elle couvre
   * alors la zone visible EXACTEMENT, clavier ouvert comme fermé, et
   * son contenu (l'en-tête, la liste, le champ) reste dans cette zone
   * au lieu d'en sortir par le haut.
   *
   * POURQUOI PAS LE PROCÉDÉ DE LA PAGE DE RECHERCHE (le site sort du
   * flux, la surface passe en flux) — la piste était juste, et c'est
   * son PRIX qui la fait écarter, pas son principe : il faudrait
   * retirer le VERROU DE DÉFILEMENT COMPTÉ des quatre porteurs (un
   * `overflow: hidden` sur le corps empêcherait la page en flux de
   * défiler — l'acquis nº 469, exigé explicitement pour cette page à
   * la nº 474), et rendre à chacun des quatre la position du site
   * qu'il a fait quitter le flux, comme la recherche le fait avec
   * `memoriserDefilementResultats`. Deux acquis démontés et quatre
   * restitutions neuves pour un défaut d'affichage : le recalage
   * ci-dessous obtient le même résultat sans toucher à rien de tout
   * cela.
   *
   * CE QUI NE BOUGE PAS, ET C'EST LE POINT : la surface reste `fixed`,
   * dans son portail, au rang de son porteur. Le verrou compté
   * (nº 469), l'étape d'historique par surface et le retour en un appui
   * (nº 465, nº 474, nº 332-§1 et §4), l'empilement (« Langue » ou
   * « Notifications » par-dessus « Mon compte », et la fermeture qui
   * retombe sur « Mon compte »), la saisie conservée dans le formulaire
   * resté monté dessous (nº 474) : tout cela vit chez les porteurs, et
   * aucun n'est touché. Les quatre pages profitent du recalage puisque
   * le gabarit est partagé.
   *
   * ⚠️ AUCUNE SACCADE, et voici comment : on ne pose RIEN pendant
   * l'événement — on demande une image (`requestAnimationFrame`), et le
   * navigateur peint la nouvelle position dans le même souffle que le
   * mouvement du clavier ; une demande déjà en attente n'est pas
   * doublée. Les valeurs sont arrondies et COMPARÉES à celles déjà
   * posées : une rafale d'événements identiques (iOS en émet beaucoup)
   * n'écrit rien du tout. Et surtout AUCUNE transition n'est déclarée
   * sur ces propriétés : le recalage suit le clavier au lieu de courir
   * après lui.
   * ⚠️ AU DOIGT SEULEMENT (`data-appareil`), et sans `visualViewport`
   * (navigateur ancien) l'effet s'abstient : la surface garde alors le
   * comportement d'avant, au pixel.
   */
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zoneVisible = window.visualViewport;
    const boite = surface.current;
    if (!zoneVisible || !boite) return;
    if (document.documentElement.dataset.appareil !== "mobile") return;
    let image = 0;
    let posee = "";
    const epouser = () => {
      image = 0;
      const haut = Math.round(zoneVisible.offsetTop);
      const hauteur = Math.round(zoneVisible.height);
      const valeurs = `${haut}:${hauteur}`;
      if (valeurs === posee) return;
      posee = valeurs;
      boite.style.top = `${haut}px`;
      boite.style.height = `${hauteur}px`;
      //  `inset-0` pose un bas : il doit céder la main à la hauteur.
      boite.style.bottom = "auto";
    };
    const planifier = () => {
      if (image) return;
      image = requestAnimationFrame(epouser);
    };
    epouser();
    zoneVisible.addEventListener("resize", planifier);
    zoneVisible.addEventListener("scroll", planifier);
    return () => {
      if (image) cancelAnimationFrame(image);
      zoneVisible.removeEventListener("resize", planifier);
      zoneVisible.removeEventListener("scroll", planifier);
      boite.style.top = "";
      boite.style.height = "";
      boite.style.bottom = "";
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={surface}
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
    </div>,
    document.body
  );
}
