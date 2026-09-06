/**
 * JOURNAL DE NAVIGATION (persistant)
 * ----------------------------------
 * Retient la page en cours et la page précédente VISITÉES DANS LE
 * SITE. Stocké en localStorage : contrairement à la mémoire de
 * session, il survit à l'inactivité, à la mise en veille et à la
 * fermeture de l'application (le retour ne doit JAMAIS « expirer »
 * et renvoyer à l'accueil à la place de la liste). Les entrées de
 * plus de 24 h sont ignorées : au-delà, revenir à l'accueil
 * redevient le comportement naturel.
 * Mis à jour à chaque changement de page par <MemoireNavigation />
 * (posé dans le layout).
 */

/**
 * ██████████████████████████████████████████████████████████████████
 * ██  LA RÈGLE DE NAVIGATION DU SMARTPHONE — ELLE FAIT AUTORITÉ   ██
 * ██████████████████████████████████████████████████████████████████
 *
 * « Décidée par le propriétaire à la passe nº 328, après l'inventaire
 * de la nº 327. Aucune passe future ne doit la contredire : si un
 * écran a besoin d'une exception, elle s'écrit ici, nommée et datée. »
 *
 *  1. Toute surface qui couvre l'écran pose une entrée d'historique,
 *     et le bouton retour la referme. Et cette entrée est CONSOMMÉE
 *     par la navigation qui suit, jamais doublée (nº 332-§1).
 *  2. Le retour ne referme qu'une chose à la fois — la dernière
 *     ouverte.
 *  3. Un écran neuf s'ouvre en haut. Un écran où l'on revient se pose
 *     là où on l'avait quitté. C'est le CHEMIN qui décide, jamais
 *     l'écran.
 *     ⚠️ nº 889 — LA RÈGLE NE CHANGE PAS, CELUI QUI L'APPLIQUE, SI.
 *     Le site ne mémorise ni ne restitue plus AUCUNE position de page :
 *     le haut d'un écran neuf est posé par le ROUTEUR, et la place d'un
 *     écran où l'on revient est rendue par le NAVIGATEUR
 *     (history.scrollRestoration = "auto", nº 363). Ce qui se perd, et
 *     que le propriétaire a accepté : les onglets d'un profil (nº 873)
 *     et le va-et-vient Tattoo/Flash (nº 860) rouvrent en haut — un
 *     lien qui remplace son entrée d'historique n'est pas un retour
 *     pour le navigateur.
 *  4. La position se lit toujours par la fonction qui sait lire sous
 *     le gel, jamais par la valeur brute (`positionSousLeGel`).
 *     ⚠️ nº 889 — IL N'EN RESTE QU'UN LECTEUR : le gel lui-même, qui
 *     retient sa place au gel et la rend au dégel. Tous les autres
 *     écrivaient dans la mémoire de position, qui est partie.
 *  5. L'état d'un écran vit dans l'adresse, pas dans React.
 *  6. Un lien interne vers un autre portfolio n'affiche pas la photo
 *     en haut. Une arrivée depuis une carte ou un lien de partage
 *     l'affiche.
 *     ⚠️ DEPUIS LA nº 359, LE LECTEUR A CHANGÉ, PAS LA RÈGLE : la
 *     fiche est préparée d'avance, le serveur ne lit plus la requête.
 *     La consigne est lue AVANT LA PREMIÈRE PEINTURE par le script
 *     (garde CSS : la photo d'un `entree=lien` n'existe jamais à
 *     l'écran, pas même un instant), puis par le navigateur
 *     (FicheSelonLAdresse), qui resème la fiche par sa clé.
 *  7. Une fermeture ne consomme une entrée que si elle l'a créée.
 *  8. Le pas en avant rouvre ce que le retour vient de fermer, dans le
 *     même état.
 *  9. UN RETOUR NE FAIT JAMAIS QUITTER LE SITE — sauf s'il y a une
 *     VRAIE page derrière, auquel cas le visiteur a le droit de
 *     repartir d'où il venait (nº 332-§2, RetourGaranti).
 *     ⚠️ « UNE VRAIE PAGE », ET NON « UNE ENTRÉE » (nº 345-§1). Chrome
 *     sur iPhone ouvre ses onglets avec UNE ENTRÉE FANTÔME déjà en
 *     place : la pile y vaut 2 à l'arrivée, et l'ancienne condition
 *     (`history.length <= 1`) rendait le filet INEXISTANT sur ce
 *     navigateur — mesuré par le propriétaire en ligne, reproduit au
 *     banc p345. La question se pose désormais en deux moitiés, écrites
 *     une seule fois dans lib/bas-de-la-pile : une page DE CE SITE
 *     derrière ? (notre propre marque : la profondeur relevée à
 *     l'arrivée) ; une page ÉTRANGÈRE derrière ? (le référent, seul
 *     témoin qui distingue une entrée fantôme d'Instagram).
 * 10. CADUC DEPUIS LA nº 889. « Une place, c'est une position ET
 *     l'état de la barre qui allait avec ; on range les deux, on rend
 *     les deux » (nº 335-§1). Il n'y a plus de place rangée, donc plus
 *     d'état de barre à ranger avec elle : une page qui s'ouvre en haut
 *     a sa rangée dépliée, par construction. Ce qui reste chez
 *     lib/reserve-barre : la survie de l'état au REMONTAGE dans le même
 *     document (nº 430), qui n'a jamais rien eu à voir avec une place.
 * 11. QUAND LA DÉCISION N'EST PAS « QUOI AFFICHER » MAIS « QUELLE PAGE
 *     SERVIR », C'EST LE SERVEUR QUI TRANCHE, d'après l'adresse
 *     (nº 335-§2 ; son seul module, lib/appareil-serveur, est parti
 *     avec la page du carrousel à la nº 602). Décidée dans le navigateur,
 *     une telle bascule se voit toujours : il y a une image, puis une
 *     autre. La règle du DOIGT (nº 60) reste seule maîtresse de tout
 *     ce qui s'AFFICHE.
 * 12. PENDANT UNE NAVIGATION, LES DEUX ADRESSES NE DISENT PAS LA MÊME
 *     CHOSE, ET CHACUNE EST EN RETARD À SON TOUR (nº 336-§1). Le
 *     ROUTEUR (`usePathname`) sait vers quelle page on VA — dès le
 *     premier rendu ; le NAVIGATEUR (`location`) sait quelle adresse
 *     est COMMISE — et lui seul voit les `pushState` bruts et les
 *     `popstate`. Une surface qui vit dans l'adresse demande donc au
 *     routeur À SA NAISSANCE, et au navigateur ensuite. S'en remettre
 *     à un seul des deux, c'est ouvrir une surface sur une adresse
 *     qu'on est en train de quitter — et plus rien ne la referme.
 * 13. CADUC DEPUIS LA nº 889. « On ne pose une position que sur du
 *     contenu » (nº 337-§1) : le site ne pose plus de position, et
 *     lib/pose-sur-contenu est parti. Ce que le navigateur fait à notre
 *     place au rechargement est moins fin — il ne sait pas attendre que
 *     les cartes arrivent — et c'est le prix assumé du standard.
 *
 * 14. LE ROUTEUR NE POSE PAS ZÉRO TOUT SEUL, ET IL FAUT LE SAVOIR
 *     (nº 889). Le défaut documenté de `<Link>` : il GARDE la position
 *     quand le haut du contenu de la page qui arrive est encore visible
 *     dans la fenêtre — donc précisément quand la page qu'on quitte
 *     était LÉGÈREMENT défilée. C'est le bug que huit passes (881-888)
 *     ont attribué à WebKit. Ce qui le corrige : `scroll-padding-top`
 *     (globals.css), que Next lit lui-même pour ce test. Voir
 *     docs/DEFILEMENT-889-INVENTAIRE.md, avec la mesure et le code du
 *     routeur.
 *
 * ------------------------------------------------------------------
 * POURQUOI ELLE VIT ICI, ET PAS AILLEURS. Ce module portait déjà LA
 * RÈGLE UNIQUE DE RESTITUTION (plus bas, avant `arriveeQuiRestitue`) —
 * c'est-à-dire le point 3 avant qu'il ne soit nommé. La règle entière
 * le rejoint plutôt que de vivre dans un fichier de plus : elle décide
 * de ce que ce module décide déjà.
 *
 * OÙ CHAQUE POINT S'APPLIQUE, POUR QU'AUCUN NE SE PERDE :
 *  · 1 et 2 — `PileFiches`, `GrilleTatoueurs`, `PageFavoris`, et
 *    depuis la nº 330-§3 LES
 *    QUATRE DERNIÈRES : la feuille du bas des menus (`MenuDeroulant`),
 *    la page de recherche du smartphone (`PageRechercheMobile`), le
 *    menu « Mon espace » (`MenuEspace`) et le détail d'une fiche dans
 *    l'administration (`AdminYokofolio`) — le C-4 de l'inventaire
 *    nº 327. Elles passent TOUTES par l'écriture unique
 *    `useEtapeQuiSeReferme` (lib/etape-refermable), qui pose l'étape,
 *    referme au `popstate`, et ne reprend son étape que si elle est
 *    encore la sienne.
 *  · 3 — le ROUTEUR (l'arrivée d'une page neuve) et le NAVIGATEUR (les
 *    retours) depuis la nº 889 ; `gel-du-corps` (le dégel, avec sa
 *    réserve depuis la nº 329-§2) et
 *    `ouvrirLaListeEnHaut` (lib/liste-neuve) — L'ÉCRITURE UNIQUE de
 *    « une liste neuve commence en haut », appelée par le filtre de
 *    « Ma sélection » (`poserSelection`) ET par la recherche
 *    (`IndexTatoueurs.chercher`) depuis la nº 330-§1 et §2. ⚠️ ELLE EST
 *    APPELÉE PAR LE GESTE, JAMAIS DÉDUITE DE L'ADRESSE : un retour
 *    arrive lui aussi avec une requête, et lui doit garder sa place.
 *  · 4 — `positionSousLeGel` (lib/gel-du-corps), appelée par TOUS
 *    ceux qui écrivent une position depuis la nº 328-§2.
 *  · 5 — la consigne d'arrivée (`?entree=lien`) vit dans l'adresse
 *    depuis la nº 329-§4 (lib/lien-interne) ; la SECTION
 *    D'ADMINISTRATION (`?section=`) depuis la nº 332-§4, par
 *    l'écriture commune `useEtapeDansLAdresse` (lib/etape-dans-adresse).
 *    ⚠️ L'ONGLET D'UNE FICHE NE VIT PLUS DANS LA REQUÊTE (nº 873-§1) :
 *    « ?onglet=portfolio » (nº 329-§3) est parti — le profil, le
 *    portfolio et les flashs sont TROIS PAGES (`cheminDeFiche`,
 *    lib/lien-interne), et le va-et-vient est un lien entre elles, comme
 *    l'accueil de la nº 860. La règle de la nº 332-§4 (« l'onglet d'une
 *    fiche REMPLACE son entrée, le retour doit quitter la fiche d'un
 *    seul appui ») est donc CADUQUE, sur décision du propriétaire :
 *    chaque onglet suivi POSE une entrée, et le retour rend la page
 *    d'avant, à sa place — c'est le prix des trois adresses, et c'est
 *    ce qu'il veut. Une SECTION ou une ÉTAPE en pose une aussi (un
 *    retour ne doit pas abandonner un formulaire à moitié rempli).
 *    ⚠️ L'AUTRE MOITIÉ DU C-6 RESTE OUVERTE, faute d'objet : le
 *    formulaire n'a AUCUNE étape que l'on parcourt — son seul état
 *    nommé `etape` est un sas de vérification qui avance tout seul au
 *    bout de huit secondes. Le porter dans l'adresse enverrait le
 *    retour sur un écran qui repartirait aussitôt. À redéfinir avec
 *    le propriétaire.
 *  · 6 — `?entree=lien`, posé par `avecConsigneDeLienInterne`
 *    (ContenuFiche) — l'écriture unique, dont `adresseDeLienInterne`
 *    n'est que le cas d'une adresse publique de portfolio. Elle
 *    couvre TOUS les liens qui mènent à un portfolio : équipe, guest,
 *    salon, studio, rond de profil de « Ma sélection », et « Mon
 *    portfolio » du menu « Mon espace » (nº 330-§4). Elle est LUE PAR
 *    LE SERVEUR sur la page d'une fiche, et par `useSearchParams` en
 *    aperçu — jamais par `window.location.search`, en retard d'un
 *    rendu au premier clic (la leçon de la nº 329-§4).
 *    ⚠️ `lib/arrivee-sans-photo` A ÉTÉ SUPPRIMÉ, code compris
 *    (nº 329-§4) : sa mémoire de session se consommait à la première
 *    lecture, et un retour perdait la consigne.
 *  · 7 — chaque `fermer` du site vérifie qu'il a poussé son entrée.
 *  · 9 — `RetourGaranti` (le filet lui-même, posé dans la mise en page
 *    du groupe avant toute surface, donc toujours dessous) et
 *    `lib/bas-de-la-pile`, qui porte la QUESTION — « y a-t-il une
 *    vraie page derrière moi dans cet onglet ? » — et son relevé, fait
 *    par le script d'avant peinture parce que c'est le seul endroit
 *    qui précède tout le monde. Un relevé plus tardif compterait nos
 *    propres entrées comme si elles étaient là avant nous.
 *  · 10 — `lib/reserve-barre` (la règle et les deux hauteurs, écrites
 *    une seule fois), `memoriserDefilement` / `lireLaPlace` ici même
 *    (le rangement), `rendreLaPlace` (lib/restitution-position, LA
 *    SEULE PORTE du retour), `EnTeteTatouage` (la rangée naît dans
 *    l'état demandé) et le script d'avant peinture (la marque, posée
 *    avant que React n'existe). La feuille de style porte les deux
 *    règles qui font que rien ne bouge à la première image
 *    (`data-rangee-repliee`, `data-rangee-immediate`, globals.css).
 *  · 11 — PLUS AUCUN APPLICATEUR depuis la nº 602. Ce point n'avait
 *    qu'un seul lieu d'exercice, `lib/appareil-serveur`, appelé par la
 *    page du carrousel partagé ; la page a été supprimée, et le module
 *    avec elle, faute d'autre appelant. La RÈGLE, elle, reste écrite
 *    ici : le jour où une décision « quelle page servir » se
 *    représentera, c'est ainsi qu'elle se prendra.
 *  · 12 — n'a plus d'applicateur non plus depuis la nº 602 : c'était
 *    l'ajustement de premier rendu de la fenêtre de carrousel
 *    (`ficheDejaPosee`, FicheTatoueur), parti avec elle — avec son
 *    réveil par l'écriture commune des changements d'adresse
 *    (`souscrireAdresse`, nº 337-§2), sans lequel la règle ne jouait
 *    qu'une fois et la fenêtre restait ouverte jusqu'à un second
 *    appui. Plus aucune surface du site ne s'ouvre depuis l'adresse ;
 *    celle qui le ferait un jour doit reprendre cette règle-ci, et non
 *    la recopier de travers.
 *  · 13 — `lib/pose-sur-contenu` (la règle et la boucle d'attente,
 *    écrites une fois), `poserLaPosition` (lib/restitution-position) et
 *    le script d'avant peinture, qui reçoit sa boucle TOUTE FAITE au
 *    lieu d'en garder une copie.
 *  · 8 — conséquence des points 1 et 5 : une surface qui vit dans
 *    l'historique et dont l'état vit dans l'adresse se rouvre telle
 *    quelle. Tenu pour la fiche (onglet et consigne d'arrivée) depuis
 *    la nº 329. Les quatre surfaces du point 1 vivent dans
 *    l'historique depuis la nº 330 ; leur ÉTAT, lui, ne vit pas dans
 *    l'adresse — elles se referment au retour, elles ne se rouvrent
 *    pas au pas en avant. C'est voulu : une surface qu'on vient de
 *    fermer n'a pas à se rouvrir toute seule.
 *
 * ------------------------------------------------------------------
 * CE QUE CHAQUE PASSE A APPLIQUÉ, ET CE QUI RESTE :
 *  · nº 328 — la règle écrite ; C-3 (la position sous le gel), C-2
 *    (le chemin décide, sans saut), C-1 (les commandes de la fenêtre
 *    de carrousel en navigation de client), C-5 (les gardes de
 *    fermeture).
 *  · nº 329 — le dégel ne repose plus une position sur une page qui
 *    n'est pas la sienne (§1) et le fait AVEC RÉSERVE DE HAUTEUR
 *    (§2) ; l'onglet et la consigne d'arrivée passent dans l'adresse
 *    (§3, §4) ; un filtre appliqué ouvre la liste en haut (§5).
 *  · nº 330 — la remontée d'une liste neuve devient UNE ÉCRITURE
 *    UNIQUE qui survit au gel d'un panneau (§1) et sert aussi la
 *    recherche (§2) ; C-4 est traité — les quatre dernières surfaces
 *    posent leur étape d'historique (§3) ; « Mon portfolio » porte la
 *    consigne des liens internes (§4).
 *  · nº 332 — l'étape d'une surface est CONSOMMÉE par la navigation
 *    au lieu d'être doublée (§1, `laNavigationRemplaceLEtape`) ; le
 *    filet couvre TOUT le site, au doigt comme sur ordinateur, et ne
 *    joue que si l'onglet n'a rien derrière lui (§2, RetourGaranti) ;
 *    le rond de profil d'un carrousel PARTAGÉ porte la consigne des
 *    liens internes (§3) ; la section d'administration vit dans
 *    l'adresse, une entrée par pas (§4).
 *  · nº 333 — un filtre validé laisse UNE entrée, et une seule (§1) ;
 *    l'effet de restitution est réveillé quand le routeur remet
 *    l'adresse avant le `popstate` (§2, `attenteDeTraversee`).
 *  · nº 334 — les trois remontages qui visaient la page QU'ON QUITTE
 *    sont partis ; la liste neuve est posée en haut à SON arrivée,
 *    avant sa peinture.
 *  · nº 335 — LA PLACE EST RENDUE AVEC L'ÉTAT DE LA BARRE (§1, point
 *    10 ci-dessus) ; le lien de partage est tranché par le SERVEUR
 *    (§2, point 11) ; la sonde du clic répond au rond de profil (§3).
 *  · nº 337 — on ne pose plus une position dans le vide (§1, point 13)
 *    et la fiche est RÉVEILLÉE par tout changement d'adresse, ce qui
 *    rend le point 12 applicable plus d'une fois (§2).
 *  · nº 336 — LA FENÊTRE NE SE ROUVRE PLUS PAR-DESSUS LA PAGE OÙ L'ON
 *    ARRIVE (§1, point 12 ci-dessous) ; l'ancre `#profil` reste dans
 *    l'adresse, et le « une seule fois » passe dans l'étape
 *    d'historique (§1) ; les retours sont laissés au navigateur, qui a
 *    déjà sa copie de la page (§2 — c'était alors une consigne au
 *    service worker ; il est retiré à la nº 791, la copie du navigateur
 *    demeure).
 *  · nº 344 — CE QUI VARIE CÔTÉ SERVEUR, MESURÉ : le HTML servi est
 *    identique au caractère près pour un iPhone et pour un ordinateur ;
 *    les deux seules variations réelles sont l'appareil (page du
 *    carrousel partagé, point 11) et les cookies, toutes deux servies
 *    en `private, no-cache`. `Vary` ne peut PAS être déclaré depuis
 *    l'application : Next le réécrit (essayé par `next.config.headers`
 *    et par le proxy, les deux essais annulés).
 *  · nº 345 — LE FILET NE DEMANDE PLUS SI LA PILE EST VIDE, mais s'il y
 *    a une VRAIE page derrière (§1, point 9 ci-dessus,
 *    lib/bas-de-la-pile). Il ne s'armait que sur Safari.
 *  · nº 346 — ET IL NE DÉPEND PLUS DU SCRIPT D'AVANT PEINTURE (§1). Le
 *    relevé n'était fait que là ; son absence retombait sur
 *    `history.length <= 1`, c'est-à-dire sur la règle que la nº 345
 *    venait de retirer — et le relevé en ligne du propriétaire montre
 *    que ce bloc du script ne s'exécute pas sur son Chrome. Le repli est
 *    SUPPRIMÉ, le module prend la mesure lui-même au chargement, et une
 *    ligne de journal dit désormais qui a décidé (`ligneDeDecision`).
 *  · nº 347 — LE VERDICT DU FILET NE PEUT PLUS ÊTRE INVISIBLE (§A) : la
 *    décision est DÉPOSÉE (mémoire d'onglet, lib/bas-de-la-pile), le
 *    journal la verse à son ouverture, et écrit LUI-MÊME « aucune
 *    décision du filet reçue » si rien n'arrive — le silence devient
 *    une ligne. Et le script d'avant peinture porte un MILLÉSIME
 *    (`data-version-script`, §B) que le journal relève : un HTML servi
 *    sans numéro est un HTML périmé, retenu par un cache — la piste
 *    commune aux deux blocs qui ne tournent jamais en ligne.
 *  · nº 348 — LE JOURNAL NE S'EFFACE PLUS LUI-MÊME (§1 : le module
 *    relit la mémoire avant chaque écriture — sa copie unique écrasait
 *    les lignes de l'amorce ; et les enveloppes de l'amorce lisent les
 *    marques d'état au lieu d'étiqueter tout « avant peinture »). ET LE
 *    CRAN DU FILET N'EST POSÉ QUE SUR UN DOCUMENT FINI (§4,
 *    RetourGaranti) : une entrée posée pendant le chargement peut être
 *    mal accrochée à la liste interne du navigateur — c'est la fenêtre
 *    de course des éjections aléatoires de production, inexistante en
 *    local où le document est fini avant l'hydratation. RESTE OUVERT :
 *    la pile d'arrivée qui grossit de visite en visite (le relevé du
 *    bas est pris une fois par ONGLET ; les entrées d'une visite morte
 *    comptent comme « du site » à la visite suivante — la règle « une
 *    fois par VIE », re-relevé à chaque document de type navigate, est
 *    la correction désignée si le propriétaire la commande).
 *  · nº 349 — LE PLANCHER PASSE « UNE FOIS PAR VIE » (§2, commandé :
 *    une arrivée `navigate` reprend le relevé, les restes d'une visite
 *    morte ne comptent plus ; `reload` et `back_forward` gardent le
 *    leur — lib/bas-de-la-pile et le bloc du script). LA RÉÉCRITURE DE
 *    LA CONSOMMATION D'ÉTAPE ATTEND LA FIN DE LA TRAVERSÉE (§1,
 *    etape-refermable : elle s'exécutait DANS le gestionnaire du
 *    popstate — la seule réécriture du site dans la fenêtre de
 *    transition). ET LE JOURNAL NE PREND PLUS UNE RECOPIE POUR UNE
 *    SIGNATURE : la « REMPLACÉE · RetourGaranti » à 8 ms du popstate
 *    était LE ROUTEUR recopiant l'état marqué de l'étape (mesure
 *    nº 333 : « +16 ms replaceState → / (le routeur de Next) ») ; pour
 *    une REMPLACÉE, une marque ne désigne l'appelant que si elle est
 *    NEUVE (`quiRemplace` — journal de l'historique, retiré nº 790).
 *  · nº 350 — LA RÈGLE DES ÉJECTIONS EST TROUVÉE, sourcée par le
 *    propriétaire : Chrome 127 / iOS 17.5+ SAUTE au retour les entrées
 *    créées SANS interaction (anti-piège, crédit ~10 s). LE CRAN DU
 *    FILET EST DONC POSÉ À LA PREMIÈRE INTERACTION, synchrone dans le
 *    gestionnaire (`pointerdown`/`keydown` en capture, RetourGaranti) —
 *    avant le premier toucher, pas de cran, et un retour immédiat sort
 *    du site : accepté. L'attente du document fini (nº 348) est
 *    retirée — c'était la même plaie, la mauvaise cause. Audit : le
 *    cran était la seule entrée du site posée sans geste ; surfaces,
 *    carrousel et fenêtres de fiche naissent toutes d'un toucher.
 *  · nº 351 — L'APPUI FRANC, PAS LE DÉBUT DE DÉFILEMENT : mesuré en
 *    ligne, un cran né d'un `pointerdown` de défilement reste sauté
 *    (Chrome, Brave) quand Safari est parfait. La pose passe au
 *    RELÂCHEMENT d'un appui de moins de dix pixels (`pointerup`,
 *    `keydown` hors touches mortes, `click` en filet), toujours
 *    synchrone et en capture ; un défilement n'arme rien et le journal
 *    le dit une fois (« EN ATTENTE »). Le relevé de la nº 351 note
 *    aussi : au retour, Chrome peut TRAVERSER le cran une fois puis
 *    sauter par-dessus lui ET par-dessus l'accueil — le crédit est
 *    donc jugé AU MOMENT DU RETOUR, sur un budget qui se consomme,
 *    par GROUPE de document, pas seulement à la création de l'entrée.
 *    Si l'appui franc ne suffit pas, la suite est déjà cadrée par le
 *    propriétaire : dire si un filet est tenable sur ces navigateurs,
 *    ou le restreindre à ceux qui le respectent.
 *  · nº 352 — LE VERDICT EST RENDU : l'appui franc a GUÉRI BRAVE (onze
 *    cycles, onze popstate, zéro éjection) mais PAS CHROME iPHONE, où
 *    l'éjection reste possible À TOUT RANG de retour, aléatoirement,
 *    cran d'appui franc compris — et où un cran peut être consommé EN
 *    SILENCE (retour qui atterrit une entrée trop bas, sans que rien ne
 *    le dise). UN FILET GARANTI N'EST PAS TENABLE SUR CHROME iPHONE :
 *    le juge siège dans la couche applicative du navigateur, hors de
 *    portée de la page, et aucun popstate n'accompagne ses sauts — le
 *    filet ne peut même pas OBSERVER ce qu'il devrait rattraper. Il
 *    reste naturellement inerte là où il est ignoré (un saut ne produit
 *    aucun popstate) et pleinement actif sur Safari et Brave. La
 *    décision d'aller plus loin (statu quo ou navigations pleines sur
 *    Chrome) appartient au propriétaire — rien ne s'implémente sans
 *    son accord (nº 352-§3). La fausse ligne « EN ATTENTE » sur chaque
 *    fiche est corrigée (§4 : elle ne sort que si aucun cran n'est posé
 *    dans le document, une seule fois — drapeaux à l'échelle du
 *    module, RetourGaranti).
 *  · nº 353 — LE BANC D'ÉPREUVE PAR VARIANTES (`?variante=nu`,
 *    `sans-filet`, `sans-surfaces`…) coupait nos écritures
 *    d'historique une par une, pour que le téléphone du propriétaire
 *    nomme le coupable des éjections. Il l'a nommé au point suivant :
 *    le banc, ses huit portes, son cookie du proxy et son bloc du
 *    script d'avant peinture sont retirés à la nº 790.
 *  · nº 357 — ÉTAPE 1 DU CHANTIER DES PAGES PRÉPARÉES D'AVANCE :
 *    L'ACCUEIL NU EST PRÉRENDU (verdict nº 356 : le rendu dynamique
 *    est la cause signée des éjections). La mise en page du groupe et
 *    la racine ne lisent PLUS la requête ; le jumeau dynamique
 *    la recherche (« /search » depuis la nº 652 ; jusque-là le jumeau
 *    « accueil-recherche ») est servie par RÉÉCRITURE du proxy dès que
 *    « / » porte une requête — le filet des liens déjà partagés ; le
 *    catalogue lit Supabase en ANONYME (lib/supabase/server) ; la
 *    barre s'amortit par `data-compte` posé avant peinture + garde CSS
 *    (promesse nº 203 tenue sans rendu dynamique) ; la page nue sert
 *    le repli de 24 cartes avec garde CSS au palier 5 colonnes. Les
 *    fiches et vitrines restent dynamiques — étapes suivantes.
 *  · nº 359 — ÉTAPE 2, TRANCHE 1 : LES FICHES SONT PRÉPARÉES D'AVANCE
 *    (le témoin mixte de la nº 358 a signé : des fiches dynamiques
 *    traversées en douceur suffisent à faire éjecter). La page
 *    publique ne lit plus ni cookies ni requête — tags et consigne
 *    lus par le navigateur (FicheSelonLAdresse + garde d'avant
 *    peinture) ; l'aperçu du propriétaire et les métadonnées par tags
 *    vivent au JUMEAU COMPLET (tatoueur/[slug]/complet), servi par le
 *    proxy aux robots d'aperçu ; le bouton « Suivre » naît neutre et
 *    se remplit à la charge des favoris (le modèle des cœurs nº 137).
 *    RESTENT DYNAMIQUES, par nature : le carrousel partagé (règle 11),
 *    l'espace connecté, « Ma sélection », et le jumeau de recherche de
 *    l'accueil — périmètre des tranches suivantes.
 *  · nº 360 — LE LECTEUR DES TAGS NE LIT QUE SA PROPRE ADRESSE. La
 *    première écriture lisait TOUS les changements d'adresse : à
 *    l'arrivée elle semait les tags de la page PRÉCÉDENTE (l'adresse
 *    n'est commise qu'après le premier rendu — la mesure nº 336), et
 *    pendant la vie de la fiche elle resemait sous les SURFACES (le
 *    pushState de la fenêtre de carrousel la détruisait alors — retour
 *    du « remplacement sur place » retiré à la nº 304). La règle est
 *    celle d'avant la nº 359, à la lettre : une page lit SA requête,
 *    une fois l'adresse à elle ; les surfaces n'existent pas pour
 *    elle (FicheSelonLAdresse, lecture gelée hors de son chemin).
 *  · nº 363 — LA RESTAURATION DU DÉFILEMENT EST RENDUE AU MOTEUR
 *    (« auto », script d'avant peinture). Elle était coupée depuis la
 *    nº 143 ; la mesure de la nº 362 (départ instrumenté : position
 *    conservée à l'instant du changement d'adresse, aucun masque,
 *    aucun effondrement, 6 Mo décodés) n'a laissé qu'elle pour
 *    expliquer l'écran noir du glissement retour — un retour de carte
 *    étant une navigation DANS LE MÊME DOCUMENT, le moteur n'a que
 *    l'entrée d'historique pour savoir où se placer pendant le geste,
 *    et « manual » lui disait de ne rien placer. ⚠️ LE POINT 4 NE
 *    BOUGE PAS : la position reste écrite, lue et posée par nous
 *    (mémoire de navigation + réserve de hauteur + rendreLaPlace) ;
 *    le moteur vise la même valeur, celle qu'il a rangée au départ.
 *    ESSAI EMPIRIQUE, à trancher par le téléphone du propriétaire :
 *    en cas d'échec, un seul mot revient en arrière.
 *  · IL RESTE : la moitié du C-6 sans objet — voir le point 5.
 *
 * ------------------------------------------------------------------
 * CHANTIERS OUVERTS — SOLDÉS À LA nº 790.
 * Cette liste énumérait ce qu'il fallait retirer AVANT la mise en
 * ligne : l'armement des sondes et trois instruments (remontée, clic,
 * historique). Le grand ménage de la nº 790 les a tous retirés, avec
 * neuf autres sondes et la boîte noire — chacune posée pour un défaut
 * clos depuis. Il ne reste, du registre d'armement, que le JOURNAL DE
 * BORD, et deux sondes d'affichage armées par l'adresse : la VITESSE
 * et la NAVIGATION. Elles ne visent aucun défaut : ce sont des
 * instruments de mesure, et les passes suivantes (les préchargements)
 * s'en serviront. Le tableau de bord qui les allume
 * (`/dev`) est désormais réservé au compte admin.
 * ██████████████████████████████████████████████████████████████████
 */

