"use client";

import { useState } from "react";

export type ArtisanAvisGoogle = {
  id: string;
  nom_affiche: string;
  adresse: string | null;
  place_id_google: string | null;
  note_google: number | null;
  nombre_avis_google: number | null;
  score_total: number;
};

type Candidat = {
  placeId: string;
  nom: string;
  adresse: string;
  note: number | null;
  avis: number | null;
};

/**
 * LIGNE « AVIS GOOGLE » D'UN ARTISAN (admin, étape 11)
 * ----------------------------------------------------
 * Sans fiche associée : rechercher sa fiche Google puis l'associer.
 * Avec fiche : rafraîchir la note (score recalculé automatiquement).
 */
export function LigneAvisGoogle({ artisan }: { artisan: ArtisanAvisGoogle }) {
  const [requete, setRequete] = useState(
    `${artisan.nom_affiche} ${artisan.adresse ?? ""}`.trim()
  );
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);

  async function appeler(corps: object): Promise<Record<string, unknown>> {
    const reponse = await fetch("/api/admin/avis-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return (await reponse.json()) as Record<string, unknown>;
  }

  async function rechercher() {
    setEnCours(true);
    setRetour(null);
    setCandidats([]);
    try {
      const resultat = await appeler({ action: "rechercher", requete });
      if (resultat.ok) {
        const trouves = resultat.candidats as Candidat[];
        setCandidats(trouves);
        if (trouves.length === 0) setRetour("Aucune fiche Google trouvée.");
      } else {
        setRetour(`❌ ${resultat.message}`);
      }
    } catch {
      setRetour("❌ Pas de réponse du serveur.");
    }
    setEnCours(false);
  }

  async function associerOuRafraichir(placeId?: string) {
    setEnCours(true);
    setRetour(null);
    try {
      const resultat = await appeler(
        placeId
          ? { action: "associer", artisanId: artisan.id, placeId }
          : { action: "rafraichir", artisanId: artisan.id }
      );
      setRetour(resultat.ok ? `✅ ${resultat.message}` : `❌ ${resultat.message}`);
      if (resultat.ok) setCandidats([]);
    } catch {
      setRetour("❌ Pas de réponse du serveur.");
    }
    setEnCours(false);
  }

  return (
    <div className="rounded-2xl border border-bordure p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{artisan.nom_affiche}</p>
          <p className="text-xs text-encre-douce">
            {artisan.place_id_google
              ? `⭐ ${artisan.note_google ?? "—"} (${artisan.nombre_avis_google ?? 0} avis) — fiche Google associée`
              : "Pas encore de fiche Google associée"}
          </p>
        </div>
        <span className="text-xs text-encre-douce whitespace-nowrap">
          Score : <strong>{artisan.score_total}</strong>
        </span>
      </div>

      {artisan.place_id_google ? (
        <button
          type="button"
          onClick={() => associerOuRafraichir()}
          disabled={enCours}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[42px] text-sm transition-colors disabled:opacity-60"
        >
          {enCours ? "…" : "Rafraîchir la note Google"}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Nom de l'entreprise + ville"
            className="flex-1 min-h-[42px] rounded-xl border border-bordure px-3 text-sm outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
          />
          <button
            type="button"
            onClick={rechercher}
            disabled={enCours || requete.trim().length < 3}
            className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-4 min-h-[42px] text-sm transition-colors disabled:opacity-50 shrink-0"
          >
            {enCours ? "…" : "Chercher"}
          </button>
        </div>
      )}

      {candidats.length > 0 && (
        <ul className="flex flex-col gap-2">
          {candidats.map((candidat) => (
            <li
              key={candidat.placeId}
              className="rounded-xl bg-fond-doux border border-bordure p-3 text-sm flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{candidat.nom}</p>
                <p className="text-xs text-encre-douce truncate">
                  {candidat.adresse}
                  {candidat.note != null &&
                    ` · ⭐ ${candidat.note} (${candidat.avis} avis)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => associerOuRafraichir(candidat.placeId)}
                disabled={enCours}
                className="border border-primaire text-primaire font-semibold rounded-full px-3 min-h-[38px] text-xs shrink-0 hover:bg-primaire-clair transition-colors disabled:opacity-50"
              >
                Associer
              </button>
            </li>
          ))}
        </ul>
      )}

      {retour && <p className="text-sm">{retour}</p>}
    </div>
  );
}
