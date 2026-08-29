# nº 720 — Audit du cache navigateur et du service worker

**Une seule question : quand un visiteur revient, retélécharge-t-il, ou réutilise-t-il ?**

**La réponse courte : il réutilise, et très bien.** Sur la page d'accueil,
une première visite coûte **478 Ko** ; la deuxième coûte **4,6 Ko** — soit
**99 % repris**. Aucun fichier du programme (code, feuille de style,
polices) ne redemande quoi que ce soit au serveur.

Il reste **cinq défauts**, tous petits sauf un, et **aucun d'eux n'est dans
le service worker**. Le service worker, lui, est sain : mesuré, il
n'économise rien, mais il ne coûte rien non plus et il ne contredit le
serveur nulle part.

> **Cette passe est un constat. Aucun fichier d'application n'a été
> modifié.** Deux outils de mesure ont été ajoutés dans `outils/`, et le
> millésime a été incrémenté comme à chaque passe.

---

## 1 · Ce qui a été mesuré, et avec quoi

Deux instruments, parce qu'un seul mentait.

| Instrument | Ce qu'il voit | Fichier |
| --- | --- | --- |
| Le banc | Ce que la PAGE croit avoir reçu | `outils/banc-cache-720.mjs` |
| Le relais | Ce qui a VRAIMENT touché le serveur | `outils/relais-mesure-720.mjs` |

**Trois pièges de mesure ont été payés comptant avant d'écrire une seule
ligne de conclusion.** Ils sont notés ici parce qu'ils rendraient fausse
toute mesure future qui les ignorerait.

| Piège | Ce qu'il faisait croire | La preuve |
| --- | --- | --- |
| Navigateur sans dossier de profil | « rien n'est jamais repris » | 0 fichier repris ; avec un profil sur disque, 24 |
| `ctx.route()` (interception de débogage) | idem — elle **court-circuite le cache disque**, pour TOUTES les requêtes, pas seulement celle qu'on visait | avec route : 0 repris ; avec l'option native `serviceWorkers:"block"` : 24 repris, 0 octet |
| `performance` quand un service worker est là | « la page d'accueil est retéléchargée : 100 Ko » | le serveur, lui, a répondu **304** — corps vide. La page rapporte la taille *décompressée* de ce que le service worker lui a rendu, pas le voyage réseau |

C'est ce troisième piège qui a rendu le relais nécessaire : sans lui,
j'aurais écrit noir sur blanc que le service worker casse la revalidation
du HTML. **C'est faux, et le journal du serveur le dit.**

Le tout tourne contre le serveur de production local (`npm run start`).
En ligne, l'hébergeur ajoute son propre cache devant : **les consignes
transmises sont les mêmes, les temps non.**

---

## 2 · Le compte, en gros

Nombre de requêtes qui ont touché le serveur, et octets rendus.

| Page | 1ʳᵉ visite | 2ᵉ visite **avec** service worker | 2ᵉ visite **sans** service worker |
| --- | --- | --- | --- |
| Accueil | 43 req · **478 Ko** | 13 req · **4,6 Ko** | 12 req · **4,6 Ko** |
| Recherche | 80 req · **632 Ko** | 39 req · **75,2 Ko** | 38 req · **75,2 Ko** |

**Les deux colonnes de droite sont identiques. C'est le résultat le plus
important de cette passe** : le service worker n'économise **rien**. Le
cache du navigateur fait déjà tout le travail. L'utilité réelle du
service worker est la page « hors ligne », pas la vitesse — et c'est très
bien ainsi, parce que c'est aussi la pièce la plus fragile du site.

---

## 3 · Le tableau par famille

Consigne du serveur · ce que le service worker en fait · verdict.

