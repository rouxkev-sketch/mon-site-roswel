"use client";

import { useState } from "react";

/**
 * LE BOUTON « ENVOYER » DES SONDES (nº 174-§3)
 * ============================================
 * « Le bouton COPIER de la sonde bascule ne fonctionne pas sur mon
 * iPhone. Je veux un chemin qui ne dépend pas du presse-papier. »
 *
 * Celui-ci n'y touche pas : il POSTE le journal vers
 * `/api/dev/journal-sonde`, qui l'écrit dans un fichier à la racine du
 * projet (route de DÉVELOPPEMENT uniquement — 404 en production).
 * Le nom du fichier écrit s'affiche sous le bouton : on sait tout de
 * suite que c'est parti, et où.
 *
 * ⚠️ COPIER RESTE EN PLACE à côté : il sert sur les autres appareils.
 *
 * ⚠️ TEMPORAIRE, comme les sondes. Pour le retirer : ce fichier, les
 * `<BoutonEnvoyerJournal …/>` des sondes, et le dossier
 * src/app/api/dev/journal-sonde.
 */
export function BoutonEnvoyerJournal({
  sonde,
  texte,
  pleineLargeur = false,
}: {
  /** Le nom qui donnera celui du fichier : « bascule », « verre »… */
  sonde: string;
  /** Le journal COMPLET, lu au moment du clic (jamais avant). */
  texte: () => string;
  /** Dans les sondes dont les boutons occupent toute la ligne. */
  pleineLargeur?: boolean;
}) {
  const [etat, setEtat] = useState<"repos" | "envoi" | "fait" | "raté">(
    "repos"
  );
  const [dit, setDit] = useState("");

  async function envoyer() {
    setEtat("envoi");
    setDit("");
    try {
      const reponse = await fetch("/api/dev/journal-sonde", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sonde, texte: texte() }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        fichier?: string;
        erreur?: string;
      } | null;
      if (!reponse.ok) {
        setEtat("raté");
        setDit(donnees?.erreur ?? `refus ${reponse.status}`);
        return;
      }
      setEtat("fait");
      setDit(donnees?.fichier ?? "écrit");
    } catch (erreur) {
      setEtat("raté");
      setDit(erreur instanceof Error ? erreur.message : "envoi impossible");
    }
  }

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 4,
        ...(pleineLargeur ? { flex: 1 } : {}),
      }}
    >
      <button
        type="button"
        onClick={() => void envoyer()}
        style={{
          //  Atteignable au pouce, comme COPIER.
          minHeight: 44,
          padding: "0 18px",
          borderRadius: 10,
          border: "2px solid #EE3D6F",
          background: "transparent",
          color: "#EE3D6F",
          font: "700 14px ui-monospace, SFMono-Regular, Menlo, monospace",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {etat === "envoi" ? "ENVOI…" : "ENVOYER"}
      </button>
      {dit !== "" && (
        <span
          style={{
            font: "11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace",
            color: etat === "raté" ? "#FF8A8A" : "#9AA0A6",
            wordBreak: "break-all",
          }}
        >
          {etat === "raté" ? `échec : ${dit}` : dit}
        </span>
      )}
    </span>
  );
}
