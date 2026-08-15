"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { stylePanneau, usePlacementMenu } from "@/components/placement-menu";

/**
 * LE SÉLECTEUR DE STYLE — posé SUR la photo de la fiche
 * ======================================================
 * CE QU'IL REMPLACE : un badge qui annonçait le style de la photo
 * affichée, et s'effaçait au bout de trois secondes. Il disait, il ne
 * servait à rien.
 *
 * CE QU'IL EST MAINTENANT : la NAVIGATION de la fiche. Le portfolio
 * contient tous les styles du tatoueur ; ce menu est ce qui permet de
 * passer de l'un à l'autre — et le carrousel change de contenu.
 *
 * OÙ ? Là où l'œil le cherche, et ce n'est pas le même endroit selon
 * la main :
 *  - SMARTPHONE — EN BAS À GAUCHE de l'image : le pouce y va tout
 *    seul, et le haut reste au compteur ;
 *  - WEB — EN HAUT À GAUCHE : on lit une page de haut en bas, le
 *    style est le titre de ce qu'on regarde.
 * Le placement se fait en CSS (variante `mobile:`), jamais en
 * JavaScript : un seul bouton, donc un seul menu, et aucun
 * clignotement d'hydratation.
 *
 * UN SEUL STYLE = PAS DE MENU. Un simple badge portant son nom,
 * exactement comme avant : dérouler une liste d'un élément serait une
 * politesse absurde.
 *
 * IL NE S'EFFACE PLUS. Le compteur de photos, lui, garde son fondu
 * après trois secondes (voir CarrouselPortfolio) : il informe, il
 * n'agit pas. Ce qui SERT reste à l'écran.
 *
 * LE MENU EST POSÉ DANS <body> (portail) et placé en coordonnées
 * d'écran par `usePlacementMenu` — la même prudence que le menu des
 * styles du moteur et que le champ de localité : il s'ouvre vers le
 * haut s'il n'y a pas la place en bas, se plafonne à la hauteur
 * réellement visible, défile sur lui-même, et ne sort JAMAIS de
 * l'écran, même dans la fenêtre superposée qui, elle, rogne son
 * contenu.
 */

export type EntreeStyle = {
  slug: string;
  label: string;
  /** Le nombre de photos de ce style — annoncé discrètement. */
  nombre: number;
};

export function SelecteurStyleFiche({
  styles,
  valeur,
  surChangement,
}: {
  styles: EntreeStyle[];
  valeur: string;
  surChangement: (slug: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const { hauteurMax, ouvreVersLeHaut, cadre } = usePlacementMenu(
    ouvert,
    bouton
  );

  /* Fermeture : clic à l'extérieur, ou Échap — l'idiome de tous les
     menus du site. */
  useEffect(() => {
    if (!ouvert) return;
    function auPointeur(evenement: PointerEvent) {
      const cible = evenement.target as Node;
      if (bouton.current?.contains(cible)) return;
      if (panneau.current?.contains(cible)) return;
      setOuvert(false);
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }
    document.addEventListener("pointerdown", auPointeur);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("pointerdown", auPointeur);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  const courant = styles.find((entree) => entree.slug === valeur) ?? styles[0];
  if (!courant) return null;

  /** LA PLACE DU BADGE ET DU BOUTON — la même, au pixel près : passer
      d'un style à deux ne doit rien déplacer.
      Web : typographie blanche seule, en haut à gauche.
      Smartphone : pastille noire translucide, en bas à gauche. */
  const placement =
    "absolute z-[2] left-4 top-3.5 mobile:left-3 mobile:top-auto mobile:bottom-3";
  const habillageMobile =
    "mobile:rounded-full mobile:bg-black/60 mobile:backdrop-blur " +
    "mobile:px-3 mobile:py-1.5 mobile:text-[12.5px] mobile:border mobile:border-white/15";
  const typographie =
    "text-[16px] font-semibold tracking-wide text-white whitespace-nowrap";

  /* ---------- UN SEUL STYLE : un badge, et rien d'autre ---------- */
  if (styles.length <= 1) {
    return (
      <span
        data-selecteur-style="badge"
        className={`${placement} ${typographie} ${habillageMobile} inline-block`}
      >
        {courant.label}
      </span>
    );
  }

  /* ---------- PLUSIEURS STYLES : le menu ---------- */
  return (
    <>
      <button
        ref={bouton}
        type="button"
        data-selecteur-style="menu"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={`Style affiché : ${courant.label}. Changer de style`}
        onClick={() => setOuvert((o) => !o)}
        className={`${placement} ${typographie} ${habillageMobile}
                   inline-flex items-center gap-1.5 min-h-[34px] mobile:min-h-[38px]
                   rounded-full px-2.5 -ml-2.5 mobile:ml-0
                   transition-colors hover:bg-black/40 mobile:hover:bg-black/60
                   ${ouvert ? "bg-black/40 mobile:bg-black/70" : "bg-black/0"}`}
      >
        {courant.label}
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${
            ouvert ? "rotate-180" : ""
          }`}
        >
          <path
            d="M1 1.5 6 6.5l5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {ouvert &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panneau}
            role="listbox"
            aria-label="Styles de ce portfolio"
            style={{
              ...stylePanneau(cadre, ouvreVersLeHaut, hauteurMax),
              // Le bouton est étroit (le nom d'un style) : le menu, lui,
              // a besoin de sa propre largeur — sans jamais dépasser
              // l'écran, d'où le plafond en `min()`.
              width: "auto",
              minWidth: 216,
              maxWidth: "min(300px, calc(100vw - 20px))",
            }}
            data-verre-menu=""
            className="z-[95] overflow-y-auto overscroll-contain rounded-2xl p-1.5"
          >
            {styles.map((entree) => {
              const actif = entree.slug === courant.slug;
              return (
                <button
                  key={entree.slug}
                  type="button"
                  role="option"
                  aria-selected={actif}
                  onClick={() => {
                    surChangement(entree.slug);
                    setOuvert(false);
                  }}
                  className={`flex w-full min-h-[44px] items-center gap-2.5 rounded-xl
                             px-3 text-left text-[14px] transition-colors ${
                               actif
                                 ? "bg-sombre-eleve-clair font-semibold text-primaire"
                                 : "text-sombre-texte hover:bg-white/[0.07]"
                             }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      actif ? "bg-primaire" : "bg-transparent"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate">{entree.label}</span>
                  <span
                    className={`shrink-0 text-[12px] tabular-nums ${
                      actif ? "text-primaire/80" : "text-sombre-texte-doux"
                    }`}
                  >
                    {entree.nombre}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
