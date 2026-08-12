"use client";

/**
 * UN DÉFILEMENT POSÉ PAR LE SITE N'EST PAS UN GESTE
 * ==================================================
 * ⚠️ CE MODULE RÉPARE « LA BARRE SE REPLIE TOUTE SEULE » (nº 154-§6A).
 *
 * LE DÉFAUT. Changer de disposition, ou montrer/masquer le texte des
 * cartes, REPOSE la page sur la carte qu'on regardait
 * (lib/carte-du-haut) — un `window.scrollTo` de plusieurs centaines de
 * pixels. Or la barre juge le GESTE de l'utilisateur en cumulant les
 * deltas de défilement (nº 150-§5) : ce saut, qu'aucun doigt n'a fait,
 * franchissait le seuil des 24 px et REPLIAIT la rangée de recherche.
 * Vu de l'écran : on touche un bouton d'affichage, et la barre se
 * rétracte sans que rien n'ait été fait défiler.
 *
 * LA RÈGLE. Le site annonce ses propres défilements. Pendant ce
 * court instant, les écouteurs qui interprètent un GESTE se taisent —
 * ils prennent acte de la nouvelle position, mais n'y lisent aucune
 * intention. Tout ce qui MESURE (la barre posée, la mémoire de
 * position) continue de travailler normalement.
 *
 * POURQUOI UN ATTRIBUT SUR `<html>` ET PAS UNE VARIABLE. Les
 * écouteurs vivent dans d'autres modules et d'autres composants ; un
 * attribut de document est lisible de partout, survit à un remontage,
 * et se voit dans l'inspecteur quand on cherche à comprendre.
 *
 * LA LEVÉE SE FAIT SUR DEUX IMAGES **ET** UN DÉLAI. `scrollTo` est
 * synchrone, mais l'événement `scroll` qu'il déclenche arrive à
 * l'image suivante — parfois bien plus tard.
 * ⚠️ DEUX IMAGES NE SUFFISAIENT PAS (nº 156-§3), et c'est la cause du
 * saut qui restait au changement de disposition : la bascule
 * RECOMPOSE toute la mosaïque (une colonne ↔ deux colonnes), le
 * document change de hauteur de plusieurs milliers de pixels, et le
 * navigateur en tire DEUX mouvements — notre remise en place, puis un
 * RE-BORNAGE quand la page raccourcit sous la position courante. Le
 * second arrivait après la levée du drapeau : la barre y lisait un
 * geste, et se repliait. La fenêtre couvre donc aussi ce second
 * temps.
 */

const MARQUEUR = "defilementProgramme";

/** La fenêtre pendant laquelle les défilements ne sont pas des gestes.
    Assez large pour couvrir le re-bornage d'une recomposition de
    mosaïque, assez courte pour ne jamais avaler un vrai geste : un
    doigt qui défile juste après avoir touché un bouton d'affichage
    met bien plus de 300 ms à revenir sur l'écran. */
const FENETRE_MS = 300;

/** Vrai pendant qu'un défilement posé par le site est en cours. */
export function estDefilementProgramme(): boolean {
  return typeof document !== "undefined"
    ? Boolean(document.documentElement.dataset[MARQUEUR])
    : false;
}

/**
 * DÉFILER SANS QUE CE SOIT UN GESTE. Même signature que
 * `window.scrollTo`, à ceci près que le mouvement est annoncé.
 * ⚠️ « instant » par défaut : le site déclare un défilement doux
 * global, et une restitution qui s'anime est une restitution qu'on
 * voit passer.
 */
let leveeEnCours = 0;

export function defilerSansGeste(options: ScrollToOptions): void {
  if (typeof window === "undefined") return;
  document.documentElement.dataset[MARQUEUR] = "1";
  window.scrollTo({ behavior: "instant", ...options });
  lever(FENETRE_MS);
}

/** La levée du drapeau, après un délai puis deux images (voir plus
    haut : le second mouvement d'une recomposition arrive tard). */
