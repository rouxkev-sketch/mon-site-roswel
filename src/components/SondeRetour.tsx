"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { BoutonEnvoyerJournal } from "@/components/BoutonEnvoyerJournal";
import { BoutonCopierJournal, BoutonReplier } from "@/components/OutilsSonde";
import { usePathname } from "next/navigation";
//  §1 (nº 339) — la clé canonique d'une position : voir plus bas.
import { adresseDeRecherche } from "@/lib/adresse-recherche";
import { desarmerLesSondes, sondeArmee } from "@/lib/sondes-armees";
//  §1 (nº 362) — l'instant où l'entrée d'historique change, donné par
//  l'écriture commune des changements d'adresse : la sonde n'enveloppe
//  rien elle-même, elle écoute ce qui existe déjà.
import { souscrireAdresse } from "@/lib/adresse-courante";
//  §1 (nº 362) — la marque du masque, lue là où elle est définie.
import { MARQUE_ATTENTE } from "@/lib/pose-sur-contenu";

/**
 * LA SONDE DU RETOUR — elle mesure le cache de navigation sur le vrai
 * iPhone, et elle ne corrige RIEN
 * =====================================================================
 * TROIS PASSES ont tenté de faire disparaître l'écran blanc du geste de
 * retour. Les trois mesures ont été faites ici, et les trois se sont
 * trompées de sujet :
 *  · Playwright lance Chromium avec le cache de navigation DÉSACTIVÉ
 *    (`--disable-back-forward-cache`) — toute mesure y répond « pas de
 *    cache », quoi que fasse le site ;
 *  · le serveur de développement le bloque lui aussi, avec sa liaison
 *    de rechargement à chaud ;
 *  · et WebKit n'est pas Chromium.
 *
 * Cette sonde renverse la méthode : elle enregistre, SUR L'APPAREIL DU
 * PROPRIÉTAIRE, ce que le navigateur dit vraiment. Quatre questions,
 * quatre réponses :
 *
 *  1. LE RETOUR RESTAURE-T-IL LA PAGE VIVANTE ?
 *     `pageshow` avec `event.persisted` — la seule preuve directe.
 *  2. SI NON, POURQUOI ?
 *     `PerformanceNavigationTiming.notRestoredReasons` liste les
 *     raisons exactes du refus. (Absente de Safari à ce jour : si elle
 *     manque, la sonde le dit au lieu d'inventer.)
 *  3. QUELS EN-TÊTES LE SERVEUR RENVOIE-T-IL VRAIMENT ?
 *     Relevés en production compilée, tels que le téléphone les reçoit.
 *  4. LE SERVICE WORKER INTERCEPTE-T-IL LE RETOUR ?
 *     Contrôle de la page, portée, état de la version installée.
 *  5. ⚠️ ET SURTOUT : OÙ SOMMES-NOUS ?
 *     Le premier relevé du propriétaire portait `cache-control:
 *     no-cache, must-revalidate` — c'est mot pour mot l'en-tête du
 *     SERVEUR DE DÉVELOPPEMENT ; le site compilé, lui, envoie `private,
 *     no-cache, max-age=0, must-revalidate`. Et `serviceWorker` était
 *     absent de `navigator`, ce qui n'arrive QUE hors contexte sécurisé
 *     (une adresse en http:// autre que localhost).
 *     Autrement dit : la mesure décrivait le serveur de développement
 *     ouvert en http sur le réseau local, pas le site. Or ce serveur
 *     tient une liaison de rechargement à chaud — une connexion
 *     permanente qui INTERDIT à elle seule le cache de navigation.
 *     La sonde annonce donc désormais son terrain EN PREMIÈRE LIGNE :
 *     plus jamais une passe entière bâtie sur la mesure du mauvais
 *     serveur.
 *
 * ELLE NE FAIT QUE LIRE. Aucun style, aucune classe, aucun attribut
 * posé ailleurs que sur ses propres éléments ; aucun écouteur capable
 * d'annuler un geste.
 *
 * ELLE TRAVERSE LES NAVIGATIONS, et c'est indispensable : le défaut se
 * produit ENTRE deux pages. L'armement est donc gardé dans la mémoire
 * d'onglet, et le journal s'écrit page après page — on le lit à la fin,
 * d'un seul coup.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : supprimer ce fichier, la ligne
 * `<SondeRetour … />` de src/app/(tatouage)/layout.tsx et son import.
 * Rien d'autre n'y touche.
 */

const CLE_ARMEE = "yokofolio:sonde-retour";
const CLE_JOURNAL = "yokofolio:sonde-retour:journal";
/** Au-delà, les plus anciennes lignes tombent. Large exprès : chaque
    page écrit une dizaine de lignes, et on veut pouvoir enchaîner une
    bonne quinzaine d'allers-retours sans rien perdre. */
const LIGNES_MAX = 400;

type Ligne = { t: string; texte: string };

function lireJournal(): Ligne[] {
  try {
    return JSON.parse(sessionStorage.getItem(CLE_JOURNAL) ?? "[]") as Ligne[];
  } catch {
    return [];
  }
}

function noter(texte: string) {
  try {
    const heure = new Date();
    const t = `${String(heure.getHours()).padStart(2, "0")}:${String(
      heure.getMinutes()
    ).padStart(2, "0")}:${String(heure.getSeconds()).padStart(2, "0")}`;
    const lignes = [...lireJournal(), { t, texte }].slice(-LIGNES_MAX);
    sessionStorage.setItem(CLE_JOURNAL, JSON.stringify(lignes));
  } catch {
    // stockage indisponible : la sonde se tait, le site n'en souffre pas
  }
}

/** L'armement : demandé par l'adresse, gardé pour tout l'onglet.
    Lu comme une donnée EXTÉRIEURE à React — côté serveur la réponse est
    toujours « non », de sorte que le HTML envoyé à tout le monde est
    celui d'un site sans sonde. */
const RIEN_A_ECOUTER = () => () => {};
const jamaisSurLeServeur = () => false;
function estArmee(): boolean {
  //  §1 (nº 343) — L'ARMEMENT A DÉMÉNAGÉ, et c'est le point de la
  //  passe : il vivait dans la mémoire de L'ONGLET, il vit maintenant
  //  dans la mémoire LOCALE, lue par le script d'avant peinture
  //  (lib/sondes-armees). Une sonde armée par l'adresse ne pouvait pas
  //  voir un défaut qui ne se produit QU'À L'ADRESSE NUE.
  return sondeArmee("retour");
}

/**
 * §1-2 (nº 339) — CE QUE LE DOCUMENT A COÛTÉ EN RÉSEAU.
 * `transferSize === 0` sur une navigation d'historique est le second
 * témoin de la restauration, et le seul qui existe partout : là où
 * `notRestoredReasons` manque (Safari), il tranche à sa place.
 * ⚠️ ZÉRO VEUT AUSSI DIRE « servi par le cache HTTP » : c'est un
 * indice, pas une preuve. `pageshow.persisted` reste le juge.
 */
function transfertDuDocument(nav: PerformanceNavigationTiming | undefined): string {
  if (!nav) return "(aucune entrée de navigation)";
  const taille = nav.transferSize;
  if (taille === undefined) return "(transferSize absent de ce navigateur)";
  return taille === 0
    ? "0 octet — RIEN N'A ÉTÉ TÉLÉCHARGÉ (page sortie d'une mémoire)"
    : `${taille} octets téléchargés (le document a été refabriqué)`;
}

