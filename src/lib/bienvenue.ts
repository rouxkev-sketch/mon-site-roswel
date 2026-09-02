"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientSupabaseALaDemande } from "@/lib/supabase/client-a-la-demande";
//  nº 819 — LA RÈGLE VIT DANS UN MODULE SANS « use client » : c'est la
//  page serveur qui décide (lib/bienvenue-regle). Ce fichier n'a plus
//  que le geste du navigateur — marquer, et tenir la décision.
export {
  BIENVENUE_A_MONTRER,
  BIENVENUE_VUE,
  CLE_BIENVENUE,
  doitMontrerLaBienvenue,
} from "@/lib/bienvenue-regle";
import { BIENVENUE_VUE, CLE_BIENVENUE } from "@/lib/bienvenue-regle";

/**
 * ██ nº 817 — LA BIENVENUE, UNE SEULE FOIS ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : un compte neuf, validé, atterrit sur
 * ses favoris vides — aucun accueil. L'encart « Welcome to YokoFolio »
 * (EncartBienvenue, sur « Ma sélection », la page d'arrivée de toute
 * connexion) le reçoit : deux phrases sur ce qu'on fait ici, deux
 * gestes. UNE SEULE FOIS, au premier passage, jamais ensuite. Et un
 * compte qui existait avant cette passe ne le voit JAMAIS. La règle
 * (le drapeau, le cas Google) est écrite dans lib/bienvenue-regle.
 *
 * ⚠️ L'ÉCRITURE FAIT RÉÉMETTRE LA SESSION (`USER_UPDATED`, la leçon
 * nº 111) : la page tient sa décision UNE FOIS, au montage, et ne
 * change pas d'avis quand la session revient — la bienvenue reste à
 * l'écran jusqu'au prochain passage.
 */

/** L'encart a été montré : on le note dans le compte, et on se tait
    si l'écriture échoue — le pire est de le remontrer une fois. */
export async function marquerLaBienvenueVue(
  supabase: SupabaseClient
): Promise<void> {
  try {
    await supabase.auth.updateUser({ data: { [CLE_BIENVENUE]: BIENVENUE_VUE } });
  } catch {
    //  Réseau muet : l'encart reviendra au prochain passage, une fois.
  }
}

/**
 * ██ nº 818 — LA DÉCISION EST TENUE PAR LA PAGE, PAS PAR L'ENCART ██
 * ==================================================================
 * LE DOUBLON DE LA nº 817 : l'encart décidait seul de se montrer, et
 * la page dessous ne le savait pas — l'état vide restait SOUS la
 * bienvenue. La page monte donc la bienvenue OU l'état vide, jamais
 * les deux, d'après ce hook.
 *
 * ██ nº 819 — ET LA DÉCISION ARRIVE DU SERVEUR, DÉJÀ PRISE ██
 * ------------------------------------------------------------------
 * LE CLIGNOTEMENT (nº 819, point 1) : ce hook attendait que le
 * navigateur lise la session (`pret`) pour décider ; le HTML servi
 * peignait l'état vide, puis la bienvenue le remplaçait. La page
 * serveur, qui connaît le compte, décide désormais avant de rendre
 * (lib/bienvenue-regle, page mes-favoris) et passe sa décision ici :
 * le premier rendu est le bon, au serveur comme au navigateur, et
 * rien d'autre n'est jamais peint.
 *
 * UNE SEULE FOIS : la décision reçue est TENUE pour la vie de la page
 * (`useState` la fige) — le marquage « vue » réémet la session, et un
 * changement d'onglet fait re-rendre la page avec une décision
 * devenue « non » ; la bienvenue reste pourtant jusqu'au prochain
 * passage, où elle ne sera plus là.
 * ⚠️ MARQUÉ AU PREMIER PASSAGE, MONTRÉ OU NON : la page ne montre la
 * bienvenue que sur ses favoris vides (c'est l'état vide qu'elle
 * remplace). Un compte neuf qui aurait déjà gardé une photo avant de
 * venir ici n'a plus besoin qu'on lui explique le site — on ne lui
 * ressortira pas la bienvenue un mois plus tard, le jour où sa
 * sélection se vide. « Premier passage » veut dire premier passage.
 */
export function useBienvenue(decisionDuServeur: boolean): boolean {
  const [afficher] = useState(decisionDuServeur);

  useEffect(() => {
    if (!afficher) return;
    void clientSupabaseALaDemande().then(marquerLaBienvenueVue);
  }, [afficher]);

  return afficher;
}
