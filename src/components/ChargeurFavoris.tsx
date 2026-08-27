"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  demanderMesFavoris,
  ecranAvecCoeurs,
  oublierLesMiens,
} from "@/lib/favoris-yokofolio";

/**
 * ALLUMER LES CŒURS DÉJÀ POSÉS — LÀ OÙ IL Y EN A
 * ===============================================
 * Il n'affiche RIEN. Il demande une fois, par document, la liste de ce
 * que ce compte a enregistré — juste des identifiants — et la donne au
 * magasin partagé ; tous les cœurs de la mosaïque, des fiches et des
 * fenêtres s'allument alors d'un coup. Et il OUBLIE à la déconnexion.
 * Depuis la nº 684, il ne demande plus rien sur les écrans qui n'ont
 * aucun cœur à allumer.
 *
 * ██ §1 (nº 684) — IL NE DEMANDE PLUS RIEN SUR LES ÉCRANS SANS CŒUR ██
 * ------------------------------------------------------------------
 * Il demandait la liste à son montage, et il est monté dans LA MISE EN
 * PAGE : la demande partait donc sur chaque page connectée — Sécurité,
 * Administration, l'éditeur, « Après connexion » —, qui sont des
 * formulaires et n'ont pas un cœur à montrer. Le balayage nº 681 l'a
 * mesurée à ~410 ms, dans le trio qui tenait ces pages au-dessus de
 * 1 200 ms. La liste de ces écrans, et POURQUOI elle est écrite à la
 * main plutôt que déduite, vit dans `lib/favoris-yokofolio`.
 *
 * ⚠️ IL SUIT L'ADRESSE, ET C'EST NÉCESSAIRE : cette mise en page ne se
 * remonte pas d'une navigation douce à l'autre. Sans le chemin dans les
 * dépendances, quitter « Sécurité » pour une page à cœurs ne
 * déclencherait jamais la demande. Le verrou de `chargerLesMiens` fait
 * que vingt navigations ne coûtent toujours qu'UNE requête.
 * ⚠️ SA CRAINTE HISTORIQUE EST SANS OBJET, et elle l'était déjà : « une
 * mosaïque de vingt-quatre cartes ferait vingt-quatre demandes ».
 * `chargerLesMiens` porte ce verrou depuis toujours.
 *
 * ⚠️ L'OUBLI, LUI, TOURNE PARTOUT, SANS EXCEPTION D'ÉCRAN : le visiteur
 * suivant sur ce navigateur ne doit rien voir du compte précédent — et
 * on peut très bien se déconnecter depuis « Sécurité ».
 */
export function ChargeurFavoris() {
  const { utilisateur, pret } = useUtilisateur();
  const id = utilisateur?.id ?? null;
  const chemin = usePathname();

  useEffect(() => {
    if (!pret) return;
    if (!id) {
      oublierLesMiens();
      return;
    }
    if (ecranAvecCoeurs(chemin)) demanderMesFavoris();
  }, [pret, id, chemin]);

  return null;
}
