/**
 * ██ nº 811 — LES ADRESSES DES TROIS PAGES ÉDITORIALES, ÉCRITES UNE FOIS ██
 * ==================================================================
 * LE SITE EST ANGLAIS DEPUIS LA nº 804, SES ADRESSES NE L'ÉTAIENT PAS :
 * « /qui-sommes-nous » et « /mentions-legales » restaient françaises
 * (le rapport de la nº 804 en faisait un sujet à part). Le propriétaire
 * tranche à la nº 811 : « /about », « /legal » ; « /contact » ne bouge
 * pas — le mot est le même dans les deux langues.
 *
 * POURQUOI UNE CONSTANTE PLUTÔT QUE SIX CHAÎNES : le pied de page, le
 * plan du site, l'adresse canonique de chaque page, le lien « site
 * rules » de la création de compte, la liste des en-têtes de cache et
 * les redirections de next.config parlent tous de ces chemins. Écrits
 * six fois, ils finiraient par diverger — et un chemin qui diverge, ce
 * sont des liens morts. Ils sont donc écrits ICI, et lus partout (la
 * leçon de `chemin-recherche.ts`).
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, et c'est délibéré : il est lu par
 * `next.config.ts` (chargé par Node avant toute compilation, hors des
 * alias `@/`) autant que par des composants. Des constantes, aucun
 * import.
 *
 * ⚠️ LES ANCIENNES ADRESSES REDIRIGENT, DÉFINITIVEMENT (301, voir
 * next.config) : le pied de page de chaque page les portait, la
 * console Google (l'écran de consentement OAuth : règles et
 * confidentialité) pointe dessus, et des liens ont pu être partagés.
 * Une adresse déplacée n'est jamais laissée en page introuvable.
 *
 * ██ nº 814 — UNE QUATRIÈME PAGE : « /terms » (Terms of Use) ██
 * Les conditions d'utilisation, séparées de la page légale comme
 * l'usage américain le veut (docs/A-VALIDER-AVOCAT.md, point 3). Même
 * régime que les trois autres : pied de page, plan du site, adresse
 * canonique, en-têtes de cache, lien « Terms of Use » de la création
 * de compte — tous lisent la constante. Pas d'ancienne adresse : la
 * page naît ici.
 */
export const CHEMIN_ABOUT = "/about";
export const CHEMIN_CONTACT = "/contact";
export const CHEMIN_LEGAL = "/legal";
export const CHEMIN_TERMS = "/terms";

/** Les anciennes adresses (nº 320 → nº 810) et où elles mènent. */
export const ANCIENS_CHEMINS_EDITORIAUX: ReadonlyArray<{
  ancien: string;
  nouveau: string;
}> = [
  { ancien: "/qui-sommes-nous", nouveau: CHEMIN_ABOUT },
  { ancien: "/mentions-legales", nouveau: CHEMIN_LEGAL },
];
