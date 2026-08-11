"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";
import {
  BoutonCopierJournal,
  BoutonReplier,
  PastilleSonde,
  useSondeRepliee,
} from "@/components/OutilsSonde";

/**
 * LA SONDE — ELLE MESURE SUR LE VRAI IPHONE, ELLE NE CORRIGE RIEN
 * ================================================================
 * SIX PASSES ont tenté de corriger le même défaut à partir de mesures
 * faites dans un navigateur SANS CLAVIER. Un émulateur ne peut pas
 * ouvrir de clavier : `visualViewport.height` n'y descend jamais tout
 * seul, et Safari y prend des décisions qu'aucune simulation ne
 * reproduit. Toutes les mesures étaient donc vraies… et hors sujet.
 *
 * Ce fichier renverse la méthode : il enregistre ce qui se passe
 * VRAIMENT, sur l'appareil du propriétaire, quand son doigt touche le
 * champ de localité. Il rend ensuite un texte à recopier d'un geste.
 *
 * ELLE NE FAIT QUE LIRE — c'est la règle absolue.
 *  · tous les écouteurs sont POSÉS EN PASSIF et EN CAPTURE : ils ne
 *    peuvent ni annuler un geste (`preventDefault` est interdit sur un
 *    écouteur passif), ni retarder la remise du doigt à sa cible ;
 *  · aucun style, aucune classe, aucun attribut n'est posé sur quoi
 *    que ce soit d'autre que ses propres éléments ;
 *  · son panneau de résultats n'existe QU'APRÈS les 2 secondes
 *    d'enregistrement : pendant la séquence, il n'y a rien à l'écran
 *    que le témoin, minuscule, en bas à gauche, et hors du toucher
 *    (`pointerEvents: none`).
 *
 * ELLE NE S'ARME QUE SUR DEMANDE : sans `?sonde=1` dans l'adresse,
 * l'effet sort à la première ligne — aucun écouteur, aucune boucle,
 * rien à l'écran. Le site est alors rigoureusement celui de tout le
 * monde.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier et la ligne
 * `<SondeClavier />` de src/app/(tatouage)/layout.tsx. Rien d'autre
 * n'y touche.
 */

/** Combien de temps on enregistre après le toucher (ms). */
const DUREE_MS = 2000;

/** Une image : tout ce qu'on relève, à un instant donné. */
type Image = {
  t: number;
  /** ⚠️ SUR IPHONE, LES DEUX NE BOUGENT PAS ENSEMBLE : le clavier
      réduit le viewport VISUEL et laisse `innerHeight` intact. Les
      relever tous les deux dit lequel a bougé — donc si le clavier est
      en cause, ou autre chose. */
  innerH: number;
  vvH: number | null;
  vvTop: number | null;
  vvPageTop: number | null;
  vvPageLeft: number | null;
  scrollY: number;
  docTop: number;
  bodyTop: string;
  bodyPos: string;
  fond: number | null;
  panHaut: number | null;
  panBas: number | null;
  panHauteur: number | null;
  maxH: string;
  cible: string;
  vu: string;
  /** LE RECOLLAGE À L'ÉCRAN, porté par le CONTENEUR de la fenêtre et
      posé SANS transition — à ne pas confondre avec la cible du
      panneau. Les deux `translateY` s'empilent : celui-ci annule le
      glissement du viewport visuel, l'autre place la fenêtre dans la
      zone visible. */
  recollage: string;
  champHaut: number | null;
  champBas: number | null;
  /** ⚠️ LES QUATRE REPÈRES QUI NE PEUVENT PAS MENTIR.
      Le repère d'arrière-plan (une carte de la mosaïque) vit DANS le
      corps : quand le corps descend, la carte descend avec lui, leur
      distance ne change pas, et la sonde ne voyait RIEN. Elle mesurait
      un déplacement RELATIF là où il fallait un déplacement ABSOLU.
      Une capture sur l'appareil a montré une bande blanche de près de
      la moitié de l'écran, pendant que la sonde annonçait « une seule
      valeur ». Ces quatre-là sont ancrés à l'ÉCRAN. */
  /** LE HAUT DU CORPS À L'ÉCRAN. Négatif quand la page est défilée
      (c'est normal : le verrou décale le corps de la position de
      défilement) ; ZÉRO quand la page est en haut. */
  corpsHaut: number | null;
  /** ⚠️ LA HAUTEUR DE LA BANDE DÉCOUVERTE — LE CHIFFRE DÉCISIF.
      C'est le haut du corps quand il est POSITIF, c'est-à-dire quand
      le corps est descendu SOUS le bord de l'écran et laisse du vide
      au-dessus. Zéro = aucune bande. Toute autre valeur est le défaut,
      en pixels. */
  bande: number;
  /** La barre du site (en-tête collant) : elle doit rester à 0. */
  barreHaut: number | null;
  /** Le logo : même chose, et c'est ce que l'œil repère en premier. */
  logoHaut: number | null;
  /** CE QUI PEINT TOUT EN HAUT DE L'ÉCRAN. `HTML` = plus rien du site
      ne couvre cette zone : c'est la bande. */
  sommet: string;
  /** Le fond du canevas — celui qu'on voit dans la bande. */
  fondCanevas: string;
};