/*  nº 889 — CE MODULE N'IMPORTE PLUS RIEN. Il lisait l'adresse
    canonique d'une recherche (lib/adresse-recherche), l'état de la
    rangée (lib/reserve-barre) et le journal du diagnostic : les trois
    ne servaient qu'à la mémoire de position, qui est partie. */

export const CLE_JOURNAL = "yokofolio:pages-visitees";
const CLE = CLE_JOURNAL;

/** Douze heures × 2 : au-delà, le journal est considéré périmé */
export const AGE_MAXIMUM_MS = 24 * 3600 * 1000;

type PagesVisitees = {
  courante: string | null;
  precedente: string | null;
  date: number; // horodatage de la dernière mise à jour
};

function lire(): PagesVisitees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const etat = JSON.parse(brut) as PagesVisitees;
      if (Date.now() - (etat.date ?? 0) <= AGE_MAXIMUM_MS) return etat;
    }
  } catch {
    // stockage indisponible (navigation privée stricte…)
  }
  return { courante: null, precedente: null, date: 0 };
}

/** À chaque page affichée (adresse = chemin + éventuels filtres) */
export function noterPageVisitee(url: string) {
  const etat = lire();
  try {
    if (etat.courante === url) {
      // Rechargement ou re-rendu de la même page : on rafraîchit
      // seulement l'horodatage (la vraie page précédente est gardée)
      localStorage.setItem(CLE, JSON.stringify({ ...etat, date: Date.now() }));
      return;
    }
    localStorage.setItem(
      CLE,
      JSON.stringify({
        courante: url,
        precedente: etat.courante,
        date: Date.now(),
      })
    );
  } catch {
    // tant pis : le bouton retour se rabattra sur l'accueil
  }
}

