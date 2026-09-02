"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";

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
