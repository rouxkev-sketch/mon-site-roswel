"use client";

import { useState } from "react";
import { FRAICHEUR_INSTAGRAM_JOURS } from "@/config/roswel";

/** Ce que la page admin fournit pour chaque artisan */
export type ArtisanInstagram = {
  id: string;
  nom_affiche: string;
  lien_instagram: string | null;
  abonnes_instagram: number | null;
  publications_instagram: number | null;
  joursDepuisMaj: number | null; // calculé par la page (null = jamais renseigné)
  score_total: number;
  pastille: string | null;
  statut_validation: string;
};

/**
 * LIGNE DE SAISIE INSTAGRAM (admin, étape 8b)
 * -------------------------------------------
 * L'admin consulte le compte Instagram (lien), relève abonnés et
 * publications, enregistre : le score est recalculé AUTOMATIQUEMENT
 * (cahier des charges §5). Les données de plus de 30 jours (réglable
 * dans la config) sont signalées par une alerte.
 */
export function LigneInstagram({ artisan }: { artisan: ArtisanInstagram }) {
  const [abonnes, setAbonnes] = useState(
    artisan.abonnes_instagram?.toString() ?? ""
  );
  const [publications, setPublications] = useState(
    artisan.publications_instagram?.toString() ?? ""
  );
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);

  // Fraîcheur des données : jamais renseignées, ou trop vieilles ?
  const { joursDepuisMaj } = artisan;
  const alerte =
    joursDepuisMaj === null || joursDepuisMaj > FRAICHEUR_INSTAGRAM_JOURS;

  async function enregistrer() {
    setEnCours(true);
    setRetour(null);
    try {
      const reponse = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: artisan.id,
          abonnes: Number(abonnes),
          publications: Number(publications),
        }),
      });
      const resultat = (await reponse.json()) as {
        ok: boolean;
        message: string;
        score?: number;
        pastille?: string | null;
      };
      setRetour(
        resultat.ok
          ? `✅ ${resultat.message}`
          : `❌ ${resultat.message}`
      );
    } catch {
      setRetour("❌ Pas de réponse du serveur.");
    }
    setEnCours(false);
  }

  return (
    <div className="rounded-2xl border border-bordure p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            {artisan.nom_affiche}
            {artisan.statut_validation !== "valide" && (
              <span className="text-encre-douce font-normal"> (non validé)</span>
            )}
          </p>
          {artisan.lien_instagram && (
            <a
              href={artisan.lien_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primaire underline break-all"
            >
              Ouvrir son Instagram ↗
            </a>
          )}
        </div>
        <span className="text-xs text-encre-douce whitespace-nowrap">
          Score : <strong>{artisan.score_total}</strong>
        </span>
      </div>

      {/* Fraîcheur des données */}
      <p
        className={`text-xs rounded-xl px-3 py-2 ${
          alerte
            ? "bg-alerte/10 text-encre border border-alerte/40"
            : "bg-fond-doux text-encre-douce border border-bordure"
        }`}
      >
        {joursDepuisMaj === null
          ? "⚠️ Chiffres jamais renseignés : le score Instagram vaut 0."
          : alerte
            ? `⚠️ Dernière mise à jour il y a ${joursDepuisMaj} jours (seuil : ${FRAICHEUR_INSTAGRAM_JOURS}). À rafraîchir.`
            : `À jour : dernière mise à jour il y a ${joursDepuisMaj} jour(s).`}
      </p>

      <div className="flex items-end gap-2">
        <label className="flex-1 text-xs font-medium">
          Abonnés
          <input
            type="text"
            inputMode="numeric"
            value={abonnes}
            onChange={(e) => setAbonnes(e.target.value)}
            className="mt-1 w-full min-h-[42px] rounded-xl border border-bordure px-3 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
          />
        </label>
        <label className="flex-1 text-xs font-medium">
          Publications
          <input
            type="text"
            inputMode="numeric"
            value={publications}
            onChange={(e) => setPublications(e.target.value)}
            className="mt-1 w-full min-h-[42px] rounded-xl border border-bordure px-3 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
          />
        </label>
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || abonnes === "" || publications === ""}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-5 min-h-[42px] text-sm transition-colors disabled:opacity-50"
        >
          {enCours ? "…" : "Enregistrer"}
        </button>
      </div>

      {retour && <p className="text-sm">{retour}</p>}
    </div>
  );
}
