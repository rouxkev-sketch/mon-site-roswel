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

/*  ██ nº 765 — TROIS FONCTIONS SONT PARTIES D'ICI ██
    Ce module en portait quatre ; il n'en reste qu'une. Les trois
    autres ne servaient QUE le produit artisans, supprimé aux passes
    nº 759 à 764, et plus personne ne les nommait — vérifié dans tout
    le dépôt, code, outils et bancs compris : une seule occurrence
    chacune, leur propre définition.
     · `abregerSaint`   — « Saint-Priest » → « St-Priest », le dernier
       recours des cartes d'artisans sur écrans étroits ;
     · `formatVille`    — « Nom (code postal) », leur format
       d'affichage ;
     · `anneesExistence` — l'ancienneté d'une entreprise d'après sa
       date de création à l'annuaire Sirene, lue à la vérification du
       SIREN. Rien de tout cela n'existe plus.
    ⚠️ CE QUI RESTE, `nomVilleCourt`, N'EST PAS DU MÊME ORDRE : c'est
    la normalisation de ce qu'on ENREGISTRE, lue par le géocodage et
    par le catalogue des tatoueurs. Elle vit. */
