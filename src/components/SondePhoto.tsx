"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ██ SONDE DE LA PHOTO — `?sonde-photo=1` (nº 291-§2) ██
 * ==================================================================
 * POURQUOI ELLE EXISTE. Le propriétaire voit, sur SON MacBook Pro et
 * DANS SAFARI, une fiche pleine page dont la photo est trop large et
 * descend sous l'écran. Deux passes ont visé ce défaut : la nº 290 a
 * remplacé la constante `100vh − 119px` par une MESURE, elle est
 * verte sur mon banc Chromium, et elle n'a rien changé chez lui.
 * Je ne peux ouvrir ni Safari, ni « Mon portfolio » (il faut une
 * session). Une troisième correction à l'aveugle serait un troisième
 * coup de dé : il faut des NOMBRES pris sur SON écran.
 *
 * ⚠️ LA LIGNE QUI DÉCIDE, et c'est pour elle que la sonde existe :
 * « MESURE APPLIQUÉE » ou « REPLI 119 px ENCORE EN VIGUEUR ». Elle
 * répond à la seule question qui compte aujourd'hui — le mécanisme de
 * la nº 290 s'est-il exécuté DU TOUT dans Safari, ou la page tient-elle
 * encore sur l'ancien calcul ? Les deux réponses mènent à des
 * corrections opposées ; deviner laquelle coûterait une passe de plus.
 *
 * ⚠️ ELLE NE CORRIGE RIEN, ET NE MODIFIE RIEN. Elle lit, elle affiche.
 * Son bandeau est rendu dans un PORTAIL vers `document.body`, en
 * `position: fixed` : il est hors du flux, il ne peut donc pas
 * déplacer d'un pixel la mise en page qu'il mesure. Sans
 * `?sonde-photo=1` dans l'adresse, le composant ne rend RIEN et sa
 * boucle de mesure n'existe pas.
 *
 * ⚠️ AUCUNE API QUE SAFARI POURRAIT NE PAS SERVIR. Pas de
 * `ResizeObserver`, pas de `navigator.clipboard` obligatoire, pas de
 * `structuredClone` : une boucle `requestAnimationFrame`,
 * `getBoundingClientRect`, `getComputedStyle`, `matchMedia`. Et le
 * relevé reste du TEXTE SIMPLE, sélectionnable à la main : si la copie
 * échoue — c'est fréquent dans Safari hors d'un geste direct —, il
 * suffit de le sélectionner et de le copier soi-même.
 */

/** Trois décimales, virgule française — la précision demandée. */
const trois = (valeur: number) => valeur.toFixed(3).replace(".", ",");

/** Une ligne du relevé : un intitulé, une valeur, et de quoi la
    colorer quand elle porte un verdict. */
type Ligne = { cle: string; valeur: string; ton?: "bon" | "mauvais" };

/**
 * §1 (nº 294) — UNE SEULE SONDE À L'ÉCRAN, LA PLUS RÉCENTE.
 * Elle est montée par la PAGE et par la FENÊTRE superposée : quand la
 * seconde s'ouvre par-dessus la première, c'est ELLE qui relève, et le
 * bandeau ne se dédouble jamais. Le dernier arrivé gagne, et rend la
 * main en partant.
 */
const sondesMontees: object[] = [];

