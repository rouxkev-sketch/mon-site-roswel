/*  ⚠️ PAS DE DIRECTIVE « use client » ICI, ET C'EST VOULU — la même
    raison qu'au journal de l'historique : le script d'avant peinture est
    fabriqué PAR LE SERVEUR, et il a besoin de `releveDuBasPourLeScript`.
    Avec la directive, Next refuse l'appel. */
/**
 * ██ Y A-T-IL QUELQUE CHOSE DERRIÈRE MOI, DANS CET ONGLET ? ██
 * ==================================================================
 * (passe nº 345 — l'écriture unique de la question que pose le filet)
 *
 * LE DÉFAUT QUE CE MODULE CORRIGE, ET IL A ÉTÉ MESURÉ.
 * ------------------------------------------------------------------
 * Le filet de la nº 332-§2 (RetourGaranti) ne s'armait que si
 * `history.length <= 1`. Le propriétaire a relevé, EN LIGNE, sur son
 * iPhone, dans les deux navigateurs :
 *
 *   SAFARI  — arrivée pile 1 → le filet s'arme → huit allers-retours
 *             sans faute.
 *   CHROME  — arrivée pile 2 → LE FILET NE S'ARME JAMAIS → il sort du
 *             site au premier retour.
 *
 * CHROME SUR IPHONE OUVRE SES ONGLETS AVEC UNE ENTRÉE DÉJÀ EN PLACE.
 * La pile vaut donc 2 à l'arrivée, et la condition ne pouvait plus
 * être vraie une seule fois sur ce navigateur. Reproduit ici au banc
 * (p345-§1) en ouvrant d'abord une page dans l'onglet : la pile vaut
 * 2, et le filet n'existe pas.
 *
 * ⚠️ « LA PILE EST-ELLE VIDE ? » N'EST PAS LA BONNE QUESTION. Ce n'est
 * pas parce qu'il y a une entrée derrière soi qu'elle appartient à
 * quelqu'un. La bonne question est celle du propriétaire :
 *
 *        Y A-T-IL UNE VRAIE PAGE DERRIÈRE MOI DANS CET ONGLET ?
 *
 * et elle se décompose en deux, qui n'ont pas la même réponse :
 *
 *  A. UNE PAGE DE CE SITE ? — c'est NOTRE PROPRE MARQUE qui répond.
 *     On relève, une fois par onglet et avant toute ligne
 *     d'application, la PROFONDEUR de la pile à notre arrivée. Tant
 *     qu'elle n'a pas grandi, aucune page du site ne s'est glissée
 *     derrière nous. Dès qu'elle grandit, il y en a une — et le filet
 *     n'a plus rien à faire.
 *
 *  B. UNE PAGE ÉTRANGÈRE ? — c'est LE RÉFÉRENT qui répond, et lui
 *     seul. C'EST LA BORNE DE LA nº 332-§2, ET ELLE RESTE ENTIÈRE :
 *     si le visiteur est arrivé depuis Instagram DANS LE MÊME ONGLET,
 *     son retour doit LE RAMENER À INSTAGRAM. Le retenir de force
 *     serait malhonnête.
 *
 * LE FILET NE JOUE QUE SI LES DEUX RÉPONSES SONT « NON ».
 *
 * ==================================================================
 * ⚠️ CE QUE LE RÉFÉRENT SAIT, ET CE QU'IL NE SAIT PAS — À DIRE, PARCE
 * QUE C'EST LA LIMITE DE CETTE PASSE.
 * ------------------------------------------------------------------
 * AUCUNE API DU WEB NE PERMET DE REGARDER L'ENTRÉE PRÉCÉDENTE D'UN
 * ONGLET. L'entrée fantôme que Chrome pose en ouvrant un onglet et la
 * page d'Instagram sont, vues du site, exactement la même chose : une
 * entrée opaque. Le SEUL témoin qui les distingue est le référent du
 * document — vide dans un onglet neuf (adresse tapée, lien partagé,
 * signet, code QR, session restaurée), renseigné quand une vraie page
 * étrangère nous a menés ici.
 *
 * SA LIMITE, NOMMÉE : un visiteur qui TAPE l'adresse du site alors
 * qu'Instagram est ouvert dans le même onglet arrive sans référent. Le
 * filet s'armera, et son premier retour le gardera sur le site au lieu
 * de le rendre à Instagram. C'est le prix, il est connu, et il est
 * incomparablement plus petit que celui qu'on paie aujourd'hui : SUR
 * CHROME, LE FILET N'EXISTE PAS DU TOUT.
 *
 * ⚠️ UN RÉFÉRENT VIDE NE VEUT PAS DIRE « UNE PAGE ÉTRANGÈRE EST
 * DERRIÈRE » — IL VEUT DIRE L'EXACT CONTRAIRE, et le code l'a toujours
 * écrit ainsi (`referentEtranger` ci-dessous rend `false` sur une
 * chaîne vide). C'est l'hypothèse que le propriétaire a formée à la
 * nº 346 en cherchant pourquoi le filet ne s'armait pas ; elle est
 * fausse, et la vraie cause est plus bas (le relevé de secours). On
 * l'écrit ici pour qu'aucune passe ne la reprenne.
 *
 * ⚠️ UN RÉFÉRENT DE NOTRE PROPRE ORIGINE NE COMPTE PAS. Quand le filet
 * a joué, il fait `location.replace("/")` : le document qui suit porte
 * un référent — le nôtre. Il ne désigne AUCUNE entrée derrière nous
 * (le remplacement a consommé la précédente), et le filet doit
 * pouvoir se reposer. On ne retient donc que les référents d'une AUTRE
 * origine.
 */

