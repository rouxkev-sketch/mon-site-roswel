"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";
import {
  armerLaVitesse,
  mesuresDeVitesse,
  releveDeVitesse,
  sAbonnerALaVitesse,
  viderLesMesures,
} from "@/lib/vitesse";

/**
 * ██ §1 (nº 679) — LA SONDE DE VITESSE ██
 * ==================================================================
 * CE QU'ELLE EST : l'outil de mesure de vitesse du site, disponible SUR
 * N'IMPORTE QUELLE PAGE. La nº 678 a mesuré cinq pages une fois, avec
 * un banc écrit pour l'occasion ; celle-ci rend la mesure disponible
 * partout et pour toujours — et, surtout, CHEZ LE PROPRIÉTAIRE. C'est
 * ce qui manquait à la nº 678 : je n'ai pas accès à la production, et
 * l'ordre de grandeur d'un gain ne remplace pas un chiffre relevé sur
 * la vraie base, depuis un vrai téléphone.
 *
 * COMMENT ON L'ARME : `?sonde-vitesse=1` au bout de l'adresse (ou
 * `&sonde-vitesse=1` si l'adresse en porte déjà). C'est la convention
 * des dix autres sondes du site, et elle ne change pas.
 *
 * ⚠️ ÉTEINTE, ELLE NE COÛTE RIEN, et ce n'est pas une promesse : elle
 * rend `null` avant tout, et surtout elle N'ARME PAS le module de
 * mesure — ni observateur, ni écouteur de clic, ni tableau. La règle de
 * la boîte noire (nº 654) dit qu'une trace doit tourner en permanence
 * parce qu'un défaut se constate après coup ; une mesure de vitesse,
 * elle, se demande. Les deux règles ne s'opposent pas : elles ne
 * répondent pas à la même question.
 *
 * ⚠️ ELLE NE CHANGE RIEN AU SITE. C'est un INSTRUMENT : elle lit ce que
 * le navigateur mesure déjà (voir `lib/vitesse`), elle n'ajoute pas un
 * chronomètre dans le code des pages. Aucune route n'est touchée,
 * aucun composant n'est instrumenté.
 *
 * ⚠️ CE QU'ELLE NE PEUT PAS DIRE, ET ELLE L'ÉCRIT PLUTÔT QUE DE LE
 * TAIRE : la part exacte du RENDU SERVEUR d'une navigation douce. Le
 * navigateur ne découpe que les chargements de DOCUMENT. Pour une
 * navigation douce, elle donne le total et les requêtes, ce qui suffit
 * à désigner le coupable. Et la colonne « serveur » d'une requête ne se
 * remplit que si la réponse porte un en-tête `Server-Timing` : Next
 * n'en pose pas, et en ajouter aurait voulu dire toucher aux routes —
 * ce que cette passe s'interdit. La colonne attend ce jour-là.
 */

/** Les couleurs de la sonde : celles de ses dix sœurs. */
const ACCENT = "#E11144";
const GRIS = "#9AA1AC";

/**
 * ██ §2 (nº 679) — L'ARMEMENT TIENT L'ONGLET, PAS L'ADRESSE ██
 * ==================================================================
 * LA CAUSE, MESURÉE AVANT D'ÊTRE CORRIGÉE. Au banc, partir de
 * `/contact?sonde-vitesse=1` vers `/recherche` charge TROIS documents
 * (la chaîne de réécriture du proxy) : la nouvelle adresse ne porte plus
 * le drapeau, la sonde ne s'arme pas, la pastille disparaît. Les dix
 * autres sondes s'en accommodent — elles observent un écran. Celle-ci
 * doit tenir « la navigation en cours ET LES SUIVANTES » : une sonde de
 * vitesse qui meurt à la première navigation dure ne mesure rien.
 *
 * D'OÙ CETTE CLÉ D'ONGLET. Armée une fois par l'adresse, la sonde reste
 * armée dans CET onglet jusqu'à ce qu'on l'éteigne (le bouton) ou qu'on
 * ferme l'onglet. `sessionStorage`, et non `localStorage` : rien ne
 * doit survivre à la fermeture, ni déborder sur un autre onglet.
 *
 * ⚠️ ET CELA NE COÛTE TOUJOURS RIEN, ÉTEINTE : une lecture synchrone
 * d'une clé au montage, qui rend `null`. Pas d'observateur, pas
 * d'écouteur, pas de tableau — c'est vérifié au banc en comptant les
 * `PerformanceObserver` et les écouteurs de clic posés sur le document.
 *
 * ⚠️ CE QUI NE TRAVERSE PAS UNE NAVIGATION DURE : les MESURES DÉJÀ
 * PRISES. Un document neuf, c'est un module neuf et un relevé vide. Le
 * relevé se lit donc par tronçon, entre deux chargements de document —
 * et il commence par le chargement lui-même, qui est justement la
 * mesure la mieux découpée dont on dispose.
 */