export function SondePhoto() {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [aLaMain, setALaMain] = useState(true);
  const [copie, setCopie] = useState<null | "faite" | "ratee">(null);
  //  La dernière empreinte affichée : on ne repose un état que si un
  //  nombre a VRAIMENT changé — sinon la sonde rendrait soixante fois
  //  par seconde pour rien, et fausserait ce qu'elle mesure.
  const empreinte = useRef("");

  /**
   * LA MESURE EN CONTINU — une image après l'autre, tant que la sonde
   * est demandée : ce qui s'affiche est toujours l'état de l'instant,
   * jamais celui du chargement.
   * ⚠️ L'ADRESSE DÉCIDE, ET ELLE SEULE. Lue au montage, côté
   * navigateur : aucun rendu du serveur n'en dépend, donc aucun écart
   * d'hydratation. Sans `?sonde-photo=1`, aucune boucle n'est même
   * lancée.
   */
  useEffect(() => {
    const jeton = {};
    sondesMontees.push(jeton);
    const revoir = () =>
      setALaMain(sondesMontees[sondesMontees.length - 1] === jeton);
    revoir();
    const battement = setInterval(revoir, 300);
    return () => {
      clearInterval(battement);
      const rang = sondesMontees.indexOf(jeton);
      if (rang >= 0) sondesMontees.splice(rang, 1);
    };
  }, []);

  useEffect(() => {
    const demandee =
      new URLSearchParams(window.location.search).get("sonde-photo") === "1";
    if (!demandee) return;
    let vivante = true;
    let trame = 0;

    /** Pose le relevé — et seulement s'il a changé. */
    const poser = (fraiches: Ligne[]) => {
      const signature = JSON.stringify(fraiches);
      if (signature === empreinte.current) return;
      empreinte.current = signature;
      setLignes(fraiches);
    };

    const mesurer = () => {
      if (!vivante) return;
      trame = requestAnimationFrame(mesurer);

      /**
       * §1 (nº 294) — LA SONDE VOIT AUSSI LA FENÊTRE SUPERPOSÉE.
       * ----------------------------------------------------------------
       * Elle ne cherchait que `[data-photo-fiche]`, qui n'existe QUE sur
       * la page. Le propriétaire voit pourtant le même liseré dans la
       * fenêtre centrée : elle doit donc pouvoir y relever. À défaut de
       * l'enveloppe de la page, on prend LA BOÎTE QUI PORTE LE
       * CARROUSEL — celle de la fenêtre —, et le relevé dit laquelle.
       */
      const zone =
        document.querySelector<HTMLElement>("[data-photo-fiche]") ??
        (document
          .querySelector<HTMLElement>('[data-carrousel="fiche"]')
          ?.parentElement ?? null);
      if (!zone) {
        poser([
          {
            cle: "cadre de la photo",
            valeur: "INTROUVABLE sur cette page",
            ton: "mauvais",
          },
        ]);
        return;
      }
      const racine = document.querySelector<HTMLElement>("[data-racine-fiche]");
      const boite = zone.getBoundingClientRect();
      const calcule = getComputedStyle(zone);

      /*  LES DEUX NOMBRES QUE LIT LE MÉCANISME DE LA Nº 290 — relus
          ici EXACTEMENT comme lui : la position du haut de la photo
          dans le document, et la marge du bas écrite sur la racine. */
      const hautDansLeDocument =
        boite.top + (document.scrollingElement?.scrollTop ?? 0);
      const margeDuBas = racine
        ? parseFloat(getComputedStyle(racine).paddingBottom) || 0
        : 0;
      const libreCalcule = window.innerHeight - hautDansLeDocument - margeDuBas;

      /*  CE QUE LE MÉCANISME A RÉELLEMENT POSÉ sur l'élément. Vide =
          l'effet n'a jamais tourné (ou n'a pas abouti). */
      const posee = zone.style.getPropertyValue("--photo-hauteur-libre").trim();
      const largeurReelle = parseFloat(calcule.width) || 0;

      /*  LES DEUX LARGEURS POSSIBLES, calculées ici pour être
          COMPARÉES à celle qui s'applique — on ne déduit pas la
          source, on la reconnaît au nombre. */
      //  §1 (nº 293) — la mesure passe par un multiple de 4 : c'est ce
      //  nombre-là qu'il faut comparer, pas `libre × 0,8` brut.
      const siMesure = Math.floor((libreCalcule * 0.8) / 4) * 4;
      const siRepli = (window.innerHeight - 119) * 0.8;
      const colleAlaMesure = Math.abs(largeurReelle - siMesure) < 2;
      const colleAuRepli = Math.abs(largeurReelle - siRepli) < 2;

      /*  LA RÈGLE DE LARGEUR EST-ELLE SEULEMENT ACTIVE ? Elle vit sous
          le palier `lg` (64 rem). Si la requête ne répond pas, aucune
          des deux formules ne s'applique — et ce serait, à soi seul,
          la réponse. */
      const paliers = window.matchMedia("(min-width: 64rem)").matches;

      /*  ⚠️ ET SI LES DEUX NOMBRES SE RESSEMBLENT ? Sur la page
          publique, la barre mesure trois pixels de moins que les 79
          supposés : les deux formules tombent alors presque au même
          endroit, et un verdict tranché serait une affirmation en
          l'air. On le DIT — la ligne « --photo-hauteur-libre posée »
          répond alors seule, et sans ambiguïté. */
      const verdict: Ligne = colleAlaMesure && colleAuRepli
        ? {
            cle: "▶ CE QUI TIENT LA PAGE",
            valeur:
              "INDÉCIDABLE ICI — les deux formules donnent le même nombre ; " +
              "lis la ligne « --photo-hauteur-libre posée »",
          }
        : colleAlaMesure
        ? {
            cle: "▶ CE QUI TIENT LA PAGE",
            valeur: "MESURE APPLIQUÉE (le mécanisme de la nº 290 tourne)",
            ton: "bon",
          }
        : colleAuRepli
          ? {
              cle: "▶ CE QUI TIENT LA PAGE",
              valeur: "REPLI 119 px ENCORE EN VIGUEUR (la mesure n'a pas pris)",
              ton: "mauvais",
            }
          : {
              cle: "▶ CE QUI TIENT LA PAGE",
              valeur: "NI L'UNE NI L'AUTRE — une troisième règle décide",
              ton: "mauvais",
            };

      const debordeSousLEcran = boite.bottom - window.innerHeight;

      /**
       * §1-e (nº 293) — LES FRACTIONS DE PIXEL, ET LES QUATRE ÉCARTS.
       * ----------------------------------------------------------------
       * C'est ce relevé-ci qui prononce le verdict du §1 : un bord posé
       * entre deux pixels laisse passer la photo voisine (nº 282), et à
       * densité 2 un quart de pixel CSS est un demi-pixel d'écran. Tout
       * doit valoir zéro — le cadre, ses colonnes, et les quatre côtés
       * de la photo dans sa colonne.
       * ⚠️ TROIS ÉLÉMENTS DIFFÉRENTS, ET ON LES NOMME : l'ENVELOPPE
       * (`data-photo-fiche`, celle qui porte la largeur calculée), le
       * CADRE (`data-role="cadre"`, celui qui rogne et défile), la
       * COLONNE (une photo). La nº 292 les confondait sous le mot
       * « cadre » — d'où une conclusion fausse sur 0,594 px d'écart qui
       * n'étaient qu'une bande d'enveloppe à droite du cadre.
       */
      const fraction = (valeur: number) => valeur - Math.round(valeur);
      const cadre = zone.querySelector<HTMLElement>('[data-role="cadre"]');
      const colonne = zone.querySelector<HTMLElement>('[data-role="colonne 0"]');
      const photo = colonne?.querySelector("img");
      const bc = cadre?.getBoundingClientRect();
      const bk = colonne?.getBoundingClientRect();
      const bp = photo?.getBoundingClientRect();
      /** Une ligne « doit valoir zéro » : verte à zéro, rouge sinon. */
      const aZero = (cle: string, valeur: number | null): Ligne =>
        valeur === null
          ? { cle, valeur: "INTROUVABLE", ton: "mauvais" }
          : {
              cle,
              valeur: trois(valeur),
              ton: Math.abs(valeur) < 0.001 ? "bon" : "mauvais",
            };

      poser([
        {
          cle: "la page",
          valeur: !zone.hasAttribute("data-photo-fiche")
            ? "FENÊTRE CENTRÉE SUPERPOSÉE"
            : racine?.dataset.ficheVue === "apercu"
              ? "« Mon portfolio » (aperçu de l'espace)"
              : racine
                ? "fiche publique (pleine page)"
                : "racine INTROUVABLE",
        },
        verdict,
        {
          cle: "--photo-hauteur-libre posée",
          valeur: posee || "AUCUNE — l'effet n'a rien écrit",
          ton: posee ? "bon" : "mauvais",
        },
        {
          cle: "déborde sous l'écran",
          valeur: `${trois(debordeSousLEcran)} px`,
          ton: debordeSousLEcran > 0.5 ? "mauvais" : "bon",
        },
        { cle: "fenêtre (innerHeight × innerWidth)", valeur: `${trois(window.innerHeight)} × ${trois(window.innerWidth)}` },
        { cle: "devicePixelRatio", valeur: trois(window.devicePixelRatio) },
        { cle: "palier lg (min-width:64rem)", valeur: paliers ? "ACTIF" : "INACTIF", ton: paliers ? "bon" : "mauvais" },
        //  ⚠️ « ENVELOPPE », PAS « CADRE » : ces quatre lignes disaient
        //  « cadre » jusqu'à la nº 292 et mesuraient l'enveloppe — deux
        //  boîtes différentes, et un relevé qui mélangeait les deux.
        { cle: "enveloppe · haut", valeur: `${trois(boite.top)} px` },
        { cle: "enveloppe · bas", valeur: `${trois(boite.bottom)} px` },
        { cle: "enveloppe · hauteur", valeur: `${trois(boite.height)} px` },
        { cle: "enveloppe · largeur", valeur: `${trois(boite.width)} px` },
        { cle: "enveloppe calculée · height", valeur: calcule.height },
        { cle: "enveloppe calculée · width", valeur: calcule.width },
        { cle: "enveloppe calculée · max-width", valeur: calcule.maxWidth },

        /* ---- §1 (nº 293) — TOUT CE QUI SUIT DOIT VALOIR ZÉRO ---- */
        { cle: "cadre · largeur", valeur: bc ? `${trois(bc.width)} px` : "INTROUVABLE" },
        { cle: "cadre · hauteur", valeur: bc ? `${trois(bc.height)} px` : "INTROUVABLE" },
        aZero("▸ cadre · fraction du bord GAUCHE", bc ? fraction(bc.left) : null),
        aZero("▸ cadre · fraction du bord HAUT", bc ? fraction(bc.top) : null),
        aZero("▸ cadre · fraction de la LARGEUR", bc ? fraction(bc.width) : null),
        aZero("▸ cadre · fraction de la HAUTEUR", bc ? fraction(bc.height) : null),
        { cle: "colonne · largeur", valeur: bk ? `${trois(bk.width)} px` : "INTROUVABLE" },
        aZero("▸ colonne · fraction de la LARGEUR", bk ? fraction(bk.width) : null),
        aZero("▸ photo/colonne · écart HAUT", bp && bk ? bp.top - bk.top : null),
        aZero("▸ photo/colonne · écart BAS", bp && bk ? bk.bottom - bp.bottom : null),
        aZero("▸ photo/colonne · écart GAUCHE", bp && bk ? bp.left - bk.left : null),
        aZero("▸ photo/colonne · écart DROITE", bp && bk ? bk.right - bp.right : null),
        /**
         * §2 (nº 296) — LA POSITION DU DÉFILEMENT, ET SON RESTE.
         * ----------------------------------------------------------------
         * C'est la dernière cause possible du trait au bord gauche : une
         * position arrêtée sur une FRACTION de la largeur d'une colonne
         * laisse voir la dernière colonne de pixels de la photo
         * précédente. Le reste doit valoir zéro à chaque arrêt.
         */
        {
          cle: "position du défilement",
          valeur: cadre ? `${trois(cadre.scrollLeft)} px` : "INTROUVABLE",
        },
        aZero(
          "▸ reste modulo la largeur d'une colonne",
          cadre && bk && bk.width > 1 ? cadre.scrollLeft % bk.width : null
        ),
        aZero(
          "▸ bande d'enveloppe À DROITE du cadre",
          bc ? boite.right - bc.right : null
        ),
        /**
         * §1 (nº 294) — CE QUI EST PEINT DERRIÈRE LA PHOTO.
         * ----------------------------------------------------------------
         * La voie du pixel entier était épuisée : les fractions valaient
         * zéro et le liseré restait. C'est qu'il ne fallait pas chercher
         * un pixel de plus, mais regarder ce qu'il y avait DESSOUS — un
         * fond plus clair que la page, qui s'affichait au moindre cheveu
         * découvert. Cette ligne le dit, boîte par boîte.
         * ⚠️ SEULE LA COLONNE A LE DROIT D'ÊTRE PEINTE : c'est la
         * réservation sombre de la nº 280, et la photo la recouvre avec
         * un pixel de marge. Tout le reste doit être transparent.
         */
        /**
         * §1-§2 (nº 295) — LES DEUX LIGNES QUI TRANCHENT.
         * ----------------------------------------------------------------
         * · CHAQUE COLONNE ROGNE : on ne le suppose plus (la nº 294 le
         *   supposait, et c'est ce qui a laissé passer la dernière
         *   colonne de pixels de la photo précédente). On LIT
         *   `overflow` sur chaque colonne : il doit être coupant.
         * · PEINT DANS LA CHAÎNE : la liste des boîtes qui peignent
         *   encore quelque chose — fond, bordure, contour, ombre,
         *   arrondi. La réponse attendue est « rien » : alors un
         *   demi-pixel manquant ne montre que la page, la même couleur
         *   que tout autour, et il devient invisible quel que soit le
         *   moteur de rendu.
         */
        (() => {
          const colonnes = [
            ...zone.querySelectorAll<HTMLElement>('[data-role^="colonne"]'),
          ];
          const coupantes = colonnes.filter((colonne) => {
            const debord = getComputedStyle(colonne).overflow;
            return debord === "hidden" || debord === "clip" || debord === "auto";
          });
          const toutes = colonnes.length > 0 && coupantes.length === colonnes.length;
          return {
            cle: "▸ CHAQUE COLONNE ROGNE",
            valeur: colonnes.length === 0
              ? "aucune colonne"
              : toutes
                ? `oui (${colonnes.length}/${colonnes.length})`
                : `NON — ${coupantes.length}/${colonnes.length} seulement`,
            ton: toutes ? "bon" : "mauvais",
          } as Ligne;
        })(),
        (() => {
          const peint = (nom: string, element: Element | null) => {
            if (!element) return `${nom} INTROUVABLE`;
            const style = getComputedStyle(element);
            const morceaux: string[] = [];
            if (!/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor))
              morceaux.push(`fond ${style.backgroundColor}`);
            if (parseFloat(style.borderTopWidth) > 0)
              morceaux.push(`bordure ${style.borderTopWidth}`);
            if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0)
              morceaux.push(`contour ${style.outlineWidth}`);
            if (style.boxShadow !== "none") morceaux.push("ombre");
            if (parseFloat(style.borderTopLeftRadius) > 0)
              morceaux.push(`arrondi ${style.borderTopLeftRadius}`);
            return morceaux.length ? `${nom} → ${morceaux.join(", ")}` : "";
          };
          const dits = [
            peint("enveloppe", zone),
            peint("racine", zone.querySelector("[data-carrousel]")),
            peint("cadre", cadre),
            peint("colonne", colonne),
            peint("photo", photo ?? null),
          ].filter(Boolean);
          return {
            cle: "▸ PEINT DANS LA CHAÎNE",
            valeur: dits.length ? dits.join(" · ") : "rien",
            ton: dits.length ? "mauvais" : "bon",
          } as Ligne;
        })(),
        { cle: "nº 290 · haut de la photo (document)", valeur: `${trois(hautDansLeDocument)} px` },
        { cle: "nº 290 · marge du bas (racine)", valeur: `${trois(margeDuBas)} px` },
        { cle: "nº 290 · hauteur libre calculée", valeur: `${trois(libreCalcule)} px` },
        { cle: "largeur si MESURE (multiple de 4 ≤ libre × 0,8)", valeur: `${trois(siMesure)} px` },
        { cle: "largeur si REPLI ((100vh−119) × 0,8)", valeur: `${trois(siRepli)} px` },
        { cle: "largeur RÉELLEMENT appliquée", valeur: `${trois(largeurReelle)} px` },
        { cle: "document.scrollHeight", valeur: trois(document.documentElement.scrollHeight) },
        { cle: "scrollHeight − innerHeight", valeur: trois(document.documentElement.scrollHeight - window.innerHeight) },
        { cle: "adresse", valeur: window.location.pathname + window.location.search },
      ]);
    };

    trame = requestAnimationFrame(mesurer);
    return () => {
      vivante = false;
      cancelAnimationFrame(trame);
    };
  }, []);

  if (!aLaMain || lignes.length === 0) return null;

  /** LE RELEVÉ EN TEXTE SIMPLE — ce que le bouton copie, et ce qui
      reste sélectionnable à la main quand la copie échoue. */
  const texte = lignes
    .map((ligne) => `${ligne.cle} : ${ligne.valeur}`)
    .join("\n");

  /**  LA COPIE, EN DEUX TENTATIVES ET SANS PROMESSE. Safari refuse
       souvent le presse-papier hors d'un geste direct — et même dans
       un geste, il peut le refuser. On essaie, on DIT ce qui s'est
       passé, et le texte reste là de toute façon. */
  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie("faite");
      return;
    } catch {
      //  La méthode ancienne, celle qui marche encore quand l'autre
      //  est refusée.
    }
    try {
      const zone = document.createElement("textarea");
      zone.value = texte;
      zone.setAttribute("readonly", "");
      zone.style.cssText =
        "position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(zone);
      zone.focus();
      zone.setSelectionRange(0, texte.length);
      const fait = document.execCommand("copy");
      zone.remove();
      setCopie(fait ? "faite" : "ratee");
    } catch {
      setCopie("ratee");
    }
  }

  /** TOUT SÉLECTIONNER — le secours du secours : un clic, et le
      relevé est surligné, prêt pour un ⌘C à la main. */
  function toutSelectionner() {
    const bloc = document.getElementById("sonde-photo-texte");
    if (!bloc) return;
    const selection = window.getSelection();
    if (!selection) return;
    const plage = document.createRange();
    plage.selectNodeContents(bloc);
    selection.removeAllRanges();
    selection.addRange(plage);
  }

  return createPortal(
    /*  BANDEAU NOIR OPAQUE, EN HAUT, AU-DESSUS DE TOUT — `fixed`,
        donc hors du flux : il recouvre, il ne pousse rien. */
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        background: "#000",
        color: "#fff",
        font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "8px 10px",
        maxHeight: "70vh",
        overflowY: "auto",
        WebkitUserSelect: "text",
        userSelect: "text",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <strong style={{ fontSize: 12 }}>SONDE PHOTO — nº 291</strong>
        <button
          type="button"
          onClick={() => void copier()}
          style={{
            background: "#fff",
            color: "#000",
            border: 0,
            borderRadius: 4,
            padding: "3px 10px",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Copier
        </button>
        <button
          type="button"
          onClick={toutSelectionner}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: 4,
            padding: "3px 10px",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Tout sélectionner
        </button>
        {copie === "faite" && <span style={{ color: "#7BE38B" }}>copié</span>}
        {copie === "ratee" && (
          <span style={{ color: "#FF8080" }}>
            copie refusée — sélectionne le texte ci-dessous
          </span>
        )}
      </div>

      {/*  LE RELEVÉ LISIBLE — chaque ligne colorée quand elle porte un
           verdict. C'est CE bloc que « Tout sélectionner » surligne, et
           c'est du texte simple : rien à installer, rien à autoriser. */}
      <pre
        id="sonde-photo-texte"
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          WebkitUserSelect: "text",
          userSelect: "text",
        }}
      >
        {lignes.map((ligne) => (
          <div
            key={ligne.cle}
            style={{
              color:
                ligne.ton === "bon"
                  ? "#7BE38B"
                  : ligne.ton === "mauvais"
                    ? "#FF8080"
                    : "#fff",
            }}
          >
            {ligne.cle} : {ligne.valeur}
          </div>
        ))}
      </pre>
    </div>,
    document.body
  );
}
