/*  §2 (nº 343) — PAS DE DIRECTIVE « use client » ICI, ET C'EST VOULU.
    Ce module ne rend rien : ce sont des fonctions pures qui ne touchent
    au navigateur qu'AU MOMENT OÙ ON LES APPELLE. Or le script d'avant
    peinture est fabriqué PAR LE SERVEUR, et il a besoin de
    `amorceDuJournalPourLeScript` : avec la directive, Next refuse
    l'appel (« Attempted to call … from the server but it is on the
    client »), mesuré. Les composants clients qui l'importent
    continuent de fonctionner à l'identique — la directive n'est pas
    requise pour être importé par eux. */
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
 * l'accumulation.
 * §5 (nº 343) — ET IL SURVIT MAINTENANT AU CHANGEMENT D'ONGLET. Il
 * vivait dans la mémoire de L'ONGLET (`sessionStorage`) ; il vit
 * désormais dans la mémoire LOCALE. La raison est la même que celle de
 * l'armement durable : le défaut poursuivi ne se produit qu'en
 * PREMIÈRE ENTRÉE D'UN ONGLET NEUF, et un journal d'onglet y
 * repartirait vide à chaque essai. Le bouton « VIDER » reste le seul
 * moyen de l'effacer, et il est à portée de doigt.
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
 * ⚠️ IL NE S'ARME QUE SUR DEMANDE, et l'armement a UNE SEULE écriture
 * depuis la nº 343 (lib/sondes-armees) : sans lui, rien n'est
 * enveloppé, rien n'est écouté, rien n'est écrit.
 *
 * §2 (nº 343) — ET IL COMMENCE AVANT TOUT CODE D'APPLICATION. Les
 * enveloppes sont posées par le SCRIPT D'AVANT PEINTURE, à partir du
 * texte que ce module lui rend (`amorceDuJournalPourLeScript`) : les
 * toutes premières entrées d'historique — celles qui expulsent du
 * site — sont donc enregistrées. Quand ce module démarre, il RECONNAÎT
 * les enveloppes déjà posées et ne les double pas.
 *
 * ⚠️ TEMPORAIRE — inscrit au bandeau des chantiers ouverts
 * (lib/navigation-session), à retirer avant la mise en ligne.
 */

//  §A et §B (nº 347) — le dépôt du verdict du filet et le relevé du
//  bas vivent dans lib/bas-de-la-pile ; ce module ne fait que les
//  LIRE et les verser dans le journal. Sens unique : bas-de-la-pile
//  n'importe jamais ce module.
import {
  lireLeBasDeLaPile,
  lireLeVerdict,
  marquerLeVerdictVerse,
} from "@/lib/bas-de-la-pile";

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

export const CLE_JOURNAL = "roswel:journal-historique";
const CLE = CLE_JOURNAL;
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
    const brut = localStorage.getItem(CLE);
    if (brut) lignes = JSON.parse(brut) as LigneHistorique[];
  } catch {
    lignes = [];
  }
}

function ecrire(): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(lignes));
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

/**
 * ██ UNE LIGNE ÉCRITE PAR LE SITE, ET NON PAR UNE ENVELOPPE (nº 346) ██
 * ==================================================================
 * Le propriétaire a demandé UNE ligne à l'arrivée qui dise ce qui a
 * décidé le filet du retour. Ce module tient déjà le journal ; c'est
 * donc lui qui l'écrit, et personne d'autre.
 *
 * ⚠️ LE TYPE D'ÉVÉNEMENT EST UN TYPE EXISTANT, à la demande du
 * propriétaire : « ARRIVÉE SUR LA PAGE », celui qu'il voit déjà
 * fonctionner. Tout le détail tient dans la colonne « par … ». Aucune
 * sonde n'est modifiée, et le panneau n'a rien de nouveau à savoir.
 *
 * ⚠️ RIEN N'EST ÉCRIT SI LE JOURNAL N'EST PAS OUVERT. Deux témoins,
 * parce qu'un seul ne suffit pas : la marque d'armement sur <html>
 * (posée par le script d'avant peinture) OU la présence du journal
 * lui-même. Le relevé en ligne du propriétaire montre que ce script
 * n'exécute pas toujours tous ses blocs ; s'en remettre à la seule
 * marque, c'était risquer de n'avoir aucune ligne le jour où l'on en a
 * besoin. Sondes désarmées et journal absent : une lecture, rien de
 * plus — aucune écriture.
 *
 * §A (nº 347) — ELLE RÉPOND désormais si la ligne a été écrite : c'est
 * ce qui permet au filet de savoir si son verdict a été ENTENDU, ou
 * s'il ne vit que dans son dépôt (lib/bas-de-la-pile) en attendant
 * l'ouverture du journal.
 */
