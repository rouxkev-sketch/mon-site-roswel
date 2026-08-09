"use client";

import type { ReactNode } from "react";
import { poserStylesAjoutes, type StyleAjoute } from "@/config/tatouage";

/**
 * LE CATALOGUE, DU SERVEUR VERS LE NAVIGATEUR (passe nº 122)
 * ==========================================================
 * Les styles acceptés par l'administration vivent en base. Le serveur
 * les lit au début de la mise en page du groupe tatouage ; ce
 * fournisseur les repose dans le registre du fichier de réglages
 * CÔTÉ NAVIGATEUR, pour que `libelleStyle`, `stylesAlphabetiques` et
 * `entreesExplorer` disent la même chose des deux côtés.
 *
 * ⚠️ IL POSE PENDANT LE RENDU, PAS DANS UN EFFET.
 * Un `useEffect` s'exécute APRÈS le premier rendu : la fenêtre des
 * styles et le menu Explorer auraient affiché trente-huit entrées, puis
 * quarante — un clignotement à chaque chargement, et surtout un
 * décalage entre le HTML du serveur et celui du navigateur (React
 * signale alors une erreur d'hydratation). Poser ici, dans le corps du
 * composant, c'est poser AVANT que le moindre enfant ne soit rendu :
 * le premier écran peint est déjà le bon.
 *
 * Poser deux fois la même liste ne coûte rien (`poserStylesAjoutes`
 * remplace, il n'ajoute pas) et ne rend rien : ce composant n'a même
 * pas besoin d'un contexte React, le registre EST le contexte.
 */
export function FournisseurStyles({
  styles,
  children,
}: {
  styles: StyleAjoute[];
  children: ReactNode;
}) {
  poserStylesAjoutes(styles);
  return <>{children}</>;
}