type Evenement = { t: number; nom: string; detail: string };

/** Le champ que l'on guette : la localité, fenêtre du moteur ou web. */
function estLeChamp(cible: EventTarget | null): HTMLElement | null {
  if (!(cible instanceof Element)) return null;
  const champ = cible.closest("input");
  if (!champ) return null;
  return /lieu/i.test(champ.id) ? champ : null;
}

/** Le CONTENEUR de la fenêtre du moteur (il porte le recollage). */
function leConteneur(): HTMLElement | null {
  const dialogue = document.querySelector(
    '[role="dialog"][aria-label="Rechercher un tatoueur"]'
  );
  return dialogue instanceof HTMLElement ? dialogue : null;
}

/** Le panneau de la fenêtre du moteur, s'il est là. */
function lePanneau(): HTMLElement | null {
  const dialogue = leConteneur();
  if (!dialogue) return null;
  const dernier = dialogue.querySelector(":scope > div:last-child");
  return dernier instanceof HTMLElement ? dernier : null;
}

/** Un repère de l'ARRIÈRE-PLAN : une carte de la mosaïque. C'est lui
    qui dit si la page bouge derrière la fenêtre. */
function leRepere(): HTMLElement | null {
  const candidats = ["main article", "article", "main"];
  for (const s of candidats) {
    const n = document.querySelector(s);
    if (n instanceof HTMLElement) return n;
  }
  return null;
}

/** La translation RÉELLEMENT PEINTE (la cible, elle, est en style). */
function translationVue(element: HTMLElement | null): string {
  if (!element) return "—";
  const t = getComputedStyle(element).transform;
  if (!t || t === "none") return "0";
  const nombres = t.slice(t.indexOf("(") + 1, t.lastIndexOf(")")).split(",");
  const dernier = nombres[nombres.length - 1];
  return dernier ? String(Math.round(Number(dernier))) : t;
}

/** UN ÉLÉMENT SANS BOÎTE N'EST PAS « À ZÉRO », IL EST ABSENT.
    `getBoundingClientRect` rend un rectangle tout à zéro pour un nœud
    en `display: none` — or c'est exactement le cas de la barre du site
    et du logo tant que la page de recherche est ouverte (elle retire
    tout le site du flux). Lire « barre du site = 0 » voudrait alors
    dire « collée en haut », ce qui serait FAUX. On rend `null`, et le
    rapport écrit « (absent) ». */
const boite = (n: HTMLElement | null) => {
  if (!n || !n.isConnected) return null;
  const r = n.getBoundingClientRect();
  return r.width === 0 && r.height === 0 ? null : r;
};
const haut = (n: HTMLElement | null) => {
  const r = boite(n);
  return r ? Math.round(r.top) : null;
};
const bas = (n: HTMLElement | null) => {
  const r = boite(n);
  return r ? Math.round(r.bottom) : null;
};

