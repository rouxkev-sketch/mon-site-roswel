/**
 * ██ LE DÉLAI DE GARDE DES LECTURES DU NAVIGATEUR (passe nº 693) ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE A VU, EN PRODUCTION : connecté au compte
 * administrateur — celui qui porte le plus de portfolios et le plus de
 * nouvelles —, le site « met un temps infini à charger, durablement ».
 * Un compte particulier léger, lui, est fluide.
 *
 * CE QUE LE BANC A TROUVÉ, et ce n'est pas une affaire d'administrateur.
 * On a rendu MUETTE chaque lecture du navigateur à tour de rôle (la
 * requête part, la réponse ne vient jamais — la méthode de la nº 686,
 * appliquée cette fois côté navigateur) :
 *
 *      lecture muette   ADMIN        PRO          PARTICULIER
 *      notifications    JAMAIS       JAMAIS       JAMAIS
 *      favoris           200 ms       186 ms       199 ms
 *      créations         181 ms       192 ms       185 ms
 *      fiches admin      185 ms       193 ms       203 ms
 *      (aucune)          197 ms       194 ms       189 ms
 *
 * UNE SEULE LECTURE FIGE, ET ELLE FIGE POUR TOUT LE MONDE : celle des
 * nouvelles. L'ouverture de « Mon espace » l'ATTEND (`lireLeCompte`)
 * avant de montrer quoi que ce soit, et le trait de chargement du site
 * est allumé pendant ce temps. Une réponse qui ne vient pas, et c'est
 * un menu qui ne s'ouvre jamais sous un trait qui ne s'éteint jamais —
 * « un temps infini à charger », mot pour mot.
 * L'ADMINISTRATEUR N'EST QUE LE COMPTE OÙ ÇA SE VOIT LE PLUS : sa route
 * des nouvelles est la plus lente (le compte le plus ancien, le plus
 * chargé). Le défaut, lui, est le même pour un particulier.
 *
 * ██ LA RÈGLE, LA MÊME QU'À LA nº 686, DE L'AUTRE CÔTÉ ██
 * ------------------------------------------------------------------
 * La nº 686 a mis un délai de garde sur les lectures SERVEUR ; le
 * client Supabase du navigateur en hérite déjà (lib/supabase/delai).
 * CE QUI N'EN AVAIT AUCUN, c'est le `fetch` NU vers NOS PROPRES ROUTES.
 * Ce fichier le donne, une fois, à tout le monde.
 *
 * ⚠️ IL LÈVE, ET C'EST VOULU : chaque appelant a déjà son `catch` — le
 * magasin des nouvelles rend `false`, les favoris laissent les cœurs
 * éteints, les nombres du menu ne s'affichent pas, l'écran
 * d'administration montre son message. L'AFFICHAGE DÉGRADÉ EXISTE
 * DÉJÀ PARTOUT ; il ne lui manquait qu'une chose : que la promesse
 * finisse un jour.
 *
 * ⚠️⚠️ ET IL NE SERT QU'AUX LECTURES. JAMAIS À UNE ÉCRITURE, et ce
 * n'est pas un oubli : couper un `POST` en cours n'annule RIEN côté
 * serveur. La décision est peut-être passée ; la personne, elle,
 * verrait un échec. Une écriture qui traîne doit traîner sous les yeux
 * de qui l'a demandée, pas être abandonnée dans son dos.
 */

/** Huit secondes. Plus court que les dix du serveur (nº 686), et pour
    une raison simple : ici quelqu'un REGARDE. Au-delà, l'attente n'est
    plus une attente, c'est une panne — et mieux vaut une liste vide
    tout de suite qu'un écran qui ne répond pas. */
export const DELAI_LECTURE_NAVIGATEUR_MS = 8_000;

/**
 * LIRE UNE DE NOS ROUTES, avec un délai de garde.
 * S'emploie exactement comme `fetch`, et lève quand la réponse tarde
 * trop — le `catch` de l'appelant fait le reste.
 */
export function lireDuServeur(
  chemin: string,
  options: RequestInit = {},
  delaiMs: number = DELAI_LECTURE_NAVIGATEUR_MS
): Promise<Response> {
  //  ⚠️ SUR UN NAVIGATEUR TROP ANCIEN, ON NE CASSE RIEN : sans
  //  `AbortSignal.timeout`, on rend le `fetch` d'origine. Le site
  //  redevient celui d'avant cette passe — jamais moins.
  const possible =
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function";
  if (!possible) return fetch(chemin, options);

  //  ⚠️ ON RESPECTE LE SIGNAL DE L'APPELANT S'IL EN A UN : `any` fait
  //  du premier qui parle le gagnant — son annulation, ou notre délai.
  const minuteur = AbortSignal.timeout(delaiMs);
  const signal =
    options.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([options.signal, minuteur])
      : minuteur;
  return fetch(chemin, { ...options, signal });
}
