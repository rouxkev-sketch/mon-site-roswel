"use client";

/**
 * LA REMONTÉE D'UN CHAMP À LISTE — LA mécanique, pour les trois qui en
 * ont besoin
 * ====================================================================
 * (passe nº 155-§1 — extraite de ChampLocalisation, où la passe nº 21
 * l'avait posée. ⚠️ RESTREINTE PAR LA Nº 162-§1, voir ci-dessous.)
 *
 * LA RÈGLE : sur smartphone, toucher un champ fait remonter la page
 * pour l'amener EN HAUT DE L'ÉCRAN — toute la place disponible passe
 * alors entre le champ et le clavier, au lieu de rester inutilisée
 * au-dessus. Sans cela, le navigateur pose le champ JUSTE au-dessus
 * des touches : assez pour saisir, insuffisant pour voir ce qu'on
 * fait.
 *
 * ⚠️ ET SEULS LES CHAMPS À LISTE Y ONT DROIT (passe nº 162-§1). La
 * nº 155-§1 l'avait donnée à TOUS les champs du site, par un écouteur
 * global : c'était inutile et brutal pour la plupart. À QUOI SERT LA
 * REMONTÉE — à dégager de la place SOUS le champ, POUR SA LISTE DE
 * SUGGESTIONS. Un champ sans liste n'en a aucun besoin : le navigateur
 * fait déjà le nécessaire, il défile juste ce qu'il faut pour garder
 * le champ visible au-dessus du clavier, et c'est discret.
 * L'écouteur global est SUPPRIMÉ. Trois champs arment la mécanique
 * eux-mêmes, et eux seuls :
 *  · la LOCALITÉ du moteur de recherche (ChampLocalisation,
 *    `remonterAuToucher`) ;
 *  · l'ADRESSE et la LOCALITÉ du formulaire de portfolio (mêmes
 *    composants, via DeuxZonesLieu et BlocStudios) ;
 *  · la RECHERCHE d'un salon, d'un studio ou d'un artiste
 *    (RechercheFicheInscrite) — modes d'activité et bloc Organisation.
 * Tous les autres — nom d'artiste, bio, mots de passe, e-mail, liens
 * et titres, message de contact, motif de signalement, champs de
 * l'administration — n'ont AUCUN traitement particulier : ni remontée,
 * ni espace ajouté en bas, ni marge conditionnelle.
 *
 * ⚠️ AUCUN CALCUL DE POSITION, ET C'EST LE POINT. Les approches qui
 * mesuraient (`getBoundingClientRect` − `visualViewport.offsetTop` −
 * une marge choisie à la main, puis `scrollBy`) ont coûté onze passes
 * de dérive : une conversion de repère, des sémantiques opposées
 * entre iOS et Chromium. On demande au navigateur, et rien d'autre :
 *
 *     cible.scrollIntoView({ block: "start", behavior: "smooth" })
 *
 * L'air laissé au-dessus n'est pas un chiffre d'ici : c'est
 * `scroll-margin-top`, portée par le champ (globals.css) — déclaratif,
 * et différent selon le contexte sans une ligne de JavaScript.
 *
 * LE SEUL RÉGLAGE EST LE MOMENT. On écoute le redimensionnement du
 * viewport pour savoir QUAND le clavier a fini d'arriver — on n'en lit
 * AUCUNE valeur DE POSITION. Trop tôt, le document n'a pas encore la
 * hauteur nécessaire et le défilement est raboté ; trop tard, on voit
 * deux mouvements. On part quand les redimensionnements se taisent
 * (CALME_CLAVIER_MS), avec un filet si aucun ne vient — clavier déjà
 * levé, clavier matériel (FILET_CLAVIER_MS).
 *
 * iOS ET ANDROID, SANS DISTINCTION : le premier fait glisser le
 * viewport visuel, le second redimensionne la fenêtre — mais les deux
 * émettent `visualViewport.resize`, et les deux font défiler le
 * document de la même façon. Aucun code spécifique à l'un ou l'autre.
 */

