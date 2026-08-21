/**
 * LES CLÉS DU JOURNAL DE LA SONDE-BASCULE — SEULES, DANS UN MODULE NU
 * ==================================================================
 * §2 (nº 428) — POURQUOI CE FICHIER EXISTE : le script d'avant-peinture
 * est généré AU SERVEUR, et il doit interpoler ces clés (le filet de
 * réparation du repli écrit sa ligne au journal de la sonde). Or leur
 * foyer naturel, lib/journal-bascule, est un module « use client » :
 * importé depuis du code serveur, un tel module n'expose pas ses
 * constantes — chaque export devient une référence opaque de composant
 * client, et l'interpolation rendait littéralement « undefined »
 * (mesuré sur le HTML prérendu de cette passe). Les clés vivent donc
 * ici, sans directive ; journal-bascule les importe et reste l'unique
 * écrivain du journal.
 */

/** Le journal lui-même (sessionStorage) — un tableau de lignes
    `{ t, texte }`, relu par la sonde à chaque page. */
export const CLE_JOURNAL = "yokofolio:sonde-bascule:journal";

/** L'armement durable de la sonde (sessionStorage, valeur "1"). */
export const CLE_ARMEE = "yokofolio:sonde-bascule";
