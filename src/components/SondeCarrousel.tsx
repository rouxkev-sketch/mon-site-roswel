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
  depuisLArret,
  inventaire,
  lignesDuJournal,
  noter,
  sauvegarderMaintenant,
  sondeCarrouselArmee,
  souscrireAuJournal,
} from "@/lib/journal-carrousel";

/**
 * LA SONDE DU CARROUSEL ET DU PORTFOLIO — `?sonde-carrousel=1`
 * ==================================================================
 * (passe nº 218-§1)
 *
 * ⚠️ ELLE OBSERVE, ELLE NE CORRIGE RIEN. Ni le scintillement, ni le
 * blocage : cette passe ne touche pas à leurs causes présumées. Deux
 * défauts ont résisté à quatre passes de corrections raisonnées ; on
 * arrête de deviner, et on regarde.
 *
 * CE QU'ELLE ENREGISTRE (les sept points demandés) :
 *  1. LE CHANGEMENT DE SÉRIE — style, catégorie et rendu DEMANDÉS
 *     (écrit par ContenuFiche, au moment du geste), puis le nombre de
 *     photos que le carrousel REÇOIT vraiment (écrit par
 *     CarrouselPortfolio). Les deux lignes se lisent l'une sous
 *     l'autre : c'est là qu'on verra « aucune photo affichée » ;
 *  2. MONTAGES ET DÉMONTAGES du carrousel et du zoom, avec le COMPTEUR
 *     D'INSTANCES VIVANTES — la ligne la plus importante ;
 *  3. LE NOMBRE D'OBSERVATEURS D'INTERSECTION ET D'ÉCOUTEURS actifs —
 *     l'inventaire part avec chaque montage, chaque série, chaque
 *     arrêt, et se relit ici en permanence, en tête du panneau ;
 *  4. L'INDICE de la photo courante et chacune de ses poses, AVEC SON
 *     ORIGINE : doigt (le défilement lui-même), flèche, rond, code ;
 *  5. L'ÉTAT DU CONTENEUR à chaque arrêt : `overflow`, largeur,
 *     nombre de colonnes montées ;
 *  6. LES PHOTOS RÉELLEMENT CHARGÉES et celles encore vides ;
 *  7. TOUT CE QUI APPARAÎT OU DISPARAÎT DANS LES 300 ms SUIVANT
 *     L'ARRÊT — c'est l'objet de l'observateur de mutations ci-dessous,
 *     et la seule façon de nommer « l'ombre qui s'efface ».
 *
 * ⚠️ AUCUN ÉTAT REACT pour le journal : il vit dans un module
 * (lib/journal-carrousel) et s'écrit directement dans le nœud. Un
 * enregistrement ne provoque aucun rendu — la sonde ne peut donc pas
 * déranger ce qu'elle observe, ce qui serait le plus sûr moyen de faire
 * disparaître le défaut au moment de le mesurer.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : ce fichier, la ligne
 * `<SondeCarrousel />` de src/app/(tatouage)/layout.tsx, le module
 * src/lib/journal-carrousel.ts, et les appels qui le nomment dans
 * CarrouselPortfolio, ZoomPincement et ContenuFiche.
 */

/** LE JOURNAL EN UN SEUL TEXTE — ce que COPIER met dans le
    presse-papiers, et ce qu'ENVOYER poste au serveur : le MÊME. */
function journalEnTexte(): string {
  return lignesDuJournal()
    .map((ligne) => `${ligne.t}\t${ligne.texte}`)
    .join("\n");
}

/** Le nom lisible d'un nœud : son rôle déclaré, sinon sa balise. */
function nommer(noeud: Node): string {
  if (!(noeud instanceof Element)) return "(texte)";
  const role = noeud.getAttribute("data-role");
  if (role) return role;
  if (noeud.tagName === "IMG") {
    const image = noeud as HTMLImageElement;
    const fin = image.currentSrc || image.src || "";
    return `IMG ${fin.slice(-28)}`;
  }
  const classe = noeud.getAttribute("class") ?? "";
  return `${noeud.tagName}${classe ? ` .${classe.split(/\s+/)[0]}` : ""}`;
}

/** L'état d'une image : chargée, ou encore vide. */
function etatImage(image: HTMLImageElement): string {
  return image.complete && image.naturalWidth > 0
    ? `chargée ${image.naturalWidth}px`
    : "VIDE";
}

