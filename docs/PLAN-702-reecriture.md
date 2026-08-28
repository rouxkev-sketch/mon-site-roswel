# PLAN nº 702 — L'ALLÈGEMENT DU PROGRAMME (étude nº 701, aucun code)

**Passe d'étude. Rien n'a été modifié : ce document est le seul
livrable.** Toutes les mesures ont été faites au banc de cette passe,
sur la compilation réelle du site (les scripts de mesure sont décrits
en fin de document, pour que la passe qui exécutera reparte des mêmes).

---

## 1 · CE QU'ON A MESURÉ

### Le temps, d'abord — l'étalonnage du « ~3 s sur téléphone »

Accueil, écran de téléphone, processeur ralenti ×4 (profil Lighthouse) :

| Liaison | Chargement complet |
|---|---|
| 4G (9 Mbits/s, 60 ms) | **0,9 s** |
| 3G rapide (1,6 Mbits/s, 150 ms) | **3,3 s** |

Le « ~3 s » des nº 684/685 est donc le cas d'une liaison moyenne, pas
d'un téléphone récent en 4G. C'est bien le **téléchargement du
programme** qui domine cette tranche : ~355 Ko compressés à
1,6 Mbits/s font à eux seuls ~1,8 s, avant même de l'exécuter.

### Le poids, ensuite — et il est LE MÊME PARTOUT

Ce que le navigateur télécharge réellement en JavaScript (mesuré en
chargeant chaque page, pas en lisant le HTML) :

| Page | Fichiers JS | Brut | Compressé (gzip) |
|---|---:|---:|---:|
| Accueil | 23 | 1 191 Ko | 355 Ko |
| Recherche | 23 | 1 191 Ko | 355 Ko |
| Fiche d'un tatoueur | 24 | 1 195 Ko | 357 Ko |
| Contact | 23 | 1 183 Ko | 351 Ko |
| **Mentions légales** | 20 | 1 162 Ko | **342 Ko** |
| Favoris (artisans) | 27 | 1 262 Ko | 378 Ko |

**Le constat central : l'écart entre la page la plus riche et la page
la plus simple est de 13 Ko compressés.** Tout le reste — ~342 Ko —
est un TRONC COMMUN chargé partout, mentions légales comprises. Ce
n'est pas telle ou telle page qui est lourde : c'est le tronc.

### La composition du tronc, morceau par morceau

Identifiée en fouillant chaque fichier compilé (marqueurs
`data-source-fichier` de l'instrumentation maison, chaînes de texte
propres à chaque composant) :

| Morceau | Brut | Gzip | Ce que c'est | Levier ? |
|---|---:|---:|---|---|
| react-dom | 221 Ko | 69 Ko | Le moteur d'affichage | Non — socle |
| **supabase-js** | 240 Ko | **62 Ko** | Le client de la base, entier | **OUI — L3** |
| **Barre + moteur + corps du menu** | 182 Ko | **58 Ko** | `EnTeteTatouage` + `MoteurTatouage` + le corps de `MenuEspace` + `SelecteurLangue` (un seul fichier compilé) | **OUI — L4/L5** |
| **Polyfills (core-js)** | 109 Ko | **38 Ko** | Béquilles pour très vieux navigateurs | **OUI — L2** |
| Noyau Next (rendu) | 134 Ko | 36 Ko | Prérendu, revalidation | Non — socle |
| Écran recherche mobile + grilles + sondes | 102 Ko | 30 Ko | `PageRechercheMobile`, cartes, glissement, boîte noire | Non (§5) |
| Routeur Next (2 fichiers) | 96 Ko | 21 Ko | Navigation | Non — socle |
| Tuiles/cartes partagées | 47 Ko | 13 Ko | Composants d'affichage communs | Non (§5) |
| Config + libellés styles | 19 Ko | ~7 Ko | Le catalogue des styles | Non (§5) |
| Petits fichiers (×~10) | ~90 Ko | ~21 Ko | Amorce, contextes, divers | Non |

---

## 2 · UNE BONNE NOUVELLE QUI CHANGE LE PLAN

**Le constat des nº 684/685 (« le menu du compte est chargé partout »)
est aux deux tiers périmé, et c'est mesuré :**

- la **fenêtre des notifications** est déjà chargée à la demande
  (passe nº 693, `dynamic()` dans `MenuEspace`) ;
- les **fenêtres du menu** (déconnexion, identité…) vivent déjà dans
  des fichiers à part : le chargement initial est **identique connecté
  ou non** (24 fichiers dans les deux cas), et l'ouverture du menu
  télécharge son fichier à elle ;
