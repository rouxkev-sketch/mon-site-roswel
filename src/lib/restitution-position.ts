"use client";

import { defilerSansGeste } from "@/lib/defilement-programme";
import {
  adresseDeRecherche,
  adresseDeRechercheCourante,
} from "@/lib/adresse-recherche";
//  §1 (nº 660) — les mêmes lignes dans la trace permanente : la sonde
//  se tait désarmée, la boîte noire tourne toujours (voir nº 654). Les
//  lignes sont posées À CÔTÉ des décisions ; aucune ne change.
import { lireLaPlace } from "@/lib/navigation-session";
import { rendreLEtatDeRangee } from "@/lib/reserve-barre";
//  §1 (nº 337) — « on ne pose une position que sur du contenu » :
//  la règle, sa mesure et sa raison sont dans ce module-là.
import {
  ATTENTE_MAX_MS as ATTENTE_CONTENU_MS,
  contenuAtteint,
  MARQUE_ATTENTE,
} from "@/lib/pose-sur-contenu";

/**
 * LA POSITION EST POSÉE, UNE FOIS, ET C'EST TOUT
 * ==================================================================
 * REFONTE DE LA PASSE Nº 191 — une seule mécanique, plus aucune
 * poursuite concurrente.
 *
 * CE QUI A RENDU CELA POSSIBLE : l'adresse porte désormais le NOMBRE DE
 * PAGES chargées (`&page=3`), et le serveur rend toutes ces cartes d'un
 * coup. La page a donc sa hauteur définitive AVANT la première
 * peinture : il n'y a plus rien à attendre, plus rien à rattraper, plus
 * rien à poursuivre image par image.
 *
 * IL RESTE DEUX GESTES, ET DEUX SEULEMENT :
 *  1. RÉSERVER la hauteur nécessaire sur <html> (`min-height`), pour
 *     que le défilement demandé ne soit pas raboté pendant que les
 *     images se posent ;
 *  2. POSER le défilement, une fois.
 * La réserve s'efface d'elle-même dès que le contenu réel la DÉPASSE
 * (§1 nº 711 — strictement : voir `surveillerLaReserve`, la mesure
 * d'origine se regardait elle-même), ou au bout de cinq secondes —
 * OU DÈS QUE LA PAGE EST QUITTÉE (nº 813, voir `pageQuittee`).
 *
 * ⚠️ POURQUOI SUR <html> ET PAS SUR LE CORPS : React rend <body>, et
 * tout ce qu'on y écrit avant l'hydratation devient un écart
 * d'hydratation (mesuré à la passe 107). <html>, non.
 *
 * DEUX GARDE-FOUS, HÉRITÉS DES PASSES 185 ET 186, QUI RESTENT :
 *  · une position de 0 ne déplace RIEN ;
 *  · une position n'est posée que si la clé sous laquelle elle a été
 *    rangée est encore l'adresse courante — une place appartient à une
 *    recherche, jamais à une autre.
 * Chaque pose laisse une ligne au journal de la sonde.
 */

/** Au-delà, on rend la main : le contenu ne viendra plus. */
const ATTENTE_MAX_MS = 5000;

/** La surveillance en cours, pour ne jamais en laisser traîner deux. */
let arreter: (() => void) | null = null;
/** nº 813 — le chemin pour lequel la réserve en cours a été posée, et
    celui de l'attente de contenu en cours (`null` : rien en cours).
    C'est ce que `libererSiPageQuittee` compare au chemin courant. */
let cheminDeLaReserve: string | null = null;
let cheminDeLAttente: string | null = null;

/**
 * Garde la réserve tant que le contenu réel ne la DÉPASSE pas, puis
 * l'efface. Sans elle, la page rétrécirait sous les pieds de
 * l'utilisateur.
 *
 * ██ §1 (nº 711) — LA MESURE SE REGARDAIT ELLE-MÊME, ET C'ÉTAIT TOUT
 * LE « TÉMOIN B » ██
 * ------------------------------------------------------------------
 * L'ANCIEN TEST : « le CORPS ≥ la réserve » — écrit en croyant que la
 * hauteur du corps ignore la réserve (elle est posée sur <html>). Or
 * le corps porte `min-h-full` (layout.tsx) : il SUIT <html>, donc il
 * SUIT LA RÉSERVE. Filmé image par image (banc nº 711) : le script
 * d'avant-peinture pose réserve (1989) + défilement (1145) ; corps
 * mesuré 1989 = la réserve elle-même ; le test se satisfait À LA
 * PREMIÈRE IMAGE, la réserve part, le document retombe à la hauteur
 * du squelette (1648) et le navigateur CLAMPE le défilement (804).
 * Que le retour finisse juste ou faux dépendait alors d'une SECONDE
 * course : `MemoireNavigation` ne repose la place que s'il lit le
 * drapeau `positionPosee` DÉJÀ effacé (voir sa garde) — d'où le
 * témoin B qui alternait, passe après passe.
 * LE TEST D'AUJOURD'HUI : « le DOCUMENT DÉPASSE la réserve »,
 * STRICTEMENT — tant que la réserve tient, le document ne peut pas
 * faire PLUS qu'elle ; seul le vrai contenu arrivé peut la dépasser.
 * La libération n'a donc plus rien à quoi se tromper, le défilement
 * posé avant peinture ne bouge plus, et le drapeau tient jusqu'au
 * vrai contenu — la seconde course se referme d'elle-même.
 * ⚠️ LE CONTENU PLUS COURT QUE LA RÉSERVE (une recherche revenue
 * avec moins de cartes) ne la dépasse jamais : c'est le rôle du
 * délai de cinq secondes, INCHANGÉ — le filet d'origine.
 */
