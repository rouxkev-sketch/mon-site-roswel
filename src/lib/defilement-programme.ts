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

//  §3 (nº 426) — TOUTE POSE S'ÉCRIT : la ligne signée du poseur, et le
//  rabotage relevé. Le journal est celui de la sonde (journal-bascule),
//  il ne coûte rien désarmé.
import { noter } from "@/lib/journal-bascule";
/*  ██ §1 (nº 660) — LES MÊMES LIGNES, AUSSI DANS LA BOÎTE NOIRE ██
    ==================================================================
    POURQUOI ICI D'ABORD. Ce module est LE POINT DE PASSAGE OBLIGÉ de
    tout défilement posé par le site (`defilerSansGeste`), de la garde
    de position et de ses recalages annulés. Il écrivait déjà tout —
    mais au journal de la SONDE (`noter`), qui se tait tant qu'on ne
    l'a pas armée AVANT le défaut. Le propriétaire, lui, constate le
    défaut APRÈS coup : il lui faut une trace qui tourne toujours.
    ⚠️ AUCUNE DÉCISION NE CHANGE : chaque `noterNavigation` est posé À
    CÔTÉ d'un `noter` existant, sur la même chaîne, dans la même
    branche. C'est la règle de la nº 654, appliquée une seconde fois.
    ⚠️ CE QUE ÇA COÛTE : une lecture et une écriture de
    `sessionStorage` par POSE — jamais par image, jamais dans une
    boucle d'animation (voir `defilerEnDouceur`, qui ne signe que son
    arrivée). */
import { noterNavigation } from "@/lib/boite-noire";
//  §2 (nº 427) — le témoin du geste : la garde de position ne défend
//  une pose que contre les mouvements qu'AUCUN doigt n'explique.
//  §1 (nº 626) — `appareilTactile` n'est plus importé : la garde ne
//  demande plus l'appareil (voir sa note). La fonction reste exportée
//  par geste-toucher, où d'autres la lisent.
import {
  auDebutDuGeste,
  gesteDeDefilementPlausible,
} from "@/lib/geste-toucher";

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

export function defilerSansGeste(
  options: ScrollToOptions,
  /** §3 (nº 426) — QUI POSE. Chaque pose écrit sa ligne au journal :
      plus aucun poseur anonyme. Les appelants se nomment ; un appel
      sans signature s'écrit « (non signé) » — c'est déjà un indice. */
  signature = "(non signé)"
): void {
  if (typeof window === "undefined") return;
  document.documentElement.dataset[MARQUEUR] = "1";
  const cible = typeof options.top === "number" ? Math.round(options.top) : null;
  window.scrollTo({ behavior: "instant", ...options });
  /*  §3 (nº 426) — LE RABOTAGE, RELEVÉ SUR-LE-CHAMP : `scrollTo`
      « instant » est synchrone, la position d'après l'appel est déjà
      la position rabotée si le document était trop court. */
  const obtenu = Math.round(window.scrollY);
  //  §1 (nº 660) — la même ligne aux deux journaux : la sonde (muette
  //  désarmée) et la boîte noire (qui tourne toujours).
  const dit =
    cible !== null && Math.abs(obtenu - cible) > 1
      ? `POSE DE DÉFILEMENT · vers ${cible} · par ${signature} · ` +
        `RABOTÉE à ${obtenu} (document ${Math.round(
          document.documentElement.scrollHeight
        )})`
      : `POSE DE DÉFILEMENT · vers ${cible ?? "?"} · par ${signature}`;
  noter(dit);
  noterNavigation(dit);
  lever(FENETRE_MS);
  /*  §2 (nº 427) — LA POSE ARME LA GARDE : ce qui vient d'être posé
      sera TENU tant qu'aucun geste ne reprend la main (voir le bloc de
      la garde plus bas). Sur la CIBLE, pas sur l'obtenu : si le
      document n'était pas encore assez haut, la première annulation
      s'alignera d'elle-même sur ce qui existe. Une pose douce
      (`smooth`) n'arme rien : sa position finale appartient au
      navigateur, on ne saurait pas quoi défendre. */
  if (cible !== null && options.behavior !== "smooth") {
    armerLaGardeDePosition(cible, signature);
  }
}

