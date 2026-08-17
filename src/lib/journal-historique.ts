"use client";

/**
 * ██ LE JOURNAL DE L'HISTORIQUE — `?sonde-historique=1` (nº 331-§4) ██
 * ==================================================================
 * POURQUOI IL EXISTE. Le propriétaire retombe parfois sur l'accueil au
 * bout de plusieurs retours et pas en avant — « au fond de la pile ».
 * Le défaut n'est donc PAS dans une page : il est dans la PILE, il
 * s'accumule sur plusieurs navigations, et personne n'a jamais vu la
 * suite complète de ce qui l'écrit. Ce module l'enregistre.
 *
 * ⚠️ IL SURVIT AUX CHANGEMENTS DE PAGE, et c'est l'exigence nº 1 : un
 * journal qui repart de zéro à chaque page ne montrerait jamais
 * l'accumulation. Il vit donc dans le `sessionStorage` — la mémoire de
 * L'ONGLET : elle traverse toutes les navigations, y compris les
 * rechargements complets, et disparaît quand l'onglet se ferme. Rien à
 * purger, rien qui traîne d'un jour sur l'autre.
 *
 * ⚠️ IL NE PERTURBE RIEN, et c'est l'exigence nº 2 :
 *  · il ne pose AUCUNE entrée d'historique ;
 *  · les trois fonctions enveloppées (`pushState`, `replaceState`,
 *    `back`) APPELLENT TOUJOURS L'ORIGINALE, avec les mêmes arguments,
 *    et rendent sa valeur — elles notent APRÈS coup ;
 *  · les écouteurs sont posés en PASSIF : ils ne peuvent ni annuler un
 *    geste, ni le retarder ;
 *  · il ne gèle rien, ne défile pas, ne pose aucun style hors de son
 *    propre panneau, et n'entoure la page d'AUCUN conteneur ;
 *  · tout est remis en place au démontage.
 *
 * ⚠️ IL NE S'ARME QUE SUR DEMANDE. Sans `?sonde-historique=1`, rien
 * n'est enveloppé, rien n'est écouté, rien n'est écrit.
 *
 * ⚠️ TEMPORAIRE — inscrit au bandeau des chantiers ouverts
 * (lib/navigation-session), à retirer avant la mise en ligne.
 */

export type LigneHistorique = {
  /** Le rang, continu d'une page à l'autre. */
  n: number;
  /** L'instant, en heure locale — « 14:32:07.412 ». */
  t: string;
  /** POSÉE · REMPLACÉE · REPRISE · RETOUR · AVANT · DÉPART DU SITE */
  quoi: string;
  /** L'adresse COMPLÈTE au moment où c'est arrivé. */
  ou: string;
  /** Le module ou la surface d'origine, lu dans la pile d'appel. */
  qui: string;
  /** `history.length` à cet instant. */
  pile: number;
};

const CLE = "roswel:journal-historique";
/** Au-delà, on jette les plus anciennes : un onglet longtemps ouvert ne
    doit pas remplir la mémoire de l'onglet. */
const MAXIMUM = 500;

let lignes: LigneHistorique[] = [];
let charge = false;
const abonnes = new Set<() => void>();

function relire(): void {
  if (charge) return;
  charge = true;
  try {
    const brut = sessionStorage.getItem(CLE);
    if (brut) lignes = JSON.parse(brut) as LigneHistorique[];
  } catch {
    lignes = [];
  }
}

function ecrire(): void {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(lignes));
  } catch {
    // mémoire pleine ou refusée : le journal vit alors le temps de la page
  }
}

/** ⚠️ RÉFÉRENCE STABLE tant que rien n'a changé — la règle de
    `useSyncExternalStore`, sans quoi React boucle. */
export function lireLeJournal(): LigneHistorique[] {
  relire();
  return lignes;
}

/** Côté serveur : un journal vide, toujours la même référence. */
const VIDE: LigneHistorique[] = [];
export function lireLeJournalServeur(): LigneHistorique[] {
  return VIDE;
}

