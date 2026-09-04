"use client";

/**
 * LE JOURNAL DE BORD — un témoin qui survit à l'écran noir (nº 272-§2)
 * ====================================================================
 * LE DRAME QU'IL INSTRUMENTE : une création de fiche, puis un clic sur
 * un lien — tout se met à CLIGNOTER, écran noir du navigateur, et le
 * compte est déconnecté au retour. Personne ne le reproduira à la
 * demande : un vert de banc ne prouvera rien. Il faut un témoin qui
 * écrive PENDANT, pas après.
 *
 * CE QU'IL FAIT, ET RIEN D'AUTRE :
 *  · il note CÔTÉ SERVEUR (la route api/dev/journal-de-bord, qui
 *    écrit dans `journal-de-bord.ndjson` à la racine — le chemin des
 *    sondes et de leur bouton ENVOYER, nº 174) chaque chargement de
 *    page, chaque navigation, chaque erreur non rattrapée, chaque
 *    bascule de session, et chaque redirection de garde ;
 *  · il écrit AU FIL DE L'EAU (`navigator.sendBeacon`, qui part même
 *    pendant un déchargement de page) — un journal qui attendrait la
 *    fin ne survivrait pas au plantage ;
 *  · il COMPTE les rendus et les navigations par seconde, et s'ils
 *    s'emballent, il l'écrit ET ARRÊTE LA BOUCLE : les redirections
 *    de garde du site (l'espace ↔ la page de compte) passent par
 *    `redirectionDeGarde`, qui refuse de rejouer un ping-pong.
 *
 * ⚠️ LA BOUCLE QU'IL COUPE EST CELLE DU RELEVÉ. Deux gardes se font
 * face : l'espace renvoie « pas de session » vers /become-an-artist
 * (FormulaireFiche), qui renvoie « session présente » vers l'espace
 * (EcranAuthentification). Or la session a DEUX juges qui peuvent se
 * contredire (use-utilisateur) : le COOKIE, lu en synchrone — il dit
 * « connecté » même quand le jeton de rafraîchissement est mort — et
 * `onAuthStateChange`, qui dit SIGNED_OUT quand le rafraîchissement
 * échoue. Une session à moitié morte fait alterner les deux verdicts,
 * chaque bascule déclenche la redirection d'en face : le clignotement
 * du relevé, jusqu'à ce que le navigateur tue la page — et chaque
 * tour rejoue un rafraîchissement avec un jeton déjà tourné, ce que
 * Supabase punit en révoquant la session entière : le compte est
 * déconnecté pour de bon. Le coupe-circuit laisse passer les
 * redirections NORMALES (une, puis plus rien) et coupe au-delà du
 * plafond : la page s'immobilise sur l'écran de connexion, le journal
 * dit pourquoi, et le jeton cesse d'être martyrisé.
 *
 * DISCRET : aucun rendu, aucun écouteur bloquant, et chaque écriture
 * est enveloppée — un journal ne casse JAMAIS ce qu'il observe.
 *
 * ██ §1 (nº 712) — ÉTEINT PAR DÉFAUT, ET LE COUPE-CIRCUIT RESTE ██
 * ==================================================================
 * CE QUI CHANGE : ce journal partait TOUJOURS, sans qu'on l'arme —
 * mesuré au banc de la nº 712 : UN envoi au chargement et DEUX par
 * navigation, sur chacune des trois pages d'échantillon (accueil,
 * recherche, Ma sélection). Il est désormais dans le registre des
 * sondes (`journal`, lib/sondes-armees), ÉTEINT par défaut :
 *  · `noterAuJournal` ne part plus sur le réseau ;
 *  · `demarrerJournal` n'enveloppe plus `history.pushState` /
 *    `replaceState` et n'installe plus aucun écouteur — donc plus rien
 *    à exécuter à chaque navigation du routeur.
 *
 * ⚠️ CE QUI NE CHANGE PAS, ET C'EST LE POINT DÉLICAT DE LA PASSE : ce
 * module n'est pas qu'un témoin, il PORTE UNE PROTECTION —
 * `redirectionDeGarde`, le coupe-circuit du ping-pong entre les deux
 * gardes du compte (l'écran de connexion et l'espace), celui qui a
 * arrêté la boucle qui DÉCONNECTAIT le compte du propriétaire
 * (nº 272-§2). Cette protection reste ENTIÈRE, allumée comme éteinte :
 * son compteur (`redirectionsGarde`) est alimenté DANS la fonction
 * elle-même, jamais par les écouteurs, et son verrou (`CLE_ARRET`)
 * vit en mémoire d'onglet. Seule l'ÉCRITURE de la trace se tait.
 * ⚠️ CE QU'ON PERD EN ÉTEINT, dit franchement : les plafonds de
 * SURVEILLANCE (navigations, rechargements, rendus par seconde) ne
 * comptent plus — ils ne servaient qu'à consigner un emballement, pas
 * à l'empêcher. Le seul plafond qui AGIT, celui des redirections de
 * garde, ne dépend d'aucun d'eux.
 */

