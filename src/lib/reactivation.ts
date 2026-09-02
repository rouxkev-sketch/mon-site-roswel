/**
 * ██ nº 819 — LE BOUTON DES COURRIELS DE SUPPRESSION ██
 * ==================================================================
 * Les deux courriels « en cours de suppression » (compte, portfolio —
 * lib/courriels-suppression) portent un bouton « Reactivate my … » qui
 * mène à la page Sécurité avec un paramètre : `?reactiver=compte`, ou
 * `?reactiver=<identifiant du portfolio>`. La page (BlocSuppressions)
 * lit ce paramètre à son ouverture et joue l'annulation EXISTANTE —
 * `POST /api/tatoueur/reactiver` pour le compte, `supprimer-fiche` avec
 * `annuler: true` pour un portfolio — puis efface le paramètre de
 * l'adresse, pour qu'un rechargement ne rejoue rien.
 * Déconnecté, la page Sécurité renvoie à la connexion en gardant cette
 * adresse en `suite` (Securite) ; et se connecter annule déjà la
 * suppression du compte (EcranAuthentification, nº 313) — le bouton
 * tient donc dans les deux cas.
 * Ces trois constantes sont lues des deux côtés (routes serveur, pages
 * client) : ce module n'importe rien, pour pouvoir aller partout.
 */
export const CHEMIN_SECURITE = "/devenir-tatoueur/securite";
export const PARAM_REACTIVER = "reactiver";
export const REACTIVER_COMPTE = "compte";

/** L'adresse relative de la réactivation d'une cible (`compte`, ou
    l'identifiant d'un portfolio). */
export function cheminDeReactivation(cible: string): string {
  return `${CHEMIN_SECURITE}?${PARAM_REACTIVER}=${encodeURIComponent(cible)}`;
}