/**
 * L'ESPACE AJOUTÉ EN BAS PENDANT LA SAISIE (passe nº 159-§3)
 * ===========================================================
 * ⚠️ C'EST LA CAUSE QUI A RÉSISTÉ À DEUX PASSES, et la sonde l'a dite
 * en une ligne :
 *
 *     scrollY 0 · champHaut 93 · marge 76px · docH 669 · innerH 669
 *
 * `scrollIntoView` ÉTAIT BIEN APPELÉ, avec les bons arguments, et la
 * marge de 76 px était bien appliquée. Mais LE DOCUMENT FAISAIT
 * EXACTEMENT LA HAUTEUR DE L'ÉCRAN : il n'y avait rien à faire
 * défiler. Une page qui ne peut pas bouger ne bouge pas — le
 * navigateur avait raison, et nos quatre corrections portaient sur un
 * mécanisme qui n'était jamais en cause.
 *
 * CE QU'ON AJOUTE : un ESPACE VIDE au bas du document, le temps de la
 * saisie. Le document devient alors plus long que l'écran, et le
 * défilement natif a de quoi travailler — il amène le champ à sa
 * marge, tout seul, comme il l'a toujours su faire.
 *
 * ⚠️ CE N'EST PAS UN CALCUL DE POSITION. On ne mesure rien, on ne
 * déplace rien : on réserve UNE HAUTEUR D'ÉCRAN de vide. Que le champ
 * soit à 90 px ou à 600 px du haut, cette hauteur suffit toujours à
 * l'amener sous la barre. Le `scrollIntoView` reste le seul à décider
 * de la position finale.
 *
 * L'ESPACE PART AVEC LE CLAVIER — voir « LE RETOUR » ci-dessous.
 */

/**
 * LA MARGE SUIT LA BARRE FIXE (passe nº 160-§3)
 * ==============================================
 * ⚠️ CE QUE LE RELEVÉ DU PROPRIÉTAIRE A MONTRÉ. La remontée marche :
 *
 *     t=1   scrollY 310 · champHaut 371 · marge 76px · vvH 777 · vvTop 0
 *     t=558 scrollY 605 · champHaut  76 · marge 76px · vvH 398 · vvTop 295
 *
 * Le champ arrive bien à 76 px du haut. Seulement, PENDANT LA SAISIE
 * LA BARRE FIXE N'EST PLUS LÀ : le clavier a rétréci la zone visible
 * (777 → 398) et fait glisser le viewport visuel de 295 px vers le
 * bas ; la barre, elle, est restée accrochée au haut de la page,
 * c'est-à-dire AU-DESSUS de ce qu'on voit. Les 76 px qui lui étaient
 * réservés ne dégagent alors plus rien : ils font un VIDE de la
 * hauteur d'une barre absente, au-dessus du champ, pris sur la
 * poignée de pixels qui restent au clavier.
 *
 * LA MARGE DEVIENT DONC CONDITIONNELLE, et elle seule :
 *  · BARRE VISIBLE → 76 px, comme avant (la barre fait ~64 px, plus
 *    12 px d'air) ;
 *  · BARRE HORS CHAMP → 12 px, l'air esthétique tout seul : le champ
 *    monte tout en haut de ce qu'on voit, sans y être collé.
 *
 * ⚠️ LA MÉCANIQUE, ELLE, NE CHANGE PAS D'UN IOTA : toujours
 * `scrollIntoView` natif, toujours zéro calcul de position. On pose
 * `data-clavier="ouvert"` sur <html> JUSTE AVANT le défilement, et
 * c'est le CSS (globals.css) qui choisit la marge. Le navigateur fait
 * l'arithmétique, comme toujours.
 *
 * COMMENT ON SAIT QUE LA BARRE A DISPARU — sans la mesurer. Un
 * en-tête fixe est accroché au HAUT DE LA PAGE ; il est donc visible
 * exactement tant que le haut de la page est visible. C'est ce que
 * dit `visualViewport`, et lui seul :
 *  · `offsetTop > 0` — la zone visible commence PLUS BAS que le haut
 *    de la page : tout ce qui y est collé est sorti par le haut ;
 *  · `innerHeight − height` grand — l'écran (la page) est bien plus
 *    haut que ce qu'on voit : le navigateur a gardé la page à sa
 *    taille et n'en montre qu'une fenêtre, qu'il fera glisser pour
 *    suivre le champ (c'est iOS). Quand au contraire le navigateur
 *    RÉTRÉCIT la fenêtre (Android par défaut), les deux hauteurs
 *    restent égales : la barre reste visible, et la marge reste à
 *    76 px. Aucun code spécifique à l'un ou à l'autre — une seule
 *    question, posée au viewport.
 *
 * LE RETOUR — QUAND LE CLAVIER SE REFERME. La barre revient ; le
 * champ, monté à 12 px, se retrouverait dessous. On refait donc
 * exactement le même geste, à l'envers et sans à-coup :
 *  1. la marge redevient 76 px (l'attribut tombe) ;
 *  2. l'espace de fin de document se REPLIE en douceur (sa hauteur
 *     s'anime jusqu'à zéro) au lieu d'être arraché : sur une page
 *     courte, le navigateur ramène la position dans ses bornes IMAGE
 *     PAR IMAGE — une glissade, et non le saut sec qu'aurait produit
 *     un `remove()` d'un écran de vide ;
 *  3. le MÊME `scrollIntoView` natif repose alors le champ sous la
 *     barre — un no-op si le repli l'y a déjà ramené.
 * ⚠️ L'ORDRE (replier PUIS reposer) N'EST PAS UN DÉTAIL : reposer
 * d'abord, c'est déplacer la page vers une position que le repli
 * invalide l'instant d'après — deux mouvements opposés, l'à-coup
 * qu'on veut éviter. Dans cet ordre-ci, chaque page ne fait qu'UN
 * mouvement : la courte glisse avec le repli (le défilement final n'a
 * plus rien à corriger), la longue ne bouge qu'au défilement final
 * (le repli ne la borne pas).
 *
 * On reconnaît la fermeture au même signal que l'ouverture : la zone
 * visible REDEVIENT GRANDE (`visualViewport.height` remonte
 * franchement au-dessus de ce qu'elle valait pendant la saisie). Cela
 * vaut pour les deux façons de refermer — validation ou rétractation
 * du clavier — puisque les deux redonnent la place.
 */
