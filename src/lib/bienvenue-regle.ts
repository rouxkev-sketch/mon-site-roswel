import type { User } from "@supabase/supabase-js";

/**
 * ██ nº 819 — LA RÈGLE DE LA BIENVENUE, LISIBLE PAR LE SERVEUR ██
 * ==================================================================
 * LE CLIGNOTEMENT DU PROPRIÉTAIRE (nº 819, point 1) : à la première
 * connexion d'un compte neuf, l'état vide (« Your favorite photos will
 * show up here ») se peignait AVANT la bienvenue. LA CAUSE : la
 * décision se prenait dans le navigateur (lib/bienvenue, nº 817-818),
 * parce que l'habillage ne lit la session au serveur qu'avec le cookie
 * « déjà connecté » — un compte qui vient de confirmer son adresse
 * arrive sans lui. Le HTML servi ne connaissait donc personne, peignait
 * l'état vide, et la bienvenue le remplaçait à l'hydratation.
 *
 * OR LA PAGE « MA SÉLECTION », ELLE, CONNAÎT LE COMPTE : elle est
 * dynamique et interroge `auth.getUser()` pour lire les favoris — le
 * compte vérifié, métadonnées et date de naissance comprises. La règle
 * se lit donc ICI, dans un module SANS « use client », que la page
 * serveur appelle avant de rendre : le HTML porte directement le bon
 * bloc — la bienvenue OU l'état vide — et rien d'autre n'est jamais
 * peint. Le navigateur (lib/bienvenue) ne fait plus que MARQUER le
 * compte « vue ».
 *
 * COMMENT ON SAIT QU'UN COMPTE EST NEUF, ET QU'IL A DÉJÀ VU L'ENCART.
 * Le drapeau vit dans `user_metadata` — la session, donc chaque
 * appareil du compte (la voie de l'avatar, nº 645) : « une seule
 * fois » vaut pour le compte, pas pour un navigateur.
 *  · À L'INSCRIPTION PAR MOT DE PASSE, l'écran d'authentification pose
 *    `bienvenue: "a_montrer"` (`signUp`, `options.data`). Le compte
 *    peut confirmer son adresse une heure ou un mois plus tard : le
 *    drapeau attend.
 *  · À L'INSCRIPTION PAR GOOGLE, on ne peut rien poser : le compte naît
 *    chez Supabase. On lit alors sa DATE DE NAISSANCE — un compte né il
 *    y a moins de quinze minutes est neuf. Un compte d'avant la nº 817
 *    a une date ancienne et pas de drapeau : il ne verra rien.
 *  · L'ENCART VU, le drapeau passe à `vue` (lib/bienvenue,
 *    `marquerLaBienvenueVue`) et rien ne se montre plus.
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
