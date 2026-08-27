"use client";

import { souscrireAdresse } from "@/lib/adresse-courante";

/**
 * ██ §1 (nº 679) — LA MESURE DE VITESSE, SANS CHRONOMÈTRE INVENTÉ ██
 * ==================================================================
 * CE QUE CE MODULE FAIT, ET SURTOUT CE QU'IL NE FAIT PAS. Il ne pose
 * AUCUN chronomètre dans le site : pas une ligne de code de page n'est
 * touchée, pas un `Date.now()` semé dans un composant. Il LIT ce que le
 * navigateur mesure déjà, et qu'il tient de toute façon, qu'on le lise
 * ou non :
 *  · `PerformanceNavigationTiming` — le chargement d'un DOCUMENT,
 *    découpé par le navigateur lui-même : recherche du nom, connexion,
 *    ATTENTE DU SERVEUR (`responseStart − requestStart`), transfert,
 *    puis construction et peinture ;
 *  · `PerformanceResourceTiming` — chaque requête, avec son départ, sa
 *    durée, et son `serverTiming` quand le serveur en pose un ;
 *  · les entrées `paint` — le premier pixel peint.
 * C'est la consigne du propriétaire au point 5, et c'est aussi la seule
 * façon d'avoir une sonde qui ne coûte RIEN quand elle est éteinte :
 * une lecture après coup ne ralentit pas ce qu'elle mesure.
 *
 * ⚠️ ÉTEINTE, ELLE NE FAIT RIEN DU TOUT. Ce module n'installe son
 * observateur que si `armer()` est appelé — et c'est la sonde qui
 * l'appelle, seulement quand l'adresse porte `?sonde-vitesse=1`. Sans
 * cela, pas un écouteur, pas un tableau, pas une milliseconde. C'est la
 * règle de la boîte noire (nº 654), appliquée à un instrument qui, lui,
 * n'a aucune raison de tourner en permanence.
 *
 * ⚠️ DEUX SORTES DE NAVIGATION, ET ELLES NE SE MESURENT PAS PAREIL :
 *  · UN DOCUMENT NEUF (arrivée, F5, lien natif) : tout est dans
 *    `navigation`, et le navigateur a déjà fait le découpage ;
 *  · UNE NAVIGATION DOUCE (un `<Link>` du site) : le navigateur ne la
 *    voit PAS comme une navigation — aucun document ne change. On la
 *    chronomètre donc du CLIC, et l'on rassemble les requêtes parties
 *    dans l'intervalle. C'est la seule mesure « fabriquée » du module,
 *    et elle l'est parce qu'aucune autre n'existe.
 *
 * ⚠️ ET C'EST LÀ QU'UNE SONDE NAÏVE MENT. Le premier essai de cette
 * passe fermait la mesure d'une navigation douce à la PREMIÈRE PEINTURE
 * qui suit le changement d'adresse. Au banc, l'ouverture d'un portfolio
 * affichait alors 68 ms — pendant que la nº 678 mesurait ~750 ms sur le
 * même chemin. Les deux chiffres étaient justes et ne parlaient pas de
 * la même chose : la page PEINT une coquille vide en 68 ms, puis passe
 * trois quarts de seconde à charger ses six lectures. Une sonde qui
 * annonce 68 ms pour cette page-là est pire qu'aucune sonde.
 *
 * D'OÙ DEUX CHIFFRES, ET NON UN : le PREMIER ÉCRAN (la peinture) et le
 * TOTAL (quand le réseau se tait, `SILENCE_MS` sans nouvelle requête).
 * C'est le second qui compte pour juger d'une lenteur, et c'est lui qui
 * embrasse la cascade de lectures — donc la ligne BASE avec elle. La
 * mesure paraît d'abord marquée « en cours », puis se complète : mieux
 * vaut un panneau qui se remplit sous les yeux qu'un panneau muet.
 */