/**
 * ██ nº 813 — UNE RÉSERVE APPARTIENT À SA PAGE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE, ENFIN NOMMÉ : « sur la page de connexion,
 * venant de l'accueil après un aller-retour, les titres sous les
 * cartes de l'accueil apparaissent COUPÉS DE MOITIÉ, partie basse
 * seule, et disparaissent au bout de 2-3 secondes ».
 * CE QUI SE PASSAIT, mesuré au banc (nº 813) : le retour sur l'accueil
 * rend sa place — réserve `min-height` de 1126 px sur <html>, position
 * posée. Le contenu de l'accueil ne DÉPASSE pas cette réserve (nº 711,
 * strictement), elle attend donc son délai de cinq secondes. Si l'on
 * quitte l'accueil pendant ce temps — l'accès au compte, deux secondes
 * après le retour —, la réserve SUIT sur la page de connexion : son
 * document fait 1126 px pour 968 px de contenu, jusqu'à ce que le délai
 * tombe (relevé : `min-height` retiré 2,5 s après l'arrivée). Sous le
 * bord bas du contenu, le navigateur du téléphone garde alors ses
 * tuiles de l'accueil — coupées à ce bord, d'où « la partie basse
 * seule » — jusqu'au retrait de la réserve, qui rétrécit le document
 * et force la repeinte. La nº 812 avait cherché une superposition de
 * pages : il n'y en a pas, c'est une hauteur qui traîne.
 * LA RÈGLE : une réserve, comme une attente de contenu, appartient à
 * la page pour laquelle elle a été posée. Dès que le chemin change,
 * elle est libérée sur-le-champ — sans attendre ni le dépassement ni
 * le délai. `ouvrirLaListeEnHaut` (nº 424) faisait déjà ce ménage pour
 * une recherche neuve ; ceci le fait pour TOUTE page quittée.
 * ⚠️ LE CHEMIN, PAS LA RECHERCHE : changer de critères sur la même page
 * reste l'affaire de la nº 424 ; ici on ne regarde que `pathname`.
 */
function pageQuittee(cheminPose: string): boolean {
  return window.location.pathname !== cheminPose;
}

function surveillerLaReserve(reserve: number) {
  arreter?.();
  const racine = document.documentElement;
  const cheminPose = window.location.pathname;
  cheminDeLaReserve = cheminPose;
  /*  §1 (nº 711) — LA RÉSERVE VIVANTE, PAS LA RECALCULÉE : la reprise
      du script (`reprendreLaReserveDuScript`) refait « position +
      innerHeight » — or sur un téléphone, la barre d'adresse fait
      varier `innerHeight` entre la pose du script et la reprise. Une
      réserve recalculée PLUS PETITE que le `min-height` réellement
      posé serait « dépassée » par lui : l'auto-satisfaction par une
      autre porte. On borne sur ce que <html> porte VRAIMENT. */
  reserve = Math.max(reserve, parseFloat(racine.style.minHeight) || 0);
  const limite = performance.now() + ATTENTE_MAX_MS;
  let image = 0;
  const liberer = () => {
    racine.style.minHeight = "";
    delete racine.dataset.positionPosee;
    arreter = null;
    cheminDeLaReserve = null;
  };
  const surveiller = () => {
    //  §1 (nº 711) — le DÉPASSEMENT strict, seule preuve du contenu.
    //  nº 813 — et la page quittée libère tout de suite.
    if (
      pageQuittee(cheminPose) ||
      document.documentElement.scrollHeight > reserve ||
      performance.now() > limite
    ) {
      liberer();
      return;
    }
    image = requestAnimationFrame(surveiller);
  };
  image = requestAnimationFrame(surveiller);
  arreter = () => {
    cancelAnimationFrame(image);
    liberer();
  };
}