/*  nº 889 — `lirePagePrecedente` et `lirePageCourante` sont parties :
    aucun appelant dans le site, vérifié. Elles accompagnaient la
    mémoire de position, qui est partie avec elles. Le journal, lui,
    reste écrit — c'est le bouton retour d'une fiche qui le lit, par
    lib/bas-de-la-pile. */

/* ------------------------------------------------------------
 * NAVIGATION DE L'ONGLET EN COURS
 * ------------------------------------------------------------
 * Compte les pages du site réellement affichées dans CET onglet
 * (mémoire d'onglet). Sert au bouton retour : un vrai retour
 * arrière n'est sûr que si l'onglet a déjà navigué DANS le site —
 * sinon l'entrée précédente de l'historique est une page
 * extérieure (onglet neuf, lien partagé, application relancée) et
 * il faut RECONSTRUIRE le retour au lieu de la rejoindre.
 */

export const CLE_ONGLET = "yokofolio:onglet";

/** §2 (nº 428) — LA MARQUE DU RATTRAPAGE DU FILET : posée par
    RetourGaranti juste avant son `location.replace("/")`, lue et
    consommée par le script d'avant-peinture. Sans elle, le filet de
    réparation du repli (voir script-avant-peinture, bloc 3) prendrait
    ce départ VOULU vers l'accueil nu pour un repli de navigation qui
    a perdu ses critères, et renverrait l'utilisateur là d'où le
    rattrapage venait précisément de le tirer. */
