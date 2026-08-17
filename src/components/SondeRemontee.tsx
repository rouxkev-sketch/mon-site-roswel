"use client";

import { useEffect } from "react";
import { corpsGele, gelerLeCorps, positionSousLeGel } from "@/lib/gel-du-corps";
import { ouvrirLaListeEnHaut } from "@/lib/liste-neuve";

/**
 * ██ SONDE DE LA REMONTÉE — `?sonde-remontee=1` (nº 330-§1) ██
 * ==================================================================
 * POURQUOI ELLE EXISTE. Le défaut du §1 ne se joue QUE sous un
 * PANNEAU DU BAS — et le seul panneau du bas du site vit sur « Ma
 * sélection », derrière une session Supabase que ce conteneur ne sait
 * pas signer (`/mes-favoris` répond 307). Sans elle, la correction ne
 * pouvait être prouvée qu'À LA SOURCE ; le propriétaire a demandé
 * qu'elle soit prouvée EN VIVANT, sur une surface publique.
 *
 * CE QU'ELLE FAIT, ET RIEN D'AUTRE : elle pose sur `window` les trois
 * fonctions du mécanisme — geler, lire la position sous le gel, et
 * l'écriture unique `ouvrirLaListeEnHaut`. Un banc peut alors
 * reproduire EXACTEMENT la séquence du panneau (geler à N px, poser un
 * filtre, dégeler) sur n'importe quelle page publique, et mesurer où
 * la page se pose. Ce sont les VRAIES fonctions du site, pas des
 * copies : c'est tout l'intérêt.
 *
 * ⚠️ ELLE NE MODIFIE RIEN et n'affiche rien. Sans `?sonde-remontee=1`
 * elle ne pose même pas ses fonctions : elle ne coûte rien.
 *
 * ⚠️ ELLE EST TEMPORAIRE, et inscrite comme telle au bandeau des
 * chantiers ouverts (lib/navigation-session) : à retirer avant la mise
 * en ligne, avec son import dans app/(tatouage)/layout.tsx.
 */
declare global {
  interface Window {
    __sondeRemontee?: {
      geler: (position: number) => () => void;
      position: () => number;
      gele: () => boolean;
      remonter: () => void;
    };
  }
}

export function SondeRemontee() {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("sonde-remontee")) {
      return;
    }
    window.__sondeRemontee = {
      geler: (position: number) => gelerLeCorps(position),
      position: positionSousLeGel,
      gele: corpsGele,
      remonter: ouvrirLaListeEnHaut,
    };
    return () => {
      delete window.__sondeRemontee;
    };
  }, []);
  return null;
}