/**
 * ██ §2 (nº 427) — LA GARDE DE POSITION : UNE POSE TIENT SANS DOIGT ██
 * ==================================================================
 * LE RELEVÉ QUI L'A RENDUE NÉCESSAIRE (iPhone, sonde de la nº 426) :
 * une recherche validée, la liste neuve posée à 0… puis « RANGÉE ·
 * delta 1730 px ignoré (mouvement du site) » — SANS AUCUNE LIGNE POSE
 * entre les deux. C'est l'ancrage de WebKit qui recale le défilement
 * après le rendu de la nouvelle liste, APRÈS notre pose. La ligne
 * « ignoré » protégeait le volet ; PERSONNE ne corrigeait la
 * position : l'ancre gagnait, et la recherche s'ouvrait en bas.
 * `overflow-anchor: none` est posé partout depuis la nº 150 — WebKit
 * est le seul moteur à l'ignorer (mesuré nº 424), et il n'offre aucun
 * autre interrupteur.
 *
 * LA RÈGLE, POSÉE PAR LE PROPRIÉTAIRE : après une pose du site, la
 * position TIENT tant que l'utilisateur n'a pas repris la main. Tout
 * déplacement sans toucher ni lancée plausible (lib/geste-toucher) est
 * REPOSÉ sur-le-champ, et s'écrit — « RECALAGE D'ANCRE ANNULÉ ». La
 * garde se lève au premier début de geste : un doigt, une molette, une
 * touche de défilement.
 *
 * ██ §1 (nº 626) — ELLE VIT PARTOUT, ET LA BORNE TACTILE ÉTAIT FAUSSE ██
 * ------------------------------------------------------------------
 * CE QUI ÉTAIT ÉCRIT ICI : « elle ne vit que sur écran tactile —
 * ailleurs, l'ascenseur défile sans émettre le moindre événement de
 * toucher, la garde y lirait un recalage et collerait la page ; et
 * l'ancrage y est déjà coupé par le CSS, que tous les moteurs sauf
 * WebKit honorent ».
 * LES DEUX MOITIÉS ONT CESSÉ D'ÊTRE VRAIES, ET LE RELEVÉ DU
 * PROPRIÉTAIRE (Mac, 1665 px, nº 626) le prouve mot pour mot :
 *     POSE DE DÉFILEMENT · vers 0 · par liste neuve, à son arrivée
 *     rendu mosaïque · 16 cartes
 *     RANGÉE · delta 972 px ignoré (mouvement du site)
 *     ADRESSE pushState +1 image · cartes 16 · PAGE À 972
 * — la même signature qu'à la nº 427 : notre pose, puis un saut SANS
 * AUCUNE LIGNE POSE entre les deux. C'est l'ancre, et elle recale sur
 * un ORDINATEUR : SAFARI SUR MAC EST WEBKIT. « Web » n'a jamais voulu
 * dire « pas WebKit » — la borne supposait le contraire.
 * ET L'ASCENSEUR N'EST PLUS UN DANGER : la nº 428 a ajouté `mousedown`
 * aux sources de geste (voir lib/geste-toucher). Traîner l'ascenseur,
 * cliquer, tourner la molette, presser une touche de défilement —
 * chacun lève la garde AVANT que la page ne bouge. La phrase d'origine
 * décrivait un module qui n'écoutait que les touchers ; il en écoute
 * quatre depuis.
 * ⚠️ ET LE PIRE CAS RESTE BORNÉ, comme avant : au-delà de douze
 * recalages annulés, la garde cède (voir juste dessous) — se battre
 * contre un mécanisme inconnu ferait pire que le laisser faire.
 * ⚠️ ELLE NE SE FIE PAS AU DRAPEAU ci-dessus : le relevé montre le
 * recalage tombant EN PLEIN DANS la fenêtre du drapeau (6 ms après le
 * rendu). Elle compare des POSITIONS : notre propre pose retombe
 * exactement sur la position gardée — un recalage, non.
 * ⚠️ ELLE MEURT AVEC SA PAGE : l'adresse est retenue à l'armement ;
 * si elle a changé, la position gardée ne décrit plus rien et la
 * garde se tait.
 */
const TOLERANCE_DE_GARDE_PX = 2;
/**
 * ██ §1 (nº 661) — LA GARDE NE PEUT PLUS DORMIR ██
 * ==================================================================
 * LE DÉFAUT, MESURÉ PAR LE PROPRIÉTAIRE (boîte noire, 27-08 12:42).
 * Clic « Explorer les styles » depuis un document COURT (788 px) :
 *   12:42:37.511  DÉFILEMENT EN HAUT · remontée · /
 *   12:42:37.538  MÉMOIRE · page à 1002
 * Vingt-sept millisecondes, mille deux pixels — et l'observateur des
 * déplacements (nº 660) annonce « 0 déplacement ». La page a donc
 * bougé SANS QU'AUCUN ÉVÉNEMENT `scroll` NE SOIT ÉMIS : c'est la
 * signature d'un recalage appliqué PENDANT LA MISE EN PAGE, quand le
 * document grandit (788 → 1790 en attrapant le contenu de l'accueil)
 * — restauration native de l'entrée d'historique, ou ancrage.
 * CE QUE ÇA DIT DE LA GARDE : elle était réveillée par le seul
 * événement `scroll`. Sans événement, elle ne se réveillait jamais —
 * elle tenait une position que personne ne venait lui contester, et
 * la page partait quand même.
 * LE REMÈDE, ET IL NE CHANGE AUCUNE DÉCISION : une VEILLE PAR IMAGE,
 * bornée dans le temps, qui appelle EXACTEMENT le même juge
 * (`surDefilementSousGarde`). Ni tolérance nouvelle, ni règle nouvelle
 * — un second réveil pour un juge qui existait déjà.
 * ⚠️ BORNÉE, ET COURTE : mille deux cents millisecondes après
 * l'armement. C'est la fenêtre pendant laquelle un document grandit et
 * pose ses images ; au-delà, l'événement `scroll` suffit — c'est lui
 * qu'émet un vrai geste. Une veille perpétuelle ferait tourner une
 * boucle d'images pour rien sur chaque page du site.
 * ⚠️ CE QU'ELLE COÛTE AU REPOS : un `Math.round(window.scrollY)` par
 * image pendant ces 1,2 s. Le juge sort à la première ligne quand
 * l'écart tient dans la tolérance.
 */
