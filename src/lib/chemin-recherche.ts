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

/**
 * ██ §1 (nº 656) — ON NE PRÉPARE JAMAIS LA RECHERCHE À L'AVANCE ██
 * ==================================================================
 * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE ET INSTRUIT À LA BOÎTE NOIRE
 * (nº 654), le 27 août à 10:02 : un clic sur la carte « Néo-japonais »
 * écrivait la BONNE demande —
 *   CLIC LIEN · vers /recherche?style=neo-japonais&nature=tatouage
 * — et servait pourtant « Toutes les réalisations », c'est-à-dire
 * `nature=tatouage` SEUL. Personne n'avait réécrit l'adresse.
 *
 * LA CAUSE, ET ELLE EST DANS LE NAVIGATEUR, PAS DANS LE SITE. Next
 * PRÉPARE À L'AVANCE (`prefetch`) les pages des liens qui entrent à
 * l'écran. Pour une route DYNAMIQUE — « /recherche » en est une, le
 * rapport de compilation l'écrit « ƒ » —, ce qu'il range n'est pas la
 * page complète mais LE SEGMENT DE ROUTE, et ce segment se range SOUS
 * LE CHEMIN, pas sous les critères. Deux liens qui mènent au MÊME
 * chemin avec des critères DIFFÉRENTS partagent donc une seule case :
 * le premier qui la remplit sert pour tous les autres.
 *
 * QUI REMPLISSAIT LA CASE, NOMMÉ : le lien « Voir plus » du bas de
 * l'accueil (IndexTatoueurs). Sur l'accueil, les critères servis se
 * réduisent à la nature — son adresse vaut donc
 * « /recherche?nature=tatouage&page=2&melange=… », soit très
 * exactement « Toutes les réalisations ». Il portait `prefetch={true}`
 * depuis la nº 422, et préparait cette page dès qu'il entrait à
 * l'écran. Les cartes de style sont un second émetteur du même genre :
 * chacune prépare « /recherche », et la première arrivée décide pour
 * ses voisines.
 *
 * LA RÈGLE, DÉSORMAIS : AUCUN lien menant à « /recherche » ne prépare
 * sa page. Chaque clic part chercher la page fraîche, avec les
 * critères exacts du lien cliqué. Elle est écrite ICI, à côté du
 * chemin, pour qu'on ne puisse pas fabriquer une adresse de recherche
 * sans lire la règle qui va avec.
 *
 * ⚠️ LE RESTE DU SITE NE RALENTIT PAS D'UNE MILLISECONDE : fiches,
 * accueil, « Ma sélection », pages de style + ville gardent leur
 * préparation à l'avance. On ne retire que ce qui était FAUX.
 * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS PLUTÔT QUE DE LE TAIRE : « Voir
 * plus » perd l'avance que la nº 422 lui avait donnée — sa requête ne
 * partira de nouveau qu'au clic. Le libellé « Chargement… »
 * (`useLinkStatus`) et le `scroll={false}` restent : la page ne bouge
 * pas, elle attend. C'est le prix d'une page juste.
 * ⚠️ LA GARDE « PAGE EN RETARD » DE LA nº 631 RESTE EN PLACE, et elle
 * change de rôle : elle ne répare plus, elle TÉMOIGNE. Si elle cesse
 * de se déclencher, la cause est bien supprimée.
 *
 * ██ §2 (nº 665) — LE DIAGNOSTIC CI-DESSUS EST À MOITIÉ FAUX ██
 * ------------------------------------------------------------------
 * JE LE CORRIGE ICI PLUTÔT QUE DE LE LAISSER SERVIR DE RÉFÉRENCE. Le
 * §1 affirme que le segment rangé « se range SOUS LE CHEMIN, pas sous
 * les critères », et que deux liens vers le même chemin partagent une
 * seule case. C'ÉTAIT VRAI DES VERSIONS PRÉCÉDENTES DE NEXT ; ça ne
 * l'est plus de celle qu'emploie le site. Vérifié dans le moteur
 * (client/components/segment-cache/vary-path.js) : « Unlike layouts, a
 * page segment's vary path also includes the search string » — la clé
 * de rangement d'un segment de PAGE contient la chaîne de requête.
 * CE QUI RESTE VRAI DU §1, ET QUI JUSTIFIE LA RÈGLE : préparer à
 * l'avance une page de résultats n'a de toute façon aucun sens — les
 * critères sont innombrables, chaque préparation est une requête pour
 * une page que personne ne demandera. La règle ne change pas ; c'est sa
 * RAISON qui se corrige.
 * OÙ EST LA SUITE : la nº 665 pose le second verrou, celui qui interdit
 * de RELIRE la réserve après coup — `unstable_dynamicStaleTime = 0`,
 * écrit sur la page elle-même (app/(tatouage)/recherche/page.tsx), avec
 * le relevé du banc qui dit ce que ce verrou change et ce qu'il ne
 * change pas.
 *
 * ██ §3 (nº 669) — ET CE SECOND VERROU NE COUVRE QUE LA MOITIÉ ██
 * ------------------------------------------------------------------
 * Le réglage de la nº 665 commande la réserve DE RETOUR, pas la réserve
 * DE SEGMENTS — laquelle a un plancher de trente secondes qu'aucun
 * réglage n'abaisse. Le raisonnement complet, avec les endroits du
 * moteur et les mesures, est écrit en tête de la page de recherche ; il
 * n'est pas recopié ici pour qu'il n'y ait qu'UN endroit à tenir à jour.
 * ⚠️ AUCUNE TROISIÈME CORRECTION N'A ÉTÉ POSÉE À LA nº 669 : le défaut
 * n'a pas été reproduit au banc (douze rejeux du scénario complet), et
 * la règle de la passe était de ne rien corriger à l'aveugle.
 */
export const PREPARER_LA_RECHERCHE_A_LAVANCE = false;