export const CLE_RATTRAPAGE_FILET = "yokofolio:rattrapage-filet";

/**
 * §1 (nº 429) — « DÉPART VOULU VERS L'ACCUEIL » : L'INTENTION DÉCLARÉE
 * ==================================================================
 * LE DÉFAUT QU'ELLE FERME (relevé du propriétaire, nº 429) : le LOGO
 * de la barre est un `<a href="/">` NATIF — chaque clic est donc une
 * navigation de document vers « / » nu, VOULUE. Le filet de
 * réparation de la nº 428 n'y voyait qu'un document né « navigate »
 * sur l'accueil nu juste après le départ d'une adresse à critères —
 * la signature exacte du repli — et RENVOYAIT l'utilisateur vers la
 * recherche qu'il venait précisément de quitter : le logo ne ramenait
 * plus à l'accueil.
 * LA RÈGLE, POSÉE PAR LE PROPRIÉTAIRE : tout lien interne du site
 * vers l'accueil nu DÉCLARE son intention avant de partir ; le filet
 * la lit, la consomme, et s'abstient. La déclaration est un
 * horodatage : elle ne vaut que huit secondes (même fenêtre que le
 * filet), et une navigation douce qui n'a pas déchargé le document la
 * laisse expirer sans effet.
 */
export const CLE_DEPART_VOULU = "yokofolio:depart-voulu-accueil";

