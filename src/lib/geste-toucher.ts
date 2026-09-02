"use client";

/**
 * LE TÉMOIN DU GESTE — « AUCUN DOIGT POSÉ → PAS UN GESTE »
 * ==================================================================
 * (passe nº 427)
 *
 * CE QU'IL RÉPARE, PRIS SUR LE FAIT PAR DEUX RELEVÉS DE L'iPHONE :
 * l'ANCRAGE DE DÉFILEMENT de WebKit recale la page après un rendu
 * (« Voir plus », liste neuve) par des événements `scroll` qu'aucun
 * doigt n'a produits — et ces recalages tombent parfois PLUSIEURS
 * SECONDES après l'insertion, quand les images des cartes se posent.
 * Une fenêtre temporelle (les 300 ms de defilement-programme) ne peut
 * donc pas les couvrir toutes : il en tombera toujours un dehors, et
 * il sera lu comme un geste.
 *
 * LE PRINCIPE, POSÉ PAR LE PROPRIÉTAIRE (nº 427) : sur un écran
 * tactile, UN VRAI DÉFILEMENT COMMENCE PAR UN TOUCHER. Un delta sans
 * toucher actif ni inertie plausible n'est pas un geste — c'est le
 * navigateur qui recale, et l'on peut l'écarter (la barre) ou le
 * reposer (la garde de position) sans fenêtre ni minuterie.
 *
 * CE MODULE NE FAIT QU'OBSERVER : il écoute les touchers, la molette
 * et le clavier, et répond à une seule question — « ce mouvement
 * peut-il venir de l'utilisateur ? ». Il n'écrit PAS au journal (les
 * DÉCIDEURS écrivent, chacun avec sa raison) et ne déplace jamais
 * rien.
 *
 * L'INERTIE, MESURÉE AU CALME ET NON AU CHRONO : après le lâcher d'un
 * geste qui a bougé, le téléphone poursuit le défilement sur sa
 * lancée — une durée qui dépend de la pichenette. Plutôt qu'une
 * grande fenêtre fixe (qui avalerait les recalages tardifs, le défaut
 * même qu'on répare), l'inertie reste plausible TANT QUE les
 * événements de défilement s'enchaînent : 180 ms sans événement, et
 * elle est close. Un plafond absolu la borne quoi qu'il arrive.
 *
 * ⚠️ UN TAP N'ARME RIEN : un toucher qui n'a pas bougé (moins de
 * 9 px) ne peut pas laisser de lancée. C'est LE cas du « Voir plus » :
 * on tape, les cartes s'insèrent, l'ancre recale quelques centaines de
 * millisecondes plus tard — sans cette distinction, le recalage
 * tomberait dans la fenêtre du tap et passerait pour un geste.
 */

/** Le doigt franchit ce déplacement → le toucher est un DÉFILEMENT
    (en deçà, c'est un tap : il ne laisse aucune lancée derrière lui). */
const SEUIL_DE_MOUVEMENT_PX = 9;

/** La lancée vit tant que les événements de défilement s'enchaînent ;
    ce silence-là la clôt. (Pendant une lancée réelle ils arrivent à
    chaque image, ~16 ms : 180 ms de calme signent l'arrêt.) */
const CALME_MS = 180;

/** Une lancée ne dure jamais plus — la borne absolue de la fenêtre. */
const PLAFOND_DE_LANCEE_MS = 3000;

/** Les touches qui font défiler : elles valent un début de geste.
    (Tab y est : le navigateur défile de lui-même vers le champ qui
    reçoit le focus, et ce mouvement-là est bien voulu.) */
const TOUCHES_DE_DEFILEMENT = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Tab",
]);

let doigtPose = false;
let doigtABouge = false;
let departX = 0;
let departY = 0;
/** Jusqu'à quand une lancée (doigt lâché, molette, clavier) reste
    plausible — prolongée par chaque événement de défilement. */
let finDeLancee = 0;
/** Le moment où la lancée a été armée, pour le plafond absolu. */
let departDeLancee = 0;
/** §3 (nº 428) — le dernier événement de TOUCHER, pour démasquer les
    clics de souris SIMULÉS : après un tap, le téléphone rejoue le
    toucher en événements de souris (mousedown/click, quelques
    centaines de millisecondes plus tard). Le relevé Safari de la
    nº 428 montre une garde « levée (l'utilisateur a repris la
    main) » qu'aucun doigt n'explique : c'est ce fantôme-là. Un
    mousedown qui suit un toucher de moins de 1200 ms n'est PAS un
    geste neuf — il est ignoré. */
let dernierToucherA = -10_000;
const FANTOME_SOURIS_MS = 1200;

const abonnesAuDebut = new Set<(source: string) => void>();

/** L'APPAREIL A-T-IL UN ÉCRAN TACTILE ? Décidé une fois. Sur un écran
    sans toucher, le principe ne s'applique PAS : l'ascenseur de la
    fenêtre y défile sans émettre le moindre événement — et l'ancrage y
    est déjà coupé pour de bon (`overflow-anchor: none`, globals.css,
    que tous les moteurs honorent sauf WebKit). */
let tactileConnu: boolean | null = null;
export function appareilTactile(): boolean {
  if (tactileConnu !== null) return tactileConnu;
  if (typeof window === "undefined") return false;
  tactileConnu = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  return tactileConnu;
}

