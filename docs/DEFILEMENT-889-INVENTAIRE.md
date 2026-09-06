# Le défilement du site — inventaire avant démontage (passe nº 889)

Ce document recense TOUTE la mécanique maison de défilement accumulée
de la nº 661 à la nº 888, avant de la retirer. Il est écrit pour être
lu dans dix passes : chaque mécanisme y porte son fichier, sa passe,
son rôle, et ce qu'il advient de lui à la nº 889.

---

## 0. LA CAUSE RACINE, TROUVÉE À LA nº 889 — ET ELLE N'A JAMAIS ÉTÉ WEBKIT

Huit passes (881 → 888) ont cherché un défaut de moteur. Il n'y en a
pas. Le coupable est le ROUTEUR DE NEXT, et son comportement est
DOCUMENTÉ.

`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` :

> **`scroll`** — Defaults to `true`. The default scrolling behavior of
> `<Link>` in Next.js **is to maintain scroll position**, similar to how
> browsers handle back and forwards navigation. When you navigate to a
> new Page, scroll position will stay the same **as long as the Page is
> visible in the viewport**. However, if the Page is not visible in the
> viewport, Next.js will scroll to the top of the first Page element.

Le code livré dit la même chose, au pixel près
(`node_modules/next/dist/client/components/layout-router.js`) :

```js
function getScrollTargetState(instance, viewportHeight, getScrollPaddingTop) {
  …
  return elementTop >= getScrollPaddingTop() && elementTop <= viewportHeight ? 1 : 2;
}
…
// If the element's top edge is already in the viewport, exit early.
if (getScrollTargetState(domNode, viewportHeight, getScrollPaddingTop) === 1) {
  return;
}
htmlElement.scrollTop = 0;
```

`shouldSkipElement` écarte d'abord tout ce qui est `fixed` ou `sticky`
— donc NOTRE BARRE. Le nœud retenu est le contenu de la page, dont le
haut est posé sous la réserve de la barre (70 px depuis la nº 886).

**Déroulons le cas du propriétaire.** Page d'origine défilée de 39 px,
on tape une carte :

| origine | haut du contenu à l'arrivée | test de Next | ce que fait le routeur |
|---|---|---|---|
| 0 px    | 70 − 0 = **70**    | `70 >= 0 && 70 <= 844` → 1 | rien (on est déjà en haut) |
| 39 px   | 70 − 39 = **31**   | `31 >= 0 && 31 <= 844` → 1 | **RIEN — les 39 px RESTENT** |
| 300 px  | 70 − 300 = **−230** | `−230 >= 0` faux → 2      | `scrollTop = 0` |

C'est EXACTEMENT la contrainte que le propriétaire avait posée à la
nº 887 et que personne n'expliquait : « le décalage n'apparaît que si
la page D'ORIGINE était LÉGÈREMENT défilée ; fortement défilée, la
nouvelle page s'ouvre juste ». Et le « 31 » du relevé nº 884 est ce
`elementTop`-là, au pixel.

Ce n'est ni Safari, ni Chrome iOS, ni WebKit : c'est le défaut de
`<Link>`, sur tous les moteurs. Il ne se voyait pas à l'atelier parce
que la mécanique maison (881-888) le corrigeait avant qu'on le mesure.

**Conséquence pour la consigne nº 889.** Le point 2 de la passe dit
« nouvelle page → scrollY 0, posé UNE fois par le routeur (comportement
Next par défaut) ». La première moitié est le but ; la seconde est
inexacte — le défaut de Next N'EST PAS « poser zéro », c'est « garder
la position quand le haut du contenu est encore visible ». Retirer la
mécanique sans rien mettre à la place laisserait donc le bug INTACT,
et c'est le seul point où la passe s'écarte de la lettre de la
consigne pour en servir l'intention.

**Ce qu'on met à la place, et c'est du standard, pas de la mécanique :**
une seule déclaration CSS, `scroll-padding-top`, que Next LIT lui-même
(`getScrollPaddingTopInPixels`) pour ce test précis. Portée à la
hauteur de la réserve, elle rend le test faux dans la fenêtre du
défaut — et le routeur pose zéro LUI-MÊME, une fois, par son propre
chemin. Zéro ligne de JavaScript, zéro garde, zéro mémoire.

---

## 1. CE QUI EST RETIRÉ

### 1.1 La mémoire de position par adresse (nº 181 → nº 887)