/** Le relevé du bas de la pile, une fois par ONGLET (sessionStorage) :
    il ne doit ni survivre à l'onglet, ni le suivre ailleurs. */
export const CLE_BAS = "yokofolio:bas-de-la-pile";

export type BasDeLaPile = {
  /** `history.length` à notre arrivée dans cet onglet, relevé AVANT
      qu'une seule ligne du site ait pu empiler quoi que ce soit. */
  profondeur: number;
  /** Une vraie page d'un AUTRE site nous a-t-elle menés ici ? */
  etranger: boolean;
  /** §B (nº 347) — QUI a pris la mesure : « avant peinture » (le
      script bloquant) ou « secours (chargement du module) ». C'est le
      témoin qui départage les deux branches du propriétaire : si le
      relevé en ligne dit toujours « secours », le bloc du script ne
      tourne pas là-bas, et la cause est dans la page SERVIE. */
  origine: string;
  /** §2 (nº 349) — LA NAISSANCE DU DOCUMENT qui a pris la mesure
      (`performance.timeOrigin`, arrondi). C'est elle qui distingue
      « déjà relevé pour CE document » d'un relevé hérité d'une vie
      morte. Absente des écritures d'avant la nº 349 — traitée alors
      comme une autre vie, ce qui est la vérité. */
  ne?: number;
};

/** La naissance de CE document — la même valeur que le script d'avant
    peinture calcule de son côté, arrondie pareil. */
import {
  CLE_ONGLET,
  DEPART_ONGLET_FRAIS_MS,
} from "@/lib/navigation-session";

const NAISSANCE =
  typeof performance === "undefined" ? 0 : Math.round(performance.timeOrigin || 0);

/** Comment ce document est-il arrivé ? `navigate` = une VIE NEUVE du
    site dans cet onglet ; `reload` et `back_forward` = la même vie qui
    continue. */
function typeDArrivee(): string {
  try {
    const entree = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return entree?.type ?? "navigate";
  } catch {
    return "navigate";
  }
}