export function SondeCarrousel() {
  const [armee, setArmee] = useState(false);
  //  ⚠️ REPLIÉE AU DÉPART (nº 183-§1) : une pastille de 44 px, rien de
  //  plus. Le journal, lui, continue d'enregistrer — les effets
  //  ci-dessous ne dépendent pas de cet état.
  const { repliee, basculer } = useSondeRepliee();
  const zone = useRef<HTMLDivElement>(null);
  const enTete = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sondeCarrouselArmee()) return;
    const image = requestAnimationFrame(() => setArmee(true));
    return () => cancelAnimationFrame(image);
  }, []);

  /* ---- L'OUVERTURE DE LA PAGE, ET LE DÉPART ---- */
  useEffect(() => {
    if (!armee) return;
    noter(
      `═══ PAGE ${location.pathname}${location.search} · ` +
        `appareil "${document.documentElement.dataset.appareil ?? "(absent)"}" · ` +
        `fenêtre ${window.innerWidth}×${window.innerHeight}`
    );
    const auDepart = () => {
      noter(`DÉPART de ${location.pathname} │ ${inventaire()}`);
      sauvegarderMaintenant();
    };
    window.addEventListener("pagehide", auDepart);
    return () => window.removeEventListener("pagehide", auDepart);
  }, [armee]);

  /* ==================================================================
   * L'ŒIL SUR LE CARROUSEL — tout ce qui apparaît ou disparaît
   * ==================================================================
   * §7 des points demandés. Un `MutationObserver` posé sur LE DOCUMENT
   * (le carrousel se démonte et se remonte : le suivre nœud par nœud
   * demanderait de le retrouver sans arrêt) qui ne retient QUE ce qui
   * se passe à l'intérieur d'un `[data-carrousel]`.
   *
   * ⚠️ ON REGARDE AUSSI LES ATTRIBUTS `class` ET `style`, pas seulement
   * les nœuds ajoutés et retirés : « une ombre qui s'efface » n'est
   * peut-être pas un nœud qui part, mais une classe qui change — une
   * opacité, un dégradé, une ombre portée. Le relevé nomme les deux, et
   * DIT combien de millisecondes se sont écoulées depuis l'arrêt.
   * Au-delà de 300 ms, la ligne est notée quand même mais sans alerte :
   * on ne veut pas d'un journal qui décide à notre place.
   */
  useEffect(() => {
    if (!armee) return;
    const dansUnCarrousel = (noeud: Node): boolean =>
      noeud instanceof Element ? Boolean(noeud.closest("[data-carrousel]")) : false;

    const oeil = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const cible = mutation.target;
        if (!dansUnCarrousel(cible)) continue;
        const delta = depuisLArret();
        const proche = delta >= 0 && delta <= 300;
        const marque = proche ? `⚠️ +${delta} ms APRÈS L'ARRÊT` : `+${delta} ms`;

        if (mutation.type === "childList") {
          for (const ajoute of mutation.addedNodes) {
            noter(`APPARAÎT ${nommer(ajoute)} · ${marque}`);
            if (ajoute instanceof HTMLImageElement) {
              noter(`   └ image ${etatImage(ajoute)}`);
            }
          }
          for (const retire of mutation.removedNodes) {
            noter(`DISPARAÎT ${nommer(retire)} · ${marque}`);
          }
          continue;
        }
        //  Un attribut d'apparence : c'est là que vit « l'ombre ».
        const nom = mutation.attributeName ?? "?";
        if (nom !== "class" && nom !== "style") continue;
        const valeur =
          cible instanceof Element ? (cible.getAttribute(nom) ?? "") : "";
        noter(
          `CHANGE ${nommer(cible)} · ${nom} · ${marque}\n   └ ${valeur.slice(0, 180)}`
        );
      }
    });
    oeil.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "src", "loading"],
    });
    return () => oeil.disconnect();
  }, [armee]);

  /* ---- L'EN-TÊTE VIVANT : l'inventaire, réécrit sans aucun rendu ---- */
  useEffect(() => {
    if (!armee || repliee) return;
    const ecrire = () => {
      if (enTete.current) enTete.current.textContent = inventaire();
    };
    ecrire();
    const battement = window.setInterval(ecrire, 500);
    return () => window.clearInterval(battement);
  }, [armee, repliee]);

  /* ---- L'AFFICHAGE : écrit à la main, jamais par un rendu ----
     ⚠️ IL DÉPEND AUSSI DU REPLI : le nœud n'existe pas quand la sonde
     est repliée ; au dépliage, cet effet se rejoue et réécrit TOUT le
     journal, y compris ce qui s'est enregistré pendant. */
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
        //  Trois niveaux de lecture : ce qui alerte, ce qui structure,
        //  le reste.
        texte.style.cssText = /⚠️|DÉMONTAGE|ABSENT/.test(ligne.texte)
          ? "color:#E11144;font-weight:700;word-break:break-word;white-space:pre-wrap"
          : /═══|⏹ ARRÊT|SÉLECTEUR|VIGNETTE|SÉRIE/.test(ligne.texte)
            ? "color:#8FE28F;word-break:break-word;white-space:pre-wrap"
            : "color:#FFF;word-break:break-word;white-space:pre-wrap";
        texte.textContent = ligne.texte;
        div.append(t, texte);
        noeud.append(div);
      }
      //  Le dernier événement reste sous les yeux.
      noeud.scrollTop = noeud.scrollHeight;
    };
    ecrire();
    return souscrireAuJournal(ecrire);
  }, [armee, repliee]);

  if (!armee) return null;
  if (repliee) {
    //  ⚠️ 216 px du bas : les cinq autres pastilles occupent 8, 60, 112
    //  et 164 — deux sondes armées ensemble ne doivent pas se couvrir.
    return (
      <PastilleSonde
        lettre="K"
        titre="Sonde carrousel"
        surToucher={basculer}
        bas={216}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        //  Au-dessus de la barre d'outils de Safari (nº 174-§3B).
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
        //  ⚠️ LA MOITIÉ BASSE DE L'ÉCRAN, JAMAIS PLUS : on doit pouvoir
        //  continuer à se servir du carrousel pendant qu'on le mesure.
        maxHeight: "50vh",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#E11144", fontWeight: 700, flex: 1 }}>
          JOURNAL CARROUSEL
        </span>
        <BoutonReplier surToucher={basculer} />
      </div>
      {/*  L'INVENTAIRE VIVANT, toujours sous les yeux : c'est LA ligne
           qui répond au blocage — ce qui monte doit descendre. */}
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
        <BoutonEnvoyerJournal
          sonde="carrousel"
          texte={journalEnTexte}
          pleineLargeur
        />
      </div>
      <div ref={zone} style={{ overflow: "auto", flex: 1 }} />
    </div>
  );
}
