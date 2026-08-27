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

/**
 * §1 (nº 657) — LA CLÉ DU NOM, celle que Supabase porte depuis
 * toujours pour un compte (`user_metadata.nom`) et que
 * `lib/use-utilisateur` lit déjà. Elle est nommée ici pour que les
 * deux morceaux de l'identité — la photo et le nom — s'écrivent au
 * même endroit et EN UN SEUL APPEL (voir `rangerLIdentiteDuCompte`).
 */
export const CLE_NOM = "nom";

/**
 * LE NOM DU COMPTE, TEL QU'IL A ÉTÉ DONNÉ — et rien d'autre.
 * ⚠️ AUCUN REPLI SUR L'ADRESSE E-MAIL, et c'est toute la différence
 * avec le `nom` de `useUtilisateur` (qui, lui, en pose un pour ne
 * jamais rendre une chaîne vide à une info-bulle). La tête de « Mon
 * compte » a besoin de savoir si un nom EXISTE : sans nom, elle écrit
 * « Mon compte », jamais le début d'une adresse e-mail.
 */
export function nomDuCompte(utilisateur: User | null): string | null {
  const valeur = utilisateur?.user_metadata?.[CLE_NOM];
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}

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

/**
 * ██ §1 (nº 657) — L'IDENTITÉ D'UN PARTICULIER, EN UN SEUL APPEL ██
 * ==================================================================
 * CE QUE C'EST : le geste de la fenêtre « Modifier » (FenetreIdentite)
 * — le nom et la photo, écrits ENSEMBLE dans `user_metadata`. Un seul
 * `updateUser` pour les deux, et ce n'est pas une économie de
 * confort : chaque appel fait émettre `USER_UPDATED`, donc rejouer la
 * session et re-rendre tout ce qui lit `useUtilisateur` (la leçon
 * nº 111). Deux appels, ce serait deux secousses pour un seul geste.
 *
 * ⚠️ CE N'EST PAS `rangerLAvatarDuCompte`, ET LES DEUX NE SE
 * MARCHENT PAS DESSUS : celui-là est un RATTRAPAGE silencieux (il
 * recopie la photo du portfolio actif, et se tait s'il échoue) ;
 * celui-ci est un GESTE de la personne — il rend son échec, et
 * l'appelant l'affiche.
 * ⚠️ `data` est FUSIONNÉ par Supabase dans `user_metadata` : les
 * autres clés du compte (le prénom d'inscription, par exemple) ne sont
 * pas touchées.
 * ⚠️ AUCUNE ÉCRITURE EN BASE : ni table, ni ligne. L'identité d'un
 * particulier vit dans sa session, et voyage donc dans le cookie —
 * l'avatar de la barre l'a sans une requête (la voie B, nº 644-645).
 */
export async function rangerLIdentiteDuCompte(
  supabase: SupabaseClient,
  identite: { nom: string; photo: string | null }
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: {
      [CLE_NOM]: identite.nom.trim() || null,
      [CLE_AVATAR]: identite.photo?.trim() ? identite.photo : null,
    },
  });
  if (error) throw error;
}
