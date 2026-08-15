/**
 * LE CATALOGUE DE DÉMONSTRATION EST UN OUTIL DE DÉVELOPPEMENT
 * ==================================================================
 * (passe nº 278-§4)
 *
 * CE QU'IL EST. `lib/tatoueurs-demo` porte une vingtaine de fiches
 * ÉCRITES DANS LE CODE — noms inventés, adresses inventées, photos
 * dessinées à la volée. Elles servaient de filet : base injoignable,
 * migration pas encore passée, le site montrait quelque chose au lieu
 * d'une page blanche. C'est précieux en développement, et c'est ce qui
 * fait tourner les bancs de vérification de ce dépôt.
 *
 * POURQUOI IL NE DOIT JAMAIS SORTIR EN LIGNE. Un visiteur qui tombe sur
 * une de ces fiches croit qu'elle est vraie : il clique, essaie de
 * contacter un tatoueur qui n'existe pas, et conclut que le site est
 * bidon. Un moteur de recherche, lui, peut les rencontrer et les
 * garder. Une panne de base est un incident d'une heure ; de faux
 * tatoueurs indexés, c'est durable.
 *
 * LA RÈGLE, ET ELLE N'A QU'UNE ÉCRITURE — CELLE-CI :
 *  · EN DÉVELOPPEMENT (`NODE_ENV !== "production"`), le catalogue prend
 *    le relais comme avant. Rien ne change pour les bancs ni pour le
 *    travail local ;
 *  · EN PRODUCTION, il est INTERDIT. Une base injoignable rend une
 *    liste VIDE et un message honnête (`MESSAGE_INDISPONIBLE`) : le
 *    site est momentanément indisponible. Aucune fausse fiche servie,
 *    donc aucune indexable, et aucune joignable par son adresse.
 *
 * ⚠️ UNE SOUPAPE EXISTE, ET ELLE EST EXPLICITE : `CATALOGUE_DEMO=1`
 * dans l'environnement rallume le catalogue même en production. Elle
 * n'est là que pour une vérification volontaire du propriétaire, sur
 * un déploiement d'essai ; elle n'est jamais posée par défaut, et le
 * banc vérifie qu'elle est absente d'`.env.local`.
 */

/** Le message servi en production quand la base ne répond pas. Il ne
    nomme ni la base, ni l'erreur : un visiteur n'a rien à en faire, et
    une pile d'erreur affichée est une fuite d'information. */
export const MESSAGE_INDISPONIBLE =
  "Le site est momentanément indisponible. Réessaie dans un instant.";

/**
 * A-T-ON LE DROIT DE SERVIR LES FICHES DE DÉMONSTRATION ?
 * Lue par TOUS les points de repli (recherche, fiche par slug, ancien
 * slug, ville, suggestions de lieux) : aucun d'eux ne redéfinit la
 * règle, ils posent tous la question ici.
 */
export function catalogueDemoAutorise(): boolean {
  if (process.env.CATALOGUE_DEMO === "1") return true;
  return process.env.NODE_ENV !== "production";
}