function lever(delai: number) {
  //  Un seul minuteur : deux remises en place rapprochées ne doivent
  //  pas laisser la première lever le drapeau de la seconde.
  window.clearTimeout(leveeEnCours);
  leveeEnCours = window.setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        delete document.documentElement.dataset[MARQUEUR];
      });
    });
  }, delai);
}

/**
 * DÉFILER EN DOUCEUR — départ progressif, arrivée amortie
 * ========================================================
 * (passe nº 209-§5b)
 *
 * POURQUOI PAS `behavior: "smooth"` : sa courbe et sa durée
 * appartiennent au navigateur, elles diffèrent d'un moteur à l'autre,
 * et rien ne dit quand le mouvement finit — or il faut tenir le
 * drapeau « ce n'est pas un geste » pendant TOUT le trajet, sans quoi
 * la barre s'y replie (nº 154-§6A).
 *
 * LA COURBE : `easeInOutCubic` — l'accélération est progressive au
 * départ, l'arrivée s'amortit, et il n'y a AUCUN rebond (une courbe
 * cubique ne dépasse jamais sa cible). 480 ms : assez pour qu'on suive
 * le mouvement de l'œil, assez court pour ne pas attendre.
 *
 * ⚠️ UN GESTE DE L'UTILISATEUR L'INTERROMPT : poser le doigt ou la
 * molette pendant l'animation l'annule à l'instant. Une page qui
 * continue de glisser sous un doigt qui la retient est le pire défaut
 * qu'un défilement animé puisse avoir.
 */
const DUREE_DOUCE_MS = 480;
let animationEnCours = 0;

/**
 * ⚠️ CE QUI S'ACCUMULAIT, ET QUI FIGEAIT LE PORTFOLIO (nº 217-§4)
 * ==================================================================
 * LE DÉFAUT. Chaque appel posait TROIS choses qui devaient être
 * reprises à la fin du mouvement :
 *   · DEUX ÉCOUTEURS sur `window` (`touchstart`, `wheel`), qui servent
 *     à interrompre l'animation si un doigt intervient ;
 *   · UNE RÉSERVE DE HAUTEUR sur `<html>` (`min-height`), le temps que
 *     la cible soit atteignable ;
 *   · LE DRAPEAU « ce n'est pas un geste » sur `<html>`.
 * Or un nouvel appel se contentait de `cancelAnimationFrame` : la
 * boucle précédente ne tournait plus, donc SA FIN N'ARRIVAIT JAMAIS —
 * ses deux écouteurs restaient posés pour toujours, et sa réserve avec
 * eux. Pire : le nouvel appel lisait `min-height` pour le restituer
 * plus tard, et lisait donc LA RÉSERVE DE L'ANIMATION AVORTÉE, qu'il
 * reposait à son arrivée. Le document gardait ainsi une hauteur
 * fantôme de plusieurs milliers de pixels, définitivement.
 * Dans le portfolio, où chaque changement d'onglet appelle cette
 * fonction, on empile deux écouteurs par geste — l'appareil finit par
 * ne plus répondre, et la page défile dans un vide qui n'existe pas.
 *
 * LA RÈGLE MAINTENANT : une animation en cours est TERMINÉE avant
 * qu'une autre commence — écouteurs retirés, réserve rendue, image
 * annulée. Il ne peut donc jamais y en avoir deux, ni une seule qui
 * traîne. `finirAnimation` est le SEUL chemin de sortie, et il est
 * idempotent.
 */
let finirAnimation: (() => void) | null = null;

