import { MENU_SUIVIS, PARAM_SELECTION } from "@/lib/filtres-selection";

/**
 * ██ nº 819 — LE SQUELETTE-MÉMOIRE DE « MA SÉLECTION » ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE (point 2) : pendant que la page se
 * prépare, l'habillage d'attente (mes-favoris/loading, SqueletteSelection)
 * montrait des CARTES grises — même à un compte qui n'a rien gardé, et
 * à qui aucune carte ne viendra : la promesse d'une liste, puis l'état
 * vide ou la bienvenue. Une promesse fausse.
 *
 * LA RÈGLE NOUVELLE : le navigateur SE SOUVIENT de ce que ce compte
 * avait à sa dernière visite — des favoris, des portfolios — et le
 * squelette suit la mémoire :
 *  · il en avait      → les cartes grises, comme avant ;
 *  · il n'en avait pas, ou premier passage (aucune mémoire, ou la
 *    mémoire d'un AUTRE compte) → le fond neutre, calme : la barre et
 *    rien dessous, aucune promesse ;
 *  · puis la vraie réponse peint ce qui est : cartes, bienvenue ou
 *    état vide.
 * Chaque onglet a sa mémoire (Favorites / Portfolios) : la mémoire
 * garde les deux, l'adresse dit lequel on attend.
 *
 * LA MÉCANIQUE EST CELLE DE L'AMORTI DU COMPTE (`data-compte`, nº 357) :
 * un attribut sur <html>, posé AVANT LA PREMIÈRE PEINTURE par le
 * script d'avant peinture (chargement complet — la mémoire est lue
 * dans localStorage, le compte dans le cookie de session), ou par le
 * squelette lui-même, avant sa peinture, quand la navigation est douce
 * (le script ne rejoue pas dans le même document) ; et une garde CSS
 * (globals.css) qui ne montre la grille grise que si l'attribut dit
 * « cartes ». Rien n'est peint puis corrigé.
 *
 * QUI ÉCRIT LA MÉMOIRE : « Ma sélection » (PageFavoris), une fois ses
 * listes connues — le compte, et deux booléens. QUI LA LIT : ce module
 * (navigation douce) et le script d'avant peinture, par
 * `blocMemoireSelectionPourLeScript` — la même clé, le même format,
 * écrits une fois ici et livrés au script sous forme de texte (le motif
 * de `expressionColonnes`, lib/colonnes-mosaique).
 * ⚠️ LA MÉMOIRE EST CELLE D'UN COMPTE : elle porte son identifiant, et
 * ne vaut que pour lui. Un autre compte sur le même navigateur repart
 * du calme — jamais des cartes d'un autre.
 */

/** La clé du magasin local, écrite ici et nulle part ailleurs. */
export const CLE_MEMOIRE_SELECTION = "yokofolio:selection";
/** La page dont on parle — la seule qui ait cette mémoire. */
export const CHEMIN_SELECTION = "/mes-favoris";
/** La clé `dataset` sur <html> : `html[data-selection-memoire]`. */
export const ATTRIBUT_MEMOIRE_SELECTION = "selectionMemoire";
export const MEMOIRE_CARTES = "cartes";
export const MEMOIRE_CALME = "calme";

export type MemoireSelection = {
  compte: string;
  favoris: boolean;
  suivis: boolean;
};

export type OngletSelection = "favoris" | "suivis";

/** Ce que ce compte avait, noté pour la prochaine visite. */
export function ecrireMemoireSelection(
  compte: string,
  favoris: boolean,
  suivis: boolean
): void {
  try {
    const memoire: MemoireSelection = { compte, favoris, suivis };
    localStorage.setItem(CLE_MEMOIRE_SELECTION, JSON.stringify(memoire));
  } catch {
    //  Stockage refusé (navigation privée stricte) : pas de mémoire,
    //  donc le calme — jamais une promesse.
  }
}

