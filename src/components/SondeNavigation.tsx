"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";

/**
 * LA SONDE DE NAVIGATION — ELLE MESURE CHEZ LE PROPRIÉTAIRE, ET NE
 * CORRIGE RIEN
 * ==================================================================
 * QUATRE PASSES ont « corrigé » trois défauts à partir de mesures
 * faites ICI, dans un Chromium sans clavier, sans barre d'outils
 * Safari, sans le cache de navigation d'un vrai navigateur. Chaque
 * fois les chiffres étaient verts ; chaque fois le défaut est resté.
 * Un banc qui ne reproduit pas le terrain ne prouve rien — il rassure.
 *
 * Ce fichier renverse la méthode, comme la sonde du clavier
 * (SondeClavier) l'avait fait après dix passes à l'aveugle : il
 * enregistre ce qui se passe VRAIMENT sur l'appareil du propriétaire,
 * et rend un texte à recopier d'un geste.
 *
 * TROIS MESURES, UNE À LA FOIS :
 *  · RETOUR — toute écriture d'historique (`pushState`,
 *    `replaceState`, d'où qu'elle vienne) et tout `popstate`, avec
 *    l'adresse, la longueur de l'historique AVANT et APRÈS, et
 *    l'origine de l'appel (la pile) : c'est elle qui dit si c'est le
 *    routeur de Next ou notre code ;
 *  · BARRE — image par image pendant deux secondes après un clic sur
 *    un bouton d'affichage : la rangée du moteur (repliée ? quelle
 *    hauteur ?), le fond calculé de la barre, le défilement, chaque
 *    événement de défilement avec son delta, et l'état du drapeau
 *    « défilement programmé » ;
 *  · CHAMP — image par image pendant deux secondes après le toucher
 *    d'un champ : sa position à l'écran, le défilement, la marge
 *    `scroll-margin-top` réellement appliquée, la hauteur du viewport
 *    visuel, l'espace de fin de document, l'état « barre fixe sortie
 *    de l'écran » (colonne `clavier`, nº 160-§3), et tout appel à
 *    `scrollIntoView` (avec ses arguments).
 *
 * ELLE NE FAIT QUE LIRE — c'est la règle absolue.
 *  · les écouteurs sont POSÉS EN PASSIF ET EN CAPTURE : ils ne
 *    peuvent ni annuler un geste, ni retarder la remise du doigt à sa
 *    cible ;
 *  · les trois fonctions enveloppées (`pushState`, `replaceState`,
 *    `scrollIntoView`) APPELLENT TOUJOURS L'ORIGINALE, avec les mêmes
 *    arguments, et rendent sa valeur. Elles notent après coup ;
 *  · aucun style, aucune classe, aucun attribut n'est posé sur autre
 *    chose que les éléments de la sonde ;
 *  · tout est remis en place au démontage.
 *
 * ELLE NE S'ARME QUE SUR DEMANDE : sans `?sonde-nav=1` dans l'adresse,
 * l'effet sort à la première ligne — aucun écouteur, aucune
 * enveloppe, rien à l'écran. Le site est alors rigoureusement celui de
 * tout le monde.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier et la ligne
 * `<SondeNavigation />` de src/app/(tatouage)/layout.tsx.
 */

/** Ce que l'on mesure. */
type Mesure = "retour" | "barre" | "champ";

/** Combien de temps on filme après le geste (ms). */
const DUREE_FILM_MS = 2000;

/** Une ligne du journal — un événement daté. */
type Ligne = { t: number; texte: string };

/** Un relevé image par image. */
type Image = Record<string, string | number | null>;

/** L'horloge de la sonde : des millisecondes depuis son armement. */
function maintenant(depart: number): number {
  return Math.round(performance.now() - depart);
}

/** La pile d'appel, réduite à ce qui désigne l'appelant. */
function origine(): string {
  const pile = new Error().stack ?? "";
  const lignes = pile
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    //  On saute les images de la sonde elle-même.
    .filter((l) => !l.includes("SondeNavigation"));
  //  Trois images suffisent à reconnaître le routeur de Next
  //  (app-router, navigate-reducer…) de notre propre code.
  return lignes
    .slice(0, 3)
    .map((l) =>
      l
        .replace(/^at\s+/, "")
        .replace(/https?:\/\/[^/]+/, "")
        .slice(0, 92)
    )
    .join(" ← ");
}