const VEILLE_PAR_IMAGE_MS = 1200;
let veilleParImage = 0;
/** Au-delà, on cède : un mécanisme inconnu repose en boucle, et se
    battre contre lui ferait pire que le laisser faire. Chaque
    annulation s'écrit — le journal montrera qui c'était. */
const RECALAGES_ANNULES_MAX = 12;

type GardeDePosition = {
  position: number;
  signature: string;
  adresse: string;
  annulations: number;
};
let garde: GardeDePosition | null = null;
let veilleusePosee = false;

/** ARMER LA GARDE sur `position`. Appelée par chaque pose instantanée
    de ce module, et par les deux poses brutes de PageRechercheMobile.
    §1 (nº 626) — SUR TOUS LES APPAREILS : la borne tactile est levée,
    voir le bloc ci-dessus. */
export function armerLaGardeDePosition(
  position: number,
  signature: string
): void {
  if (typeof window === "undefined") return;
  garde = {
    position: Math.round(position),
    signature,
    adresse: window.location.pathname + window.location.search,
    annulations: 0,
  };
  poserLaVeilleuse();
  //  §1 (nº 661) — L'ARMEMENT SE SIGNE, comme les recalages qu'il
  //  annulera : le propriétaire doit pouvoir vérifier que la garde
  //  était bien en place au moment où la page a bougé.
  noterNavigation(
    `GARDE DE POSITION · armée sur ${Math.round(position)} · ` +
      `par « ${signature} » · page à ${Math.round(window.scrollY)}`
  );
  veillerParImage();
}

/**
 * §1 (nº 661) — LA VEILLE PAR IMAGE, redémarrée à chaque armement.
 * Elle ne juge rien : elle réveille le juge. Voir le bloc de
 * `VEILLE_PAR_IMAGE_MS` pour la mesure qui l'a rendue nécessaire.
 */
function veillerParImage(): void {
  cancelAnimationFrame(veilleParImage);
  const limite = performance.now() + VEILLE_PAR_IMAGE_MS;
  const regarder = () => {
    //  Garde levée (un geste, un changement d'adresse) ou fenêtre
    //  écoulée : la veille s'arrête d'elle-même.
    if (!garde || performance.now() > limite) {
      veilleParImage = 0;
      return;
    }
    surDefilementSousGarde();
    veilleParImage = requestAnimationFrame(regarder);
  };
  veilleParImage = requestAnimationFrame(regarder);
}

/** DÉSARMER LA GARDE — pour une surface qui déplace la page POUR
    ELLE-MÊME (le gel d'une fiche, l'ouverture de la page de
    recherche) : la position gardée ne décrit plus l'écran, la
    défendre combattrait la surface. Le dégel et la sortie re-arment
    en reposant. */
export function desarmerLaGardeDePosition(): void {
  garde = null;
}

function poserLaVeilleuse(): void {
  if (veilleusePosee) return;
  veilleusePosee = true;
  //  « La garde se lève au premier vrai toucher » — et il n'a même pas
  //  besoin de faire défiler : dès que l'utilisateur a la main, la
  //  position lui appartient. §3 (nº 428) — la SOURCE du geste est
  //  nommée dans la ligne : le relevé dira si une levée était légitime
  //  (doigt posé, molette) ou n'aurait pas dû exister.
  auDebutDuGeste((source) => {
    if (!garde) return;
    const dit =
      `GARDE DE POSITION · levée (geste : ${source}) · ` +
      `elle tenait ${garde.position} pour « ${garde.signature} »`;
    noter(dit);
    noterNavigation(dit);
    garde = null;
  });
  window.addEventListener("scroll", surDefilementSousGarde, {
    passive: true,
  });
}

