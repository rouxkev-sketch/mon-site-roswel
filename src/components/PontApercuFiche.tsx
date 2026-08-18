"use client";

import { useEffect } from "react";

/**
 * ██ LE PONT DU PROPRIÉTAIRE — nº 359 ██
 * ==================================================================
 * La page publique d'une fiche est PRÉPARÉE D'AVANCE : elle ne peut
 * plus lire la session, donc plus reconnaître le propriétaire d'une
 * fiche pas encore publiée. Ce pont, posé sur le message « pas encore
 * en ligne », regarde s'il existe une session sur CE navigateur (le
 * cookie de Supabase est lisible ici) et, si oui, emmène au JUMEAU
 * COMPLET — qui, lui, lit la session au serveur et sait montrer sa
 * fiche à son propriétaire, comme avant. Un visiteur sans compte ne
 * voit rien bouger : le message reste.
 * `location.replace` : l'aller-retour ne laisse pas d'étape derrière.
 */
export function PontApercuFiche({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      if (/(^|; )sb-[^=]*-auth-token/.test(document.cookie)) {
        window.location.replace(`/tatoueur/${slug}/complet`);
      }
    } catch {
      // cookies illisibles : le message suffit
    }
  }, [slug]);
  return null;
}
