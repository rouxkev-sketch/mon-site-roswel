/**
 * ██ LE CLASSEMENT DES CARROUSELS — UNE SEULE ÉCRITURE (nº 279-§3) ██
 * ==================================================================
 * ⚠️ TOUTES LES LISTES DE CARTES DU SITE PASSENT PAR ICI : l'accueil,
 * les résultats de recherche, les pages style + ville, la photothèque.
 * Aucune n'a le droit de refaire son tri dans son coin — c'est ainsi
 * qu'on se retrouve avec quatre classements qui divergent à la passe
 * suivante. Chaque page n'ACTIVE que les critères qui ont du sens chez
 * elle (voir `OptionsClassement`), mais le calcul est le même.
 *
 * L'UNITÉ CLASSÉE EST LE CARROUSEL, jamais l'artiste (nº 279-§1) : un
 * artiste qui a publié trois galeries est présent trois fois dans la
 * liste, et c'est la règle nº 2 du §3 qui l'empêche d'occuper toute la
 * première page.
 *
 * ==================================================================
 * 1. LA POPULARITÉ VIEILLIT
 * ==================================================================
 * LE DÉFAUT QUE CELA CORRIGE : le score d'avant — `consultations +
 * 3 × cœurs + 8 × abonnés` — est un TOTAL QUI NE DÉCROÎT JAMAIS. Sa
 * conséquence est mécanique : les premiers carrousels populaires
 * restent en tête pour toujours, rien de neuf ne remonte, et un
 * artiste qui publie ne voit aucun effet — alors il cesse de publier.
 *
 * LA FORMULE, celle des fils de contenu (Hacker News) :
 *
 *        score = (1 + popularité) / (âge_en_jours + 2) ^ 1,2
 *
 *  · `+ 1` au numérateur : un carrousel tout neuf sans aucun cœur a
 *    quand même un score, sinon il ne remonterait jamais ;
 *  · `+ 2` au dénominateur : les premières heures ne valent pas une
 *    division par zéro — un carrousel du jour ne monte pas au ciel ;
 *  · l'exposant 1,2 : assez fort pour que six mois pèsent, assez doux
 *    pour qu'un très bon carrousel garde un reste d'avantage. À 1,5
 *    le passé était écrasé ; à 1,0 il ne bougeait pas assez.
 *
 * EXEMPLE CHIFFRÉ, celui du propriétaire — « un carrousel de trois
 * jours avec dix cœurs doit pouvoir passer devant un carrousel de six
 * mois avec cinquante » (un cœur vaut 3 points) :
 *   · NEUF  : 10 cœurs = 30 points, 3 jours   → 31 / 5^1,2   ≈ 4,49
 *   · VIEUX : 50 cœurs = 150 points, 180 jours → 151 / 182^1,2 ≈ 0,29
 *   Le neuf passe devant, et de loin (≈ 15 fois). Il faudrait au vieux
 *   plus de 2 300 points — soit près de 800 cœurs — pour reprendre la
 *   tête. C'est exactement l'effet voulu.
 *
 * ⚠️⚠️ LE PIÈGE DES MIGRATIONS Nº 61 ET Nº 63, À NE PAS RÉVEILLER.
 * Un score qui dépend du temps se recalcule à chaque requête : entre
 * la page 1 et la page 2, l'âge a changé de quelques millisecondes,
 * l'ordre bouge, et l'on revoit une carte déjà vue (ou l'on en saute
 * une). C'EST LE DÉFAUT EXACT que ces deux migrations ont corrigé.
 * LA GARANTIE, ICI : l'âge n'est JAMAIS mesuré en millisecondes. Il se
 * compte en JOURS ENTIERS depuis un instant fixe — le même numéro de
 * jour qui sert déjà au tirage (`jourCourant()`). Toutes les requêtes
 * d'une même journée voient donc EXACTEMENT le même score, et l'ordre
 * ne peut pas bouger d'une page à l'autre. Le banc le prouve sur trois
 * pages successives.
 *
 * ==================================================================
 * 1 bis. LE DÉPARTAGE À NOTE ÉGALE — LE PLUS FOURNI PASSE DEVANT
 * ==================================================================
 * (règle 5 de la nº 283)
 * LE CAS RÉEL, ET IL EST LE NÔTRE AUJOURD'HUI : un catalogue tout
 * neuf n'a AUCUN cœur. La popularité vaut donc 0 partout, et la
 * formule ci-dessus rend la MÊME note à tous les carrousels du même
 * âge — l'ordre se jouait alors sur l'ordre d'entrée, c'est-à-dire sur
 * le hasard du chemin qui a construit la liste. Une galerie de trois
 * photos pouvait passer devant une galerie de vingt.
 *
 * LA RÈGLE : à note égale, LE CARROUSEL LE PLUS FOURNI D'ABORD ; à
 * nombre de photos égal, LE PLUS RÉCENT. C'est le meilleur signal
 * qu'on ait avant les cœurs — un artiste qui a rempli une galerie a
 * plus à montrer qu'un autre qui l'a ébauchée.
 *
 * ⚠️ ET ELLE S'EFFACE TOUTE SEULE. Ce n'est PAS un terme de la note :
 * c'est un départage, il ne se déclenche que si les notes sont
 * strictement égales. Le premier cœur suffit à les écarter, et la
 * formule du §1 reprend la main sans qu'on ait rien à éteindre — donc
 * sans qu'on doive s'en souvenir dans six mois.
 *
 * ⚠️ CE QU'IL COMPTE : les photos REÇUES pour ce carrousel, au plus
 * dix (règle 3, `PHOTOS_PAR_CARROUSEL`). Deux galeries de onze et de
 * vingt-cinq photos sont donc à égalité ici, et c'est leur fraîcheur
 * qui les départage — pas leur taille réelle, que la mosaïque ne
 * connaît pas et n'a aucune raison de rapatrier.
 *
 * ==================================================================
 * 2. PAS DEUX FOIS LE MÊME ARTISTE (au plus deux par page)
 * ==================================================================
 * Sans cette règle, un salon à douze galeries occupe la moitié de la
 * première page. L'étalement est DÉTERMINISTE (voir `etalerParPage`) :
 * il ne dépend ni de l'heure, ni du nombre de cartes demandées — un
 * carrousel a UNE place, toujours la même, dans une page de rang fixe.
 *
 * ==================================================================
 * 3. LA PROXIMITÉ — un coup de pouce, jamais un filtre
 * ==================================================================
 * La dernière localité cherchée rapproche ce qui est près : un
 * multiplicateur borné entre 1 (loin, ou lieu inconnu) et 1,6 (sur
 * place). ON NE CACHE RIEN : un carrousel à 800 km reste dans la
 * liste, il passe simplement après. Sans localité, le facteur vaut 1
 * et le critère ne joue pas du tout.
 *
 * ==================================================================
 * 4. LA PERSONNALISATION — LA PLACE EST PRÊTE, ET VIDE (nº 279-§4)
 * ==================================================================
 * ⚠️ AUCUN EFFORT ICI, ET C'EST LA CONSIGNE. Le site a deux fiches :
 * pondérer un classement avec les goûts d'un visiteur ne servirait à
 * rien avant des centaines d'utilisateurs, et coûterait une requête
 * par affichage. `bonusPersonnel` rend donc TOUJOURS 0 aujourd'hui.
 * Ce qu'elle attend le jour venu, et rien de plus : les artistes
 * SUIVIS, les styles AIMÉS (par les cœurs), et ce qui a DÉJÀ ÉTÉ VU
 * (qu'on fera descendre, pas disparaître). La structure existe pour
 * qu'on n'ait pas à toucher au reste du calcul ce jour-là.
 */

