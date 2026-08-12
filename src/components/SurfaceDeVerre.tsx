"use client";

import { createPortal } from "react-dom";

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
  children,
}: {
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** L'appui à côté referme. Absent : la fenêtre ne se ferme que par
      ses propres boutons (une confirmation qu'on ne fuit pas). */
  surFermeture?: () => void;
  largeur?: string;
  classePlaque?: string;
  children: React.ReactNode;
}) {
  const fenetre = (
    <div
      role="dialog"
      aria-modal="true"
      {...(ariaLabelledby ? { "aria-labelledby": ariaLabelledby } : {})}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
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
        className={`relative w-full ${largeur} rounded-3xl p-6 ${classePlaque}`}
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
