/**
 * LA RÉSERVE DE LA BARRE — L'ÉCRITURE UNIQUE DU « CRAN » DU RETOUR
 * ==================================================================
 * (règle posée à la nº 218-§4, REFAITE à la nº 335-§1 avec l'accord du
 * propriétaire — « je t'autorise à reprendre le mécanisme, mais
 * seulement pour le retour ».)
 *
 * DE QUOI IL S'AGIT. Sur smartphone, la barre a quitté le flux et un
 * bloc invisible tient sa place (`data-reserve-barre`, EnTeteTatouage).
 * Ce bloc est DANS LE FLUX et il CHANGE DE HAUTEUR : haut quand la
 * rangée de recherche est dépliée, bas quand elle est repliée. Tout le
 * contenu descend ou monte avec lui. Deux `scrollY` identiques ne
 * montrent donc PAS le même contenu si la rangée n'est pas dans le même
 * état :
 *
 *       contenu regardé  =  scrollY  −  réserve du moment
 *
 * CE QUI ÉTAIT ÉCRIT, ET POURQUOI C'ÉTAIT À MOITIÉ JUSTE. La nº 218-§4
 * AJOUTAIT l'écart des deux hauteurs au moment de RANGER la position, et
 * posait la valeur telle quelle au retour. Cela suppose qu'on revient
 * TOUJOURS rangée dépliée — c'était vrai quand la règle a été écrite.
 * Ce ne l'est plus. Le propriétaire l'a mesuré : quitté à 900, rendu à
 * 958. Cinquante-huit pixels trop bas, exactement l'écart des deux
 * hauteurs, ET les cartes qui remontent d'autant après s'être
 * affichées : deux symptômes, une seule cause.
 *
 * ==================================================================
 * LA RÈGLE, MAINTENANT, ET ELLE TIENT EN UNE PHRASE :
 *
 *      ON RANGE LA POSITION **ET** L'ÉTAT DE LA RANGÉE QUI ALLAIT
 *      AVEC ; ON REND LES DEUX ENSEMBLE.
 *
 * ==================================================================
 * POURQUOI C'EST CELLE-LÀ ET PAS UN CALCUL. Tant qu'on ne rendait que
 * la position, il fallait DEVINER dans quel état la rangée serait à
 * l'arrivée pour savoir quoi ajouter ou retirer — et cet état n'est pas
 * connu au moment où l'on pose : la rangée se replie APRÈS, quand le
 * navigateur lit le défilement qu'on vient de poser. C'est une course,
 * et une course ne se corrige pas par une soustraction. En rendant
 * l'état AVEC la position, il n'y a plus rien à calculer : la réserve
 * retrouve sa hauteur de départ, la position retrouve sa valeur de
 * départ, et le contenu retombe au pixel.
 *
 * ⚠️ AUCUNE VALEUR EN DUR, ET PLUS AUCUNE ARITHMÉTIQUE. Ce module ne
 * connaît ni 122, ni 64, ni 58 : il LIT ce que la barre annonce
 * (`data-reserve-posee` / `data-reserve-depliee`) et n'en retient qu'un
 * BOOLÉEN — repliée, ou pas. Si la charte change les hauteurs, ou si la
 * réserve du propriétaire vaut 64 là où celle du banc en vaut 122, il
 * n'y a rien à reprendre ici.
 *
 * ⚠️ ET SUR LE WEB, RIEN : la réserve y est `display:none` (la barre est
 * restée dans le flux, en `sticky`). Aucune marque n'est posée, aucun
 * état n'est rendu.
 *
 * ⚠️ CE MODULE NE TOUCHE PAS AU COMPORTEMENT DE LA BARRE. Elle se replie
 * et se déplie pendant la navigation exactement comme avant — mêmes
 * seuils (24 px vers le bas, 12 vers le haut, 64 du haut), même durée.
 * On ne lui parle QU'AU RETOUR, et seulement pour lui dire dans quel
 * état naître.
 */

/**
 * LES DEUX HAUTEURS DE LA RÉSERVE, ÉCRITES ICI ET NULLE PART AILLEURS.
 * (nº 258-§1/§3 — elles étaient recopiées dans EnTeteTatouage, une fois
 * en attributs et une fois en classes.)
 *  · RANGÉE : 64 (la rangée du logo : 40 d'icônes + `py-3`) + 12
 *    (`max-lg:pt-3`) + 46 (les blocs descendus de 11 % : 52 × 0,89 =
 *    46,28 → 46 au pixel entier, la hauteur des cercles du web) ;
 *  · LOGO SEUL : 64 — la rangée du logo, rien d'autre.
 */
export const RESERVE_RANGEE = 122;
export const RESERVE_LOGO = 64;

/** La marque posée sur `<html>` : « nais avec la rangée repliée ».
    Un attribut de document, parce que le script d'avant peinture doit
    pouvoir l'écrire avant que React n'existe. */
export const MARQUE_RANGEE = "rangeeRepliee";

/**
 * LA HAUTEUR DE LA RÉSERVE REPLIÉE, DONNÉE À LA FEUILLE DE STYLE.
 * ------------------------------------------------------------------
 * ⚠️ POURQUOI CETTE VARIABLE EXISTE, ET C'ÉTAIT LE DERNIER SAUT DE 58
 * PIXELS. Sur un document NEUF, la première image peinte est celle du
 * SERVEUR — React n'a pas encore repris la main, et le serveur ne peut
 * pas savoir dans quel état la rangée doit renaître : il rend toujours
 * la réserve DÉPLIÉE. La marque, elle, est posée avant la peinture ;
 * une règle de style s'y accroche (globals.css) et donne la bonne
 * hauteur DÈS CETTE PREMIÈRE IMAGE. Quand React arrive un instant plus
 * tard, il pose exactement la même hauteur en style en ligne : rien ne
 * bouge, jamais.
 * La valeur, elle, reste écrite une seule fois — ici — et le script
 * d'avant peinture l'inscrit dans cette variable.
 */
