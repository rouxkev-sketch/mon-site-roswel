/**
 * ██ nº 836 — LES ADRESSES DU SITE PASSENT EN ANGLAIS ██
 * ==================================================================
 * LE DERNIER MORCEAU DE LA TRADUCTION. Le site parle anglais depuis la
 * nº 804 ; ses ADRESSES restaient françaises — `/devenir-tatoueur`,
 * `/mes-favoris`, `/tatouage/…`, `/tatoueur/…`. Le §15 de
 * docs/INVENTAIRE-TRADUCTION.md les avait listées avec une proposition
 * pour chacune ; le propriétaire a tranché les noms, cette passe les
 * pose.
 *
 * CE FICHIER NE SERT QU'À UNE CHOSE : dire ce qui a déménagé, pour que
 * `next.config` en fasse des redirections DÉFINITIVES. Les nouvelles
 * adresses, elles, vivent dans les dossiers de `src/app` — un chemin
 * n'a pas besoin d'être écrit deux fois pour exister.
 *
 * ⚠️ POURQUOI DES REDIRECTIONS, ET POURQUOI 301. Ces adresses sont
 * PARTAGÉES ET INDEXÉES : une fiche d'artiste dans un message, une page
 * de style en favori de navigateur, un lien de courriel déjà parti.
 * Rien ne doit casser. Le 301 dit aux moteurs « c'est définitif,
 * reportez ce que vous saviez sur la nouvelle » — c'est la forme que le
 * propriétaire a demandée en toutes lettres pour les pages servies en
 * GET (même règle qu'aux nº 230 et 811).
 *
 * ⚠️ CE QUI NE DÉMÉNAGE PAS, ET C'EST VOULU :
 *  · `/api/…` et `/auth/callback` — des adresses TECHNIQUES, que
 *    personne ne lit et que Supabase connaît par cœur (sa liste de
 *    redirections autorisées la nomme) ;
 *  · `/photos/…` et `/images-demo/…` — deux tuyaux d'images ;
 *  · les LIMACES DES STYLES et des artistes (`neo-traditionnel`,
 *    `atelier-machin`) : seul le PRÉFIXE change. Une limace publiée ne
 *    change jamais (règle nº 230) ;
 *  · les noms des paramètres dynamiques (`[ville]`, `[jeton]`) : ils
 *    n'apparaissent nulle part dans une adresse — seule leur VALEUR le
 *    fait. Les renommer aurait touché des centaines de lignes pour un
 *    résultat que personne ne peut voir.
 */

/** Une adresse qui a déménagé : l'ancienne, la nouvelle. Les deux
    peuvent porter des paramètres de motif Next (`:slug`, `:chemin*`). */
export type Demenagement = { ancien: string; nouveau: string };

/**
 * LES DÉMÉNAGEMENTS DE LA nº 836.
 * ⚠️ L'ORDRE COMPTE POUR LES DEUX PREMIERS : `/devenir-tatoueur/:chemin*`
 * couvre TOUT le sous-arbre (fiche, sécurité, nouveau mot de passe) et
 * doit passer avant l'adresse nue, sans quoi les sous-pages seraient
 * renvoyées à la racine du compte.
 * ⚠️ ET LES SOUS-PAGES ONT CHANGÉ DE NOM, elles aussi : le filet
 * `:chemin*` ne suffit donc pas — il enverrait `/devenir-tatoueur/fiche`
 * sur `/become-an-artist/fiche`, qui n'existe pas. Chacune est nommée
 * AVANT lui.
 */
export const ADRESSES_TRADUITES: Demenagement[] = [
  //  Le compte de l'artiste et ses trois écrans.
  { ancien: "/devenir-tatoueur/fiche", nouveau: "/become-an-artist/portfolio" },
  { ancien: "/devenir-tatoueur/securite", nouveau: "/become-an-artist/security" },
  {
    ancien: "/devenir-tatoueur/nouveau-mot-de-passe",
    nouveau: "/become-an-artist/new-password",
  },
  //  LE FILET, pour tout ce qui viendrait après (et pour les adresses
  //  d'hier qui portaient déjà un paramètre de requête).
  { ancien: "/devenir-tatoueur/:chemin*", nouveau: "/become-an-artist/:chemin*" },
  { ancien: "/devenir-tatoueur", nouveau: "/become-an-artist" },

  //  Les écrans du visiteur connecté.
  { ancien: "/mes-favoris", nouveau: "/my-favorites" },
  { ancien: "/apres-connexion", nouveau: "/after-login" },
  { ancien: "/recherche", nouveau: "/search" },
  { ancien: "/lien-expire", nouveau: "/link-expired" },
  { ancien: "/rejoindre/:jeton", nouveau: "/join/:jeton" },

  //  ⚠️ LES DEUX ADRESSES INDEXÉES ET PARTAGÉES DU SITE. Les plus
  //  spécifiques d'abord : un motif Next ne franchit pas une barre
  //  oblique, mais l'ordre reste la meilleure garantie de lecture.
  { ancien: "/tatoueur/:slug/complet", nouveau: "/artist/:slug/full" },
  { ancien: "/tatoueur/:slug/partage", nouveau: "/artist/:slug/share" },
  { ancien: "/tatoueur/:slug", nouveau: "/artist/:slug" },
  { ancien: "/tatouage/:style/:ville", nouveau: "/tattoo/:style/:ville" },
  { ancien: "/tatouage/:style", nouveau: "/tattoo/:style" },
];
