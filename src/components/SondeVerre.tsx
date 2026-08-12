"use client";

import { useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";

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

/**
 * §3 (nº 234) — LA FENÊTRE D'ADRESSE, QUAND ELLE EST OUVERTE
 * ==================================================================
 * TROIS BLOCS, ceux que le propriétaire a demandés — et c'est ce
 * relevé, pris sur SON iPhone, qui tranchera : Chromium a déjà donné
 * trois fois des valeurs justes pendant que son écran restait noir.
 *
 *  1. LA PLAQUE ET LES DEUX CAPSULES, telles que le navigateur les
 *     calcule : filtre (les deux écritures), fond, ombre, bordure ;
 *  2. LA CHAÎNE COMPLÈTE DES ANCÊTRES de la plaque, chacun avec
 *     `opacity`, `filter`, `transform`, `will-change`, `contain`,
 *     `isolation` — et un marqueur sur LE PREMIER qui crée une racine
 *     d'arrière-plan (c'est lui qui tuerait le flou) ;
 *  3. `CSS.supports` pour les deux écritures du filtre.
 *
 * Rien ici ne corrige : la sonde LIT.
 */
function releveDeLaFenetre(): [string, string][] {
  //  §5 (nº 236) — TOUTES LES SURFACES DE VERRE OUVERTES, pas
  //  seulement la fenêtre d'adresse : fenêtres superposées, menus
  //  déroulants, panneau de filtres. Chacune porte le même attribut,
  //  chacune est relevée, une ligne par surface.
  const surfaces = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-verre-fenetre], [data-verre-menu]"
    ),
  ];
  if (surfaces.length === 0) {
    return [
      [
        "SURFACE",
        "aucune ouverte — ouvre une fenêtre ou un menu, puis rouvre la sonde",
      ],
    ];
  }
  const dit: [string, string][] = [];
  dit.push(["surfaces ouvertes", String(surfaces.length)]);
  //  ⚠️ CHAQUE surface est relevée ; le détail complet (chaîne des
  //  ancêtres) est donné pour la DERNIÈRE ouverte — celle du dessus,
  //  celle qu'on regarde.
  for (const surface of surfaces) {
    const s = getComputedStyle(surface);
    const nomCourt = nommer(surface).slice(0, 40);
    dit.push([
      `0) ${nomCourt}`,
      `filtre ${s.backdropFilter || "(vide)"} · fond ${s.backgroundColor} · opacité ${s.opacity}`,
    ]);
  }
  const plaque = surfaces[surfaces.length - 1];
  dit.push([
    "0) surface détaillée",
    `${nommer(plaque).slice(0, 40)} — ${
      plaque.hasAttribute("data-verre-menu") ? "MENU (sans voile)" : "FENÊTRE"
    }`,
  ]);

  //  1) LA PLAQUE ET LES DEUX CAPSULES.
  const morceaux: [string, HTMLElement | null][] = [
    ["plaque", plaque],
    ["capsule blanche", plaque.querySelector("[data-verre-capsule]")],
    ["capsule rose", plaque.querySelector("[data-verre-action]")],
  ];
  for (const [nom, element] of morceaux) {
    if (!element) {
      dit.push([`1) ${nom}`, "absente"]);
      continue;
    }
    const s = getComputedStyle(element);
    dit.push([`1) ${nom} · filtre`, s.backdropFilter || "(vide)"]);
    dit.push([
      `1) ${nom} · -webkit-`,
      s.getPropertyValue("-webkit-backdrop-filter") || "(vide)",
    ]);
    dit.push([`1) ${nom} · fond`, s.backgroundColor]);
    dit.push([`1) ${nom} · ombre`, s.boxShadow || "(aucune)"]);
    dit.push([
      `1) ${nom} · bordure`,
      s.borderWidth === "0px" ? "(aucune)" : `${s.borderWidth} ${s.borderColor}`,
    ]);
    dit.push([`1) ${nom} · opacité`, s.opacity]);
  }

  //  2) LA CHAÎNE DES ANCÊTRES, du corps jusqu'à la plaque.
  const chaine: Element[] = [];
  for (let noeud: Element | null = plaque; noeud; noeud = noeud.parentElement) {
    chaine.unshift(noeud);
  }
  let racineTrouvee = false;
  let rang = 0;
  for (const element of chaine) {
    const causes = cequiAnnule(getComputedStyle(element));
    //  ⚠️ `overflow` n'est PAS une racine d'arrière-plan : `cequiAnnule`
    //  le signale pour la barre fixe (il y coupe autre chose), il ne
    //  compte pas ici.
    const vraies = causes.filter((c) => !c.startsWith("overflow"));
    const premier = vraies.length > 0 && !racineTrouvee && element !== plaque;
    if (premier) racineTrouvee = true;
    dit.push([
      `2) ${rang === 0 ? "html" : element === plaque ? "LA PLAQUE" : `parent ${rang}`}`,
      `${nommer(element)}${
        vraies.length > 0
          ? ` ${premier ? "⛔ RACINE D'ARRIÈRE-PLAN :" : "⚠️"} ${vraies.join(" · ")}`
          : " — rien"
      }`,
    ]);
    rang += 1;
  }
  dit.push([
    "2) verdict",
    racineTrouvee
      ? "⛔ un ancêtre crée une racine : la plaque ne floute PAS la page"
      : "✓ aucun ancêtre ne crée de racine — la plaque floute bien la page",
  ]);

  //  3) LES DEUX ÉCRITURES DU FILTRE.
  const supporte = (propriete: string) =>
    typeof CSS !== "undefined" && CSS.supports
      ? String(CSS.supports(propriete, "blur(1px)"))
      : "(CSS.supports absent)";
  dit.push(["3) supports backdrop-filter", supporte("backdrop-filter")]);
  dit.push(["3) supports -webkit-", supporte("-webkit-backdrop-filter")]);
  dit.push(["3) navigateur", navigator.userAgent]);
  return dit;
}

function lignes(): [string, string][] {
  //  ⚠️ LA FENÊTRE D'ADRESSE PASSE AVANT (nº 234-§3) : quand elle est
  //  ouverte, c'est ELLE qu'on est venu mesurer.
  if (document.querySelector("[data-verre-fenetre]")) {
    return releveDeLaFenetre();
  }
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
  //  ⚠️ REPLIÉE AU DÉPART (nº 183-§1) — une pastille dans le coin.
  const { repliee, basculer } = useSondeRepliee();
  const zone = useRef<HTMLDivElement>(null);
  const dernier = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sonde-verre") !== "1") return;
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  useEffect(() => {
    if (!armee || repliee) return;
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
  }, [armee, repliee]);

  if (!armee) return null;
  if (repliee) {
    return (
      <PastilleSonde
        lettre="V"
        titre="Sonde verre"
        surToucher={basculer}
        bas={60}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: "max(8px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #EE3D6F",
        borderRadius: 12,
        padding: "10px 12px",
        font: "13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        maxHeight: "50vh",
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
        <BoutonReplier surToucher={basculer} />
        <BoutonCopierJournal texte={() => dernier.current} />
        {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A). */}
        <BoutonEnvoyerJournal sonde="verre" texte={() => dernier.current} />
      </div>
      <div ref={zone} />
    </div>
  );
}
