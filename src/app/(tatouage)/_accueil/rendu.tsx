import type { Metadata } from "next";
import { cache } from "react";
import { adresseDuSite } from "@/lib/site";
import { rayonRetenu, TEXTES_TATOUAGE } from "@/config/tatouage";
import { lieuDepuisParametres } from "@/lib/geocodage";
import { PHOTOS_PAR_CARROUSEL } from "@/lib/photos-tatoueur";
import {
  criteresDeLieu,
  filtresConnus,
  jourDuMelange,
  listerTatoueurs,
  natureCherchee,
  styleConnu,
} from "@/lib/tatoueurs";
import { IndexTatoueurs } from "@/components/IndexTatoueurs";
//  §1 (nº 621) — la lecture de la nº 620 : une carte par style, pour
//  l'accueil au repos et lui seul (voir plus bas).
import { catalogueDesStyles } from "@/lib/catalogue-styles";

/**
 * L'ACCUEIL DE YOKOFOLIO
 * ======================
 * Adresse : /
 *
 * (Cette page répondait à « /tatoueurs » ; yokofolio occupe désormais
 * la racine du site, et « /tatoueurs » y redirige — voir
 * next.config.ts. Le site vitrine de l'agence est passé sur
 * « /agence ».)
 *
 * À l'arrivée SANS recherche, la grille montre des cartes au hasard
 * (mélange renouvelé chaque jour, voir `melangerDuJour`). Dès qu'un
 * style, un lieu ou un rayon change, la grille se met à jour sans
 * rechargement — mais les critères de l'adresse (?style=…&lieu=…)
 * sont toujours rendus PAR LE SERVEUR : un lien partagé ou un moteur
 * de recherche voit les bonnes cartes.
 */

/** LES PARAMÈTRES QUI FONT UNE RECHERCHE. Tout ce que le moteur écrit
    dans l'adresse quand on cherche — et rien d'autre. */
const PARAMETRES_RECHERCHE = [
  //  « nature » = tatouage | flash, le premier choix du menu
  //  « Explorer » (passe nº 110).
  "style", "nature", "lieu", "zone", "lat", "lon", "niveau",
  "paysCode", "region", "ville", "rayon", "exclure",
  //  ⚠️ ET LA PAGE (nº 191) : « Voir plus » l'écrit dans l'adresse, et
  //  c'est elle qui dit COMBIEN de cartes cette page contient. Sans
  //  cela, aucun retour ne pourrait retrouver soixante-douze cartes
  //  sans une mémoire parallèle — et c'est très exactement ce qu'on
  //  vient de supprimer.
  "page",
  //  §2 (nº 425) — LA GRAINE DU MÉLANGE, transmise par « Voir plus »
  //  seulement : la page 2 prolonge l'ordre de la page 1 affichée,
  //  même quand minuit UTC ou une régénération passe entre les deux.
  //  Comme « page », elle ne fait pas une recherche.
  "melange",
  //  ⚠️ ET L'AFFICHAGE (nº 203-§1b) : la disposition de la mosaïque
  //  (« disposition=une ») et le texte des cartes (« texte=sans »)
  //  vivent dans l'adresse comme les critères — le serveur rend donc
  //  directement le bon affichage, plus rien ne se corrige à l'écran
  //  après coup. Comme « page », ils ne font pas une recherche.
  "disposition", "texte",
] as const;

/** Les paramètres qui ne décrivent PAS une recherche : la pagination
    et l'affichage — « /?page=2 » ou « /?texte=sans », c'est toujours
    l'accueil. */
const PARAMETRES_HORS_RECHERCHE = new Set(["page", "melange", "disposition", "texte"]);

export type ParametresAccueil = Partial<
  Record<(typeof PARAMETRES_RECHERCHE)[number], string>
>;

/** Cette adresse porte-t-elle une recherche ? (La PAGE et l'AFFICHAGE
    n'en sont pas : « /?page=2 », c'est toujours l'accueil, en plus
    long.) */
