"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * ██ §1 (nº 645) — L'AVATAR DU COMPTE VOYAGE AVEC LA SESSION ██
 * ==================================================================
 * CE QU'IL RÉSOUT, ET POURQUOI PAS AUTREMENT (le relevé de la nº 644).
 * La barre fixe voulait montrer la photo du portfolio actif — mais elle
 * ne la connaît pas : `MenuEspace` ne lit le compte QU'À L'OUVERTURE du
 * menu (acquis nº 142, dont la raison est mesurée : une lecture
 * authentifiée sur chaque page fait rejouer la session du client
 * Supabase hors de tout geste, et la liste des favoris s'en trouvait
 * perdue). Trois voies s'offraient ; le propriétaire a retenu celle-ci.
 *
 * LE PRINCIPE : la photo est rangée dans `user_metadata`, EXACTEMENT LÀ
 * OÙ LE NOM VIT DÉJÀ. Elle voyage donc dans le cookie de session, que
 * le serveur ET le navigateur lisent sans une seule requête
 * (`lib/use-utilisateur`, nº 632) — l'avatar est dans le HTML servi, il
 * ne peut pas clignoter.
 * ⚠️ AUCUNE LECTURE AUTHENTIFIÉE N'EST AJOUTÉE : ce module n'interroge
 * jamais la base. Il ÉCRIT, et seulement quand la valeur change.
 *
 * ⚠️ ET C'EST UNE COPIE, DONC ELLE PEUT SE PÉRIMER. La règle qui la
 * tient à jour est écrite chez ses deux appelants — le menu (qui suit
 * la fiche active) et le formulaire (qui vient d'écrire la photo). Ce
 * module ne connaît que le geste d'écriture.
 */

/** La clé, écrite ICI et nulle part ailleurs. */
export const CLE_AVATAR = "photo_compte";

/** Ce que la session porte aujourd'hui — une adresse d'image, ou rien.
    Une chaîne vide vaut « rien » : le cercle gris prend la place. */
export function avatarDuCompte(utilisateur: User | null): string | null {
  const valeur = utilisateur?.user_metadata?.[CLE_AVATAR];
  return typeof valeur === "string" && valeur.trim() ? valeur : null;
}

/**
 * RANGER LA PHOTO — et ne réveiller personne pour rien.
 *
 * ⚠️ LA GARDE D'ÉGALITÉ EST LA PIÈCE MAÎTRESSE, et c'est la leçon de la
 * nº 111 : `updateUser` fait émettre `USER_UPDATED`, la signature de la
 * session change, et TOUT ce qui lit `useUtilisateur` se re-rend. Sans
 * cette garde, chaque ouverture de menu et chaque enregistrement
 * rejoueraient la session pour écrire la même valeur.
 *
 * ⚠️ SI L'ÉCRITURE ÉCHOUE (réseau coupé, jeton expiré), ON NE FAIT
 * RIEN : la session garde ce qu'elle portait, la barre garde ce qu'elle
 * montrait, et aucun message n'apparaît — ce n'est pas le geste que la
 * personne était en train de faire. La valeur sera reprise au prochain
 * passage qui la trouve fausse (voir les appelants).
 */
export async function rangerLAvatarDuCompte(
  supabase: SupabaseClient,
  photoVoulue: string | null | undefined,
  photoRangee: string | null
): Promise<void> {
  const voulue = photoVoulue?.trim() ? photoVoulue : null;
  if (voulue === photoRangee) return;
  try {
    await supabase.auth.updateUser({ data: { [CLE_AVATAR]: voulue } });
  } catch {
    //  Voir la note ci-dessus : l'avatar n'est pas un geste, il ne
    //  réclame rien à personne quand il ne peut pas s'écrire.
  }
}
