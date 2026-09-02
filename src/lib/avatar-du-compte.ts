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

/**
 * ██ §1 (nº 675) — LA RÈGLE DE L'IDENTITÉ AFFICHÉE ██
 * ==================================================================
 * LA RÈGLE, EN UNE PHRASE, ET ELLE VAUT POUR TOUTES LES SURFACES :
 * L'IDENTITÉ AFFICHÉE SUIT LE PORTFOLIO S'IL EN EXISTE UN, LA PERSONNE
 * SINON. « Il en existe un » comprend un portfolio DONT LA SUPPRESSION
 * EST PROGRAMMÉE : pendant les trente jours il reste récupérable,
 * modifiable et consultable — donc il compte.
 *
 * POURQUOI IL FAUT DEUX PAIRES DE CLÉS, ET NON UNE. Jusqu'ici, la
 * photo du portfolio ÉCRASAIT celle de la personne dans la seule clé
 * qui existait. Tant qu'on ne faisait qu'aller de la personne vers le
 * portfolio, cela suffisait. Mais la règle demande le CHEMIN INVERSE —
 * « suppression définitive au bout des trente jours : retour
 * automatique à la photo et au nom du particulier ». Or on ne revient
 * pas à ce qu'on a effacé. Il faut donc :
 *  · CE QU'ON AFFICHE — `photo_compte` (qui existait) et `nom_affiche`
 *    (nouveau) : la copie que la barre lit sans une seule requête ;
 *  · CE QUE LA PERSONNE A SAISI — `photo_personne` (nouveau) et `nom`
 *    (qui existait) : sa mémoire à elle, que rien n'écrase jamais.
 * C'est ce second couple qui rend le retour possible, et il n'y a pas
 * d'autre moyen : le portfolio purgé n'existe plus, la session est le
 * seul endroit où l'identité de la personne peut survivre.
 *
 * ⚠️ `nom` NE CHANGE PAS DE SENS, ET C'EST DÉLIBÉRÉ : c'est la clé que
 * Supabase porte depuis toujours et que `lib/use-utilisateur` lit déjà.
 * Elle reste LA PERSONNE. On n'y met jamais le nom d'un portfolio —
 * sans quoi le champ de la fenêtre « Éditer » proposerait un jour à
 * quelqu'un de modifier le nom de son propre portfolio en croyant
 * changer le sien.
 * ⚠️ AUCUNE MIGRATION, ET AUCUN COMPTE CASSÉ : les deux clés neuves sont
 * absentes des comptes d'avant cette passe. `identiteDeLaPersonne` se
 * replie alors sur ce qui existe (`nom`, et la photo affichée faute de
 * mieux) — voir sa note.
 */

/** La clé, écrite ICI et nulle part ailleurs. */
export const CLE_AVATAR = "photo_compte";

/**
 * §1 (nº 675) — LE NOM AFFICHÉ, pendant du `photo_compte` ci-dessus :
 * le nom du PORTFOLIO quand il y en a un, celui de la personne sinon.
 * Il voyage dans le cookie comme la photo, et pour la même raison — la
 * barre le lit sans une requête, dès le premier rendu.
 */
export const CLE_NOM_AFFICHE = "nom_affiche";

/**
 * §1 (nº 675) — LA PHOTO DE LA PERSONNE, sa mémoire à elle. Écrite par
 * la seule fenêtre « Éditer », jamais par un portfolio. C'est elle
 * qu'on restitue quand le dernier portfolio est purgé.
 */
export const CLE_PHOTO_PERSONNE = "photo_personne";

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