function porteUneRecherche(params: ParametresAccueil): boolean {
  return PARAMETRES_RECHERCHE.filter(
    (cle) => !PARAMETRES_HORS_RECHERCHE.has(cle)
  ).some((cle) => Boolean(params[cle]));
}

/** LA PAGE DEMANDÉE, bornée. Dix pages — de cent vingt à trois cent
    soixante cartes selon la largeur de l'écran (nº 226-§1) — est déjà
    bien au-delà de ce qu'un œil parcourt ; au-delà, c'est une adresse
    fabriquée à la main, et la base n'a pas à la servir. */
const PAGES_MAX = 10;
function pageDemandee(params: ParametresAccueil): number {
  const demandee = Math.floor(Number(params.page));
  if (!Number.isFinite(demandee) || demandee < 1) return 1;
  return Math.min(demandee, PAGES_MAX);
}

/**
 * LA LECTURE DE L'ACCUEIL, FAITE UNE SEULE FOIS PAR REQUÊTE.
 * Les métadonnées et le corps de page en ont besoin toutes les deux
 * (l'une pour savoir si l'on est en démonstration, l'autre pour les
 * cartes). `cache` est nourri d'une CHAÎNE — l'adresse remise à plat —
 * et non de l'objet des paramètres : deux objets différents pour la
 * même recherche donneraient deux lectures.
 */
const chargerAccueil = cache(async (requete: string, taillePage: number) => {
  const params = Object.fromEntries(
    new URLSearchParams(requete)
  ) as ParametresAccueil;
  //  ⚠️ TOUTES LES PAGES D'UN COUP (nº 191) : l'adresse dit « page 3 »,
  //  le serveur rend les soixante-douze cartes. La page a donc sa
  //  hauteur définitive dès la première peinture — c'est ce qui permet
  //  au retour de retrouver sa place sans qu'aucune mémoire n'ait eu à
  //  garder les cartes.
  const page = pageDemandee(params);
  /*  §2 (nº 425) — la graine demandée par la pagination, bornée par
      `jourDuMelange` (deux jours au plus autour du courant). */
  const jourMelange = jourDuMelange(
    params.melange !== undefined ? Math.floor(Number(params.melange)) : undefined
  );
  const style = styleConnu(params.style);
  //  ⚠️ LA NATURE N'EST GARDÉE QUE SI ELLE EST CONNUE, comme le
  //  style : une adresse bricolée à la main ne doit pas vider la page.
  const nature = natureCherchee(params.nature);
  const lieu = lieuDepuisParametres(params);
  const rayonKm = rayonRetenu(Number(params.rayon));
  const exclure = filtresConnus(
    (params.exclure ?? "").split(",").filter(Boolean)
  );
  const resultat = await listerTatoueurs({
    style,
    nature,
    ...criteresDeLieu(lieu, rayonKm),
    exclure,
    //  ⚠️ LA TAILLE DE PAGE EST UN MULTIPLE DU NOMBRE DE COLONNES
    //  (nº 226-§1) : `colonnes × 6`, lu dans le cookie posé avant la
    //  première peinture (voir lib/colonnes-mosaique). La dernière
    //  rangée de la mosaïque est donc pleine à toutes les pages —
    //  vingt-quatre cartes en cinq colonnes en laissaient quatre au
    //  milieu de nulle part, et le manque grandissait à chaque
    //  « Voir plus ».
    //  ⚠️ ET LE DÉCALAGE RESTE À ZÉRO : « Voir plus » ne demande pas
    //  la page suivante, il redemande la MÊME recherche avec une
    //  limite plus grande. La liste servie est donc toujours un
    //  PRÉFIXE de l'ordre stable des migrations nº 61 et 63 — aucune
    //  carte ne peut y être en double, aucune sautée, et changer de
    //  taille de page entre deux chargements ne rejoue jamais une
    //  carte déjà vue.
    limite: taillePage * page,
    //  §1 (nº 425) — LA TAILLE DE PAGE N'EST PLUS TRANSMISE : la règle
    //  « deux carrousels d'un même artiste par page » travaille sur une
    //  fenêtre CONSTANTE (lib/tatoueurs), identique pour la page
    //  prérendue (repli 24) et le jumeau (cookie) — c'était la source
    //  de la réorganisation des cartes au premier « Voir plus ».
    jourMelange,
    //  ⚠️ PLUS D'UNE PHOTO PAR CARTE (nº 212-§2). La mosaïque n'en
    //  recevait qu'UNE (`sansGalerieInutile`, migration nº 32) : la
    //  carte ne pouvait donc jamais faire défiler quoi que ce soit —
    //  le carrousel de la nº 211-§5 ne s'affichait chez personne.
    //  ⚠️ DIX, ET PLUS VINGT (règle 3, nº 283). Ce nombre-ci dit ce
    //  qu'une CARTE montre ; il ne décide plus de rien d'autre. Ce qui
    //  décidait, à son insu, QUELLES CARTES EXISTENT, c'était le
    //  nombre de photos demandé À LA BASE — il n'est plus lu ici (voir
    //  PHOTOS_LUES_PAR_FICHE, config/tatouage).
    //  ⚠️ CE SONT DES LIGNES, PAS DES IMAGES : rien n'est téléchargé de
    //  plus à l'affichage — la carte ne monte que sa première photo,
    //  et les suivantes au premier geste (nº 211-§5).
    photosMax: PHOTOS_PAR_CARROUSEL,
  });
  return { resultat, style, nature, lieu, rayonKm, exclure, page, jourMelange };
});

