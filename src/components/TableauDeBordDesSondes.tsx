"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  armerLaSonde,
  desarmerLesSondes,
  eteindreLaSonde,
  SONDES,
  sondesArmees,
  type NomDeSonde,
} from "@/lib/sondes-armees";

/**
 * ██ §1 (nº 712) — LE TABLEAU DE BORD DES SONDES ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE : voir le site SANS ses sondes — donc
 * toutes ÉTEINTES par défaut — et pouvoir en rallumer une d'un clic,
 * depuis un seul endroit, sans retenir quinze adresses par cœur.
 *
 * POURQUOI UNE PAGE, ET POURQUOI ICI. Un panneau monté dans la mise en
 * page du site aurait coûté du code sur CHAQUE page — l'inverse du but
 * poursuivi. La page qui monte ce tableau de bord vit HORS du groupe
 * « tatouage » : elle n'hérite ni de la barre, ni des sondes, ni du
 * moteur, et son code n'est téléchargé que par qui l'ouvre. Le site,
 * lui, ne porte pas un octet de plus.
 *
 * ⚠️ AUCUNE CLASSE DE FEUILLE, QUE DES STYLES EN LIGNE, et c'est
 * délibéré : la feuille du site ne grossit pas d'un octet pour un
 * outil d'atelier (vérifié à la livraison, octet pour octet). C'est
 * déjà la manière des panneaux de sonde (nº 174 et suivantes).
 *
 * ██ §1 (nº 790) — LE CORPS EST ICI, LE VERROU EST SUR LA PAGE ██
 * ------------------------------------------------------------------
 * Ce fichier était `src/app/dev/page.tsx` jusqu'à la nº 790. Il en est
 * sorti pour UNE raison : une page `"use client"` ne peut pas
 * interroger la session côté serveur, donc pas se garder elle-même.
 * `src/app/dev/page.tsx` est désormais une page SERVEUR qui demande
 * `verifierAdmin()` et rend la page introuvable du site à tout autre
 * visiteur ; elle ne monte ce composant qu'une fois le compte reconnu.
 * Le tableau de bord, lui, n'a pas changé d'une ligne.
 *
 * ██ LES DEUX FAMILLES, ET POURQUOI ELLES DIFFÈRENT ██
 * ------------------------------------------------------------------
 * L'inventaire de la nº 712 a trouvé DIX-SEPT traceurs, armés de deux
 * façons — héritage des passes qui les ont créés, chacune répondant à
 * un défaut différent :
 *  1. LE REGISTRE DURABLE (lib/sondes-armees, nº 343) — les sondes à
 *     interrupteur. L'armement vit dans la mémoire locale, survit à
 *     l'ouverture d'un onglet neuf, et se pose sur `<html>` avant la
 *     première peinture. Ce sont de VRAIS interrupteurs : un clic ici,
 *     et la sonde est armée partout, jusqu'à ce qu'on l'éteigne ;
 *  2. PAR L'ADRESSE (`?sonde-…=1`) — les sondes d'affichage. Chacune
 *     lit l'adresse à sa façon (certaines la recopient en mémoire
 *     d'onglet). LES RÉÉCRIRE TOUTES POUR UNIFORMISER, C'ÉTAIT AUTANT
 *     D'OCCASIONS DE CASSER quelque chose pour un confort d'atelier :
 *     on ne l'a pas fait. Le tableau de bord OUVRE donc le site à
 *     l'adresse qui les arme — leur mécanisme d'origine, intact.
 * Les deux familles sont dites telles qu'elles sont, plutôt que
 * maquillées en une seule.
 */

/**
 * Les sondes du registre durable, et ce qu'elles coûtent.
 * §1 (nº 790) — IL N'EN RESTE QU'UNE : le grand ménage d'avant mise en
 * ligne a retiré la boîte noire, la sonde du retour, celle de
 * l'historique et celle des clics — chacune posée pour un défaut clos
 * depuis. Le journal de bord reste parce qu'il ne vise aucun défaut
 * précis et qu'il est le seul à dire ce que le SERVEUR voyait.
 */
