"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";
import {
  armerLeJournalDHistorique,
  lireLeJournal,
  lireLeJournalServeur,
  souscrireAuJournal,
  texteDuJournal,
  viderLeJournal,
} from "@/lib/journal-historique";

/**
 * ██ LA SONDE DE L'HISTORIQUE — `?sonde-historique=1` (nº 331-§4) ██
 * ==================================================================
 * Elle AFFICHE le journal que tient `lib/journal-historique` : une
 * ligne par événement, dans l'ordre, avec le rang, l'instant, ce qui
 * est arrivé à la pile, l'adresse complète, qui l'a fait, et la
 * profondeur de la pile à cet instant.
 *
 * LES QUATRE EXIGENCES DU PROPRIÉTAIRE, ET OÙ ELLES SONT TENUES :
 *  1. SURVIVRE AUX CHANGEMENTS DE PAGE — le journal vit dans la
 *     mémoire de l'onglet (`sessionStorage`), pas dans React. Voir
 *     lib/journal-historique.
 *  2. NE RIEN PERTURBER — la sonde ne pose aucune entrée d'historique,
 *     ne gèle pas le corps, ne défile pas, et N'ENTOURE LA PAGE
 *     D'AUCUN CONTENEUR : elle rend des éléments `position: fixed`,
 *     posés à côté de la page, jamais autour. Ses écouteurs sont
 *     passifs ; ses enveloppes appellent toujours l'originale.
 *  3. SE RENVOYER EN TEXTE — le bouton COPIER rend le journal ENTIER,
 *     en trois niveaux de repli (voir OutilsSonde) : sur l'iPhone du
 *     propriétaire, en http, l'accès direct au presse-papier n'existe
 *     pas.
 *  4. LISIBLE À 390 px ET REPLIABLE — panneau à hauteur bornée,
 *     police monospace de 11 px, une ligne par événement qui se replie
 *     sur elle-même ; la pastille rend l'écran à la page.
 *
 * ⚠️ ELLE NE S'ARME QUE SUR DEMANDE : sans `?sonde-historique=1`, elle
 * rend `null` et n'enveloppe rien.
 *
 * ⚠️ TEMPORAIRE — à retirer avant la mise en ligne : cette ligne dans
 * app/(tatouage)/layout.tsx, son import, ce fichier, et
 * src/lib/journal-historique.ts. Inscrite au bandeau des chantiers
 * ouverts (lib/navigation-session).
 */
export function SondeHistorique() {
  const [armee, setArmee] = useState(false);
  const { repliee, basculer } = useSondeRepliee();

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("sonde-historique")) {
      return;
    }
    //  L'ENVELOPPE D'ABORD, l'affichage ensuite : le drapeau est posé
    //  dans une image (le motif de `useAppareilMobile`), pour ne pas
    //  enchaîner deux rendus dans le corps de l'effet.
    const desarmer = armerLeJournalDHistorique();
    const image = requestAnimationFrame(() => setArmee(true));
    return () => {
      cancelAnimationFrame(image);
      desarmer();
    };
  }, []);

  const lignes = useSyncExternalStore(
    souscrireAuJournal,
    lireLeJournal,
    lireLeJournalServeur
  );

  if (!armee) return null;

  if (repliee) {
    return (
      <PastilleSonde
        lettre="H"
        titre="Sonde de l'historique"
        surToucher={basculer}
        //  Au-dessus de la sonde de la remontée, pour que deux sondes
        //  armées en même temps ne se recouvrent pas.
        bas={60}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 4,
        right: 4,
        bottom: 4,
        zIndex: 2147483646,
        maxHeight: "62dvh",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 8,
        borderRadius: 12,
        border: "2px solid #EE3D6F",
        background: "rgba(0,0,0,0.92)",
        color: "#EEE",
        font: "11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <strong style={{ flex: 1, color: "#EE3D6F", fontSize: 12 }}>
          HISTORIQUE — {lignes.length} ligne(s) · pile{" "}
          {typeof window === "undefined" ? "?" : window.history.length}
        </strong>
        <button
          type="button"
          onClick={viderLeJournal}
          style={{
            minHeight: 44,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #666",
            background: "transparent",
            color: "#EEE",
            font: "700 12px ui-monospace, SFMono-Regular, Menlo, monospace",
            cursor: "pointer",
          }}
        >
          VIDER
        </button>
        <BoutonReplier surToucher={basculer} />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {lignes.length === 0 ? (
          <p style={{ margin: 0, color: "#A8A8B0" }}>
            Rien encore. Navigue : chaque entrée posée, remplacée ou
            reprise s&apos;inscrira ici, y compris après un changement de
            page.
          </p>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {lignes.map((l) => (
              <li
                key={l.n}
                style={{
                  padding: "3px 0",
                  borderTop: "1px solid #2A2A2A",
                  //  ⚠️ Les adresses sont longues : elles se coupent
                  //  n'importe où plutôt que de déborder à 390 px.
                  overflowWrap: "anywhere",
                }}
              >
                <span style={{ color: "#A8A8B0" }}>
                  {l.n} · {l.t} ·{" "}
                </span>
                <span style={{ color: couleurDe(l.quoi), fontWeight: 700 }}>
                  {l.quoi}
                </span>
                <span style={{ color: "#A8A8B0" }}> · pile {l.pile}</span>
                <br />
                <span style={{ color: "#F2F2F4" }}>{l.ou}</span>
                <br />
                <span style={{ color: "#8FB7E2" }}>par {l.qui}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <BoutonCopierJournal texte={texteDuJournal} pleineLargeur />
    </div>
  );
}

/** Une couleur par nature d'événement — pour lire la suite d'un coup
    d'œil sur un petit écran. Aucune information n'est PORTÉE par la
    couleur seule : le mot est toujours écrit. */
function couleurDe(quoi: string): string {
  if (quoi.startsWith("POSÉE")) return "#8FE28F";
  if (quoi.startsWith("REMPLACÉE")) return "#FFD37A";
  if (quoi.startsWith("REPRISE")) return "#FF9A9A";
  if (quoi.startsWith("DÉPART")) return "#EE3D6F";
  return "#CFCFD6";
}
