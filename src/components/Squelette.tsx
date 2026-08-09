"use client";

import { useEffect, useState } from "react";

/**
 * LA FIN DE L'ÉCRAN « Un instant… » (passe nº 118)
 * =================================================
 * Un mot seul sur fond noir, c'est une page qui a l'air en panne :
 * chaque chargement commençait par une seconde de vide signée
 * « Un instant… ». Deux idées, COMBINÉES ici :
 *
 *  1. `Patience` — NE RIEN MONTRER pendant les premières centaines de
 *     millisecondes. Un chargement rapide (cache chaud, bonne
 *     connexion) ne montre alors JAMAIS d'écran d'attente : la page
 *     arrive avant l'échéance, et l'œil n'a rien vu passer.
 *  2. Les squelettes — passé ce délai, la SILHOUETTE de la page qui
 *     vient : des blocs aux bons endroits, aux tons de la charte
 *     (le bloc un cran plus clair que la page, la ligne un cran plus
 *     clair que le bloc), qui respirent doucement. On attend devant
 *     une page qui se dessine, pas devant un message.
 *
 * CHARTE : AUCUN contour, rien de criard — les formes reprennent les
 * fonds existants (`sombre-carte`, `sombre-eleve`) et `animate-pulse`
 * fait toute l'animation. Les lecteurs d'écran entendent
 * « Chargement » (`role="status"`), pas une grille de rectangles.
 *
 * ⚠️ LES LIBELLÉS DE BOUTON « Un instant… » NE SONT PAS CONCERNÉS :
 * sur un bouton pressé, c'est un retour d'action — il dit « j'ai bien
 * reçu ton clic » — pas un écran d'attente. Ils restent.
 */

/** NE RIEN MONTRER AVANT L'ÉCHÉANCE : le squelette lui-même serait un
    clignotement sur les chargements rapides. */
export function Patience({
  delaiMs = 300,
  children,
}: {
  delaiMs?: number;
  children: React.ReactNode;
}) {
  const [echu, setEchu] = useState(false);
  useEffect(() => {
    const minuteur = window.setTimeout(() => setEchu(true), delaiMs);
    return () => window.clearTimeout(minuteur);
  }, [delaiMs]);
  if (!echu) return null;
  return <>{children}</>;
}

/** LA SILHOUETTE DU FORMULAIRE — un titre, puis des blocs numérotés
    comme les vrais : carte, ligne de titre, deux champs. */
export function SqueletteFormulaire() {
  return (
    <div role="status" aria-label="Chargement" className="animate-pulse">
      <div className="h-7 w-2/3 rounded-full bg-sombre-carte" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-sombre-carte" />
      <div className="mt-8 flex flex-col gap-5">
        {[0, 1, 2].map((rang) => (
          <div key={rang} className="rounded-2xl bg-sombre-carte p-5 sm:p-7">
            <div className="h-5 w-1/3 rounded-full bg-sombre-eleve" />
            <div className="mt-5 h-[52px] rounded-xl bg-sombre-eleve" />
            <div className="mt-3 h-[52px] w-4/5 rounded-xl bg-sombre-eleve" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** LA SILHOUETTE D'UNE PAGE DE RÉGLAGES (Sécurité) — le titre, puis
    des blocs à la grammaire du formulaire (nº 130) : le titre de bloc
    AU-DESSUS de sa carte, aligné sur le texte, et la carte en dessous.
    La silhouette doit dessiner ce qui va apparaître, sinon la page
    « saute » à l'arrivée. */
export function SquelettePage() {
  return (
    <div role="status" aria-label="Chargement" className="animate-pulse">
      <div className="h-7 w-1/2 rounded-full bg-sombre-carte" />
      <div className="mt-10 sm:mt-8 flex flex-col gap-8 sm:gap-6">
        {[0, 1, 2].map((rang) => (
          <div key={rang}>
            <div className="mx-4 sm:mx-7 h-4 w-1/3 rounded-full bg-sombre-carte" />
            <div className="mt-3 rounded-2xl bg-sombre-carte px-4 py-6 sm:rounded-3xl sm:px-7 sm:py-7">
              <div className="h-[48px] rounded-xl bg-sombre-eleve" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** DES LIGNES EN ATTENTE, pour les listes qui se chargent DANS une
    page déjà là (fiches à valider, signalements, portfolios à
    supprimer). `ton` suit la règle des fonds : `carte` sur la page,
    `eleve` à l'intérieur d'une carte. */
export function SqueletteLignes({
  nombre = 3,
  ton = "carte",
}: {
  nombre?: number;
  ton?: "carte" | "eleve";
}) {
  const fond = ton === "carte" ? "bg-sombre-carte" : "bg-sombre-eleve";
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex flex-col gap-2.5 animate-pulse"
    >
      {Array.from({ length: nombre }, (_, rang) => (
        <div key={rang} className={`h-[60px] rounded-2xl ${fond}`} />
      ))}
    </div>
  );
}
