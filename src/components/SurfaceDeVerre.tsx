"use client";

import { createPortal } from "react-dom";
import { usePlacementMenu } from "@/components/placement-menu";
import type { RefObject } from "react";

/**
 * LE VERRE DU SITE — L'UNIQUE ÉCRITURE
 * ==================================================================
 * (passe nº 236-§2)
 *
 * POURQUOI CE FICHIER EXISTE. La fenêtre d'adresse de la nº 234 est le
 * seul verre qui marche, et il a coûté TROIS PASSES : les valeurs
 * étaient justes à chaque fois, la cause était structurelle. Si chaque
 * fenêtre garde son propre verre, elles reperdront le même combat une
 * à une. Il n'y a donc qu'une écriture — celle-ci —, sur le modèle de
 * `IconeReseauSurDisque` (nº 235) et `CLASSES_LIGNE_CLIQUABLE`
 * (nº 232).
 *
 * CE QU'ELLE GARANTIT, SANS VARIATION POSSIBLE :
 *
 *  1. LA PLAQUE porte `data-verre-fenetre` — anthracite à 22 %,
 *     `blur(40px) saturate(200%)`, liseré divisé (0,10 en haut,
 *     0,035 au tour) : la règle vit dans globals.css, les deux lignes
 *     de filtre écrites littéralement, la préfixée d'abord, jamais
 *     dans un `@supports`, jamais un `var()` dedans.
 *
 *  2. LE PORTAIL. La plaque est montée dans le CORPS du document :
 *     aucun ancêtre applicatif — bloc collant, conteneur animé,
 *     `contain` d'une carte — ne peut créer une racine d'arrière-plan
 *     au-dessus d'elle. Un `backdrop-filter` ne floute que
 *     l'arrière-plan de sa racine la plus proche ; c'est la moitié de
 *     ce qui nous a coûté la nº 234.
 *
 *  3. AUCUN FONDU D'OPACITÉ SUR LA PLAQUE, JAMAIS. Une opacité
 *     inférieure à 1 fait de l'élément sa PROPRE racine : il ne floute
 *     alors plus la page, mais son propre plan. La sonde l'a attrapée
 *     à `opacity 0.0852719` pendant l'ouverture. Le fondu appartient
 *     au VOILE, qui ne floute rien.
 *
 *  4. LE VOILE ET LA PLAQUE SONT FRÈRES, et le voile porte sa couleur
 *     en `rgba`/`oklab` — jamais la propriété `opacity`. Il est ALLÉGÉ
 *     (25 %) : la plaque floute TOUT ce qui est peint derrière elle,
 *     voile compris — flouter un aplat noir donne un aplat noir.
 *
 * ⚠️ AUCUN ANCÊTRE DE LA PLAQUE ne doit porter `opacity` partielle,
 * `filter`, `transform`, `will-change`, `contain` ni `isolation` : le
 * conteneur posé ici est nu (`position: fixed`, qui ne crée aucune
 * racine), et le portail garantit le reste.
 */

/** LA PLAQUE, en classes — pour les surfaces qui gèrent elles-mêmes
    leur position (les menus déroulants, qui n'ont ni voile ni
    portail : ils sont ancrés à leur bouton). Le fond et le filtre
    viennent de l'attribut `data-verre-fenetre`. */
export const CLASSES_PLAQUE_VERRE = "rounded-2xl";

/**
 * UNE SURFACE DE VERRE ANCRÉE — un menu déroulant, un panneau de
 * suggestions. Pas de voile (la page reste vivante autour), pas de
 * portail imposé : l'appelant place la surface où il veut.
 * ⚠️ ELLE NE DOIT PORTER AUCUNE TRANSITION D'OPACITÉ : c'est la règle
 * nº 3 ci-dessus, et elle vaut ici aussi.
 */
export function SurfaceDeVerre({
  className = "",
  enfants,
  ...reste
}: {
  className?: string;
  enfants: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-verre-fenetre="" className={className} {...reste}>
      {enfants}
    </div>
  );
}

/**
 * UN MENU ANCRÉ EN VERRE — la plaque posée sous son bouton
 * ==================================================================
 * (passe nº 238-§3 et §4)
 *
 * POURQUOI IL EXISTE, ET CE QU'IL RÉPARE. Trois panneaux du site
 * s'ouvraient « sous leur bouton » en `absolute` : le panneau des
 * filtres, la fenêtre « Mon compte » du web et celle des langues.
 * Deux défauts en découlaient, tous deux relevés par le propriétaire :
 *
 *  · LE PANNEAU DES FILTRES NE S'OUVRAIT PLUS EN FENÊTRE RÉTRÉCIE
 *    (nº 238-§3). Il était rendu, visible, à la bonne place — et
 *    ENTIÈREMENT COUPÉ : sous 1024 px, la rangée du moteur porte
 *    `max-lg:overflow-hidden` (nº 147), qui sert à la replier au
 *    défilement. Tout ce qui déborde de la rangée est rogné, panneau
 *    compris. Aucune exception, aucune erreur en console : un ciseau.
 *
 *  · LE VERRE NE FLOUTAIT RIEN sur ces surfaces (nº 238-§4) : la barre
 *    fixe porte elle-même un `backdrop-filter`, donc une RACINE
 *    D'ARRIÈRE-PLAN — un enfant n'y floute plus que l'intérieur de la
 *    barre. C'est la leçon de la nº 234, appliquée aux menus.
 *
 * LE PORTAIL RÈGLE LES DEUX D'UN COUP : la plaque est montée dans le
 * corps du document, plus aucun ancêtre applicatif ne la coupe ni ne
 * lui vole sa racine, et `usePlacementMenu` la repose sous son bouton
 * à chaque image (défilement, redimensionnement, clavier).
 *
 * ⚠️ LE PANNEAU N'EST PLUS DANS LA ZONE DU BOUTON : les fermetures
 * « au clic dehors » doivent tester la plaque EN PLUS de leur zone —
 * d'où `refPanneau`.
 */