export function defilerEnDouceur(cible: number): void {
  if (typeof window === "undefined") return;
  //  L'animation précédente est close pour de bon AVANT qu'on lise
  //  quoi que ce soit du document : sa réserve est déjà rendue, la
  //  hauteur qu'on s'apprête à lire est donc la vraie.
  finirAnimation?.();
  const depart = window.scrollY;
  const distance = cible - depart;
  document.documentElement.dataset[MARQUEUR] = "1";
  cancelAnimationFrame(animationEnCours);

  /**
   * ⚠️ LA CIBLE DOIT ÊTRE ATTEIGNABLE (nº 214-§1)
   * ------------------------------------------------------------------
   * LE DÉFAUT : changer d'onglet change la hauteur du contenu. Si la
   * nouvelle page est PLUS COURTE que la position visée, le navigateur
   * borne le défilement au bas du document — on s'arrête plus haut, et
   * il reste une marge. Depuis le haut de la page, la cible est petite
   * et le défaut ne se voit pas ; après avoir un peu défilé, il saute
   * aux yeux. La cible, elle, était déjà absolue : c'est le DOCUMENT
   * qui manquait de hauteur.
   * LA RÉSERVE : on garantit au document, le temps du mouvement, de
   * quoi poser la cible en haut de l'écran. Elle est relâchée à
   * l'arrivée — la page reprend alors sa vraie hauteur, sans avoir
   * jamais sauté (même procédé que lib/bascule-verrouillee).
   */
  const racine = document.documentElement;
  const reservePrecedente = racine.style.minHeight;
  racine.style.minHeight = `${Math.ceil(cible + window.innerHeight)}px`;
  const relacher = () => {
    racine.style.minHeight = reservePrecedente;
  };

  //  Rien à parcourir, ou l'utilisateur refuse les animations : on
  //  pose la position, et c'est tout.
  if (
    Math.abs(distance) < 2 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    window.scrollTo({ top: cible, left: 0, behavior: "instant" });
    //  La réserve tombe une image plus tard : le temps que la position
    //  soit prise en compte, jamais avant. Un appel qui surviendrait
    //  dans cet intervalle la rend d'abord (nº 217-§4) — sans quoi il
    //  la lirait comme « la hauteur d'origine » et la reposerait.
    finirAnimation = relacher;
    requestAnimationFrame(relacher);
    lever(FENETRE_MS);
    return;
  }

  let annulee = false;
  const interrompre = () => {
    annulee = true;
  };
  //  `passive` : on n'empêche rien, on prend seulement acte.
  window.addEventListener("touchstart", interrompre, { passive: true });
  window.addEventListener("wheel", interrompre, { passive: true });

  /** LE SEUL CHEMIN DE SORTIE — appelé à l'arrivée, à l'interruption
      par un doigt, ou par l'appel suivant. Idempotent : le repasser ne
      retire rien deux fois et ne rend aucune réserve étrangère. */
  let close = false;
  const clore = (differerLaReserve: boolean) => {
    if (close) return;
    close = true;
    cancelAnimationFrame(animationEnCours);
    window.removeEventListener("touchstart", interrompre);
    window.removeEventListener("wheel", interrompre);
    //  À l'arrivée, la réserve tombe une image plus tard (le temps que
    //  la position soit prise en compte) ; dans tous les autres cas,
    //  tout de suite — on ne laisse rien derrière soi.
    if (differerLaReserve) requestAnimationFrame(relacher);
    else relacher();
  };
  //  ⚠️ ON NE REMET PAS `finirAnimation` À `null` : une fois close,
  //  cette fermeture ne fait plus rien (`close`), et le prochain appel
  //  la remplacera. Un état de moins à tenir juste.
  finirAnimation = () => clore(false);

  const debut = performance.now();
  const avancer = (maintenant: number) => {
    if (annulee) {
      clore(false);
      lever(0);
      return;
    }
    const part = Math.min(1, (maintenant - debut) / DUREE_DOUCE_MS);
    //  easeInOutCubic — départ progressif, arrivée amortie.
    const adouci =
      part < 0.5 ? 4 * part * part * part : 1 - Math.pow(-2 * part + 2, 3) / 2;
    window.scrollTo({
      top: depart + distance * adouci,
      left: 0,
      behavior: "instant",
    });
    if (part < 1) {
      animationEnCours = requestAnimationFrame(avancer);
      return;
    }
    clore(true);
    lever(FENETRE_MS);
  };
  animationEnCours = requestAnimationFrame(avancer);
}