/**
 * §1-3 (nº 339) — NOTRE PROPRE MASQUE, CELUI DE LA Nº 337.
 * ------------------------------------------------------------------
 * LA QUESTION DU PROPRIÉTAIRE, MOT POUR MOT : « il faut savoir si le
 * noir que je vois est le navigateur qui refabrique, ou NOTRE PROPRE
 * MASQUE. » Depuis la nº 337, le document est masqué tant que le
 * contenu n'a pas atteint la position à rendre — chez moi cela dure une
 * image, chez lui cela peut durer longtemps, et un document masqué est
 * exactement un écran de la couleur du fond, sans rien dessus.
 *
 * ON MESURE DONC LES DEUX BOUTS. Le masque peut être posé par le script
 * d'avant peinture, avant que React n'existe : sa marque porte
 * l'instant de la pose (lib/pose-sur-contenu). On lit cet instant à
 * l'arrivée, et un observateur de mutations attrape la levée.
 *
 * ⚠️ ELLE NE FAIT QUE REGARDER : l'observateur n'écrit rien, ne touche
 * ni au masque ni à la position.
 */
function surveillerLeMasque(noterLigne: (t: string) => void): () => void {
  const racine = document.documentElement;
  const MARQUE = "placeEnAttente";
  const debut = Number(racine.dataset[MARQUE]);
  const masqueALArrivee = Number.isFinite(debut) && debut > 0;
  if (masqueALArrivee) {
    noterLigne(
      `masque nº 337      : POSÉ (il y a ${Math.max(
        0,
        Date.now() - debut
      )} ms) — l'écran est masqué PAR NOUS, pas par le navigateur`
    );
  }
  let depart = masqueALArrivee ? debut : 0;
  const observateur = new MutationObserver(() => {
    const valeur = Number(racine.dataset[MARQUE]);
    const present = Number.isFinite(valeur) && valeur > 0;
    if (present && !depart) {
      depart = valeur;
      noterLigne("masque nº 337      : POSÉ maintenant");
      return;
    }
    if (!present && depart) {
      noterLigne(
        `masque nº 337      : LEVÉ après ${Date.now() - depart} ms d'écran masqué`
      );
      depart = 0;
    }
  });
  observateur.observe(racine, {
    attributes: true,
    attributeFilter: ["data-place-en-attente"],
  });
  if (!masqueALArrivee) {
    noterLigne("masque nº 337      : pas posé à l'arrivée");
  }
  return () => observateur.disconnect();
}

/**
 * §1-4 (nº 339) — L'INSTANT DE LA PREMIÈRE IMAGE QUI PORTE DU CONTENU.
 * Deux sources, et l'on donne les deux :
 *  · `first-contentful-paint`, la mesure du navigateur lui-même ;
 *  · notre propre relevé image par image — la première image où le
 *    document n'est PAS masqué et où un élément de contenu coupe la
 *    fenêtre. C'est celle qui décrit ce que l'œil voit.
 */
function guetterLaPremiereImagePleine(
  noterLigne: (t: string) => void
): () => void {
  const peinture = performance.getEntriesByType("paint");
  const fcp = peinture.find((p) => p.name === "first-contentful-paint");
  noterLigne(
    `première peinture  : ${
      fcp
        ? `${Math.round(fcp.startTime)} ms (first-contentful-paint)`
        : "(non exposée par ce navigateur)"
    }`
  );
  let image = 0;
  let rendue = false;
  const limite = performance.now() + 15000;
  const regarder = () => {
    if (rendue || performance.now() > limite) return;
    const masque =
      !document.documentElement ||
      getComputedStyle(document.documentElement).visibility === "hidden";
    if (!masque) {
      const hauteur = window.innerHeight;
      for (const e of document.querySelectorAll(
        "main a, main img, main h1, main h2, main p"
      )) {
        const r = e.getBoundingClientRect();
        if (r.bottom > 0 && r.top < hauteur && r.width > 8 && r.height > 8) {
          rendue = true;
          noterLigne(
            `premier contenu vu : ${Math.round(
              performance.now()
            )} ms après le début de cette page`
          );
          return;
        }
      }
    }
    image = requestAnimationFrame(regarder);
  };
  image = requestAnimationFrame(regarder);
  return () => cancelAnimationFrame(image);
}

/**
 * ██ §1 (nº 362) — LE DÉPART : CE QUE LE MOTEUR A SOUS LA MAIN QUAND IL
 * PREND SA PHOTO ██
 * ==================================================================
 * CE QUI MANQUAIT À CETTE SONDE, ET C'EST LA MOITIÉ DU TRAJET. Elle
 * mesurait tout de L'ARRIVÉE (retour, masque, première image, réseau) et
 * RIEN DU DÉPART — or la photo que le geste de retour affiche est prise
 * AU DÉPART, à l'instant où l'entrée d'historique change. On ne peut pas
 * voir cette photo depuis une page (aucune API ne l'expose) ; on peut
 * mesurer LA SEULE CHOSE QUI LA DÉTERMINE : ce qu'il y avait à
 * photographier, et ce que la page coûtait au téléphone à cet instant.
 *
 * CINQ NOMBRES, RELEVÉS AU CLIC PUIS SUIVIS DOUZE IMAGES :
 *  · le DÉFILEMENT — et surtout ses changements. Une chute à 0 est une
 *    remise à zéro (la nôtre, ou celle du routeur) ; une chute vers une
 *    valeur intermédiaire est un RABOTAGE du navigateur, qui ne peut
 *    arriver que si le document a rétréci sous nos pieds ;
 *  · la HAUTEUR DU DOCUMENT — son effondrement dit l'instant précis où
 *    la mosaïque quitte le DOM ;
 *  · les CARTES en place — le même instant, vu autrement ;
 *  · le POIDS DÉCODÉ des images (largeur × hauteur × 4 octets, la
 *    règle de calcul d'un pixel en mémoire). C'est LE nombre de la
 *    piste « pression mémoire » : un onglet de Safari sur iPhone vit
 *    avec quelques centaines de mégaoctets, et le système reprend en
 *    premier les surfaces VOLATILES — dont les photos de retour ;
 *  · le MASQUE (nº 337) — si c'est lui qui peint le noir au départ, la
 *    ligne le dit et l'enquête s'arrête là.
 *
 * ⚠️ ELLE NE FAIT QUE LIRE : un écouteur de clic en phase de capture
 * (jamais annulant), un abonnement d'adresse, douze images. Rien d'écrit
 * hors du journal.
 */
type EtatDuDepart = {
  y: number;
  docH: number;
  corpsH: number;
  cartes: number;
  images: number;
  chargees: number;
  poids: number;
  masque: boolean;
};

function releverLEtat(): EtatDuDepart {
  const images = [...document.querySelectorAll("img")] as HTMLImageElement[];
  let poids = 0;
  let chargees = 0;
  for (const image of images) {
    if (!image.complete || !image.naturalWidth) continue;
    chargees += 1;
    //  QUATRE OCTETS PAR PIXEL — la taille d'une image DÉCODÉE en
    //  mémoire, quel que soit le poids du fichier téléchargé.
    poids += image.naturalWidth * image.naturalHeight * 4;
  }
  return {
    y: Math.round(window.scrollY),
    docH: Math.round(document.documentElement.scrollHeight),
    corpsH: Math.round(document.body.getBoundingClientRect().height),
    cartes: document.querySelectorAll("[data-carte]").length,
    images: images.length,
    chargees,
    poids: Math.round(poids / 1048576),
    masque:
      Boolean(document.documentElement.dataset[MARQUE_ATTENTE]) ||
      document.documentElement.style.visibility === "hidden",
  };
}

