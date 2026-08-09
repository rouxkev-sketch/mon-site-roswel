"use client";

import { useState } from "react";

type Resultat = {
  ok: boolean;
  message: string;
  modifications?: Array<Record<string, string | number>>;
};

/** Le bouton qui déclenche le recalcul de tous les scores. */
export function BoutonRecalculScores() {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);

  async function lancer() {
    setEnCours(true);
    setResultat(null);
    try {
      const reponse = await fetch("/api/admin/recalculer-scores", {
        method: "POST",
      });
      setResultat((await reponse.json()) as Resultat);
    } catch {
      setResultat({
        ok: false,
        message: "Pas de réponse. Vérifier que `npm run dev` tourne, puis réessayer.",
      });
    }
    setEnCours(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={lancer}
        disabled={enCours}
        className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-8 min-h-[48px] transition-colors disabled:opacity-60"
      >
        {enCours ? "Recalcul en cours…" : "Recalculer tous les scores"}
      </button>

      {resultat && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            resultat.ok
              ? "border-succes/40 bg-succes/5"
              : "border-erreur/40 bg-erreur/5"
          }`}
        >
          <p className="font-semibold mb-2">
            {resultat.ok ? "✅ " : "❌ "}
            {resultat.message}
          </p>
          {resultat.modifications && resultat.modifications.length > 0 && (
            <ul className="space-y-1 text-encre-douce">
              {resultat.modifications.map((m) => (
                <li key={String(m.artisan)}>
                  {m.artisan} : {m.avant} → <strong>{m.apres}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