/**
 * ██ LA RÈGLE DU RÉFÉRENT, ÉCRITE UNE FOIS ET SANS AMBIGUÏTÉ ██
 * ------------------------------------------------------------------
 * UNE PAGE ÉTRANGÈRE EST DERRIÈRE MOI **SEULEMENT SI** LE RÉFÉRENT EST
 * UNE VRAIE ADRESSE D'UNE AUTRE ORIGINE.
 *  · référent VIDE      → personne ne m'a envoyé. C'est le cas de
 *    l'adresse tapée à la main, du signet, du code QR, de la session
 *    restaurée — et de l'entrée FANTÔME que Chrome pose lui-même dans
 *    tout onglet neuf. AUCUNE page étrangère. Le filet doit s'armer.
 *  · référent DE NOTRE ORIGINE → c'est nous. Pas une page étrangère.
 *  · référent D'UNE AUTRE ORIGINE (instagram.com) → LÀ, et là seulement,
 *    le visiteur vient d'ailleurs, et son retour doit l'y ramener.
 *    C'est la borne de la nº 332-§2, entière.
 * Un référent illisible est traité comme vide : on ne renonce jamais
 * sur un doute.
 */
function referentEtranger(): boolean {
  try {
    const referent = document.referrer;
    if (!referent) return false;
    return new URL(referent).origin !== location.origin;
  } catch {
    return false;
  }
}

/**
 * ⚠️ LE RELEVÉ DE SECOURS, ET POURQUOI IL EXISTE (nº 346).
 * ------------------------------------------------------------------
 * À la nº 345, le relevé n'était fait QUE par le script d'avant
 * peinture, et l'absence de relevé retombait sur `history.length <= 1`
 * — c'est-à-dire EXACTEMENT la condition que la passe venait de
 * retirer. Le filet redevenait donc inexistant dès que ce bloc du
 * script ne s'exécutait pas, sans que rien ne le dise.
 *
 * Le relevé du propriétaire, en ligne, montre que ce bloc NE S'EXÉCUTE
 * PAS sur son Chrome : sa toute première ligne de journal est
 * « ARRIVÉE SUR LA PAGE · sonde » — jamais « DOCUMENT OUVERT (avant
 * peinture) », et jamais la mention « enveloppes déjà posées » que le
 * module inscrit quand le script l'a précédé. Or notre relevé est posé
 * dans ce même bloc.
 *
 * DEUX CHANGEMENTS, DONC :
 *  1. LE REPLI SUR `history.length <= 1` EST SUPPRIMÉ. Jamais une
 *     absence de mesure ne doit rétablir en silence la règle fausse.
 *  2. CE MODULE PREND LA MESURE LUI-MÊME s'il ne la trouve pas — au
 *     CHARGEMENT du module, c'est-à-dire avant le premier effet de
 *     React et donc avant qu'aucune entrée n'ait pu être empilée par
 *     le routeur, une surface ou le filet.
 * Le script d'avant peinture reste le meilleur endroit quand il
 * s'exécute : il précède même l'hydratation. Il n'est plus le seul.
 */
