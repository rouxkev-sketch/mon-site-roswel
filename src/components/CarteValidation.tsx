"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { METIERS, VALIDATION_FICHE } from "@/config/roswel";
import { formatVille } from "@/lib/villes";

/** Ce que la page admin fournit pour chaque fiche à examiner */
export type FicheAExaminer = {
  id: string;
  nom_affiche: string;
  nom_societe: string | null;
  photo_url: string | null;
  bio: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  rayon_intervention_km: number;
  lien_instagram: string | null;
  siren: string | null;
  metiers: string[];
  verdictSiren: string; // résumé déjà préparé par le serveur
  sirenVerifie: boolean; // SIREN vérifié : condition pour valider
};

/**
 * CARTE D'EXAMEN D'UNE FICHE (admin, étape 8b)
 * --------------------------------------------
 * Les 3 cases du cahier des charges, cochées par défaut :
 * l'admin DÉCOCHE ce qui ne va pas. Tout coché → « Valider ».
 * Au moins une décochée → « Demander des modifications » : les
 * messages types correspondants partent automatiquement, aucun
 * texte à rédiger.
 * RÈGLE ABSOLUE : sans SIREN vérifié, le bouton « Valider » reste
 * verrouillé (le serveur re-vérifie aussi de son côté).
 */
export function CarteValidation({ fiche }: { fiche: FicheAExaminer }) {
  const router = useRouter();
  const [cochees, setCochees] = useState<Record<string, boolean>>(
    Object.fromEntries(VALIDATION_FICHE.map(({ cle }) => [cle, true]))
  );
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);

  const toutCoche = VALIDATION_FICHE.every(({ cle }) => cochees[cle]);

  async function envoyer(action: "valider" | "demander") {
    setEnCours(true);
    setRetour(null);
    try {
      const reponse = await fetch("/api/admin/validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: fiche.id,
          action,
          casesCochees: VALIDATION_FICHE.filter(({ cle }) => cochees[cle]).map(
            ({ cle }) => cle
          ),
        }),
      });
      const resultat = (await reponse.json()) as { ok: boolean; message: string };
      setRetour(`${resultat.ok ? "✅" : "❌"} ${resultat.message}`);
      if (resultat.ok) {
        setTimeout(() => router.refresh(), 900); // la fiche quitte la liste
      }
    } catch {
      setRetour("❌ Pas de réponse du serveur.");
    }
    setEnCours(false);
  }

  const libellesMetiers = fiche.metiers
    .map((slug) => METIERS.find((m) => m.slug === slug)?.label ?? slug)
    .join(" · ");

  return (
    <div className="rounded-3xl border border-bordure p-4 flex flex-col gap-4">
      {/* Aperçu de la fiche */}
      <div className="flex gap-3.5">
        {fiche.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fiche.photo_url}
            alt={`Photo de ${fiche.nom_affiche}`}
            className="w-20 h-20 rounded-2xl object-cover border border-bordure shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-fond-doux border border-bordure flex items-center justify-center text-xl shrink-0">
            ❓
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold">{fiche.nom_affiche}</p>
          {fiche.nom_societe && (
            <p className="text-xs text-encre-douce">🏢 {fiche.nom_societe}</p>
          )}
          <p className="text-xs text-encre-douce">{libellesMetiers}</p>
          <p className="text-xs text-encre-douce mt-1">
            📍{" "}
            {fiche.ville_nom
              ? formatVille(fiche.ville_nom, fiche.ville_code_postal)
              : "ville manquante"}{" "}
            · {fiche.rayon_intervention_km} km
          </p>
          {fiche.lien_instagram && (
            <a
              href={fiche.lien_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primaire underline break-all"
            >
              {fiche.lien_instagram} ↗
            </a>
          )}
        </div>
      </div>

      {fiche.bio && <p className="text-sm text-encre-douce">{fiche.bio}</p>}

      {/* Verdict SIREN préparé par le serveur */}
      <p className="text-xs rounded-xl bg-fond-doux border border-bordure px-3 py-2">
        {fiche.verdictSiren}
      </p>

      {/* Les 3 cases à cocher du cahier des charges */}
      <fieldset className="flex flex-col gap-1.5">
        {VALIDATION_FICHE.map(({ cle, label }) => (
          <label
            key={cle}
            className="flex items-center gap-2.5 text-sm min-h-[40px] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={cochees[cle]}
              onChange={(e) =>
                setCochees({ ...cochees, [cle]: e.target.checked })
              }
              className="w-4.5 h-4.5 accent-(--rw-primaire)"
            />
            {label}
          </label>
        ))}
      </fieldset>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!toutCoche || !fiche.sirenVerifie || enCours}
          onClick={() => envoyer("valider")}
          title={
            fiche.sirenVerifie
              ? undefined
              : "Validation impossible : le SIREN n'est pas vérifié."
          }
          className="flex-1 bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[46px] text-sm transition-colors disabled:opacity-40"
        >
          ✅ Valider la fiche
        </button>
        <button
          type="button"
          disabled={toutCoche || enCours}
          onClick={() => envoyer("demander")}
          className="flex-1 border border-bordure font-semibold rounded-full min-h-[46px] text-sm hover:bg-fond-doux transition-colors disabled:opacity-40"
        >
          ✏️ Demander des modifications
        </button>
      </div>
      <p className="text-xs text-encre-douce -mt-2">
        {fiche.sirenVerifie
          ? "Tout coché → valider. Au moins une case décochée → les messages types correspondants partent automatiquement."
          : "⚠️ SIREN non vérifié : la validation est verrouillée tant que l'annuaire officiel ne confirme pas l'entreprise."}
      </p>

      {retour && <p className="text-sm">{retour}</p>}
    </div>
  );
}
