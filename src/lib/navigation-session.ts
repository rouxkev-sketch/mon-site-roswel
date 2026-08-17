/**
 * JOURNAL DE NAVIGATION (persistant)
 * ----------------------------------
 * Retient la page en cours et la page précédente VISITÉES DANS LE
 * SITE. Stocké en localStorage : contrairement à la mémoire de
 * session, il survit à l'inactivité, à la mise en veille et à la
 * fermeture de l'application (le retour ne doit JAMAIS « expirer »
 * et renvoyer à l'accueil à la place de la liste). Les entrées de
 * plus de 24 h sont ignorées : au-delà, revenir à l'accueil
 * redevient le comportement naturel.
 * Mis à jour à chaque changement de page par <MemoireNavigation />
 * (posé dans le layout).
 */

/**
 * ██████████████████████████████████████████████████████████████████
 * ██  LA RÈGLE DE NAVIGATION DU SMARTPHONE — ELLE FAIT AUTORITÉ   ██
 * ██████████████████████████████████████████████████████████████████
 *
 * « Décidée par le propriétaire à la passe nº 328, après l'inventaire
 * de la nº 327. Aucune passe future ne doit la contredire : si un
 * écran a besoin d'une exception, elle s'écrit ici, nommée et datée. »
 *
 *  1. Toute surface qui couvre l'écran pose une entrée d'historique,
 *     et le bouton retour la referme.
 *  2. Le retour ne referme qu'une chose à la fois — la dernière
 *     ouverte.
 *  3. Un écran neuf s'ouvre en haut. Un écran où l'on revient se pose
 *     là où on l'avait quitté. C'est le CHEMIN qui décide, jamais
 *     l'écran.
 *  4. La position se lit toujours par la fonction qui sait lire sous
 *     le gel, jamais par la valeur brute.
 *  5. L'état d'un écran vit dans l'adresse, pas dans React.
 *  6. Un lien interne vers un autre portfolio n'affiche pas la photo
 *     en haut. Une arrivée depuis une carte ou un lien de partage
 *     l'affiche.
 *  7. Une fermeture ne consomme une entrée que si elle l'a créée.
 *  8. Le pas en avant rouvre ce que le retour vient de fermer, dans le
 *     même état.
 *
 * ------------------------------------------------------------------
 * POURQUOI ELLE VIT ICI, ET PAS AILLEURS. Ce module portait déjà LA
 * RÈGLE UNIQUE DE RESTITUTION (plus bas, avant `arriveeQuiRestitue`) —
 * c'est-à-dire le point 3 avant qu'il ne soit nommé. La règle entière
 * le rejoint plutôt que de vivre dans un fichier de plus : elle décide
 * de ce que ce module décide déjà.
 *
 * OÙ CHAQUE POINT S'APPLIQUE, POUR QU'AUCUN NE SE PERDE :
 *  · 1 et 2 — `PileFiches`, `FicheTatoueur` (fenêtre de carrousel),
 *    `GrilleTatoueurs`, `PageFavoris`. ⚠️ QUATRE SURFACES NE LE FONT
 *    PAS ENCORE : la feuille du bas des menus, la page de recherche,
 *    le menu « Mon espace » et l'administration (C-4 de l'inventaire).
 *    C'EST LA PASSE SUIVANTE QUI LES TRAITE — ce n'est pas un oubli.
 *  · 3 — `DefilementEnHaut` (l'arrivée, avant la peinture) et
 *    `MemoireNavigation` (la mémorisation, et le filet après).
 *  · 4 — `positionSousLeGel` (lib/gel-du-corps), appelée par TOUS
 *    ceux qui écrivent une position depuis la nº 328-§2.
 *  · 5 — ⚠️ QUATRE ÉTATS N'Y SONT PAS ENCORE : l'onglet Profil /
 *    Portfolio, la consigne « sans photo », la section
 *    d'administration et l'étape du formulaire (C-6). PASSE SUIVANTE.
 *  · 6 — `lib/arrivee-sans-photo` (nº 295).
 *  · 7 — chaque `fermer` du site vérifie qu'il a poussé son entrée.
 *  · 8 — conséquence des points 1 et 5 : une surface qui vit dans
 *    l'historique et dont l'état vit dans l'adresse se rouvre telle
 *    quelle. Tant que le point 5 n'est pas tenu partout, le point 8
 *    ne l'est pas non plus.
 * ██████████████████████████████████████████████████████████████████
 */