/** L'adresse remise à plat, toujours dans le même ordre : c'est la
    clé de lecture ci-dessus. */
function requeteNormalisee(params: ParametresAccueil): string {
  const propre = new URLSearchParams();
  for (const cle of PARAMETRES_RECHERCHE) {
    const valeur = params[cle];
    if (valeur) propre.set(cle, valeur);
  }
  return propre.toString();
}

/**
 * LES MÉTADONNÉES DE L'ACCUEIL — et la maîtrise de la duplication
 * ================================================================
 * L'accueil NU est la page à indexer : il porte donc un lien canonique
 * explicite vers la racine.
 *
 * ⚠️ DÈS QU'UNE RECHERCHE EST DANS L'ADRESSE (?style=…&lieu=…&rayon=…),
 * LA PAGE PORTE `noindex, follow`, et rien d'autre. Onze paramètres
 * combinables, c'est des dizaines de milliers d'adresses pour un même
 * contenu — exactement ce que Google appelle du contenu dupliqué.
 *
 * POURQUOI `noindex` PLUTÔT QU'UN CANONIQUE VERS « / » ? Parce qu'un
 * canonique est un CONSEIL, que Google suit ou non — et il le suit
 * d'autant moins que les deux pages diffèrent vraiment (des résultats
 * filtrés ne sont pas l'accueil). `noindex` est une CONSIGNE : elle est
 * respectée. Et `follow` garde l'essentiel : les liens de la page sont
 * suivis, donc les fiches et les pages style + ville continuent d'être
 * découvertes par ce chemin.
 *
 * On ne met PAS les deux à la fois : associer `noindex` et un canonique
 * vers une autre adresse envoie deux ordres contradictoires, et Google
 * documente qu'il ne faut pas le faire.
 *
 * RIEN NE CHANGE POUR UN VISITEUR : l'adresse reste partageable, la
 * page s'affiche à l'identique. Seule l'instruction aux moteurs change.
 */
