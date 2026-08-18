/*  ⚠️ PAS DE DIRECTIVE « use client » ICI, ET C'EST VOULU — la même
    raison qu'à lib/journal-historique : le script d'avant peinture est
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
export const CLE_BAS = "roswel:bas-de-la-pile";

export type BasDeLaPile = {
  /** `history.length` à notre arrivée dans cet onglet, relevé AVANT
      qu'une seule ligne du site ait pu empiler quoi que ce soit. */
  profondeur: number;
  /** Une vraie page d'un AUTRE site nous a-t-elle menés ici ? */
  etranger: boolean;
};

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
const RELEVE_AU_CHARGEMENT: BasDeLaPile | null =
  typeof window === "undefined"
    ? null
    : { profondeur: window.history.length, etranger: referentEtranger() };

/** D'où vient la mesure qu'on a utilisée — le journal le dit. */
let origineDuReleve = "aucune";

export function lireLeBasDeLaPile(): BasDeLaPile | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = sessionStorage.getItem(CLE_BAS);
    if (brut) {
      const lu = JSON.parse(brut) as Partial<BasDeLaPile>;
      if (typeof lu?.profondeur === "number") {
        origineDuReleve = "avant peinture";
        return { profondeur: lu.profondeur, etranger: Boolean(lu.etranger) };
      }
    }
  } catch {
    // mémoire d'onglet refusée : on continue avec la mesure de secours
  }
  if (!RELEVE_AU_CHARGEMENT) return null;
  origineDuReleve = "secours (chargement du module)";
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

/**
 * LA LIGNE UNIQUE QUI DIT CE QUI A DÉCIDÉ (nº 346).
 * ------------------------------------------------------------------
 * Demandée par le propriétaire : la profondeur de pile, le référent
 * EXACT, et laquelle des deux questions a fait renoncer le filet. Une
 * seule ligne, à l'arrivée, pour qu'une hypothèse fausse se voie en une
 * lecture au lieu d'un tour perdu.
 */
export function ligneDeDecision(decision: string): string {
  const bas = lireLeBasDeLaPile();
  const referent = typeof document === "undefined" ? "" : document.referrer;
  return (
    `FILET ${decision} · pile ${window.history.length}` +
    ` · profondeur d'arrivée ${bas ? bas.profondeur : "(aucune)"}` +
    ` [${origineDuReleve}]` +
    ` · référent «${referent}»` +
    ` · étrangère derrière : ${bas?.etranger ? "OUI" : "non"}`
  );
}

/*  ⚠️ AUCUNE SONDE N'EST TOUCHÉE PAR CETTE PASSE, et c'est une consigne
    du propriétaire : `?sonde-historique=1` et `?sonde-retour=1`
    fonctionnent exactement comme avant. Le voyant n'a rien à ajouter —
    le journal de l'historique NOMME déjà l'auteur de chaque entrée
    d'après la marque de son état (`origineDeLEtat`, journal-historique),
    et l'étape du filet porte `retourReconstruit`. Une ligne
    « POSÉE · RetourGaranti » dans le journal EST le voyant. */

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
  return `(function(){
if(sessionStorage.getItem(${cle})!==null)return;
var e=false;
try{e=!!document.referrer&&new URL(document.referrer).origin!==location.origin}catch(x){}
sessionStorage.setItem(${cle},JSON.stringify({profondeur:history.length,etranger:e}));
})()`;
}