/** La mémoire de CE compte, ou rien (aucune, ou celle d'un autre). */
export function lireMemoireSelection(
  compte: string | null
): MemoireSelection | null {
  if (!compte) return null;
  try {
    const brut = localStorage.getItem(CLE_MEMOIRE_SELECTION);
    if (!brut) return null;
    const lue = JSON.parse(brut) as Partial<MemoireSelection> | null;
    if (!lue || lue.compte !== compte) return null;
    return { compte, favoris: Boolean(lue.favoris), suivis: Boolean(lue.suivis) };
  } catch {
    return null;
  }
}

/** L'onglet qu'une adresse de « Ma sélection » attend : Portfolios
    quand `selection=suivis` (ou `suivis:<filtre>`), Favorites sinon —
    la lecture de `lireSelection`, réduite à ce choix. */
export function ongletDeLAdresse(recherche: string): OngletSelection {
  const valeur = new URLSearchParams(recherche).get(PARAM_SELECTION) ?? "";
  return valeur === MENU_SUIVIS || valeur.startsWith(`${MENU_SUIVIS}:`)
    ? "suivis"
    : "favoris";
}

/** Cartes ou calme, d'après la mémoire et l'onglet attendu. */
export function etatDuSquelette(
  memoire: MemoireSelection | null,
  onglet: OngletSelection
): string {
  if (!memoire) return MEMOIRE_CALME;
  return (onglet === "suivis" ? memoire.suivis : memoire.favoris)
    ? MEMOIRE_CARTES
    : MEMOIRE_CALME;
}

/** Pose l'attribut sur <html> pour l'adresse courante — la voie de la
    navigation DOUCE (le squelette, avant sa peinture). */
export function poserMemoireSelection(compte: string | null): void {
  try {
    document.documentElement.dataset[ATTRIBUT_MEMOIRE_SELECTION] =
      etatDuSquelette(lireMemoireSelection(compte), ongletDeLAdresse(location.search));
  } catch {
    //  Pas de document : rien à poser.
  }
}

/**
 * Le même relevé, pour le script d'avant peinture (chargement complet) :
 * la mémoire dans localStorage, le compte dans le cookie de session
 * (`sb-<projet>-auth-token`, en un ou plusieurs morceaux, « base64- »
 * devant — la lecture de lib/session-cookie, réduite à l'identifiant),
 * l'onglet dans l'adresse. Tout est protégé : au moindre doute, le
 * calme. `r` est <html>, comme dans le reste du script.
 */
export function blocMemoireSelectionPourLeScript(): string {
  const chemin = JSON.stringify(CHEMIN_SELECTION);
  const cle = JSON.stringify(CLE_MEMOIRE_SELECTION);
  const param = JSON.stringify(PARAM_SELECTION);
  const suivis = JSON.stringify(MENU_SUIVIS);
  const cartes = JSON.stringify(MEMOIRE_CARTES);
  const calme = JSON.stringify(MEMOIRE_CALME);
  return `try{if(location.pathname===${chemin}){var sm=${calme};
var ms=null;try{ms=JSON.parse(localStorage.getItem(${cle})||"null")}catch(e){}
if(ms&&ms.compte){var sc=document.cookie.split("; ").filter(function(c){return /^sb-[^=]*-auth-token(\\.\\d+)?=/.test(c)});
sc.sort(function(a,b){var na=/\\.(\\d+)=/.exec(a),nb=/\\.(\\d+)=/.exec(b);return (na?+na[1]:-1)-(nb?+nb[1]:-1)});
var sv=sc.map(function(c){return c.slice(c.indexOf("=")+1)}).join("");try{sv=decodeURIComponent(sv)}catch(e){}
if(sv.indexOf("base64-")===0)sv=atob(sv.slice(7).replace(/-/g,"+").replace(/_/g,"/"));
var sid=null;try{sid=JSON.parse(sv).user.id}catch(e){}
if(sid===ms.compte){var so=new URLSearchParams(location.search).get(${param})||"";var ss=so===${suivis}||so.indexOf(${suivis}+":")===0;sm=(ss?ms.suivis:ms.favoris)?${cartes}:${calme}}}
r.dataset.${ATTRIBUT_MEMOIRE_SELECTION}=sm}}catch(e){}`;
}
