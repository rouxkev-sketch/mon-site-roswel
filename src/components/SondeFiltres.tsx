"use client";

import { useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";

/**
 * LA SONDE DE LA FENÊTRE DES FILTRES — ELLE MESURE CHEZ LE
 * PROPRIÉTAIRE, ET NE CORRIGE RIEN
 * ==================================================================
 * (passe nº 167-§2)
 *
 * SEPT PASSES ONT MESURÉ 20 px LÀ OÙ LE PROPRIÉTAIRE EN VOIT 38. Tant
 * qu'on ne sait pas si le composant corrigé est bien CELUI QUE SON
 * NAVIGATEUR AFFICHE, chaque correction est un coup dans le noir.
 * Cette sonde répond à cette question-là, sur SON écran, sur le
 * panneau RÉELLEMENT ouvert :
 *
 *  a) marge GAUCHE — bord gauche du panneau → bord gauche du premier
 *     badge ;
 *  b) marge HAUTE  — bord haut du panneau → ENCRE du titre ARTISTE
 *     (l'encre, pas la boîte de ligne : la hauteur des capitales est
 *     mesurée sur un canevas, avec la police réellement chargée) ;
 *  c) marge BASSE  — bas du dernier badge → bord bas du panneau ;
 *  d) LE CHEMIN DU FICHIER et LE NOM DU COMPOSANT qui rendent ce
 *     panneau — lus dans le DOM (`data-source-fichier`,
 *     `data-source-composant`), donc dits par la page elle-même ;
 *  e) les classes et les espacements EFFECTIFS du dernier groupe.
 *
 * ELLE NE FAIT QUE LIRE. Aucun style, aucune classe, aucun attribut
 * posé sur autre chose que son propre affichage ; aucune écoute qui
 * puisse retarder un geste. Elle relit trois fois par seconde — assez
 * pour suivre l'ouverture du panneau, trop peu pour peser.
 *
 * ELLE NE S'ARME QUE SUR DEMANDE : sans `?sonde-filtres=1` dans
 * l'adresse, l'effet sort à la première ligne et rien n'est rendu.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier et la ligne
 * `<SondeFiltres />` de src/app/(tatouage)/layout.tsx.
 */

type Releve = {
  gauche: number | null;
  haut: number | null;
  bas: number | null;
  fichier: string;
  composant: string;
  classesGroupe: string;
  classesConteneur: string;
  espacements: string;
  largeurPanneau: number | null;
  pixelRatio: number;
};

/**
 * LE HAUT DE L'ENCRE d'un texte, en points d'écran. La boîte de ligne
 * d'un titre de 12 px en fait 18 : elle pose de l'air invisible
 * au-dessus des capitales. On mesure donc la hauteur RÉELLE des
 * capitales avec la police effectivement appliquée.
 */
function hautDeLEncre(element: HTMLElement): number | null {
  const boite = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const toile = document.createElement("canvas").getContext("2d");
  if (!toile) return null;
  toile.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const mesure = toile.measureText(element.textContent ?? "A");
  const monte = mesure.actualBoundingBoxAscent;
  const descend = mesure.actualBoundingBoxDescent;
  if (!Number.isFinite(monte)) return null;
  //  L'encre est centrée dans la boîte de ligne : la moitié de ce qui
  //  reste au-dessus, plus rien d'autre.
  const hauteurEncre = monte + (Number.isFinite(descend) ? descend : 0);
  return boite.top + (boite.height - hauteurEncre) / 2;
}

function relever(): Releve | null {
  const panneau = document.querySelector<HTMLElement>(
    "[data-panneau-filtres]"
  );
  if (!panneau) return null;
  const boite = panneau.getBoundingClientRect();
  const bloc = panneau.querySelector<HTMLElement>("[data-source-fichier]");
  //  ⚠️ LES GROUPES NE SONT PLUS DES `fieldset` (nº 169-§1) : ils
  //  portent `data-groupe-filtres`. Le repli sur `fieldset` reste, au
  //  cas où la sonde tournerait sur une version plus ancienne.
  const groupes = [
    ...panneau.querySelectorAll<HTMLElement>(
      "[data-groupe-filtres], fieldset"
    ),
  ];
  const dernier = groupes[groupes.length - 1] ?? null;
  const badges = [...panneau.querySelectorAll<HTMLElement>("button")];
  const premier = badges[0]?.getBoundingClientRect() ?? null;
  const ultime = badges[badges.length - 1]?.getBoundingClientRect() ?? null;
  const titre = panneau.querySelector<HTMLElement>("[data-groupe-filtres] p, legend");
  const encre = titre ? hautDeLEncre(titre) : null;
  const styleDernier = dernier ? getComputedStyle(dernier) : null;
  const conteneur = dernier?.parentElement ?? null;
  const styleConteneur = conteneur ? getComputedStyle(conteneur) : null;
  const derniereRangee = dernier?.querySelector<HTMLElement>("div");

  return {
    gauche: premier ? Math.round(premier.left - boite.left) : null,
    haut: encre === null ? null : Math.round(encre - boite.top),
    bas: ultime ? Math.round(boite.bottom - ultime.bottom) : null,
    fichier:
      bloc?.dataset.sourceFichier ??
      panneau.dataset.sourceFichier ??
      "(non déclaré)",
    composant:
      bloc?.dataset.sourceComposant ??
      panneau.dataset.sourceComposant ??
      "(non déclaré)",
    classesGroupe: dernier?.className || "(aucune)",
    classesConteneur: conteneur?.className || "(aucune)",
    espacements: styleDernier
      ? [
          `groupe mt ${styleDernier.marginTop}`,
          `mb ${styleDernier.marginBottom}`,
          `pb ${styleDernier.paddingBottom}`,
          `h ${Math.round(dernier!.getBoundingClientRect().height)}`,
          `rangée h ${
            derniereRangee
              ? Math.round(derniereRangee.getBoundingClientRect().height)
              : "?"
          }`,
          `conteneur gap ${styleConteneur?.rowGap ?? "?"}`,
          `panneau pt ${getComputedStyle(panneau).paddingTop} / pb ${
            getComputedStyle(panneau).paddingBottom
          }`,
        ].join(" · ")
      : "(aucun)",
    largeurPanneau: Math.round(boite.width),
    pixelRatio: window.devicePixelRatio,
  };
}

/** Le relevé, mis en mots — une ligne par point demandé. */
function lignes(r: Releve | null): [string, string][] {
  if (r === null) return [["panneau", "fermé — ouvre les filtres"]];
  return [
    ["a) marge GAUCHE", r.gauche === null ? "?" : `${r.gauche} px`],
    [
      "b) marge HAUTE",
      r.haut === null ? "?" : `${r.haut} px (encre ARTISTE)`,
    ],
    ["c) marge BASSE", r.bas === null ? "?" : `${r.bas} px`],
    ["d) fichier", r.fichier],
    ["d) composant", r.composant],
    ["e) dernier groupe", r.classesGroupe],
    ["e) conteneur", r.classesConteneur],
    ["e) espacements", r.espacements],
    [
      "panneau",
      `largeur ${r.largeurPanneau} px · densité ${r.pixelRatio}x`,
    ],
  ];
}

export function SondeFiltres() {
  const [armee, setArmee] = useState(false);
  /** ⚠️ LE RELEVÉ N'EST PAS UN ÉTAT REACT : il change trois fois par
      seconde, et un rendu à chaque fois ferait peser la sonde sur ce
      qu'elle mesure. On écrit directement dans son propre nœud. */
  const zone = useRef<HTMLDivElement>(null);
  const dernier = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sonde-filtres") !== "1") return;
    //  Par une fonction, jamais dans le corps de l'effet : c'est le
    //  motif du site (voir lib/appareil), et React le demande.
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  useEffect(() => {
    if (!armee) return;
    const ecrire = () => {
      const noeud = zone.current;
      if (!noeud) return;
      const releve = lignes(relever());
      dernier.current = releve
        .map(([nom, valeur]) => `${nom} : ${valeur}`)
        .join("\n");
      noeud.textContent = "";
      for (const [nom, valeur] of releve) {
        const ligne = document.createElement("div");
        ligne.style.cssText = "display:flex;gap:8px;align-items:baseline";
        const cle = document.createElement("span");
        cle.style.cssText = "color:#9AA0A6;min-width:132px;flex-shrink:0";
        cle.textContent = nom;
        const val = document.createElement("span");
        val.style.cssText = "color:#FFF;font-weight:700;word-break:break-all";
        val.textContent = valeur;
        ligne.append(cle, val);
        noeud.append(ligne);
      }
    };
    ecrire();
    const battement = window.setInterval(ecrire, 300);
    return () => window.clearInterval(battement);
  }, [armee]);

  if (!armee) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 8,
        //  Au-dessus de TOUT : la barre est à 50, le panneau à 30, les
        //  fenêtres à 80. La sonde doit rester lisible par-dessus.
        zIndex: 2147483647,
        background: "#000000",
        border: "2px solid #EE3D6F",
        borderRadius: 12,
        padding: "10px 12px",
        font: "13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#FFFFFF",
        maxHeight: "46vh",
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
          SONDE FILTRES · ?sonde-filtres=1
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
            pointerEvents: "auto",
          }}
        >
          Copier
        </button>
        {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A). */}
        <BoutonEnvoyerJournal sonde="filtres" texte={() => dernier.current} />
      </div>
      <div ref={zone} />
    </div>
  );
}
