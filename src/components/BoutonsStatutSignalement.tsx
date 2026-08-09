"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * BOUTONS DE STATUT D'UN SIGNALEMENT (admin)
 * ------------------------------------------
 * Trois états : « nouveau », « traité », « rejeté ». Le statut
 * courant est mis en évidence ; cliquer sur un autre l'applique
 * (via /api/admin/signalements) puis rafraîchit la liste.
 */
const CHOIX: Array<{ cle: string; label: string }> = [
  { cle: "nouveau", label: "Nouveau" },
  { cle: "traite", label: "Traité" },
  { cle: "rejete", label: "Rejeté" },
];

export function BoutonsStatutSignalement({
  signalementId,
  statut,
}: {
  signalementId: string;
  statut: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function changer(nouveau: string) {
    if (nouveau === statut || enCours) return;
    setEnCours(true);
    try {
      await fetch("/api/admin/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalementId, statut: nouveau }),
      });
      router.refresh();
    } catch {
      // silencieux : l'admin réessaiera
    }
    setEnCours(false);
  }

  return (
    <div className="flex gap-1.5">
      {CHOIX.map(({ cle, label }) => {
        const actif = cle === statut;
        return (
          <button
            key={cle}
            type="button"
            disabled={enCours}
            onClick={() => changer(cle)}
            className={`text-xs font-semibold rounded-full px-3 min-h-[34px] border transition-colors disabled:opacity-50 ${
              actif
                ? "bg-primaire text-white border-primaire"
                : "border-bordure hover:bg-fond-doux"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