/** Le numéro du jour — l'ANCRE de tous les calculs qui dépendent du
    temps. C'est le même que celui du tirage du jour (`p_jour` de la
    fonction de base) : une seule notion de « aujourd'hui » sur tout le
    site, et un ordre qui ne bouge pas d'une requête à l'autre. */
export function jourCourant(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** L'âge d'un carrousel EN JOURS ENTIERS, ancré sur le jour courant.
    Une date inconnue vaut « aujourd'hui » : un carrousel sans date ne
    doit pas être puni pour une donnée manquante. */
export function ageEnJours(creeLe: string | null | undefined, jour = jourCourant()): number {
  if (!creeLe) return 0;
  const quand = Date.parse(creeLe);
  if (Number.isNaN(quand)) return 0;
  return Math.max(0, jour - Math.floor(quand / 86_400_000));
}

/** CE QUE LE CLASSEMENT SAIT D'UN CARROUSEL. Rien de plus : la
    fonction de score ne lit aucune base et n'appelle rien. */
export type SignauxClassement = {
  /** `consultations + 3 × cœurs + 8 × abonnés` — le score brut, tel
      que la vue `popularite_tatoueurs` le calcule (migration nº 62). */
  popularite: number;
  /** L'âge en jours entiers (voir `ageEnJours`). */
  ageJours: number;
  /** La distance à la localité cherchée, en kilomètres. `null` quand
      aucune localité n'est connue : le critère ne joue alors pas. */
  distanceKm: number | null;
  /** §4 — LA PLACE DE LA PERSONNALISATION. Toujours 0 aujourd'hui. */
  personnalisation: number;
  /**
   * COMBIEN DE PHOTOS CE CARROUSEL PORTE — le départage de la règle 5
   * (nº 283). Il n'entre PAS dans la note : il ne sert qu'à trancher
   * entre deux notes égales (voir la note nº 5 de tête).
   */
  photos: number;
};

/** L'exposant du vieillissement — voir la note de tête. */
const VIEILLISSEMENT = 1.2;

/** LE COUP DE POUCE DE PROXIMITÉ, borné : ×1,6 sur place, ×1,3 à
    25 km, ×1,12 à 100 km, ×1 sans localité. Jamais un filtre. */
export function facteurDeProximite(distanceKm: number | null): number {
  if (distanceKm === null || !Number.isFinite(distanceKm)) return 1;
  return 1 + 0.6 / (1 + Math.max(distanceKm, 0) / 25);
}

/**
 * §4 (nº 279) — LA PART PERSONNELLE DU SCORE. Elle vaut 0, et c'est
 * voulu (voir la note de tête). Le jour où elle servira, elle lira ces
 * trois signaux — suivis, styles aimés, déjà vu — et rendra un nombre
 * qui s'ajoutera à la popularité AVANT le vieillissement, pour qu'un
 * goût personnel vieillisse comme le reste.
 */
export function bonusPersonnel(signaux: {
  suitLArtiste?: boolean;
  styleAime?: boolean;
  dejaVu?: boolean;
}): number {
  //  ⚠️ LES TROIS SIGNAUX SONT LUS, ET LEUR POIDS EST ZÉRO. Écrire
  //  `return 0` sans les toucher aurait été plus court — et le premier
  //  outil venu aurait proposé de supprimer le paramètre, donc la
  //  structure que le §4 demande de PRÉPARER. Le jour venu, seuls ces
  //  trois nombres changent ; rien d'autre dans le fichier ne bouge.
  const POIDS = { suivi: 0, styleAime: 0, dejaVu: 0 };
  return (
    (signaux.suitLArtiste ? POIDS.suivi : 0) +
    (signaux.styleAime ? POIDS.styleAime : 0) +
    (signaux.dejaVu ? POIDS.dejaVu : 0)
  );
}

/** LE SCORE D'UN CARROUSEL — la formule de la note de tête. */
export function scoreDuCarrousel(signaux: SignauxClassement): number {
  const popularite = Math.max(signaux.popularite, 0) + signaux.personnalisation;
  const frais = (1 + popularite) / Math.pow(signaux.ageJours + 2, VIEILLISSEMENT);
  return frais * facteurDeProximite(signaux.distanceKm);
}

/** CE QUE CHAQUE PAGE ACTIVE. Un critère éteint ne joue pas du tout —
    il n'est pas « mis à zéro », il est absent du calcul. */
export type OptionsClassement = {
  /** La popularité vieillissante. Allumée partout : c'est le cœur du
      classement. */
  popularite?: boolean;
  /** Le coup de pouce de proximité. Éteint sur une page style + ville
      (la ville y est déjà fixée : tout le monde est « proche », le
      critère ne distinguerait rien). */
  proximite?: boolean;
  /** Au plus deux carrousels d'un même artiste par page. Allumée
      partout : c'est la variété, elle vaut sur toutes les listes. */
  varieteDesArtistes?: boolean;
  /** La taille d'une page — l'étalement s'y rapporte. */
  parPage: number;
};

/** Ce qu'un élément doit porter pour être classé. */
export type Classable = {
  /** L'identifiant de l'ARTISTE — c'est lui que la variété regarde. */
  artisteId: string;
  /** Une clé unique et STABLE : elle départage les égalités, pour que
      l'ordre ne dépende jamais du chemin qui a construit la liste. */
  cle: string;
  signaux: SignauxClassement;
};

/**
 * L'ÉTALEMENT PAR PAGE — « au plus deux par artiste » (§3.2)
 * ==================================================================
 * ⚠️ DÉTERMINISTE, et c'est tout l'enjeu. On parcourt la liste DÉJÀ
 * classée, dans l'ordre, et l'on donne à chaque carrousel LA PREMIÈRE
 * PAGE où son artiste a encore de la place. Un carrousel a donc une
 * place et une seule, qui ne dépend ni de l'heure, ni du nombre de
 * cartes demandées, ni de la page qu'on regarde : les trois exigences
 * des migrations nº 61 et nº 63, tenues sur la nouvelle unité.
 *
 * ⚠️ ET AUCUNE PAGE N'EST TROUÉE : une page pleine passe à la
 * suivante, et l'ordre à l'intérieur d'une page reste celui du score.
 */
const PAR_ARTISTE_ET_PAR_PAGE = 2;

export function etalerParPage<T extends Classable>(
  classes: T[],
  parPage: number
): T[] {
  const pages: T[][] = [];
  const comptes: Array<Map<string, number>> = [];
  for (const element of classes) {
    let rang = 0;
    for (;;) {
      if (!pages[rang]) {
        pages[rang] = [];
        comptes[rang] = new Map();
      }
      const dejaLa = comptes[rang].get(element.artisteId) ?? 0;
      if (pages[rang].length < parPage && dejaLa < PAR_ARTISTE_ET_PAR_PAGE) {
        pages[rang].push(element);
        comptes[rang].set(element.artisteId, dejaLa + 1);
        break;
      }
      rang += 1;
    }
  }
  return pages.flat();
}

/**
 * LE CLASSEMENT COMPLET — l'unique porte.
 * ⚠️ IL PORTE SUR LA LISTE ENTIÈRE, JAMAIS SUR UNE TRANCHE : c'est la
 * règle de la nº 217-§2 et de la migration nº 61, et elle ne change
 * pas d'unité. La coupe (`slice`) vient APRÈS, chez l'appelant.
 */
export function classerCarrousels<T extends Classable>(
  liste: T[],
  options: OptionsClassement
): T[] {
  const avecScore = liste.map((element, entree) => ({
    element,
    entree,
    score: options.popularite === false
      ? 0
      : scoreDuCarrousel({
          ...element.signaux,
          //  La proximité s'éteint page par page (voir OptionsClassement).
          distanceKm: options.proximite === false ? null : element.signaux.distanceKm,
        }),
  }));
  const classes = avecScore
    .sort(
      (a, b) =>
        b.score - a.score ||
        //  §5 (nº 283) — LE CARROUSEL LE PLUS FOURNI PASSE DEVANT.
        //  Voir la note nº 5 de tête : ce critère ne se déclenche
        //  QU'À NOTE ÉGALE, donc, en pratique, sur un catalogue sans
        //  aucun cœur. Un seul like suffit à écarter les notes, et la
        //  règle 4 reprend la main sans qu'on ait rien à éteindre.
        b.element.signaux.photos - a.element.signaux.photos ||
        //  À NOMBRE DE PHOTOS ÉGAL : le plus récent (âge le plus
        //  petit). C'est la seconde moitié de la règle 5.
        a.element.signaux.ageJours - b.element.signaux.ageJours ||
        //  ÉGALITÉ COMPLÈTE : l'ordre d'entrée d'abord (mélange du
        //  jour, ou distance), puis la clé — pour qu'aucune égalité ne
        //  dépende du chemin qui a construit la liste.
        a.entree - b.entree ||
        a.element.cle.localeCompare(b.element.cle)
    )
    .map(({ element }) => element);
  if (options.varieteDesArtistes === false) return classes;
  return etalerParPage(classes, Math.max(options.parPage, 1));
}