/**
 * ██ §5 (nº 867) — VENONS-NOUS D'UNE PAGE DU SITE, DANS CET ONGLET ? ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE, sur son iPhone : « Ma sélection >
 * Portfolio → un profil → se désabonner → retour » le posait sur
 * L'ACCUEIL au lieu de la page d'avant.
 * LA CAUSE, MESURÉE (banc 867-§5) : quand une page du site s'ouvre par
 * une NAVIGATION DE DOCUMENT — et non par la navigation douce du
 * routeur —, le relevé ci-dessous repartait de zéro et posait le
 * plancher À LA HAUTEUR DE LA PILE DU MOMENT. La question « y a-t-il
 * une vraie page derrière moi ? » répondait alors NON alors que la
 * pile en portait quatre : le filet (RetourGaranti) posait son cran au
 * premier appui franc — le bouton « Unfollow », par exemple —, et le
 * retour suivant, atterrissant sous le cran, était rattrapé vers
 * l'accueil. Relevé au banc : plancher 5 pour une pile de 5, alors
 * qu'il valait 2 depuis l'arrivée dans l'onglet.
 * POURQUOI SAFARI ET PAS CHROMIUM : le mécanisme n'est celui d'aucun
 * moteur en particulier — il suffit qu'une page arrive en document
 * plutôt qu'en navigation douce. Safari le fait là où Chromium ne le
 * fait pas (une page qu'il refuse de garder en cache de retour, un
 * document repris après une pression mémoire) ; le banc 867 le
 * reproduit dans Chromium en ouvrant le profil en document, ce qui
 * suffit à faire tomber le défaut et à prouver la correction.
 * LE REMÈDE : le plancher NE SE REPREND PAS quand le document qu'on
 * vient de quitter était une page du site, dans cet onglet, à
 * l'instant. La mémoire d'onglet le dit déjà — elle note l'adresse
 * quittée et l'heure du départ (`noterDepartOnglet`, nº 428) ; on ne
 * mesure rien de neuf, on lit ce qui est écrit.
 * ⚠️ LA BORNE DE LA nº 332 RESTE ENTIÈRE : un visiteur arrivé
 * d'Instagram, d'un signet ou d'une adresse tapée n'a aucun départ
 * frais dans cet onglet — son plancher se reprend comme avant, et son
 * retour le rend au monde extérieur.
 * ⚠️ ÉCRITE DEUX FOIS, ET IL LE FAUT : ici pour le module, et dans le
 * texte du script d'avant peinture (plus bas) — les deux relevés
 * doivent dire la même chose, et le script ne peut rien importer.
 */
function ongletVientDeQuitterUnePage(): boolean {
  try {
    const brut = JSON.parse(
      sessionStorage.getItem(CLE_ONGLET) ?? "null"
    ) as { derniere?: string | null; quand?: number } | null;
    if (!brut?.derniere || typeof brut.quand !== "number") return false;
    return Date.now() - brut.quand < DEPART_ONGLET_FRAIS_MS;
  } catch {
    return false;
  }
}

const RELEVE_AU_CHARGEMENT: BasDeLaPile | null =
  typeof window === "undefined"
    ? null
    : {
        profondeur: window.history.length,
        etranger: referentEtranger(),
        origine: "fallback (module load)",
        ne: NAISSANCE,
      };

/**
 * ██ §2 (nº 349) — LE PLANCHER SE RELÈVE « UNE FOIS PAR VIE » ██
 * ------------------------------------------------------------------
 * LE DÉFAUT CORRIGÉ, mesuré par le propriétaire (relevé nº 348,
 * visite 4) : le relevé était pris UNE FOIS PAR ONGLET. Or chaque
 * éjection laisse les entrées du site ORPHELINES dans l'onglet ; la
 * visite suivante empile par-dessus (piles d'arrivée 2, 2, 3, 4…), et
 * le filet comparait la pile neuve au plancher d'une vie MORTE : il
 * renonçait en croyant « une page du site derrière », alors que
 * personne ne peut redescendre proprement dans un cadavre de visite.
 *
 * LA RÈGLE : une arrivée de type `navigate` est une VIE NEUVE — le
 * plancher redevient la pile de CETTE arrivée, et le filet se réarme
 * au-dessus des restes morts. `reload` et `back_forward` sont la même
 * vie qui continue : le plancher tient. LA BORNE RESTE ENTIÈRE : le
 * référent est réévalué au même instant — arrivé d'Instagram, le
 * filet se tait, comme toujours.
 *
 * Le script d'avant peinture applique la même règle, plus tôt
 * (`releveDuBasPourLeScript`) ; ce bloc-ci est son secours, au
 * chargement du module — avant tout effet, donc avant toute entrée
 * posée par nous. La naissance (`ne`) empêche d'écraser deux fois
 * dans la même vie.
 */