export async function metadonneesAccueil(
  params: ParametresAccueil,
  taillePage: number
): Promise<Metadata> {
  const recherche = porteUneRecherche(params);
  const { resultat } = await chargerAccueil(
    requeteNormalisee(params),
    taillePage
  );

  return {
    // L'accueil garde le titre PAR DÉFAUT du groupe
    // (« yokofolio — Les portfolios des tatoueurs, par style ») : sur
    // la page d'accueil, le nom de la marque doit venir en premier.
    description: TEXTES_TATOUAGE.descriptionSite,
    alternates: recherche ? undefined : { canonical: adresseDuSite() },
    robots:
      // Une recherche dans l'adresse, ou des fiches de DÉMONSTRATION à
      // l'écran : dans les deux cas, rien à indexer.
      recherche || resultat.demonstration
        ? { index: false, follow: true }
        : undefined,
  };
}

/**
 * L'ACCUEIL RESTE DYNAMIQUE — et ce n'est plus un problème
 * =========================================================
 * La question s'est posée pendant la passe « performance » : faut-il
 * le mettre en cache, comme les pages « style + ville » ? NON, pour
 * trois raisons qui tiennent toutes les trois :
 *
 *  1. IL PORTE LA RECHERCHE. Onze paramètres combinables : mettre en
 *     cache « l'accueil » n'aurait de sens que pour l'accueil NU, et
 *     Next rend de toute façon dynamique toute page qui lit ses
 *     paramètres d'adresse ;
 *  2. IL CHANGE DE VISAGE CHAQUE JOUR (le mélange du jour) et doit
 *     montrer une fiche validée TOUT DE SUITE ;
 *  3. IL NE COÛTE PLUS RIEN. C'était le vrai motif d'en vouloir un
 *     cache : il chargeait le catalogue entier. Il ne lit désormais
 *     qu'une page — douze à trente-six fiches selon le nombre de
 *     colonnes (nº 226-§1) —, en une requête (migration nº 32).
 *
 * Ce qui devait être mis en cache l'a été là où ça compte : les pages
 * « style + ville », qui répondent à une question stable et que les
 * robots visitent des milliers de fois.
 */
/**
 * LE RENDU PARTAGÉ DE L'ACCUEIL (nº 357) — deux routes l'appellent :
 *  · `/` (page.tsx) — PRÉRENDUE, régénérée périodiquement : aucun
 *    accès aux cookies ni aux paramètres, tout arrive en propriétés ;
 *  · `/accueil-recherche` (jumeau dynamique) — atteinte par RÉÉCRITURE
 *    du proxy quand « / » porte une requête : elle lit cookies et
 *    paramètres comme avant. L'adresse du navigateur reste « / ».
 * L'ancienne note « l'accueil reste dynamique » (passe performance)
 * est caduque depuis le verdict de la nº 356 : le rendu dynamique est
 * la cause signée des éjections de retour sur Chrome iPhone.
 */
