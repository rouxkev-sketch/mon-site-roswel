# Inventaire des différences entre la version web et la version smartphone

_Passe nº 192. Aucun code n'a été modifié pour écrire ce document : il ne
fait que constater ce qui existe aujourd'hui._

## Comment lire ce document

**Ce qui décide de la version.** Avant même que la page ne s'affiche, le site
pose une étiquette sur le document : `mobile` ou `web`. Elle ne dépend **pas de
la largeur de l'écran** mais du **pointeur** : un doigt (« pointeur grossier »)
donne `mobile`, une souris donne `web`. Une fenêtre de navigateur rétrécie sur
un ordinateur reste donc en version web ; un iPad reste en version mobile même
en plein écran. C'est écrit dans `src/lib/script-avant-peinture.ts`, et tout le
reste du site s'y réfère.

**Deux mots de vocabulaire**, employés partout ci-dessous :

- **étape d'historique** : ce que le bouton « précédent » du navigateur défait.
  Chaque page visitée en pose une.
- **fenêtre superposée** : une fiche qui s'ouvre PAR-DESSUS la mosaïque, sans
  quitter la page — c'est le comportement du web.

**Voulu ou accident ?** Chaque ligne le dit :

- **VOULU** — l'écran est petit, le doigt remplace la souris : la différence est
  une décision.
- **ACCIDENT** — deux chemins qui ont dérivé sans qu'on l'ait choisi.

---

# I. LES ACCIDENTS

Ce sont les divergences qu'aucune décision n'explique : deux façons de faire la
même chose, arrivées par sédimentation.

## A1. Ouvrir une fiche : deux mécaniques entièrement différentes

**À l'écran.** Sur l'ordinateur, toucher une carte fait apparaître la fiche
par-dessus la mosaïque, qui reste là, derrière. Sur le téléphone, la mosaïque
disparaît et la fiche prend toute la page ; pour revenir, il faut faire
« précédent ».

**Fichiers.** `src/components/CarteTatoueur.tsx` (le clic), `src/components/GrilleTatoueurs.tsx`
(la fenêtre superposée du web), `src/app/(tatouage)/tatoueur/[slug]/page.tsx`
(la vraie page de fiche).

**ACCIDENT.** Le principe de départ était bon (l'ordinateur a la place pour
montrer les deux, le téléphone non), mais il a produit **deux chemins de code
qui ne se ressemblent plus du tout** : la fenêtre superposée écrit elle-même
l'adresse dans la barre du navigateur et gère son propre retour, tandis que la
version mobile passe par une vraie page.

**Risque.** Tout ce qui touche à la navigation doit être écrit, corrigé et
vérifié **deux fois**. Une correction faite d'un côté ne protège pas l'autre —
c'est exactement ce qui s'est produit pendant les passes 181 à 191 : ce qui
marchait sur ordinateur ne marchait pas sur téléphone, et le contraire.

## A2. Revenir d'une fiche : trois mécanismes de secours, deux réservés à une seule version

**À l'écran.** Quand on arrive directement sur une fiche (par un lien partagé,
par exemple), il n'y a rien derrière : le bouton « précédent » ferait quitter le
site. Le code fabrique donc un retour artificiel — mais pas de la même façon
selon la version.

**Fichiers.**

- `src/components/RetourGaranti.tsx` — **téléphone uniquement** (`si mobile`) :
  pose une étape d'historique invisible et, au retour, **remplace** la page par
  la dernière liste visitée.
- `src/components/RetourFenetreFiche.tsx` — **ordinateur uniquement**
  (`si mobile, on ne fait rien`) : remplace la page de fiche par la mosaïque,
  avec un paramètre `?fenetre=…` qui rouvre la fenêtre superposée.
- `src/components/GrilleTatoueurs.tsx` — rouvre cette fenêtre au chargement.

**ACCIDENT.** Trois pièces pour un seul besoin (« que se passe-t-il quand on
revient ? »), chacune ne connaissant qu'une moitié du site.

**Risque.** Ce sont ces pièces qui décident où l'on atterrit après un retour.
Quand elles se contredisent, on tombe sur la mauvaise page — et le défaut ne se
voit que sur une version.

## A3. « Ma sélection » recopie la mécanique de la mosaïque, en double

**À l'écran.** Dans « Ma sélection », toucher une photo ouvre la fiche —
en fenêtre superposée sur ordinateur, en page entière sur téléphone. Exactement
comme dans la mosaïque.