const MARQUE_ESPACE = "data-espace-remontee";

/** L'attribut posé sur <html> quand la barre fixe est sortie de la
    zone visible : `data-clavier="ouvert"`. C'est le CSS qui en tire la
    marge (globals.css) — ce fichier ne fixe aucun pixel. */
const MARQUE_CLAVIER = "clavier";

/** Le silence qui dit « le clavier a fini d'arriver ». */
export const CALME_CLAVIER_MS = 120;

/** Aucun redimensionnement du tout (clavier déjà levé, clavier
    matériel) : on part quand même. */
export const FILET_CLAVIER_MS = 450;

/** En dessous de ce creux entre la page et la zone visible, c'est la
    barre d'outils du navigateur qui bouge, pas un clavier. */
const CREUX_CLAVIER_PX = 120;

/** Un décalage du viewport visuel, même modeste, veut dire que le haut
    de la page — donc la barre fixe — est sorti par le haut. */
const DECALAGE_VISUEL_PX = 8;

/** La zone visible a repris cette hauteur-là de plus qu'au moment de
    la remontée : le clavier est reparti. */
const RETOUR_CLAVIER_PX = 60;

/** Le temps laissé au défilement doux du retour avant de clore la
    session : ranger pendant qu'il glisse couperait la glissade. */
const GLISSADE_MS = 320;

/** La durée du repli de l'espace — c'est elle qui rend la remise en
    place progressive au lieu d'être un saut. */
const REPLI_ESPACE_MS = 220;

/** Le champ est parti mais aucune fermeture n'a été détectée : on
    range quand même, jamais d'espace oublié au bas du document. */
const FILET_FERMETURE_MS = 900;

/** UNE SEULE REMONTÉE À LA FOIS, pour tout le site. Passer d'un champ
    au suivant abandonne la précédente : deux surveillances de
    fermeture feraient deux défilements concurrents. */
let enCours: Session | null = null;

