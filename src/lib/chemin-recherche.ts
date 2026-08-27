/**
 * ██ §1 (nº 652) — LE CHEMIN DE LA RECHERCHE, ÉCRIT UNE SEULE FOIS ██
 * ==================================================================
 * CE QUI CHANGE À CETTE PASSE. La page des résultats vivait à
 * « /accueil-recherche » — un JUMEAU que personne ne tapait, atteint
 * par une réécriture du proxy, et dont l'adresse n'apparaissait jamais
 * dans la barre du navigateur (nº 357). Le propriétaire lui donne son
 * nom : « /recherche ». L'adresse visible change désormais pendant une
 * recherche, sur les deux appareils, et c'est sa décision.
 *
 * POURQUOI UNE CONSTANTE PLUTÔT QUE QUATRE CHAÎNES. Quatre endroits
 * parlent de ce chemin : les trois fabricants de liens
 * (IndexTatoueurs, EnTeteTatouage, CarteStyle) et la réécriture du
 * proxy. Écrit quatre fois, il finirait par diverger — et un chemin
 * qui diverge, ce sont des liens morts. Il est donc écrit ICI, et lu
 * partout.
 *
 * ⚠️ À NE PAS CONFONDRE AVEC `lib/adresse-recherche`, qui porte un nom
 * voisin et un tout autre travail : celui-là fabrique la CLÉ sous
 * laquelle une recherche range sa position de défilement (nº 184).
 * Celui-ci ne dit que le CHEMIN de la page.
 *
 * ⚠️ CE FICHIER NE DÉPEND DE RIEN, et c'est délibéré : il est lu par
 * des composants CLIENT autant que par le proxy, qui tourne dans un
 * environnement à part. Une seule constante, aucun import — la même
 * leçon que `millesime-script.ts`.
 *
 * ⚠️ L'ANCIENNE FORME D'ADRESSE CONTINUE DE MARCHER, et c'est le filet
 * de la passe : le proxy réécrit toujours « / » à requête vers cette
 * page. Un lien « /?style=realisme » déjà partagé sert exactement la
 * même chose qu'avant — aucune redirection, aucune erreur.
 */
export const ADRESSE_RECHERCHE = "/recherche";
