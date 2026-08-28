"use client";

import type { creerClientSupabaseNavigateur } from "./client";

/**
 * ██ §1 (nº 703) — LE CLIENT SUPABASE, CHARGÉ SEULEMENT QUAND ON S'EN
 * SERT ██
 * ==================================================================
 * LE DÉFAUT MESURÉ (plan nº 701, étape L3). La bibliothèque du client
 * de la base pèse 62 Ko compressés, et elle était téléchargée SUR
 * TOUTES LES PAGES — y compris les mentions légales et la page de
 * contact, qui ne lisent RIEN. Vérifié au banc de la nº 703 avant de
 * toucher quoi que ce soit : le fichier partait bien sur ces trois
 * pages-là.
 *
 * POURQUOI ELLE Y ÉTAIT. Deux fichiers du tronc l'importaient
 * DIRECTEMENT — `use-utilisateur` (l'écoute de la session) et
 * `MenuEspace` (la lecture du compte). Un import direct est résolu à
 * la compilation : le fichier part avec la page, qu'on l'appelle ou
 * non. Deux lignes suffisaient à peser 62 Ko partout.
 *
 * CE QUE CETTE ÉCRITURE CHANGE, ET RIEN DE PLUS. Elle rend le même
 * client, avec le même délai de garde (nº 686) et les mêmes réglages —
 * `./client` reste LA définition, on ne la duplique pas. Seul le
 * MOMENT change : l'`import()` ne part qu'au premier appel.
 *
 * ⚠️ CE QUI NE DÉPEND PAS D'ELLE, ET C'EST TOUT LE POINT : l'identité
 * de la personne connectée est lue DANS LE COOKIE, sans la moindre
 * bibliothèque (acquis nº 632). L'avatar, le nom affiché, le point
 * rose, l'état connecté du premier rendu : tout cela était déjà servi
 * sans supabase, et continue de l'être — au même instant qu'avant.
 * ⚠️ UN SEUL CHARGEMENT PAR PAGE : la promesse est retenue. Vingt
 * appels ne font qu'un téléchargement, et les appels suivants
 * répondent sans attendre le réseau.
 * ⚠️ ELLE NE REMPLACE PAS `./client` PARTOUT : les écrans qui vivent
 * déjà dans un fichier chargé à la demande (l'éditeur, les fenêtres du
 * compte, l'authentification) gardent l'import direct — il ne coûte
 * rien là où le fichier n'est lui-même chargé qu'au besoin, et le
 * garder évite de rendre asynchrone du code qui n'en a aucun besoin.
 * Seuls les DEUX fichiers du tronc passent par ici.
 */

type ClientNavigateur = ReturnType<typeof creerClientSupabaseNavigateur>;

/*  La promesse du module, retenue : c'est elle qui garantit un seul
    téléchargement, et un seul client, pour toute la vie de la page. */
let enCours: Promise<ClientNavigateur> | null = null;

export function clientSupabaseALaDemande(): Promise<ClientNavigateur> {
  if (!enCours) {
    enCours = import("./client").then((module) =>
      module.creerClientSupabaseNavigateur()
    );
  }
  return enCours;
}