- ce qui reste dans le tronc, c'est le fichier de 58 Ko gzip qui
  soude **la barre, le moteur de recherche et le corps du menu**.

Conséquence : **la voie technique du chargement à la demande est déjà
éprouvée à l'intérieur même du fichier le plus sensible.** On ne
défriche pas ; on étend un mécanisme qui tourne en production.

---

## 3 · LES LEVIERS, DU MOINS RISQUÉ AU PLUS RISQUÉ

Conversion des gains en temps : à 1,6 Mbits/s (3G rapide), 10 Ko gzip
≈ 0,05 s de réseau ; s'y ajoute l'exécution épargnée (processeur de
téléphone). En 4G, le réseau ne compte presque plus : le gain est
surtout l'exécution.

### L1 · Le banc de référence (aucun risque — c'est lui qui protège les autres)

Poser dans `outils/` les trois mesures écrites pour cette étude :
poids réel par page, temps throttlé, liste des fichiers chargés. Elles
tournent avant/après CHAQUE étape. Sans elles, aucun gain n'est
prouvable et aucune régression n'est visible.

### L2 · Les polyfills — 38 Ko gzip, ~0,2 s en 3G

Un fichier de 109 Ko de béquilles pour navigateurs très anciens est
chargé partout. **Étape 1 : diagnostiquer d'où il vient** (aucun
`browserslist` dans le projet — c'est donc une dépendance ou un
réglage par défaut qui le tire). **Étape 2 : le retirer ou le cibler**
si le diagnostic confirme qu'il ne sert à rien sur les navigateurs
visés. Ne touche NI la barre, NI la position, NI la recherche.
- Risque : très faible (configuration, pas de code de page). Le seul
  vrai risque : un iPhone ancien qui en dépendait — le banc « pages
  publiques » sur WebKit le dirait, et le zip précédent restaure.

### L3 · supabase-js différé — 62 Ko gzip, ~0,3 s en 3G

Le client de la base est entier dans le tronc, tiré par
`use-utilisateur` (session) et les cœurs. Or **la session se lit déjà
sans lui** (le cookie, nº 632) : il ne devient nécessaire qu'à la
première ACTION (se connecter, poser un favori, ouvrir le menu).
Technique : import dynamique dans le point unique
`lib/supabase/client.ts` — un seul fichier à changer, tous les
consommateurs suivent.
- Ce que ça touche : la session, les cœurs, le menu. PAS la position,
  PAS le retour, PAS la barre visible.
- Ce que ça pourrait casser : l'état connecté au premier rendu (un
  clignotement d'avatar), un cœur cliqué très tôt qui attend le
  chargement. Les deux se voient au banc nº 693 (normal-693) et au
  banc des cœurs.

### L4 · Le PANNEAU du moteur à la demande — ~35 à 45 Ko gzip, ~0,2 s en 3G

Le fichier de 58 Ko gzip se découpe en deux : **la barre visible**
(logo, champ replié, silhouette, langue — ce qui doit être là au
premier écran) reste dans le tronc ; **le panneau du moteur** (les
menus déroulants, les suggestions, la géolocalisation, ~2 000 lignes
de `MoteurTatouage`) se charge quand on TOUCHE la barre — exactement
comme la fenêtre des notifications aujourd'hui.
- Ce que ça touche : LA ZONE SENSIBLE (nº 653/661) — la barre fixe,
  l'ouverture du moteur, le va-et-vient avec l'historique.