| pièce | fichier | passe | rôle |
|---|---|---|---|
| `PREFIXE_DEFILEMENT`, `PlaceGardee` | `lib/navigation-session` | 181 | la clé `yokofolio:defilement:<adresse>` et sa forme `{y,p,date}` |
| `memoriserDefilement` / `lireLaPlace` / `lireDefilement` | idem | 181, 860, 887 | écrire et relire la position d'une adresse |
| `oublierDefilementDe` | idem | 330 | effacer la place d'une liste qui va être neuve |
| `purgerDefilementsAnciens` | idem | 181 | ménage des places de plus de 30 min |
| `AGE_POSITION_MS` | idem | 181 | une place ne vit qu'une demi-heure |
| `arriveeQuiRestitue` | idem | 185 | « ce document neuf naît d'un retour » |
| `PREFIXE_COLONNE`, `memoriserColonne`, `lireColonne` | idem | 873 | la même chose pour la colonne défilante du web |
| l'écriture différée + le silence de 700 ms | `components/MemoireNavigation` | 887 | attribuer l'élan à la page où le geste a commencé |
| `poserLaPosition`, `rendreLaPlace`, `attendreLeContenu`, `surveillerLaReserve`, `annulerLaRestitutionEnCours`, `libererSiPageQuittee`, `positionDejaPosee`, `reprendreLaReserveDuScript` | `lib/restitution-position` | 337, 424, 813 | poser une place mémorisée en attendant que le contenu soit là, sous masque, avec réserve de hauteur |
| `contenuAtteint`, `boucleDAttentePourLeScript`, `MARQUE_ATTENTE` | `lib/pose-sur-contenu` | 337 | la même attente, fabriquée aussi en texte pour le script |
| le bloc 4 du script d'avant peinture | `lib/script-avant-peinture` | 337, 875 | reposer la place AVANT la première peinture, réserve comprise |

### 1.2 Les demandes explicites de restitution (nº 431 → nº 873)

| pièce | fichier | passe | rôle |
|---|---|---|---|
| `CLE_RESTAURER`, `demanderRestaurationPosition`, `oublierRestaurationPosition`, `restaurationDemandeePour`, `consommerRestaurationPosition` | `lib/navigation-session` | 431 | « à la prochaine arrivée sur CETTE adresse, rends la place » |
| les trois appels des onglets d'un profil | `components/ContenuFiche` | 873 | Profile / Portfolio / Flash rouvraient à leur place |
| les deux appels du va-et-vient Tattoo/Flash | `components/VaEtVientNature` | 860 | l'accueil Tattoo et l'accueil Flash gardaient chacun la sienne |
| `declarerArriveeEnHaut`, `arriveeEnHautVoulue`, `consommerArriveeEnHaut` | `lib/navigation-session` | 429, 446 | la déclaration inverse : « cette arrivée-ci se fait en haut » |

### 1.3 Les gardes (nº 427 → nº 888)

| pièce | fichier | passe | rôle |
|---|---|---|---|
| `armerLaGardeDePosition`, `desarmerLaGardeDePosition`, `positionGardee`, `veillerParImage`, `surDefilementSousGarde` | `lib/defilement-programme` | 427, 626, 661 | tenir une pose contre les recalages d'ancrage tant qu'aucun geste ne reprend la main |
| `TOLERANCE_DE_GARDE_PX`, `VEILLE_PAR_IMAGE_MS`, `RECALAGES_ANNULES_MAX` | idem | 427, 661 | ses trois bornes |
| `DUREE_DE_LA_GARDE_MS` (1000 → 3000) | `lib/arrivee-en-haut` | 883, 888 | le plafond de la garde d'arrivée |
| `tenirLeHautDeLaPage` | idem | 882, 883 | reposer zéro à rAF×2, `load`, `fonts.ready` |
| `poserLeHaut` | idem | 882, 888 | la pose de zéro dans ses deux écritures, défilement doux éteint |
| `neutraliserLeDefilementAvantDeQuitter` | idem | 885, 888 | remettre l'origine à zéro AVANT que l'adresse change |
| `ECART_DE_RECALAGE_PX` | idem | 881, 887 | le plafond d'écart de la garde |
| `PLANCHER_DE_POSITION_PX` (24 → 40 → 100) | `lib/navigation-session` | 875, 885, 887 | « sous ce seuil, ce n'est pas une place » |
| les écouteurs `visualViewport` | `lib/arrivee-en-haut` | 882 | déjà retirés à la nº 883 — plus rien à faire |
| la remontée en attente (`remonteeEnAttente`, `cibleEnAttente`, `leSqueletteDeLaListeEstLa`, `laListeServieEstArrivee`) | `lib/liste-neuve` | 334, 722 | remonter une liste neuve à SON arrivée, pas sur la page qu'on quitte |
| `DefilementEnHaut` en entier | `components/DefilementEnHaut` | 328 → 888 | le composant d'arrivée : remontée, garde, attente d'adresse commise |

### 1.4 Le journal du diagnostic, allégé (nº 884 → nº 888)

`components/BandeauDiagnostic` garde son bandeau, ses mesures d'écran
et son bouton « Copier ». Partent avec leur objet : la ligne
« garde/position gardée », les lignes `RECALAGE ANNULÉ`, `POSE ZÉRO`,
`DÉPART À ZÉRO`, et le journal des écritures de mémoire.

---

## 2. CE QUI RESTE, ET POURQUOI