/**
 * ██ nº 815 — LE PORTFOLIO ACTIF VOYAGE AVEC L'IDENTITÉ QU'IL DONNE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « avec plusieurs portfolios, une mauvaise
 * photo d'avatar apparaît un instant avant la bonne (celle du portfolio
 * sélectionné à la dernière session) ».
 * LA CAUSE, NOMMÉE : l'identité affichée (`photo_compte`, `nom_affiche`)
 * est UNE PAR COMPTE — elle vit dans la session, donc dans le cookie de
 * chaque appareil — mais le CHOIX du portfolio actif était UN PAR
 * APPAREIL (`localStorage`, lib/fiches-compte). Deux appareils (le
 * téléphone, l'ordinateur) qui n'ont pas retenu le même portfolio se
 * corrigent l'un l'autre à chaque chargement : le HTML peint la photo
 * que la session porte (celle écrite par l'AUTRE appareil), puis le
 * rattrapage du menu (MenuEspace, nº 700) lit la mémoire locale, y voit
 * un autre portfolio, et réécrit la session — la « bonne » photo
 * remplace la « mauvaise ». Retour sur l'autre appareil : le même
 * échange, dans l'autre sens. Un seul appareil ne peut pas produire ce
 * défaut (mesuré : cookie et mémoire y sont toujours d'accord).
 * LE REMÈDE : LE CHOIX EST RANGÉ AVEC L'IDENTITÉ, au même endroit et
 * dans le même appel (`fiche_active`, ci-dessous). La mémoire du
 * portfolio actif est désormais celle du COMPTE (lib/fiches-compte lit
 * la session d'abord, le navigateur ensuite pour les comptes d'avant
 * cette passe) : les deux appareils lisent la même valeur, le
 * rattrapage n'a plus rien à contredire, et il n'écrit plus rien au
 * chargement. La photo peinte par le HTML EST la bonne — directement.
 * ⚠️ CE QUI RESTE, ET JE LE DIS : un portfolio choisi sur un appareil
 * n'est connu de l'autre qu'à la relecture de l'identité (nº 674,
 * `getUser` au chargement) ou au renouvellement de son jeton — la
 * première page ouverte là-bas APRÈS ce choix peint encore l'ancienne
 * photo une fraction de seconde, puis se corrige, une fois. Ce n'est
 * plus un ping-pong à chaque chargement.
 */
export const CLE_FICHE_ACTIVE = "fiche_active";

/** Le portfolio actif tel que la session le porte (nº 815), ou rien. */
export function ficheActiveRangee(utilisateur: User | null): string | null {
  const valeur = utilisateur?.user_metadata?.[CLE_FICHE_ACTIVE];
  return typeof valeur === "string" && valeur ? valeur : null;
}

/** Ce que la session porte aujourd'hui — une adresse d'image, ou rien.
    Une chaîne vide vaut « rien » : le cercle gris prend la place. */
export function avatarDuCompte(utilisateur: User | null): string | null {
  const valeur = utilisateur?.user_metadata?.[CLE_AVATAR];
  return typeof valeur === "string" && valeur.trim() ? valeur : null;
}

/**
 * §1 (nº 675) — LE NOM AFFICHÉ, tel qu'il est rangé. Repli sur le nom
 * de la personne pour les comptes d'avant cette passe, qui ne portent
 * pas encore la clé : leur identité affichée EST celle de la personne
 * tant qu'un portfolio ne l'a pas remplacée.
 */
export function nomAffiche(utilisateur: User | null): string | null {
  const valeur = utilisateur?.user_metadata?.[CLE_NOM_AFFICHE];
  if (typeof valeur === "string" && valeur.trim()) return valeur.trim();
  return nomDuCompte(utilisateur);
}

/**
 * §1 (nº 675) — CE QUE LA PERSONNE A SAISI, et rien d'autre : le couple
 * qu'on restitue quand le dernier portfolio disparaît.
 * ⚠️ LE REPLI DE LA PHOTO EST NÉCESSAIRE, et il est prudent : un compte
 * d'avant cette passe ne porte pas `photo_personne`. Si l'on rendait
 * `null`, la purge de son portfolio effacerait une photo qu'il avait
 * peut-être choisie lui-même. On se replie donc sur la photo AFFICHÉE —
 * au pire elle vient du portfolio, et il la remplace en deux gestes
 * dans « Éditer » ; au mieux c'est bien la sienne. Ne rien effacer
 * qu'on n'est pas sûr de pouvoir rendre.
 */
export function identiteDeLaPersonne(utilisateur: User | null): {
  photo: string | null;
  nom: string | null;
} {
  const brute = utilisateur?.user_metadata?.[CLE_PHOTO_PERSONNE];
  const photo =
    typeof brute === "string" && brute.trim()
      ? brute
      : avatarDuCompte(utilisateur);
  return { photo, nom: nomDuCompte(utilisateur) };
}

/**
 * RANGER L'IDENTITÉ AFFICHÉE — et ne réveiller personne pour rien.
 * (`rangerLAvatarDuCompte` jusqu'à la nº 674 : elle ne rangeait que la
 * photo, et c'est justement ce qui manquait au nom — voir le §1 de la
 * nº 675 en tête de fichier.)
 *
 * ⚠️ LA GARDE D'ÉGALITÉ EST LA PIÈCE MAÎTRESSE, et c'est la leçon de la
 * nº 111 : `updateUser` fait émettre `USER_UPDATED`, la signature de la
 * session change, et TOUT ce qui lit `useUtilisateur` se re-rend. Sans
 * cette garde, chaque ouverture de menu et chaque enregistrement
 * rejoueraient la session pour écrire les mêmes valeurs. Elle porte
 * désormais sur LES DEUX morceaux : on n'écrit que si l'un des deux
 * diffère, et l'on écrit alors les deux ensemble — une seule secousse.
 *
 * ⚠️ SI L'ÉCRITURE ÉCHOUE (réseau coupé, jeton expiré), ON NE FAIT
 * RIEN : la session garde ce qu'elle portait, la barre garde ce qu'elle
 * montrait, et aucun message n'apparaît — ce n'est pas le geste que la
 * personne était en train de faire. La valeur sera reprise au prochain
 * passage qui la trouve fausse (voir les appelants).
 */