function surDefilementSousGarde(): void {
  const g = garde;
  if (!g) return;
  //  La page a changé d'adresse depuis l'armement : cette position ne
  //  décrit plus rien ici, on se tait.
  if (window.location.pathname + window.location.search !== g.adresse) {
    garde = null;
    return;
  }
  const y = Math.round(window.scrollY);
  const ecart = y - g.position;
  if (Math.abs(ecart) <= TOLERANCE_DE_GARDE_PX) return;
  //  Un mouvement porté par un geste : l'utilisateur a la main, la
  //  garde n'a plus rien à défendre. (Le doigt était peut-être déjà
  //  posé avant l'armement — l'abonnement au DÉBUT du geste ne l'a
  //  alors pas vu passer ; ce second chemin le couvre.)
  if (gesteDeDefilementPlausible()) {
    const dit =
      `GARDE DE POSITION · levée (défilement porté par un geste) · ` +
      `elle tenait ${g.position} pour « ${g.signature} » · page à ${y}`;
    noter(dit);
    noterNavigation(dit);
    garde = null;
    return;
  }
  g.annulations += 1;
  if (g.annulations > RECALAGES_ANNULES_MAX) {
    const dit =
      `GARDE DE POSITION · RENDUE (${RECALAGES_ANNULES_MAX} recalages ` +
      `annulés sans geste — un mécanisme repose en boucle, je cède) · ` +
      `la page part à ${y}, elle tenait ${g.position}`;
    noter(dit);
    noterNavigation(dit);
    garde = null;
    return;
  }
  //  LE RECALAGE EST ANNULÉ : on repose la position gardée, en
  //  l'annonçant (la barre ne doit pas lire NOTRE re-pose comme un
  //  geste). `scrollTo` « instant » est synchrone : l'événement que ce
  //  re-pose déclenchera retombera exactement sur la position gardée,
  //  et repassera ici sans rien faire — aucune boucle possible.
  document.documentElement.dataset[MARQUEUR] = "1";
  window.scrollTo({ top: g.position, left: 0, behavior: "instant" });
  const obtenu = Math.round(window.scrollY);
  const dit =
    `RECALAGE D'ANCRE ANNULÉ · ${ecart > 0 ? "+" : ""}${ecart} px → ` +
    `reposé à ${g.position}` +
    (Math.abs(obtenu - g.position) > 1
      ? ` (obtenu ${obtenu} : le document s'arrête là — la garde s'y range)`
      : "") +
    ` · garde de « ${g.signature} »`;
  noter(dit);
  noterNavigation(dit);
  if (Math.abs(obtenu - g.position) > 1) g.position = obtenu;
  lever(FENETRE_MS);
}

/**
 * ██ §1 (nº 426) — LE SITE ANNONCE AUSSI SES CHANGEMENTS DE HAUTEUR ██
 * ==================================================================
 * LE DÉFAUT VISÉ : au premier « Voir plus » qui marche (nº 425), douze
 * cartes s'insèrent AU-DESSUS du lien qu'on vient de toucher. Sur
 * WebKit — Chrome sur iPhone EST WebKit — `overflow-anchor: none`
 * n'existe pas (la leçon mesurée de la nº 424) : l'ANCRAGE NATIF
 * garde le lien immobile à l'écran en AJUSTANT le défilement, et ces
 * ajustements arrivent comme des événements `scroll` qu'aucun doigt
 * n'a faits. La barre y lisait un GESTE : son cumul basculait, et la
 * rangée de recherche se rouvrait toute seule après le clic.
 * LA RÈGLE, LA MÊME QUE POUR NOS POSES : le site annonce. Celui qui
 * INSÈRE du contenu au-dessus du point de lecture appelle ceci ; les
 * écouteurs de geste se taisent le temps de la fenêtre (300 ms + deux
 * images), exactement comme pour un `defilerSansGeste`.
 */
export function annoncerMouvementDuSite(): void {
  if (typeof window === "undefined") return;
  document.documentElement.dataset[MARQUEUR] = "1";
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
  //  §2 (nº 427) — l'animation va produire une pluie de positions
  //  intermédiaires : aucune n'est « la » position à défendre. La
  //  garde se tait pendant le trajet, et se re-arme à l'arrivée.
  desarmerLaGardeDePosition();
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
   * jamais sauté. (C'était le procédé de la bascule de disposition de
   * la nº 162 ; celle-ci a disparu à la nº 443, son module à la
   * nº 603 — la réserve ci-dessous, elle, est bien vivante.)
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
    armerLaGardeDePosition(cible, "défilement en douceur");
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
    //  §2 (nº 427) — arrivé au bout du trajet, ce qui est posé se
    //  défend comme toute pose. (Une interruption par un geste, elle,
    //  n'arme rien : le doigt a la main.)
    armerLaGardeDePosition(cible, "défilement en douceur");
  };
  animationEnCours = requestAnimationFrame(avancer);
}