/** Une navigation mesurée, prête à lire. */
export type MesureVitesse = {
  /** L'adresse d'arrivée. */
  adresse: string;
  /** « document » ou « douce ». */
  genre: string;
  /** Du geste à l'affichage, en millisecondes. Pour une navigation
      douce, c'est le moment où le RÉSEAU SE TAIT — voir plus bas. */
  total: number;
  /** LE PREMIER ÉCRAN : la première peinture de la nouvelle page,
      souvent une coquille encore vide. C'est LUI qu'explique la
      décomposition ci-dessous, et non le total. */
  premierEcran: number;
  /** Vrai tant que le réseau n'a pas fini de se taire. */
  enCours: boolean;
  /** La décomposition, en millisecondes. Ce qui n'est pas mesurable
      pour ce genre de navigation vaut `null`. */
  reseau: number | null;
  serveur: number | null;
  rendu: number | null;
  /** L'ATTENTE RÉSEAU d'une navigation douce : de la première requête
      partie à la dernière revenue. Le reste du total est du rendu. */
  attente: number | null;
  /** LES LECTURES DE BASE de l'intervalle. C'est LA ligne qui décide
      d'un gain : six lectures qui s'attendent coûtent six fois la
      latence, les mêmes en parallèle n'en coûtent qu'une (nº 678). */
  base: {
    nombre: number;
    /** La somme des durées. */
    cumul: number;
    /** De la première partie à la dernière revenue. */
    etendue: number;
    /**
     * LE VERDICT, EN TROIS CAS ET NON DEUX — le banc a montré pourquoi.
     * Il a d'abord sorti « 2 lectures · 256 ms cumulés sur 1259 ms →
     * EN SÉRIE » : faux. Deux lectures séparées par une seconde de rien
     * ne s'attendent pas, elles appartiennent à deux moments de la
     * page. Le critère de la nº 678 (cumul contre étendue) ne valait
     * que pour une CASCADE, c'est-à-dire des lectures accolées.
     *  · « parallele » — elles se chevauchent : déjà groupées ;
     *  · « serie » — accolées bout à bout : LÀ il y a un gain à
     *    prendre, une latence par lecture (la leçon de la nº 678) ;
     *  · « espacees » — trop éloignées pour former une cascade ;
     *  · `null` — une seule lecture, qui ne peut attendre personne.
     */
    verdict: "parallele" | "serie" | "espacees" | null;
  } | null;
  /** Les requêtes de l'intervalle. */
  requetes: { nom: string; duree: number; serveur: number | null }[];
};

let arme = false;
let mesures: MesureVitesse[] = [];
const abonnes = new Set<() => void>();
/** Le repère du dernier clic : c'est lui qui date une navigation douce. */
let dernierClic = 0;
let observateur: PerformanceObserver | null = null;
/** Les requêtes vues depuis le dernier clic. */
let requetesRecentes: PerformanceResourceTiming[] = [];
/** Quand la dernière requête est revenue : c'est ce qui dit que le
    réseau se tait. */
let dernierArrivage = 0;

/** Le silence réseau qui clôt une navigation douce, et le garde-fou qui
    l'arrête si le site babille sans fin (sondage, flux, image lente). */
const SILENCE_MS = 500;
const ATTENTE_MAX_MS = 8000;

function prevenir() {
  abonnes.forEach((rappel) => rappel());
}