import { adresseDeRecherche } from "@/lib/adresse-recherche";

export const CLE_JOURNAL = "roswel:pages-visitees";
const CLE = CLE_JOURNAL;

/** Douze heures × 2 : au-delà, le journal est considéré périmé */
export const AGE_MAXIMUM_MS = 24 * 3600 * 1000;

/**
 * L'ÂGE MAXIMUM D'UNE POSITION DE DÉFILEMENT — TRENTE MINUTES
 * (passe nº 181-§1c)
 * ------------------------------------------------------------------
 * Une position n'est pas une préférence : c'est l'endroit où l'on était
 * il y a un instant. Relevé du propriétaire : une position de 4964 px
 * réclamée après 8646 secondes — près de deux heures et demie. Entre
 * temps la mosaïque avait changé, la page n'avait plus la même hauteur,
 * et la demande ne pouvait qu'échouer.
 * Au-delà d'une demi-heure, on l'oublie : la page s'ouvre en haut,
 * franchement, plutôt que de viser un endroit qui n'existe plus.
 * (Les 24 heures ci-dessus restent celles du JOURNAL des pages
 * visitées et de la reprise de session — deux choses différentes.)
 */
export const AGE_POSITION_MS = 30 * 60 * 1000;

type PagesVisitees = {
  courante: string | null;
  precedente: string | null;
  date: number; // horodatage de la dernière mise à jour
};

function lire(): PagesVisitees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const etat = JSON.parse(brut) as PagesVisitees;
      if (Date.now() - (etat.date ?? 0) <= AGE_MAXIMUM_MS) return etat;
    }
  } catch {
    // stockage indisponible (navigation privée stricte…)
  }
  return { courante: null, precedente: null, date: 0 };
}

/** À chaque page affichée (adresse = chemin + éventuels filtres) */
export function noterPageVisitee(url: string) {
  const etat = lire();
  try {
    if (etat.courante === url) {
      // Rechargement ou re-rendu de la même page : on rafraîchit
      // seulement l'horodatage (la vraie page précédente est gardée)
      localStorage.setItem(CLE, JSON.stringify({ ...etat, date: Date.now() }));
      return;
    }
    localStorage.setItem(
      CLE,
      JSON.stringify({
        courante: url,
        precedente: etat.courante,
        date: Date.now(),
      })
    );
  } catch {
    // tant pis : le bouton retour se rabattra sur l'accueil
  }
}

/** La page du site visitée juste avant celle-ci (null : aucune) */
export function lirePagePrecedente(): string | null {
  return lire().precedente;
}

/** La DERNIÈRE page notée au journal. Au montage d'une nouvelle
    page, elle n'est pas encore remplacée : c'est la page d'où l'on
    VIENT (la liste s'en sert pour reconnaître un retour de fiche,
    même quand tous les autres signaux ont été perdus — PWA iPhone
    relancée, API de performance absente en mode plein écran…). */
export function lirePageCourante(): string | null {
  return lire().courante;
}

/* ------------------------------------------------------------
 * POSITIONS DE DÉFILEMENT (persistantes, par adresse)
 * ------------------------------------------------------------ */

export const PREFIXE_DEFILEMENT = "roswel:defilement:";

/**
 * ⚠️ UNE POSITION APPARTIENT À UNE RECHERCHE PRÉCISE (nº 184-§2).
 * ------------------------------------------------------------------
 * LE DÉFAUT, relevé sur l'iPhone du propriétaire : la position prise
 * dans la mosaïque complète — 10965 px — était réclamée sur une page
 * filtrée qui ne mesure que 1338 px, et la page retombait à 132.
 * La clé passe donc par l'adresse CANONIQUE de la recherche : les
 * critères en font partie, les réglages de sonde n'en font pas partie
 * (voir lib/adresse-recherche, et la même logique en clair dans le
 * script d'avant peinture).
 */
function cleDePosition(url: string): string {
  return `${PREFIXE_DEFILEMENT}${adresseDeRecherche(url)}`;
}

