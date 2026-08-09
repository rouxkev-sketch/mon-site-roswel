"use client";

import { useState } from "react";

type ResultatImport = {
  ok: boolean;
  message: string;
  details?: Record<string, string | number>;
};

// Libellés lisibles pour les détails techniques renvoyés par l'import
const LIBELLES: Record<string, string> = {
  communes_recues: "Communes reçues de l'annuaire",
  communes_enregistrees: "Communes enregistrées dans la base",
  ignorees_sans_gps: "Ignorées (sans coordonnées GPS)",
  zone: "Zone importée",
  duree_secondes: "Durée (secondes)",
};

/**
 * Le bouton qui déclenche l'import des communes, avec l'affichage
 * du déroulement et du résultat. (La mécanique elle-même est dans
 * src/app/api/admin/import-communes/route.ts.)
 */
export function BoutonImportCommunes() {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatImport | null>(null);

  async function lancerImport() {
    setEnCours(true);
    setResultat(null);
    try {
      const reponse = await fetch("/api/admin/import-communes", {
        method: "POST",
      });
      setResultat((await reponse.json()) as ResultatImport);
    } catch {
      setResultat({
        ok: false,
        message:
          "L'import ne répond pas. Vérifier que `npm run dev` tourne toujours, puis réessayer.",
      });
    }
    setEnCours(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={lancerImport}
        disabled={enCours}
        className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-8 min-h-[48px] transition-colors disabled:opacity-60"
      >
        {enCours ? "Import en cours… (1 à 2 minutes)" : "Lancer l'import"}
      </button>

      {enCours && (
        <p className="text-sm text-encre-douce text-center">
          Téléchargement des communes puis enregistrement dans la base…
          Laisser cette page ouverte.
        </p>
      )}

      {resultat && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            resultat.ok
              ? "border-succes/40 bg-succes/5 text-encre"
              : "border-erreur/40 bg-erreur/5 text-encre"
          }`}
        >
          <p className="font-semibold mb-2">
            {resultat.ok ? "✅ " : "❌ "}
            {resultat.message}
          </p>
          {resultat.details && (
            <ul className="space-y-1 text-encre-douce">
              {Object.entries(resultat.details).map(([cle, valeur]) => (
                <li key={cle}>
                  {LIBELLES[cle] ?? cle} : <strong>{valeur}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