/** Le nom court d'une requête : ce qu'on lit dans un relevé. */
function nomCourt(url: string): string {
  try {
    const adresse = new URL(url);
    if (adresse.pathname.includes("/rest/v1/")) {
      return `base · ${adresse.pathname.split("/rest/v1/")[1]}`;
    }
    if (adresse.pathname.includes("/auth/v1/")) {
      return `session · ${adresse.pathname.split("/auth/v1/")[1]}`;
    }
    if (adresse.searchParams.has("_rsc")) {
      /*  ⚠️ PRÉCHARGEMENT OU VRAIE PAGE ? Next demande le même genre de
          réponse pour les deux, et le banc a sorti « page ·
          /mentions-legales » au milieu du relevé d'un portfolio : de
          quoi croire que le portfolio charge les mentions légales. Il
          n'en est rien — c'est le pied de page qui prend de l'avance
          sur ses liens. Le départage tient en une comparaison : si le
          chemin demandé n'est PAS celui où l'on est, on ne l'affiche
          pas, on le précharge. */
      const ici = window.location.pathname;
      return adresse.pathname === ici
        ? `page · ${adresse.pathname}`
        : `préchargement · ${adresse.pathname}`;
    }
    if (adresse.pathname.startsWith("/api/")) return `api · ${adresse.pathname}`;
    if (adresse.pathname.includes("/_next/static/")) return "programme";
    return adresse.pathname.slice(-40);
  } catch {
    return url.slice(-40);
  }
}

/**
 * LA DURÉE QUE LE SERVEUR DÉCLARE, s'il en déclare une. Next ne pose
 * pas d'en-tête `Server-Timing` par défaut et nous n'en ajoutons pas :
 * toucher aux routes pour instrumenter serait changer le site, ce que
 * cette passe s'interdit. La colonne existe donc pour le jour où un
 * serveur en poserait un — et elle reste vide en attendant, ce qui est
 * une information en soi.
 */
function serveurDeclare(entree: PerformanceResourceTiming): number | null {
  const liste = (entree as unknown as {
    serverTiming?: { name: string; duration: number }[];
  }).serverTiming;
  if (!Array.isArray(liste) || liste.length === 0) return null;
  const total = liste.reduce((somme, e) => somme + (e.duration || 0), 0);
  return total > 0 ? Math.round(total) : null;
}

/** Les requêtes brutes d'un intervalle. */
function brutesDe(debut: number, fin: number) {
  return requetesRecentes
    .filter((e) => e.startTime >= debut - 50 && e.startTime <= fin + 50)
    .filter((e) => e.duration > 0);
}

/**
 * L'ÉTENDUE D'UN GROUPE DE REQUÊTES, BORNÉE À L'INTERVALLE : de la
 * première partie à la dernière revenue, sans jamais déborder de
 * [`debut`, `fin`]. Le débordement est réel — une requête peut avoir
 * commencé avant le clic (préchargement) ou finir après la clôture —
 * et il produisait des parts plus grandes que le tout.
 */
function etendueBornee(
  entrees: PerformanceResourceTiming[],
  debut: number,
  fin: number
): number {
  if (entrees.length === 0) return 0;
  const debuts = entrees.map((e) => Math.max(e.startTime, debut));
  const fins = entrees.map((e) => Math.min(e.startTime + e.duration, fin));
  return Math.max(0, Math.round(Math.max(...fins) - Math.min(...debuts)));
}

/**
 * Les requêtes d'un intervalle, les plus lentes d'abord.
 *
 * ⚠️ LES MORCEAUX DU PROGRAMME SONT REGROUPÉS EN UNE LIGNE. Un
 * chargement de document en tire une douzaine, tous de durée voisine :
 * listés un par un, ils remplissent les huit lignes du relevé et
 * chassent les seules qui apprennent quelque chose — les lectures de
 * base. Leur nom (un hachage) n'aide personne ; leur nombre et leur
 * durée, si.
 */
function requetesDe(debut: number, fin: number) {
  const brutes = brutesDe(debut, fin);
  const programme = brutes.filter((e) => nomCourt(e.name) === "programme");
  const autres = brutes.filter((e) => nomCourt(e.name) !== "programme");
  const lignes = autres.map((e) => ({
    nom: nomCourt(e.name),
    duree: Math.round(e.duration),
    serveur: serveurDeclare(e),
  }));
  if (programme.length > 0) {
    lignes.push({
      nom: `programme · ${programme.length} fichier${programme.length > 1 ? "s" : ""}`,
      duree: Math.round(Math.max(...programme.map((e) => e.duration))),
      serveur: null,
    });
  }
  return lignes.sort((a, b) => b.duree - a.duree).slice(0, 8);
}

