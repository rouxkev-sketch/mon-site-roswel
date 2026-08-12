"use client";

import { createPortal } from "react-dom";

/**
 * LA FENÊTRE D'ENVOI (passe nº 118) — l'écran ne se fige plus.
 * =============================================================
 * Pendant l'enregistrement, la personne voyait UN bouton grisé — et
 * trente photos à envoyer, c'est de longues secondes sans un signe.
 * Cette fenêtre s'ouvre AU CLIC : d'abord le décompte des photos et
 * une barre qui avance (la seule information qui rassure : ça
 * progresse), puis « Enregistrement du portfolio… » le temps
 * d'écrire la fiche.
 *
 * PAS DE BOUTON D'ANNULATION, à dessein : interrompre au milieu ne
 * rendrait rien — les photos déjà parties sont gardées de toute
 * façon, et l'envoi ne dure que quelques secondes. Quitter la page,
 * lui, reste retenu par la garde de saisie (nº 117).
 *
 * CHARTE : le voile et le panneau de la fenêtre partagée (aucun
 * contour), la barre en `sombre-eleve`, son remplissage du SEUL rose
 * de la charte — c'est un état « sélectionné », il y a droit.
 */
export function FenetreEnvoi({
  faites,
  total,
}: {
  faites: number;
  total: number;
}) {
  const enTeleversement = total > 0 && faites < total;
  const pourcent = total > 0 ? Math.round((faites / total) * 100) : 100;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Envoi du portfolio"
      className="fixed inset-0 z-[95] flex items-center justify-center px-6 py-6"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0" />
      <div
        data-verre-fenetre=""
            className="relative w-full max-w-[400px] rounded-2xl
                   p-6 sm:p-7 text-center
                   shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
      >
        <p
          role="status"
          aria-live="polite"
          className="text-[15px] font-semibold text-sombre-texte"
        >
          {enTeleversement
            ? `Photos envoyées : ${faites}/${total}`
            : "Enregistrement du portfolio…"}
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sombre-eleve">
          <div
            className={`h-full rounded-full bg-primaire transition-[width] duration-300 ${
              enTeleversement ? "" : "animate-pulse"
            }`}
            style={{ width: enTeleversement ? `${pourcent}%` : "100%" }}
          />
        </div>
        <p className="mt-3 text-[13px] text-sombre-texte-doux">
          Garde la page ouverte, ça ne prend qu&apos;un instant.
        </p>
      </div>
    </div>,
    document.body
  );
}
