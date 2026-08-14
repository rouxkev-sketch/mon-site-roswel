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
 * `pleineLargeur` (nº 255-§1) — dans la barre, le badge occupe toute
 * sa moitié d'encadré et ses deux mots s'y partagent la largeur À
 * ÉGALITÉ (`flex-1 basis-1/2`), de sorte que la capsule glisse
 * d'exactement une demi-largeur. Sur la fiche, la rangée pose
 * « Suivre » à droite du sélecteur : il y garde sa largeur de contenu
 * (`w-fit`), comme depuis la nº 205.
 *
 * `robeCapsule` (nº 256-§2) — LE CRAN AU-DESSUS DU CONTEXTE, par
 * PARAMÈTRE de l'écriture unique. La règle est celle de la fiche
 * depuis la nº 207-§1 : la capsule prend LE BARREAU AU-DESSUS de ce
 * qui l'entoure. Sur la fiche, l'actif des rectangles est
 * `eleve-clair` → la capsule est `haut` (le défaut, inchangé). Dans
 * la barre, l'encadré est `haut` (la valeur gravée nº 175) → la
 * capsule y est `haut-clair`, un cran franc au-dessus : plus sombre
 * que son encadré, elle inversait la hiérarchie de la charte (page →
 * bloc → badge, chaque niveau s'éclaircit) et le sélecteur ne se
 * lisait pas. Aucune couleur neuve : les deux barreaux existent.
 */
export function SelecteurCapsule<T extends string>({
  valeur,
  options,
  surChoix,
  ariaLabel,
  pleineLargeur = false,
  robeCapsule = "bg-sombre-haut",
  hauteurMot = "min-h-[44px]",
}: {
  valeur: T;
  options: ReadonlyArray<{ cle: T; label: string }>;
  surChoix: (cle: T) => void;
  ariaLabel: string;
  pleineLargeur?: boolean;
  /** §4 (nº 258) — une chaîne VIDE laisse la robe au CSS : dans
      l'encadré de la barre, la règle `[data-clair-barre]
      [data-capsule-glissante]` (globals.css) habille la pilule UN CRAN
      AU-DESSUS de son fond, dans tous les états du fond. */
  robeCapsule?: string;
  /** §1 (nº 258) — la hauteur des mots (et donc de la pilule,
      `inset-y-0`). La fiche garde son 44 ; la barre passe 38 — son
      encadré est descendu à 46, et l'air de 4 px ne bouge pas. */
  hauteurMot?: string;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [capsule, setCapsule] = useState<{ left: number; width: number } | null>(
    null
  );

  /**
   * §1 (nº 259) — EN PLEINE LARGEUR, LA POSITION NE SE MESURE PLUS :
   * ELLE SE CALCULE, ET AVANT LA PEINTURE.
   * ------------------------------------------------------------------
   * LE DÉFAUT, dans un seul sens : la pilule partait, s'arrêtait,
   * repartait. LA CAUSE, mesurée : la position venait d'une MESURE DU
   * DOM prise après coup, et il y en avait DEUX par bascule —
   *  1. celle de l'effet de disposition (juste avant la peinture) ;
   *  2. celle du ResizeObserver, que l'effet recrée à chaque
   *     changement de valeur : `observe()` déclenche un rappel INITIAL
   *     à l'image suivante (mesuré : ~1 image après l'appel), c'est-à-
   *     dire APRÈS le départ de la transition.
   * Tant que les deux mesures coïncident, rien ne se voit. Mais la
   * bascule change AUSSI le reste de la barre et de la page (le
   * libellé du champ, l'icône de mise en page, tout le contenu de
   * « Ma sélection ») : quand la disposition se pose une image plus
   * tard, la seconde mesure diffère, elle réécrit `left` EN PLEINE
   * TRANSITION, et la transition repart de la position interpolée.
   * D'où l'asymétrie : le sens dont la disposition se stabilise le
   * plus tard est le seul qui casse.
   *
   * LE REMÈDE, sans toucher ni à la durée ni à la courbe : EN PLEINE
   * LARGEUR, la géométrie est CONNUE — les mots se partagent la
   * largeur à égalité, séparés par l'écart du conteneur. La position
   * de la pilule est donc une fonction pure de son rang, écrite en
   * `calc()` dès le PREMIER rendu : plus aucune mesure, plus aucun
   * observateur, plus de second rendu — une seule source, connue avant
   * la peinture. (Sur la fiche, les deux mots ont des largeurs
   * différentes : la mesure y reste la seule vérité.)
   */
  const rang = Math.max(
    0,
    options.findIndex((option) => option.cle === valeur)
  );
  const largeurMot = `calc((100% - ${options.length - 1} * var(--rw-ecart-mots)) / ${options.length})`;
  /*  §1 (nº 261) — LA PILULE SE DÉPLACE PAR UNE TRANSFORMATION, PLUS
      JAMAIS PAR SA POSITION. La nº 259 avait tari les mesures — c'était
      vrai, et ça ne suffisait pas : `left` est animé PAR LE FIL
      PRINCIPAL, chaque image recalcule style et disposition. Or sur
      « Ma sélection », la bascule redessine TOUT le contenu de la page
      dans le même instant : ce travail occupe le fil, l'écran gèle, et
      la transition — dont la pendule, elle, continue — reprend plus
      loin. Elle part, s'arrête, repart ; et l'asymétrie vient de ce que
      les deux sens n'ont pas la même quantité à rendre (les rangées de
      carrousels des suivis contre des cartes).
      Une TRANSFORMATION est composée par la carte graphique : un fil
      encombré ne peut plus l'interrompre.
       · `left` vaut 0 et ne bouge JAMAIS ; `width` ne bouge pas non
         plus (les deux moitiés sont égales) : seul `transform` anime ;
       · le `100%` du translateX se lit sur LA PILULE elle-même, qui
         fait exactement une largeur de mot : un rang = une largeur plus
         l'écart — la même géométrie que la nº 259, dans le repère de la
         pilule ;
       · GARDE-FOU (le piège de la nº 234) : la pilule est un fond
         OPAQUE, elle ne porte AUCUN filtre d'arrière-plan — une
         transformation sur une plaque de verre la couperait de la
         page ; le banc le mesure ;
       · GARDE-FOU : aucune clé sur la pilule — le nœud est RÉUTILISÉ
         entre les deux états, sans quoi aucune transition ne
         survivrait ; le banc vérifie l'identité du nœud.
      Ni la durée ni la courbe ne changent. La fiche, elle, garde ses
      transitions de position : ses deux mots n'ont pas la même largeur,
      et son panneau ne redessine presque rien. */
  const placeCalculee = {
    left: 0,
    width: largeurMot,
    transform: `translateX(calc(${rang} * (100% + var(--rw-ecart-mots))))`,
  };

  useLayoutEffect(() => {
    if (pleineLargeur) return;
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
  }, [valeur, pleineLargeur]);

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
      //  L'ÉCART ENTRE LES MOTS, ÉCRIT UNE FOIS (nº 259-§1) : la
      //  classe le POSE et l'écart le relit — les deux ne peuvent plus
      //  diverger. La valeur est celle de toujours (`gap-1`, 0,25 rem).
      //  ⚠️ DANS LA CLASSE, PAS DANS UN `style` EN LIGNE : la variable
      //  voyage alors AVEC la chaîne de classes — un style en ligne se
      //  serait perdu partout où l'on rejoue ces classes seules (les
      //  bancs l'ont montré : l'écart tombait à zéro), et la pilule
      //  aurait épousé une largeur qui n'est pas celle des mots.
      className={`relative flex items-center [--rw-ecart-mots:0.25rem]
                  gap-[var(--rw-ecart-mots)] ${
                    pleineLargeur ? "w-full" : "w-fit"
                  }`}
    >
      {/*  LA CAPSULE — derrière le mot actif, OPAQUE (nº 207-§1) et
           d'un cran plus claire que l'actif des rectangles de rendu.
           Aucun contour, aucun rose. */}
      {(pleineLargeur || capsule) && (
        <span
          aria-hidden="true"
          data-capsule-glissante=""
          //  §1 (nº 261) — en pleine largeur, SEUL `transform` est en
          //  transition ; la fiche garde ses `left`/`width` mesurés.
          className={`absolute inset-y-0 rounded-full ${robeCapsule} ${
            pleineLargeur ? "transition-transform" : "transition-[left,width]"
          } duration-300 ease-out`}
          style={
            pleineLargeur
              ? placeCalculee
              : { left: capsule!.left, width: capsule!.width }
          }
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
            className={`relative z-[1] ${hauteurMot} rounded-full px-5
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