/**
 * LE VERDICT, à partir du cumul et de l'étendue (voir le type). Le
 * rapport des deux dit tout : au-dessus de 1, les lectures se
 * chevauchent ; autour de 1, elles sont accolées ; bien en dessous,
 * elles sont dispersées et ne forment pas une cascade.
 */
function verdictDesLectures(
  nombre: number,
  cumul: number,
  etendue: number
): NonNullable<MesureVitesse["base"]>["verdict"] {
  if (nombre < 2 || etendue <= 0) return null;
  const rapport = cumul / etendue;
  if (rapport >= 1.15) return "parallele";
  if (rapport >= 0.85) return "serie";
  return "espacees";
}

/** LES LECTURES DE BASE de l'intervalle : le compte, le cumul, et la
    question qui décide — s'attendent-elles ? */
function baseDe(debut: number, fin: number): MesureVitesse["base"] {
  const lectures = brutesDe(debut, fin).filter((e) =>
    nomCourt(e.name).startsWith("base ·")
  );
  if (lectures.length === 0) return null;
  const cumul = lectures.reduce((somme, e) => somme + e.duration, 0);
  const etendue = etendueBornee(lectures, debut, fin);
  return {
    nombre: lectures.length,
    cumul: Math.round(cumul),
    etendue,
    verdict: verdictDesLectures(lectures.length, cumul, etendue),
  };
}

/**
 * LE CHARGEMENT DU DOCUMENT, tel que le navigateur l'a découpé.
 *
 * ⚠️ LE PREMIER ÉCRAN ET LE TOTAL SONT DEUX CHOSES ICI AUSSI, et pour
 * la même raison que pour une navigation douce (voir l'entête). Le
 * premier essai arrêtait la liste des requêtes à `domContentLoaded` :
 * sur `/devenir-tatoueur/fiche`, les TROIS lectures de base du
 * formulaire partent APRÈS la peinture, et la ligne BASE restait vide
 * sur la page même qui en avait le plus besoin. La décomposition du
 * navigateur (réseau + serveur + rendu) explique le PREMIER ÉCRAN et
 * s'y additionne exactement ; le TOTAL va, lui, jusqu'au silence.
 */
function mesureDuDocument(fin: number, enCours: boolean): MesureVitesse | null {
  const [entree] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];
  if (!entree) return null;
  const peinture = performance
    .getEntriesByType("paint")
    .find((p) => p.name === "first-contentful-paint");
  const premierEcran = Math.round(
    peinture?.startTime ?? entree.domContentLoadedEventEnd
  );
  return {
    adresse: window.location.pathname + window.location.search,
    genre: "document",
    total: Math.max(premierEcran, Math.round(fin)),
    premierEcran,
    enCours,
    //  Ce qui précède la première réponse : nom, connexion, envoi.
    reseau: Math.round(entree.requestStart - entree.startTime),
    //  L'ATTENTE DU SERVEUR : il a reçu la demande, il n'a pas encore
    //  répondu. C'est le rendu serveur, transfert non compris.
    serveur: Math.round(entree.responseStart - entree.requestStart),
    //  De la réponse à ce qu'on voit.
    rendu: Math.round(premierEcran - entree.responseStart),
    //  Le navigateur a déjà découpé ce chargement : l'attente réseau
    //  n'apporterait rien de plus que `reseau` + `serveur`.
    attente: null,
    base: baseDe(0, fin),
    requetes: requetesDe(0, fin),
  };
}

/**
 * ARMER LA SONDE — appelé par elle seule, quand l'adresse le demande.
 * Idempotent : deux appels n'installent qu'un observateur.
 */