export async function RenduAccueil({
  params,
  taillePage,
  phototequeSansTexte,
  mosaiqueNue,
}: {
  params: ParametresAccueil;
  taillePage: number;
  /** La vue photothèque quand l'adresse ne dit rien (cookie côté
      jumeau, valeur de repli côté page prérendue). */
  phototequeSansTexte: boolean;
  /** Vrai sur la page prérendue : pose le marqueur de la garde CSS
      des rangées (voir globals.css, nº 357). */
  mosaiqueNue: boolean;
}) {
  // La MÊME lecture que les métadonnées : le lieu est décodé de
  // l'adresse, le rayon ramené à un palier connu, les interrupteurs
  // éteints validés — voir `chargerAccueil`.
  const { resultat, style, nature, lieu, rayonKm, exclure, page, jourMelange } =
    await chargerAccueil(requeteNormalisee(params), taillePage);

  /**
   * ██ §1 (nº 621) — L'ACCUEIL AU REPOS SERT LE CATALOGUE DE STYLES ██
   * ------------------------------------------------------------------
   * QUAND, ET SEULEMENT QUAND : aucun critère de recherche. C'est la
   * définition posée par `estLAccueilNu` à la nº 619, écrite ici sur
   * les valeurs que cette page a déjà décodées — les deux disent la
   * même chose de la même page.
   * ⚠️ AUCUNE LECTURE INUTILE : `catalogueDesStyles` n'est appelée que
   * dans ce cas. Une recherche, une page de style, le jumeau avec des
   * critères ne la déclenchent jamais.
   * ⚠️ ET L'ACCUEIL RESTE PRÉRENDU (`○ /`) : cette lecture ne touche ni
   * cookie ni en-tête (c'est ce qui a été établi à la nº 620) — elle ne
   * fait que parler à la base, exactement comme `chargerAccueil`
   * au-dessus d'elle.
   * ⚠️ ET LES CARTES DE PORTFOLIO NE SONT PAS SERVIES avec lui : la
   * mosaïque reste montée (règle nº 171 — elle porte la fenêtre de
   * fiche) mais n'a rien à peindre, et « Voir plus » comme le compteur
   * se taisent d'eux-mêmes sur un total de zéro. Aucune classe, aucune
   * condition de plus. C'est la nº 622 qui décidera de leur sort, et
   * qui cessera alors de LIRE ces cartes pour rien.
   */
  const surLeCatalogue =
    !style && !nature && !lieu && exclure.length === 0;
  const catalogue = surLeCatalogue ? await catalogueDesStyles() : [];
  const avecCatalogue = catalogue.length > 0;

  return (
    <div data-mosaique-nue={mosaiqueNue ? "" : undefined} style={{ display: "contents" }}>
    <IndexTatoueurs
      premiers={avecCatalogue ? [] : resultat.tatoueurs}
      catalogue={catalogue}
      total={avecCatalogue ? 0 : resultat.total}
      page={page}
      //  §2 (nº 425) — le jour du mélange de CE rendu : le lien
      //  « Voir plus » l'écrit dans l'adresse de pagination, pour que
      //  la page suivante prolonge exactement cet ordre-ci.
      jourMelange={jourMelange}
      message={resultat.message}
      criteresInitiaux={{ style, nature, rayonKm, exclure, lieu }}
      //  L'AFFICHAGE DEMANDÉ PAR L'ADRESSE (nº 203-§1b) — décodé ici,
      //  comme les critères : le HTML rendu est le bon du premier coup.
      //  §2 (nº 257) — … ET LA MISE EN PAGE MÉMORISÉE quand l'adresse
      //  ne dit rien : sans cette lecture, arriver sur « / » rendait la
      //  version AVEC texte, que le navigateur retirait une seconde
      //  plus tard — le saut de page signalé deux fois. L'ADRESSE
      //  L'EMPORTE TOUJOURS (un lien partagé reste maître), le cookie
      //  ne parle qu'en son absence.
      //  §1 (nº 263) — LE COOKIE EST CELUI DE LA SURFACE « recherche » :
      //  « Ma sélection » a le sien (mes-favoris/page.tsx), et les deux
      //  pages ne parlent plus d'une seule voix.
      //  nº 443 — LES DEUX RÉGLAGES SONT SUPPRIMÉS DU PRODUIT : la
      //  disposition vaut « deux » pour toujours, et le texte est
      //  toujours affiché (`phototequeSansTexte` passe par
      //  `phototequeDuCookie`, qui répond faux quoi que dise un vieux
      //  cookie). Les paramètres « disposition » et « texte » restent
      //  RECONNUS plus haut (un vieux lien ne casse rien — ni
      //  recherche, ni erreur), mais ne sont plus obéis : le serveur
      //  et le navigateur (lib/disposition-grille, lib/vue-phototheque,
      //  neutralisés) disent la même chose — aucun écart d'hydratation.
      affichage={{
        disposition: "deux",
        phototheque: phototequeSansTexte,
      }}
    />
    </div>
  );
}
