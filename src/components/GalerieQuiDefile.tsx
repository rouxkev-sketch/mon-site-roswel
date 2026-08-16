"use client";

import { useEffect, useRef, useState } from "react";

/**
 * LA GALERIE QUI DÉFILE — UN SEUL DESSIN, DEUX EMPLOIS (nº 306)
 * ==================================================================
 * ⚠️ POURQUOI CE FICHIER EXISTE. La rangée de vignettes de « Ma
 * sélection » (nº 249-§6, refaite nº 264 et nº 301) est devenue la
 * présentation des galeries de la COLONNE PORTFOLIO d'une fiche, en
 * web. Le propriétaire l'a demandé en toutes lettres : « RÉUTILISE LE
 * COMPOSANT DE MA SÉLECTION, n'en écris pas un second. Si sa règle de
 * composition ne convient pas ici, extrais la présentation et laisse
 * le contenu à chaque appelant — mais il ne doit exister qu'un seul
 * dessin de galerie. »
 * C'EST EXACTEMENT CE QUI EST FAIT : ce composant ne CHOISIT rien —
 * ni les photos, ni leur nombre, ni leur ordre. Il POSE une rangée qui
 * défile, ses deux chevrons et ses deux fondus ; le contenu lui arrive
 * en enfants. « Ma sélection » lui donne ses vingt photos composées
 * (nº 302), la fiche lui donne TOUT un carrousel — deux contenus, un
 * seul dessin.
 *
 * CE QU'IL PORTE, ET QUI NE SE REDISCUTE PAS :
 *  · le DÉFILEMENT NATIF avec accrochage (`scroll-snap`), jamais une
 *    translation calculée — la règle de la nº 209-§7 ;
 *  · LES DEUX CHEVRONS de la nº 301 : zone de 40 px, dessin 20 × 40,
 *    trait 3, ombre douce (`drop-shadow`), au survol seulement, jamais
 *    au doigt (`pointer-fine`) ;
 *  · AUCUN POINT de défilement (supprimés nº 301-§4a) ;
 *  · le pas d'une flèche est UNE PAGE — une largeur de CONTENU —, visé
 *    par `scrollTo` (nº 253-§4).
 */

/** L'écart entre deux cases — 6 px, la valeur de la nº 244. */
export const ECART_GALERIE = "gap-1.5";