export const VARIABLE_RESERVE_REPLIEE = "--rw-reserve-repliee";

/**
 * §2 (nº 377) — LA HAUTEUR DE LA BARRE DU LOGO, DONNÉE À UNE CLASSE.
 * ------------------------------------------------------------------
 * Même problème que ci-dessus, autre client : la rangée Profil /
 * Portfolio / Suivre de la fiche se colle SOUS la barre fixe au doigt,
 * et sa butée haute vaut donc exactement la hauteur de cette barre.
 * Une classe Tailwind ne sait pas lire `RESERVE_LOGO` ; ContenuFiche
 * pose donc cette variable en style en ligne, et la classe la
 * consomme. La valeur reste écrite UNE SEULE FOIS, ici, au même
 * endroit que la réserve qui tient la place de la barre — les deux ne
 * peuvent pas diverger.
 * ⚠️ Le nom est écrit en toutes lettres dans la classe de ContenuFiche
 * (`mobile:top-[var(--rw-rangee-collante)]`) : Tailwind lit des chaînes
 * littérales, il ne résout aucune constante. Les deux se lisent l'un
 * l'autre — ne renommer qu'un seul côté casserait le collage en
 * silence.
 */
export const VARIABLE_RANGEE_COLLANTE = "--rw-rangee-collante";

/** La marque qui coupe l'animation de hauteur, le temps d'un retour :
    une réserve qui s'anime pendant qu'on repose la position, c'est le
    contenu qui glisse sous l'œil. Voir globals.css. */
export const MARQUE_IMMEDIATE = "rangeeImmediate";

/** L'événement par lequel le retour prévient la barre, quand celle-ci
    est déjà née (retour en navigation de client : la barre n'est pas
    remontée, elle ne relira jamais la marque toute seule). */
export const EVENEMENT_RANGEE = "roswel:rangee-a-rendre";

/**
 * LA RANGÉE EST-ELLE REPLIÉE EN CE MOMENT ?
 * `null` quand la question n'a pas de sens : pas de barre, pas de
 * réserve, ou le web. On ne range alors aucun état.
 */
export function rangeeReplieeMaintenant(): boolean | null {
  if (typeof document === "undefined") return null;
  if (document.documentElement.dataset.appareil !== "mobile") return null;
  const reserve = document.querySelector<HTMLElement>("[data-reserve-barre]");
  if (!reserve) return null;
  const posee = Number(reserve.dataset.reservePosee);
  const depliee = Number(reserve.dataset.reserveDepliee);
  if (!Number.isFinite(posee) || !Number.isFinite(depliee)) return null;
  //  Une page sans rangée annonce deux fois la même hauteur : il n'y a
  //  rien à replier, donc rien à rendre.
  return posee < depliee;
}

/**
 * RENDRE L'ÉTAT DE LA RANGÉE, EN MÊME TEMPS QUE LA POSITION.
 * À n'appeler que depuis la restitution (lib/restitution-position) :
 * c'est le seul moment où le site a le droit de décider de l'état de la
 * rangée à la place du doigt.
 *
 * ⚠️ TOUT SE PASSE DANS LA MÊME TÂCHE que la pose du défilement, et
 * c'est ce qui fait qu'aucune image intermédiaire n'est peinte : React
 * vide sa file avant la peinture suivante, la réserve et le défilement
 * changent donc pour le même rendu.
 */
export function rendreLEtatDeRangee(repliee: boolean | null | undefined) {
  if (typeof document === "undefined") return;
  if (repliee === null || repliee === undefined) return;
  const racine = document.documentElement;
  if (racine.dataset.appareil !== "mobile") return;
  //  La hauteur ne s'anime pas pendant un retour (voir globals.css).
  racine.dataset[MARQUE_IMMEDIATE] = "1";
  if (repliee) {
    racine.style.setProperty(VARIABLE_RESERVE_REPLIEE, `${RESERVE_LOGO}px`);
    racine.dataset[MARQUE_RANGEE] = "1";
  } else {
    delete racine.dataset[MARQUE_RANGEE];
  }
  window.dispatchEvent(
    new CustomEvent(EVENEMENT_RANGEE, { detail: { repliee } })
  );
  //  Deux images plus tard, l'animation reprend ses droits et la marque
  //  s'efface : le retour est fini, les replis suivants sont ceux du
  //  doigt, et c'est React qui tient la hauteur.
  //  ⚠️ LA MARQUE NE DOIT PAS SURVIVRE AU RETOUR : elle force la
  //  hauteur repliée par la feuille de style ; laissée en place, elle
  //  empêcherait la rangée de se déplier au prochain geste vers le haut.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      delete racine.dataset[MARQUE_IMMEDIATE];
      delete racine.dataset[MARQUE_RANGEE];
    });
  });
}

/**
 * CE QUE LA BARRE DOIT ADOPTER À SA NAISSANCE — la marque laissée par
 * le script d'avant peinture, sur un document neuf né d'un retour.
 * `null` : rien n'a été demandé, la barre garde sa règle habituelle.
 * ⚠️ ELLE SE CONSOMME : une marque qui traîne replierait la rangée à la
 * navigation suivante, celle-là même que personne n'a demandée.
 */
export function rangeeNaitRepliee(): boolean | null {
  if (typeof document === "undefined") return null;
  const racine = document.documentElement;
  if (!(MARQUE_RANGEE in racine.dataset)) return null;
  delete racine.dataset[MARQUE_RANGEE];
  return true;
}