export async function rangerLIdentiteAffichee(
  supabase: SupabaseClient,
  /*  nº 815 — `fiche` : LE PORTFOLIO QUI DONNE CETTE IDENTITÉ (son
      identifiant), `null` quand c'est la personne. Rangé dans le même
      appel que la photo et le nom, comparé avec eux : un appelant qui
      ne le connaît pas (`undefined`) laisse celui qui est rangé. */
  voulue: {
    photo: string | null | undefined;
    nom: string | null | undefined;
    fiche?: string | null;
  },
  rangee: { photo: string | null; nom: string | null; fiche?: string | null }
): Promise<void> {
  const photo = voulue.photo?.trim() ? voulue.photo : null;
  const nom = voulue.nom?.trim() ? voulue.nom.trim() : null;
  const ficheRangee = rangee.fiche ?? null;
  const fiche = voulue.fiche === undefined ? ficheRangee : voulue.fiche;
  if (photo === rangee.photo && nom === rangee.nom && fiche === ficheRangee) {
    return;
  }
  try {
    await supabase.auth.updateUser({
      data: {
        [CLE_AVATAR]: photo,
        [CLE_NOM_AFFICHE]: nom,
        [CLE_FICHE_ACTIVE]: fiche,
      },
    });
  } catch {
    //  Voir la note ci-dessus : l'identité affichée n'est pas un geste,
    //  elle ne réclame rien à personne quand elle ne peut pas s'écrire.
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
 * ⚠️ CE N'EST PAS `rangerLIdentiteAffichee`, ET LES DEUX NE SE
 * MARCHENT PAS DESSUS : celui-là est un RATTRAPAGE silencieux (il
 * recopie l'identité du portfolio actif, et se tait s'il échoue) ;
 * celui-ci est un GESTE de la personne — il rend son échec, et
 * l'appelant l'affiche.
 * ⚠️ `data` est FUSIONNÉ par Supabase dans `user_metadata` : les
 * autres clés du compte (le prénom d'inscription, par exemple) ne sont
 * pas touchées.
 * ⚠️ AUCUNE ÉCRITURE EN BASE : ni table, ni ligne. L'identité d'un
 * particulier vit dans sa session, et voyage donc dans le cookie —
 * l'avatar de la barre l'a sans une requête (la voie B, nº 644-645).
 *
 * ██ §1 (nº 675) — IL ÉCRIT DEUX FOIS LA MÊME CHOSE, ET C'EST LE POINT ██
 * ------------------------------------------------------------------
 * QUATRE CLÉS EN UN APPEL, deux couples :
 *  · LA MÉMOIRE DE LA PERSONNE (`nom`, `photo_personne`) — ce qu'elle
 *    vient de saisir, que RIEN n'écrasera jamais. C'est elle qu'on lui
 *    rendra le jour où son dernier portfolio sera purgé ;
 *  · CE QU'ON AFFICHE (`nom_affiche`, `photo_compte`) — la même chose,
 *    ici et maintenant.
 * POURQUOI LES DEUX D'UN COUP, SANS SE DEMANDER S'IL Y A UN PORTFOLIO :
 * parce que cette fenêtre N'EXISTE QUE POUR UN COMPTE SANS PORTFOLIO —
 * la ligne « Éditer » qui l'ouvre ne s'affiche que là (MenuEspace, la
 * seconde ligne de la tête). Il n'y a donc aucun portfolio dont
 * l'identité pourrait être écrasée. Et si, par une porte qu'on
 * n'imagine pas, il y en avait un : le rattrapage du menu remettrait
 * l'identité du portfolio au premier compte lu.
 */
export async function rangerLIdentiteDuCompte(
  supabase: SupabaseClient,
  identite: { nom: string; photo: string | null }
): Promise<void> {
  const nom = identite.nom.trim() || null;
  const photo = identite.photo?.trim() ? identite.photo : null;
  const { error } = await supabase.auth.updateUser({
    data: {
      //  La mémoire de la personne — jamais écrasée par un portfolio.
      [CLE_NOM]: nom,
      [CLE_PHOTO_PERSONNE]: photo,
      //  Ce qu'on affiche, à cet instant : la même chose.
      [CLE_NOM_AFFICHE]: nom,
      [CLE_AVATAR]: photo,
    },
  });
  if (error) throw error;
}
