"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { clientSupabaseALaDemande } from "@/lib/supabase/client-a-la-demande";

/**
 * ██ nº 817 — LA BIENVENUE, UNE SEULE FOIS ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : un compte neuf, validé, atterrit sur
 * ses favoris vides — aucun accueil. L'encart « Welcome to YokoFolio »
 * (EncartBienvenue, sur « Ma sélection », la page d'arrivée de toute
 * connexion) le reçoit : deux phrases sur ce qu'on fait ici, deux
 * gestes. UNE SEULE FOIS, au premier passage, jamais ensuite. Et un
 * compte qui existait avant cette passe ne le voit JAMAIS.
 *
 * COMMENT ON SAIT QU'UN COMPTE EST NEUF, ET QU'IL A DÉJÀ VU L'ENCART.
 * Le drapeau vit dans `user_metadata` — la session, donc le cookie de
 * CHAQUE appareil du compte (la voie de l'avatar, nº 645) : « une seule
 * fois » vaut pour le compte, pas pour un navigateur.
 *  · À L'INSCRIPTION PAR MOT DE PASSE, l'écran d'authentification pose
 *    `bienvenue: "a_montrer"` dans les données du compte (`signUp`,
 *    `options.data`). Le compte peut confirmer son adresse une heure
 *    ou un mois plus tard : le drapeau attend.
 *  · À L'INSCRIPTION PAR GOOGLE, on ne peut rien poser : le compte naît
 *    chez Supabase. On lit alors sa DATE DE NAISSANCE — un compte né il
 *    y a moins de quinze minutes est neuf. Un compte d'avant la nº 817
 *    a une date ancienne et pas de drapeau : il ne verra rien.
 *  · L'ENCART VU, le drapeau passe à `vue` — écrit par `updateUser`,
 *    donc partagé par tous les appareils — et rien ne se montre plus.
 *
 * ⚠️ L'ÉCRITURE FAIT RÉÉMETTRE LA SESSION (`USER_UPDATED`, la leçon
 * nº 111) : l'encart lit sa décision UNE FOIS, au montage, et ne
 * change pas d'avis quand la session revient — il reste à l'écran
 * jusqu'au prochain passage.
 */

/** La clé, écrite ici et nulle part ailleurs. */
export const CLE_BIENVENUE = "bienvenue";
export const BIENVENUE_A_MONTRER = "a_montrer";
export const BIENVENUE_VUE = "vue";

/** Un compte sans drapeau (Google) est neuf s'il est né depuis moins
    de quinze minutes : le temps du retour de l'écran de consentement. */
const FENETRE_COMPTE_NEUF_MS = 15 * 60 * 1000;

/** L'encart doit-il se montrer à ce compte ? */
export function doitMontrerLaBienvenue(
  utilisateur: User | null,
  maintenant: number = Date.now()
): boolean {
  if (!utilisateur) return false;
  const drapeau = utilisateur.user_metadata?.[CLE_BIENVENUE];
  if (drapeau === BIENVENUE_VUE) return false;
  if (drapeau === BIENVENUE_A_MONTRER) return true;
  const naissance = Date.parse(utilisateur.created_at ?? "");
  return (
    Number.isFinite(naissance) && maintenant - naissance < FENETRE_COMPTE_NEUF_MS
  );
}

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
 * ██ nº 818 — LA DÉCISION EST PRISE PAR LA PAGE, PAS PAR L'ENCART ██
 * ==================================================================
 * LE DOUBLON DE LA nº 817 : l'encart décidait seul de se montrer, et
 * la page dessous ne le savait pas — l'état vide (« Your favorite
 * photos will show up here ») restait SOUS la bienvenue. La décision
 * remonte ici, dans un hook que « Ma sélection » appelle : la page
 * sait, et elle monte la bienvenue OU l'état vide — jamais les deux.
 * La bienvenue disparue (prochain passage), l'état vide reprend sa
 * place tant que la page est vide.
 *
 * QUAND LA SESSION EST CONNUE, ET C'EST LE POINT (nº 817). « Ma
 * sélection » est dynamique, mais l'habillage ne lit la session au
 * serveur que si le cookie « déjà connecté » est là (nº 809, layout) —
 * un compte qui vient de confirmer son adresse arrive SANS lui : le
 * HTML servi ne connaît personne, et la session n'est lue qu'au
 * premier rendu du navigateur (lib/use-utilisateur, `pret`). La
 * décision attend donc `pret` : au serveur quand il sait, sinon au
 * premier rendu client — un état ajusté pendant le rendu, le motif
 * React pour suivre une valeur reçue.
 *
 * UNE SEULE FOIS : la décision est prise UNE FOIS par passage, et le
 * compte est marqué « vue » aussitôt — la session est réémise, mais
 * l'état, lui, ne relit pas sa décision : la bienvenue reste jusqu'au
 * prochain passage, où elle ne sera plus là.
 * ⚠️ MARQUÉ AU PREMIER PASSAGE, MONTRÉ OU NON : la page ne montre la
 * bienvenue que sur ses favoris vides (c'est l'état vide qu'elle
 * remplace). Un compte neuf qui aurait déjà gardé une photo avant de
 * venir ici n'a plus besoin qu'on lui explique le site — on ne lui
 * ressortira pas la bienvenue un mois plus tard, le jour où sa
 * sélection se vide. « Premier passage » veut dire premier passage.
 */
export function useBienvenue(): boolean {
  const { utilisateur, pret } = useUtilisateur();
  const [afficher, setAfficher] = useState<boolean | null>(() =>
    utilisateur ? doitMontrerLaBienvenue(utilisateur) : null
  );
  if (afficher === null && pret) setAfficher(doitMontrerLaBienvenue(utilisateur));

  useEffect(() => {
    if (!afficher) return;
    void clientSupabaseALaDemande().then(marquerLaBienvenueVue);
  }, [afficher]);

  return afficher === true;
}