| Famille | Consigne serveur | Service worker | Verdict |
| --- | --- | --- | --- |
| **Code JS** `/_next/static/chunks/` | `public, max-age=31536000, immutable` + ETag | cache d'abord (branche 2) | **BON** — 0 requête à la 2ᵉ visite (355 Ko accueil, 468 Ko recherche) |
| **Feuille de style** | `public, max-age=31536000, immutable` | cache d'abord | **BON** — 0 requête (20,8 Ko) |
| **Polices** `/_next/static/media/` | `public, max-age=31536000, immutable` | cache d'abord | **BON** — 0 requête (28,6 Ko) |
| **Images de démo** `/images-demo/` | `public, max-age=31536000, immutable` (posée par la route qui les fabrique) | cache d'abord | **BON** — 0 requête |
| **Page d'accueil** | `private, no-cache, max-age=0, must-revalidate` + ETag | réseau toujours, jamais rangée | **BON** — **304**, corps vide |
| **Service worker** `/sw.js?v=…` | `public, max-age=0` + ETag | — | **BON** — 304 |
| **Images de `public/`** (logo, icône, glyphes) | `public, max-age=0` + ETag | « icône/logo » → réseau toujours ; les autres → cache d'abord | **À REVOIR** — un aller-retour par image, à chaque visite |
| **Images optimiseur** `/_next/image` | `public, max-age=14400, must-revalidate` + ETag (4 h) | cache d'abord | **BON**, avec réserve : revalidées au-delà de 4 h |
| **Photos Supabase servies en direct** (les avatars) | **aucune consigne posée à l'envoi → défaut du service, `max-age=3600` (1 h)** | **jamais interceptées** (autre domaine : le service worker se retire) | **À REVOIR** — le défaut nº 1 |
| **Page `/recherche`** (et `/mes-favoris`) | `private, no-cache, **no-store**, max-age=0, must-revalidate` | réseau toujours | **À REVOIR** — 37 Ko en entier à chaque visite |
| **Préchargements de navigation** (RSC) | `private, no-cache, max-age=0, must-revalidate` | non interceptés | **BON sur le principe**, mais volumineux (38 Ko) |
| **Routes API** `/api/` | **AUCUNE consigne** | jamais interceptées (écrit explicitement dans le programme) | **ABSENTE** |
| **Manifeste** `/manifest.webmanifest` | `public, max-age=0, must-revalidate`, **sans ETag** | non intercepté | **À REVOIR**, marginal — 0,5 Ko en entier à chaque visite |

---

## 4 · Les défauts, du plus coûteux au moins coûteux

### 1. Les avatars Supabase valables une heure au lieu de « pour toujours »

**Poids à la 2ᵉ visite : tous les avatars de la page, dès que l'heure est
passée.** Sur une grille de 12 fiches en 160 px, de l'ordre de **100 à
150 Ko** — c'est le seul poste à trois chiffres du site.

**La cause, nommée :** aucun des sept appels `.upload()` du dépôt ne passe
d'option `cacheControl` (vérifié : `FormulaireFiche.tsx`,
`FenetreIdentite.tsx`, `FormulaireArtisan.tsx`, `televerser-photos.ts` —
tous en `{ upsert: true }` ou `{ upsert: true, contentType: … }`). Le
service applique donc son défaut, une heure. Or **ces fichiers sont
immuables par construction** : leur nom porte l'instant du dépôt
(`avatar-1756000000000.jpg`), un fichier de ce nom ne changera jamais de
contenu. Et ils sont servis en `<img>` direct, sans passer par
l'optimiseur — c'est donc bien la consigne de Supabase qui décide.

**La correction, en une phrase :** passer `cacheControl: "31536000"` à
chaque `.upload()`. **Ne touche pas au service worker.**

> **Ce que je n'ai pas pu mesurer d'ici, et comment le trancher.** L'atelier
> parle à une doublure, pas au vrai Supabase : la valeur « 1 heure » est
> celle que documente le service, pas une mesure. La commande qui
> tranche, sur ton Mac, avec l'adresse d'une photo déjà en ligne :
> `curl -sI "<adresse d'une photo>" | grep -i cache-control`

### 2. La page « recherche » interdite de mémoire

**Poids à la 2ᵉ visite : 37 Ko**, à chaque fois, y compris quand rien n'a
changé.

