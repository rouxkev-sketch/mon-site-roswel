"use client";

import { useEffect, useRef } from "react";

/**
 * LIBELLÉ QUI S'ABRÈGE S'IL DÉBORDE
 * ---------------------------------
 * Affiche le libellé complet (« De retour le 1er septembre ») ; si
 * le badge qui le contient déborde (petit écran, cohabitation avec
 * « Très recommandé »…), bascule sur la version abrégée (« De
 * retour le 1er sept. »). Re-mesuré au redimensionnement — si même
 * l'abrégé ne tient pas, les points de suspension du badge font le
 * reste.
 */
export function LibelleAjuste({
  complet,
  abrege,
}: {
  complet: string;
  abrege: string;
}) {
  const repere = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (complet === abrege) return; // rien à abréger
    const texte = repere.current;
    const badge = texte?.parentElement;
    if (!texte || !badge) return;

    const ajuster = () => {
      // Toujours re-mesurer avec le texte complet (la fenêtre a pu
      // s'élargir depuis la dernière bascule)
      if (texte.textContent !== complet) texte.textContent = complet;
      if (badge.scrollWidth > badge.clientWidth) texte.textContent = abrege;
    };
    ajuster();
    window.addEventListener("resize", ajuster);
    return () => window.removeEventListener("resize", ajuster);
  }, [complet, abrege]);

  return <span ref={repere}>{complet}</span>;
}