/** À appeler au CLIC de tout lien interne qui mène à l'accueil nu
    (le logo de la barre en tête). Un simple horodatage de session —
    jamais un frein : la navigation part comme avant. */
export function declarerDepartVouluVersLAccueil() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CLE_DEPART_VOULU, String(Date.now()));
  } catch {
    //  Sans stockage de session, le filet de réparation ne joue pas
    //  non plus (il lit la même mémoire) : aucune interférence.
  }
}

/**
 * §1 (nº 438) — « CETTE REPRISE VIENT DU SITE » : LA FERMETURE DÉCLARÉE
 * ==================================================================
 * LE DÉFAUT QU'ELLE FERME (relevé du propriétaire, nº 438 — ordinateur,
 * pile saturée à 100) : fermer la fenêtre superposée (croix, voile,
 * Échap) passe par `history.back()` — une reprise VOULUE, émise par le
 * site lui-même. Le rattrapage du filet (RetourGaranti, §1 nº 423) n'y
 * voyait qu'un popstate atterri sans marque à l'adresse du cran — la
 * signature exacte de « plus rien du site derrière » — et rechargeait
 * tout le site vers l'accueil, en plein geste de fermeture.
 *
 * LA RÈGLE — CELLE DE LA nº 429, APPLIQUÉE AUX REPRISES : tout
 * `history.back()` émis PAR LE SITE (une fenêtre qui se referme, une
 * étape qui se reprend) SE DÉCLARE juste avant de partir ; le
 * rattrapage lit la déclaration au popstate, la consomme, et se tait.
 * Une reprise du site n'est jamais un atterrissage accidentel au fond
 * de la pile. Le rattrapage reste entier pour ses vrais cas : un
 * retour du NAVIGATEUR (bouton, geste, clavier) ne déclare rien.
 *
 * ⚠️ EN MÉMOIRE DE MODULE, PAS EN MÉMOIRE D'ONGLET : la déclaration ne
 * doit vivre que le temps du popstate qui suit — quelques
 * millisecondes — et mourir avec le document. Deux secondes de
 * validité au plus, consommation à la première lecture : un drapeau
 * qui traînerait ne pourrait jamais couvrir un vrai retour du
 * visiteur.
 */