**La cause :** cette page n'est pas dans la liste `headers()` de
`next.config.ts` (neuf chemins y figurent ; `/recherche` et
`/mes-favoris` n'y sont pas). Elle reçoit donc le défaut de Next pour une
page dynamique, qui contient `no-store` — et `no-store` interdit au
navigateur d'en garder ne serait-ce qu'une copie à revalider. L'accueil,
lui, est dans la liste, en `no-cache` : il obtient un **304** et ne
transfère rien.

**La correction, en une phrase :** ajouter `/recherche` à la liste
existante, avec la consigne de l'accueil. **Ne touche pas au service
worker.**

> **Réserve honnête, à lever par la mesure et non par la lecture :** un 304
> suppose que la réponse porte un ETag stable, ce que Next ne garantit pas
> sur une page rendue en flux. Après le changement, la mesure qui tranche
> est un `curl -sI` sur `/recherche` : s'il n'y a pas d'ETag, le gain est
> nul et il faut remettre la consigne d'avant.

### 3. Les préchargements de navigation, demandés plusieurs fois

**Poids à la 2ᵉ visite : 38 Ko** sur la page de recherche — le deuxième
poste après le HTML.

Le relais montre la **même fiche demandée jusqu'à quatre fois** en une
seule visite (0,4 Ko + 1,0 Ko + 0,3 Ko + 1,7 Ko), et une première fiche à
11,8 Ko.

**Ce n'est pas un défaut de cache** : ces adresses portent la bonne
consigne. C'est le **préchargement** de Next qui les demande. Je le
signale parce que c'est le poste que ton audit vient de mettre au jour,
mais **le corriger est un autre sujet que celui de cette passe** — il
faudrait regarder le réglage `prefetch` des liens, pas les en-têtes.

### 4. Les images de `public/` revalidées à chaque visite

**Poids à la 2ᵉ visite : 0 Ko de corps** — mais **deux allers-retours** sur
l'accueil (`yokofolio-logo-256.avif`, `yokofolio-icone.png`), payés en
latence, pas en octets. Sur un téléphone en 4G, c'est deux fois le temps
d'un aller-retour avant que le logo s'affiche.

**La cause :** Next sert `public/` en `public, max-age=0`. Avec ETag, donc
le corps ne repart pas — mais la permission de réutiliser sans demander
n'est jamais accordée.

**La correction, en une phrase :** une entrée `headers()` pour ces
fichiers. **Ne touche pas au service worker.**

> **Nuance qui compte :** `yokofolio-icone.png` n'a pas de version dans son
> nom. Un `immutable` d'un an la figerait chez tous les visiteurs le jour
> où tu la remplaces. La consigne prudente est
> `public, max-age=86400, must-revalidate` — un jour, revalidable — et non
> `immutable`. Les variantes numérotées (`-256`, `-512`), elles,
> supporteraient `immutable`.

### 5. Les routes API sans aucune consigne

**Poids à la 2ᵉ visite : 0,1 Ko.** Ce n'est pas un problème de poids.

**La cause :** `/api/yokofolio/creations-par-style` répond sans aucun
`Cache-Control` (mesuré : `(aucune)`). Une réponse sans consigne autorise
tout intermédiaire à décider tout seul de la garder, selon ses propres
règles. Sur des routes qui servent des données personnelles (compte,
favoris, notifications), c'est une garantie qui manque — même si le
service worker, lui, ne les intercepte jamais, ce qui est écrit
explicitement dans son code et vérifié ici.

**La correction, en une phrase :** poser `private, no-store` sur les
réponses des routes API. **Ne touche pas au service worker.**

### 6. Le manifeste sans ETag

**Poids à la 2ᵉ visite : 0,5 Ko.** Il revient en entier faute d'ETag, là où
un 304 suffirait. **Je recommande de ne rien faire** : le gain ne vaut pas
le risque de toucher à la génération du manifeste.

---

## 5 · Le service worker : les questions posées, une par une

**Que garde-t-il, et combien de temps ?** Les fichiers à empreinte
(`/_next/static/`), `/images/`, et tout ce dont la destination est image,
style, script ou police — en **cache d'abord**, sans limite de durée, mais
dans un cache **nommé par le millésime** : sa durée de vie réelle est
celle d'une mise en ligne. Plus la page « hors ligne » et son logo, rangés
à l'installation.

**Contredit-il le serveur ?** **Non, nulle part** — c'est la mesure qui le
dit, pas la lecture : le trafic est identique avec et sans lui. Sur les
fichiers immuables il devance un cache HTTP qui aurait répondu de toute
façon ; sur les pages et les routes API il se retire ; sur les icônes il
va au réseau, où il tombe sur un 304.

**Le mécanisme d'auto-réparation (686/693) force-t-il des rechargements
inutiles ?** **Non.** Il ne se déclenche que sur un **404 d'un fichier
`/_next/static/`** — un signal sans ambiguïté, puisque ces noms portent une
empreinte de contenu — une seule fois par instance (verrou
`guerisonLancee`), et **il ne recharge pas la page** : il vide, se
désinscrit, et laisse le visiteur faire son geste. Aucun rechargement
inutile n'est possible par cette voie. **Rien à faire.**

**Que se passe-t-il au déploiement : les fichiers valables sont-ils
conservés, ou tout est-il jeté ?** **Tout est jeté** — l'activation
supprime tous les caches dont le nom n'est pas le millésime courant.
Cela *semble* gaspilleur, et ça ne l'est pas :

- les fichiers du programme portent une empreinte de contenu ; après une
  compilation, **les anciens ne sont plus jamais demandés** — les jeter ne
  coûte rien ;
- ceux qui sont encore demandés (une police, une image inchangée) sont
  toujours dans le **cache HTTP du navigateur**, qui les tient un an et que
  l'activation ne touche pas.

**Rien à faire ici non plus.**

---

## 6 · Ce qui est bon, et je le dis franchement

Tu as demandé que « rien à faire » soit un résultat valable. En voici la
part, et elle est large :

- **le code, la feuille de style et les polices** — la grande masse du
  site, ~400 Ko — sont réglés exactement comme il faut : un an,
  `immutable`, jamais redemandés. **Rien à faire.**
- **la page d'accueil** obtient son 304 sans transférer un octet de corps.
  **Rien à faire.**
- **le service worker** ne contredit rien, ne garde rien de dangereux,
  n'intercepte jamais les routes personnelles, et se soigne sans brusquer
  le visiteur. **Rien à faire — et c'est heureux, vu son passé.**
- **la purge des caches au déploiement**, qui a l'air d'un gaspillage, n'en
  est pas un. **Rien à faire.**

**Aucune des corrections proposées ne touche au service worker.** Les cinq
défauts se règlent dans `next.config.ts` et dans les appels `.upload()` —
c'est-à-dire loin de la pièce qui a déjà causé des pannes de chargement.
Si tu veux quand même une passe qui y touche, elle devra être seule.

---

## 7 · L'ordre que je te propose

| Rang | Défaut | Gain à la 2ᵉ visite | Où | Touche au SW ? |
| --- | --- | --- | --- | --- |
| 1 | Avatars Supabase, 1 h → immuables | ~100–150 Ko par grille | les 7 `.upload()` | non |
| 2 | `/recherche` en `no-store` | 37 Ko | `next.config.ts` | non |
| 3 | Images de `public/` en `max-age=0` | 0 Ko, 2 allers-retours | `next.config.ts` | non |
| 4 | Routes API sans consigne | 0 Ko (c'est une garantie, pas un poids) | les routes | non |
| 5 | Manifeste sans ETag | 0,5 Ko — **je conseille de laisser** | — | non |
| — | Préchargements répétés | 38 Ko — **autre sujet** (préchargement, pas cache) | — | non |

Les rangs 2, 3 et 4 tiennent dans une seule passe : ils touchent tous le
même fichier ou sa périphérie, et se prouvent par la même mesure
(`curl -sI`, puis le banc de cette passe rejoué). Le rang 1 mérite d'être
seul : il change ce qui part en ligne, et il faut d'abord confirmer d'un
`curl` ce que Supabase renvoie aujourd'hui.