**Fichier.** `src/components/PageFavoris.tsx` (lignes 95-120 : la même
mécanique que `GrilleTatoueurs`, réécrite).

**ACCIDENT.** Le commentaire du fichier le dit lui-même : « la même mécanique
que la mosaïque, à la lettre ». C'est une **copie**, pas un composant partagé.

**Risque.** Toute correction de la fenêtre de fiche doit être reportée à la
main dans ce second fichier. Si on l'oublie, « Ma sélection » se met à se
comporter comme le site d'il y a trois passes.

## A4. La position de défilement de la page de recherche est rangée à part

**À l'écran.** Sur téléphone, quand on ferme la page de recherche sans valider,
la liste doit se retrouver là où on l'avait laissée.

**Fichiers.** `src/lib/recherche-mobile.ts` (`memoriserDefilementResultats`)
d'un côté, `src/lib/navigation-session.ts` (la mémoire de position de tout le
site) de l'autre.

**ACCIDENT.** Deux mémoires de position coexistent, avec deux règles
différentes : celle du site est rangée par adresse et vieillit ; celle de la
page de recherche est une valeur unique, sans adresse, qui ne vieillit pas.

**Risque.** Deux mémoires qui décrivent la même chose finissent toujours par se
contredire — c'est la famille de défauts que la refonte nº 191 vient de
supprimer partout ailleurs.

## A5. Le survol précharge la fiche… mais seulement sur ordinateur

**À l'écran.** Sur ordinateur, passer la souris sur une carte charge la fiche à
l'avance : au clic, elle est déjà là. Sur téléphone, rien n'est préchargé.

**Fichier.** `src/components/GrilleTatoueurs.tsx` (ligne 236, `si mobile, on ne
fait rien`).

**ACCIDENT PARTIEL.** L'absence de survol sur un écran tactile est un fait, pas
un choix. Mais rien n'a été mis en face pour le téléphone (par exemple au
premier contact du doigt).

**Risque.** L'ouverture d'une fiche est plus lente sur téléphone que sur
ordinateur, et c'est là que le réseau est le plus lent.

---

# II. LES DIVERGENCES VOULUES

Elles répondent à une vraie différence d'usage. Elles restent des différences :
elles doivent être vérifiées des deux côtés.

## V1. La page de recherche en plein écran n'existe que sur téléphone

**À l'écran.** Sur téléphone, toucher la loupe ou la pilule de recherche ouvre
une **page entière** qui glisse par le haut, avec les deux onglets
« Explorer / Filtres » et le bouton « Valider ». Sur ordinateur, la recherche
se fait directement dans la barre, sans jamais quitter la mosaïque.