| mécanisme | fichier | passe | dépend-il d'une pièce retirée ? |
|---|---|---|---|
| **`history.scrollRestoration = "auto"`** | `lib/script-avant-peinture` | 363 | NON — et c'est LUI qui tient l'écran noir du glissement retour (§4 de la consigne). Il ne bouge pas d'un octet. C'est aussi lui qui rend, seul, les retours du navigateur. |
| **La mémoire des galeries** (position dans une bande, photo d'un carrousel) | `lib/memoire-galeries` | 863 §5, 866 | NON — module sans le moindre import. Il ne touche jamais au défilement de la PAGE, seulement au `scrollLeft` d'une bande. Il survit tel quel. |
| **Le retour reconstruit d'une fiche** | `lib/bas-de-la-pile`, `components/RetourFenetreFiche` | 332 | NON — son rôle est de FABRIQUER une entrée d'historique quand il n'y en a pas, pas de défiler. La position qu'il rendait venait de la mémoire retirée : le retour reconstruit ramène désormais à la page, le navigateur y remet la position s'il l'a. |
| **Le filet de retour** (`data-sans-cran`, le cran) | `components/RetourGaranti`, `lib/bas-de-la-pile` | 350, 428, 868 | NON — il n'importe que `bas-de-la-pile` et deux clés de session étrangères au défilement (`CLE_RATTRAPAGE_FILET`, `laRepriseVientDuSite`). Vérifié import par import. |
| **« Changer d'onglet REMPLACE l'entrée »** | `components/OngletsLigne` et les deux autres va-et-vient | 875 §1 | NON — c'est un `<Link replace>`, une propriété de lien. Un seul retour ramène au fil, exactement comme avant. |
| **`defilerSansGeste` / `annoncerMouvementDuSite` / `estDefilementProgramme`** | `lib/defilement-programme` | 154 §6A, 426 | Ils ne sont PAS la garde : ils disent à la barre fixe « ce mouvement vient du site, ne le lis pas comme un geste ». Sans eux la rangée de recherche se replierait toute seule. Ils restent. |
| **`defilerEnDouceur`** | idem | 500 | l'animation douce d'un défilement voulu (le haut de page). Rien à voir avec une arrivée. |
| **Le gel du corps** (fenêtres et feuilles) | `lib/gel-du-corps` | 226 §5, 259 §3 | OUI, indirectement : il rendait sa position par `poserLaPosition`. Il appelle désormais `defilerSansGeste` — la page est déjà là, l'attente de contenu n'avait rien à attendre. Comportement identique. |
| **La liste neuve posée sur place** (`ouvrirLaListeEnHaut`, branche « ici même ») | `lib/liste-neuve` | 330 §1 | NON — un filtre écrit son adresse par `replaceState` : le routeur ne fait AUCUN défilement dans ce cas, il n'y a rien à qui déléguer. Le geste reste. |
| **L'état de la rangée au remontage** (`memoriserEtatDeRangee`) | `lib/reserve-barre` | 430 | NON — variable de module, lue à la naissance de la barre. En revanche `rendreLEtatDeRangee` et `rangeeNaitRepliee` partent : ils ne servaient qu'à la restitution. |
| **La réserve de la barre** (`RESERVE_RANGEE`, `RESERVE_LOGO`, mesure avant peinture) | `lib/reserve-barre`, `components/EnTeteTatouage` | 886 | NON — c'est une hauteur de mise en page, pas un mécanisme de défilement. Elle reste, et c'est elle qui donne sa valeur au `scroll-padding-top`. |

### Code déjà mort, emporté au passage

`lirePagePrecedente`, `lirePageCourante`, `consommerTraversee`,
`estHydrate` : aucun appelant dans `src/`, vérifié. Ils accompagnaient
la mémoire de position.

---

## 3. CE QUE LE VISITEUR PERD, ET QUE LE PROPRIÉTAIRE A ACCEPTÉ

1. Les onglets **Profile / Portfolio / Flash** d'un profil rouvrent EN
   HAUT (perte de la nº 873 §1-§2, assumée).
2. Le va-et-vient **Tattoo / Flash** de l'accueil rouvre EN HAUT (perte
   de la nº 860 §2, assumée).
3. Un **rechargement** (F5) ne repose plus la place par le script : le
   navigateur la repose lui-même, `scrollRestoration` étant à `auto`.
   **Et c'est la perte la plus concrète de la passe, chiffrée au banc
   875 : une liste quittée à 600 px rouvre à 10.** Ce n'est pas un
   défaut du moteur — c'est ce que « auto » peut faire. Il repose la
   position à l'instant où il recrée le document, quand les cartes ne
   sont pas encore arrivées : le document est court, et il rabote la
   demande à ce qu'il peut. C'est exactement le travail que faisait
   `lib/pose-sur-contenu` (nº 337) en attendant le contenu sous un
   masque — et qui part avec la mémoire.
   ⚠️ LE BOUTON RETOUR, LUI, NE PERD RIEN : mesuré au banc 889 §2, une
   liste quittée à 420 px revient à 420. Le document n'a pas été
   recréé, le moteur a tout ce qu'il lui faut.
4. Le **retour reconstruit** d'une fiche ouverte sans historique ramène
   à la page, mais sans position : il n'y a plus de place mémorisée à
   lui rendre.

Les retours ORDINAIRES du navigateur (bouton, glissement) ne perdent
rien : ils n'ont jamais eu besoin de nous.