/**
 * POSE LA PAGE À `position`. `cle` est l'adresse canonique sous
 * laquelle cette position a été rangée : sans correspondance avec
 * l'adresse courante, on ne touche à rien.
 */
export function poserLaPosition(
  position: number,
  cle?: string,
  /** §3 (nº 426) — POURQUOI cette pose : écrit dans la ligne POSE du
      journal. Plus aucun poseur anonyme. */
  raison = "(raison non dite)"
) {
  //  RIEN À RESTITUER : ON NE TOUCHE À RIEN (nº 185-b).
  if (position <= 0) {
    return;
  }
  //  UNE POSITION APPARTIENT À SA RECHERCHE (nº 185-c).
  const adresse = adresseDeRechercheCourante();
  if (cle !== undefined && cle !== adresse) {
    return;
  }
  /**
   * §1 (nº 337) — ON ATTEND QUE LE CONTENU SOIT LÀ.
   * ------------------------------------------------------------------
   * CE QUI SE PASSAIT : la réserve de hauteur et le défilement étaient
   * posés SUR-LE-CHAMP. Sur un document qui n'a pas fini d'arriver, on
   * se retrouvait à 900 px dans un document de 1744 px entièrement
   * VIDE — c'est l'écran nu que le propriétaire voit depuis des passes,
   * et il l'a diagnostiqué lui-même. La règle vit maintenant dans
   * lib/pose-sur-contenu, avec la mesure qui l'a établie.
   * ⚠️ QUAND LE CONTENU EST DÉJÀ LÀ — le dégel d'une surface, un retour
   * de client où React n'a rien démonté — la première mesure passe et
   * l'on pose dans la foulée : rien n'est retardé.
   */
  attendreLeContenu(position, () => {
    //  ⚠️ JAMAIS UN GESTE (nº 154-§6A) : une restitution de position est
    //  posée PAR LE SITE. Sans l'annoncer, la barre y lisait un geste et
    //  repliait sa rangée de recherche à l'arrivée sur la page.
    const reserve = position + window.innerHeight;
    document.documentElement.style.minHeight = `${reserve}px`;
    defilerSansGeste({ top: position, left: 0 }, `restitution — ${raison}`);
    surveillerLaReserve(reserve);
  });
}

/** L'attente en cours, pour ne jamais en laisser traîner deux. */
let attenteEnCours: (() => void) | null = null;

/**
 * ATTENDRE QUE LE CONTENU ATTEIGNE LA POSITION, PUIS POSER — dans la
 * MÊME image, avant sa peinture. Voir lib/pose-sur-contenu pour la
 * règle, la mesure qui l'a établie, et pourquoi on masque en attendant.
 */
function attendreLeContenu(position: number, poser: () => void) {
  attenteEnCours?.();
  const racine = document.documentElement;
  const cheminPose = window.location.pathname;
  cheminDeLAttente = cheminPose;
  const limite = performance.now() + ATTENTE_CONTENU_MS;
  let image = 0;
  const demasquer = () => {
    racine.style.visibility = "";
    delete racine.dataset[MARQUE_ATTENTE];
    attenteEnCours = null;
    cheminDeLAttente = null;
  };
  //  LE CAS LE PLUS FRÉQUENT, ET IL NE COÛTE RIEN : le contenu est déjà
  //  là. On ne masque même pas.
  if (contenuAtteint(position)) {
    poser();
    return;
  }
  const essayer = () => {
    //  nº 813 — la page quittée : on démasque et l'on ne pose RIEN,
    //  une position de l'ancienne page n'a rien à faire sur la neuve.
    if (pageQuittee(cheminPose)) {
      demasquer();
      return;
    }
    if (contenuAtteint(position) || performance.now() > limite) {
      poser();
      demasquer();
      return;
    }
    image = requestAnimationFrame(essayer);
  };
  //  §1 (nº 339) — L'INSTANT, et non « 1 » : la sonde du retour en a
  //  besoin pour dire depuis combien de temps l'écran est masqué.
  racine.dataset[MARQUE_ATTENTE] = String(Date.now());
  racine.style.visibility = "hidden";
  image = requestAnimationFrame(essayer);
  attenteEnCours = () => {
    cancelAnimationFrame(image);
    demasquer();
  };
}