let repriseDuSiteAnnonceeLe = 0;

/** À appeler juste avant tout `window.history.back()` émis par le
    site (fermeture de fenêtre superposée, reprise d'étape). Jamais un
    frein : la reprise part exactement comme avant. */
export function annoncerRepriseDuSite() {
  repriseDuSiteAnnonceeLe = Date.now();
}

/** Lue et CONSOMMÉE par le rattrapage du filet (RetourGaranti) au
    popstate : vrai si une reprise du site a été annoncée il y a moins
    de deux secondes. La lecture éteint la déclaration. */
export function laRepriseVientDuSite(): boolean {
  const annoncee =
    repriseDuSiteAnnonceeLe !== 0 &&
    Date.now() - repriseDuSiteAnnonceeLe < 2000;
  repriseDuSiteAnnonceeLe = 0;
  return annoncee;
}

/*  §1 (nº 478) — LA SUSPENSION DE LA RESTAURATION NATIVE EST PARTIE.
    Elle avait été écrite à la nº 477 pour un seul appelant : la sortie
    confirmée de la garde de saisie, qui passait alors par une TRAVERSÉE
    d'historique (`history.go(-2)`) — le seul chemin où le navigateur
    repose la position avant toute ligne du site. Cette passe a changé
    le véhicule : cette sortie est devenue une navigation EN AVANT vers
    l'accueil, comme le logo. Il n'y a donc plus rien à suspendre, et
    l'acquis nº 363 — `scrollRestoration = "auto"`, sans quoi le retour
    par glissement laisse un écran noir — reste entier, sans exception
    ni parenthèse. Une écriture qui n'a plus d'appelant est un piège
    pour la passe suivante : elle s'en va avec son motif. */


