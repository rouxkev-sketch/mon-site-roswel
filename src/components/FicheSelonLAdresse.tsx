"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { FicheTatoueur } from "@/components/FicheTatoueur";
import {
  souscrireAdresse,
  lireRequeteDeLaPage,
  lireRequeteServeur,
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
 * ██ LA FICHE SELON L'ADRESSE — nº 359, refaite nº 360 ██
 * ==================================================================
 * La page de fiche est PRÉPARÉE D'AVANCE : le serveur ne lit plus la
 * requête. LES RÈGLES NE BOUGENT PAS D'UN MOT — l'état vit toujours
 * dans l'adresse (règle 5), un lien interne n'affiche toujours pas la
 * photo en haut (règle 6) — SEUL LE LECTEUR CHANGE : c'est le
 * navigateur qui lit les tags, ici.
 *
 * ██ nº 360 — LA PAGE NE LIT QUE SA PROPRE ADRESSE. ██
 * ------------------------------------------------------------------
 * La première écriture (nº 359) lisait TOUS les changements d'adresse.
 * Deux régressions, même racine :
 *
 *  1. À L'ARRIVÉE, l'adresse n'est pas encore la nôtre. C'est la
 *     mesure de la nº 336, gravée dans FicheTatoueur : pendant une
 *     navigation de client, le routeur rend LA NOUVELLE PAGE AVANT que
 *     le navigateur n'ait commis l'adresse — au premier rendu,
 *     `location` dit encore la page d'où l'on VIENT. Les tags lus là
 *     étaient donc ceux de « Ma sélection », pas ceux du lien touché :
 *     la fiche naissait NUE (photo en haut), puis était resemée un
 *     battement plus tard — le lien « portfolio » (`entree=lien`)
 *     semblait mort.
 *  2. PENDANT LA VIE DE LA FICHE, l'adresse appartient parfois à une
 *     SURFACE : la pile des fiches pose `/tatoueur/autre` par un
 *     pushState BRUT (la page plein écran de la nº 284 en posait une
 *     autre, jusqu'à sa suppression à la nº 602).
 *     Lire ces adresses-là resemait la fiche SOUS la surface : la
 *     photo du haut prenait la photo touchée, et le remontage
 *     DÉTRUISAIT la fenêtre qui venait d'ouvrir — l'ancien
 *     « remplacement sur place », ressuscité par accident.
 *
 * LA RÈGLE, qui est exactement le contrat d'avant la nº 359 (le
 * serveur lisait la requête UNE fois, à l'arrivée, et les surfaces
 * n'existaient pas pour lui) :
 *  · tant que l'adresse n'est pas `/tatoueur/<slug>` : la lecture rend
 *    ce qu'elle a MÉMORISÉ — et rien du tout (`null`) si la page n'a
 *    encore jamais possédé l'adresse (l'arrivée n'est pas commise :
 *    on ne sème pas de tags faux, on attend le battement) ;
 *  · dès que l'adresse est la nôtre : on lit, et on mémorise.
 * Une surface qui écrit dans l'adresse rend donc une valeur INCHANGÉE
 * — même chaîne, aucun rendu (c'est la mécanique de
 * `useSyncExternalStore`) : la fiche ne bouge pas d'un pixel sous la
 * pile.
 *
 * COMMENT, et pourquoi comme ça :
 *  · L'ADRESSE EST LUE PAR L'ÉCRITURE COMMUNE des changements
 *    d'adresse (lib/adresse-courante, le motif de la règle 12 et de la
 *    nº 337-§2) : au rendu serveur et à l'hydratation, la requête est
 *    vide — le HTML préparé est le même pour tous ; dès que l'adresse
 *    est commise, la vraie requête arrive.
 *  · LA CLÉ REMONTE LA FICHE quand les tags changent : les accessoires
 *    d'arrivée SÈMENT l'état de la fiche à sa naissance
 *    (`useState(ouverture.style)`, FicheTatoueur) — les changer sans
 *    remonter ne ferait rien. Avec la lecture bornée à NOTRE adresse,
 *    la clé ne change plus qu'aux vraies arrivées.
 *  · CE QUE L'ŒIL NE DOIT PAS VOIR pendant l'instant où le HTML
 *    préparé précède la lecture : la garde d'avant peinture
 *    (`data-fiche-parametree`, `data-entree-lien` — script + CSS de
 *    globals.css) tient la colonne de photo masquée sur les arrivées
 *    taguées à froid — et c'est l'effet ci-dessous qui la lève, une
 *    fois la fiche resemée (nº 360 : JAMAIS avant — l'instance
 *    d'hydratation, semée sans tags, ne la lève pas).
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
  const cheminDeLaPage = `/tatoueur/${tatoueur.slug}`;
  /*  LA LECTURE BORNÉE À NOTRE ADRESSE (lib/adresse-courante). `null`
      = « la page n'a encore jamais possédé l'adresse » — un état que
      la chaîne vide ne peut pas dire, puisqu'une adresse nue EST une
      requête vide. La mémoire du gel vit dans le module de l'écriture
      commune ; changer de chemin la remet à zéro (une navigation de
      fiche à fiche repart de rien). */
  const requete = useSyncExternalStore(
    souscrireAdresse,
    () => lireRequeteDeLaPage(cheminDeLaPage),
    lireRequeteServeur
  );

  const tags = useMemo(() => {
    if (requete === null) return null;
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
  const cle = tags
    ? [
        tatoueur.slug,
        tags.style,
        tags.rendu,
        tags.nature,
        tags.photo,
        tags.entree,
        tags.studio ?? "",
      ].join("|")
    : null;

  useEffect(() => {
    //  LA GARDE D'AVANT PEINTURE A FINI SON OFFICE : la fiche resemée
    //  est montée, c'est elle qui décide désormais de chaque pixel.
    //  ⚠️ SEULE UNE INSTANCE QUI A LU DES TAGS LA LÈVE (nº 360) : sur
    //  une arrivée taguée à froid, l'instance d'hydratation est semée
    //  SANS tags (requête serveur vide) — si elle levait la garde, la
    //  photo apparaîtrait un instant dans l'état que l'adresse
    //  contredit, juste avant le resemis. Une adresse nue, elle, n'a
    //  jamais fait poser de garde : ne rien lever n'y retire rien.
    if (!requete) return;
    delete document.documentElement.dataset.ficheParametree;
    delete document.documentElement.dataset.entreeLien;
  }, [cle, requete]);

  /*  L'ARRIVÉE N'EST PAS COMMISE (premier rendu d'une navigation
      douce) : on ne rend RIEN plutôt qu'une fiche aux tags de la page
      précédente. Le battement est celui du commit d'adresse — avant la
      nº 359, c'est le serveur qui occupait ce même battement. */
  if (tags === null || cle === null) return null;

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