export function souscrireAuJournal(abonne: () => void): () => void {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

export function viderLeJournal(): void {
  lignes = [];
  ecrire();
  for (const abonne of abonnes) abonne();
}

/** LE RELEVÉ EN TEXTE — c'est lui que le bouton « COPIER » rend. */
export function texteDuJournal(): string {
  relire();
  const entete =
    `JOURNAL DE L'HISTORIQUE — ${lignes.length} ligne(s)\n` +
    `onglet ouvert sur ${location.host}\n` +
    `nº · heure · événement · pile · adresse · origine\n` +
    "------------------------------------------------------------\n";
  return (
    entete +
    lignes
      .map((l) => `${l.n} · ${l.t} · ${l.quoi} · pile ${l.pile} · ${l.ou} · ${l.qui}`)
      .join("\n")
  );
}

/* ==================================================================
 * QUI A FAIT ÇA — lu dans la pile d'appel
 * ==================================================================
 * On ne DEVINE pas l'origine : on la lit. La première ligne de la pile
 * qui nomme un fichier du site (`/src/…`) et qui n'est pas ce module
 * donne le nom du module appelant. À défaut, on reconnaît le routeur
 * de Next à ses propres chemins. Sinon : « inconnu » — jamais une
 * hypothèse déguisée en fait.
 */
/**
 * ⚠️ ON LIT D'ABORD LA MARQUE, PAS LA PILE D'APPEL. La pile est
 * séduisante mais ELLE MENT une fois le code empaqueté : Turbopack
 * réunit tout le site dans un seul morceau, et l'on ne lit plus que
 * « src_0cp12c7._.js:7716 » — un chiffre qui ne désigne rien pour le
 * propriétaire. Les surfaces du site, elles, POSENT UNE MARQUE dans
 * l'état de leur étape (`etapeRefermable`, `fenetreFiche`,
 * `retourReconstruit`…) : c'est un fait, pas une déduction, et il
 * survit à n'importe quel empaquetage.
 * La pile ne sert donc plus que de DERNIER RECOURS, quand aucune
 * marque ne répond.
 */
function origineDeLEtat(etat: unknown): string {
  const marques = (etat ?? {}) as Record<string, unknown>;
  if (marques.etapeRefermable !== undefined) {
    return "surface refermable (lib/etape-refermable)";
  }
  if (marques.fenetreCarrousel) return "fenêtre de carrousel (FicheTatoueur)";
  if (marques.fenetreFiche) {
    return "fenêtre de fiche (PileFiches · GrilleTatoueurs · PageFavoris)";
  }
  if (marques.retourReconstruit) return "RetourGaranti";
  if (marques.__PRIVATE_NEXTJS_INTERNALS_TREE !== undefined || marques.__NA) {
    return "routeur Next";
  }
  return "";
}

function origineDeLaPile(): string {
  const pile = new Error().stack ?? "";
  //  Les deux premières lignes sont « Error » et cette fonction-ci.
  for (const ligne of pile.split("\n").slice(2)) {
    /*  On saute nos propres enveloppes : sans cela, la première ligne
        de pile serait TOUJOURS `history.back`, c'est-à-dire nous. */
    if (
      /journal-historique|origineDeL|noter|history\.(back|pushState|replaceState)/.test(
        ligne
      )
    ) {
      continue;
    }
    const fichier = /\/src\/([^\s():]+?\.tsx?)/.exec(ligne);
    if (fichier) return fichier[1];
    if (/next[/\\]dist|next-client|app-router|react-server-dom/.test(ligne)) {
      return "routeur Next";
    }
    const brut = ligne
      .trim()
      .replace(/^at\s+/, "")
      .replace(/https?:\/\/[^/]+/, "");
    if (brut) return brut.slice(0, 60);
  }
  return "origine inconnue";
}

function origineDeLAppel(etat?: unknown): string {
  return origineDeLEtat(etat) || origineDeLaPile();
}

function noter(quoi: string, qui: string): void {
  relire();
  const maintenant = new Date();
  const t =
    `${String(maintenant.getHours()).padStart(2, "0")}:` +
    `${String(maintenant.getMinutes()).padStart(2, "0")}:` +
    `${String(maintenant.getSeconds()).padStart(2, "0")}.` +
    `${String(maintenant.getMilliseconds()).padStart(3, "0")}`;
  lignes = [
    ...lignes,
    {
      n: (lignes[lignes.length - 1]?.n ?? 0) + 1,
      t,
      quoi,
      ou: location.pathname + location.search + location.hash,
      qui,
      pile: history.length,
    },
  ].slice(-MAXIMUM);
  ecrire();
  for (const abonne of abonnes) abonne();
}

/* ==================================================================
 * L'ARMEMENT — et son démontage complet
 * ================================================================== */

let desarmer: (() => void) | null = null;

export function armerLeJournalDHistorique(): () => void {
  if (typeof window === "undefined") return () => {};
  //  Une seule enveloppe, même si le composant se remonte.
  if (desarmer) return desarmer;

  const pushOriginal = history.pushState.bind(history);
  const replaceOriginal = history.replaceState.bind(history);
  const backOriginal = history.back.bind(history);

  history.pushState = function (...args: Parameters<History["pushState"]>) {
    const qui = origineDeLAppel(args[0]);
    const valeur = pushOriginal(...args);
    noter("POSÉE", qui);
    return valeur;
  };
  history.replaceState = function (
    ...args: Parameters<History["replaceState"]>
  ) {
    const qui = origineDeLAppel(args[0]);
    const valeur = replaceOriginal(...args);
    noter("REMPLACÉE", qui);
    return valeur;
  };
  history.back = function () {
    //  ⚠️ ICI L'ÉTAT NE DIT RIEN — un recul n'en porte aucun. C'est le
    //  seul cas où la pile d'appel reste le meilleur indice disponible,
    //  et c'est aussi le geste qu'il importe le plus de tracer : le
    //  propriétaire cherche QUI dépile.
    const qui = origineDeLAppel();
    noter("REPRISE (history.back)", qui);
    return backOriginal();
  };

  const auPopstate = () => noter("RETOUR / AVANT (popstate)", "navigateur");
  //  ⚠️ `pagehide` ET NON `beforeunload` : iOS ne déclenche pas
  //  fidèlement le second, et `beforeunload` peut retenir la page. Le
  //  journal est déjà écrit à chaque ligne — celle-ci ne fait que
  //  MARQUER l'endroit où l'on est sorti.
  const auDepart = () => noter("DÉPART DU SITE (pagehide)", "navigateur");
  window.addEventListener("popstate", auPopstate, { passive: true });
  window.addEventListener("pagehide", auDepart, { passive: true });

  noter("ARRIVÉE SUR LA PAGE", "sonde");

  desarmer = () => {
    history.pushState = pushOriginal;
    history.replaceState = replaceOriginal;
    history.back = backOriginal;
    window.removeEventListener("popstate", auPopstate);
    window.removeEventListener("pagehide", auDepart);
    desarmer = null;
  };
  return desarmer;
}
