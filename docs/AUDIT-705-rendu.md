# AUDIT nº 705 — POURQUOI LE NAVIGATEUR MET 2,6-4 s À DESSINER

**Passe d'étude. Rien n'a été modifié : ce rapport est le livrable.**
Toutes les mesures viennent du banc de cette passe (Chromium, gabarit
téléphone, processeur ralenti ×4, doublure locale) ou de la lecture du
code, fichier et ligne cités. Les chiffres de production sont ceux de
ta sonde (nº 679).

---

## 1 · LE CONSTAT CENTRAL, EN UNE PHRASE

Le temps ne part ni dans la base (78 ms), ni dans la taille des pages
(184 à 387 nœuds : c'est PETIT) : il part dans **l'exécution du
programme commun sur chaque page** (~0,6 à 1 s de tâches longues à
chaque arrivée), et le « clic qui n'a pas marché » vient de ce que
**pendant une navigation, RIEN n'est affiché ni animé** — le site
attend la réponse complète du serveur avant de changer le moindre
pixel, et le seul trait de chargement du site est réservé à UNE page.

## 2 · CE QUE CHAQUE PAGE FAIT FAIRE AU NAVIGATEUR (mesuré, CPU ×4)

| Page | Nœuds DOM | Images | domInteractive | Tâches > 50 ms (somme · max) |
|---|---:|---:|---:|---|
| Accueil | 214 | 5 | 807 ms | 725 ms · 278 ms |
| Recherche (style) | 387 | 29 | 489 ms | 977 ms · 297 ms |
| Ma sélection (connecté) | 184 | 1 | 703 ms | 782 ms · 273 ms |
| Fiche | 254 | 6 | 684 ms | 743 ms · 246 ms |
| Mentions légales | 224 | 1 | 333 ms | 591 ms · 276 ms |

Deux lectures :

- **Le DOM n'est pas le problème.** 200-400 nœuds, c'est une page
  légère — aucune liste géante, aucune virtualisation à envisager.
  (Limite du banc : la doublure n'a que 14 fiches par style ; la
  page 3 « 72 cartes » de production n'est pas reproductible ici.)
- **Le coût est le même partout, contenu ou pas** : ~600 ms de tâches
  longues sur les mentions légales (224 nœuds, 1 image) comme sur
  l'accueil. C'est l'exécution + l'hydratation du TRONC COMMUN
  (354 Ko gz, nº 702), pas le dessin du contenu. Tes 4 164 ms de
  « rendu » sur l'accueil (chargement complet, appareil réel) =
  téléchargement du tronc + son exécution + les 4 images du premier
  écran ; nos 2 pistes de poids (L3 faite, L4 morte) ont réduit ce
  qu'on pouvait sans réécrire.

## 3 · LE « CLIC QUI N'A PAS MARCHÉ », DÉCOMPOSÉ

Mesuré au banc (accueil → carte de style, navigation douce) : entre le
clic et le PREMIER changement visible, il s'écoule **381-478 ms pendant
lesquels RIEN ne bouge à l'écran** — puis l'adresse ET la mosaïque
changent le même instant, d'un bloc. À l'atelier le serveur répond en
~10 ms ; en production, `listerTatoueurs` répond en ~1 s : ton blanc
est donc de l'ordre de la seconde et plus. Trois causes, toutes lues
dans le code :

| # | Cause | Où c'est écrit |
|---|---|---|
| 1 | **Aucun `loading.tsx` dans tout le site** : une navigation vers une page dynamique attend la réponse ENTIÈRE avant de commuter l'écran | `src/app` — zéro fichier `loading.tsx` ; `/recherche` est `force-dynamic` + conservation zéro (`recherche/page.tsx`) |
| 2 | **Le trait de chargement n'existe que pour « Ma sélection »** : `DESTINATIONS_A_TRAIT = {"/mes-favoris"}` — tout autre clic est muet | `SigneDeChargement.tsx` (nº 469/142) |
| 3 | La nouvelle page arrive d'un bloc (données → commit React complet), il n'y a pas d'étape intermédiaire | choix nº 191 : « toutes les pages d'un coup », la hauteur définitive dès la première peinture — c'est ce qui porte le retour/position |

**Important pour la suite** : la cause 3 est un PILIER du retour et de
la position (nº 191/653/661). Un squelette qui change la hauteur de la
page au premier rendu peut casser la restitution — ce risque est réel
et devra être éprouvé au banc nº 702 complet avant toute livraison.

## 4 · LES REQUÊTES EN TROP (piste 4 — confirmées et expliquées)

### 4a · Le doublon `/api/tatoueur/notifications` — confirmé, et il y a pire

Mesuré, compte professionnel connecté, AUCUN geste :

| Moment | Requêtes | D'où elles partent (prouvé par pile d'appel) |
|---|---|---|
| Chargement d'une page | **2** (à 16 ms d'écart) | ① le semis du compteur (nº 664, `semerLesNouvelles` au montage de la barre) ; ② le **rattrapage du portfolio disparu** (nº 700-§3, `MenuEspace.tsx:997`) qui appelle `lireLeCompte`, lequel finit par relire les nouvelles (nº 693, ligne 863) — et CETTE lecture-là n'a pas de garde (c'est voulu pour l'ouverture du menu, pas pour un montage) |
| **Chaque navigation douce** | **+1** (et une lecture des fiches du compte en base avec !) | le verrou du rattrapage est un `useRef` (`dejaLu`), remis à zéro à CHAQUE remontage de la barre — or chaque navigation douce démonte/remonte la barre |

