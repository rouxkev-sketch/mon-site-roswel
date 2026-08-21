//  §2 (nº 427) — geler, c'est mettre le défilement à zéro SANS geste :
//  la garde de position y lirait un recalage d'ancre et combattrait la
//  surface. Elle est donc désarmée au gel ; le dégel re-arme en
//  reposant (poserLaPosition → defilerSansGeste).
import { desarmerLaGardeDePosition } from "@/lib/defilement-programme";
import { poserLaPosition } from "@/lib/restitution-position";

/**
 * LE GEL DU CORPS — L'ÉCRITURE UNIQUE (extraite nº 259-§3)
 * ==================================================================
 * D'OÙ IL VIENT. C'est le gel de la fenêtre de fiche (nº 226-§5) :
 * quand une surface s'ouvre par-dessus la page, le corps est FIGÉ EN
 * PLACE — sans quoi la page continue de défiler derrière, et l'on
 * revient ailleurs en refermant.
 *
 * POURQUOI IL EST SORTI DE FenetreFiche. La nº 259-§3 en demande un
 * second emploi : la feuille du menu au doigt. Le recopier, c'était
 * accepter deux comptes séparés — et un corps qui reste gelé pour de
 * bon dès qu'une feuille se ferme sous une fenêtre (ou l'inverse). Il
 * n'y a donc qu'UN compte, celui de ce module, et toutes les surfaces
 * le partagent.
 *
 * LA RÈGLE, INCHANGÉE (nº 226-§5) : LA PREMIÈRE SURFACE GÈLE, LA
 * DERNIÈRE DÉGÈLE. Les surfaces s'empilent (une feuille par-dessus une
 * fenêtre, une fenêtre par-dessus une fenêtre) ; refermer celle du
 * dessus ne doit jamais rendre la page tant qu'une autre vit dessous.
 *
 * COMMENT (et pourquoi ainsi) : on fige le CORPS en `position: fixed`
 * décalé de sa position (`top: -Ypx`), et on le rend à la fin.
 *  · COUPER `overflow` SUR LA RACINE NE MARCHE PAS : le défilement y
 *    retomberait à zéro, et la page sauterait en haut derrière la
 *    surface ;
 *  · LA POSITION EST RENDUE PAR `scrollTo` EN « instant » : le site
 *    déclare un défilement doux global — sans ce mot, la restitution
 *    serait une animation visible ;
 *  · C'EST LE PIÈGE D'iOS : un gel mal fait perd la position. Elle est
 *    donc retenue ICI, au moment du gel, et rendue telle quelle.
 *
 * ⚠️ LE DÉGEL EST IDEMPOTENT : la fonction rendue ne compte qu'une
 * fois, même appelée deux fois (React peut rejouer un nettoyage).
 */

/** COMBIEN DE SURFACES GÈLENT LE CORPS EN CE MOMENT. */
let surfacesQuiGelent = 0;

/** LA POSITION À RENDRE — celle de la PREMIÈRE surface qui a gelé. */
let positionRetenue = 0;

/** §1 (nº 329) — LE CHEMIN SUR LEQUEL LA POSITION A UN SENS. `null` :
    la surface ne l'a pas dit, on repose comme avant. */
let cheminDuGel: string | null = null;

/**
 * LA POSITION QUE LE GEL RENDRA — celle du corps DÉJÀ gelé quand une
 * surface vit dessous (`window.scrollY` y vaut zéro), la position
 * courante sinon. C'est elle qu'une surface doit retenir avant de
 * changer l'adresse.
 */
export function positionSousLeGel(): number {
  if (typeof document === "undefined") return 0;
  const corps = document.body.style;
  if (corps.position === "fixed") {
    return Math.abs(parseFloat(corps.top || "0")) || 0;
  }
  return window.scrollY;
}

/** Le corps est-il gelé en ce moment ? */
export function corpsGele(): boolean {
  return surfacesQuiGelent > 0;
}

/**
 * §1 (nº 330) — LA PAGE GELÉE REPARTIRA DE ZÉRO.
 * ==================================================================
 * LE DÉFAUT, RELEVÉ SUR L'iPHONE DU PROPRIÉTAIRE. Au doigt, un filtre
 * se choisit dans un PANNEAU DU BAS — et un panneau GÈLE LE CORPS. La
 * remontée demandée par `poserSelection` s'exécutait donc pendant le
 * gel, où `window.scrollTo` ne peut rien : le corps est
 * `position: fixed`, il n'y a plus rien à faire défiler. Puis le
 * panneau se refermait, et le DÉGEL reposait fidèlement l'ancienne
 * position. On restait au milieu de la liste.
 * ⚠️ ET LA nº 329-§2 A RENFORCÉ CE DÉFAUT-LÀ EN EN CORRIGEANT UN
 * AUTRE : depuis qu'il passe par `poserLaPosition`, le dégel est
 * devenu BIEN MEILLEUR à reposer exactement où l'on était. Il faut le
 * dire — la correction précédente est juste, c'est la remontée qui
 * arrivait au mauvais moment.
 * ⚠️ ET LE GARDE-FOU DU §1 DE LA nº 329 NE JOUE PAS ICI : il compare
 * les CHEMINS, et un filtre ne change que ce qui suit le `?`.
 *
 * CE QU'ON FAIT : on ne touche NI au corps figé, NI au défilement. On
 * change seulement la position QUE LE DÉGEL RENDRA. Rien ne bouge sous
 * le panneau encore ouvert (aucun saut visible), et quand il se ferme,
 * le corps rendu au flux repart naturellement de zéro — `poserLaPosition`
 * ne déplace alors rien (une position nulle ne déclenche rien).
 *
 * ⚠️ SANS GEL, ELLE NE FAIT RIEN, et c'est voulu : sur le web le
 * panneau ne recouvre pas la page et ne gèle rien. C'est l'appelant
 * qui fait défiler — voir `ouvrirLaListeEnHaut` (lib/liste-neuve),
 * l'écriture unique qui appelle les deux.
 */