type EtatOnglet = {
  derniere: string | null;
  pages: number;
  /** §1 (nº 428) — l'instant du DERNIER DÉPART de page (pagehide),
      écrit par `noterDepartOnglet`. C'est lui qui permet au filet de
      réparation de distinguer un repli de navigation (le document
      suivant naît dans la seconde) d'une adresse tapée à la main
      (absent des vieilles mémoires : le filet ne joue alors pas). */
  quand?: number;
};

function lireOnglet(): EtatOnglet {
  try {
    const brut = sessionStorage.getItem(CLE_ONGLET);
    if (brut) return JSON.parse(brut) as EtatOnglet;
  } catch {
    // stockage indisponible
  }
  return { derniere: null, pages: 0 };
}

/** À chaque page affichée (les rechargements ne comptent qu'une fois) */
export function noterPageOnglet(url: string) {
  const etat = lireOnglet();
  if (etat.derniere === url) return;
  try {
    sessionStorage.setItem(
      CLE_ONGLET,
      JSON.stringify({ derniere: url, pages: etat.pages + 1 })
    );
  } catch {
    // sans mémoire d'onglet, le retour sera reconstruit — sans danger
  }
}

/**
 * §1 (nº 428) — AU DÉPART DU DOCUMENT (pagehide), LA MÉMOIRE D'ONGLET
 * EST MISE À L'HEURE : l'adresse VRAIMENT affichée à cet instant, et
 * l'instant lui-même. C'est la matière première du filet de réparation
 * du script d'avant-peinture : quand un repli de navigation du routeur
 * (une navigation de document née d'un échec de la douce) atterrit sur
 * « / » NU en ayant perdu les critères en route, le document suivant
 * retrouve ici l'adresse complète qui vient d'être quittée — et l'âge
 * de la note dit si c'est bien un repli (quelques centaines de
 * millisecondes) ou une visite sans rapport.
 * ⚠️ UNE FENÊTRE DE FICHE N'EST PAS UNE PAGE (même règle que
 * `noterPageOnglet`) : son adresse est celle de la fiche posée
 * par-dessus la mosaïque — on ne la note pas, on garde la dernière
 * vraie page et on ne met à jour que l'instant.
 */