type Session = {
  /** Une autre remontée prend la main : tout est rendu, tout de suite. */
  abandonner: () => void;
  /** Le champ n'a plus le doigt : on coupe ce qui est en attente, mais
      on continue de guetter le départ du clavier. */
  laisserPartir: () => void;
};

/**
 * ARME LA REMONTÉE d'un élément : elle se joue quand le clavier s'est
 * tu, ou au filet. Rend la fonction qui la LAISSE PARTIR — un départ
 * du champ, un second toucher ou un démontage ne doivent pas laisser
 * d'écouteur derrière eux.
 */
export function armerLaRemontee(cible: HTMLElement): () => void {
  enCours?.abandonner();
  const session = ouvrirUneRemontee(cible);
  enCours = session;
  return () => session.laisserPartir();
}

function ouvrirUneRemontee(cible: HTMLElement): Session {
  const visuel = window.visualViewport;
  //  L'ESPACE, POSÉ TOUT DE SUITE : il doit exister AVANT le
  //  `scrollIntoView`, sinon il n'y a toujours rien à faire défiler.
  const espace = poserLEspace();

  let phase: "attente" | "montee" | "retour" | "finie" = "attente";
  let minuteur = 0;
  let filet = 0;
  /** La hauteur visible AU MOMENT de la remontée : c'est à elle qu'on
      compare pour reconnaître le départ du clavier. */
  let hauteurALaMontee = 0;

  function ecouter(oui: boolean) {
    if (oui) {
      visuel?.addEventListener("resize", auRedimensionnement);
      window.addEventListener("resize", auRedimensionnement);
    } else {
      visuel?.removeEventListener("resize", auRedimensionnement);
      window.removeEventListener("resize", auRedimensionnement);
    }
  }

  /** Range les écouteurs, les minuteurs et la marge. NE TOUCHE PAS à
      l'espace : selon le chemin, il part d'un coup ou en douceur. */
  function ranger() {
    if (phase === "finie") return;
    phase = "finie";
    window.clearTimeout(minuteur);
    window.clearTimeout(filet);
    ecouter(false);
    rendreLaMarge();
    if (enCours === session) enCours = null;
  }

  function monter() {
    if (phase !== "attente") return;
    phase = "montee";
    window.clearTimeout(minuteur);
    hauteurALaMontee = hauteurVisible();
    //  ⚠️ LA DÉCISION DE MARGE SE PREND ICI, juste avant le
    //  défilement : c'est le seul instant où l'on sait si la barre
    //  fixe est encore dans la zone visible.
    poserLaMarge(laBarreEstHorsChamp());
    // LE DÉFILEMENT NATIF, ET LUI SEUL. La marge au-dessus vient de
    // `scroll-margin-top` (CSS), jamais d'un calcul d'ici.
    cible.scrollIntoView({ block: "start", behavior: "smooth" });
    //  ⚠️ ON GARDE LES ÉCOUTEURS : c'est le DÉPART du clavier qu'ils
    //  guettent désormais.
  }

  /** Le clavier s'en va : la barre revient, la marge aussi, et le
      champ se repose sous elle — même mécanique, sans à-coup.
      ⚠️ L'ORDRE — marge, repli, PUIS défilement — est expliqué dans
      l'en-tête du fichier : c'est lui qui garantit UN SEUL mouvement
      à l'écran, page courte comme page longue. */
  function retour() {
    if (phase !== "montee") return;
    phase = "retour";
    window.clearTimeout(minuteur);
    window.clearTimeout(filet);
    ecouter(false);
    //  1. LA MARGE D'ABORD : le défilement qui vient doit la lire.
    rendreLaMarge();
    //  2. L'ESPACE SE REPLIE — la page courte glisse dans ses bornes.
    espace.replier();
    //  3. LE MÊME DÉFILEMENT NATIF, une fois le repli achevé : il
    //     repose le champ sous la barre — no-op si le repli l'a fait.
    minuteur = window.setTimeout(() => {
      cible.scrollIntoView({ block: "start", behavior: "smooth" });
      minuteur = window.setTimeout(ranger, GLISSADE_MS);
    }, REPLI_ESPACE_MS + 60);
  }

  function auRedimensionnement() {
    if (phase === "attente") {
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(monter, CALME_CLAVIER_MS);
      return;
    }
    if (phase === "montee" && hauteurVisible() > hauteurALaMontee + RETOUR_CLAVIER_PX) {
      retour();
    }
  }

  const session: Session = {
    abandonner() {
      if (phase === "finie") return;
      ranger();
      espace.retirer();
    },
    laisserPartir() {
      if (phase === "finie") return;
      if (phase === "attente") {
        //  Le clavier n'est jamais venu (ou le champ est parti avant
        //  lui) : rien n'a bougé, rien à ramener.
        ranger();
        espace.retirer();
        return;
      }
      //  Le clavier est là et s'en va : c'est la surveillance qui
      //  rendra la marge et l'espace — avec un filet, au cas où le
      //  navigateur ne dirait rien.
      window.clearTimeout(filet);
      filet = window.setTimeout(retour, FILET_FERMETURE_MS);
    },
  };

  ecouter(true);
  minuteur = window.setTimeout(monter, FILET_CLAVIER_MS);
  return session;
}