function surveillerLeDepart(noterLigne: (t: string) => void): () => void {
  let arreterLAdresse: (() => void) | null = null;
  let image = 0;

  const auClic = (evenement: MouseEvent) => {
    const cible = evenement.target;
    const lien = cible instanceof Element ? cible.closest("a[href]") : null;
    const href = lien?.getAttribute("href") ?? "";
    //  LE DÉPART QUI NOUS INTÉRESSE : une carte vers une fiche, depuis
    //  une page qui n'en est pas une. C'est le trajet de la repro.
    if (!href.startsWith("/tatoueur/")) return;
    if (window.location.pathname.startsWith("/tatoueur/")) return;

    const debut = performance.now();
    const initial = releverLEtat();
    noterLigne(
      `── DÉPART vers ${href.slice(0, 40)} · défilement ${initial.y} · ` +
        `document ${initial.docH} px · corps ${initial.corpsH} px · ` +
        `${initial.cartes} cartes · ${initial.chargees}/${initial.images} images chargées · ` +
        `POIDS DÉCODÉ ≈ ${initial.poids} Mo` +
        (initial.masque ? " · ⚠️ MASQUE DÉJÀ POSÉ" : "")
    );

    //  L'INSTANT OÙ L'ENTRÉE D'HISTORIQUE CHANGE — c'est là que le
    //  moteur prend sa photo. L'écriture commune nous le donne sans
    //  qu'on enveloppe quoi que ce soit nous-mêmes (lib/adresse-courante).
    let adresseChangee = 0;
    arreterLAdresse?.();
    arreterLAdresse = souscrireAdresse(() => {
      if (adresseChangee) return;
      adresseChangee = performance.now() - debut;
      const e = releverLEtat();
      noterLigne(
        `  +${Math.round(adresseChangee)} ms ADRESSE CHANGÉE (la photo se prend ici) · ` +
          `défilement ${e.y} · document ${e.docH} · ${e.cartes} cartes` +
          (e.masque ? " · ⚠️ MASQUÉ" : "")
      );
    });

    //  DOUZE IMAGES, ET L'ON N'ÉCRIT QUE LES CHANGEMENTS : un journal
    //  de douze lignes identiques ne se lit pas.
    let precedent = initial;
    let reste = 12;
    const suivre = () => {
      const e = releverLEtat();
      const t = Math.round(performance.now() - debut);
      const dits: string[] = [];
      if (e.y !== precedent.y) {
        dits.push(
          e.y === 0
            ? `défilement REMIS À ZÉRO (${precedent.y} → 0)`
            : `défilement RABOTÉ par le navigateur (${precedent.y} → ${e.y})`
        );
      }
      if (Math.abs(e.docH - precedent.docH) > 8) {
        dits.push(
          `document ${precedent.docH} → ${e.docH} px` +
            (e.docH < precedent.docH ? " (EFFONDREMENT)" : "")
        );
      }
      if (e.cartes !== precedent.cartes) {
        dits.push(`cartes ${precedent.cartes} → ${e.cartes}`);
      }
      if (e.masque !== precedent.masque) {
        dits.push(e.masque ? "⚠️ MASQUE POSÉ (écran = fond)" : "masque levé");
      }
      if (dits.length) noterLigne(`  +${t} ms ${dits.join(" · ")}`);
      precedent = e;
      reste -= 1;
      if (reste > 0) {
        image = requestAnimationFrame(suivre);
        return;
      }
      noterLigne(
        `  = APRÈS 12 IMAGES (+${t} ms) : défilement ${e.y} · document ${e.docH} px · ` +
          `${e.cartes} cartes · ${e.chargees}/${e.images} images · ≈ ${e.poids} Mo décodés` +
          (adresseChangee
            ? ` · adresse changée à +${Math.round(adresseChangee)} ms`
            : " · ⚠️ ADRESSE JAMAIS CHANGÉE dans cette fenêtre")
      );
      arreterLAdresse?.();
      arreterLAdresse = null;
    };
    image = requestAnimationFrame(suivre);
  };

  //  EN CAPTURE, comme la mémoire de navigation : on passe avant tout
  //  le monde, et l'on n'annule jamais rien.
  document.addEventListener("click", auClic, true);
  return () => {
    document.removeEventListener("click", auClic, true);
    arreterLAdresse?.();
    cancelAnimationFrame(image);
  };
}

/** Ce que dit `notRestoredReasons`, en clair. */
function raisonsDuRefus(): string {
  const [nav] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];
  if (!nav) return "API de navigation absente";
  if (!("notRestoredReasons" in nav)) {
    return "notRestoredReasons ABSENTE de ce navigateur (Safari ne l'expose pas encore)";
  }
  const brut = (nav as unknown as { notRestoredReasons: unknown })
    .notRestoredReasons;
  if (!brut) return "notRestoredReasons = null (aucune raison rapportée)";
  try {
    const lu = JSON.parse(JSON.stringify(brut)) as {
      reasons?: { reason: string }[];
    };
    const raisons = (lu.reasons ?? []).map((r) => r.reason);
    return raisons.length ? raisons.join(", ") : "aucune (page restaurable)";
  } catch {
    return "illisible";
  }
}

/** OÙ TOURNE-T-ON ? La question qui commande toutes les autres. */
function leTerrain(enDeveloppement: boolean): string[] {
  const securise = window.isSecureContext;
  return [
    `TERRAIN : ${
      enDeveloppement
        ? "⚠️ SERVEUR DE DÉVELOPPEMENT — sa liaison de rechargement à chaud INTERDIT le cache de retour, quoi que fasse le site"
        : "site COMPILÉ"
    }`,
    `adresse du site : ${window.location.origin}`,
    `contexte sécurisé : ${securise ? "oui" : "NON (http) — les service workers y sont désactivés par le navigateur"}`,
    // ⚠️ SANS CETTE LIGNE, UN RELEVÉ NE VEUT RIEN DIRE : on doit savoir
    // quels suspects étaient éteints quand les chiffres ont été pris.
  ];
}

/**
 * LE DERNIER `popstate` — pour savoir si un changement de page est un
 * RETOUR ou une simple navigation. Posé au niveau du module : il
 * survit aux rendus, et l'écouteur est installé une seule fois.
 */
let dernierPopstate = 0;
/** L'instant précis du geste, pour chronométrer ce qui suit. */
let departRetour = 0;
/** Les requêtes réseau parties DEPUIS le geste — s'il faut refabriquer
    la page, c'est là qu'on le verra. */
