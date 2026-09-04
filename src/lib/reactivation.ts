/**
 * ██ nº 819 — LE BOUTON DES COURRIELS DE SUPPRESSION ██
 * ==================================================================
 * Les deux courriels « en cours de suppression » (compte, portfolio —
 * lib/courriels-suppression) portent un bouton « Reactivate my … » qui
 * mène sur le site avec un paramètre : `?reactiver=compte`, ou
 * `?reactiver=<identifiant du portfolio>`. La page d'arrivée lit ce
 * paramètre et joue l'annulation EXISTANTE —
 * `POST /api/tatoueur/reactiver` pour le compte, `supprimer-fiche` avec
 * `annuler: true` pour un portfolio — puis efface le paramètre de
 * l'adresse, pour qu'un rechargement ne rejoue rien
 * (components/ReactivationParCourriel).
 * Ces constantes sont lues des deux côtés (routes serveur, pages
 * client) : ce module n'importe rien, pour pouvoir aller partout.
 *
 * ██ §1 (nº 832) — LE BOUTON N'ARRIVE PLUS SUR « SÉCURITÉ » ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : les deux boutons menaient à la page
 * Sécurité — la page d'où l'on SUPPRIME. On y revenait pour annuler,
 * et l'on se retrouvait devant les boutons de suppression, sans voir
 * ce qui venait d'être sauvé.
 * LA DESTINATION EST DÉSORMAIS CE QU'ON A RÉCUPÉRÉ :
 *  · un portfolio → « My portfolio » (/become-an-artist/portfolio) ;
 *  · un compte    → « My selection » (/my-favorites).
 * Le geste, lui, ne change pas d'un iota : le paramètre voyage avec
 * l'adresse, et c'est la page d'arrivée qui joue l'annulation.
 * ⚠️ LES DEUX CHEMINS SONT ÉCRITS ICI PLUTÔT QU'IMPORTÉS : ce module
 * est lu par des routes serveur ET par des pages client, et les
 * modules qui portent déjà « /my-favorites » (memoire-selection,
 * surface-affichage) tirent avec eux tout l'outillage de la mosaïque.
 * Un module sans dépendance est la condition pour qu'il aille partout.
 */
export const CHEMIN_SECURITE = "/become-an-artist/security";
/** « My portfolio » — l'espace du portfolio, dans le menu du compte. */
export const CHEMIN_MON_PORTFOLIO = "/become-an-artist/portfolio";
/** « My selection » — les favoris. */
export const CHEMIN_MA_SELECTION = "/my-favorites";
export const PARAM_REACTIVER = "reactiver";
export const REACTIVER_COMPTE = "compte";

/**
 * L'adresse relative de la réactivation d'une cible (`compte`, ou
 * l'identifiant d'un portfolio) — page d'arrivée comprise.
 */
export function cheminDeReactivation(cible: string): string {
  const page =
    cible === REACTIVER_COMPTE ? CHEMIN_MA_SELECTION : CHEMIN_MON_PORTFOLIO;
  return `${page}?${PARAM_REACTIVER}=${encodeURIComponent(cible)}`;
}

/**
 * ██ §2 (nº 832) — LE RENVOI QUI GARDE LE GESTE ██
 * ------------------------------------------------------------------
 * Cliquer le bouton quand on est DÉCONNECTÉ est le cas NORMAL, pas le
 * cas rare : demander la suppression de son compte déconnecte
 * (BlocSuppressions). Les deux pages d'arrivée renvoient alors à la
 * connexion — mais chacune le faisait à sa façon, et aucune ne gardait
 * l'adresse : « Ma sélection » rentrait à l'accueil (nº 820), « My
 * portfolio » filait sur /become-an-artist sans rien emporter. Le
 * paramètre — donc le geste — était perdu dans les deux cas.
 * Cette fonction est LA règle, écrite une fois pour les trois pages
 * qui la suivent : avec le paramètre, on garde l'adresse entière en
 * `suite` ; sans lui, on rend le renvoi ordinaire, et rien ne change
 * pour les visites déconnectées habituelles.
 */
export function connexionEnGardantLaReactivation(
  chemin: string,
  recherche: string,
  ordinaire = "/become-an-artist"
): string {
  if (!recherche.includes(`${PARAM_REACTIVER}=`)) return ordinaire;
  return `/become-an-artist?suite=${encodeURIComponent(chemin + recherche)}`;
}