/** La hauteur de ce qu'on VOIT — le viewport visuel quand il existe,
    la fenêtre sinon. */
function hauteurVisible(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

/**
 * LA BARRE FIXE EST-ELLE SORTIE DE LA ZONE VISIBLE ? On ne la mesure
 * pas — on demande au viewport visuel si le HAUT DE LA PAGE, où elle
 * est accrochée, est encore visible (voir l'en-tête du fichier).
 */
function laBarreEstHorsChamp(): boolean {
  const visuel = window.visualViewport;
  //  Sans viewport visuel, rien ne dit que la barre soit partie : on
  //  garde la marge qui la dégage.
  if (!visuel) return false;
  if (visuel.offsetTop > DECALAGE_VISUEL_PX) return true;
  return window.innerHeight - visuel.height > CREUX_CLAVIER_PX;
}

function poserLaMarge(barreHorsChamp: boolean) {
  if (barreHorsChamp) {
    document.documentElement.dataset[MARQUE_CLAVIER] = "ouvert";
  } else {
    rendreLaMarge();
  }
}

function rendreLaMarge() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset[MARQUE_CLAVIER];
}

/**
 * POSER L'ESPACE DE FIN DE DOCUMENT — et savoir le retirer, d'un coup
 * ou en douceur.
 * Un seul à la fois : s'il en existe déjà un (deux champs touchés
 * coup sur coup), on le réutilise plutôt que d'empiler des écrans de
 * vide. ⚠️ Un espace DÉJÀ EN TRAIN DE SE REPLIER ne compte pas — il
 * porte `="replie"` et sa hauteur s'en va : le réutiliser rendrait un
 * document qui rétrécit sous les pieds du défilement.
 */
function poserLEspace(): { retirer: () => void; replier: () => void } {
  if (typeof document === "undefined") {
    return { retirer: () => {}, replier: () => {} };
  }
  const existant = document.querySelector<HTMLElement>(`[${MARQUE_ESPACE}=""]`);
  const espace = existant ?? document.createElement("div");
  if (!existant) {
    espace.setAttribute(MARQUE_ESPACE, "");
    espace.setAttribute("aria-hidden", "true");
    //  UNE HAUTEUR D'ÉCRAN, et rien d'autre : pas de fond, pas de
    //  marge, aucune prise au doigt. `dvh` suit le viewport dynamique —
    //  c'est la hauteur que le navigateur donne vraiment à l'écran.
    espace.style.cssText =
      "height:100dvh;flex:none;pointer-events:none;visibility:hidden";
    document.body.appendChild(espace);
  }
  const retirer = () => espace.remove();
  return {
    retirer,
    replier() {
      espace.setAttribute(MARQUE_ESPACE, "replie");
      //  LA HAUTEUR S'ANIME : le document raccourcit image par image,
      //  et le navigateur ramène la page dans ses bornes de la même
      //  façon — une glissade au lieu d'un saut.
      espace.style.transition = `height ${REPLI_ESPACE_MS}ms ease-out`;
      espace.style.height = "0px";
      window.setTimeout(retirer, REPLI_ESPACE_MS + 60);
    },
  };
}