/**
 * §1 (nº 424) — ANNULER LA RESTITUTION EN VOL, EXPLICITEMENT.
 * ==================================================================
 * LE DÉFAUT QU'ELLE FERME : une restitution est un travail DIFFÉRÉ —
 * `attendreLeContenu` guette jusqu'à 2,5 s que le document atteigne la
 * position avant de poser, et `surveillerLaReserve` tient la hauteur
 * réservée jusqu'à 5 s. Si, PENDANT cette fenêtre, l'utilisateur lance
 * une RECHERCHE (une liste neuve, qui doit s'ouvrir en haut), la vieille
 * pose se déclenchait quand le nouveau contenu atteignait enfin la
 * position… et redescendait la liste neuve à la place de l'ancienne —
 * « les résultats s'affichent mais je suis en bas de page ». En ligne,
 * où les cartes mettent des secondes à monter le document, la fenêtre
 * est grande ouverte ; au banc local, elle est presque infranchissable.
 * L'appelant est UNIQUE : `ouvrirLaListeEnHaut` (lib/liste-neuve) — le
 * geste qui dit « liste neuve » tue toute restitution pendante.
 */
export function annulerLaRestitutionEnCours() {
  attenteEnCours?.();
  arreter?.();
}

/**
 * nº 813 — LIBÉRER TOUT DE SUITE CE QUI APPARTIENT À UNE PAGE QUITTÉE.
 * Les deux boucles se retirent d'elles-mêmes dès qu'elles voient le
 * chemin changer (`pageQuittee`), mais elles ne regardent qu'à l'image
 * suivante : au web, mesuré, la réserve de l'accueil vivait encore UNE
 * image sur la connexion. `DefilementEnHaut` appelle ceci dans son
 * effet d'avant peinture, au changement de chemin : rien de l'ancienne
 * page ne passe la première image de la nouvelle. Une restitution
 * posée POUR la page courante n'est pas touchée — c'est ce qui rend
 * l'appel sûr quel que soit l'ordre des effets.
 */
export function libererSiPageQuittee() {
  if (cheminDeLAttente !== null && pageQuittee(cheminDeLAttente)) {
    attenteEnCours?.();
  }
  if (cheminDeLaReserve !== null && pageQuittee(cheminDeLaReserve)) {
    arreter?.();
  }
}

/**
 * RENDRE LA PLACE D'UNE ADRESSE — LA SEULE PORTE DU RETOUR
 * ==================================================================
 * §1 (nº 335) — UNE PLACE, C'EST DEUX CHOSES, ET ELLES SE RENDENT
 * ENSEMBLE : la position de défilement, et l'état de la rangée de
 * recherche qui allait avec. Les rendre séparément, c'était le défaut :
 * la position revenait juste, la réserve de la barre revenait dépliée,
 * et le contenu se retrouvait un cran plus bas — puis remontait tout
 * seul quand la barre se repliait enfin. Voir lib/reserve-barre.
 *
 * ⚠️ LA RANGÉE D'ABORD, LA POSITION ENSUITE, DANS LA MÊME TÂCHE : React
 * vide sa file avant la peinture suivante, la réserve et le défilement
 * changent donc pour la MÊME image. Aucune image intermédiaire.
 *
 * DEUX APPELANTS, ET DEUX SEULEMENT : `MemoireNavigation` et
 * `DefilementEnHaut`. Toute autre restitution passerait à côté de la
 * rangée.
 */
export function rendreLaPlace(url: string, raison = "(raison non dite)") {
  const place = lireLaPlace(url);
  /*  §1 (nº 660) — CE QU'ON A LU, ET SOUS QUELLE CLÉ. C'est la
      première des trois questions du propriétaire — « quand elle lit
      une note, laquelle, quelle valeur, et si elle l'applique » : la
      clé canonique, le contenu trouvé, et la raison de la lecture. La
      DÉCISION qui suit s'écrit dans `poserLaPosition`, juste après ;
      les deux lignes se lisent ensemble. */
  if (!place) {
    //  Rien à rendre : on ne touche à rien, ni à la page ni à la barre.
    poserLaPosition(0, undefined, raison);
    return;
  }
  rendreLEtatDeRangee(place.p);
  poserLaPosition(place.y, adresseDeRecherche(url), raison);
}

/**
 * LE SCRIPT BLOQUANT A-T-IL DÉJÀ POSÉ LA POSITION ?
 * À consulter par tout ce qui déplacerait la page au premier rendu : la
 * remontée en haut, par exemple, l'annulait sans le savoir — et la page
 * repartait de zéro alors que tout avait été fait correctement avant la
 * première peinture.
 */
export function positionDejaPosee(): boolean {
  return Boolean(document.documentElement.dataset.positionPosee);
}

/**
 * REPREND LA RÉSERVE POSÉE PAR LE SCRIPT BLOQUANT (au chargement du
 * document). Rend la position qu'il a posée, ou 0 s'il n'a rien fait.
 * Le script laisse un filet de sécurité de son côté : si React ne
 * démarre jamais, la réserve part quand même.
 */
export function reprendreLaReserveDuScript(): number {
  const pose = document.documentElement.dataset.positionPosee;
  if (!pose) return 0;
  const position = Number(pose) || 0;
  if (position > 0) surveillerLaReserve(position + window.innerHeight);
  return position;
}