/** LA MARGE DE REMONTÉE RÉELLEMENT APPLIQUÉE.
    ⚠️ Le relevé du propriétaire la donnait VIDE alors que le film
    disait 76 px : selon le navigateur, la propriété en camel
    (`scrollMarginTop`) peut rendre une chaîne vide là où le nom CSS
    complet répond. On demande donc les deux, et on le dit quand
    aucune ne répond. */
function margeLue(element: Element): string {
  const style = getComputedStyle(element);
  return (
    style.getPropertyValue("scroll-margin-top") ||
    style.scrollMarginTop ||
    "(vide)"
  );
}

/** L'adresse courante, chemin + critères. */
function adresse(): string {
  return window.location.pathname + window.location.search;
}

export function SondeNavigation() {
  const [armee, setArmee] = useState(false);
  const [mesure, setMesure] = useState<Mesure>("retour");
  const [enCours, setEnCours] = useState(false);
  /** Le nombre d'événements retenus — le témoin le montre. */
  const [combien, setCombien] = useState(0);
  const [rapport, setRapport] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const zoneTexte = useRef<HTMLTextAreaElement>(null);

  /** Le journal — hors de React : on y écrit des dizaines de fois par
      seconde, et un rendu par écriture fausserait la mesure. */
  const journal = useRef<Ligne[]>([]);
  const images = useRef<Image[]>([]);
  const depart = useRef(0);
  const mesureCourante = useRef<Mesure>("retour");

  /* 1. L'ARMEMENT — `?sonde-nav=1`, et rien d'autre. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sonde-nav") !== "1") return;
    setArmee(true);
    depart.current = performance.now();
  }, []);

  const noter = useCallback((texte: string) => {
    journal.current.push({ t: maintenant(depart.current), texte });
    setCombien(journal.current.length);
  }, []);

  const vider = useCallback(() => {
    journal.current = [];
    images.current = [];
    depart.current = performance.now();
    setCombien(0);
    setRapport(null);
    setCopie(null);
  }, []);

  /* ================================================================
   * 4. LE RAPPORT — un texte brut, lisible tel quel
   * ================================================================ */
  const construire = useCallback((): string => {
    const entete = [
      `SONDE NAVIGATION — mesure « ${mesureCourante.current} »`,
      `appareil : ${document.documentElement.dataset.appareil ?? "?"} · écran ${window.innerWidth}×${window.innerHeight}`,
      `navigateur : ${navigator.userAgent}`,
      `adresse : ${adresse()}`,
      `history.length : ${history.length}`,
      "",
    ];

    const evenements = journal.current.length
      ? [
          "── ÉVÉNEMENTS ──",
          ...journal.current.map((l) => `[${String(l.t).padStart(5)} ms] ${l.texte}`),
          "",
        ]
      : [];

    let film: string[] = [];
    if (images.current.length > 0) {
      const colonnes = Object.keys(images.current[0]);
      const largeur = (c: string) =>
        Math.max(
          c.length,
          ...images.current.map((i) => String(i[c] ?? "—").length)
        );
      const tailles = colonnes.map(largeur);
      const ligne = (valeurs: (string | number | null)[]) =>
        valeurs
          .map((v, i) => String(v ?? "—").padEnd(tailles[i]))
          .join("  ")
          .trimEnd();
      //  UNE IMAGE SUR DEUX AU PLUS : à 60 images par seconde, deux
      //  secondes font 120 lignes — assez pour voir, pas trop pour
      //  coller dans une conversation.
      const pas = images.current.length > 70 ? 2 : 1;
      film = [
        "── FILM (une ligne par image) ──",
        ligne(colonnes),
        ...images.current
          .filter((_, i) => i % pas === 0)
          .map((i) => ligne(colonnes.map((c) => i[c]))),
        "",
      ];
    }

    return [...entete, ...evenements, ...film, "── fin ──"].join("\n");
  }, []);

  /* ================================================================
   * 2. LA MESURE « RETOUR » — les écritures d'historique
   * ================================================================
   * Elle est ARMÉE EN PERMANENCE (tant que ce mode est choisi) : le
   * propriétaire fait son parcours — Google, une recherche, une
   * seconde recherche — puis appuie sur Retour, et vient enfin lire.
   * Rien ne doit lui demander de « lancer » quoi que ce soit avant.
   */
  useEffect(() => {
    if (!armee || mesure !== "retour") return;
    mesureCourante.current = "retour";
    noter(`— départ · adresse ${adresse()} · history.length ${history.length}`);

    const originaux: Partial<Record<"pushState" | "replaceState", History["pushState"]>> = {};

    for (const nom of ["pushState", "replaceState"] as const) {
      const original = window.history[nom];
      originaux[nom] = original;
      window.history[nom] = function (
        this: History,
        ...arguments_: Parameters<History["pushState"]>
      ) {
        const avantLongueur = history.length;
        const avantAdresse = adresse();
        const qui = origine();
        //  ⚠️ ON APPELLE TOUJOURS L'ORIGINALE, telle quelle.
        const retour = original.apply(this, arguments_);
        journal.current.push({
          t: maintenant(depart.current),
          texte:
            `${nom.toUpperCase()} · url demandée « ${String(arguments_[2] ?? "(aucune)")} »\n` +
            `    avant : ${avantAdresse} (length ${avantLongueur})\n` +
            `    après : ${adresse()} (length ${history.length})\n` +
            `    appelé par : ${qui}`,
        });
        setCombien(journal.current.length);
        return retour;
      };
    }

    const auRetour = (evenement: PopStateEvent) => {
      let etat = "(vide)";
      try {
        etat = JSON.stringify(evenement.state)?.slice(0, 160) ?? "null";
      } catch {
        etat = "(illisible)";
      }
      noter(
        `POPSTATE · adresse ${adresse()} (length ${history.length})\n` +
          `    state : ${etat}`
      );
    };
    //  `pagehide` dit qu'on QUITTE le document : c'est ce qui se
    //  passe quand le retour sort du site (vers Google).
    const auDepart = () => noter("PAGEHIDE · le document est quitté");

    window.addEventListener("popstate", auRetour, { passive: true });
    window.addEventListener("pagehide", auDepart, { passive: true });
    return () => {
      for (const nom of ["pushState", "replaceState"] as const) {
        const original = originaux[nom];
        if (original) window.history[nom] = original;
      }
      window.removeEventListener("popstate", auRetour);
      window.removeEventListener("pagehide", auDepart);
    };
  }, [armee, mesure, noter]);

  /* ================================================================
   * 3. LES DEUX FILMS — « barre » et « champ »
   * ================================================================
   * Même squelette : un geste déclencheur, deux secondes de relevés
   * image par image, puis on s'arrête tout seul.
   */
  useEffect(() => {
    if (!armee || mesure === "retour") return;
    mesureCourante.current = mesure;

    let image = 0;
    let minuteur = 0;
    let filme = false;
    let cible: HTMLElement | null = null;
    let yPrecedent = window.scrollY;
    const scrollIntoViewOriginal = Element.prototype.scrollIntoView;

    /** Le relevé d'une image — ce qu'on voit à cet instant. */
    const relever = () => {
      const barre = document.querySelector("[data-barre-fixe]");
      const rangee = document.querySelector("[data-rangee-moteur]");
      const commun: Image = {
        t: maintenant(depart.current),
        scrollY: Math.round(window.scrollY),
      };
      if (mesureCourante.current === "barre") {
        images.current.push({
          ...commun,
          barreFond: barre ? getComputedStyle(barre).backgroundColor : "—",
          barreHaut: barre
            ? Math.round(barre.getBoundingClientRect().top)
            : null,
          barreHauteur: barre
            ? Math.round(barre.getBoundingClientRect().height)
            : null,
          rangeeHauteur: rangee
            ? Math.round(rangee.getBoundingClientRect().height)
            : null,
          rangeeRepliee:
            rangee?.getAttribute("aria-hidden") === "true" ? "oui" : "non",
          rangeeOpacite: rangee ? getComputedStyle(rangee).opacity : "—",
          progr:
            document.documentElement.dataset.defilementProgramme ? "OUI" : "non",
          docH: document.documentElement.scrollHeight,
        });
      } else {
        const boite = cible?.getBoundingClientRect();
        images.current.push({
          ...commun,
          champHaut: boite ? Math.round(boite.top) : null,
          champBas: boite ? Math.round(boite.bottom) : null,
          marge: cible ? margeLue(cible) : "—",
          vvH: window.visualViewport
            ? Math.round(window.visualViewport.height)
            : null,
          vvTop: window.visualViewport
            ? Math.round(window.visualViewport.offsetTop)
            : null,
          innerH: window.innerHeight,
          docH: document.documentElement.scrollHeight,
          //  L'ESPACE DE REMONTÉE (nº 159-§3) : présent ? c'est lui
          //  qui donne au document de quoi défiler.
          espace: document.querySelector("[data-espace-remontee]")
            ? "OUI"
            : "non",
          //  LA BARRE FIXE EST-ELLE SORTIE DE L'ÉCRAN (nº 160-§3) ?
          //  C'est cet attribut qui fait passer la marge de 76 px à
          //  12 px — la colonne « marge » d'à côté le confirme.
          clavier: document.documentElement.dataset.clavier ? "OUI" : "non",
        });
      }
    };

    const arreter = () => {
      if (!filme) return;
      filme = false;
      cancelAnimationFrame(image);
      window.clearTimeout(minuteur);
      setEnCours(false);
      noter(`— fin du film (${images.current.length} images)`);
      setRapport(construire());
    };

    const boucle = () => {
      if (!filme) return;
      relever();
      image = requestAnimationFrame(boucle);
    };

    const demarrer = (quoi: string, element: HTMLElement | null) => {
      if (filme) return;
      vider();
      filme = true;
      cible = element;
      yPrecedent = window.scrollY;
      setEnCours(true);
      noter(`— déclencheur : ${quoi}`);
      relever();
      image = requestAnimationFrame(boucle);
      minuteur = window.setTimeout(arreter, DUREE_FILM_MS);
    };

    /* --- LE DÉCLENCHEUR « BARRE » : les deux boutons d'affichage --- */
    const auClic = (evenement: Event) => {
      if (mesureCourante.current !== "barre") return;
      const touche = (evenement.target as HTMLElement | null)?.closest?.(
        "button"
      );
      if (!touche) return;
      const nom = touche.getAttribute("aria-label") ?? "";
      if (
        !/Afficher une image par ligne|Afficher deux colonnes|Voir les images seules|Revenir aux cartes/.test(
          nom
        )
      ) {
        return;
      }
      demarrer(`clic sur « ${nom} »`, null);
    };

    /* --- LE DÉCLENCHEUR « CHAMP » : le toucher d'une saisie --- */
    const auFocus = (evenement: FocusEvent) => {
      if (mesureCourante.current !== "champ") return;
      const element = evenement.target;
      if (!(element instanceof HTMLElement)) return;
      if (!element.matches("input, textarea")) return;
      demarrer(
        `champ « ${element.getAttribute("aria-label") ?? element.getAttribute("name") ?? element.tagName.toLowerCase()} »`,
        element
      );
    };

    /* --- TOUT DÉFILEMENT, avec son delta et son origine --- */
    const auDefilement = () => {
      if (!filme) return;
      const y = window.scrollY;
      const delta = Math.round(y - yPrecedent);
      yPrecedent = y;
      journal.current.push({
        t: maintenant(depart.current),
        texte: `SCROLL · y ${Math.round(y)} · delta ${delta > 0 ? "+" : ""}${delta} · programmé : ${
          document.documentElement.dataset.defilementProgramme ? "OUI" : "non"
        }`,
      });
    };

    /* --- `scrollIntoView` : appelé ? avec quoi ? --- */
    Element.prototype.scrollIntoView = function (
      this: Element,
      ...arguments_: Parameters<Element["scrollIntoView"]>
    ) {
      if (filme) {
        const decrire =
          this instanceof HTMLElement
            ? `${this.tagName.toLowerCase()}${this.getAttribute("name") ? `[name=${this.getAttribute("name")}]` : ""}`
            : "(élément)";
        journal.current.push({
          t: maintenant(depart.current),
          texte:
            `SCROLLINTOVIEW · sur ${decrire} · arguments ${JSON.stringify(arguments_[0] ?? null)}\n` +
            `    marge appliquée : ${margeLue(this)}\n` +
            `    appelé par : ${origine()}`,
        });
      }
      //  ⚠️ TOUJOURS L'ORIGINALE, sans rien changer.
      return scrollIntoViewOriginal.apply(this, arguments_);
    };

    document.addEventListener("click", auClic, { capture: true, passive: true });
    document.addEventListener("focusin", auFocus, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", auDefilement, { passive: true });

    return () => {
      filme = false;
      cancelAnimationFrame(image);
      window.clearTimeout(minuteur);
      Element.prototype.scrollIntoView = scrollIntoViewOriginal;
      document.removeEventListener("click", auClic, { capture: true });
      document.removeEventListener("focusin", auFocus, { capture: true });
      window.removeEventListener("scroll", auDefilement);
    };
  }, [armee, mesure, noter, vider, construire]);

  /* 5. LE PRESSE-PAPIERS — deux chemins, comme la sonde du clavier :
        l'API moderne, puis la sélection du texte (iOS hors HTTPS). */
  const copier = useCallback(async () => {
    const texte = rapport ?? construire();
    try {
      await navigator.clipboard.writeText(texte);
      setCopie("Copié ! Colle-le dans la conversation.");
      return;
    } catch {
      /* on tente l'autre chemin */
    }
    const zone = zoneTexte.current;
    if (zone) {
      zone.focus();
      zone.setSelectionRange(0, texte.length);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      setCopie(
        ok
          ? "Copié ! Colle-le dans la conversation."
          : "Le texte est sélectionné : garde le doigt appuyé dessus, puis « Copier »."
      );
    }
  }, [rapport, construire]);

  if (!armee) return null;

  const bouton = (actif: boolean): React.CSSProperties => ({
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 999,
    border: actif ? "none" : "1px solid #666",
    background: actif ? "#EE3D6F" : "transparent",
    color: actif ? "#fff" : "#ddd",
    font: "600 12px system-ui, sans-serif",
  });

  return (
    <>
      {/* LE PANNEAU DE COMMANDE — petit, en bas, toujours là. C'est le
          SEUL élément qui prend le doigt, et il ne recouvre aucun
          contrôle du site (bande de 44 px en bas de l'écran). */}
      {!rapport && (
        <div
          role="group"
          aria-label="Sonde de navigation"
          style={{
            position: "fixed",
            left: 6,
            right: 6,
            bottom: "max(6px, env(safe-area-inset-bottom))",
            zIndex: 2147483000,
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
            background: "rgba(0,0,0,.82)",
            border: "1px solid #EE3D6F",
            borderRadius: 12,
            padding: 6,
            font: "12px system-ui, sans-serif",
            color: "#eee",
          }}
        >
          <span style={{ fontWeight: 700, color: enCours ? "#EE3D6F" : "#eee" }}>
            {enCours ? "enregistrement…" : `sonde (${combien})`}
          </span>
          <button type="button" style={bouton(mesure === "retour")} onClick={() => { setMesure("retour"); vider(); }}>
            Retour
          </button>
          <button type="button" style={bouton(mesure === "barre")} onClick={() => { setMesure("barre"); vider(); }}>
            Barre
          </button>
          <button type="button" style={bouton(mesure === "champ")} onClick={() => { setMesure("champ"); vider(); }}>
            Champ
          </button>
          <button type="button" style={bouton(false)} onClick={vider}>
            Effacer
          </button>
          <button
            type="button"
            style={{ ...bouton(true), marginLeft: "auto" }}
            onClick={() => setRapport(construire())}
          >
            Voir le rapport
          </button>
        </div>
      )}

      {/* LE RAPPORT — plein écran, avec « Copier ». */}
      {rapport && (
        <div
          role="dialog"
          aria-label="Rapport de la sonde de navigation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            background: "#111",
            color: "#eee",
            display: "flex",
            flexDirection: "column",
            font: "13px/1.45 system-ui, sans-serif",
            padding:
              "max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom))",
            boxSizing: "border-box",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>
            Rapport — mesure « {mesureCourante.current} »
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={copier}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 999,
                border: "none",
                background: "#EE3D6F",
                color: "#fff",
                font: "600 15px system-ui, sans-serif",
              }}
            >
              Copier
            </button>
            {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A). */}
            <BoutonEnvoyerJournal
              sonde="navigation"
              texte={() => rapport ?? ""}
              pleineLargeur
            />
            <button
              type="button"
              onClick={() => {
                setCopie(null);
                setRapport(null);
              }}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 999,
                border: "1px solid #666",
                background: "transparent",
                color: "#eee",
                font: "600 15px system-ui, sans-serif",
              }}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={vider}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 999,
                border: "1px solid #666",
                background: "transparent",
                color: "#eee",
                font: "600 15px system-ui, sans-serif",
              }}
            >
              Nouvelle mesure
            </button>
          </div>
          {copie && (
            <p style={{ margin: "0 0 8px", color: "#8fe28f" }}>{copie}</p>
          )}
          <textarea
            ref={zoneTexte}
            readOnly
            value={rapport}
            style={{
              flex: 1,
              width: "100%",
              background: "#000",
              color: "#ddd",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 8,
              font: "11px/1.35 ui-monospace, Menlo, Consolas, monospace",
              whiteSpace: "pre",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </>
  );
}