if (typeof window !== "undefined" && RELEVE_AU_CHARGEMENT) {
  try {
    const brut = JSON.parse(
      sessionStorage.getItem(CLE_BAS) ?? "null"
    ) as Partial<BasDeLaPile> | null;
    const memeVie = Boolean(brut && brut.ne === NAISSANCE);
    //  §5 (nº 867) — … ET PAS SI L'ON VIENT D'UNE PAGE DU SITE : voir
    //  la note de `ongletVientDeQuitterUnePage`, juste au-dessus.
    if (
      !brut ||
      (typeDArrivee() === "navigate" &&
        !memeVie &&
        !ongletVientDeQuitterUnePage())
    ) {
      sessionStorage.setItem(CLE_BAS, JSON.stringify(RELEVE_AU_CHARGEMENT));
    }
  } catch {
    // stockage refusé : la mesure en mémoire de module servira seule
  }
}

export function lireLeBasDeLaPile(): BasDeLaPile | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = sessionStorage.getItem(CLE_BAS);
    if (brut) {
      const lu = JSON.parse(brut) as Partial<BasDeLaPile>;
      if (typeof lu?.profondeur === "number") {
        return {
          profondeur: lu.profondeur,
          etranger: Boolean(lu.etranger),
          //  §B (nº 347) — le relevé porte désormais SA SIGNATURE. Une
          //  écriture d'une passe d'avant en est dépourvue : on le dit,
          //  plutôt que de le déguiser en l'une des deux vraies.
          origine: lu.origine ?? "(written before no. 347)",
          ne: typeof lu.ne === "number" ? lu.ne : undefined,
        };
      }
    }
  } catch {
    // mémoire d'onglet refusée : on continue avec la mesure de secours
  }
  if (!RELEVE_AU_CHARGEMENT) return null;
  //  On l'écrit pour les documents suivants de cet onglet, si on peut.
  try {
    if (sessionStorage.getItem(CLE_BAS) === null) {
      sessionStorage.setItem(CLE_BAS, JSON.stringify(RELEVE_AU_CHARGEMENT));
    }
  } catch {
    // stockage refusé : la mesure vit alors le temps du document
  }
  return RELEVE_AU_CHARGEMENT;
}

/**
 * A — AUCUNE PAGE DU SITE N'EST DERRIÈRE MOI.
 * ------------------------------------------------------------------
 * La pile n'a pas grandi depuis notre arrivée : rien de nous ne s'est
 * glissé dessous. C'est une comparaison entre DEUX MESURES À NOUS, pas
 * une hypothèse sur ce que contient l'onglet.
 *
 * ⚠️ ELLE REDEVIENT VRAIE APRÈS UN `location.replace` — c'est voulu :
 * un remplacement ne fait pas grandir la pile, et le filet qui vient
 * de jouer doit pouvoir se reposer pour le retour suivant.
 */
export function aucunePageDuSiteDerriere(): boolean {
  const bas = lireLeBasDeLaPile();
  //  Aucune mesure du tout (rendu serveur) : on ne décide rien.
  if (!bas) return false;
  return window.history.length <= bas.profondeur;
}

/** B — UNE VRAIE PAGE ÉTRANGÈRE EST DERRIÈRE MOI. La borne de la
    nº 332-§2 : son retour doit l'y ramener. */
export function unePageEtrangereEstDerriere(): boolean {
  return lireLeBasDeLaPile()?.etranger ?? false;
}

/** LA QUESTION DU FILET, EN UN SEUL MOT : il n'y a VRAIMENT rien
    derrière — ni à nous, ni à personne. */
export function rienDeVraiDerriere(): boolean {
  return aucunePageDuSiteDerriere() && !unePageEtrangereEstDerriere();
}

