"use client";

import { useCallback, useRef, useState } from "react";

/**
 * LES DEUX OUTILS PARTAGÉS DES SONDES (passe nº 183)
 * ==================================================
 * Les six sondes du site (bascule, verre, filtres, clavier, navigation,
 * retour) en avaient toutes besoin, et toutes de la même façon :
 *
 *  §1 — SE REPLIER. Le panneau occupait les trois quarts de l'écran sur
 *       iPhone et masquait le bouton « Valider » du moteur : impossible
 *       de travailler. Il s'ouvre désormais REPLIÉ, en pastille, et ne
 *       se déplie que si on le demande.
 *
 *  §2 — COPIER MALGRÉ TOUT. Le site est consulté en http sur l'adresse
 *       du réseau local (192.168.1.12) : iOS y REFUSE l'accès direct au
 *       presse-papier, et « Copier » ne faisait rien. Trois niveaux de
 *       repli, et le bouton DIT lequel a fonctionné.
 *
 * ⚠️ CES OUTILS SONT TEMPORAIRES, comme les sondes elles-mêmes. Le jour
 * où l'on retire les sondes, ce fichier part avec elles.
 */

/* ==================================================================
 * §1 — LE REPLI
 * ================================================================== */

/**
 * REPLIÉ AU DÉPART, ET C'EST LE POINT. Une sonde est un instrument de
 * mesure : elle doit être là sans gêner. On la déplie quand on veut
 * lire ou envoyer, on la replie pour continuer à se servir du site.
 *
 * ⚠️ LE JOURNAL CONTINUE D'ENREGISTRER PENDANT CE TEMPS. Le repli ne
 * touche QUE l'affichage : les écouteurs, les minuteurs et les
 * écritures vivent dans des effets qui ne dépendent pas de lui.
 */
export function useSondeRepliee(): {
  repliee: boolean;
  basculer: () => void;
} {
  const [repliee, setRepliee] = useState(true);
  const basculer = useCallback(() => setRepliee((etat) => !etat), []);
  return { repliee, basculer };
}

/**
 * LA PASTILLE — quelques millimètres dans un coin.
 * Elle ne masque rien et ne bloque aucun toucher ailleurs : c'est un
 * bouton de 44 px (la cible minimale au doigt), et rien d'autre. Son
 * initiale dit de quelle sonde il s'agit.
 */
export function PastilleSonde({
  lettre,
  titre,
  surToucher,
  bas = 8,
}: {
  /** Une lettre : B (bascule), V (verre), F (filtres)… */
  lettre: string;
  titre: string;
  surToucher: () => void;
  /** Décalage depuis le bas — pour que deux sondes armées en même
      temps ne se recouvrent pas. */
  bas?: number;
}) {
  return (
    <button
      type="button"
      onClick={surToucher}
      aria-label={`Ouvrir ${titre}`}
      title={titre}
      style={{
        position: "fixed",
        right: 8,
        bottom: `max(${bas}px, env(safe-area-inset-bottom))`,
        zIndex: 2147483647,
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "2px solid #EE3D6F",
        background: "#000000",
        color: "#EE3D6F",
        font: "700 15px ui-monospace, SFMono-Regular, Menlo, monospace",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        //  L'ombre la détache d'une photo sans l'alourdir.
        boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
      }}
    >
      {lettre}
    </button>
  );
}