let requetesDepuisLeGeste: string[] = [];
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    dernierPopstate = Date.now();
    departRetour = performance.now();
    requetesDepuisLeGeste = [];
  });
  try {
    new PerformanceObserver((liste) => {
      if (!departRetour) return;
      for (const e of liste.getEntries()) {
        if (e.startTime < departRetour) continue;
        const nom = e.name.replace(window.location.origin, "");
        // On ne garde que ce qui pourrait retarder l'affichage.
        if (/\.(png|jpe?g|webp|svg|woff2?)($|\?)/.test(nom)) continue;
        requetesDepuisLeGeste.push(
          `${nom.slice(0, 60)} (${Math.round(e.duration)} ms)`
        );
      }
    }).observe({ type: "resource", buffered: false });
  } catch {
    // API absente : on s'en passe, la sonde ne doit jamais casser
  }
}

export function SondeRetour({
  secFetchDest,
  enDeveloppement,
}: {
  secFetchDest: string;
  enDeveloppement: boolean;
}) {
  const chemin = usePathname();
  const demandee = useSyncExternalStore(
    RIEN_A_ECOUTER,
    estArmee,
    jamaisSurLeServeur
  );
  const [arretee, setArretee] = useState(false);
  const armee = demandee && !arretee;
  const [ouvert, setOuvert] = useState(false);
  const [journal, setJournal] = useState<Ligne[]>(() =>
    typeof window === "undefined" ? [] : lireJournal()
  );
  const [copie, setCopie] = useState<string | null>(null);
  const zoneTexte = useRef<HTMLTextAreaElement>(null);
  /** Faux jusqu'à la fin du premier rendu DANS CE DOCUMENT. */
  const documentNeuf = useRef(true);

  /**
   * ⚠️ TEMPORAIRE (nº 435) — MESURE DU LISERÉ DE LA FENÊTRE SUPERPOSÉE.
   * ==================================================================
   * AUCUNE CORRECTION : cette passe POSE UNE MESURE, c'est tout. Le
   * liseré (haut + gauche) survit aux nº 433/434 sur l'ordinateur du
   * propriétaire — la théorie de l'arrondi fractionnaire est donc
   * fausse ou incomplète pour SON cas, et il faut des nombres pris sur
   * SON écran. Quand une fenêtre superposée à photo est là (et à
   * chaque redimensionnement, après 400 ms de calme), ce bloc écrit au
   * journal les lignes « MESURE DU LISERÉ · … » : taille de fenêtre et
   * zoom, rectangle peint de chaque maillon (image → colonne → cadre →
   * boîte noire → enveloppe), écart par bord, LE COUPABLE (l'élément
   * dont le fond apparaît), l'agrandissement réellement calculé sur
   * l'image (le 1,01 de la nº 434 est-il appliqué DU TOUT ?), et les
   * styles capables de fabriquer l'écart.
   * POUR LE RETIRER (passe ultérieure) : ce bloc entier, et rien
   * d'autre — il ne touche à aucune mise en page, il lit et il écrit.
   */
  useEffect(() => {
    if (!armee) return;
    const une = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
    const rect4 = (r: DOMRect) =>
      `gauche ${une(r.left)} · haut ${une(r.top)} · largeur ${une(r.width)} · hauteur ${une(r.height)}`;
    const peint = (el: Element) => {
      const c = getComputedStyle(el).backgroundColor;
      return c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent" ? c : null;
    };
    let derniereSignature = "";
    let calme = 0;

    const mesurer = () => {
      //  LA BOÎTE DE LA PHOTO DE LA FENÊTRE — les mêmes repères que la
      //  fenêtre elle-même : fond noir + format 4/5 (FenetreFiche).
      const boiteNoire = [...document.querySelectorAll("div")].find(
        (d) =>
          String(d.className).includes("bg-black") &&
          String(d.className).includes("aspect-[4/5]")
      );
      if (!boiteNoire) return; // pas de fenêtre superposée : rien à mesurer
      const colonne =
        boiteNoire.querySelector('[data-role^="colonne"][aria-hidden="false"]') ??
        boiteNoire.querySelector('[data-role="colonne 0"]');
      const img = colonne?.querySelector("img");
      const cadre = boiteNoire.querySelector('[data-role="cadre"]');
      const enveloppe = boiteNoire.parentElement;
      if (!colonne || !img || !cadre || !enveloppe) {
        noter("MESURE DU LISERÉ · chaîne INCOMPLÈTE : " +
          `colonne ${colonne ? "oui" : "NON"} · image ${img ? "oui" : "NON"} · cadre ${cadre ? "oui" : "NON"}`);
        return;
      }
      const b = boiteNoire.getBoundingClientRect();
      const m = img.getBoundingClientRect();
      const signature = [innerWidth, innerHeight, Math.round(b.width), Math.round(m.left * 10)].join("|");
      if (signature === derniereSignature) return;
      derniereSignature = signature;

      const zoomProbable = Math.round((window.outerWidth / window.innerWidth) * 100);
      noter(
        `MESURE DU LISERÉ · fenêtre du navigateur : ${innerWidth} × ${innerHeight} · ` +
          `devicePixelRatio ${une(window.devicePixelRatio)} · zoom probable ≈ ${zoomProbable} %` +
          (Number.isInteger(window.devicePixelRatio) ? "" : " · dpr NON ENTIER : zoom actif probable")
      );
      noter(`MESURE DU LISERÉ · image (peinte) : ${rect4(m)}`);
      noter(`MESURE DU LISERÉ · colonne du carrousel : ${rect4(colonne.getBoundingClientRect())}`);
      noter(`MESURE DU LISERÉ · cadre du carrousel : ${rect4(cadre.getBoundingClientRect())}`);
      noter(`MESURE DU LISERÉ · boîte de la photo (fond noir) : ${rect4(b)}`);
      noter(`MESURE DU LISERÉ · enveloppe de la fenêtre : ${rect4(enveloppe.getBoundingClientRect())}`);
      //  Les fonds peints entre l'image et l'enveloppe : chacun peut
      //  être la bande visible.
      const fonds: string[] = [];
      let p: Element | null = img.parentElement;
      while (p && p !== enveloppe.parentElement) {
        const fond = peint(p);
        if (fond) fonds.push(`${p.tagName.toLowerCase()}(${String(p.className).split(" ")[0] || "sans classe"}) → ${fond}`);
        p = p.parentElement;
      }
      noter(`MESURE DU LISERÉ · fonds peints dans la chaîne : ${fonds.length ? fonds.join(" · ") : "AUCUN"}`);
      const ecarts = {
        HAUT: m.top - b.top,
        GAUCHE: m.left - b.left,
        DROITE: b.right - m.right,
        BAS: b.bottom - m.bottom,
      };
      noter(
        "MESURE DU LISERÉ · écart image/boîte (positif = fond visible, négatif = bord couvert) — " +
          Object.entries(ecarts).map(([n, v]) => `${n} : ${une(v)} px`).join(" · ")
      );
      const decouverts = Object.entries(ecarts).filter(([, v]) => v > 0.05);
      if (decouverts.length === 0) {
        noter("MESURE DU LISERÉ · LE COUPABLE : aucun écart positif image/boîte — si une bande reste VISIBLE, elle est HORS de cette boîte (lis la ligne enveloppe/fonds peints)");
      } else {
        for (const [bord] of decouverts) {
          //  Le premier ancêtre PEINT dont la boîte s'étend au-delà de
          //  l'image sur ce bord : c'est son fond qu'on voit.
          let coupable = "la page derrière (aucun fond dans la chaîne)";
          let q: Element | null = img.parentElement;
          while (q && q !== enveloppe.parentElement) {
            const fond = peint(q);
            if (fond) {
              const r = q.getBoundingClientRect();
              const depasse =
                bord === "HAUT" ? r.top < m.top - 0.05 :
                bord === "GAUCHE" ? r.left < m.left - 0.05 :
                bord === "DROITE" ? r.right > m.right + 0.05 :
                r.bottom > m.bottom + 0.05;
              if (depasse) {
                coupable = `${q.tagName.toLowerCase()}(${String(q.className).split(" ")[0] || "sans classe"}) · fond ${fond}`;
                break;
              }
            }
            q = q.parentElement;
          }
          noter(`MESURE DU LISERÉ · LE COUPABLE (bord ${bord}) : ${coupable}`);
        }
      }
      const cs = getComputedStyle(img);
      const scaleLu = (cs as CSSStyleDeclaration & { scale?: string }).scale ?? "(illisible)";
      const classeScale = String(img.className).includes("scale-[1.01]");
      //  nº 437 — le débord est passé EN BOÎTE (sans transform) : la
      //  marque de la nouvelle classe remplace le verdict du scale.
      const classeDebord = String(img.className).includes("-left-[0.5%]");
      noter(
        `MESURE DU LISERÉ · agrandissement : scale calculé « ${scaleLu} » · transform « ${cs.transform} » · ` +
          (classeDebord
            ? "DÉBORD EN BOÎTE nº 437 (sans transform) — l'attendu : scale « none », transform « none », et tous les écarts image/boîte NÉGATIFS ci-dessus"
            : `classe scale-[1.01] dans l'attribut : ${classeScale ? "oui" : "NON"}` +
              (scaleLu === "1.01"
                ? " — APPLIQUÉ"
                : " — ⚠️ NI scale NI débord en boîte : la photo regardée n'est pas agrandie du tout, c'est le coupable"))
      );
      noter(
        `MESURE DU LISERÉ · styles de l'image : object-fit ${cs.objectFit} · object-position ${cs.objectPosition} · ` +
          `padding ${cs.padding} · bordure ${cs.borderWidth} · arrondi ${cs.borderRadius} · marge ${cs.margin}`
      );

      /* ⚠️ TEMPORAIRE (nº 436) — « QUI PEINT CE PIXEL ? », l'extension.
         La 435 a prouvé : la photo déborde sa boîte de 3 à 8 px sur les
         QUATRE bords, et la bande reste visible — Safari seulement.
         Elle est donc peinte par un élément que la chaîne n'a pas
         nommé : un habillage AUTOUR de la boîte, ou une couche posée
         PAR-DESSUS la photo — ou c'est un défaut de rendu WebKit pur,
         et alors ces lignes diront « rien d'anormal ». */

      //  L'identité courte d'un élément, lisible : balise, data-role
      //  s'il en a un, sinon la première classe.
      const identite = (el: Element) => {
        const role = (el as HTMLElement).dataset?.role;
        const premiere = String(el.className).split(" ")[0] || "";
        return `${el.tagName.toLowerCase()}${role ? `[${role}]` : premiere ? `(${premiere.slice(0, 24)})` : ""}`;
      };
      const horsSonde = (liste: Element[]) =>
        liste.find((el) => !el.closest("[data-panneau-sonde]"));

      /* 1 · LE SONDAGE PAR POINTS — le long des bords HAUT et GAUCHE
         de la boîte : trois positions (25, 50, 75 %), six profondeurs
         (−8, −4, −2 dehors · +2, +4, +8 dedans). Chaque point dit QUI
         est touché, son fond, et sa RELATION à la photo. Une « couche
         AU-DESSUS de l'image » au bord est le coupable probable. */
      for (const bord of ["HAUT", "GAUCHE"] as const) {
        for (const part of [0.25, 0.5, 0.75]) {
          for (const prof of [-8, -4, -2, 2, 4, 8]) {
            const x = bord === "HAUT" ? b.left + b.width * part : b.left + prof;
            const y = bord === "HAUT" ? b.top + prof : b.top + b.height * part;
            const touche = horsSonde(document.elementsFromPoint(x, y));
            let ligne: string;
            if (!touche) {
              ligne = "(hors écran ou rien)";
            } else {
              const fond = getComputedStyle(touche).backgroundColor;
              const relation =
                touche === img
                  ? "c'est l'image"
                  : touche.contains(img)
                    ? "ancêtre de l'image"
                    : "COUCHE AU-DESSUS de l'image";
              ligne = `${identite(touche)} · fond ${fond} · ${relation}`;
            }
            noter(
              `MESURE DU PIXEL · bord ${bord} · ${Math.round(part * 100)} % · ` +
                `${prof > 0 ? "+" : ""}${prof} px (${prof < 0 ? "dehors" : "dedans"}) : ${ligne}`
            );
          }
        }
      }

      /* 2 · LES RECTANGLES DES FONDS PEINTS — la 435 les nommait sans
         leurs boîtes : un fond PLUS GRAND que la boîte de la photo
         expliquerait la bande à lui seul. */
      let q2: Element | null = img.parentElement;
      while (q2 && q2 !== enveloppe.parentElement) {
        const fond = peint(q2);
        if (fond) {
          const r = q2.getBoundingClientRect();
          const c2 = getComputedStyle(q2);
          noter(
            `MESURE DU PIXEL · fond peint : ${identite(q2)} · ${rect4(r)} · ` +
              `arrondi ${c2.borderRadius} · fond ${fond}`
          );
        }
        q2 = q2.parentElement;
      }

      /* 3 · LES COUCHES SUPERPOSÉES AU COIN HAUT-GAUCHE — tout élément
         qui chevauche les 60 premiers pixels du coin de la photo SANS
         être un ancêtre de l'image : voiles, dégradés, boutons,
         légendes. Dix au plus, les premiers dans l'ordre du document. */
      const coin = { gauche: m.left, haut: m.top, droite: m.left + 60, bas: m.top + 60 };
      let comptees = 0;
      for (const el of enveloppe.querySelectorAll("*")) {
        if (comptees >= 10) break;
        if (el === img || el.contains(img)) continue;
        if (el.closest("[data-panneau-sonde]")) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right < coin.gauche || r.left > coin.droite || r.bottom < coin.haut || r.top > coin.bas) continue;
        const c3 = getComputedStyle(el);
        const degrade = c3.backgroundImage && c3.backgroundImage !== "none"
          ? c3.backgroundImage.slice(0, 60)
          : "(aucun)";
        noter(
          `MESURE DU PIXEL · couche au coin haut-gauche : ${identite(el)} · ${rect4(r)} · ` +
            `fond ${c3.backgroundColor} · dégradé ${degrade} · opacité ${c3.opacity}`
        );
        comptees += 1;
      }
      if (comptees === 0) {
        noter("MESURE DU PIXEL · couche au coin haut-gauche : AUCUNE — rien ne chevauche le coin hors la lignée de l'image");
      }
    };

    //  L'APPARITION de la fenêtre : guettée toutes les 500 ms ; la
    //  mesure part deux images après (la peinture est faite). Le
    //  REDIMENSIONNEMENT : 400 ms de calme, puis re-mesure — la
    //  signature (taille + boîte) évite toute ligne en double.
    const guet = window.setInterval(() => {
      requestAnimationFrame(() => requestAnimationFrame(mesurer));
    }, 500);
    const auRedimensionnement = () => {
      window.clearTimeout(calme);
      calme = window.setTimeout(() => {
        derniereSignature = "";
        requestAnimationFrame(() => requestAnimationFrame(mesurer));
      }, 400);
    };
    window.addEventListener("resize", auRedimensionnement);
    return () => {
      window.clearInterval(guet);
      window.clearTimeout(calme);
      window.removeEventListener("resize", auRedimensionnement);
    };
  }, [armee]);

  /**
   * 1. L'ENREGISTREMENT — UNE SECTION PAR PAGE, ET NON PAR DOCUMENT.
   * ⚠️ C'ÉTAIT LE DÉFAUT : le relevé du propriétaire ne contenait
   * qu'une seule page, alors qu'il avait ouvert une fiche et fait deux
   * retours. La sonde est montée dans la MISE EN PAGE, qui survit aux
   * changements de page ; et sur smartphone, ouvrir une fiche est une
   * navigation INTERNE du routeur — aucun document n'est recréé. L'effet
   * ne se rejouait donc jamais, et rien ne s'écrivait.
   * Il dépend maintenant du CHEMIN : chaque page affichée écrit sa
   * section, quel que soit le chemin par lequel on y arrive.
   *
   * ET C'EST DÉJÀ UN RÉSULTAT. Si le retour depuis une fiche s'avère
   * être une navigation INTERNE (même document), le cache de navigation
   * n'y est pour rien : il ne concerne que les documents. Le relevé
   * dira laquelle des deux situations se produit sur l'iPhone.
   */
  useEffect(() => {
    if (!armee) return;
    try {
      sessionStorage.setItem(CLE_ARMEE, "1");
    } catch {
      // stockage indisponible : la sonde ne traversera pas les pages
    }

    const neuf = documentNeuf.current;
    documentNeuf.current = false;
    const [nav] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    const type = nav?.type ?? "?";
    const adresse = window.location.pathname + window.location.search;
    // Un `popstate` de moins d'une seconde : c'est un retour ou une
    // avance, pas un lien touché.
    const parRetour = Date.now() - dernierPopstate < 1000;

    if (neuf && !lireJournal().length) leTerrain(enDeveloppement).forEach(noter);
    noter(`── PAGE ${adresse}`);

    if (neuf) {
      noter(`arrivée : DOCUMENT NEUF · type de navigation « ${type} »`);
      /**
       * ⚠️ LA PREUVE DU CACHE DE RETOUR, DANS LES DEUX SENS.
       * `pageshow persisted = true` prouve la RESTAURATION — l'écouteur
       * plus bas l'attrape, le composant n'ayant jamais été démonté.
       * L'ÉCHEC, lui, ne produit aucun `pageshow` observable : le
       * document est NEUF, et son `pageshow` d'ouverture passe avant que
       * React ne démarre. Mais il laisse une trace tout aussi sûre —
       * cet effet-ci se rejoue, dans un document neuf, avec un type de
       * navigation `back_forward`.
       */
      if (type === "back_forward") {
        noter(
          ">>> RETOUR SANS RESTAURATION : document RECONSTRUIT (le cache de retour n'a pas servi — c'est le cas où l'écran gris apparaît)"
        );
      }
      noter(`refus du cache     : ${raisonsDuRefus()}`);
      noter(`transfert          : ${transfertDuDocument(nav)}`);
      noter(`sec-fetch-dest reçu par le serveur : ${secFetchDest}`);
    } else {
      noter(
        `arrivée : MÊME DOCUMENT — ${
          parRetour
            ? "RETOUR/AVANCE interne du routeur (popstate). Aucun document n'est recréé : le cache de retour n'est PAS en jeu ici."
            : "navigation interne du routeur (lien touché)"
        }`
      );
    }

    /**
     * ⚠️ LA POSITION SE MESURE DEUX FOIS, ET C'EST INDISPENSABLE.
     * Le relevé précédent annonçait « défilement à l'arrivée : 0 » sur
     * toutes les pages, y compris après un retour où la position était
     * en réalité rendue. C'ÉTAIT LA SONDE QUI MESURAIT TROP TÔT : elle
     * vit dans la mise en page du groupe, la mémoire de navigation dans
     * la mise en page RACINE, et React exécute les effets des enfants
     * AVANT ceux des parents. La sonde lisait donc le défilement juste
     * avant que la restitution ne l'applique. Mesuré au banc d'essai :
     * position réelle 900, sonde « 0 ».
     * On relève donc l'instant de l'arrivée ET l'instant d'après, avec
     * ce que la mémoire contient pour cette adresse. Trois nombres qui
     * ne peuvent plus se contredire.
     */
    const memorisee = (() => {
      try {
        /*  §1 (nº 339) — LA CLÉ CANONIQUE, et non l'adresse telle
            quelle. La position est rangée sous l'adresse DÉBARRASSÉE
            des réglages de sonde (lib/adresse-recherche) : en lisant
            `…?sonde-retour=1`, la sonde annonçait « (rien) » alors
            qu'une position existait, et l'on ne pouvait pas savoir si
            le masque de la nº 337 avait une raison de se poser. */
        const brut = localStorage.getItem(
          `roswel:defilement:${adresseDeRecherche(adresse)}`
        );
        return brut ? (JSON.parse(brut) as { y: number }).y : null;
      } catch {
        return null;
      }
    })();
    const aLArrivee = Math.round(window.scrollY);
    window.setTimeout(() => {
      noter(
        `défilement : ${aLArrivee} à l'arrivée → ${Math.round(
          window.scrollY
        )} une fois posé · mémorisé pour cette adresse : ${
          memorisee ?? "(rien)"
        } · réserve : ${
          document.documentElement.dataset.positionPosee ?? "(aucune)"
        }`
      );
      rafraichir();
    }, 700);

    /**
     * CE QUI SE PASSE **PENDANT** LE GESTE, et non plus seulement à
     * l'arrivée. L'écran gris se joue là : entre le doigt qui glisse et
     * le premier contenu peint.
     *  · le délai que le routeur met à rendre la page ;
     *  · le délai jusqu'à la PREMIÈRE PEINTURE qui suit ;
     *  · et les requêtes réseau parties entre-temps — s'il faut
     *    redemander la page au serveur, c'est là qu'on le lira.
     */
    if (parRetour && departRetour) {
      const versLeRendu = Math.round(performance.now() - departRetour);
      const depart = departRetour;
      /**
       * ⚠️ COMBIEN DE CARTES SONT DÉJÀ EN PLACE À CET INSTANT — et c'est
       * LA mesure qui manquait. Le relevé disait « routeur 13 ms » sans
       * dire CE QUI avait été rendu en 13 ms. Or les deux lectures
       * possibles mènent à deux causes opposées :
       *  · si la mosaïque est DÉJÀ là à 13 ms, React a fini, et les
       *    387 ms restants sont du calcul de mise en page, de la
       *    peinture ou du décodage d'images ;
       *  · si elle n'y est PAS ENCORE, l'effet a devancé le rendu de la
       *    page (la sonde vit dans la mise en page, qui se rend avant
       *    son contenu) et ces 387 ms sont le rendu React lui-même.
       * Au banc, sur un processeur ralenti dix fois, c'est la seconde
       * lecture : les cartes sont en place dès l'effet, et le temps
       * grimpe avec leur nombre (24 cartes → 269 ms, 48 → 395 ms).
       */
      const cartesAuRendu = document.querySelectorAll("[data-carte]").length;
      /**
       * ⚠️ LA QUESTION QUI DÉCIDE DE TOUT, ET ELLE TIENT EN UNE LIGNE.
       * Le relevé dit : 27 ms de mise en page au BOUTON, 357 à 382 ms au
       * GESTE. Or « mise en page » signifie ici « la première image que
       * le navigateur nous donne après l'effet ». Deux mondes peuvent
       * produire ce chiffre, et ils appellent des corrections opposées :
       *
       *  A. LE FIL PRINCIPAL EST BLOQUÉ. Du code tourne — une lecture de
       *     géométrie forcée, un écouteur tactile non passif, une boucle.
       *     Alors les MINUTERIES ne partent pas non plus : `setTimeout`
       *     ne peut pas s'exécuter pendant qu'un autre code occupe le
       *     fil. On verra donc peu de tics et un GRAND TROU.
       *
       *  B. LE FIL EST LIBRE, MAIS LE NAVIGATEUR NE NOUS DONNE PAS
       *     D'IMAGE. C'est ce qui arrive pendant l'animation de retour
       *     d'iOS : la page est mise de côté le temps du glissement, et
       *     ses images d'animation sont suspendues. Alors les minuteries
       *     CONTINUENT DE PARTIR, toutes les quelques millisecondes,
       *     pendant que `requestAnimationFrame` reste muet.
       *
       * On lance donc une minuterie qui se relance elle-même, et on
       * compte : combien de tics avant la première image, et quel est le
       * plus grand trou entre deux tics. Beaucoup de tics + petit trou =
       * B (le navigateur anime, notre code n'y est pour rien). Peu de
       * tics + grand trou = A (c'est nous, et le trou dit combien).
       */
      let tics = 0;
      let plusGrandTrou = 0;
      let dernierTic = departRetour;
      let ticsALaPremiereImage = -1;
      const tic = () => {
        const t = performance.now();
        plusGrandTrou = Math.max(plusGrandTrou, t - dernierTic);
        dernierTic = t;
        tics += 1;
        if (t - departRetour < 2000) window.setTimeout(tic, 0);
      };
      window.setTimeout(tic, 0);
      /**
       * ⚠️ LA DÉCOUPE DES QUATRE CENTS MILLISECONDES.
       * Le relevé du propriétaire est sans appel : le routeur a fini en
       * 13 ms, aucune requête ne part, et pourtant la première image
       * arrive à 400 ms. Le temps ne se perd donc ni dans le réseau ni
       * dans le routeur — il se perd APRÈS, entre le moment où le DOM
       * est en place et celui où le navigateur produit une image.
       * On coupe ce trajet en deux, avec les seuls outils qui existent
       * partout (Safari n'expose ni `longtask` ni
       * `long-animation-frame`) :
       *  · la PREMIÈRE image demandée après l'effet — le navigateur y
       *    est passé par le calcul des styles et de la mise en page ;
       *  · la SECONDE — l'image précédente a été produite, donc peinte.
       * Et on compte ce qu'il y avait à faire : les cartes, les images,
       * et celles qui étaient déjà décodées.
       */
      requestAnimationFrame(() => {
        const versLaMiseEnPage = Math.round(performance.now() - depart);
        ticsALaPremiereImage = tics;
        requestAnimationFrame(() => {
          const versLaPeinture = Math.round(performance.now() - depart);
          const cartes = document.querySelectorAll("[data-carte]").length;
          const images = [...document.querySelectorAll("[data-carte] img")];
          const chargees = images.filter((i) => (i as HTMLImageElement).complete)
            .length;
          noter(
            `GESTE → routeur ${versLeRendu} ms → mise en page ${versLaMiseEnPage} ms → PEINTURE ${versLaPeinture} ms`
          );
          noter(
            `cartes : ${cartesAuRendu} en place dès l'effet → ${cartes} à la peinture` +
              (cartesAuRendu === cartes
                ? " (la mosaïque était DÉJÀ rendue : le temps qui suit est mise en page + peinture + images)"
                : " (la mosaïque N'ÉTAIT PAS rendue à l'effet : le temps qui suit est le rendu React lui-même)")
          );
          noter(
            `images : ${images.length} dont ${chargees} chargées au moment de la peinture` +
              (chargees < images.length
                ? ` — ${images.length - chargees} manquaient encore`
                : "")
          );
          /**
           * LE VERDICT — et il ne se prononce QUE s'il y a un retard à
           * expliquer. Quand la première image arrive en vingt
           * millisecondes, il n'y a rien à disculper ni à accuser : le
           * seul « trou » mesuré est le rendu de la page lui-même, qui
           * est du travail légitime.
           */
          const trou = Math.round(plusGrandTrou);
          let verdict: string;
          if (versLaMiseEnPage < 100) {
            verdict =
              "RIEN À EXPLIQUER — la première image est arrivée tout de suite";
          } else if (trou >= versLaMiseEnPage * 0.6) {
            verdict =
              `BLOQUÉ — un seul blocage de ${trou} ms couvre l'attente : ` +
              "c'est du code qui occupe le fil, et c'est chez nous qu'il faut chercher";
          } else {
            verdict =
              "LIBRE — les minuteries ont continué de partir pendant toute " +
              "l'attente. Ce n'est donc PAS notre code qui retient l'image : " +
              "le navigateur ne nous en donne pas, parce qu'il anime le geste";
          }
          noter(
            `fil principal : ${ticsALaPremiereImage} tics de minuterie avant la 1ʳᵉ image · ` +
              `plus grand trou ${trou} ms → ${verdict}`
          );
          noter(
            `réseau pendant le geste : ${
              requetesDepuisLeGeste.length
                ? requetesDepuisLeGeste.join(" | ")
                : "AUCUNE requête (la page était déjà en mémoire)"
            }`
          );
          rafraichir();
        });
      });
    }

    if (neuf) {
      /*  §1 (nº 344) — QUELLE MISE EN PAGE A ÉTÉ SERVIE, ET POURQUOI.
          Le propriétaire a reçu la mise en page ORDINATEUR sur son
          iPhone. Mesuré à la nº 344 : le HTML servi est IDENTIQUE AU
          CARACTÈRE PRÈS pour un iPhone et pour un ordinateur — la mise
          en page est décidée DANS LE NAVIGATEUR, par l'attribut
          `data-appareil` que le script d'avant peinture pose d'après
          `matchMedia("(pointer: coarse)")`, et la variante `mobile` de
          globals.css ne regarde QUE cet attribut. Autrement dit : si le
          propriétaire voit la version ordinateur, c'est que cet
          attribut manquait ou valait « web ». Cette ligne le dit, et
          c'est la seule façon de l'attraper au moment où ça arrive. */
      noter(
        `mise en page : data-appareil="${
          document.documentElement.dataset.appareil ?? "(ABSENT — version ordinateur servie)"
        }" · pointeur grossier : ${
          matchMedia("(pointer: coarse)").matches ? "oui" : "NON"
        } · largeur ${window.innerWidth}`
      );
      // D'OÙ VIENT LE GRIS ? Ce que le site peint, et ce que le
      // navigateur peint autour de lui.
      const styleRacine = getComputedStyle(document.documentElement);
      noter(
        `couleurs : canevas ${styleRacine.backgroundColor} · corps ${
          getComputedStyle(document.body).backgroundColor
        } · theme-color ${
          document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ??
          "(absent)"
        }`
      );
      noter(
        `thème du système : ${
          matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair"
        }`
      );

      // LE SERVICE WORKER — contrôle-t-il cette page ?
      if (!("serviceWorker" in navigator)) {
        noter(
          `service worker : INDISPONIBLE — ${
            window.isSecureContext
              ? "non géré par ce navigateur"
              : "le site est ouvert en http (contexte non sécurisé), le navigateur les désactive"
          }`
        );
      } else {
        const controleur = navigator.serviceWorker.controller;
        noter(
          `service worker : ${
            controleur
              ? `CONTRÔLE la page (${controleur.scriptURL})`
              : "disponible, mais ne contrôle pas cette page"
          }`
        );
      }

      // LES EN-TÊTES, tels que le serveur les renvoie pour cette adresse.
      fetch(window.location.href, { cache: "no-store" })
        .then((r) => {
          noter(`cache-control    : ${r.headers.get("cache-control") ?? "(aucun)"}`);
          noter(`vary             : ${r.headers.get("vary") ?? "(aucun)"}`);
          rafraichir();
        })
        .catch(() => {
          noter("en-têtes : relevé impossible (hors ligne ?)");
          rafraichir();
        });
    }

    /** Le panneau suit, sans jamais poser d'état pendant l'effet. */
    function rafraichir() {
      window.setTimeout(() => setJournal(lireJournal()), 0);
    }

    /*  §1-3 et §1-4 (nº 339) — LES DEUX MESURES QUI MANQUAIENT.
        Le masque de la nº 337 (posé quand, levé quand, combien de temps)
        et l'instant de la première image qui porte du contenu. Elles
        répondent ensemble à la seule question qui reste : le noir que
        voit le propriétaire est-il le navigateur qui refabrique la page,
        ou notre propre masque ? */
    const arreterLeMasque = surveillerLeMasque((t) => {
      noter(t);
      rafraichir();
    });
    const arreterLImage = guetterLaPremiereImagePleine((t) => {
      noter(t);
      rafraichir();
    });
    /*  §1 (nº 362) — ET LE DÉPART, la moitié qui manquait : ce que le
        moteur a sous la main à l'instant où il prendrait sa photo. */
    const arreterLeDepart = surveillerLeDepart((t) => {
      noter(t);
      rafraichir();
    });

    rafraichir();
    return () => {
      arreterLeMasque();
      arreterLImage();
      arreterLeDepart();
    };
  }, [armee, chemin, secFetchDest, enDeveloppement]);

  /* 1bis. LES ÉVÉNEMENTS DE DOCUMENT — posés une seule fois. */
  useEffect(() => {
    if (!armee) return;
    const auRetour = (e: PageTransitionEvent) => {
      noter(
        `>>> pageshow persisted = ${e.persisted} ${
          e.persisted ? "(PAGE RESTAURÉE VIVANTE)" : "(page reconstruite)"
        }`
      );
      window.setTimeout(() => setJournal(lireJournal()), 0);
    };
    const auDepart = (e: PageTransitionEvent) => {
      noter(`<<< pagehide persisted = ${e.persisted}`);
    };
    window.addEventListener("pageshow", auRetour);
    window.addEventListener("pagehide", auDepart);
    return () => {
      window.removeEventListener("pageshow", auRetour);
      window.removeEventListener("pagehide", auDepart);
    };
  }, [armee]);

  /* 2. LE PRESSE-PAPIERS — deux chemins, iOS refusant le premier hors
        HTTPS (repris tel quel de la sonde du clavier). */
  const texte = journal.map((l) => `${l.t} ${l.texte}`).join("\n");


  if (!armee) return null;

  if (!ouvert) {
    return (
      <button
        type="button"
        //  ⚠️ TEMPORAIRE (nº 436) — le sondage par points doit ignorer
        //  la sonde elle-même : ce marqueur l'identifie, rien d'autre.
        data-panneau-sonde=""
        onClick={() => {
          setJournal(lireJournal());
          setOuvert(true);
        }}
        style={{
          position: "fixed",
          left: 8,
          bottom: 8,
          zIndex: 2147483647,
          background: "#EE3D6F",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "6px 12px",
          font: "600 12px/1 system-ui, sans-serif",
        }}
      >
        sonde retour · {journal.filter((l) => l.texte.startsWith("── PAGE")).length}{" "}
        pages
      </button>
    );
  }

  return (
    <div
      //  ⚠️ TEMPORAIRE (nº 436) — même marqueur que le bouton replié.
      data-panneau-sonde=""
      style={{
        position: "fixed",
        inset: "auto 8px 8px 8px",
        zIndex: 2147483647,
        //  ⚠️ LA MOITIÉ BASSE, jamais plus (nº 183-§1).
        maxHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "#1A1A1D",
        border: "1px solid #EE3D6F",
        borderRadius: 12,
        padding: 12,
        color: "#fff",
        font: "12px/1.45 ui-monospace, monospace",
      }}
    >
      <strong style={{ font: "600 13px/1.2 system-ui, sans-serif" }}>
        Sonde du retour — {journal.filter((l) => l.texte.startsWith("── PAGE")).length}{" "}
        pages, {journal.length} lignes
      </strong>
      <textarea
        ref={zoneTexte}
        readOnly
        value={texte}
        aria-label="Relevé de la sonde du retour"
        style={{
          flex: 1,
          minHeight: 180,
          width: "100%",
          background: "#111",
          color: "#fff",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 8,
          font: "11px/1.4 ui-monospace, monospace",
        }}
      />
      {copie && <span style={{ color: "#EE3D6F" }}>{copie}</span>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
        <BoutonReplier surToucher={() => setOuvert(false)} />
        <BoutonCopierJournal texte={() => texte} />
        {/*  ⚠️ LE CHEMIN SANS PRESSE-PAPIERS (nº 174-§3A). */}
        <BoutonEnvoyerJournal sonde="retour" texte={() => texte} />
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(CLE_JOURNAL);
            } catch {
              /* rien */
            }
            setJournal([]);
            setCopie(null);
          }}
          style={styleBouton}
        >
          Vider
        </button>
        <button type="button" onClick={() => setOuvert(false)} style={styleBouton}>
          Replier
        </button>
        <button
          type="button"
          onClick={() => {
            //  §4 (nº 343) — LE DÉSARMEMENT EST DURABLE LUI AUSSI, et
            //  il vaut pour LES TROIS sondes : l'armement n'en a plus
            //  qu'une écriture (lib/sondes-armees).
            desarmerLesSondes();
            try {
              sessionStorage.removeItem(CLE_ARMEE);
              sessionStorage.removeItem(CLE_JOURNAL);
            } catch {
              /* rien */
            }
            setArretee(true);
          }}
          style={{ ...styleBouton, background: "#EE3D6F", borderColor: "#EE3D6F" }}
        >
          DÉSARMER (les trois sondes)
        </button>
      </div>
    </div>
  );
}

const styleBouton: React.CSSProperties = {
  background: "#2A2A2E",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 8,
  padding: "8px 14px",
  font: "600 13px/1 system-ui, sans-serif",
};
