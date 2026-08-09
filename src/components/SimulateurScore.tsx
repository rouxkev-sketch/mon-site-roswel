"use client";

import { useState } from "react";
import {
  SCORE_ANCIENNETE,
  SCORE_INSTAGRAM,
  SCORE_GOOGLE,
  SCORE_TOTAL_MAXIMUM,
} from "@/config/roswel";
import {
  calculerScoreGoogle,
  calculerScoreInstagram,
  determinerPastille,
  pointsAnciennete,
} from "@/lib/score";
import { BadgeNiveau } from "@/components/Pastille";

/** "4,8" ou "4.8" → 4.8 ; texte vide ou illisible → null */
function lireNombre(texte: string): number | null {
  if (texte.trim() === "") return null;
  const nombre = Number(texte.replace(",", "."));
  return Number.isFinite(nombre) ? nombre : null;
}

/**
 * SIMULATEUR DE SCORE
 * -------------------
 * On tape les chiffres d'un artisan, le score se calcule en direct
 * avec les VRAIES fonctions du site (src/lib/score.ts) et les
 * grilles du fichier de réglages central : Instagram (40) +
 * avis Google (40) + ancienneté de l'entreprise (20, via Sirene).
 */
export function SimulateurScore() {
  const [abonnes, setAbonnes] = useState("1850");
  const [publications, setPublications] = useState("210");
  const [note, setNote] = useState("4,8");
  const [avis, setAvis] = useState("127");
  const [anciennete, setAnciennete] = useState("6");

  const scoreInstagram = calculerScoreInstagram(
    lireNombre(abonnes),
    lireNombre(publications)
  );
  const scoreGoogle = calculerScoreGoogle(lireNombre(note), lireNombre(avis));
  const scoreAnciennete = pointsAnciennete(
    Math.max(0, lireNombre(anciennete) ?? 0)
  );
  const total = scoreInstagram + scoreGoogle + scoreAnciennete;
  const pastille = determinerPastille(total);

  const champs = [
    { label: "Abonnés Instagram", valeur: abonnes, poser: setAbonnes, mode: "numeric" },
    { label: "Publications Instagram", valeur: publications, poser: setPublications, mode: "numeric" },
    { label: "Note Google (0 à 5)", valeur: note, poser: setNote, mode: "decimal" },
    { label: "Nombre d'avis Google", valeur: avis, poser: setAvis, mode: "numeric" },
    { label: "Années d'existence (Sirene)", valeur: anciennete, poser: setAnciennete, mode: "numeric" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* Les 4 chiffres d'entrée */}
      <div className="grid grid-cols-2 gap-3">
        {champs.map(({ label, valeur, poser, mode }) => (
          <label key={label} className="block">
            <span className="block text-xs font-medium mb-1">{label}</span>
            <input
              type="text"
              inputMode={mode}
              value={valeur}
              onChange={(evenement) => poser(evenement.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-bordure bg-fond px-3 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
            />
          </label>
        ))}
      </div>

      {/* Le résultat, calculé en direct */}
      <div className="rounded-2xl border border-bordure bg-fond-doux p-4">
        <div className="flex justify-between text-sm py-1">
          <span className="text-encre-douce">Score Instagram</span>
          <span className="font-semibold">
            {scoreInstagram} / {SCORE_INSTAGRAM.maximum}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-encre-douce">Score avis Google</span>
          <span className="font-semibold">
            {scoreGoogle} / {SCORE_GOOGLE.maximum}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-encre-douce">Score ancienneté</span>
          <span className="font-semibold">
            {scoreAnciennete} / {SCORE_ANCIENNETE.maximum}
          </span>
        </div>

        <div className="flex justify-between items-center border-t border-bordure mt-2 pt-3">
          <span className="font-semibold">Score de confiance</span>
          <span className="text-2xl font-semibold">
            {total}
            <span className="text-sm text-encre-douce font-normal">
              {" "}/ {SCORE_TOTAL_MAXIMUM}
            </span>
          </span>
        </div>

        {/* Jauge : rose sur piste rose clair */}
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={SCORE_TOTAL_MAXIMUM}
          aria-valuenow={total}
          aria-label="Score de confiance"
          className="h-2 rounded-full bg-primaire-clair mt-3 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-primaire transition-all"
            style={{ width: `${(total / SCORE_TOTAL_MAXIMUM) * 100}%` }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-encre-douce">Badge de niveau :</span>
          {pastille ? (
            <BadgeNiveau code={pastille} />
          ) : (
            <span className="text-encre-douce text-xs">
              aucun (score sous 40 : carte à bordure grise, sans
              onglet de niveau)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