/** Le bouton « replier », posé dans l'en-tête d'un panneau déplié. */
export function BoutonReplier({ surToucher }: { surToucher: () => void }) {
  return (
    <button
      type="button"
      onClick={surToucher}
      aria-label="Replier la sonde"
      title="Replier"
      style={{
        minWidth: 44,
        minHeight: 44,
        borderRadius: 10,
        border: "1px solid #666",
        background: "transparent",
        color: "#EEE",
        font: "700 15px ui-monospace, SFMono-Regular, Menlo, monospace",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      ▾
    </button>
  );
}

/* ==================================================================
 * §2 — COPIER, EN TROIS NIVEAUX
 * ================================================================== */

/**
 * LE BOUTON « COPIER » QUI DIT CE QU'IL A FAIT.
 * ------------------------------------------------------------------
 * a) L'ACCÈS DIRECT au presse-papier (`navigator.clipboard`). iOS le
 *    réserve aux pages sécurisées : en http sur une adresse de réseau
 *    local, il n'existe pas, ou il refuse.
 * b) LA MÉTHODE ANCIENNE : un champ de texte posé hors écran, rempli,
 *    sélectionné, puis `document.execCommand("copy")`. Elle marche
 *    encore là où la première échoue.
 * c) À LA MAIN : le relevé s'affiche dans un champ DÉJÀ ENTIÈREMENT
 *    SÉLECTIONNÉ, avec la consigne « Appuie sur Copier » — le menu
 *    d'iOS fait le reste.
 *
 * ET IL LE DIT, en une ligne sous le bouton : on sait si la copie a
 * vraiment eu lieu, et par quel chemin.
 */
export function BoutonCopierJournal({
  texte,
  pleineLargeur = false,
}: {
  /** Le relevé COMPLET, lu au moment du clic. */
  texte: () => string;
  pleineLargeur?: boolean;
}) {
  const [dit, setDit] = useState("");
  const [aLaMain, setALaMain] = useState<string | null>(null);
  const champ = useRef<HTMLTextAreaElement>(null);

  /** (b) LE CHAMP HORS ÉCRAN — posé, sélectionné, copié, retiré.
      ⚠️ Ni `display:none` ni `visibility:hidden` : un champ invisible
      n'est pas sélectionnable, et la copie échouerait. On le sort de
      l'écran, ce qui n'est pas la même chose. */
  function copierParLAncienneMethode(contenu: string): boolean {
    const zone = document.createElement("textarea");
    zone.value = contenu;
    zone.setAttribute("readonly", "");
    zone.style.cssText =
      "position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none";
    document.body.appendChild(zone);
    let ok = false;
    try {
      zone.focus();
      zone.setSelectionRange(0, contenu.length);
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    zone.remove();
    return ok;
  }

  async function copier() {
    const contenu = texte();
    setALaMain(null);
    //  (a) L'ACCÈS DIRECT.
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contenu);
        setDit("✅ copié (presse-papier direct)");
        return;
      }
    } catch {
      /* on descend d'un niveau */
    }
    //  (b) LA MÉTHODE ANCIENNE.
    if (copierParLAncienneMethode(contenu)) {
      setDit("✅ copié (méthode ancienne)");
      return;
    }
    //  (c) À LA MAIN.
    setALaMain(contenu);
    setDit("⚠️ à copier à la main — appuie sur Copier");
    //  Tout sélectionner, pour qu'il n'y ait plus qu'à appuyer.
    requestAnimationFrame(() => {
      const zone = champ.current;
      if (!zone) return;
      zone.focus();
      zone.setSelectionRange(0, contenu.length);
    });
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
        onClick={() => void copier()}
        style={{
          minHeight: 44,
          padding: "0 18px",
          borderRadius: 10,
          border: 0,
          background: "#EE3D6F",
          color: "#FFFFFF",
          font: "700 14px ui-monospace, SFMono-Regular, Menlo, monospace",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        COPIER
      </button>
      {dit !== "" && (
        <span
          style={{
            font: "11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace",
            color: dit.startsWith("✅") ? "#8FE28F" : "#FFD37A",
          }}
        >
          {dit}
        </span>
      )}
      {aLaMain !== null && (
        <textarea
          ref={champ}
          readOnly
          value={aLaMain}
          aria-label="Relevé à copier"
          style={{
            width: "100%",
            minHeight: 90,
            background: "#000",
            color: "#DDD",
            border: "1px solid #444",
            borderRadius: 8,
            padding: 6,
            font: "11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
            whiteSpace: "pre",
          }}
        />
      )}
    </span>
  );
}

/* ==================================================================
 * §4 (nº 343) — DÉSARMER, SANS TAPER D'ADRESSE
 * ==================================================================
 * L'armement est devenu DURABLE (lib/sondes-armees) : il survit à
 * l'onglet, donc il faut pouvoir l'éteindre d'un doigt. Ce bouton est
 * le même dans les trois panneaux — une seule écriture.
 *
 * ⚠️ IL DIT CE QU'IL FAIT ET CE QU'IL NE FAIT PAS : l'armement part
 * tout de suite (les sondes disparaissent au rendu suivant), mais les
 * enveloppes déjà posées sur `history` par le script d'avant peinture
 * ne se retirent qu'au prochain chargement de page. Mieux vaut le dire
 * que laisser croire à un retrait immédiat.
 */
export function BoutonDesarmer({ surToucher }: { surToucher: () => void }) {
  const [confirme, setConfirme] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirme) {
          setConfirme(true);
          return;
        }
        surToucher();
      }}
      style={{
        minHeight: 32,
        padding: "0 10px",
        borderRadius: 8,
        border: "1px solid #FFD37A",
        background: "transparent",
        color: "#FFD37A",
        font: "600 11px/1 system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {confirme ? "SÛR ? TOUCHE ENCORE" : "DÉSARMER"}
    </button>
  );
}
