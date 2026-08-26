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
 * LA FORMULE, celle des fils de contenu (Hacker News), AVEC SA FAVEUR
 * DE DÉPART (nº 636) :
 *
 *    score = (1 + popularité) / (âge_en_jours + 2) ^ 1,1
 *            × faveur_de_nouveauté(âge)
 *            × facteur_de_proximité(distance)
 *
 *  · `+ 1` au numérateur : un carrousel tout neuf sans aucun cœur a
 *    quand même un score, sinon il ne remonterait jamais ;
 *  · `+ 2` au dénominateur : les premières heures ne valent pas une
 *    division par zéro — un carrousel du jour ne monte pas au ciel ;
 *  · l'exposant, RAMENÉ DE 1,2 À 1,1 À LA nº 636 : voir sa note sur
 *    `VIEILLISSEMENT`, plus bas.
 *
 * ██ L'ORDRE DES TROIS TERMES, ET POURQUOI IL EST CELUI-LÀ (nº 636) ██
 * La FRACTION vient d'abord : c'est la VALEUR PROPRE du carrousel — ce
 * qu'il vaut par ce qu'il a récolté et par le temps qui a passé. Les
 * deux termes suivants sont des FAVEURS, et elles MULTIPLIENT au lieu
 * de s'ajouter : une faveur met en valeur, elle ne fabrique pas de
 * mérite. Un carrousel deux fois meilleur reste deux fois meilleur,
 * qu'il soit neuf, proche, les deux ou ni l'un ni l'autre — ce qu'une
 * addition aurait détruit (elle aurait donné le même bonus à tout le
 * monde, donc tout écrasé vers le haut de la liste).
 * ⚠️ ENTRE LES DEUX FAVEURS, L'ORDRE N'A AUCUNE IMPORTANCE : une
 * multiplication est commutative. Ce qui compte, c'est qu'elles
 * viennent toutes les deux APRÈS la fraction.
 *
 * EXEMPLE CHIFFRÉ, celui du propriétaire — « un carrousel de trois
 * jours avec dix cœurs doit pouvoir passer devant un carrousel de six
 * mois avec cinquante » (un cœur vaut 3 points) :
 *   · NEUF  : 10 cœurs = 30 points, 3 jours   → 31 / 5^1,1 × 1,29 ≈ 6,79
 *   · VIEUX : 50 cœurs = 150 points, 180 jours → 151 / 182^1,1  ≈ 0,49
 *   Le neuf passe devant, et de loin. C'est toujours l'effet voulu.
 *   (Les nombres de ce fichier sont ceux que la fonction rend, pas des
 *   ordres de grandeur : ils ont été relevés en l'exécutant.)
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
 * La localité cherchée rapproche ce qui est près : un multiplicateur
 * borné entre 1 (loin, ou lieu inconnu) et 1,6 (sur place). ON NE CACHE
 * RIEN : un carrousel à 800 km resterait dans la liste, il passerait
 * simplement après. Sans localité, le facteur vaut 1 et le critère ne
 * joue pas du tout.
 *
 * ⚠️⚠️ ET IL NE JOUE NULLE PART AUJOURD'HUI — LE DIRE PLUTÔT QUE DE
 * LAISSER CROIRE (relevé nº 558, prouvé à la nº 636). Cette faveur est
 * écrite, bornée, appelée à chaque score… et elle vaut 1 sur TOUTES les
 * cartes du site, parce que PERSONNE NE FOURNIT JAMAIS DE DISTANCE :
 *  · `carrouselsDesFiches` (lib/carrousels) sait lire une
 *    `distanceParFiche`, mais aucun appelant ne la lui passe ;
 *  · `carrouselsDeLaFiche` sait lire un `contexte.distanceKm` — même
 *    chose, personne ne l'écrit ;
 *  · la recherche CALCULE pourtant les distances (lib/tatoueurs,
 *    `effective` — la distance au lieu le plus proche, rayon de
 *    déplacement défalqué), mais elle ne s'en sert QUE pour trier les
 *    fiches ; ce nombre ne survit pas à l'éclatement en carrousels.
 * ALLUMER `proximite: true` NE CHANGERAIT DONC RIEN DU TOUT : le
 * facteur resterait à 1. Ce qu'il faudrait, c'est porter la distance
 * calculée jusqu'aux carrousels — un tuyau à poser dans trois fichiers,
 * et le seul endroit du site où la règle « distance effective » est
 * écrite devrait alors être extraite pour ne pas l'écrire deux fois.
 * C'est une passe à part, et elle n'est PAS commencée ici.
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

/**
 * ██ §2 (nº 636) — L'EXPOSANT DU VIEILLISSEMENT : 1,2 → 1,1 ██
 * ==================================================================
 * LE CONSTAT DU PROPRIÉTAIRE : un tatoueur ne met pas son portfolio à
 * jour toutes les semaines — son rythme est TRIMESTRIEL. Le classement
 * récompensait la fréquence de publication plus que la qualité : une
 * galerie du jour, même vide, battait une galerie de six mois avec
 * cinquante favoris (0,435 contre 0,293 — les nombres d'avant).
 *
 * POURQUOI 1,1 ET PAS AUTRE CHOSE. C'est LE MÉDIAN DE L'ÉVENTAIL QUE
 * CE FICHIER A LUI-MÊME EXPLORÉ : sa note d'origine dit « à 1,5 le
 * passé était écrasé ; à 1,0 il ne bougeait pas assez », et 1,2 avait
 * été retenu. Le propriétaire ne veut ni l'actuel (1,2) ni le plus
 * doux qu'on ait jugé tenable (1,0) : entre les deux, il n'y a qu'un
 * cran, et c'est celui-ci.
 *
 * CE QUE CELA DONNE, LA FAVEUR DE DÉPART MISE À PART (un cœur = 3
 * points ; « vide » = aucun favori) :
 *
 *   âge      vide           10 favoris      50 favoris
 *   ------------------------------------------------------
 *   7 j      0,089          2,77            —
 *   30 j     0,022          0,685           —
 *   90 j     0,0069         0,215           1,045
 *   180 j    0,0033         0,101           0,493
 *
 * LE CAS QUE LE PROPRIÉTAIRE A NOMMÉ, RÉGLÉ : six mois avec cinquante
 * favoris passe de 0,293 à 0,493, quand la galerie neuve et vide, elle,
 * retombe à 0,089 dès sa semaine de grâce écoulée — la qualité est
 * cinq fois et demie devant, là où elle perdait.
 * ET LE RYTHME TRIMESTRIEL TIENT : trois mois avec dix favoris (0,215)
 * dépasse une galerie d'une semaine sans favori (0,089) de 2,4 fois,
 * contre 1,9 avant. Elle reste dans la course, exactement comme
 * demandé.
 *
 * ⚠️ UN SEUL CHIFFRE, ET IL EST ICI : le revoir, c'est changer cette
 * ligne. Aucune autre valeur du fichier n'en dépend.
 */
const VIEILLISSEMENT = 1.1;

/**
 * ██ §3 (nº 636) — LA PÉRIODE DE GRÂCE : SEPT JOURS, PUIS LA VÉRITÉ ██
 * ==================================================================
 * CE QU'ELLE RÉSOUT : une galerie neuve n'a encore RIEN récolté — pas
 * un cœur, pas une consultation. Sans coup de pouce, elle naît au fond
 * de la liste, personne ne la voit, donc elle ne récolte rien : le
 * classement se referme sur lui-même. C'est le procédé de Reddit, de
 * Product Hunt et de Behance — une chance au départ, puis la vraie
 * valeur.
 *
 * ██ COMMENT, ET C'EST TOUT LE SOIN DE CE §3 : ELLE S'ÉTEINT EN
 * DESCENDANT, ELLE NE TOMBE PAS ██
 * Le propriétaire l'a demandé en toutes lettres : pas de chute brutale
 * au huitième jour. Un bonus qui vaudrait « +50 % pendant sept jours,
 * puis rien » ferait dégringoler la galerie d'un tiers de sa place du
 * jour au lendemain, et cela se verrait.
 * LA FAVEUR DÉCROÎT DONC LINÉAIREMENT, du premier jour au septième, et
 * elle VAUT DÉJÀ ZÉRO quand elle expire :
 *
 *   jour 0 : ×1,50     jour 3 : ×1,29     jour 6 : ×1,07
 *   jour 1 : ×1,43     jour 4 : ×1,21     jour 7 : ×1,00
 *   jour 2 : ×1,36     jour 5 : ×1,14     au-delà : ×1,00
 *
 * Chaque jour retire le même septième de la faveur — environ 5 % de la
 * note. Le passage du septième au huitième jour ne retire RIEN du tout :
 * il n'y a plus rien à retirer. Il n'existe aucun décrochage.
 *
 * ⚠️ CE QUE LA GRÂCE FAIT, ET QU'IL FAUT ASSUMER : pendant ces sept
 * jours, une galerie neuve et vide PEUT coiffer une bonne galerie
 * ancienne (0,70 contre 0,49 pour six mois et cinquante favoris).
 * C'EST EXACTEMENT CE QU'UNE PÉRIODE DE GRÂCE VEUT DIRE. Au septième
 * jour elle retombe à 0,089, et l'ancienne est cinq fois et demie
 * devant : la faveur a servi à la faire VOIR, pas à la faire gagner.
 *
 * ⚠️ ELLE NE PEUT PAS FAIRE BOUGER L'ORDRE EN COURS DE JOURNÉE — le
 * piège des migrations nº 61 et nº 63, tenu comme le reste : elle lit
 * `ageJours`, le même compte de JOURS ENTIERS ancré sur `jourCourant()`
 * que la fraction. Toutes les requêtes d'une même journée voient la
 * même faveur.
 * ⚠️ DEUX CHIFFRES, ET ILS SE LISENT SEULS : la durée, et la hauteur.
 * La hauteur (+50 %) est du même ordre que la seule autre faveur du
 * site, la proximité (+60 % au plus) — pas un nombre de plus dans une
 * échelle nouvelle.
 */
const JOURS_DE_GRACE = 7;
const COUP_DE_POUCE_NEUF = 0.5;

export function faveurDeNouveaute(ageJours: number): number {
  const reste = 1 - Math.max(ageJours, 0) / JOURS_DE_GRACE;
  return 1 + COUP_DE_POUCE_NEUF * Math.max(reste, 0);
}

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

/** LE SCORE D'UN CARROUSEL — la formule de la note de tête.
    §3 (nº 636) — LA VALEUR PROPRE D'ABORD, LES DEUX FAVEURS ENSUITE :
    voir « L'ORDRE DES TROIS TERMES » en tête de fichier. */
export function scoreDuCarrousel(signaux: SignauxClassement): number {
  const popularite = Math.max(signaux.popularite, 0) + signaux.personnalisation;
  const frais = (1 + popularite) / Math.pow(signaux.ageJours + 2, VIEILLISSEMENT);
  return (
    frais *
    faveurDeNouveaute(signaux.ageJours) *
    facteurDeProximite(signaux.distanceKm)
  );
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
  /** §2 (nº 619) — LES TOURS DE STYLES : un style ne revient qu'après
      que tous les autres sont passés. ÉTEINTE PARTOUT SAUF SUR
      L'ACCUEIL NU — une recherche montre ce qu'on lui a demandé, dans
      l'ordre de sa note, et n'a rien à alterner. Voir
      `enToursDeStyles`. */
  toursDeStyles?: boolean;
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
  /** §2 (nº 619) — LE STYLE, et il n'est lu QUE par les tours de
      styles ci-dessous. Facultatif : une liste qui n'active pas les
      tours n'a rien à fournir, et `Carrousel` le porte déjà. */
  style?: string;
  signaux: SignauxClassement;
};

/**
 * ██ §2 (nº 619) — LES TOURS DE STYLES ██
 * ==================================================================
 * LA RÈGLE DU PROPRIÉTAIRE, en une phrase : un style ne réapparaît
 * que lorsque TOUS LES AUTRES ont été montrés une fois.
 *
 * COMMENT, ET C'EST TOUT : on range la liste DÉJÀ CLASSÉE en une file
 * par style — chaque file garde l'ordre du classement — puis on
 * distribue en prenant UNE carte de chaque file, tour après tour.
 *
 * CE QUE CELA PRÉSERVE, et c'est pourquoi ce n'est pas un second
 * classement :
 *  · L'ORDRE DES STYLES est celui de leur MEILLEURE carte. Les files
 *    naissent dans l'ordre de la liste classée, et une table de ce
 *    langage se parcourt dans l'ordre où on l'a remplie : le style de
 *    la carte la mieux notée ouvre donc chaque tour ;
 *  · L'ORDRE À L'INTÉRIEUR D'UN STYLE est intact — c'est le score qui
 *    décide laquelle de ses cartes passe au premier tour.
 * La note (popularité ÷ âge) décide donc de TOUT ; ces tours ne font
 * que redistribuer ce qu'elle a produit.
 *
 * ⚠️ QUAND UN STYLE RESTE SEUL, SES CARTES S'ENCHAÎNENT, et c'est
 * inévitable : il n'y a plus personne pour s'intercaler. La règle est
 * tenue tant qu'un autre style a encore quelque chose à montrer.
 * ⚠️ UNE CARTE SANS STYLE RENSEIGNÉ (une fiche d'avant la migration
 * nº 31 sans style déclaré) forme sa propre file, la file « rien ».
 * Elle s'espace comme les autres au lieu d'être collée à n'importe
 * quel style — la seule réponse qui ne mélange pas deux choses.
 * ⚠️ DÉTERMINISTE, comme l'étalement : aucune dépendance à l'heure,
 * au nombre de cartes demandées, ni à la page regardée. Deux appels
 * du même jour rendent le même ordre.
 */
export function enToursDeStyles<T extends Classable>(classes: T[]): T[] {
  const parStyle = new Map<string, T[]>();
  for (const element of classes) {
    const style = element.style ?? "";
    const file = parStyle.get(style);
    if (file) file.push(element);
    else parStyle.set(style, [element]);
  }
  //  Un seul style : il n'y a rien à alterner, on rend la liste telle
  //  quelle plutôt que de la recopier case par case.
  if (parStyle.size <= 1) return classes;
  let files = [...parStyle.values()];
  const tours: T[] = [];
  while (files.length > 0) {
    for (const file of files) {
      //  Les files vides sont retirées à la fin de chaque tour : celle
      //  qu'on visite ici a donc forcément une carte.
      tours.push(file.shift() as T);
    }
    files = files.filter((file) => file.length > 0);
  }
  return tours;
}

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
  /*  §2 (nº 619) — LES TOURS PASSENT ENTRE LE SCORE ET L'ÉTALEMENT, et
      cet ordre-là est le bon :
       · APRÈS le score, parce qu'ils ont besoin d'une liste classée —
         c'est elle qui donne son rang à chaque style et à chaque carte
         dans son style ;
       · AVANT l'étalement, parce que l'étalement AFFECTE LES CARTES À
         DES PAGES : le faire jouer en premier, puis tout redistribuer,
         détruirait le « deux par artiste et par page » de la nº 279.
      ⚠️ ET L'ÉTALEMENT GARDE LE DERNIER MOT, il faut le dire : une
      carte qu'il repousse à la page suivante quitte son tour. Cela ne
      peut arriver qu'à un artiste qui a plus de deux galeries dans la
      même page — et ses galeries sont justement de styles différents,
      donc les tours les avaient déjà écartées. */
  const ordonnes = options.toursDeStyles ? enToursDeStyles(classes) : classes;
  if (options.varieteDesArtistes === false) return ordonnes;
  return etalerParPage(ordonnes, Math.max(options.parPage, 1));
}