import { sondeArmee } from "@/lib/sondes-armees";

const ADRESSE_JOURNAL = "/api/dev/journal-de-bord";

/** La fenêtre d'observation de l'emballement, et ses plafonds. */
const FENETRE_MS = 10_000;
/** Navigations (douces + chargements) tolérées dans la fenêtre. */
const PLAFOND_NAVIGATIONS = 8;
/** Chargements COMPLETS tolérés dans la fenêtre (une boucle de
    rechargements les enchaîne bien plus vite qu'un humain). */
const PLAFOND_CHARGES = 5;
/** Redirections de GARDE tolérées dans la fenêtre : une navigation
    normale en fait UNE ; un ping-pong en fait des dizaines. */
const PLAFOND_REDIRECTIONS_GARDE = 3;
/** Rendus par seconde au-delà desquels on consigne un emballement. */
const PLAFOND_RENDUS_PAR_SECONDE = 40;
/** Combien de temps l'arrêt reste engagé une fois déclenché. */
const ARRET_MS = 30_000;

/** Les chargements complets, eux, doivent survivre au rechargement :
    ils vivent en sessionStorage (la mémoire de CET onglet). */
const CLE_CHARGES = "yf-journal-charges";
const CLE_ARRET = "yf-journal-arret";

/** Horodatages en mémoire de module (navigations douces, rendus,
    redirections de garde) : la page qui boucle SANS recharger garde
    son module, c'est suffisant — et un rechargement passe par
    CLE_CHARGES. */
const navigations: number[] = [];
const rendus: number[] = [];
const redirectionsGarde: number[] = [];
let demarre = false;
let emballementRendusDit = false;

/** Ne garde que les horodatages encore dans la fenêtre. */
function recents(liste: number[], fenetre = FENETRE_MS): number[] {
  const seuil = Date.now() - fenetre;
  while (liste.length > 0 && liste[0] < seuil) liste.shift();
  return liste;
}

/** La session, vue du cookie — l'un des DEUX juges (voir l'en-tête). */
function cookieDeSessionPresent(): boolean {
  try {
    return document.cookie.includes("-auth-token");
  } catch {
    return false;
  }
}

/**
 * ÉCRIRE UNE LIGNE, TOUT DE SUITE. `sendBeacon` d'abord : il part
 * même si la page est en train de mourir — c'est toute la raison
 * d'être de ce journal. `fetch keepalive` en secours. Et jamais la
 * moindre exception : un témoin qui fait tomber ce qu'il observe
 * n'est pas un témoin.
 */