Ton relevé « 2 × » est donc le chargement ; en naviguant, ça continue
de compter. Le rattrapage nº 700 ne se déclenche que si la session
porte une photo/un nom de portfolio — un particulier n'a qu'UNE
requête ; toi (pro) tu as tout le train.

**Correction (une passe courte)** : porter le verrou `dejaLu` au
MODULE (comme `compteLu` du magasin) au lieu du composant, et ne plus
relire les nouvelles quand `lireLeCompte` est appelé par le rattrapage
(le semis les a déjà lues 16 ms avant). Deux lignes, aucun écran
touché.

### 4b · Les `api/dev` en production — confirmé

| Route | Serveur | Client |
|---|---|---|
| `/api/dev/journal-de-bord` | gardée (404 en production sauf `JOURNAL_DE_BORD=1`) | **PAS gardée** : `noterAuJournal` (`journal-de-bord.ts`) envoie un `sendBeacon` à CHAQUE navigation et bascule de session, en production aussi — mesuré : 3 envois en une visite de trois pages, tous vers un 404 |
| `/api/dev/journal-sonde` | gardée (404 en production) | appelée seulement par le bouton de la sonde (`?sonde=1`) : rien ne part tout seul — RAS |

**Correction (une ligne)** : dans `noterAuJournal`, ne rien envoyer
hors atelier (même condition que la route : production sans le
drapeau). Le journal reste entier en développement.

### 4c · Vu au passage, et ce n'est PAS un défaut

`/api/tatoueur/<slug>` part parfois sans geste apparent : c'est le
PRÉCHARGEMENT des fiches à l'approche d'une carte (`GrilleTatoueurs`,
`surApproche` → `ficheComplete`), web seulement. Voulu, sain.

### 4d · Un trouvé d'audit : les morceaux jumeaux

Le compilateur produit DEUX exemplaires du même paquet de modules
(mêmes 77 100 octets, contenus quasi identiques) : `moteur + champ de
lieu + page de recherche mobile + magasin des notifications + …`.
L'accueil et la recherche référencent l'exemplaire A ; « Ma
sélection » et les mentions légales l'exemplaire B. Conséquences :

