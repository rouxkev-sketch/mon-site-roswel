"use client";

import { useEffect, useState } from "react";
import { desarmerLesSondes, sondeArmee } from "@/lib/sondes-armees";
import {
  BoutonCopierJournal,
  BoutonDesarmer,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";

/**
 * ██ LA SONDE DU CLIC — `?sonde-clic=1` (nº 335-§3) ██
 * ==================================================================
 * POURQUOI ELLE EXISTE. Le propriétaire touche le rond de profil dans
 * la fenêtre du carrousel partagé, et RIEN NE SE PASSE. L'adresse du
 * lien est juste — mesurée à la nº 332. Le clic n'arrive donc pas
 * jusqu'à lui, et il y a trois suspects : un élément invisible posé
 * par-dessus, un gestionnaire qui arrête la propagation, ou l'écouteur
 * de capture de la nº 331.
 *
 * CETTE SONDE RÉPOND À LA SEULE QUESTION QUI TRANCHE : QUEL ÉLÉMENT
 * REÇOIT RÉELLEMENT LE TOUCHER, à l'endroit exact où le doigt s'est
 * posé. Elle relève, pour chaque toucher :
 *  · L'ÉLÉMENT LE PLUS HAUT au point touché (`elementFromPoint`) —
 *    c'est LUI qui reçoit, quoi qu'en dise l'apparence ;
 *  · TOUTE LA PILE d'éléments empilés à ce point, du dessus vers le
 *    dessous : un voile invisible s'y voit d'un coup d'œil ;
 *  · s'il existe un `<a href>` parmi eux, et LEQUEL ;
 *  · si l'événement a été STOPPÉ avant d'atteindre le document (la
 *    sonde écoute en phase de bouillonnement, tout en bas : si elle
 *    n'entend rien alors qu'un toucher a eu lieu, c'est qu'on l'a
 *    arrêté en route) ;
 *  · ET CE QUI SE PASSE ENSUITE — l'adresse une demi-seconde plus tard,
 *    et si la fenêtre est toujours à l'écran. C'est le QUATRIÈME cas,
 *    celui qu'aucun des trois suspects ne montre : le lien PART, et
 *    pourtant rien ne change sous les yeux. « RIEN N'A BOUGÉ » en jaune
 *    veut dire exactement cela.
 *
 * ⚠️ ELLE NE MODIFIE RIEN. Ses écouteurs sont PASSIFS et posés en
 * CAPTURE pour le relevé du point, en BOUILLONNEMENT pour le contrôle
 * d'arrêt : elle ne peut ni annuler un geste, ni le retarder, ni
 * empêcher un lien de partir. Aucun style, aucune classe, aucun
 * attribut posé ailleurs que sur son propre panneau.
 *
 * ⚠️ ELLE NE S'ARME QUE SUR DEMANDE : sans `?sonde-clic=1`, elle rend
 * `null` et n'écoute rien.
 *
 * ⚠️ TEMPORAIRE — inscrite au bandeau des chantiers ouverts
 * (lib/navigation-session), à retirer avant la mise en ligne.
 */

type Toucher = {
  n: number;
  /** Le point touché. */
  ou: string;
  /** L'élément le plus haut à ce point. */
  dessus: string;
  /** La pile complète, du dessus vers le dessous. */
  pile: string;
  /** Le lien trouvé, s'il y en a un. */
  lien: string;
  /** L'événement est-il arrivé jusqu'au document ? */
  arrive: boolean;
  /** L'adresse au moment du toucher. */
  avant: string;
  /** L'adresse une demi-seconde plus tard — et ce qu'il y a à
      l'écran. C'est ce qui distingue « le lien est mort » de « le lien
      est parti mais rien n'a changé sous les yeux ». */
  apres: string;
};

/** L'adresse courante, courte, avec ce qui est affiché par-dessus. */
function ouEnEstOn(): string {
  const fenetre = document.querySelector("[data-fenetre-carrousel]")
    ? " + FENÊTRE"
    : "";
  return (
    location.pathname + location.search + location.hash + fenetre
  );
}

/** Un élément décrit court : balise, identifiant, classes utiles. */
function decrire(el: Element | null): string {
  if (!el) return "—";
  const balise = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const marques = [...el.attributes]
    .filter((a) => a.name.startsWith("data-") && a.name !== "data-testid")
    .map((a) => `[${a.name}]`)
    .join("");
  const aria = el.getAttribute("aria-label");
  const classe = (el.getAttribute("class") ?? "")
    .split(/\s+/)
    .filter((c) => /fixed|absolute|inset|z-\[|opacity|voile|verre/.test(c))
    .slice(0, 3)
    .join(".");
  return (
    balise +
    id +
    marques +
    (aria ? `{${aria.slice(0, 24)}}` : "") +
    (classe ? `.${classe}` : "")
  );
}

export function SondeClic() {
  const [armee, setArmee] = useState(false);
  const [touchers, setTouchers] = useState<Toucher[]>([]);
  const { repliee, basculer } = useSondeRepliee();

  useEffect(() => {
    //  §1 (nº 343) — armement DURABLE, une seule écriture.
    if (!sondeArmee("clic")) return;
    const image = requestAnimationFrame(() => setArmee(true));

    let rang = 0;
    let dernier: Toucher | null = null;

    /** EN CAPTURE, TOUT EN HAUT : on relève le point et la pile AVANT
        que quiconque ait pu arrêter l'événement. */
    const auDepart = (evenement: PointerEvent) => {
      const x = evenement.clientX;
      const y = evenement.clientY;
      const pile = document.elementsFromPoint(x, y);
      const lien = pile.find((e) => e.closest("a[href]"))?.closest("a[href]");
      rang += 1;
      dernier = {
        n: rang,
        ou: `${Math.round(x)} × ${Math.round(y)}`,
        dessus: decrire(pile[0] ?? null),
        pile: pile.slice(0, 6).map(decrire).join(" › "),
        lien: lien ? `${lien.getAttribute("href")}` : "AUCUN",
        arrive: false,
        avant: ouEnEstOn(),
        apres: "…",
      };
      setTouchers((liste) => [...liste.slice(-19), dernier as Toucher]);
      //  ET UNE DEMI-SECONDE PLUS TARD : où en est-on ? Un lien peut
      //  très bien PARTIR sans que rien ne change à l'écran — c'est un
      //  quatrième cas, que ni la pile ni la propagation ne montrent.
      const vu = dernier;
      window.setTimeout(() => {
        const ou = ouEnEstOn();
        setTouchers((liste) =>
          liste.map((t) => (t.n === vu.n ? { ...t, apres: ou } : t))
        );
      }, 700);
    };

    /** EN BOUILLONNEMENT, TOUT EN BAS : si l'on n'entend rien, c'est
        que l'événement a été arrêté en route. */
    const aLArrivee = () => {
      if (!dernier) return;
      const vu = dernier;
      setTouchers((liste) =>
        liste.map((t) => (t.n === vu.n ? { ...t, arrive: true } : t))
      );
    };

    document.addEventListener("pointerdown", auDepart, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", aLArrivee, { passive: true });
    return () => {
      cancelAnimationFrame(image);
      document.removeEventListener("pointerdown", auDepart, { capture: true });
      document.removeEventListener("click", aLArrivee);
    };
  }, []);

  if (!armee) return null;

  if (repliee) {
    return (
      <PastilleSonde
        lettre="C"
        titre="Sonde du clic"
        surToucher={basculer}
        bas={112}
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
        zIndex: 2147483645,
        maxHeight: "56dvh",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 8,
        borderRadius: 12,
        border: "2px solid #E11144",
        background: "rgba(0,0,0,0.92)",
        color: "#EEE",
        font: "11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <strong style={{ flex: 1, color: "#E11144", fontSize: 12 }}>
          CLIC — {touchers.length} toucher(s)
        </strong>
        {/*  §4 (nº 343) — DÉSARMER SANS TAPER D'ADRESSE. L'armement
             étant durable, il faut pouvoir l'éteindre d'un doigt. */}
        <BoutonDesarmer surToucher={desarmerLesSondes} />
        <BoutonReplier surToucher={basculer} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {touchers.length === 0 ? (
          <p style={{ margin: 0, color: "#A8A8B0" }}>
            Touche le rond de profil. La sonde dira quel élément a
            réellement reçu ton doigt.
          </p>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {touchers
              .slice()
              .reverse()
              .map((t) => (
                <li
                  key={t.n}
                  style={{
                    padding: "4px 0",
                    borderTop: "1px solid #2A2A2A",
                    overflowWrap: "anywhere",
                  }}
                >
                  <span style={{ color: "#A8A8B0" }}>
                    {t.n} · {t.ou} ·{" "}
                  </span>
                  <span style={{ color: t.arrive ? "#8FE28F" : "#FF9A9A" }}>
                    {t.arrive ? "arrivé au document" : "ARRÊTÉ EN ROUTE"}
                  </span>
                  <br />
                  <span style={{ color: "#F2F2F4" }}>dessus : {t.dessus}</span>
                  <br />
                  <span style={{ color: "#8FB7E2" }}>pile : {t.pile}</span>
                  <br />
                  <span
                    style={{ color: t.lien === "AUCUN" ? "#FFD37A" : "#8FE28F" }}
                  >
                    lien : {t.lien}
                  </span>
                  <br />
                  <span
                    style={{
                      color: t.avant === t.apres ? "#FFD37A" : "#A8A8B0",
                    }}
                  >
                    {t.avant === t.apres
                      ? `RIEN N'A BOUGÉ : ${t.apres}`
                      : `${t.avant} → ${t.apres}`}
                  </span>
                </li>
              ))}
          </ol>
        )}
      </div>
      <BoutonCopierJournal
        pleineLargeur
        texte={() =>
          `SONDE DU CLIC — ${touchers.length} toucher(s)\n` +
          touchers
            .map(
              (t) =>
                `${t.n} · ${t.ou} · ${t.arrive ? "arrivé" : "ARRÊTÉ"}\n` +
                `   dessus : ${t.dessus}\n   pile : ${t.pile}\n   lien : ${t.lien}\n` +
                `   ${t.avant === t.apres ? `RIEN N'A BOUGÉ : ${t.apres}` : `${t.avant} → ${t.apres}`}`
            )
            .join("\n")
        }
      />
    </div>
  );
}