export function noterDansLeJournal(quoi: string, qui: string): boolean {
  if (typeof window === "undefined") return false;
  let ouvert = false;
  try {
    ouvert =
      (document.documentElement.dataset.sondes ?? "").includes("historique") ||
      localStorage.getItem(CLE) !== null;
  } catch {
    return false;
  }
  if (!ouvert) return false;
  noter(quoi, qui);
  return true;
}

/**
 * ██ §B (nº 347) — LES TRACES D'AVANT PEINTURE, EN UNE LIGNE ██
 * ==================================================================
 * Deux passes de suite, des blocs du script d'avant peinture ont
 * semblé ne jamais tourner sur le téléphone du propriétaire alors
 * qu'ils tournent ici. Cette fonction relève ce que chacun LAISSE
 * COMME TRACE quand il tourne, pour que le prochain relevé dise
 * lesquels ont réellement tourné là-bas :
 *  · le MILLÉSIME du script (`data-version-script`, posé en tête du
 *    script — absent = HTML PÉRIMÉ servi par un cache) ;
 *  · l'ARMEMENT (la marque des sondes sur <html>) ;
 *  · l'AMORCE du journal (la marque sur `window`) ;
 *  · le RELEVÉ du bas, et QUI l'a pris (« avant peinture » ou
 *    « secours ») — lib/bas-de-la-pile.
 */
export function tracesAvantPeinture(): string {
  if (typeof window === "undefined") return "";
  const racine = document.documentElement;
  const version =
    racine.dataset.versionScript ??
    "AUCUN — HTML d'avant la nº 347, page servie PÉRIMÉE";
  const armement = racine.dataset.sondes ? "oui" : "NON";
  const amorce = (window as unknown as Record<string, unknown>)[MARQUE_AMORCE]
    ? "oui"
    : "NON";
  const bas = lireLeBasDeLaPile();
  const releve = bas ? `oui [${bas.origine}]` : "AUCUN";
  return (
    `script nº ${version} · armement ${armement} · amorce ${amorce}` +
    ` · relevé du bas ${releve}`
  );
}

/**
 * ██ §A (nº 347) — LE VERDICT DU FILET NE PEUT PLUS ÊTRE INVISIBLE ██
 * ==================================================================
 * À l'ouverture du journal, TROIS issues, et chacune est une ligne :
 *  1. un verdict déposé que le journal n'a pas encore entendu (il a
 *     été pris quand le journal n'était pas là) → il est VERSÉ, avec
 *     l'adresse où il avait été pris ;
 *  2. un verdict arrive pour CE document dans la foulée (le filet
 *     décide quelques instants après l'ouverture — c'est l'ordre
 *     normal des effets) → sa propre ligne suffit, on se tait ;
 *  3. RIEN n'arrive : 1,2 s après l'ouverture, le journal l'écrit
 *     LUI-MÊME — « aucune décision du filet reçue » — avec les traces
 *     d'avant peinture. Le silence du filet devient une ligne lisible :
 *     c'est la demande expresse de la passe nº 347, pour que la
 *     prochaine lecture tranche quelle que soit la branche.
 */
function verserLeVerdictALOuverture(): void {
  const depose = lireLeVerdict();
  if (depose && !depose.verse) {
    noter(
      "ARRIVÉE SUR LA PAGE",
      `${depose.texte} · (décision prise sur ${depose.ou}, versée à l'ouverture du journal)`
    );
    marquerLeVerdictVerse();
  }
  const reference = depose?.quand ?? 0;
  setTimeout(() => {
    const apres = lireLeVerdict();
    //  Une décision est arrivée pour ce document-ci : sa ligne est déjà
    //  dans le journal (le filet écrit lui-même quand le journal est
    //  ouvert, et il l'est — nous sommes son ouverture).
    if (apres && apres.quand !== reference) return;
    noterDansLeJournal(
      "ARRIVÉE SUR LA PAGE",
      `FILET — aucune décision du filet reçue` +
        `${depose ? " pour CE document" : ""}` +
        ` (1,2 s après l'ouverture du journal) · ${tracesAvantPeinture()}`
    );
  }, 1200);
}

/* ==================================================================
 * L'ARMEMENT — et son démontage complet
 * ================================================================== */

let desarmer: (() => void) | null = null;

/** La marque que le script d'avant peinture pose sur `window` quand il
    a DÉJÀ enveloppé `history`. Nommée ici, écrite là-bas. */
