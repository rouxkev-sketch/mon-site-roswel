"use client";

import { useEffect, useRef, useState } from "react";
import {
  lignesDuJournal,
  noter,
  sondeBasculeArmee,
  souscrireAuJournal,
} from "@/lib/journal-bascule";

/**
 * LA SONDE-JOURNAL DE LA BASCULE — elle enregistre, elle ne corrige
 * rien
 * ==================================================================
 * (passe nº 173)
 *
 * Sur iPhone, au clic sur l'un des deux boutons de bascule, tout le
 * contenu disparaît une fraction de seconde puis revient —
 * systématique sur téléphone, inexistant sur web. Cette sonde donne
 * LES YEUX : un journal horodaté, sur l'appareil du propriétaire, avec
 * un bouton COPIER.
 *
 * CE QU'ELLE ENREGISTRE (les six points demandés) :
 *  1. les clics sur les deux boutons de bascule, avec la valeur qui en
 *     résulte (écrit par MoteurTatouage) ;
 *  2. chaque changement de `innerWidth` / `innerHeight` ;
 *  3. chaque `resize` et `scroll` du `visualViewport`, avec largeur,
 *     hauteur et `offsetTop` — c'est là que la barre d'adresse d'iOS
 *     se voit passer ;
 *  4. la valeur du crochet d'appareil à chaque changement, avec la
 *     largeur du moment (écrit par lib/appareil) ;
 *  5. chaque MONTAGE et chaque DÉMONTAGE de la mosaïque et de son
 *     conteneur de page, avec un COMPTEUR D'INSTANCES (écrit par
 *     GrilleTatoueurs et IndexTatoueurs) ;
 *  6. le nombre de cartes rendues, à chaque rendu de la mosaïque.
 *
 * ⚠️ AUCUN ÉTAT REACT pour le journal : il vit dans un module
 * (lib/journal-bascule) et s'écrit directement dans le nœud de la
 * sonde. Un enregistrement ne provoque aucun rendu — la sonde ne peut
 * donc pas déranger ce qu'elle observe.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier, la ligne
 * `<SondeBascule />` de src/app/(tatouage)/layout.tsx, le module
 * lib/journal-bascule.ts, et les appels à `noter…` qui le nomment.
 */

/** Ce que le viewport dit, en une ligne courte. */
function mesureFenetre(): string {
  const visuel = window.visualViewport;
  return (
    `fenêtre ${window.innerWidth}×${window.innerHeight}` +
    (visuel
      ? ` · visuel ${Math.round(visuel.width)}×${Math.round(visuel.height)} @${Math.round(visuel.offsetTop)}`
      : " · (pas de viewport visuel)")
  );
}

export function SondeBascule() {
  const [armee, setArmee] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sondeBasculeArmee()) return;
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  /* ---- LES ÉCOUTEURS : fenêtre et viewport visuel ---- */
  useEffect(() => {
    if (!armee) return;
    noter(`— sonde armée · ${mesureFenetre()} · ${navigator.userAgent}`);
    //  LA DÉTECTION MOBILE DE LA MOSAÏQUE (point 4). Sur l'index, elle
    //  ne passe PAS par le crochet `useAppareilMobile` mais par
    //  `data-appareil` sur <html>, posé avant la peinture d'après
    //  `matchMedia("(pointer: coarse)")` — la variante CSS `mobile:` s'y
    //  accroche. AUCUN SEUIL DE LARGEUR n'est en jeu. On note sa valeur
    //  de départ, puis CHAQUE changement, avec la largeur du moment.
    const racine = document.documentElement;
    noter(
      `APPAREIL (départ) data-appareil="${racine.dataset.appareil ?? "(absent)"}" · ` +
        `largeur ${window.innerWidth} · pointer:coarse = ${
          window.matchMedia?.("(pointer: coarse)").matches
        } — aucun seuil de largeur`
    );
    let appareilConnu = racine.dataset.appareil ?? "(absent)";
    const oeil = new MutationObserver(() => {
      const valeur = racine.dataset.appareil ?? "(absent)";
      if (valeur === appareilConnu) return;
      noter(
        `APPAREIL "${appareilConnu}" → "${valeur}" · largeur ${window.innerWidth}`
      );
      appareilConnu = valeur;
    });
    oeil.observe(racine, {
      attributes: true,
      attributeFilter: ["data-appareil"],
    });

    let largeur = window.innerWidth;
    let hauteur = window.innerHeight;
    const auRedimensionnement = () => {
      if (window.innerWidth === largeur && window.innerHeight === hauteur) {
        return;
      }
      noter(
        `FENÊTRE ${largeur}×${hauteur} → ${window.innerWidth}×${window.innerHeight}`
      );
      largeur = window.innerWidth;
      hauteur = window.innerHeight;
    };

    const visuel = window.visualViewport;
    const auVisuel = (evenement: Event) => {
      if (!visuel) return;
      noter(
        `VISUEL ${evenement.type} · ${Math.round(visuel.width)}×${Math.round(
          visuel.height
        )} · offsetTop ${Math.round(visuel.offsetTop)}`
      );
    };

    window.addEventListener("resize", auRedimensionnement, { passive: true });
    visuel?.addEventListener("resize", auVisuel, { passive: true });
    visuel?.addEventListener("scroll", auVisuel, { passive: true });
    return () => {
      oeil.disconnect();
      window.removeEventListener("resize", auRedimensionnement);
      visuel?.removeEventListener("resize", auVisuel);
      visuel?.removeEventListener("scroll", auVisuel);
    };
  }, [armee]);

  /* ---- L'AFFICHAGE : écrit à la main, jamais par un rendu ---- */
  useEffect(() => {
    if (!armee) return;
    const ecrire = () => {
      const noeud = zone.current;
      if (!noeud) return;
      const lignes = lignesDuJournal();
      noeud.textContent = "";
      for (const ligne of lignes) {
        const div = document.createElement("div");
        div.style.cssText =
          "display:flex;gap:6px;align-items:baseline;padding:1px 0";
        const t = document.createElement("span");
        t.style.cssText = "color:#9AA0A6;min-width:52px;flex-shrink:0";
        t.textContent = `${ligne.t}`;
        const texte = document.createElement("span");
        texte.style.cssText = /DÉMONTAGE|MONTAGE/.test(ligne.texte)
          ? "color:#EE3D6F;font-weight:700;word-break:break-word"
          : "color:#FFF;word-break:break-word";
        texte.textContent = ligne.texte;
        div.append(t, texte);
        noeud.append(div);
      }
      //  Le dernier événement reste sous les yeux.
      noeud.scrollTop = noeud.scrollHeight;
    };
    ecrire();
    return souscrireAuJournal(ecrire);
  }, [armee]);

  if (!armee) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        bottom: 6,
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
        maxHeight: "52vh",
      }}
    >
      <div
        style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}
      >
        <span style={{ color: "#EE3D6F", fontWeight: 700, flex: 1 }}>
          JOURNAL BASCULE
        </span>
        <button
          type="button"
          onClick={() => {
            const texte = lignesDuJournal()
              .map((l) => `${l.t}\t${l.texte}`)
              .join("\n");
            void navigator.clipboard?.writeText(texte);
          }}
          style={{
            background: "#EE3D6F",
            color: "#FFFFFF",
            border: 0,
            borderRadius: 10,
            //  Atteignable au pouce : 44 px de haut, large.
            minHeight: 44,
            padding: "0 22px",
            font: "inherit",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          COPIER
        </button>
      </div>
      <div ref={zone} style={{ overflow: "auto", flex: 1 }} />
    </div>
  );
}
