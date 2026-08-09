"use client";

import { useRef, useState } from "react";
import { FAQ } from "@/config/agence";

/**
 * L'ACCORDÉON DES QUESTIONS FRÉQUENTES
 * =====================================
 * UN SEUL ÉLÉMENT OUVERT À LA FOIS : ouvrir une question referme la
 * précédente. C'est ce qui garde la liste lisible — huit réponses
 * ouvertes en même temps, ce n'est plus une FAQ, c'est un article.
 *
 * L'ÉLÉMENT OUVERT PASSE EN SOMBRE, texte blanc : on voit d'un coup
 * d'œil où l'on est dans la liste. Les chevrons sont ROSES et pivotent
 * d'un quart de tour à l'ouverture.
 *
 * ACCESSIBILITÉ — un vrai accordéon, pas un empilement de <div> :
 *  - chaque question est un <button> (donc atteignable au clavier,
 *    activable par Entrée ET par Espace, sans une ligne de code) ;
 *  - `aria-expanded` dit l'état, `aria-controls` désigne la réponse ;
 *  - les flèches Haut/Bas passent d'une question à l'autre, Origine
 *    et Fin vont à la première et à la dernière — c'est ce qu'attend
 *    un lecteur d'écran d'un accordéon ;
 *  - la réponse fermée est retirée du document (et pas seulement
 *    masquée) : rien d'invisible n'est lu ni tabulé.
 */
export function AccordeonFaq() {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const boutons = useRef<Array<HTMLButtonElement | null>>([]);

  function auClavier(evenement: React.KeyboardEvent, index: number) {
    const dernier = FAQ.questions.length - 1;
    let cible: number | null = null;
    if (evenement.key === "ArrowDown") cible = index === dernier ? 0 : index + 1;
    if (evenement.key === "ArrowUp") cible = index === 0 ? dernier : index - 1;
    if (evenement.key === "Home") cible = 0;
    if (evenement.key === "End") cible = dernier;
    if (cible === null) return;
    evenement.preventDefault();
    boutons.current[cible]?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      {FAQ.questions.map((entree, index) => {
        const estOuverte = ouverte === entree.id;
        return (
          <div
            key={entree.id}
            className={`rounded-2xl transition-colors duration-200 ${
              estOuverte
                ? "bg-[#141417] text-white"
                : "bg-black/[0.035] text-black hover:bg-black/[0.06]"
            }`}
          >
            <h3>
              <button
                ref={(element) => {
                  boutons.current[index] = element;
                }}
                type="button"
                id={`question-${entree.id}`}
                aria-expanded={estOuverte}
                aria-controls={`reponse-${entree.id}`}
                onClick={() => setOuverte(estOuverte ? null : entree.id)}
                onKeyDown={(evenement) => auClavier(evenement, index)}
                className="w-full flex items-center gap-5 text-left px-6 sm:px-8 py-5 sm:py-6
                           rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire"
              >
                <span className="flex-1 text-[17px] sm:text-[19px] font-semibold leading-snug">
                  {entree.question}
                </span>
                {/* Le chevron : rose dans les deux états, pivoté d'un
                    quart de tour quand la réponse est dépliée. */}
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                  className={`shrink-0 text-primaire transition-transform duration-200 ${
                    estOuverte ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h3>

            {estOuverte && (
              <div
                id={`reponse-${entree.id}`}
                role="region"
                aria-labelledby={`question-${entree.id}`}
                className="px-6 sm:px-8 pb-6 sm:pb-7 -mt-1"
              >
                <p className="text-[15px] sm:text-base leading-relaxed text-white/75 max-w-[68ch]">
                  {entree.reponse}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
