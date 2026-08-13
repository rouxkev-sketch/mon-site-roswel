"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * LE BADGE OVALE QUI GLISSE — L'ÉCRITURE UNIQUE (extrait nº 255-§1)
 * ==================================================================
 * D'OÙ IL VIENT. C'est le sélecteur « Profil / Portfolio » des fiches
 * (nº 205-§1, opaque depuis la nº 207-§1). La nº 255 en veut un second
 * emploi — « Favoris / Suivis », dans la barre de « Ma sélection ».
 * Le recopier, c'était accepter qu'ils divergent à la passe suivante :
 * le défaut payé trois passes sur le verre, et celui de l'encadré de
 * barre, EXTRAIT pour cette raison exacte à la nº 245-§1.
 * Il est donc SORTI de PortfolioDeLAffiche, à l'identique, et les deux
 * endroits consomment cette écriture-ci. Il n'en existe pas d'autre.
 *
 * LA MÉCANIQUE (inchangée) : la capsule est un seul élément, posé
 * DERRIÈRE les mots, dont la position et la largeur épousent le bouton
 * actif — mesurées avant peinture (`useLayoutEffect`), et re-mesurées
 * si la boîte change (police chargée, redimensionnement : le
 * ResizeObserver du conteneur voit tout). Au changement, seule la
 * paire left / width bouge : la transition la fait GLISSER d'un mot à
 * l'autre. À sa première apparition elle naît en place — une
 * transition n'anime qu'un changement, pas une naissance.
 *
 * LES COULEURS (inchangées) : la capsule prend `sombre-haut`, LE
 * BARREAU AU-DESSUS de l'actif des rectangles de rendu — le niveau le
 * plus haut de la hiérarchie est le plus clair. Le mot actif passe au
 * blanc, l'autre redescend en gris. AUCUN contour, AUCUN rose.
 *
 * `pleineLargeur` (nº 255-§1) — LE SEUL PARAMÈTRE, et il ne dessine
 * rien : dans la barre, le badge occupe toute sa moitié d'encadré et
 * ses deux mots s'y partagent la largeur À ÉGALITÉ (`flex-1
 * basis-1/2`), de sorte que la capsule glisse d'exactement une
 * demi-largeur. Sur la fiche, la rangée pose « Suivre » à droite du
 * sélecteur : il y garde sa largeur de contenu (`w-fit`), comme
 * depuis la nº 205.
 */
export function SelecteurCapsule<T extends string>({
  valeur,
  options,
  surChoix,
  ariaLabel,
  pleineLargeur = false,
}: {
  valeur: T;
  options: ReadonlyArray<{ cle: T; label: string }>;
  surChoix: (cle: T) => void;
  ariaLabel: string;
  pleineLargeur?: boolean;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [capsule, setCapsule] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const zone = conteneur.current;
    if (!zone) return;
    const mesurer = () => {
      const actif = zone.querySelector<HTMLButtonElement>(
        "button[aria-checked='true']"
      );
      if (!actif) return;
      setCapsule({ left: actif.offsetLeft, width: actif.offsetWidth });
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(zone);
    return () => observateur.disconnect();
  }, [valeur]);

  const contenu = (
    <div
      ref={conteneur}
      role="radiogroup"
      aria-label={ariaLabel}
      data-selecteur-capsule=""
      //  SANS piste, sans rail, sans fond de rangée : les mots, c'est
      //  tout. `w-fit` sur la fiche (la rangée du haut pose « Suivre »
      //  à sa droite) ; pleine largeur dans la barre, où le badge
      //  remplit sa moitié d'encadré.
      className={`relative flex items-center gap-1 ${
        pleineLargeur ? "w-full" : "w-fit"
      }`}
    >
      {/*  LA CAPSULE — derrière le mot actif, OPAQUE (nº 207-§1) et
           d'un cran plus claire que l'actif des rectangles de rendu.
           Aucun contour, aucun rose. */}
      {capsule && (
        <span
          aria-hidden="true"
          data-capsule-glissante=""
          className="absolute inset-y-0 rounded-full bg-sombre-haut
                     transition-[left,width] duration-300 ease-out"
          style={{ left: capsule.left, width: capsule.width }}
        />
      )}
      {options.map((option) => {
        const actif = valeur === option.cle;
        return (
          <button
            key={option.cle}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => surChoix(option.cle)}
            //  Le mot passe au blanc quand il devient actif, l'autre
            //  redescend en gris — la même transition douce que la
            //  capsule. L'air vient du rembourrage : la capsule
            //  enveloppe le mot, elle ne le serre pas.
            className={`relative z-[1] min-h-[44px] rounded-full px-5
                        text-[14px] font-semibold transition-colors ${
                          pleineLargeur ? "flex-1 basis-1/2 min-w-0" : ""
                        } ${
                          actif
                            ? "text-sombre-texte"
                            : "text-sombre-texte-doux hover:text-sombre-texte"
                        }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  /*  ⚠️ LA CAPSULE ÉPOUSE LES MOTS, PAS LE CHAMP. Dans la barre, la
      moitié d'encadré fait 52 px (la hauteur du champ voisin) : sans
      cette enveloppe, le badge s'y étirait et la pilule — qui prend
      toute la hauteur de son conteneur (`inset-y-0`) — devenait un
      ovale de 52 px collé aux deux bords, d'une courbure étrangère à
      celle de l'encadré. Le badge garde donc SA hauteur (44 px, celle
      de la fiche) et se centre dans sa moitié : la pilule est posée
      dans le champ, elle ne le remplit pas. */
  return pleineLargeur ? (
    <div data-hote-capsule="" className="flex h-full w-full items-center">
      {contenu}
    </div>
  ) : (
    contenu
  );
}
