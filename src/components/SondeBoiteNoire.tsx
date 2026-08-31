"use client";

import { useEffect, useState } from "react";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";
import {
  heureLisible,
  lignesDeLaBoiteNoire,
  releveDeLaBoiteNoire,
  viderLaBoiteNoire,
  type LigneBoiteNoire,
} from "@/lib/boite-noire";

/**
 * ██ §2 (nº 654) — LA LECTURE APRÈS COUP ██
 * ==================================================================
 * ELLE NE S'ARME PAS, ELLE SE CONSULTE. C'est toute la différence avec
 * les autres sondes : le journal tourne déjà (lib/boite-noire), en
 * silence, depuis le début de la visite. Cette fenêtre-ci ne fait que
 * l'AFFICHER quand l'adresse porte `?sonde-boite-noire=1` — c'est-à-dire
 * APRÈS que le défaut a frappé, sur la page où l'on vient d'atterrir.
 * ⚠️ ELLE NE SE GARDE PAS EN MÉMOIRE, à la différence des autres : une
 * sonde armée survit aux pages, celle-ci s'affiche pour l'adresse qui
 * la demande et disparaît à la suivante. La trace, elle, continue de
 * s'écrire quoi qu'il arrive.
 * ⚠️ AUCUNE CLASSE DU SITE, QUE DU STYLE EN LIGNE : c'est la règle des
 * sondes — un outil de relevé ne doit rien devoir à la feuille qu'il
 * sert à observer, et ne doit rien y ajouter (la feuille ne bouge donc
 * pas d'un octet).
 */
export function SondeBoiteNoire() {
  const [demandee, setDemandee] = useState(false);
  const [lignes, setLignes] = useState<LigneBoiteNoire[]>([]);
  const { repliee, basculer } = useSondeRepliee();

  useEffect(() => {
    const veut =
      new URLSearchParams(window.location.search).get("sonde-boite-noire") ===
      "1";
    setDemandee(veut);
    if (veut) setLignes(lignesDeLaBoiteNoire());
  }, []);

  if (!demandee) return null;
  if (repliee) {
    return (
      <PastilleSonde
        lettre="N"
        titre="Boîte noire"
        surToucher={basculer}
        bas={64}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Boîte noire de navigation"
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        bottom: "max(6px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #E11144",
        borderRadius: 12,
        padding: "8px 10px 10px",
        font: "12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "60vh",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#E11144", fontWeight: 700, flex: 1 }}>
          BOÎTE NOIRE · {lignes.length} ligne{lignes.length > 1 ? "s" : ""}
        </span>
        <BoutonReplier surToucher={basculer} />
      </div>
      <BoutonCopierJournal texte={releveDeLaBoiteNoire} pleineLargeur />
      <div style={{ overflowY: "auto", flex: 1 }}>
        {lignes.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>
            Aucune ligne : la trace commence à l&apos;ouverture de
            l&apos;onglet.
          </p>
        ) : (
          lignes.map((ligne, rang) => (
            <p
              key={`${ligne.h}-${rang}`}
              style={{ margin: "0 0 3px", whiteSpace: "pre-wrap" }}
            >
              <span style={{ color: "#9AA1AC" }}>{heureLisible(ligne.h)}</span>{" "}
              {ligne.texte}
            </p>
          ))
        )}
      </div>
      {/*  VIDER : pour repartir d'une trace propre avant un essai. La
           page n'est pas rechargée — seule la liste affichée se vide,
           en même temps que la mémoire. */}
      <button
        type="button"
        onClick={() => {
          viderLaBoiteNoire();
          setLignes([]);
        }}
        style={{
          minHeight: 44,
          borderRadius: 8,
          border: "1px solid #3A3A42",
          background: "#14181F",
          color: "#FFFFFF",
          font: "inherit",
        }}
      >
        Vider la boîte noire
      </button>
    </div>
  );
}