export function armerLaVitesse(): void {
  if (arme || typeof window === "undefined") return;
  arme = true;

  //  LE DOCUMENT : posé dès que ses chiffres sont complets, puis
  //  complété quand le réseau se tait — comme une navigation douce.
  window.setTimeout(() => {
    const mesure = mesureDuDocument(performance.now(), true);
    if (!mesure) return;
    const rang = mesures.length;
    mesures = [...mesures, mesure];
    prevenir();
    attendreLeSilence(rang, 0, (fin) => mesureDuDocument(fin, false));
  }, 300);

  try {
    observateur = new PerformanceObserver((liste) => {
      for (const entree of liste.getEntries()) {
        requetesRecentes.push(entree as PerformanceResourceTiming);
        //  La FIN de la requête, pas l'instant où l'observateur nous
        //  réveille : c'est elle qui date le silence.
        const finie = entree.startTime + entree.duration;
        if (finie > dernierArrivage) dernierArrivage = finie;
      }
      //  On ne garde que ce qui peut encore servir : les requêtes de la
      //  navigation en cours, et pas l'histoire de la page entière.
      if (requetesRecentes.length > 300) {
        requetesRecentes = requetesRecentes.slice(-200);
      }
    });
    observateur.observe({ type: "resource", buffered: true });
  } catch {
    //  Navigateur sans `PerformanceObserver` : la sonde se tait sur les
    //  requêtes plutôt que de mentir. Le document reste mesuré.
  }

  //  LE CLIC : c'est lui qui date une navigation douce.
  document.addEventListener(
    "click",
    (evenement) => {
      const cible = evenement.target;
      if (cible instanceof Element && cible.closest("a[href], button")) {
        dernierClic = performance.now();
      }
    },
    true
  );

  /*  LE CHANGEMENT D'ADRESSE ouvre la mesure d'une navigation douce. On
      attend DEUX images : la première peint le nouvel écran, la seconde
      garantit qu'elle est passée. C'est la même prudence que la
      réécriture d'adresse de la nº 349 — on ne mesure pas une peinture
      qui n'a pas eu lieu. */
  souscrireAdresse(() => {
    if (!dernierClic) return;
    const depart = dernierClic;
    dernierClic = 0;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const premierEcran = Math.round(performance.now() - depart);
        const adresse = window.location.pathname + window.location.search;
        //  Le rang de CETTE mesure : c'est lui qu'on complétera quand le
        //  réseau se taira, sans risquer d'écraser une mesure voisine.
        const rang = mesures.length;
        mesures = [
          ...mesures,
          composerLaDouce(adresse, depart, performance.now(), premierEcran, true),
        ];
        prevenir();
        attendreLeSilence(rang, depart, (fin) =>
          composerLaDouce(
            adresse,
            depart,
            //  Jamais plus court que la peinture : une page sans la
            //  moindre requête ne doit pas afficher un total nul.
            Math.max(fin, depart + premierEcran),
            premierEcran,
            false
          )
        );
      })
    );
  });
}

/** Une mesure de navigation douce, à l'instant `fin`. */
function composerLaDouce(
  adresse: string,
  depart: number,
  fin: number,
  premierEcran: number,
  enCours: boolean
): MesureVitesse {
  /*  L'ATTENTE RÉSEAU : de la première requête partie à la dernière
      revenue. Ce n'est pas le découpage du navigateur — il n'en fournit
      aucun ici — mais c'est mesuré, pas deviné, et cela répond à la
      seule question qui compte : a-t-on attendu le réseau, ou a-t-on
      peiné à peindre ? Le reste du total est du rendu. */
  const total = Math.round(fin - depart);
  /*  ⚠️ BORNÉ À L'INTERVALLE, et ce n'est pas un détail de coquetterie :
      `brutesDe` accepte une requête partie jusqu'à 50 ms AVANT le clic
      (le préchargement d'un lien survolé), si bien que l'étendue brute
      pouvait dépasser le total — le banc a sorti « attente réseau 682 »
      sous un « TOTAL 681 », donc un rendu négatif ramené à zéro. Une
      part ne peut pas être plus grande que le tout. */
  const attente = etendueBornee(brutesDe(depart, fin), depart, fin);
  return {
    adresse,
    genre: "douce",
    total,
    premierEcran,
    enCours,
    //  Aucun document n'a changé : ni recherche du nom, ni attente d'un
    //  rendu serveur que le navigateur sache voir.
    reseau: null,
    serveur: null,
    rendu: Math.max(0, total - attente),
    attente,
    base: baseDe(depart, fin),
    requetes: requetesDe(depart, fin),
  };
}

