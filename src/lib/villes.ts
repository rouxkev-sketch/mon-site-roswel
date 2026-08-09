/**
 * LE NOM D'UNE COMMUNE, CÔTÉ DONNÉES
 * -----------------------------------
 * ⚠️ CE N'EST PLUS UNE FONCTION D'AFFICHAGE (passe nº 114). Elle
 * normalise ce qu'on ENREGISTRE : le mot « arrondissement » disparaît,
 * le NUMÉRO reste — « Lyon 3e Arrondissement » → « Lyon 3e ».
 *
 * POURQUOI LE NUMÉRO RESTE ICI : c'est lui qui distingue deux
 * arrondissements dans le formulaire, et surtout c'est de lui que
 * sortent les SLUGS déjà publiés et indexés
 * (/tatoueur/atelier-corvus-lyon-1er, /tatouage/realisme/lyon-1er). Les
 * changer casserait tous les liens partagés.
 *
 * ⚠️ POUR AFFICHER une ville — cartes, fiches, moteur, titres — c'est
 * `villeAffichee` de lib/adresse qu'il faut appeler : elle retire aussi
 * le numéro (« Lyon 1er » → « Lyon »). Ne jamais l'appeler avant un
 * `slugifier`.
 */

/** « Lyon 3e Arrondissement » → « Lyon 3e » ; « Paris 1er Arrondissement » → « Paris 1er » */
export function nomVilleCourt(nom: string): string {
  return nom.replace(/\s+arrondissement$/i, "").trim();
}

/**
 * Abrège « Saint » / « Sainte » quand la place manque :
 *   « Saint-Priest »        → « St-Priest »
 *   « Sainte-Foy-lès-Lyon » → « Ste-Foy-lès-Lyon »
 * Utilisé UNIQUEMENT en dernier recours, quand le nom complet ne tient
 * pas dans la largeur disponible (cartes sur écrans étroits) : mieux
 * vaut « St-Priest » en entier que « Sain… » tronqué.
 */
export function abregerSaint(nom: string): string {
  return nom
    .replace(/\bSainte[-\s]/gi, "Ste-")
    .replace(/\bSaint[-\s]/gi, "St-");
}

/** Le format unique d'affichage : « Nom (code postal) » */
export function formatVille(nom: string, codePostal?: string | null): string {
  const court = nomVilleCourt(nom);
  return codePostal ? `${court} (${codePostal})` : court;
}

/**
 * Années entières d'existence d'une entreprise, à partir de sa date
 * de création renvoyée par l'annuaire officiel (API Sirene) lors de
 * la vérification du SIREN. Recalculé à chaque affichage : jamais
 * saisi à la main.
 */
export function anneesExistence(dateCreation: string): number {
  const annees =
    (Date.now() - new Date(dateCreation).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(annees));
}
