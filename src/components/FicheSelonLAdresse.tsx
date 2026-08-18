"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { FicheTatoueur } from "@/components/FicheTatoueur";
import {
  lireRequeteCourante,
  lireRequeteServeur,
  souscrireAdresse,
} from "@/lib/adresse-courante";
//  ⚠️ PAS D'IMPORT DE FONCTION DEPUIS lib/tatoueurs ICI : ce module
//  parle à la base (client Supabase serveur) et n'entre pas dans un
//  composant client. `styleConnu` et `natureCherchee` ont déménagé
//  chez leurs données pour cette raison précise (nº 359). Le TYPE, lui,
//  s'efface à la compilation — il peut venir de n'importe où.
import { renduConnu, styleConnu } from "@/config/tatouage";
import { natureCherchee } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LA FICHE SELON L'ADRESSE — nº 359 (étape 2, tranche 1) ██
 * ==================================================================
 * La page de fiche est PRÉPARÉE D'AVANCE : le serveur ne lit plus la
 * requête. LES RÈGLES NE BOUGENT PAS D'UN MOT — l'état vit toujours
 * dans l'adresse (règle 5), un lien interne n'affiche toujours pas la
 * photo en haut (règle 6) — SEUL LE LECTEUR CHANGE : c'est le
 * navigateur qui lit les tags, ici.
 *
 * COMMENT, et pourquoi comme ça :
 *  · L'ADRESSE EST LUE PAR L'ÉCRITURE COMMUNE des changements
 *    d'adresse (lib/adresse-courante, le motif de la règle 12 et de la
 *    nº 337-§2) : au rendu serveur et à l'hydratation, la requête est
 *    vide — le HTML préparé est le même pour tous ; dès le magasin
 *    client, la vraie requête arrive, et à CHAQUE navigation douce
 *    entre fiches, elle suit.
 *  · LA CLÉ REMONTE LA FICHE quand les tags changent : les accessoires
 *    d'arrivée SÈMENT l'état de la fiche à sa naissance
 *    (`useState(ouverture.style)`, FicheTatoueur) — les changer sans
 *    remonter ne ferait rien. La clé rend le semis exact, à l'arrivée
 *    comme entre deux portfolios (équipe, guest).
 *  · CE QUE L'ŒIL NE DOIT PAS VOIR pendant l'instant où le HTML
 *    préparé précède la lecture : la garde d'avant peinture
 *    (`data-fiche-parametree`, `data-entree-lien` — script + CSS de
 *    globals.css) tient la colonne de photo masquée exactement jusqu'à
 *    ce que la fiche resemée prenne le relais — c'est l'effet
 *    ci-dessous qui lève la garde, après le remontage.
 *
 * ⚠️ `suiviAuDepart` N'EST PLUS PASSÉ : le bouton « Suivre » naît
 * neutre et la charge des favoris (nº 137 — les cœurs font pareil
 * depuis toujours) le remplit pour les comptes connectés.
 */
export function FicheSelonLAdresse({
  tatoueur,
  demonstration,
}: {
  tatoueur: Tatoueur;
  demonstration: boolean;
}) {
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    lireRequeteServeur
  );
  const tags = useMemo(() => {
    const params = new URLSearchParams(requete);
    return {
      style: styleConnu(params.get("style") ?? undefined),
      rendu: renduConnu(params.get("rendu") ?? undefined),
      nature: natureCherchee(params.get("nature") ?? undefined),
      photo: params.get("photo") ?? "",
      entree: params.get("entree") ?? "",
      studio: params.get("studio"),
    };
  }, [requete]);
  const cle = [
    tatoueur.slug,
    tags.style,
    tags.rendu,
    tags.nature,
    tags.photo,
    tags.entree,
    tags.studio ?? "",
  ].join("|");

  useEffect(() => {
    //  LA GARDE D'AVANT PEINTURE A FINI SON OFFICE : la fiche resemée
    //  est montée, c'est elle qui décide désormais de chaque pixel.
    delete document.documentElement.dataset.ficheParametree;
    delete document.documentElement.dataset.entreeLien;
  }, [cle]);

  return (
    <FicheTatoueur
      key={cle}
      tatoueur={tatoueur}
      demonstration={demonstration}
      studioCourant={tags.studio}
      styleInitial={tags.style}
      renduInitial={tags.rendu}
      natureInitiale={tags.nature}
      photoInitiale={tags.photo}
      entreeInitiale={tags.entree}
    />
  );
}