**Fichiers.** `src/components/PageRechercheMobile.tsx` (n'existe que là),
`src/components/MoteurTatouage.tsx` (qui l'ouvre).

**VOULU.** C'est une décision de fond, expliquée en tête du fichier : une
fenêtre flottante ne tient pas quand le clavier d'iOS arrive. C'est aussi ce que
font Airbnb, Booking et Apple.

## V2. Sur ordinateur, la recherche part à chaque geste ; sur téléphone, seulement à « Valider »

**À l'écran.** Sur ordinateur, choisir un style change les résultats
immédiatement. Sur téléphone, on choisit un style, une ville, des filtres — rien
ne bouge — puis « Valider » lance la recherche d'un coup.

**Fichier.** `src/components/MoteurTatouage.tsx` (`annoncer` d'un côté,
`validerLaPage` de l'autre ; les choix en attente sont appelés « brouillon »).

**VOULU.** Sur un petit écran, relancer la recherche à chaque doigt posé ferait
sauter la page en permanence.

## V3. La rangée de recherche se replie quand on descend — téléphone seulement

**À l'écran.** Sur téléphone, en descendant dans les cartes, la ligne de
recherche disparaît vers le haut et la loupe apparaît dans la barre ; elle
revient au premier geste vers le haut. Sur ordinateur, la barre ne bouge jamais.

**Fichier.** `src/components/EnTeteTatouage.tsx`.

**VOULU.** Gagner de la hauteur d'écran là où elle manque.

## V4. Le zoom à deux doigts sur les photos — téléphone seulement

**À l'écran.** Écarter deux doigts sur une carte agrandit la photo sur place.

**Fichier.** `src/components/ZoomPincement.tsx` (`si l'appareil n'est pas
mobile, on ne fait rien`).

**VOULU.** Il n'y a pas de pincement à la souris.

## V5. Le bouton de partage d'une fiche ouvre le partage du téléphone

**À l'écran.** Sur téléphone, « Partager » ouvre le panneau natif d'iOS
(Messages, WhatsApp…). Sur ordinateur, il copie le lien.

**Fichier.** `src/components/BoutonPartageFiche.tsx` (test du pointeur tactile,
avec un cas particulier pour l'iPad qui se fait passer pour un Mac).

**VOULU.**

## V6. Les menus s'ouvrent en fenêtre centrée sur téléphone, en liste déroulante sur ordinateur

**À l'écran.** Le menu du compte (« Mon espace ») et le sélecteur de langue
s'affichent en panneau superposé sur téléphone, accroché sous le bouton sur
ordinateur.

**Fichiers.** `src/components/MenuEspace.tsx` (ligne 254),
`src/components/SelecteurLangue.tsx` (ligne 66).

**VOULU.**

## V7. Les deux boutons d'affichage de la mosaïque n'existent que sur téléphone

**À l'écran.** Sur téléphone, deux boutons ronds basculent entre une et deux
colonnes, et affichent ou masquent le texte des cartes. Sur ordinateur, la
mosaïque a toujours sa disposition en grille.

**Fichiers.** `src/lib/disposition-grille.ts`, `src/lib/vue-phototheque.ts`,
`src/components/MoteurTatouage.tsx`.

**VOULU.**

## V8. Une variante de style « mobile » existe dans toute la feuille de style

**À l'écran.** Des dizaines de détails d'apparence (tailles, marges, colonnes)
changent selon la version.

**Fichier.** `src/app/globals.css` ligne 34 : `@custom-variant mobile`, qui
s'accroche à l'étiquette posée avant la peinture.

**VOULU.** C'est le mécanisme d'apparence normal du site. À ne pas confondre
avec les variantes `lg:` de Tailwind, qui, elles, dépendent de la **largeur**
de la fenêtre : les deux coexistent, et c'est une source de confusion (voir
le point A6 ci-dessous).

## A6. Deux règles de bascule coexistent : le pointeur ET la largeur

**À l'écran.** La rangée de recherche se replie en dessous de 1024 pixels de
large (règle de LARGEUR), mais la page de recherche plein écran, elle, s'ouvre
selon le POINTEUR. Sur un ordinateur avec une fenêtre étroite, on peut donc
avoir la mise en page du téléphone et le comportement du web.

**Fichier.** `src/components/EnTeteTatouage.tsx` (l'état « étroit », lu à
1023,98 px), face à l'étiquette `data-appareil`.

**ACCIDENT.** Deux définitions de « petit écran » cohabitent. Le commentaire du
fichier signale déjà qu'une régression est née de là (passe 154).

**Risque.** Un défaut visible seulement dans une fenêtre étroite d'ordinateur,
c'est-à-dire dans la configuration où l'on teste le plus souvent « le mobile »
sans être sur un mobile.

---

# III. LES ÉTAPES D'HISTORIQUE — QUI EN POSE, QUI EN RETIRE

C'est le tableau le plus important pour comprendre les retours en arrière.

| Geste | Sur ordinateur | Sur téléphone | Fichier |
|---|---|---|---|
| Ouvrir la recherche | rien (pas de page de recherche) | **+1 étape**, sans changer l'adresse | `PageRechercheMobile.tsx` |
| Fermer la recherche (croix, retour) | — | **−1 étape** (le site la retire lui-même) | `PageRechercheMobile.tsx` |
| Valider une recherche | +1 étape (nouvelle adresse) | **−1 puis +1** : la page se retire, la recherche s'ajoute | `IndexTatoueurs.tsx` |
| Ouvrir une fiche | **+1 étape**, posée à la main par la fenêtre superposée | +1 étape (vraie page) | `GrilleTatoueurs.tsx` / `CarteTatoueur.tsx` |
| Fermer la fenêtre de fiche | **−1 étape** (le site fait « précédent » lui-même) | sans objet | `GrilleTatoueurs.tsx` |
| « Voir plus » | aucune étape (l'adresse est remplacée) | aucune étape | `IndexTatoueurs.tsx` |
| Arriver sur une fiche sans historique | rien | **+1 étape inventée**, puis remplacement de page au retour | `RetourGaranti.tsx` |
| Revenir d'une fiche ouverte seule | remplacement de page vers la mosaïque | (voir ci-dessus) | `RetourFenetreFiche.tsx` |

**ACCIDENT.** Sept endroits différents écrivent dans l'historique, et cinq ne
concernent qu'une seule des deux versions.

**Risque.** C'est la source directe de « le retour me sort du site » : il suffit
qu'une étape soit posée deux fois, ou retirée une fois de trop, pour que le
compte soit faux — et le compte n'est pas le même sur les deux versions.

---

# IV. LES MÉMOIRES — CE QUE LE SITE RETIENT, ET OÙ

Depuis la refonte nº 191, la règle est que **l'adresse décide de tout**. Voici
ce qui reste rangé ailleurs, et si les deux versions le traitent pareil.

| Ce qui est retenu | Où | Web | Téléphone |
|---|---|---|---|
| Position de défilement des listes | `navigation-session.ts` (mémoire durable du navigateur), une clé par recherche | identique | identique |
| Position au retour d'une fiche | idem | la fenêtre superposée fige et rend la position elle-même (`GrilleTatoueurs.tsx`) | la mémoire du site s'en charge |
| Position de la liste sous la page de recherche | `recherche-mobile.ts` | sans objet | **mémoire séparée** (voir A4) |
| Nombre de cartes chargées | **dans l'adresse** (`&page=3`) | identique | identique |
| Critères de recherche | **dans l'adresse** | identique | identique |
| Choix en cours non validés (« brouillon ») | `recherche-mobile.ts` | sans objet | téléphone seulement (voulu, voir V2) |
| Une et deux colonnes, texte des cartes | `disposition-grille.ts`, `vue-phototheque.ts` | sans objet | téléphone seulement (voulu) |
| Carte regardée lors d'un changement de disposition | `carte-du-haut.ts` | sans objet | téléphone seulement (voulu) |
| Journal des pages visitées, reprise de session | `navigation-session.ts` | identique | identique |

Les deux premières lignes sont **identiques par la règle mais différentes par le
chemin** : sur ordinateur la grille n'est jamais démontée, sur téléphone elle
l'est à chaque fiche. C'est la conséquence directe de A1.

---

# V. ESSAIS ET INTERRUPTEURS

**Il n'en reste aucun.** La refonte nº 191 a supprimé le fichier
`src/lib/interrupteurs-mesure.ts` et, avec lui :

- `?sans=tactile`, `?sans=reserve`, `?sans=memoire` — qui éteignaient un
  mécanisme à la fois pour mesurer ;
- `?essai=document` — qui faisait ouvrir les fiches par un rechargement complet
  de page sur téléphone.

Vérifié : plus aucun appel dans le code. Il n'en subsiste que la mention dans un
commentaire de `src/components/CarteTatoueur.tsx`, qui explique pourquoi
l'essai a été retiré.

**Les six sondes, elles, sont toujours là**, et ne s'allument que si on le
demande dans l'adresse. Elles n'affichent et n'enregistrent rien sans cela :

| Sonde | Adresse | Ce qu'elle montre |
|---|---|---|
| Bascule | `?sonde-bascule=1` | le journal complet : montages, cartes rendues, historique, positions |
| Retour | `?sonde-retour=1` | les en-têtes, le cache, la restauration de position |
| Navigation | `?sonde-nav=1` | chaque écriture d'historique |
| Clavier | `?sonde-clavier=1` | ce que fait le clavier d'iOS |
| Filtres | `?sonde-filtres=1` | les marges réelles du panneau de filtres |
| Verre | `?sonde-verre=1` | pourquoi la barre est floue ou non |

Elles sont posées dans `src/app/(tatouage)/layout.tsx`.

---

# VI. CE QUI EST STRICTEMENT COMMUN

Pour mémoire, et parce que c'est le résultat de la refonte nº 191 : la
**construction de la mosaïque** ne connaît plus les deux versions. Les critères,
les cartes affichées et leur nombre viennent de l'adresse, le serveur rend la
page filtrée, et le composant `IndexTatoueurs.tsx` se contente d'afficher. Il
n'y a plus, à cet endroit, une seule ligne qui demande « suis-je sur un
téléphone ? ».