/**
 * L'ÉCART DE LA RÉSERVE DE BARRE — le « cran » du retour (nº 218-§4)
 * ==================================================================
 * LE DÉFAUT : au retour d'une fiche, la mosaïque se replaçait
 * SYSTÉMATIQUEMENT un peu plus haut que la position quittée, dans les
 * deux dispositions.
 *
 * LA CAUSE : sur mobile, la barre a quitté le flux et un bloc
 * invisible tient sa place (`data-reserve-barre`, nº 195-§1a). Ce bloc
 * mesure 128 px rangée de recherche DÉPLIÉE, 64 px REPLIÉE — et il est
 * DANS LE FLUX : tout le contenu descend ou monte de 64 px avec lui.
 * Or on quitte toujours la mosaïque APRÈS avoir défilé, donc rangée
 * repliée (réserve 64), et l'on y revient sur une page neuve, rangée
 * dépliée (réserve 128). Le contenu est alors 64 px plus bas, mais on
 * rendait le `scrollY` brut : l'œil se retrouvait 64 px plus haut dans
 * la liste. Un cran, exactement.
 *
 * LA CORRECTION : la position est rangée dans le repère de la RANGÉE
 * DÉPLIÉE — celui de toute page qui s'ouvre. On ajoute donc, à
 * l'écriture, l'écart entre la réserve dépliée et la réserve du
 * moment. Rien à changer côté lecture : le script d'avant peinture
 * comme `lireDefilement` posent la valeur telle quelle, et elle est
 * juste, parce qu'une page s'ouvre toujours rangée dépliée.
 *
 * ⚠️ DES NOMBRES ANNONCÉS, JAMAIS UNE MESURE : la réserve s'anime sur
 * 300 ms, et `offsetHeight` pris au milieu ne vaut ni 64 ni 128. La
 * barre écrit donc ses deux valeurs en attributs (EnTeteTatouage).
 * ⚠️ ET SUR LE WEB, ZÉRO : la réserve y est `display:none` (la barre
 * est restée dans le flux, en `sticky`). Le seul test qui vaille est
 * celui-là même qui conditionne son affichage — `data-appareil`.
 */
function ecartDeReserveBarre(): number {
  if (typeof document === "undefined") return 0;
  if (document.documentElement.dataset.appareil !== "mobile") return 0;
  const reserve = document.querySelector<HTMLElement>("[data-reserve-barre]");
  if (!reserve) return 0;
  const posee = Number(reserve.dataset.reservePosee);
  const depliee = Number(reserve.dataset.reserveDepliee);
  if (!Number.isFinite(posee) || !Number.isFinite(depliee)) return 0;
  return depliee - posee;
}

/** Mémorise la position de défilement d'une adresse */
export function memoriserDefilement(url: string, y: number) {
  try {
    localStorage.setItem(
      cleDePosition(url),
      JSON.stringify({
        //  Rangée dans le repère de la rangée dépliée (voir ci-dessus).
        y: Math.round(y + ecartDeReserveBarre()),
        date: Date.now(),
      })
    );
  } catch {
    // stockage indisponible : la page reviendra simplement en haut
  }
}