export function GalerieQuiDefile({
  children,
  classeEnveloppe = "",
  classeRangee = "",
  styleRangee,
  /** Le décalage des chevrons hors du cadre, par côté. */
  decalageGauche = "-left-4 sm:-left-6",
  decalageDroite = "-right-4 sm:-right-6",
  /**
   * LES DEUX FONDUS ANTHRACITE DES BORDS (nº 264-§3). Faux quand
   * l'appelant efface autrement — la colonne Portfolio d'une fiche
   * masque son bord gauche en dégradé, un aplat par-dessus n'aurait
   * plus rien à faire.
   */
  avecVoiles = true,
  /** Ce qui relance la mesure des deux bouts de course. */
  cleDuContenu,
  etiquette,
}: {
  children: React.ReactNode;
  classeEnveloppe?: string;
  classeRangee?: string;
  styleRangee?: React.CSSProperties;
  decalageGauche?: string;
  decalageDroite?: string;
  avecVoiles?: boolean;
  cleDuContenu: string | number;
  etiquette?: string;
}) {
  const zone = useRef<HTMLUListElement>(null);

  /*  §3 (nº 264) — LA LARGEUR DE CONTENU, PAS LE `clientWidth` : la
      rangée déborde de son cadre (rembourrage interne), et
      `clientWidth` le compte. Une PAGE reste une largeur de CONTENU. */
  const largeurContenu = (cadre: HTMLElement) => {
    const style = getComputedStyle(cadre);
    return (
      cadre.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight)
    );
  };

  /**
   * §4 (nº 253) — UNE PAGE ENTIÈRE, ET RIEN D'AUTRE. On VISE une
   * frontière de page (`page × largeur visible`) au lieu d'ajouter une
   * largeur à la position courante : les deux font le même pas, mais
   * viser se corrige tout seul — après un glissement qui s'est arrêté
   * entre deux pages, l'appui suivant retombe sur une frontière.
   */
  const defiler = (sens: 1 | -1) => {
    const cadre = zone.current;
    if (!cadre) return;
    const cible = Math.max(0, etat.page + sens) * largeurContenu(cadre);
    cadre.scrollTo({ left: cible, behavior: "smooth" });
  };

  //  §4-a (nº 301) — les deux bouts de course (qui décident de
  //  l'existence des chevrons et des fondus) et la PAGE COURANTE, qui
  //  est le pas du défilement. Rien d'autre : les points sont partis.
  const [etat, setEtat] = useState({ gauche: false, droite: false, page: 0 });
  useEffect(() => {
    const cadre = zone.current;
    if (!cadre) return;
    const lire = () => {
      const contenu = largeurContenu(cadre);
      setEtat({
        gauche: cadre.scrollLeft > 1,
        droite: cadre.scrollLeft + cadre.clientWidth < cadre.scrollWidth - 1,
        page: contenu ? Math.round(cadre.scrollLeft / contenu) : 0,
      });
    };
    lire();
    cadre.addEventListener("scroll", lire, { passive: true });
    const observateur = new ResizeObserver(lire);
    observateur.observe(cadre);
    return () => {
      cadre.removeEventListener("scroll", lire);
      observateur.disconnect();
    };
  }, [cleDuContenu]);

  /*  §6 (nº 264) — LE CHEVRON SE DÉSHABILLE : un chevron NU, blanc —
      ni disque, ni verre, ni fond, ni contour, ni halo —, au survol de
      la rangée seulement (`group-hover`, par la VISIBILITÉ : aucun
      fondu d'opacité), et jamais au doigt (`pointer-fine`).
      §4-b (nº 301) — SA ZONE FAIT 40 px et déborde donc de la bande
      des marges, vers l'INTÉRIEUR : le bord extérieur reste celui du
      cadre, sans quoi un élément absolu qui dépasse à droite
      ÉLARGIRAIT le document (le piège de la nº 228).
      §4-c (nº 301) — et il porte une OMBRE DOUCE, jamais un contour :
      c'est le procédé du cœur des vignettes, pas un second. */
  const bandeau = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Vignettes suivantes" : "Vignettes précédentes"}
      data-bandeau-defilement={sens === 1 ? "droite" : "gauche"}
      onClick={() => defiler(sens)}
      className={`hidden pointer-fine:flex invisible group-hover:visible
        absolute inset-y-0 z-[2] ${
          sens === 1 ? decalageDroite : decalageGauche
        } w-10 items-center justify-center text-white`}
    >
      <svg
        width="20"
        height="40"
        viewBox="0 0 12 24"
        fill="none"
        aria-hidden="true"
        className="[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.65))]"
      >
        <path
          d={sens === 1 ? "M3 4l6 8-6 8" : "M9 4l-6 8 6 8"}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  /*  §3 (nº 264) — LE FONDU ANTHRACITE DES BORDS : chaque marge porte
      un voile vertical de la couleur du fond du site, à 90 % vers rien
      — la vignette S'EFFACE DANS LA PAGE au lieu d'être coupée net.
      Jamais d'interception de clic, et le chevron (z-[2]) se pose
      dessus (z-[1]). */
  const voile = (sens: 1 | -1) => (
    <div
      aria-hidden="true"
      data-voile-rangee={sens === 1 ? "droite" : "gauche"}
      className={`pointer-events-none absolute inset-y-0 z-[1] w-4 sm:w-6 ${
        sens === 1
          ? `${decalageDroite} bg-gradient-to-l`
          : `${decalageGauche} bg-gradient-to-r`
      } from-sombre-fond/90 to-sombre-fond/0`}
    />
  );

  return (
    <div className={`group relative ${classeEnveloppe}`}>
      <ul
        ref={zone}
        data-galerie-defilante=""
        aria-label={etiquette}
        className={`flex ${ECART_GALERIE} ${classeRangee}
                   overflow-x-auto snap-x snap-mandatory
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={styleRangee}
      >
        {children}
      </ul>
      {avecVoiles && etat.gauche && voile(-1)}
      {avecVoiles && etat.droite && voile(1)}
      {etat.gauche && bandeau(-1)}
      {etat.droite && bandeau(1)}
    </div>
  );
}