/*  §1 (nº 868) — LA CONSTANTE DE LA nº 867 EST PARTIE AVEC SA RÈGLE :
    son unique lecteur (`lib/bas-de-la-pile`) a été annulé, et une
    écriture sans lecteur est un piège pour la passe suivante
    (règle nº 386). Le filet de réparation du script, lui, garde ses
    huit secondes écrites chez lui — elles n'ont jamais été partagées. */
export function noterDepartOnglet() {
  const etat = lireOnglet();
  const fenetre = Boolean(
    (window.history.state as { fenetreFiche?: boolean } | null)?.fenetreFiche
  );
  const adresse = window.location.pathname + window.location.search;
  try {
    sessionStorage.setItem(
      CLE_ONGLET,
      JSON.stringify({
        derniere: fenetre ? etat.derniere : adresse,
        pages: etat.pages,
        quand: Date.now(),
      })
    );
  } catch {
    // sans mémoire d'onglet, le filet de réparation ne jouera pas
  }
}

/** Cet onglet a-t-il affiché au moins deux pages du site ? */
export function ongletADejaNavigue(): boolean {
  return lireOnglet().pages >= 2;
}

/** La DERNIÈRE adresse affichée par CET onglet (null : onglet neuf).
    La mémoire d'onglet survit à la résurrection d'une session tuée
    par le système : c'est elle qui dit où l'onglet en était VRAIMENT
    quand le navigateur ressuscite une entrée périmée
    (RepriseSession). */
export function lireDerniereAdresseOnglet(): string | null {
  return lireOnglet().derniere;
}