export function MenuDeVerre({
  ouvert,
  ancre,
  refPanneau,
  largeur,
  alignement = "droite",
  className = "",
  children,
  ...reste
}: {
  ouvert: boolean;
  /** Le bouton sous lequel le menu se pose. */
  ancre: RefObject<HTMLElement | null>;
  /** Pour que l'appelant reconnaisse « dedans » malgré le portail. */
  refPanneau?: RefObject<HTMLDivElement | null>;
  /** Largeur voulue, bornée à l'écran (16 px de marge de chaque côté). */
  largeur: number;
  /** Le bord du bouton sur lequel le menu s'aligne. */
  alignement?: "droite" | "gauche";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { cadre, hauteurMax, ouvreVersLeHaut } = usePlacementMenu(ouvert, ancre);
  if (!ouvert || typeof document === "undefined") return null;

  //  La largeur tient toujours dans l'écran ; l'alignement se calcule
  //  sur le bouton, puis on ramène le panneau dans les bords.
  const marge = 16;
  const large = Math.min(largeur, window.innerWidth - 2 * marge);
  const bordDroit = cadre ? cadre.gauche + cadre.largeur : window.innerWidth;
  const gaucheVoulue =
    alignement === "droite" ? bordDroit - large : (cadre?.gauche ?? marge);
  const gauche = Math.max(
    marge,
    Math.min(gaucheVoulue, window.innerWidth - large - marge)
  );

  return createPortal(
    <div
      {...reste}
      ref={refPanneau}
      data-verre-menu=""
      className={`z-[75] rounded-2xl overflow-y-auto overscroll-contain ${className}`}
      style={{
        position: "fixed",
        left: gauche,
        width: large,
        ...(cadre
          ? ouvreVersLeHaut
            ? { bottom: cadre.bas }
            : { top: cadre.haut }
          : { top: 0 }),
        maxHeight: hauteurMax ? `${hauteurMax}px` : undefined,
        //  ⚠️ AUCUNE TRANSITION D'OPACITÉ, AUCUNE OPACITÉ PARTIELLE :
        //  la plaque deviendrait sa propre racine d'arrière-plan et ne
        //  flouterait plus que son propre plan (règle nº 3).
        visibility: cadre ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

/**
 * UNE FENÊTRE SUPERPOSÉE EN VERRE — voile + plaque, montée dans le
 * corps du document. C'est la forme de la fenêtre d'adresse (nº 234),
 * rendue disponible à toutes les autres.
 */
export function FenetreDeVerre({
  ariaLabel,
  ariaLabelledby,
  surFermeture,
  largeur = "max-w-[440px]",
  classePlaque = "",
  rembourrage = "p-6",
  classeCadre = "p-6 z-[80]",
  children,
}: {
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** L'appui à côté referme. Absent : la fenêtre ne se ferme que par
      ses propres boutons (une confirmation qu'on ne fuit pas). */
  surFermeture?: () => void;
  largeur?: string;
  classePlaque?: string;
  /** L'air INTÉRIEUR de la plaque — `p-0` quand la fenêtre pose
      elle-même ses marges (un en-tête d'un bord à l'autre). */
  rembourrage?: string;
  /** L'air AUTOUR de la fenêtre, et son étage. Une fenêtre ouverte
      depuis une autre monte au-dessus d'elle. */
  classeCadre?: string;
  children: React.ReactNode;
}) {
  const fenetre = (
    <div
      role="dialog"
      aria-modal="true"
      {...(ariaLabelledby ? { "aria-labelledby": ariaLabelledby } : {})}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      className={`fixed inset-0 flex items-center justify-center ${classeCadre}`}
    >
      {/*  LE VOILE — allégé, sa couleur portée par la couleur (jamais
           par `opacity`), et c'est LUI qui porte le fondu. */}
      {surFermeture ? (
        <button
          type="button"
          aria-label="Fermer"
          onClick={surFermeture}
          className="absolute inset-0 bg-black/25
                     opacity-100 transition-opacity duration-200 starting:opacity-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/25
                     opacity-100 transition-opacity duration-200 starting:opacity-0"
        />
      )}

      {/*  LA PLAQUE — aucune opacité, aucune transition d'opacité. */}
      <div
        data-verre-fenetre=""
        className={`relative w-full ${largeur} rounded-3xl ${rembourrage} ${classePlaque}`}
      >
        {children}
      </div>
    </div>
  );

  //  Jamais pendant le rendu du serveur (`document` n'existe pas) :
  //  une fenêtre ne s'ouvre que sur un geste.
  return typeof document === "undefined"
    ? fenetre
    : createPortal(fenetre, document.body);
}