const DURABLES: {
  nom: NomDeSonde;
  titre: string;
  quoi: string;
  cout: string;
}[] = [
  {
    nom: "journal",
    titre: "Logbook",
    quoi: "Sends every load, navigation, error and session switch to the server (journal-de-bord.ndjson). The redirect circuit breaker stays on watch regardless.",
    cout: "1 send on load + 2 per navigation",
  },
];

/**
 * Les sondes d'affichage, armées par l'adresse.
 * §1 (nº 790) — IL EN RESTE DEUX, et pour la même raison : ce sont des
 * INSTRUMENTS DE MESURE, pas les témoins d'un défaut précis. Les neuf
 * autres (bascule, cartes, carrousel, photos, cadre, filtres,
 * remontée, verre, clavier) sont retirées avec leur défaut, clos.
 */
const PAR_ADRESSE: { parametre: string; titre: string; quoi: string }[] = [
  { parametre: "sonde-vitesse", titre: "Speed", quoi: "Load time, read waterfalls, what waits on what. THIS is the one that says whether the site got faster." },
  { parametre: "sonde-nav", titre: "Navigation", quoi: "The detail of every router navigation." },
];

const FOND = "#0B0F14";
const ENCRE = "#FFFFFF";
const DOUX = "#9BA3AF";
const TRAIT = "#2A2F38";
const VIF = "#FF4D8D";