/** La position mémorisée (0 si aucune ou trop ancienne) */
export function lireDefilement(url: string): number {
  try {
    const brut = localStorage.getItem(cleDePosition(url));
    if (!brut) return 0;
    const { y, date } = JSON.parse(brut) as { y: number; date: number };
    //  ⚠️ TRENTE MINUTES, et plus vingt-quatre heures (nº 181-§1c).
    if (Date.now() - (date ?? 0) > AGE_POSITION_MS) return 0;
    return y || 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------
 * LA RÈGLE UNIQUE DE RESTITUTION
 * ------------------------------------------------------------
 * QUELLE QUE SOIT LA FAÇON DONT ON ARRIVE SUR UNE PAGE, SI UNE
 * POSITION A ÉTÉ MÉMORISÉE POUR ELLE, ON LA REND.
 * Une seule exception, et elle est évidente : une navigation NEUVE et
 * VOULUE — un lien touché, une adresse tapée, un favori — ouvre la page
 * en haut. C'est ce que dit le navigateur avec son type « navigate ».
 *
 * TOUT LE RESTE RESTITUE :
 *  · « back_forward » — le retour arrière, MAIS AUSSI LE RETOUR EN
 *    AVANT. La mémoire ne traitait que le premier : revenir en avant
 *    vers une fiche la rouvrait n'importe où (souvent tout en bas, la
 *    position mémorisée étant rabotée par une page pas encore montée à
 *    sa hauteur définitive).
 *  · « reload » — et c'est le cas de la RÉOUVERTURE DU NAVIGATEUR :
 *    quand le système a tué l'application, l'onglet ressuscité se
 *    recharge. On atterrissait systématiquement en haut.
 *  · une demande explicite (`demanderRestaurationPosition`), posée par
 *    la reprise de session quand elle ramène l'utilisateur sur sa page.
 *
 * Le jugement est rendu UNE FOIS par document et gardé : le type de
 * navigation ne change pas en cours de route, et deux composants le
 * consultent (la mémoire de navigation, et la remontée en haut de page
 * qui doit s'effacer devant lui).
 */

let arriveeJugee: boolean | null = null;

export function arriveeQuiRestitue(): boolean {
  if (arriveeJugee === null) {
    try {
      const [navigation] = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      arriveeJugee = (navigation?.type ?? "navigate") !== "navigate";
    } catch {
      arriveeJugee = false; // API absente : on ne restitue pas
    }
  }
  return arriveeJugee;
}

/** Fait le ménage des positions trop anciennes (appelé au chargement) */
export function purgerDefilementsAnciens() {
  try {
    const aSupprimer: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const cle = localStorage.key(i);
      if (!cle?.startsWith(PREFIXE_DEFILEMENT)) continue;
      try {
        const { date } = JSON.parse(localStorage.getItem(cle) ?? "{}") as {
          date?: number;
        };
        if (Date.now() - (date ?? 0) > AGE_POSITION_MS) aSupprimer.push(cle);
      } catch {
        aSupprimer.push(cle); // entrée illisible : on la retire
      }
    }
    for (const cle of aSupprimer) localStorage.removeItem(cle);
  } catch {
    // stockage indisponible : rien à nettoyer
  }
}

/* ------------------------------------------------------------
 * NAVIGATION DE L'ONGLET EN COURS
 * ------------------------------------------------------------
 * Compte les pages du site réellement affichées dans CET onglet
 * (mémoire d'onglet). Sert au bouton retour : un vrai retour
 * arrière n'est sûr que si l'onglet a déjà navigué DANS le site —
 * sinon l'entrée précédente de l'historique est une page
 * extérieure (onglet neuf, lien partagé, application relancée) et
 * il faut RECONSTRUIRE le retour au lieu de la rejoindre.
 */

export const CLE_ONGLET = "roswel:onglet";

type EtatOnglet = { derniere: string | null; pages: number };

function lireOnglet(): EtatOnglet {
  try {
    const brut = sessionStorage.getItem(CLE_ONGLET);
    if (brut) return JSON.parse(brut) as EtatOnglet;
  } catch {
    // stockage indisponible
  }
  return { derniere: null, pages: 0 };
}

/** À chaque page affichée (les rechargements ne comptent qu'une fois) */
export function noterPageOnglet(url: string) {
  const etat = lireOnglet();
  if (etat.derniere === url) return;
  try {
    sessionStorage.setItem(
      CLE_ONGLET,
      JSON.stringify({ derniere: url, pages: etat.pages + 1 })
    );
  } catch {
    // sans mémoire d'onglet, le retour sera reconstruit — sans danger
  }
}

/** Cet onglet a-t-il affiché au moins deux pages du site ? */
export function ongletADejaNavigue(): boolean {
  return lireOnglet().pages >= 2;
}

/** La DERNIÈRE adresse affichée par CET onglet (null : onglet neuf).
    La mémoire d'onglet survit à la résurrection d'une session tuée
    par le système : c'est elle qui dit où l'onglet en était VRAIMENT
    quand le navigateur ressuscite une entrée périmée
    (RepriseSession). */
export function lireDerniereAdresseOnglet(): string | null {
  return lireOnglet().derniere;
}

/* ------------------------------------------------------------
 * HYDRATATION TERMINÉE ?
 * ------------------------------------------------------------
 * Faux pendant le TOUT PREMIER rendu (le navigateur affiche le
 * HTML du serveur : le premier rendu client doit être identique,
 * sous peine d'erreur d'hydratation). Vrai ensuite : les
 * navigations internes rendent tout côté client — les composants
 * peuvent alors lire leur mémoire (pagination…) dès le premier
 * rendu, AVANT la première peinture, sans risque.
 */

let hydratationTerminee = false;

export function marquerHydratation() {
  hydratationTerminee = true;
}

export function estHydrate(): boolean {
  return hydratationTerminee;
}

/* ------------------------------------------------------------
 * SIGNAL DE TRAVERSÉE (retour/avant) PARTAGÉ
 * ------------------------------------------------------------
 * Posé par MemoireNavigation au popstate, consommé par la liste de
 * résultats pour restaurer SA propre position de défilement
 * interne (le moteur de recherche étant fixe, la liste défile dans
 * sa colonne — la mémoire de la fenêtre ne la voit pas).
 */

let traverseePendante = false;

export function signalerTraversee() {
  traverseePendante = true;
}

/** Vrai une seule fois après un retour/avant du navigateur */
export function consommerTraversee(): boolean {
  const traversee = traverseePendante;
  traverseePendante = false;
  return traversee;
}

/* ------------------------------------------------------------
 * RESTAURATION APRÈS UN RETOUR « RECONSTRUIT »
 * ------------------------------------------------------------
 * Quand l'historique du navigateur a été perdu (application PWA
 * relancée après une longue inactivité…), le bouton retour NAVIGUE
 * vers la liste au lieu de revenir en arrière. Ce drapeau demande
 * à la page d'arrivée de restaurer quand même la position.
 */

export const CLE_RESTAURER = "roswel:restaurer-position";

/** Sans adresse : demande « libre », consommée par la PROCHAINE page
    (le bouton retour reconstruit). Avec adresse : demande RÉSERVÉE à
    cette adresse — la page qui lance une reprise de session
    (RepriseSession) vit encore un instant après son location.replace,
    et ses propres effets ne doivent pas consommer la demande à la
    place de la page d'arrivée. */
export function demanderRestaurationPosition(adresse?: string) {
  try {
    sessionStorage.setItem(CLE_RESTAURER, adresse ?? "1");
  } catch {
    // sans stockage : la liste s'ouvrira simplement en haut
  }
}

/** EFFACE la demande, sans rien restituer (nº 194-§1).
    ⚠️ TOUT GESTE L'ANNULE : un clic sur le logo, un défilement au
    doigt, une touche. Une demande qui survit à un geste se réapplique
    et ramène l'utilisateur à sa place enregistrée alors qu'il vient
    justement de la quitter — la page « remonte puis redescend ». */
export function oublierRestaurationPosition() {
  try {
    sessionStorage.removeItem(CLE_RESTAURER);
  } catch {
    // rien à oublier
  }
}

/**
 * LA MÊME QUESTION, SANS CONSOMMER (§3, nº 328).
 * ------------------------------------------------------------------
 * `DefilementEnHaut` doit savoir, AVANT LA PEINTURE, s'il a le droit
 * de remonter la page — c'est-à-dire si une restitution est attendue.
 * Il ne peut pas appeler `consommerRestaurationPosition` pour cela :
 * il MANGERAIT la demande que `MemoireNavigation` doit consommer un
 * instant plus tard, et la position ne serait jamais rendue.
 * Cette lecture-ci ne retire rien. Elle répond à « une demande est-elle
 * posée pour CETTE adresse ? », et rien d'autre.
 */
export function restaurationDemandeePour(url: string): boolean {
  try {
    const brut = sessionStorage.getItem(CLE_RESTAURER);
    if (!brut) return false;
    return brut === "1" || brut === url;
  } catch {
    return false;
  }
}

/** Consomme la demande (vrai une seule fois — et uniquement sur la
    page à qui elle est destinée, quand elle est adressée) */
export function consommerRestaurationPosition(): boolean {
  try {
    const brut = sessionStorage.getItem(CLE_RESTAURER);
    if (!brut) return false;
    if (brut !== "1" && brut !== location.pathname + location.search) {
      return false;
    }
    sessionStorage.removeItem(CLE_RESTAURER);
    return true;
  } catch {
    // rien
  }
  return false;
}