const CLE_ARMEE = "sonde-vitesse";

/**
 * LES TROIS VERDICTS DE LA LIGNE BASE, et leur couleur. La couleur
 * d’accent ne signale que le seul cas où il y a un gain à prendre —
 * des lectures accolées, une latence chacune (nº 678). Le vert dit
 * « rien à faire ici », le gris « ce n'est pas une cascade ». Peindre
 * les trois à l'accent ferait crier la sonde à chaque page.
 */
const VERDICTS = {
  parallele: { mot: " → IN PARALLEL (already grouped)", couleur: "#34D399" },
  serie: { mot: " → IN SERIES (waiting on each other)", couleur: ACCENT },
  espacees: { mot: " → spaced out (not a waterfall)", couleur: GRIS },
} as const;

/** Le cadre des deux boutons du bas. 44 px : la cible au doigt. */
const CADRE_BOUTON = {
  minHeight: 44,
  borderRadius: 8,
  border: "1px solid #3A3A42",
  background: "#14181F",
  color: "#FFFFFF",
  font: "inherit",
} as const;

/** `sessionStorage` jette en navigation privée : on n'insiste pas. */
function lireLArmement(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_ARMEE) === "1";
  } catch {
    return false;
  }
}

function ecrireLArmement(valeur: boolean): void {
  try {
    if (valeur) window.sessionStorage.setItem(CLE_ARMEE, "1");
    else window.sessionStorage.removeItem(CLE_ARMEE);
  } catch {
    //  Sans stockage, la sonde reste armée le temps du document : c'est
    //  le comportement d'avant, et il vaut mieux que pas de sonde.
  }
}