export const MARQUE_AMORCE = "__roswelJournalAmorce";

export function armerLeJournalDHistorique(): () => void {
  if (typeof window === "undefined") return () => {};
  //  Une seule enveloppe, même si le composant se remonte.
  if (desarmer) return desarmer;
  /*  §2 (nº 343) — LE SCRIPT D'AVANT PEINTURE A PU ARMER AVANT NOUS.
      Il enveloppe `history` dès la première ligne du document, pour
      que les toutes premières entrées soient enregistrées. Poser une
      SECONDE enveloppe par-dessus doublerait chaque ligne. On prend
      acte, on note notre arrivée, et on ne touche à rien. */
  if ((window as unknown as Record<string, unknown>)[MARQUE_AMORCE]) {
    noter("ARRIVÉE SUR LA PAGE", "sonde (enveloppes déjà posées)");
    //  §A (nº 347) — l'ouverture du journal verse le verdict du filet,
    //  ou écrit son absence : sur les DEUX chemins d'armement.
    verserLeVerdictALOuverture();
    desarmer = () => {
      desarmer = null;
    };
    return desarmer;
  }

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
  //  §A (nº 347) — même chose quand c'est le module qui pose les
  //  enveloppes : le verdict du filet ne peut plus être invisible.
  verserLeVerdictALOuverture();

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

/* ==================================================================
 * §2 (nº 343) — L'AMORCE, POUR LE SCRIPT D'AVANT PEINTURE
 * ================================================================== */

/**
 * LE JOURNAL COMMENCE AVANT TOUT CODE D'APPLICATION.
 * ------------------------------------------------------------------
 * CE QUI MANQUAIT. Ce module ne s'arme qu'à l'hydratation. Or le
 * défaut poursuivi par le propriétaire se joue dans les TOUTES
 * PREMIÈRES entrées d'historique d'un onglet neuf — celles qui sont
 * posées avant, ou pendant, le démarrage de React. Elles n'étaient
 * donc jamais enregistrées.
 *
 * Ce texte-ci est exécuté par le script d'avant peinture. Il pose les
 * mêmes enveloppes, écrit dans le MÊME journal, au MÊME format, et
 * marque `window` pour que le module ne les double pas quand il
 * démarre. Ce n'est pas une copie : c'est ce module qui le fabrique,
 * à partir de ses propres constantes.
 *
 * ⚠️ IL N'EST INCLUS QUE SI LA SONDE DE L'HISTORIQUE EST ARMÉE — le
 * script vérifie la marque avant de l'exécuter.
 *
 * ⚠️ IL N'AJOUTE AUCUNE ENTRÉE D'HISTORIQUE, n'écoute qu'en PASSIF, et
 * appelle toujours l'implémentation d'origine avant de noter.
 */
export function amorceDuJournalPourLeScript(): string {
  const cle = JSON.stringify(CLE_JOURNAL);
  const marque = JSON.stringify(MARQUE_AMORCE);
  const maximum = String(MAXIMUM);
  return `(function(){
if(window[${marque}])return;window[${marque}]=1;
var lire=function(){try{return JSON.parse(localStorage.getItem(${cle})||"[]")}catch(e){return[]}};
var noter=function(quoi,qui){try{
var l=lire();var d=new Date();
var deux=function(v){return String(v).padStart(2,"0")};
l.push({n:(l.length?l[l.length-1].n:0)+1,
t:deux(d.getHours())+":"+deux(d.getMinutes())+":"+deux(d.getSeconds())+"."+String(d.getMilliseconds()).padStart(3,"0"),
quoi:quoi,ou:location.pathname+location.search+location.hash,qui:qui,pile:history.length});
localStorage.setItem(${cle},JSON.stringify(l.slice(-${maximum})))}catch(e){}};
var pousser=history.pushState.bind(history);
var remplacer=history.replaceState.bind(history);
var reculer=history.back.bind(history);
history.pushState=function(){var v=pousser.apply(history,arguments);noter("POSÉE","avant peinture");return v};
history.replaceState=function(){var v=remplacer.apply(history,arguments);noter("REMPLACÉE","avant peinture");return v};
history.back=function(){noter("REPRISE (history.back)","avant peinture");return reculer()};
addEventListener("popstate",function(){noter("RETOUR / AVANT (popstate)","navigateur")},{passive:true});
addEventListener("pagehide",function(){noter("DÉPART DU SITE (pagehide)","navigateur")},{passive:true});
noter("DOCUMENT OUVERT (avant peinture)","script");
})()`;
}