- naviguer d'une famille à l'autre RE-télécharge 24 Ko gz déjà eus ;
- le magasin des notifications y est en DEUX copies : la seconde
  arrive gardes vides, et relit (ça s'ajoute au 4a) ;
- toute garde « une fois par document » écrite dans un module de ce
  paquet est silencieusement doublée.

C'est un comportement du compilateur (Turbopack), pas une ligne de
notre code ; le levier est incertain (essai de configuration en passe
dédiée), mais il fallait qu'il soit écrit quelque part.

## 5 · TABLEAU RÉCAPITULATIF PAR PAGE

| Page | Ce qui bloque l'affichage | Gravité | Correction en une ligne |
|---|---|---|---|
| Accueil → Recherche (clic style) | pas de trait, pas de squelette : blanc ~1 s en production | **forte** (le geste principal) | trait de chargement global ; puis `loading.tsx` si le banc position l'autorise |
| `/recherche`, `/tatouage/[style]/[ville]` | `force-dynamic`, réponse entière attendue, muette | **forte** | idem |
| `/mes-favoris` | serveur : session + favoris attendus avant le 1ᵉʳ octet ; seul le trait existe déjà | moyenne | `loading.tsx` (même prudence position) |
| Fiche `/tatoueur/[slug]` | prérendue (●) : arrive vite ; RAS | faible | — |
| Toutes | ~0,6-1 s d'exécution du tronc à chaque ARRIVÉE (pas aux navigations douces) | moyenne | plus rien à gagner sans réécriture (L2/L4 morts, L3 fait) |
| Toutes (connecté pro) | 2 lectures notifications + fiches du compte relues à CHAQUE navigation | moyenne | verrou de module (4a) |
| Toutes (production) | journal envoyé vers une route 404 | faible | garde client (4b) |
| Images | RAS : 4 `eager`+`high` premier écran, le reste `lazy`, `decoding=async` | — | — |

## 6 · LE TOP 5 PAR EFFET RESSENTI (menu des passes suivantes)

Deux familles, comme convenu : **[I] affichage immédiat** (le ressenti),
**[L] rendu plus léger** (moins de travail).

| # | Famille | Quoi | Effet attendu | Risque |
|---|---|---|---|---|
| 1 | [I] | **Le trait de chargement sur TOUTES les navigations douces** (étendre `DESTINATIONS_A_TRAIT`, mécanisme nº 469 déjà en place et éprouvé) | le clic répond TOUJOURS dans les 200 ms — c'est la réponse directe à « on dirait que ça n'a pas marché » | quasi nul : rien ne bouge dans la page, ni position ni retour |
| 2 | [I] | **`loading.tsx` (squelette : barre + cadre vide) sur `/recherche`** puis, s'il tient, `[style]/[ville]` et `/mes-favoris` | l'écran change DÈS le clic, plus de blanc d'une seconde | **réel** : la position/retour repose sur « hauteur définitive à la première peinture » (nº 191) — une page à la fois, banc nº 702 complet à chaque fois |
| 3 | [L] | **Le train de lectures du menu** (4a) : verrou de module + rattrapage sans relecture des nouvelles | −2 requêtes par navigation douce connectée (dont une lecture de base), doublon de ta sonde éteint | faible : deux lignes, le banc nº 703 rejoue l'état connecté |
| 4 | [L] | **Le journal muet en production** (4b) | −1 requête par navigation, plus de 404 en série dans les journaux | quasi nul |
| 5 | [L] | **Les morceaux jumeaux** (4d) : passe d'essai de configuration | −24 Ko re-téléchargés en navigation croisée, gardes de modules redevenues uniques | incertain : c'est le compilateur — essai borné, on garde si ça marche |

Ce qui n'est PAS dans le top, et pourquoi : virtualiser les listes
(le DOM est petit — sans objet) ; alléger encore le tronc (L2/L4
instruits et morts, L3 fait — il reste react-dom et le noyau, qu'on ne
réécrit pas) ; toucher aux images (calibrées, confirmé).

---

*Banc de cette passe : `rendu-705.mjs` (nœuds, tâches longues, clic
figé, requêtes), `notifs-705.mjs` (chronologie des lectures),
`pile-705.mjs` (piles d'appel), `marque-705.mjs` (survie du document,
double montage) — scratchpad de l'atelier, reproductibles avec la
doublure `TRI=1 SLUGS_UNIQUES=1`.*