export function SondeVitesse() {
  const [demandee, setDemandee] = useState(false);
  const { repliee, basculer } = useSondeRepliee();
  const mesures = useSyncExternalStore(
    sAbonnerALaVitesse,
    mesuresDeVitesse,
    () => []
  );

  useEffect(() => {
    //  L'adresse arme ; l'onglet se souvient (voir §2).
    const parLAdresse =
      new URLSearchParams(window.location.search).get("sonde-vitesse") === "1";
    const veut = parLAdresse || lireLArmement();
    if (parLAdresse) ecrireLArmement(true);
    //  ⚠️ POSÉ DANS UN MINUTEUR : poser un état directement depuis un
    //  effet est refusé (react-hooks/set-state-in-effect). C'est le
    //  contournement qu'emploient déjà « Autre adresse » et « Équipe ».
    const minuteur = setTimeout(() => setDemandee(veut), 0);
    //  ET C'EST ICI, ET NULLE PART AILLEURS, QUE LE MODULE S'ARME.
    if (veut) armerLaVitesse();
    return () => clearTimeout(minuteur);
  }, []);

  if (!demandee) return null;
  if (repliee) {
    return (
      <PastilleSonde
        /*  §1 (nº 679) — « T » COMME TEMPS, ET NON « V ». La lettre « V »
            est déjà celle de la sonde du VERRE (retirée nº 790) : deux
            pastilles identiques dans le même coin, c'est une pastille
            qu'on ouvre au hasard. Les prises : B, C, F, H, K, M, N, V. */
        lettre="T"
        titre="Speed"
        surToucher={basculer}
        bas={120}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Speed probe"
      style={{
        position: "fixed",
        left: 6,
        right: 6,
        bottom: "max(6px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        background: "#000000",
        border: `2px solid ${ACCENT}`,
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
        <span style={{ color: ACCENT, fontWeight: 700, flex: 1 }}>
          SPEED · {mesures.length} navigation
          {mesures.length > 1 ? "s" : ""}
        </span>
        <BoutonReplier surToucher={basculer} />
      </div>
      <BoutonCopierJournal texte={releveDeVitesse} pleineLargeur />
      <div style={{ overflowY: "auto", flex: 1 }}>
        {mesures.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>
            Measuring… Browse the site: each measured page
            shows up here.
          </p>
        ) : (
          mesures.map((mesure, rang) => (
            <div key={`${mesure.adresse}-${rang}`} style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 2px" }}>
                <span style={{ color: GRIS }}>{mesure.genre}</span>{" "}
                {mesure.adresse}
              </p>
              {/*  ⚠️ CHAQUE SOMME SOUS LE CHIFFRE QU'ELLE EXPLIQUE, et
                   pas ailleurs : le banc a affiché « premier écran
                   70 ms · attente réseau 83 + rendu 5 », où 83 + 5 fait
                   88 — le TOTAL, pas les 70. Une décomposition posée
                   sous le mauvais nombre est un chiffre faux. */}
              <p style={{ margin: "0 0 2px", color: ACCENT, fontWeight: 700 }}>
                TOTAL {mesure.total} ms
                {mesure.attente !== null ? (
                  <span style={{ color: "#FFFFFF", fontWeight: 400 }}>
                    {" "}
                    = network wait {mesure.attente} + render {mesure.rendu}
                  </span>
                ) : null}
                <span style={{ color: GRIS, fontWeight: 400 }}>
                  {mesure.enCours
                    ? " in progress…"
                    : " until the network goes quiet"}
                </span>
              </p>
              {/*  LE PREMIER ÉCRAN, ET POURQUOI IL EST À PART : une page
                   peint souvent une coquille vide bien avant d'être
                   prête. Confondre les deux, c'est annoncer 68 ms pour
                   une page qui en met 750 (voir l'entête de vitesse).
                   C'est LUI que la décomposition du navigateur explique,
                   et à lui qu'elle s'additionne — pas au total. */}
              <p style={{ margin: "0 0 2px" }}>
                <span style={{ color: GRIS }}>first screen</span>{" "}
                {mesure.premierEcran} ms
                {mesure.reseau !== null ? (
                  <>
                    {" "}
                    = network {mesure.reseau} + server {mesure.serveur} + render{" "}
                    {mesure.rendu}
                  </>
                ) : null}
              </p>
              {/*  LA LIGNE QUI DÉCIDE D'UN GAIN (nº 678) : des lectures
                   qui s'attendent coûtent une latence chacune ; les
                   mêmes lancées ensemble n'en coûtent qu'une. */}
              {mesure.base ? (
                <p style={{ margin: "0 0 2px" }}>
                  <span style={{ color: GRIS }}>BASE</span> {mesure.base.nombre}{" "}
                  lecture{mesure.base.nombre > 1 ? "s" : ""} · {mesure.base.cumul}{" "}
                  ms total over {mesure.base.etendue} ms
                  {mesure.base.verdict === null ? null : (
                    <span
                      style={{
                        color: VERDICTS[mesure.base.verdict].couleur,
                        fontWeight: 700,
                      }}
                    >
                      {VERDICTS[mesure.base.verdict].mot}
                    </span>
                  )}
                </p>
              ) : null}
              {mesure.requetes.map((requete, rangR) => (
                <p
                  key={`${requete.nom}-${rangR}`}
                  style={{ margin: "0 0 1px", paddingLeft: 10 }}
                >
                  <span style={{ color: GRIS }}>
                    {String(requete.duree).padStart(5)} ms
                  </span>{" "}
                  {requete.nom}
                  {requete.serveur !== null ? ` [server ${requete.serveur}]` : ""}
                </p>
              ))}
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {/*  VIDER : pour repartir d'un relevé propre avant un essai. La
             page n'est pas rechargée — seules les mesures s'effacent. */}
        <button
          type="button"
          onClick={viderLesMesures}
          style={{ ...CADRE_BOUTON, flex: 1 }}
        >
          Clear measures
        </button>
        {/*  ÉTEINDRE : la contrepartie de la clé d'onglet du §2. Sans ce
             bouton, une sonde armée ne se quitterait qu'en fermant
             l'onglet — on n'arme pas ce qu'on ne peut pas désarmer. Le
             module déjà armé, lui, ne se démonte pas : il ne mesurera
             plus rien de visible et partira avec le document. */}
        <button
          type="button"
          onClick={() => {
            ecrireLArmement(false);
            viderLesMesures();
            setDemandee(false);
          }}
          style={{ ...CADRE_BOUTON, flex: 1, color: ACCENT }}
        >
          Turn off
        </button>
      </div>
    </div>
  );
}