/**
 * ATTENDRE QUE LE RÉSEAU SE TAISE, puis clore la mesure. C'est ce qui
 * fait la différence entre « la coquille est peinte » et « la page est
 * prête » — la cascade de lectures d'un portfolio vit tout entière
 * dans cet intervalle-là (voir l'entête).
 */
function attendreLeSilence(
  rang: number,
  depart: number,
  composer: (fin: number) => MesureVitesse | null
): void {
  const butoir = performance.now() + ATTENTE_MAX_MS;
  const battement = window.setInterval(() => {
    const maintenant = performance.now();
    const calme = maintenant - Math.max(dernierArrivage, depart) >= SILENCE_MS;
    if (!calme && maintenant < butoir) return;
    window.clearInterval(battement);
    //  On clôt À LA DERNIÈRE REQUÊTE REVENUE, pas à l'instant du
    //  réveil : le silence qu'on a attendu ne fait pas partie du temps
    //  de chargement, et l'y compter gonflerait chaque mesure de
    //  `SILENCE_MS`.
    const close = composer(Math.max(dernierArrivage, depart));
    if (!close) return;
    mesures = mesures.map((m, i) => (i === rang ? close : m));
    prevenir();
  }, 100);
}

export function mesuresDeVitesse(): MesureVitesse[] {
  return mesures;
}

export function viderLesMesures(): void {
  mesures = [];
  requetesRecentes = [];
  prevenir();
}

export function sAbonnerALaVitesse(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

/** Le verdict en toutes lettres, pour le relevé copié. */
const MOT_DU_VERDICT: Record<string, string> = {
  parallele: " → EN PARALLÈLE (déjà groupées)",
  serie: " → EN SÉRIE (elles s'attendent)",
  espacees: " → espacées (pas une cascade)",
  aucun: "",
};

/** LE RELEVÉ, en texte — c'est ce que le bouton « Copier » envoie. */
export function releveDeVitesse(): string {
  if (mesures.length === 0) return "(aucune mesure)";
  return mesures
    .map((m) => {
      const tete =
        `${m.genre.toUpperCase()} · ${m.adresse}\n` +
        `  TOTAL ${m.total} ms` +
        (m.attente !== null
          ? ` = attente réseau ${m.attente} + rendu ${m.rendu}`
          : "") +
        (m.enCours ? " (en cours…)" : " (jusqu'au silence du réseau)") +
        `\n  PREMIER ÉCRAN ${m.premierEcran} ms` +
        (m.reseau !== null
          ? ` = réseau ${m.reseau} + serveur ${m.serveur} + rendu ${m.rendu}`
          : "");
      const base = m.base
        ? [
            `  BASE ${m.base.nombre} lecture${m.base.nombre > 1 ? "s" : ""} · ` +
              `${m.base.cumul} ms cumulés sur ${m.base.etendue} ms` +
              MOT_DU_VERDICT[m.base.verdict ?? "aucun"],
          ]
        : [];
      const lignes = m.requetes.map(
        (r) =>
          `    ${String(r.duree).padStart(5)} ms  ${r.nom}` +
          (r.serveur !== null ? `  [serveur ${r.serveur} ms]` : "")
      );
      return [tete, ...base, ...lignes].join("\n");
    })
    .join("\n\n");
}