const CADRE: React.CSSProperties = {
  border: `1px solid ${TRAIT}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  background: "#12161D",
};

/**
 * L'ÉTAT VIT SUR `<html>`, PAS DANS REACT — la marque que le script
 * d'avant peinture y pose (nº 343). On la lit donc par le magasin
 * extérieur de React, comme le site le fait partout ailleurs
 * (`useSyncExternalStore`) : pas d'effet qui recopie un état, pas de
 * cascade de rendus, et l'instantané du SERVEUR est vide — la marque
 * n'existe qu'au navigateur, l'hydratation ne peut donc pas diverger.
 */
const abonnes = new Set<() => void>();

function sAbonnerALaMarque(prevenir: () => void): () => void {
  abonnes.add(prevenir);
  return () => {
    abonnes.delete(prevenir);
  };
}

/** UNE CHAÎNE, et non un tableau : `useSyncExternalStore` compare les
    instantanés par identité — un tableau neuf à chaque lecture le
    ferait tourner sans fin. Deux chaînes égales, elles, sont égales.
    ⚠️ ON PASSE PAR `sondesArmees`, ET C'EST LE POINT (§2 nº 712) :
    cette page-ci vit HORS du groupe « tatouage », donc le script
    d'avant peinture n'y tourne pas et la marque de `<html>` n'y est
    pas posée. Lire la marque en direct montrerait « tout éteint »
    alors que des sondes sont armées — et le premier clic effacerait
    les autres. `sondesArmees` se replie sur la mémoire durable. */
function lireLaMarque(): string {
  return sondesArmees().join(" ");
}

function marqueDuServeur(): string {
  return "";
}

function prevenirLesAbonnes(): void {
  for (const prevenir of abonnes) prevenir();
}

export default function TableauDeBordDesSondes() {
  const marque = useSyncExternalStore(
    sAbonnerALaMarque,
    lireLaMarque,
    marqueDuServeur
  );
  const armees = useMemo(
    () => SONDES.filter((nom) => marque.split(" ").includes(nom)),
    [marque]
  );
  const [adresse, setAdresse] = useState("/");

  const basculer = (nom: NomDeSonde) => {
    if (armees.includes(nom)) eteindreLaSonde(nom);
    else armerLaSonde(nom);
    prevenirLesAbonnes();
  };

  const toutEteindre = () => {
    desarmerLesSondes();
    prevenirLesAbonnes();
  };

  const ouvrirAvec = (parametre: string) => {
    const base = adresse.trim() || "/";
    const separateur = base.includes("?") ? "&" : "?";
    window.open(`${base}${separateur}${parametre}=1`, "_blank");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: FOND,
        color: ENCRE,
        padding: "24px 16px 64px",
        font: "15px/1.5 system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
          Dev probes
        </h1>
        <p style={{ color: DOUX, margin: "0 0 20px" }}>
          All off by default since pass no. 712. The site you see
          without turning anything on here is the site your visitors see.
        </p>

        <div
          style={{
            ...CADRE,
            borderColor: armees.length > 0 ? VIF : TRAIT,
          }}
        >
          <strong style={{ color: armees.length > 0 ? VIF : DOUX }}>
            {armees.length === 0
              ? "Everything is off."
              : `${armees.length} probe${armees.length > 1 ? "s" : ""} on: ${armees.join(", ")}`}
          </strong>
          {armees.length > 0 && (
            <button
              type="button"
              onClick={toutEteindre}
              style={{
                display: "block",
                marginTop: 12,
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 8,
                border: `1px solid ${TRAIT}`,
                background: "#14181F",
                color: ENCRE,
                font: "inherit",
                cursor: "pointer",
              }}
            >
              TURN ALL OFF
            </button>
          )}
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "24px 0 8px" }}>
          Switches
        </h2>
        <p style={{ color: DOUX, margin: "0 0 12px" }}>
          One click is enough, and it sticks from page to page — even
          in a new tab. What&apos;s already installed on an open page
          only goes away on its next load.
        </p>
        {DURABLES.map((sonde) => {
          const allumee = armees.includes(sonde.nom);
          return (
            <div key={sonde.nom} style={CADRE}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <strong>{sonde.titre}</strong>
                <button
                  type="button"
                  onClick={() => basculer(sonde.nom)}
                  aria-pressed={allumee}
                  style={{
                    minHeight: 44,
                    minWidth: 96,
                    borderRadius: 8,
                    border: `1px solid ${allumee ? VIF : TRAIT}`,
                    background: allumee ? VIF : "#14181F",
                    color: allumee ? "#12161D" : ENCRE,
                    font: "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {allumee ? "ON" : "off"}
                </button>
              </div>
              <p style={{ color: DOUX, margin: "8px 0 0" }}>{sonde.quoi}</p>
              <p style={{ color: DOUX, margin: "4px 0 0", fontSize: 13 }}>
                Cost while on: {sonde.cout}.
              </p>
            </div>
          );
        })}

        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "24px 0 8px" }}>
          Display probes
        </h2>
        <p style={{ color: DOUX, margin: "0 0 12px" }}>
          These open with the page they watch: say
          which page, then click the probe. It shows up in a
          new tab; close it and it&apos;s gone.
        </p>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ color: DOUX, display: "block", marginBottom: 4 }}>
            Page to watch
          </span>
          <input
            value={adresse}
            onChange={(evenement) => setAdresse(evenement.target.value)}
            placeholder="/recherche?style=realisme&nature=tatouage"
            style={{
              width: "100%",
              minHeight: 44,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${TRAIT}`,
              background: "#14181F",
              color: ENCRE,
              font: "inherit",
            }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PAR_ADRESSE.map((sonde) => (
            <button
              key={sonde.parametre}
              type="button"
              onClick={() => ouvrirAvec(sonde.parametre)}
              title={sonde.quoi}
              style={{
                minHeight: 44,
                padding: "0 14px",
                borderRadius: 8,
                border: `1px solid ${TRAIT}`,
                background: "#14181F",
                color: ENCRE,
                font: "inherit",
                cursor: "pointer",
              }}
            >
              {sonde.titre}
            </button>
          ))}
        </div>

        <p style={{ color: DOUX, marginTop: 24, fontSize: 13 }}>
          To check nothing is sent anymore: open the site without
          turning anything on here, then look at the &quot;Speed&quot; probe — no
          &quot;/api/dev/…&quot; line should show up. (The browser&apos;s network
          log says it too, filtered on &quot;dev&quot;.)
        </p>
      </div>
    </main>
  );
}
