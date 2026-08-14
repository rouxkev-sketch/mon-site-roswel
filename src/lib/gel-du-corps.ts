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
 * GELER LE CORPS — rend la fonction qui dégèle.
 * `position` : celle à retenir (par défaut, celle du moment). La
 * fenêtre de fiche donne la sienne, capturée AVANT son `pushState` :
 * le routeur déplace brièvement le défilement, et le lire après
 * donnerait n'importe quoi.
 */
export function gelerLeCorps(position = positionSousLeGel()): () => void {
  if (typeof document === "undefined") return () => {};
  const corps = document.body.style;
  surfacesQuiGelent += 1;
  if (surfacesQuiGelent === 1) {
    positionRetenue = position;
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
    window.scrollTo({ top: positionRetenue, left: 0, behavior: "instant" });
  };
}
