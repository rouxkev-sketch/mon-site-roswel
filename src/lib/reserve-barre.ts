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
 *  · RANGÉE : 12 (`pt-3`) + 46 (la rangée du logo : ses cibles font
 *    46 px au doigt depuis la nº 821) + 12 (`max-lg:pt-3`, l'air
 *    au-dessus de la rangée) + 46 (le va-et-vient : 43 de piste et
 *    3 de ligne) = 116, et RIEN EN DESSOUS ;
 *  · LOGO SEUL : 64 — la rangée du logo, rien d'autre.
 *
 * ██ §2 (nº 858) — POURQUOI 116 ET PLUS 122 : LA SECONDE MOITIÉ DE LA
 * BANDE NOIRE ██
 * ------------------------------------------------------------------
 * CE NOMBRE ÉTAIT FAUX, et il l'était depuis la nº 821 sans que
 * personne le voie : il valait 122, calculé sur une rangée de logo de
 * 64 px (40 d'icônes + `py-3`). Or les cibles de la barre sont passées
 * à 46 px au doigt à la nº 821 — la rangée du logo en fait 58 avec son
 * air, la barre 116 en tout. La réserve annonçait donc SIX PIXELS DE
 * MOINS que la barre ne peint : le contenu commençait six pixels trop
 * haut, sous elle. Ajoutés aux douze du rembourrage retiré à la nº 858
 * (voir EnTeteTatouage), ce sont eux qu'on voyait en noir sous la
 * ligne du va-et-vient.
 * MESURÉ, PAS DÉDUIT (relevé nº 858, iPhone à 390 px) : barre 128,
 * réserve 122, ligne à 116. Après : barre 116, réserve 116, ligne à
 * 116 — le contenu commence PILE sous la ligne.
 * ⚠️ LE SQUELETTE SUIT SANS QU'ON Y TOUCHE : il lit cette constante
 * (SquelettesDePage), comme la barre. Une seule écriture (piège
 * nº 378).
 */
export const RESERVE_RANGEE = 116;
/**
 * ██ §1 (nº 886) — SOIXANTE-QUATRE ÉTAIT FAUX DE SIX PIXELS ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE, ENFIN NOMMÉ : « à l'ouverture d'une page,
 * la barre fixe ne bouge pas, mais LE CONTENU est placé quelques
 * pixels trop haut, sous la barre » — et le diagnostic disait
 * `scrollY = 0`. Ce n'était donc pas un défilement : c'était CETTE
 * CONSTANTE. Relevé à l'atelier, au doigt, sur les cinq sortes de
 * pages :
 *      accueil       barre 116 · réserve 116   ✓
 *      Ma sélection  barre 116 · réserve 116   ✓
 *      recherche     barre  70 · réserve  64   ✗  −6
 *      profil        barre  70 · réserve  64   ✗  −6
 *      portfolio     barre  70 · réserve  64   ✗  −6
 * Sur toute page dont la barre n'a que la ligne du logo, le contenu
 * commençait SIX PIXELS SOUS la barre. La barre a grandi en chemin
 * (les cibles tactiles de 46 px, nº 821 ; les airs de la nº 874) et la
 * constante ne l'a pas suivie — personne ne mesurait ce couple-là.
 * ⚠️ ET C'EST LA DERNIÈRE FOIS QU'ELLE PEUT DÉRIVER : la barre MESURE
 * désormais sa propre hauteur avant la peinture et pose CETTE
 * valeur-là (EnTeteTatouage, §1 nº 886) ; cette constante n'est plus
 * que la valeur de départ, celle de la toute première image. Le banc
 * 886 tient les deux : réserve = barre, sur chaque sorte de page.
 */
export const RESERVE_LOGO = 70;

/**
 * ██ §6 (nº 821) — LA CIBLE DES GESTES DE LA BARRE, AU DOIGT ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « les icônes de la barre fixe mobile
 * (loupe, globe, fanion — PAS l'avatar) sont trop petites ». MESURÉ
 * AVANT D'ÉCRIRE : au doigt, la cible fait 40 × 40 et le dessin 24 —
 * la cible est SOUS le standard tactile (44 à 48), le dessin est à sa
 * borne basse.
 * CE QUI CHANGE, ET RIEN D'AUTRE : la cible passe à 46 (le milieu de
 * la fourchette) et le dessin à 26 — les proportions et le trait fin
 * (1,8) ne bougent pas. LE WEB NE CHANGE PAS D'UN PIXEL : 40 de cible,
 * 28 de dessin, comme depuis la nº 147.
 * ⚠️ DEUX VARIANTES QUI S'EXCLUENT (piège nº 389), et l'appareil se
 * lit sur `data-appareil` — jamais sur une largeur de fenêtre (piège
 * nº 60).
 * ⚠️ UNE SEULE ÉCRITURE POUR LES TROIS GESTES ET LEUR SQUELETTE
 * (pièges nº 378/379) : la barre (EnTeteTatouage, SelecteurLangue) et
 * les ronds gris de l'habillage d'attente (SquelettesDePage) lisent
 * cette constante-ci. Sans cela, l'habillage promettrait une largeur
 * que la barre ne tiendrait pas — c'est l'acquis de la nº 815.
 * ⚠️ L'AVATAR N'EN EST PAS : il garde ses 40 (EMPREINTE_ZONE_COMPTE,
 * MenuEspace) — le propriétaire l'exclut, et sa photo n'est pas une
 * icône.
 */
export const CIBLE_GESTE_BARRE =
  "mobile:h-[46px] mobile:w-[46px] not-mobile:h-10 not-mobile:w-10";
/** Le dessin dans cette cible : 26 au doigt (le web garde ses 28,
    posés par l'attribut `taille` de l'icône). */
export const DESSIN_GESTE_BARRE = "mobile:h-[26px] mobile:w-[26px]";

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
export const EVENEMENT_RANGEE = "yokofolio:rangee-a-rendre";

/**
 * ██ §1 (nº 430) — L'ÉTAT DU VOLET SURVIT AU REMONTAGE ██
 * ==================================================================
 * LE RELEVÉ QUI L'A EXIGÉ (iPhone, sonde nº 429) : au « Voir plus »
 * depuis l'adresse nue, AUCUN rechargement — mais « ⚠️ DÉMONTAGE page
 * (IndexTatoueurs) · ⚠️ DÉMONTAGE mosaïque · MONTAGE mosaïque ». La
 * cause est STRUCTURELLE : l'accueil prérendu et le jumeau de
 * recherche sont DEUX pages, la première pagination (ou la première
 * recherche) traverse la frontière, et React reconstruit l'arbre — or
 * la barre est rendue PAR la page (IndexTatoueurs) : son état
 * `moteurReplie` meurt avec l'arbre, et la rangée renaissait DÉPLIÉE.
 * Contre-cas mesuré par le propriétaire : en partant du jumeau (adresse
 * à sonde), aucun croisement, le volet ne s'ouvrait jamais.
 *
 * LA SURVIE : une variable de MODULE — le chemin le plus inerte qui
 * existe, le modèle qu'avait posé la mémoire des cartes (nº 372, dont
 * le module a quitté le dépôt à la nº 603, sans appelant depuis la
 * nº 445) : aucune
 * écriture d'adresse, aucune entrée d'historique, aucun stockage,
 * aucune requête ; elle vit tant que le document vit, et meurt avec
 * lui. Écrite à CHAQUE bascule réelle (le doigt, le haut de page, une
 * restitution) ; lue à la naissance de la barre. Sur un document NEUF,
 * le module est frais (`null`) : la marque du script d'avant-peinture
 * garde son rôle exactement comme avant — le repli réparé de la nº 428
 * passe par elle (nouveau document), pas par cette mémoire.
 */
let dernierEtatDeRangee: boolean | null = null;

/** Écrite par la barre à chaque bascule réelle, et par la restitution
    quand elle rend un état (la barre peut ne pas être montée à cet
    instant — la fenêtre d'un remontage). */
export function memoriserEtatDeRangee(repliee: boolean): void {
  dernierEtatDeRangee = repliee;
}

/** Ce que la barre doit adopter à un REMONTAGE dans le même document.
    `null` : aucun état vécu ici — document neuf, la marque du script
    décide. NE SE CONSOMME PAS : dix remontages relisent dix fois. */
export function etatDeRangeeMemorise(): boolean | null {
  return dernierEtatDeRangee;
}

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
  //  §1 (nº 430) — la mémoire de module suit : un remontage juste après
  //  ce retour doit renaître dans l'état RENDU, pas dans un plus vieux.
  memoriserEtatDeRangee(repliee);
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
