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

/**
 * ██ §1 (nº 873) — LES TROIS PAGES D'UN PORTFOLIO, ET LEURS ADRESSES ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : le profil, le portfolio et les flashs d'un
 * artiste sont TROIS PAGES, à trois adresses — web comme doigt :
 *  · `/artist/<nom>`            → le PROFIL (l'en-tête et les infos) ;
 *  · `/artist/<nom>/portfolio`  → le PORTFOLIO (les tatouages) ;
 *  · `/artist/<nom>/flash`      → les FLASHS (les planches).
 * Chacune a son titre, sa canonique et son contenu propre — pour
 * Google —, et le va-et-vient Profile · Portfolio · Flash est un LIEN
 * entre les trois (navigation douce, comme l'accueil de la nº 860).
 * ⚠️ CE QUI PART AVEC : `PARAM_ONGLET` (« ?onglet=portfolio », nº 329)
 * — l'onglet ne vit plus dans la requête, il vit dans le CHEMIN. Les
 * anciennes adresses (« ?onglet=portfolio », « ?entree=portfolio… »)
 * sont redirigées en 301 par le proxy vers la page qui leur
 * correspond.
 * ⚠️ AUCUN IMPORT, toujours : ces écritures restent une feuille.
 */
export type VueDeFiche = "profil" | "portfolio" | "flash";
/** Les trois vues, dans l'ordre du va-et-vient — c'est aussi l'ordre
    du glissement latéral (ContenuFiche). */
export const VUES_DE_FICHE: readonly VueDeFiche[] = [
  "profil",
  "portfolio",
  "flash",
];
/** LES MOTS DU VA-ET-VIENT — « Profile · Portfolio · Flash » — écrits
    une fois : les onglets (PortfolioDeLAffiche) et le fil d'Ariane des
    moteurs (page-de-fiche) les lisent ici. */
export const LIBELLES_DES_VUES: Record<VueDeFiche, string> = {
  profil: "Profile",
  portfolio: "Portfolio",
  flash: "Flash",
};
/** LE CHEMIN D'UNE PAGE D'UN PORTFOLIO — écrit une seule fois : les
    routes, le va-et-vient, le plan du site, le proxy et les bancs le
    lisent ici. Le profil est l'adresse nue ; les deux autres pages
    portent le mot de leur vue. */
export function cheminDeFiche(slug: string, vue: VueDeFiche = "profil"): string {
  return vue === "profil" ? `/artist/${slug}` : `/artist/${slug}/${vue}`;
}

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
/*  ⚠️ LA SECONDE CONSIGNE, « entree=portfolio » (nº 863-§3), N'EXISTE
    PLUS (nº 873) : la vignette de l'onglet Portfolio n'ouvre plus de
    vue photo au doigt — le portfolio est une PAGE (`cheminDeFiche`,
    plus haut), et le fil de galeries en est le contenu. Une vieille
    adresse qui la porte est redirigée en 301 par le proxy. */

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
  return avecConsigneDeLienInterne(cheminDeFiche(slug));
}

/**
 * §1 (nº 873) — LES ADRESSES DES TROIS ONGLETS D'UN PORTFOLIO.
 * ------------------------------------------------------------------
 * Le va-et-vient Profile · Portfolio · Flash d'une page publique est
 * fait de trois liens ; voici ce qu'ils écrivent.
 * ⚠️ L'ONGLET « PROFILE » PORTE LA CONSIGNE DE LIEN INTERNE, comme tout
 * lien du site vers un profil : au doigt, l'adresse NUE d'un portfolio
 * est la VUE PHOTO (nº 844-§4 — la vitrine, celle d'un lien partagé),
 * et c'est `entree=lien` qui ouvre le profil (règle 6). Revenir au
 * profil depuis le portfolio ou les flashs, c'est un lien interne :
 * il écrit donc ce que les autres écrivent. Les deux autres pages
 * n'ont pas de vue photo — leur chemin suffit.
 */
export function adressesDesVues(slug: string): Record<VueDeFiche, string> {
  return {
    profil: adresseDeLienInterne(slug),
    portfolio: cheminDeFiche(slug, "portfolio"),
    flash: cheminDeFiche(slug, "flash"),
  };
}
