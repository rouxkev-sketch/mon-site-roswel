"use client";

import { useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";

/**
 * LA SONDE DU VERRE — ELLE MESURE CHEZ LE PROPRIÉTAIRE, ET NE CORRIGE
 * RIEN
 * ==================================================================
 * (passe nº 169-§2)
 *
 * SON SYMPTÔME : on voit à travers la barre fixe, mais le contenu
 * n'est PAS flou — un fond semi-transparent, sans aucun flou. Ici, le
 * flou fonctionne. Il est donc ANNULÉ CHEZ LUI, et un `backdrop-filter`
 * ne s'annule que d'une façon : un ANCÊTRE qui crée un contexte
 * d'isolation (transformation, filtre, perspective, `contain`,
 * `will-change`, `isolation`, opacité < 1, débordement caché…). Cette
 * sonde déroule donc toute la chaîne, de <html> à la barre, et signale
 * chaque coupable.
 *
 * ELLE AFFICHE, lu dans SON navigateur :
 *  a) l'élément qui porte le fond : chemin du fichier + composant, dits
 *     par la page elle-même (`data-source-*`) ;
 *  b) `backdrop-filter` ET `-webkit-backdrop-filter` réellement
 *     calculés sur cet élément ;
 *  c) `background-color` calculé, avec sa valeur alpha ;
 *  d) le résultat de `CSS.supports('backdrop-filter: blur(1px)')` ;
 *  e) LA CHAÎNE COMPLÈTE DES PARENTS, de <html> jusqu'à la barre, en
 *     signalant ceux qui portent de quoi annuler le flou ;
 *  f) le navigateur et sa version.
 *
 * ELLE NE FAIT QUE LIRE, ne s'arme que sur `?sonde-verre=1`, et écrit
 * dans son seul nœud.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier et la ligne
 * `<SondeVerre />` de src/app/(tatouage)/layout.tsx.
 */

/** Ce qui, chez un ancêtre, ANNULE un `backdrop-filter`. */
function cequiAnnule(style: CSSStyleDeclaration): string[] {
  const causes: string[] = [];
  if (style.transform !== "none") causes.push(`transform ${style.transform}`);
  if (style.filter !== "none") causes.push(`filter ${style.filter}`);
  if (style.perspective !== "none") {
    causes.push(`perspective ${style.perspective}`);
  }
  if (style.contain !== "none" && style.contain !== "") {
    causes.push(`contain ${style.contain}`);
  }
  if (style.willChange !== "auto" && style.willChange !== "") {
    causes.push(`will-change ${style.willChange}`);
  }
  if (style.isolation !== "auto") causes.push(`isolation ${style.isolation}`);
  if (Number(style.opacity) < 1) causes.push(`opacity ${style.opacity}`);
  if (style.overflow !== "visible") causes.push(`overflow ${style.overflow}`);
  if (style.backdropFilter !== "none" && style.backdropFilter !== "") {
    causes.push(`backdrop-filter ${style.backdropFilter}`);
  }
  return causes;
}

/**
 * LA RÈGLE QUI HABILLE LA BARRE, telle que le navigateur l'a analysée —
 * pas un fichier deviné. Et le bloc `@supports` qui la contient s'il en
 * reste un : c'est lui qui avait exclu Safari jusqu'à la nº 172.
 */
function regleDeLaBarre(barre: HTMLElement): string {
  const trouvees: string[] = [];
  for (const feuille of document.styleSheets) {
    let regles: CSSRuleList;
    try {
      regles = feuille.cssRules;
    } catch {
      continue; // feuille d'un autre domaine : illisible, on passe
    }
    const parcourir = (liste: CSSRuleList, condition: string) => {
      for (const regle of liste) {
        if ("conditionText" in regle && "cssRules" in regle) {
          parcourir(
            (regle as CSSConditionRule).cssRules,
            `@supports ${(regle as CSSConditionRule).conditionText}`
          );
          continue;
        }
        const style = regle as CSSStyleRule;
        if (typeof style.selectorText !== "string") continue;
        if (!/backdrop-filter|background-color/.test(style.cssText)) continue;
        try {
          if (!barre.matches(style.selectorText)) continue;
        } catch {
          continue;
        }
        trouvees.push(
          `${condition ? `${condition} { ` : ""}${style.cssText}${
            condition ? " }" : ""
          }`
        );
      }
    };
    parcourir(regles, "");
  }
  return trouvees.length > 0
    ? trouvees.join("  ||  ")
    : "(aucune règle trouvée)";
}

/** Un nom court et reconnaissable pour un élément de la chaîne. */
function nommer(element: Element): string {
  const classes = (element.className || "").toString().trim().slice(0, 46);
  return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
}

function lignes(): [string, string][] {
  const barre = document.querySelector<HTMLElement>("[data-barre-fixe]");
  if (!barre) return [["barre", "introuvable sur cette page"]];
  const style = getComputedStyle(barre);
  const dit: [string, string][] = [
    [
      "a) fichier",
      barre.dataset.sourceFichier ?? "(non déclaré)",
    ],
    [
      "a) composant",
      barre.dataset.sourceComposant ?? "(non déclaré)",
    ],
    ["b) backdrop-filter", style.backdropFilter || "(vide)"],
    [
      "b) -webkit-",
      style.getPropertyValue("-webkit-backdrop-filter") || "(vide)",
    ],
    ["c) background", style.backgroundColor],
    [
      "d) CSS.supports",
      typeof CSS !== "undefined" && CSS.supports
        ? String(CSS.supports("backdrop-filter", "blur(1px)"))
        : "(CSS.supports absent)",
    ],
  ];
  //  e) LA CHAÎNE, de <html> jusqu'à la barre.
  const chaine: Element[] = [];
  for (let noeud: Element | null = barre; noeud; noeud = noeud.parentElement) {
    chaine.unshift(noeud);
  }
  let rang = 0;
  for (const element of chaine) {
    const causes = cequiAnnule(getComputedStyle(element));
    dit.push([
      `e) ${rang === 0 ? "html" : `parent ${rang}`}`,
      `${nommer(element)}${
        causes.length > 0 ? ` ⚠️ ${causes.join(" · ")}` : " — rien"
      }`,
    ]);
    rang += 1;
  }
  dit.push(["f) navigateur", navigator.userAgent]);
  //  g) LES VARIABLES, telles que <html> les calcule.
  const racine = getComputedStyle(document.documentElement);
  dit.push([
    "g) variables",
    `--rw-flou ${racine.getPropertyValue("--rw-flou").trim() || "(vide)"} · --rw-verre ${
      racine.getPropertyValue("--rw-verre").trim() || "(vide)"
    }`,
  ]);
  //  h) LA RÈGLE QUI S'APPLIQUE, lue dans le CSSOM — et le bloc
  //  `@supports` qui l'enferme, s'il en reste un (il ne doit plus y en
  //  avoir depuis la nº 172).
  dit.push(["h) règle appliquée", regleDeLaBarre(barre)]);
  //  Et le style EN LIGNE, celui que posent `?verre=` et `?flou=`.
  dit.push([
    "h) style en ligne",
    barre.getAttribute("style") || "(aucun — valeurs de la feuille)",
  ]);
  return dit;
}

export function SondeVerre() {
  const [armee, setArmee] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const dernier = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sonde-verre") !== "1") return;
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  useEffect(() => {
    if (!armee) return;
    const ecrire = () => {
      const noeud = zone.current;
      if (!noeud) return;
      const releve = lignes();
      dernier.current = releve
        .map(([nom, valeur]) => `${nom} : ${valeur}`)
        .join("\n");
      noeud.textContent = "";
      for (const [nom, valeur] of releve) {
        const ligne = document.createElement("div");
        ligne.style.cssText = "display:flex;gap:8px;align-items:baseline";
        const cle = document.createElement("span");
        cle.style.cssText = "color:#9AA0A6;min-width:124px;flex-shrink:0";
        cle.textContent = nom;
        const val = document.createElement("span");
        val.style.cssText = "color:#FFF;font-weight:700;word-break:break-all";
        val.textContent = valeur;
        ligne.append(cle, val);
        noeud.append(ligne);
      }
    };
    ecrire();
    const battement = window.setInterval(ecrire, 500);
    return () => window.clearInterval(battement);
  }, [armee]);

  if (!armee) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        top: 8,
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #EE3D6F",
        borderRadius: 12,
        padding: "10px 12px",
        font: "13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        maxHeight: "60vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "#EE3D6F", fontWeight: 700 }}>
          SONDE VERRE · ?sonde-verre=1
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(dernier.current);
          }}
          style={{
            background: "#EE3D6F",
            color: "#FFFFFF",
            border: 0,
            borderRadius: 8,
            padding: "4px 12px",
            font: "inherit",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Copier
        </button>
        {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A). */}
        <BoutonEnvoyerJournal sonde="verre" texte={() => dernier.current} />
      </div>
      <div ref={zone} />
    </div>
  );
}