- Ce que ça pourrait casser : l'ouverture du panneau au premier toucher
  (délai visible sur liaison lente — prévoir le trait de chargement,
  mécanisme nº 469 déjà en place), la restauration d'une recherche au
  RETOUR (le panneau doit se recharger avant de rejouer l'état), la
  remontée (nº 162).
- Découpe interne (chaque cran est testable et réversible) :
  1. le panneau derrière `dynamic()` SANS changer son montage (il se
     précharge dès l'hydratation : gain nul, mais la couture est posée
     et le banc prouve que rien n'a bougé) ;
  2. le préchargement passe « au premier survol/toucher de la barre » ;
  3. le préchargement passe « à l'ouverture » (gain plein).
  On peut s'arrêter au cran 2 : l'essentiel du gain y est déjà pour
  les pages où l'on ne cherche pas.

### L5 · Le corps du MenuEspace à la demande — ~10 à 15 Ko gzip

Même mécanique que L4, même fichier d'origine. Gain plus petit (les
fenêtres lourdes sont déjà dehors). À faire DANS LA FOULÉE de L4 si
L4 s'est bien passé — même chantier, mêmes bancs — ou pas du tout.

---

## 4 · L'ORDRE, LES GARDE-FOUS, LA RÉVERSIBILITÉ

| Étape | Passe | Gain gzip | Risque | Garde-fous à rejouer |
|---|---|---:|---|---|
| L1 banc de référence | 702 | 0 (il protège) | aucun | — |
| L2 polyfills | 702 | −38 Ko | très faible | poids + fumée + pages publiques |
| L3 supabase différé | 703 | −62 Ko | moyen | normal-693 (menu, notifs, favoris, admin), cœurs, connexion |
| L4 panneau du moteur, cran 1 | 704 | 0 | moyen | LE BANC COMPLET (dessous) |
| L4 cran 2 (survol/toucher) | 704 | −35 à −45 Ko | élevé | idem |
| L4 cran 3 (à l'ouverture) | 705 | (compris dans L4) | élevé | idem |
| L5 corps du menu | 705 | −10 à −15 Ko | moyen | idem |

**Le banc complet des étapes L4/L5** (les trois zones historiquement
fragiles, nº 653/661/677) :
1. accueil → carte de style → fiche → RETOUR : la position de la liste
   est restaurée, la barre n'a pas clignoté ;
2. recherche ouverte → résultat → RETOUR : la recherche rejouée, les
   filtres intacts, une seule étape d'historique (nº 156/164) ;
3. remontée des champs à suggestions (nº 162) : uniquement eux ;
4. glissement d'onglets dans Ma sélection (nº 526) ;
5. ouverture du moteur SUR LIAISON LENTE (réseau throttlé) : le trait
   de chargement paraît, le panneau s'ouvre, aucune double ouverture ;
6. la boîte noire n'enregistre aucun événement inattendu ;
7. les poids : la page mesurée AVANT et APRÈS, l'écart annoncé.

**Réversibilité : une étape = une passe = un zip.** Chaque cran de L4
est un zip distinct. Revenir en arrière = redéployer le zip précédent
(`sh livre N.zip`), rien d'autre.

---

## 5 · CE QUI NE VAUT PAS LE RISQUE — dit clairement

| Idée | Gain | Pourquoi NON |
|---|---:|---|
| Sortir l'écran de recherche mobile + grilles (30 Ko gz) du tronc | ~0,15 s | Il sert sur les pages qui COMPTENT (accueil, recherche, style+ville). Le gain ne se verrait que sur contact/mentions légales — des pages de passage. Toucher la grille, c'est toucher la position (nº 653) pour rien. |
| Découper les tuiles partagées (13 Ko gz) | ~0,07 s | Trop petit pour toucher des composants montés partout. |
| Alléger la config des styles (7 Ko gz) | ~0,04 s | Le catalogue sert au premier rendu de presque toutes les pages. |
| Toucher react-dom / le routeur Next | — | C'est le socle. Rien à découper sans réécrire le site. |
| Réécrire la barre « en plus léger » | inconnu | C'est la réécriture profonde qu'on refuse : la zone nº 653/661 se découpe (L4), elle ne se réécrit pas. |

**Aucune étape du plan n'exige de réécriture non découpable.** La
seule qui s'en approche est le cran 3 de L4 (charger le moteur à
l'ouverture seulement) — et le plan permet de s'arrêter au cran 2 en
gardant l'essentiel du gain.

---

## 6 · LA RECOMMANDATION

**Faire : L1 + L2 (une passe), puis L3 (une passe), puis L4 crans 1-2
(une passe).** À ce point : **−135 à −145 Ko gzip sur ~355**, soit
~40 % du programme en moins partout. Estimation honnête du temps :

| Liaison | Aujourd'hui | Après L1-L4c2 |
|---|---|---|
| 3G rapide | 3,3 s | **~2,2 à 2,4 s** |
| 4G | 0,9 s | **~0,6 à 0,7 s** |

**Décider ensuite, mesures en main** : L4 cran 3 + L5 (encore ~−20 à
−25 Ko) seulement si les crans précédents n'ont RIEN cassé aux bancs
retour/position. **S'arrêter là.** Le §5 reste interdit de chantier.

Ce que ce plan ne règle pas (et ne prétend pas régler) : les ~174 Ko
gzip de socle React/Next/polyfills-résiduels — c'est le prix de
l'outil choisi. Après le plan, le site restera un site React ; il
cessera d'être un site React qui charge son moteur de recherche pour
lire les mentions légales.

---

*Étude produite à la passe nº 701. Scripts de mesure conservés dans le
scratchpad de la session (poids par page, liste des fichiers chargés
visiteur/connecté, temps throttlé, attribution des chunks) — à poser
dans `outils/` à l'étape L1, première action de la passe nº 702.*
