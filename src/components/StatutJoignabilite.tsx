"use client";

import { useEffect, useRef } from "react";

/**
 * STATUT DE JOIGNABILITÉ « État · précision » (adaptatif)
 * -------------------------------------------------------
 * L'état (« Joignable » / « Indisponible ») coloré, puis la précision
 * en gris. Si la précision NE TIENT PAS dans la place disponible, on
 * bascule automatiquement sur sa version abrégée (jour de la semaine
 * raccourci : « lundi » → « lun. »), exactement comme les mois abrégés
 * du badge d'absence. JAMAIS de troncature « … » : soit le texte
 * complet, soit l'abrégé. Re-mesuré au redimensionnement.
 */
export function StatutJoignabilite({
  etat,
  precision,
  precisionAbrege,
  couleur,
  classe = "",
  etatGras = false,
}: {
  etat: string;
  precision: string;
  precisionAbrege: string;
  couleur: string;
  classe?: string;
  /** L'ÉTAT (« Joignable » / « Indisponible ») en gras, la précision
      restant grise et de graisse normale — c'est le rendu de la section
      de joignabilité de la fiche ≥ 768 px. Ailleurs (cartes, fiche
      smartphone), tout reste de graisse normale. */
  etatGras?: boolean;
}) {
  const repere = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Rien à adapter si la précision est vide ou déjà égale à l'abrégé
    if (!precision || precision === precisionAbrege) return;
    const texte = repere.current;
    const badge = texte?.parentElement;
    if (!texte || !badge) return;

    const ajuster = () => {
      // Toujours re-tenter le texte complet (la place a pu s'élargir)
      texte.textContent = ` · ${precision}`;
      if (badge.scrollWidth > badge.clientWidth) {
        texte.textContent = ` · ${precisionAbrege}`;
      }
    };
    ajuster();
    window.addEventListener("resize", ajuster);
    return () => window.removeEventListener("resize", ajuster);
  }, [precision, precisionAbrege]);

  return (
    <span className={`min-w-0 whitespace-nowrap overflow-hidden ${classe}`}>
      <span className={etatGras ? "font-bold" : ""} style={{ color: couleur }}>
        {etat}
      </span>
      {precision && (
        <span className="text-encre-douce" ref={repere}>
          {` · ${precision}`}
        </span>
      )}
    </span>
  );
}
