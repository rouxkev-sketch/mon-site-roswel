/**
 * ██ §2 (nº 703) — LA CONSIGNE « JE VIENS D'UN LIEN INTERNE », SORTIE
 * DE LA FICHE ██
 * ==================================================================
 * CE FICHIER NE CONTIENT AUCUNE RÈGLE NOUVELLE. Il ne fait que
 * DÉMÉNAGER quatre écritures qui vivaient dans `ContenuFiche` — le nom
 * du paramètre, sa valeur, et les deux fonctions qui l'écrivent. Les
 * textes d'explication les ont suivies telles quelles ; la règle, elle,
 * est celle de la nº 329-330, inchangée.
 *
 * POURQUOI LES DÉMÉNAGER (le défaut mesuré à la nº 703). `MenuEspace`
 * — monté dans l'en-tête, donc sur TOUTES les pages, y compris les
 * mentions légales — n'avait besoin QUE de `avecConsigneDeLienInterne`,
 * dix lignes sans dépendance. Mais un import va chercher le FICHIER
 * ENTIER : en réclamant ces dix lignes à `ContenuFiche`, le menu
 * emportait la fiche complète, et derrière elle `BoutonHorsLigne`,
 * et derrière lui LE CLIENT DE LA BASE — 62 Ko compressés sur chaque
 * page du site, pour dix lignes de texte. Mesuré au banc avant de
 * toucher quoi que ce soit (`page_client-reference-manifest.js` :
 * le morceau de la base figurait dans la liste d'entrée de
 * `/mentions-legales`).
 *
 * ⚠️ L'ÉCRITURE RESTE UNIQUE, et elle est ICI. `ContenuFiche` continue
 * de les exporter — les appelants historiques (`FicheTatoueur`,
 * `BlocLieux`, `BlocSuivis`) n'ont pas bougé d'une ligne : ils passent
 * par une simple réexportation. Personne n'écrit « entree=lien » à la
 * main, hier comme aujourd'hui.
 * ⚠️ AUCUN IMPORT ICI, ET C'EST LE POINT. Ce fichier doit rester une
 * FEUILLE : la seconde où il importera un composant, le menu se
 * remettra à traîner tout ce qui pend derrière.
 */

/** §3 (nº 329) — LE NOM DU PARAMÈTRE D'ONGLET, écrit une seule fois.
    Absent = « Profil », l'onglet d'arrivée : une adresse nue reste
    exactement ce qu'elle était avant cette passe. */
export const PARAM_ONGLET = "onglet";

/**
 * §4 (nº 329) — COMMENT ON EST ARRIVÉ SUR CETTE FICHE.
 * ------------------------------------------------------------------
 * `entree=lien` : par un LIEN INTERNE à un autre portfolio — équipe,
 * guest, salon, studio, adresse, rond de profil de « Ma sélection ».
 * La fiche s'ouvre alors SANS PHOTO EN HAUT : on commence par
 * Profil / Portfolio (point 6 de la règle de navigation).
 * Absent : arrivée par une CARTE ou un LIEN DE PARTAGE — la photo
 * est là, comme toujours.
 *
 * ⚠️ POURQUOI DANS L'ADRESSE, ALORS QUE LA nº 295 L'AVAIT MISE
 * AILLEURS EXPRÈS. Elle vivait dans le `sessionStorage`, pour qu'un
 * lien partagé ne l'emporte pas chez quelqu'un qui arrive de
 * l'extérieur. Mais cette mémoire SE CONSOMMAIT À LA PREMIÈRE
 * LECTURE : un retour la perdait, et la photo revenait. Le
 * propriétaire a tranché à la nº 329 — la consigne vit dans
 * l'adresse, comme l'onglet, pour que le retour ET le pas en avant
 * la retrouvent tout seuls. Le prix est connu et accepté : quelqu'un
 * qui copie une adresse portant `entree=lien` la partagera telle
 * quelle.
 */
export const PARAM_ENTREE = "entree";
export const ENTREE_LIEN = "lien";
/**
 * ██ §3 (nº 863) — LA SECONDE CONSIGNE : « entree=portfolio » ██
 * ------------------------------------------------------------------
 * Une vignette de l'ONGLET PORTFOLIO d'un profil, au doigt, ouvre la vue
 * photo AUTREMENT qu'une carte de « Ma sélection » ou qu'un lien
 * partagé (décision du propriétaire) : LE FIL DE GALERIES — une carte
 * par galerie du portfolio, chacune un carrousel coiffé du titre de sa
 * galerie, la page ouverte sur la carte touchée et la carte sur la
 * photo touchée (FilDeGalerie ; la nº 863 empilait une carte par photo,
 * la nº 866-§1 l'a refait sur consigne).
 * C'est celui qui pose le lien qui sait d'où il vient (la règle de la
 * nº 365 : un réglage explicite, jamais une devinette d'adresse) — le
 * geste de l'onglet écrit donc cette consigne dans l'adresse, comme les
 * liens internes écrivent `entree=lien`, et la fiche la lit. Un retour,
 * un pas en avant, un rechargement la retrouvent tout seuls : c'est le
 * même motif, pour la même raison (nº 329).
 * ⚠️ AUCUN LIEN PARTAGÉ NE LA PORTE : le partage écrit l'adresse d'une
 * photo (`cheminDuCarrousel`), sans consigne — qui l'ouvre voit la vue
 * photo de la nº 862 (avatar, photo, icônes), c'est le §4.
 */
export const ENTREE_PORTFOLIO = "portfolio";

/**
 * §4 (nº 330) — LA CONSIGNE, POSÉE SUR N'IMPORTE QUELLE ADRESSE.
 * ------------------------------------------------------------------
 * `adresseDeLienInterne` ne savait écrire que l'adresse PUBLIQUE d'un
 * portfolio (`/artist/<slug>`). Or « Mon portfolio », dans le menu
 * « Mon espace », mène au portfolio par une AUTRE route — celle de
 * l'espace tatoueur, en aperçu (`/become-an-artist/portfolio?…&vue=apercu`).
 * C'est le même geste et la même attente : on arrive sur un portfolio
 * par un lien, la photo du haut ne monte pas.
 * L'ÉCRITURE RESTE UNIQUE — c'est celle-ci, et `adresseDeLienInterne`
 * n'est plus que son cas particulier. Aucun appelant n'écrit
 * « entree=lien » à la main.
 */
export function avecConsigneDeLienInterne(adresse: string): string {
  const separateur = adresse.includes("?") ? "&" : "?";
  return `${adresse}${separateur}${PARAM_ENTREE}=${ENTREE_LIEN}`;
}

/** L'adresse d'un portfolio ouvert DEPUIS UN AUTRE PORTFOLIO. Écrite
    une fois, employée par tous les liens internes. */
export function adresseDeLienInterne(slug: string): string {
  return avecConsigneDeLienInterne(`/artist/${slug}`);
}