export function noterAuJournal(
  genre: string,
  details: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  //  §1 (nº 712) — ÉTEINT, RIEN NE PART. La question se pose sur la
  //  marque de `<html>` : une lecture d'attribut, aucun réseau.
  if (!sondeArmee("journal")) return;
  try {
    const ligne = JSON.stringify({
      quand: new Date().toISOString(),
      genre,
      page: `${location.pathname}${location.search}`,
      session_cookie: cookieDeSessionPresent(),
      ...details,
    });
    if (navigator.sendBeacon?.(ADRESSE_JOURNAL, new Blob([ligne], { type: "text/plain" }))) {
      return;
    }
    void fetch(ADRESSE_JOURNAL, {
      method: "POST",
      body: ligne,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Le journal n'a pas le droit de casser quoi que ce soit.
  }
}

/** L'arrêt est-il engagé ? (posé par un emballement, lève tout seul) */
export function arretEngage(): boolean {
  try {
    const depuis = Number(sessionStorage.getItem(CLE_ARRET) ?? 0);
    return depuis > 0 && Date.now() - depuis < ARRET_MS;
  } catch {
    return false;
  }
}

function engagerLArret(cause: string, details: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(CLE_ARRET, String(Date.now()));
  } catch {}
  noterAuJournal("emballement", { cause, arret_ms: ARRET_MS, ...details });
}

/** Une navigation de plus — et l'emballement surveillé au passage. */
function noterNavigation(genre: string, vers: string): void {
  recents(navigations).push(Date.now());
  noterAuJournal(genre, { vers, navigations_10s: navigations.length });
  if (navigations.length > PLAFOND_NAVIGATIONS && !arretEngage()) {
    engagerLArret("navigations", { compte: navigations.length });
  }
}

/**
 * LA REDIRECTION DE GARDE — le seul point où le journal AGIT.
 * Les deux gardes du compte (l'espace quand la session manque, la
 * page de compte quand la session est là) demandent ICI avant de
 * rediriger. Une navigation normale passe (le plafond laisse trois
 * allers dans la fenêtre) ; un ping-pong est coupé net, et le refus
 * est écrit noir sur blanc — c'est LUI qu'on lira au prochain drame.
 */
export function redirectionDeGarde(depuis: string, vers: string): boolean {
  if (arretEngage()) {
    noterAuJournal("garde-refusee", { depuis, vers, cause: "arret-engage" });
    return false;
  }
  recents(redirectionsGarde).push(Date.now());
  if (redirectionsGarde.length > PLAFOND_REDIRECTIONS_GARDE) {
    engagerLArret("redirections-de-garde", {
      depuis,
      vers,
      compte: redirectionsGarde.length,
    });
    return false;
  }
  noterAuJournal("garde", { depuis, vers });
  return true;
}

/** Un rendu de plus (compté par le composant JournalDeBord). Un
    emballement de rendus se CONSIGNE — on ne peut pas arrêter React
    d'ici, mais le journal, lui, saura le dire. */
export function noterRendu(): void {
  if (typeof window === "undefined") return;
  //  §1 (nº 712) — éteint, on ne compte même pas : ce compteur ne sert
  //  qu'à CONSIGNER un emballement, il n'en empêche aucun.
  if (!sondeArmee("journal")) return;
  recents(rendus, 1000).push(Date.now());
  if (rendus.length > PLAFOND_RENDUS_PAR_SECONDE && !emballementRendusDit) {
    emballementRendusDit = true;
    noterAuJournal("emballement", {
      cause: "rendus",
      rendus_par_seconde: rendus.length,
    });
  }
}

/**
 * DÉMARRER LES ÉCOUTEURS — une seule fois par page.
 * Chargement complet (avec le compteur qui survit en sessionStorage),
 * navigations douces (pushState / replaceState / popstate), erreurs
 * non rattrapées et promesses rejetées.
 */
export function demarrerJournal(): void {
  if (demarre || typeof window === "undefined") return;
  /*  §1 (nº 712) — ÉTEINT, ON N'INSTALLE RIEN DU TOUT : ni l'enveloppe
      sur `history.pushState` / `replaceState` (qui s'exécutait à
      CHAQUE navigation du routeur), ni les écouteurs de `popstate`,
      d'erreur et de promesse rejetée, ni le relevé des chargements.
      ⚠️ ET ON NE MARQUE PAS `demarre` : si la sonde est allumée
      ensuite au tableau de bord, le prochain chargement installe tout
      normalement. */
  if (!sondeArmee("journal")) return;
  demarre = true;
  try {
    //  LE CHARGEMENT COMPLET — et la boucle de RECHARGEMENTS, qui ne
    //  passe pas par la mémoire de module : ses horodatages vivent en
    //  sessionStorage, d'un chargement à l'autre.
    let charges: number[] = [];
    try {
      charges = (JSON.parse(sessionStorage.getItem(CLE_CHARGES) ?? "[]") as number[])
        .filter((quand) => Date.now() - quand < FENETRE_MS);
    } catch {}
    charges.push(Date.now());
    try {
      sessionStorage.setItem(CLE_CHARGES, JSON.stringify(charges.slice(-20)));
    } catch {}
    noterAuJournal("charge", { charges_10s: charges.length });
    if (charges.length > PLAFOND_CHARGES && !arretEngage()) {
      engagerLArret("rechargements", { compte: charges.length });
    }

    //  LES NAVIGATIONS DOUCES — le routeur de Next passe par
    //  pushState / replaceState ; le retour arrière, par popstate.
    const pushDOrigine = history.pushState.bind(history);
    const replaceDOrigine = history.replaceState.bind(history);
    history.pushState = (etat, titre, adresse) => {
      pushDOrigine(etat, titre, adresse);
      noterNavigation("navigation", String(adresse ?? ""));
    };
    history.replaceState = (etat, titre, adresse) => {
      replaceDOrigine(etat, titre, adresse);
      noterNavigation("navigation-remplacee", String(adresse ?? ""));
    };
    window.addEventListener("popstate", () => {
      noterNavigation("retour", `${location.pathname}${location.search}`);
    });

    //  LES ERREURS — celles qui déclenchent l'écran d'erreur, et les
    //  promesses rejetées que personne n'attrape.
    window.addEventListener("error", (evenement) => {
      noterAuJournal("erreur", {
        message: String(evenement.message ?? "").slice(0, 300),
        source: `${evenement.filename ?? ""}:${evenement.lineno ?? ""}`,
      });
    });
    window.addEventListener("unhandledrejection", (evenement) => {
      const raison = evenement.reason;
      noterAuJournal("promesse-rejetee", {
        message: String(
          raison instanceof Error ? raison.message : raison
        ).slice(0, 300),
      });
    });
  } catch {
    // Un journal qui ne démarre pas laisse le site parfaitement en paix.
  }
}