/* ==================================================================
 * §3 (nº 790) — LA LIGNE DE DÉCISION ET LE DÉPÔT DU VERDICT SONT
 * PARTIS AVEC LEUR LECTEUR
 * ==================================================================
 * CE QUI VIVAIT ICI, ET POURQUOI CE N'EST PLUS UTILE. Le filet écrivait
 * à chaque arrivée une ligne disant qui avait décidé (`ligneDeDecision`,
 * nº 346), et la DÉPOSAIT en mémoire d'onglet (`deposerLeVerdict`,
 * nº 347) pour qu'elle survive à un journal ouvert plus tard. Ce
 * journal — celui de l'historique, `?sonde-historique=1` — est retiré
 * au grand ménage de la nº 790 : plus personne ne lisait le dépôt, qui
 * n'était donc plus qu'une écriture de session par navigation.
 * ⚠️ CE QUI RESTE, ET C'EST LE VRAI MÉCANISME : le RELEVÉ DU BAS DE LA
 * PILE (`releveDuBasPourLeScript`, plus bas) — « y a-t-il une vraie
 * page derrière moi ? » —, que le script d'avant peinture exécute et
 * dont le filet se sert pour décider. Lui n'a jamais été une sonde.
 */


/* ==================================================================
 * CE QUE LE SCRIPT D'AVANT PEINTURE EXÉCUTE
 * ================================================================== */

/**
 * LE RELEVÉ, AU PLUS TÔT — et il ne peut pas être fait plus tard.
 * ------------------------------------------------------------------
 * La profondeur d'arrivée doit être lue AVANT que quiconque empile :
 * le routeur de Next, une surface refermable, le filet lui-même. Le
 * script d'avant peinture est le seul endroit qui précède tout le
 * monde. Lu depuis un effet React, le relevé aurait compté nos propres
 * entrées comme si elles étaient là avant nous.
 *
 * ⚠️ IL N'ÉCRIT QU'UNE FOIS PAR ONGLET — au PREMIER document du site.
 * Les documents suivants (une navigation qui recharge, un retour d'un
 * document à l'autre) le laissent tel quel : c'est notre arrivée qu'il
 * date, pas chaque page.
 *
 * ⚠️ IL N'AJOUTE AUCUNE ENTRÉE D'HISTORIQUE, ne pose aucun attribut,
 * n'écoute rien, et tout ce qui touche au stockage est enveloppé — en
 * navigation privée stricte, y accéder JETTE.
 */
export function releveDuBasPourLeScript(): string {
  const cle = JSON.stringify(CLE_BAS);
  //  §B (nº 347) — le relevé SIGNE d'où il vient. Si le relevé en
  //  ligne du propriétaire dit toujours « secours », ce bloc-ci ne
  //  tourne pas là-bas — et la cause est dans la page servie, pas
  //  dans la règle.
  //  §2 (nº 349) — « UNE FOIS PAR VIE », plus « une fois par onglet » :
  //  une arrivée `navigate` reprend le plancher (les entrées restées
  //  d'une visite morte ne comptent plus comme « du site ») ; `reload`
  //  et `back_forward` gardent le relevé de leur vie. Même règle que
  //  le secours du module, mêmes champs, même arrondi de naissance.
  //  §5 (nº 867) — LA MÊME EXCEPTION QUE LE MODULE : un document né
  //  d'une page du site, dans cet onglet, à l'instant, ne reprend PAS le
  //  plancher (voir `ongletVientDeQuitterUnePage`, plus haut — c'est la
  //  même règle, écrite dans la langue du script).
  const cleOnglet = JSON.stringify(CLE_ONGLET);
  return `(function(){
var ne=Math.round(performance.timeOrigin||0);
var t="navigate";
try{t=(performance.getEntriesByType("navigation")[0]||{}).type||"navigate"}catch(x){}
var brut=null;try{brut=JSON.parse(sessionStorage.getItem(${cle})||"null")}catch(x){}
var o=null;try{o=JSON.parse(sessionStorage.getItem(${cleOnglet})||"null")}catch(x){}
var duSite=!!(o&&o.derniere&&typeof o.quand==="number"&&Date.now()-o.quand<${DEPART_ONGLET_FRAIS_MS});
if(brut&&(t!=="navigate"||brut.ne===ne||duSite))return;
var e=false;
try{e=!!document.referrer&&new URL(document.referrer).origin!==location.origin}catch(x){}
sessionStorage.setItem(${cle},JSON.stringify({profondeur:history.length,etranger:e,origine:"before paint",ne:ne}));
})()`;
}
