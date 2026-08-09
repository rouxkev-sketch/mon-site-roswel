"use client";

import { useEffect, useRef, useState } from "react";

/**
 * UN TEXTE QUI S'ABRÈGE SEULEMENT SI LA PLACE MANQUE
 * ---------------------------------------------------
 * Affiche `complet` tant qu'il TIENT dans la largeur disponible ;
 * bascule sur `abrege` uniquement quand il déborderait (et serait donc
 * coupé par « … »). Sur les cartes, cela évite
 * « Plombier & Chauffagiste · Sain… » : on affiche
 * « Plombier & Chauffagiste · St-Priest », entier et lisible.
 *
 * La mesure est FIABLE et sans clignotement : un double invisible du
 * texte complet (hors flux, sur une seule ligne) sert de règle. Son
 * contenu ne change jamais, donc la mesure ne peut pas osciller. Elle
 * est refaite à chaque changement de largeur (ResizeObserver) :
 * rotation du téléphone, redimensionnement de la fenêtre, passage
 * d'une colonne à deux…
 *
 * Si même la version abrégée ne tient pas, le comportement d'avant
 * reprend la main : troncature par « … » (classe `truncate`).
 */
export function TexteAbregeable({
  complet,
  abrege,
  classe = "",
}: {
  complet: string;
  abrege: string;
  classe?: string;
}) {
  const conteneur = useRef<HTMLSpanElement>(null);
  const regle = useRef<HTMLSpanElement>(null);
  const [tropEtroit, setTropEtroit] = useState(false);

  useEffect(() => {
    const cadre = conteneur.current;
    const mesure = regle.current;
    if (!cadre || !mesure) return;

    // +1 px de tolérance : les largeurs sont fractionnaires, on ne
    // veut pas abréger pour un dixième de pixel.
    const verifier = () =>
      setTropEtroit(mesure.offsetWidth > cadre.clientWidth + 1);

    verifier();
    const observateur = new ResizeObserver(verifier);
    observateur.observe(cadre);
    return () => observateur.disconnect();
  }, [complet, abrege]);

  return (
    <span ref={conteneur} className={`relative block truncate ${classe}`}>
      {tropEtroit ? abrege : complet}
      {/* La « règle » : le texte complet, invisible et hors du flux,
          sur une seule ligne — sert uniquement à mesurer sa largeur
          naturelle. Masquée aux lecteurs d'écran. */}
      <span
        ref={regle}
        aria-hidden
        className="absolute left-0 top-0 invisible whitespace-nowrap pointer-events-none"
      >
        {complet}
      </span>
    </span>
  );
}
