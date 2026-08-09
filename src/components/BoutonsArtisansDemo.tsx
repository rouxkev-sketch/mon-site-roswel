"use client";

import { useState } from "react";

type Resultat = {
  ok: boolean;
  message: string;
  artisans?: Array<Record<string, string | number>>;
};

/**
 * Les deux boutons de l'outil « artisans de démonstration » :
 * créer/mettre à jour le jeu d'essai, ou tout supprimer.
 */
export function BoutonsArtisansDemo() {
  const [enCours, setEnCours] = useState<null | "creer" | "supprimer">(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);

  async function lancer(action: "creer" | "supprimer") {
    setEnCours(action);
    setResultat(null);
    try {
      const reponse = await fetch("/api/admin/artisans-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setResultat((await reponse.json()) as Resultat);
    } catch {
      setResultat({
        ok: false,
        message: "Pas de réponse. Vérifier que `npm run dev` tourne, puis réessayer.",
      });
    }
    setEnCours(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => lancer("creer")}
        disabled={enCours !== null}
        className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-8 min-h-[48px] transition-colors disabled:opacity-60"
      >
        {enCours === "creer"
          ? "Création en cours…"
          : "Créer les artisans de démonstration"}
      </button>

      <button
        type="button"
        onClick={() => lancer("supprimer")}
        disabled={enCours !== null}
        className="border border-bordure text-encre-douce hover:text-erreur hover:border-erreur/40 font-semibold rounded-full px-8 min-h-[48px] transition-colors disabled:opacity-60"
      >
        {enCours === "supprimer"
          ? "Suppression en cours…"
          : "Supprimer les artisans de démonstration"}
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
          {resultat.artisans && (
            <ul className="space-y-1 text-encre-douce">
              {resultat.artisans.map((a) => (
                <li key={String(a.artisan)}>
                  {a.artisan} — score <strong>{a.score}</strong> /100, pastille{" "}
                  <strong>{a.pastille}</strong>
                  {a.statut !== "valide" ? " (non validé : invisible)" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
