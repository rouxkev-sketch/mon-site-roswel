"use client";

import { useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";
import {
  lignesDuJournal,
  mesureDuDocument,
  noter,
  sauvegarderMaintenant,
  sondeCartesArmee,
  souscrireAuJournal,
} from "@/lib/journal-cartes";

/**
 * LA SONDE DES CARTES — `?sonde-cartes=1`
 * ==================================================================
 * (passe nº 224-§5)
 *
 * ELLE MESURE, ELLE NE CORRIGE RIEN. Deux défauts vivent sur le
 * téléphone du propriétaire et nulle part ailleurs : « Voir plus »
 * qui déplace la page, et l'onglet que Chrome iOS tue vers
 * quatre-vingt-douze cartes. Les corrections de cette passe sont
 * appliquées sur son relevé ; celle-ci sert à VÉRIFIER qu'elles
 * tiennent, chez lui.
 *
 * CE QU'ELLE RELÈVE, à chaque clic sur « Voir plus » :
 *   · `scrollY` avant, après le rendu, et après une seconde ;
 *   · le nombre de cartes montées ;
 *   · le nombre de nœuds du document ;
 *   · le nombre d'images portant un `src` réel ;
 *   · le nombre d'observateurs vivants ;
 *   · `usePercentJSHeapSize` quand le navigateur le donne.
 *
 * FORME : la pastille repliable des sondes précédentes (nº 183),
 * COPIER en trois secours et ENVOYER vers le fichier local. Aucun état
 * React pour le journal : il vit dans lib/journal-cartes et s'écrit
 * directement dans le nœud.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : ce fichier, la ligne
 * `<SondeCartes />` du layout, le module src/lib/journal-cartes.ts et
 * les appels qui le nomment (IndexTatoueurs, GrilleTatoueurs).
 */

function journalEnTexte(): string {
  return lignesDuJournal()
    .map((ligne) => `${ligne.t}\t${ligne.texte}`)
    .join("\n");
}

export function SondeCartes() {
  const [armee, setArmee] = useState(false);
  const { repliee, basculer } = useSondeRepliee();
  const zone = useRef<HTMLDivElement>(null);
  const enTete = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sondeCartesArmee()) return;
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  /* ---- L'ARRIVÉE SUR LA PAGE, ET LE DÉPART ---- */
  useEffect(() => {
    if (!armee) return;
    noter(
      `═══ PAGE ${location.pathname}${location.search} · ` +
        `fenêtre ${window.innerWidth}×${window.innerHeight} · ${mesureDuDocument()}`
    );
    const auDepart = () => {
      noter(`DÉPART · ${mesureDuDocument()}`);
      sauvegarderMaintenant();
    };
    window.addEventListener("pagehide", auDepart);
    return () => window.removeEventListener("pagehide", auDepart);
  }, [armee]);

  /* ---- L'EN-TÊTE VIVANT : la mesure du moment, réécrite sans rendu ---- */
  useEffect(() => {
    if (!armee || repliee) return;
    const ecrire = () => {
      if (enTete.current) enTete.current.textContent = mesureDuDocument();
    };
    ecrire();
    const battement = window.setInterval(ecrire, 1000);
    return () => window.clearInterval(battement);
  }, [armee, repliee]);

  /* ---- L'AFFICHAGE : écrit à la main, jamais par un rendu ---- */
  useEffect(() => {
    if (!armee || repliee) return;
    const ecrire = () => {
      const noeud = zone.current;
      if (!noeud) return;
      noeud.textContent = "";
      for (const ligne of lignesDuJournal()) {
        const div = document.createElement("div");
        div.style.cssText =
          "display:flex;gap:6px;align-items:baseline;padding:1px 0";
        const t = document.createElement("span");
        t.style.cssText = "color:#9AA0A6;min-width:52px;flex-shrink:0";
        t.textContent = `${ligne.t}`;
        const texte = document.createElement("span");
        texte.style.cssText = /écart (?!0 )/.test(ligne.texte)
          ? "color:#EE3D6F;font-weight:700;word-break:break-word"
          : /═══|▶/.test(ligne.texte)
            ? "color:#8FE28F;word-break:break-word"
            : "color:#FFF;word-break:break-word";
        texte.textContent = ligne.texte;
        div.append(t, texte);
        noeud.append(div);
      }
      noeud.scrollTop = noeud.scrollHeight;
    };
    ecrire();
    return souscrireAuJournal(ecrire);
  }, [armee, repliee]);

  if (!armee) return null;
  if (repliee) {
    //  268 px du bas : les six autres pastilles occupent 8, 60, 112,
    //  164 et 216 — deux sondes armées ensemble ne se couvrent pas.
    return (
      <PastilleSonde
        lettre="M"
        titre="Sonde cartes"
        surToucher={basculer}
        bas={268}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        bottom: "max(6px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #EE3D6F",
        borderRadius: 12,
        padding: "8px 10px 10px",
        font: "12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "50vh",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#EE3D6F", fontWeight: 700, flex: 1 }}>
          JOURNAL CARTES
        </span>
        <BoutonReplier surToucher={basculer} />
      </div>
      {/*  LA MESURE DU MOMENT, toujours sous les yeux : c'est elle qui
           dit si le coût grimpe avec les cartes. */}
      <div
        ref={enTete}
        style={{
          color: "#FFD37A",
          fontWeight: 700,
          flexShrink: 0,
          wordBreak: "break-word",
        }}
      />
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <BoutonCopierJournal texte={journalEnTexte} pleineLargeur />
        <BoutonEnvoyerJournal sonde="cartes" texte={journalEnTexte} pleineLargeur />
      </div>
      <div ref={zone} style={{ overflow: "auto", flex: 1 }} />
    </div>
  );
}