/**
 * CE MOUVEMENT PEUT-IL VENIR DE L'UTILISATEUR ? Vrai si un doigt qui a
 * bougé est posé en ce moment, ou si une lancée (doigt, molette,
 * touche de défilement) est encore plausible. Faux : le mouvement est
 * un recalage du navigateur — personne ne l'a demandé.
 */
export function gesteDeDefilementPlausible(): boolean {
  if (doigtPose && doigtABouge) return true;
  return performance.now() <= finDeLancee;
}

/**
 * AU PROCHAIN DÉBUT DE GESTE — un doigt posé, un cran de molette, une
 * touche de défilement, un bouton de souris — appeler `rappel`. Rend
 * le désabonnement. C'est la levée de la garde de position : « la
 * garde se lève au premier vrai toucher » (nº 427).
 * §3 (nº 428) — le rappel reçoit la SOURCE du geste (« doigt posé »,
 * « molette », « touche de défilement », « souris ») : la ligne de
 * levée la nomme, et le prochain relevé dira si une levée était
 * légitime ou déguisée.
 */
export function auDebutDuGeste(
  rappel: (source: string) => void
): () => void {
  abonnesAuDebut.add(rappel);
  return () => {
    abonnesAuDebut.delete(rappel);
  };
}

function annoncerLeDebut(source: string): void {
  for (const rappel of abonnesAuDebut) rappel(source);
}

function armerLaLancee(): void {
  departDeLancee = performance.now();
  finDeLancee = departDeLancee + CALME_MS;
}

/* LES ÉCOUTEURS — posés une fois à l'arrivée du module, passifs, et en
   capture : aucune surface qui arrête la propagation d'un toucher ne
   doit pouvoir priver le témoin de ce toucher-là. */
if (typeof window !== "undefined") {
  window.addEventListener(
    "touchstart",
    (evenement: TouchEvent) => {
      doigtPose = true;
      doigtABouge = false;
      dernierToucherA = performance.now();
      const premier = evenement.touches[0];
      if (premier) {
        departX = premier.clientX;
        departY = premier.clientY;
      }
      annoncerLeDebut("finger down");
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "touchmove",
    (evenement: TouchEvent) => {
      if (!doigtPose || doigtABouge) return;
      const premier = evenement.touches[0];
      if (!premier) return;
      if (
        Math.abs(premier.clientX - departX) > SEUIL_DE_MOUVEMENT_PX ||
        Math.abs(premier.clientY - departY) > SEUIL_DE_MOUVEMENT_PX
      ) {
        doigtABouge = true;
      }
    },
    { capture: true, passive: true }
  );
  const finDuToucher = (evenement: TouchEvent) => {
    dernierToucherA = performance.now();
    //  Tant qu'un doigt reste posé, le geste continue.
    if (evenement.touches.length > 0) return;
    //  Seul un toucher qui a BOUGÉ laisse une lancée ; un tap, rien.
    if (doigtABouge) armerLaLancee();
    doigtPose = false;
    doigtABouge = false;
  };
  window.addEventListener("touchend", finDuToucher, {
    capture: true,
    passive: true,
  });
  window.addEventListener("touchcancel", finDuToucher, {
    capture: true,
    passive: true,
  });
  //  La molette (et le trackpad, qui parle sa langue) : un geste sans
  //  toucher — chaque cran rouvre la fenêtre.
  window.addEventListener(
    "wheel",
    () => {
      armerLaLancee();
      annoncerLeDebut("molette");
    },
    { capture: true, passive: true }
  );
  //  Le clic : aucune lancée (un clic ne défile pas), mais c'est bien
  //  l'utilisateur qui a la main — la garde de position doit s'y lever.
  //  §3 (nº 428) — SAUF LE FANTÔME : après un tap, le téléphone rejoue
  //  le toucher en événements de souris. Ce mousedown-là n'est pas un
  //  geste neuf (le touchstart du tap a déjà parlé) : il est ignoré —
  //  sans quoi il levait la garde de position quelques centaines de
  //  millisecondes APRÈS la pose qu'elle venait de prendre en charge.
  window.addEventListener(
    "mousedown",
    () => {
      if (performance.now() - dernierToucherA < FANTOME_SOURIS_MS) return;
      annoncerLeDebut("souris");
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "keydown",
    (evenement: KeyboardEvent) => {
      if (!TOUCHES_DE_DEFILEMENT.has(evenement.key)) return;
      armerLaLancee();
      annoncerLeDebut("scroll key");
    },
    { capture: true, passive: true }
  );
  //  LA LANCÉE SE PROLONGE tant que le document défile réellement —
  //  sauf quand c'est le site qui pose : l'attribut de
  //  defilement-programme est lu directement sur <html> (c'est sa
  //  raison d'être : lisible de partout), pour ne pas créer de cycle
  //  d'imports entre les deux modules.
  window.addEventListener(
    "scroll",
    () => {
      if (document.documentElement.dataset.defilementProgramme) return;
      const maintenant = performance.now();
      if (
        maintenant <= finDeLancee &&
        maintenant - departDeLancee <= PLAFOND_DE_LANCEE_MS
      ) {
        finDeLancee = maintenant + CALME_MS;
      }
    },
    { passive: true }
  );
}