/** L'adresse porte-t-elle `?sonde=1` ? Lu comme une donnée EXTÉRIEURE
    à React : côté serveur la réponse est toujours « non », de sorte que
    le HTML envoyé à tout le monde est celui d'un site sans sonde. */
const RIEN_A_ECOUTER = () => () => {};
const lireAdresse = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("sonde");
const jamaisSurLeServeur = () => false;

export function SondeClavier() {
  const armee = useSyncExternalStore(
    RIEN_A_ECOUTER,
    lireAdresse,
    jamaisSurLeServeur
  );
  //  ⚠️ REPLIÉE AU DÉPART (nº 183-§1) : le rapport plein écran
  //  masquait le bouton « Valider » du moteur.
  const { repliee, basculer } = useSondeRepliee();
  const [enCours, setEnCours] = useState(false);
  const [rapport, setRapport] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const zoneTexte = useRef<HTMLTextAreaElement>(null);

  /* 2. L'ENREGISTREMENT. Armé tant qu'aucun rapport n'est affiché ;
        « Nouvelle mesure » remet `rapport` à null et le ré-arme. */
  useEffect(() => {
    if (!armee || rapport) return;

    const vue = window.visualViewport;
    let arret: (() => void) | null = null;

    function demarrer(champ: HTMLElement) {
      const depart = performance.now();
      const images: Image[] = [];
      const evenements: Evenement[] = [];
      const repere = leRepere();
      let boucle = 0;

      const instant = () => Math.round((performance.now() - depart) * 10) / 10;

      const noter = (nom: string, detail = "") =>
        evenements.push({ t: instant(), nom, detail });

      noter("pointerdown", `cible=#${champ.id || "(sans id)"}`);

      const surEvenement = (e: Event) => {
        const c = e.target;
        const nomCible =
          c instanceof Element ? `#${c.id || c.tagName.toLowerCase()}` : "?";
        const actif = document.activeElement;
        const nomActif =
          actif instanceof Element
            ? `#${actif.id || actif.tagName.toLowerCase()}`
            : "?";
        noter(e.type, `cible=${nomCible} actif=${nomActif}`);
      };
      const surVue = (e: Event) => {
        const v = window.visualViewport;
        noter(
          `viewport.${e.type}`,
          v
            ? `height=${Math.round(v.height)} offsetTop=${Math.round(
                v.offsetTop
              )} pageTop=${Math.round(v.pageTop)}`
            : ""
        );
      };

      const options = { capture: true, passive: true } as const;
      for (const nom of [
        "pointerup",
        "pointercancel",
        "touchstart",
        "touchend",
        "focus",
        "focusin",
        "blur",
        "keydown",
      ]) {
        document.addEventListener(nom, surEvenement, options);
      }
      vue?.addEventListener("resize", surVue);
      vue?.addEventListener("scroll", surVue);
      window.addEventListener("scroll", surVue, options);

      /** UNE IMAGE — rien que des LECTURES, jamais une écriture. */
      const mesurer = (): Image => {
        const v = window.visualViewport;
        const panneau = lePanneau();
        const leChamp = document.getElementById(champ.id) as HTMLElement | null;
        return {
          t: instant(),
          innerH: window.innerHeight,
          vvH: v ? Math.round(v.height) : null,
          vvTop: v ? Math.round(v.offsetTop) : null,
          vvPageTop: v ? Math.round(v.pageTop) : null,
          vvPageLeft: v ? Math.round(v.pageLeft) : null,
          scrollY: Math.round(window.scrollY),
          docTop: Math.round(document.documentElement.scrollTop),
          bodyTop: document.body.style.top || "(vide)",
          bodyPos: document.body.style.position || "(vide)",
          fond: haut(repere),
          panHaut: haut(panneau),
          panBas: bas(panneau),
          panHauteur: panneau ? Math.round(panneau.offsetHeight) : null,
          maxH: panneau ? getComputedStyle(panneau).maxHeight : "—",
          cible: panneau ? panneau.style.transform || "(aucune)" : "—",
          vu: translationVue(panneau),
          recollage: (() => {
            const c = leConteneur();
            return c ? c.style.transform || "(aucun)" : "—";
          })(),
          champHaut: haut(leChamp ?? champ),
          champBas: bas(leChamp ?? champ),
          corpsHaut: Math.round(document.body.getBoundingClientRect().top),
          bande: Math.max(
            0,
            Math.round(document.body.getBoundingClientRect().top)
          ),
          barreHaut: haut(document.querySelector("header")),
          logoHaut: haut(document.querySelector("header img")),
          sommet: (() => {
            const n = document.elementFromPoint(
              Math.round(window.innerWidth / 2),
              2
            );
            if (!n) return "(rien)";
            const classe = n.className;
            return typeof classe === "string" && classe
              ? `${n.tagName}.${classe.split(/\s+/).slice(0, 2).join(".")}`
              : n.tagName;
          })(),
          fondCanevas: getComputedStyle(document.documentElement)
            .backgroundColor,
        };
      };

      const relever = () => {
        images.push(mesurer());
        if (performance.now() - depart < DUREE_MS) {
          boucle = requestAnimationFrame(relever);
        } else {
          terminer();
        }
      };

      function terminer() {
        if (!arret) return;
        arret();
        arret = null;
        setEnCours(false);
        setRapport(redigerRapport(champ, images, evenements));
      }

      arret = () => {
        cancelAnimationFrame(boucle);
        for (const nom of [
          "pointerup",
          "pointercancel",
          "touchstart",
          "touchend",
          "focus",
          "focusin",
          "blur",
          "keydown",
        ]) {
          document.removeEventListener(nom, surEvenement, options);
        }
        vue?.removeEventListener("resize", surVue);
        vue?.removeEventListener("scroll", surVue);
        window.removeEventListener("scroll", surVue, options);
      };

      // L'IMAGE ZÉRO, prise TOUT DE SUITE, dans l'appui lui-même :
      // c'est l'état AVANT que quoi que ce soit n'ait réagi. La
      // première image du `requestAnimationFrame` arrive une douzaine
      // de millisecondes plus tard — assez pour que tout ait déjà
      // bougé, et on ne saurait plus d'où l'on est parti.
      images.push(mesurer());
      setEnCours(true);
      boucle = requestAnimationFrame(relever);
    }

    /* LE DÉCLENCHEUR : le tout premier `pointerdown` sur le champ.
       En CAPTURE, pour partir avant que quiconque n'ait agi ; en
       PASSIF, pour qu'il soit impossible d'annuler le geste. */
    const surAppui = (e: Event) => {
      const champ = estLeChamp(e.target);
      if (!champ || arret) return;
      demarrer(champ);
    };
    document.addEventListener("pointerdown", surAppui, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("pointerdown", surAppui, { capture: true });
      if (arret) arret();
      arret = null;
    };
  }, [armee, rapport]);

  /* 3. LE PRESSE-PAPIERS. Deux chemins, parce qu'iOS refuse le premier
        hors HTTPS : l'API moderne, puis la sélection du texte. */


  if (!armee) return null;

  return (
    <>
      {/* LE TÉMOIN — minuscule, en bas à gauche, HORS DU TOUCHER. Il
          dit seulement si la sonde est prête ou en train d'écrire. */}
      {!rapport && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 6,
            bottom: 6,
            zIndex: 2147483000,
            pointerEvents: "none",
            font: "600 11px/1.2 system-ui, sans-serif",
            color: enCours ? "#fff" : "#EE3D6F",
            background: enCours ? "#EE3D6F" : "rgba(0,0,0,.55)",
            border: "1px solid #EE3D6F",
            borderRadius: 999,
            padding: "3px 8px",
          }}
        >
          {enCours ? "sonde : enregistrement…" : "sonde prête"}
        </div>
      )}

      {/*  REPLIÉE : une pastille, et rien d'autre à l'écran. */}
      {rapport && repliee && (
        <PastilleSonde lettre="C" titre="Sonde clavier" surToucher={basculer} bas={112} />
      )}

      {/* LE RAPPORT — il n'existe qu'une fois les 2 secondes passées. */}
      {rapport && !repliee && (
        <div
          role="dialog"
          aria-label="Rapport de la sonde"
          style={{
            position: "fixed",
            //  ⚠️ LA MOITIÉ BASSE, jamais tout l'écran (nº 183-§1).
            inset: "auto 0 0 0",
            maxHeight: "50vh",
            zIndex: 2147483000,
            background: "#111",
            color: "#eee",
            display: "flex",
            flexDirection: "column",
            font: "13px/1.45 system-ui, sans-serif",
            padding: "max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom))",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, flex: 1 }}>
              Mesure terminée
            </p>
            <BoutonReplier surToucher={basculer} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <BoutonCopierJournal texte={() => rapport ?? ""} pleineLargeur />
            {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A) : sur
                 iPhone, « Copier » échoue — celui-ci poste le rapport au
                 serveur, qui l'écrit dans un fichier. */}
            <BoutonEnvoyerJournal
              sonde="clavier"
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
              Nouvelle mesure
            </button>
          </div>
          {copie && (
            <p style={{ margin: "0 0 8px", color: "#8ee08e" }}>{copie}</p>
          )}
          {/* Le texte EST la zone de saisie : c'est ce qui permet la
              copie de secours quand l'API du presse-papiers est
              refusée (iOS hors HTTPS). */}
          <textarea
            ref={zoneTexte}
            readOnly
            value={rapport}
            style={{
              flex: 1,
              width: "100%",
              minHeight: 0,
              resize: "none",
              background: "#000",
              color: "#ddd",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 8,
              font: "11px/1.35 ui-monospace, Menlo, monospace",
              WebkitTextSizeAdjust: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </>
  );
}

/* =====================================================================
 * LA MISE EN FORME DU RAPPORT
 * ---------------------------------------------------------------------
 * Du texte nu, lisible tel quel dans une conversation. Une grandeur par
 * `clé=valeur` : la ligne peut se replier sur un écran étroit sans que
 * rien ne devienne illisible.
 * Les images IDENTIQUES qui se suivent sont regroupées (`×N`) — aucune
 * valeur n'est perdue, et le texte reste collable depuis un téléphone.
 * ===================================================================== */
function redigerRapport(
  champ: HTMLElement,
  images: Image[],
  evenements: Evenement[]
): string {
  const l: string[] = [];
  const v = window.visualViewport;

  l.push("=== SONDE YOKOFOLIO — champ de localité ===");
  l.push(`date        : ${new Date().toISOString()}`);
  l.push(`navigateur  : ${navigator.userAgent}`);
  l.push(
    `écran       : ${window.innerWidth}x${window.innerHeight} · densité ${window.devicePixelRatio}`
  );
  l.push(
    `viewport    : ${
      v ? `${Math.round(v.width)}x${Math.round(v.height)}` : "absent"
    } · échelle ${v ? v.scale : "—"}`
  );
  l.push(`champ visé  : #${champ.id || "(sans id)"}`);
  l.push(`adresse     : ${location.pathname}${location.search}`);
  l.push(`images      : ${images.length} sur ${DUREE_MS} ms`);
  l.push("");

  l.push("--- ÉVÉNEMENTS (ms depuis le toucher) ---");
  if (!evenements.length) l.push("  (aucun)");
  for (const e of evenements) {
    l.push(`  ${String(e.t).padStart(7)}  ${e.nom.padEnd(18)} ${e.detail}`);
  }
  l.push("");

  l.push(`--- SYNTHÈSE : valeurs distinctes sur ${images.length} images ---`);
  const colonnes: [string, (i: Image) => string | number | null][] = [
    ["window.innerHeight", (i) => i.innerH],
    ["visualViewport.height", (i) => i.vvH],
    ["visualViewport.offsetTop", (i) => i.vvTop],
    ["visualViewport.pageTop", (i) => i.vvPageTop],
    ["visualViewport.pageLeft", (i) => i.vvPageLeft],
    ["window.scrollY", (i) => i.scrollY],
    ["documentElement.scrollTop", (i) => i.docTop],
    ["body.style.top", (i) => i.bodyTop],
    ["body.style.position", (i) => i.bodyPos],
    // ⚠️ CE REPÈRE-LÀ EST RELATIF, ET IL A MENTI PENDANT DIX PASSES :
    // la carte vit DANS le corps, elle descend avec lui, la distance
    // ne change pas. Les quatre suivants sont ancrés à l'ÉCRAN.
    ["arrière-plan (relatif)", (i) => i.fond],
    ["◆ BANDE DÉCOUVERTE", (i) => i.bande],
    ["◆ haut du corps", (i) => i.corpsHaut],
    ["◆ barre du site", (i) => i.barreHaut],
    ["◆ logo", (i) => i.logoHaut],
    ["◆ ce qui peint en haut", (i) => i.sommet],
    ["◆ fond du canevas", (i) => i.fondCanevas],
    ["panneau : haut", (i) => i.panHaut],
    ["panneau : bas", (i) => i.panBas],
    ["panneau : hauteur", (i) => i.panHauteur],
    ["panneau : max-height", (i) => i.maxH],
    ["panneau : transform CIBLE", (i) => i.cible],
    ["panneau : transform VU", (i) => i.vu],
    ["conteneur : RECOLLAGE", (i) => i.recollage],
    ["champ : haut", (i) => i.champHaut],
    ["champ : bas", (i) => i.champBas],
  ];
  for (const [nom, lire] of colonnes) {
    const vus: string[] = [];
    for (const i of images) {
      // `null` = l'élément n'a AUCUNE boîte (masqué, ou absent de
      // cette page). On l'écrit en toutes lettres : lu « 0 », il se
      // confondrait avec « collé en haut de l'écran ».
      const brut = lire(i);
      const val = brut === null ? "(absent)" : String(brut);
      if (vus[vus.length - 1] !== val) vus.push(val);
    }
    const distinctes = new Set(vus).size;
    const apercu = vus.length > 12 ? vus.slice(0, 12).concat("…") : vus;
    l.push(
      `  ${nom.padEnd(26)} ${String(distinctes).padStart(3)}  ${apercu.join(
        " → "
      )}`
    );
  }
  l.push("");

  l.push("--- IMAGES (les identiques qui se suivent sont regroupées) ---");
  let debut = 0;
  const signature = (i: Image) =>
    [
      i.innerH,
      i.vvH,
      i.vvTop,
      i.vvPageTop,
      i.vvPageLeft,
      i.scrollY,
      i.docTop,
      i.bodyTop,
      i.bodyPos,
      i.fond,
      i.corpsHaut,
      i.bande,
      i.barreHaut,
      i.logoHaut,
      i.sommet,
      i.fondCanevas,
      i.panHaut,
      i.panBas,
      i.panHauteur,
      i.maxH,
      i.cible,
      i.vu,
      i.recollage,
      i.champHaut,
      i.champBas,
    ].join("|");
  for (let k = 0; k <= images.length; k += 1) {
    const finDeGroupe =
      k === images.length || signature(images[k]) !== signature(images[debut]);
    if (!finDeGroupe) continue;
    const i = images[debut];
    const nb = k - debut;
    const quand =
      nb > 1 ? `t=${i.t}→${images[k - 1].t} ×${nb}` : `t=${i.t}`;
    l.push(
      `[${quand}] innerH=${i.innerH} vvH=${i.vvH} vvTop=${i.vvTop} vvPageTop=${i.vvPageTop} ` +
        `vvPageLeft=${i.vvPageLeft} scrollY=${i.scrollY} docTop=${i.docTop} ` +
        `bodyTop=${i.bodyTop} bodyPos=${i.bodyPos} FOND=${i.fond} ` +
        `BANDE=${i.bande} CORPS=${i.corpsHaut} BARRE=${i.barreHaut} ` +
        `LOGO=${i.logoHaut} ` +
        `SOMMET=${i.sommet} CANEVAS=${i.fondCanevas} ` +
        `panneau=${i.panHaut}..${i.panBas} hauteur=${i.panHauteur} ` +
        `maxH=${i.maxH} cible=${i.cible} vu=${i.vu} recollage=${i.recollage} ` +
        `champ=${i.champHaut}..${i.champBas}`
    );
    debut = k;
  }
  l.push("");
  l.push("=== FIN ===");
  return l.join("\n");
}