export function laPositionDuGelRepartDeZero(): void {
  if (surfacesQuiGelent === 0) return;
  positionRetenue = 0;
}

/**
 * GELER LE CORPS — rend la fonction qui dégèle.
 * `position` : celle à retenir (par défaut, celle du moment). La
 * fenêtre de fiche donne la sienne, capturée AVANT son `pushState` :
 * le routeur déplace brièvement le défilement, et le lire après
 * donnerait n'importe quoi.
 */
export function gelerLeCorps(
  position = positionSousLeGel(),
  cheminAttendu?: string
): () => void {
  if (typeof document === "undefined") return () => {};
  const corps = document.body.style;
  surfacesQuiGelent += 1;
  if (surfacesQuiGelent === 1) {
    //  §2 (nº 427) — voir l'import : le gel déplace le défilement pour
    //  lui-même, la garde n'a plus rien à y défendre.
    desarmerLaGardeDePosition();
    positionRetenue = position;
    cheminDuGel = cheminAttendu ?? null;
    corps.position = "fixed";
    corps.top = `-${position}px`;
    corps.left = "0";
    corps.right = "0";
    corps.width = "100%";
  }
  let rendu = false;
  return () => {
    if (rendu) return;
    rendu = true;
    surfacesQuiGelent -= 1;
    if (surfacesQuiGelent > 0) return;
    corps.position = "";
    corps.top = "";
    corps.left = "";
    corps.right = "";
    corps.width = "";
    /*  §1 (nº 329) — ON NE REPOSE PAS UNE POSITION SUR UNE PAGE QUI
        N'EST PAS LA SIENNE.
        ------------------------------------------------------------------
        LE DÉFAUT, MESURÉ : depuis la fenêtre de carrousel, toucher le
        logo mène à l'accueil — et l'accueil s'ouvrait À 488 px,
        c'est-à-dire À LA POSITION DE LA FICHE qui était gelée dessous.
        Le dégel rendait fidèlement la place qu'il avait retenue, mais
        sur un écran qui n'avait rien à voir.
        ⚠️ C'EST LA nº 328-§4 QUI L'A OUVERT, et il faut le dire : ces
        deux commandes étaient des `<a>` — une navigation de DOCUMENT
        repart de zéro, le gel meurt avec la page. En les passant en
        navigation de CLIENT, le dégel s'est mis à survivre à la
        navigation. La note de la nº 285 avait raison sur ce point
        précis ; le §2 de la nº 328 réglait l'ÉCRITURE d'une position
        mémorisée, pas la RESTITUTION du gel.
        LA RÈGLE : une surface qui sait sur quelle page elle est posée
        le DIT au gel. Au dégel, si l'on n'est plus là, on ne repose
        rien — la page d'arrivée s'ouvre comme toute arrivée neuve,
        c'est-à-dire en haut (point 3 de la règle de navigation).
        ⚠️ CELLES QUI NE LE DISENT PAS gardent le comportement d'avant,
        à la lettre : `cheminDuGel` vaut alors `null` et l'on repose
        toujours. Aucune surface n'a changé de comportement sans
        l'avoir demandé. */
    if (cheminDuGel !== null && location.pathname !== cheminDuGel) {
      cheminDuGel = null;
      return;
    }
    cheminDuGel = null;
    /*  §2 (nº 329) — LA POSITION EST RENDUE AVEC SA RÉSERVE DE HAUTEUR.
        ------------------------------------------------------------------
        CE QUI ÉTAIT ÉCRIT : un `scrollTo` NU. Il suppose que le
        document a déjà sa hauteur définitive — or au moment où une
        surface se referme, la page dessous vient d'être rendue et ses
        images ne sont pas encore posées. Le document est donc PLUS
        COURT qu'il ne sera, et le navigateur RABOTE la demande à ce
        qu'il peut : on retombe « presque en haut », jamais à la place
        quittée. C'est exactement le défaut décrit au §2 de la nº 329.
        `poserLaPosition` fait les deux gestes dans le bon ordre —
        réserver la hauteur sur <html>, puis poser —, et libère la
        réserve dès que le contenu réel l'atteint. C'est l'écriture
        unique de la restitution depuis la nº 191 : le gel la rejoint
        au lieu d'en garder une seconde.
        ⚠️ SANS CLÉ D'ADRESSE : `poserLaPosition` refuse une position
        dont la clé ne correspond plus à la page. Ici la question est
        déjà tranchée juste au-dessus, par `cheminDuGel` — et la
        position d'un gel n'appartient pas à une RECHERCHE, elle
        appartient à la page qu'on a figée.
        ⚠️ UNE POSITION NULLE NE DÉCLENCHE RIEN, et c'est juste : le gel
        avait mis la page à zéro, elle y est encore. */
    poserLaPosition(positionRetenue, undefined, "dégel d\u2019une surface");
  };
}
