# AUDIT nº 717 — toutes les images du site, web et mobile

*Étude seule : aucune correction. Le code a été parcouru en entier (les
trois façons d'afficher une image : `next/image`, balise `<img>`, fond
CSS), puis chaque page a été mesurée au banc — pixels reçus contre place
occupée, aux deux appareils.*

---

## 1 · CE QUE LE BANC PEUT DIRE, ET CE QU'IL NE PEUT PAS

| | |
|---|---|
| **Il peut** | quel composant sert quelle image, par quel chemin (optimiseur ou brut), la taille d'affichage réelle, le mode de chargement, ce qui est visible ou caché sur chaque appareil, et le **rapport de sur-dimensionnement** |
| **Il ne peut pas** | donner les POIDS de production. Les fiches du banc sont des démonstrations : elles n'ont pas de photo cataloguée, elles partagent les mêmes fichiers, et ces fichiers sont des SVG. Tout chiffre en kilo-octets ci-dessous serait faux — les mesures de confirmation sont au § 6 |

⚠️ **Une conséquence à garder en tête tout du long** : au banc, `PhotoDeCarte`
emprunte son chemin de REPLI (pas de photo cataloguée → balise brute).
En production, ce même composant passe par l'optimiseur. Les lignes du
tableau le distinguent explicitement.

---

## 2 · LE TABLEAU COMPLET

*« trop » = pixels reçus ÷ largeur d'affichage. 1× est parfait, 2× est
la cible sur écran à haute densité, au-delà c'est du gaspillage.*

| emplacement | image | fichier | reçu → affiché | trop | optimisée ? | paresseuse | web / mobile | gravité | correction en une ligne |
|---|---|---|---|---|---|---|---|---|---|
| **Cartes des 3 grilles** (accueil, recherche, Ma sélection) | photo principale | `PhotoDeCarte` | *production* : taille exacte de l'écran | **1×** | **OUI** (AVIF/WebP, `sizes`, q65) | oui | les deux | **aucune** | rien — acquis nº 366 |
| ⤷ *même composant, fiches sans photo cataloguée* | photo principale | miniature 320×400 | 320 → 194-293 | 1,1-1,6× | non (repli) | oui | les deux | **faible** | rien : la miniature est déjà à la bonne échelle |
| **Cartes des 3 grilles** | **avatar rond** | `CarteTatoueur` | **800 → 40** | **20×** | **NON** | oui | **web seul** (parent `mobile:hidden`) | **ÉLEVÉE** | servir la miniature 160×160 que le recadreur fabrique déjà |
| **Fiche publique** | **avatar rond** | `ContenuFiche` | **800 → 40** (doigt) / **92** (web) | **20× / 8,7×** | **NON** | non | les deux | **ÉLEVÉE** | idem |
| **Fiche publique** | photos de galerie | `PhotoProgressive` | 800 → 622 (web) / 391 (doigt) | 1,3× / 2,0× | **NON** | 1ʳᵉ non, suite oui | les deux | **faible** | rien au web ; au doigt, la miniature suffirait |
| **Éditeur de portfolio** | vignettes de galerie | `GrilleGalerie` | miniature | ~1× | non | **oui** | les deux | **aucune** | rien |
| **Ma sélection — portfolios suivis** | vignettes | `BlocSuivis` | **`photo.miniature`** | ~1× | non | **oui** | les deux | **aucune** | rien — sert déjà la miniature ✅ |
| **Portfolio de l'affiche** | vignettes | `PortfolioDeLAffiche` | **`photo.miniature`** | ~1× | non | **oui** | les deux | **aucune** | rien ✅ |
| **Équipe du salon** | avatars | `BlocEquipeSalon` | **800 → petit rond** | **élevé** | **NON** | non | les deux | **moyenne** (peu d'occurrences) | idem avatar |
| **Autre adresse** | avatar | `BlocAutreAdresse` | **800 → 40** | **20×** | **NON** | non | les deux | **moyenne** | idem avatar |
| **Recherche de fiche inscrite** | avatar | `RechercheFicheInscrite` | **800 → petit** | **élevé** | **NON** | non | les deux | **faible** (écran d'admin) | idem avatar |
| **Barre fixe — « Mon espace »** | avatar du compte | `PhotoRonde` | `photo_compte` (session) | selon dépôt | **NON** | non | les deux | **moyenne** | idem avatar |
| **Barre fixe** | logo | `LogoYokofolio` | 512 → 185-247 | **2,1-2,8×** | **variantes** AVIF/WebP | eager | les deux | **aucune** | rien — corrigé nº 716 ✅ |
| **Qui sommes-nous** | icône de marque | `yokofolio-icone.png` | 297 → 128 (doigt) / 160 (web) | **2,3× / 1,9×** | **NON** (11 Ko) | non | les deux | **très faible** | rien, ou variantes si l'on y revient |
| **Champ photo (éditeur)** | aperçu | `ChampsIdentite` | image locale (blob) | — | sans objet | non | les deux | **aucune** | rien — ne passe pas par le réseau |
| **Icône « ajouter une photo »** | glyphe | `IconeAjouterPhoto` | fichier de `public/` | ~1× | non | non | les deux | **aucune** | rien |
| **Cartes hors écran** | pixel transparent | `GrilleTatoueurs` | 1×1, en clair dans le code | — | sans objet | — | les deux | **aucune** | rien — c'est une ÉCONOMIE (nº 224-§5), à ne pas défaire |
| **Images de partage** (aperçu réseaux) | `opengraph-image`, `image-partage` | fabriquées au SERVEUR | — | — | sans objet | — | ni l'un ni l'autre | **aucune** | rien : jamais chargées par un visiteur |

*(Les écrans d'administration, le produit « artisans » et l'agence ont
leurs propres images ; ils sortent du périmètre de ce que voient les
visiteurs de YokoFolio et n'ont pas été chiffrés.)*

---

## 3 · L'AVATAR : LE DÉFAUT, CONFIRMÉ PARTOUT

Le constat de la nº 715 est **confirmé et étendu**. Une seule et même
cause, dans **sept** emplacements : la source affichée est
`photo_profil`, c'est-à-dire la **sortie 800 × 800** du recadreur
(`RecadreurPhoto`, `FORMES.rond.sortie`).

**Et le recadreur fabrique déjà la bonne image** — `FORMES.rond.miniature`
vaut **160 × 160** — mais le formulaire ne reçoit que le fichier
principal (`photoRondeCadree({ fichier, apercu })`) : la miniature est
**produite puis jetée**, jamais stockée. Pour les photos de portfolio,
au contraire, les deux sont conservées et les cartes servent la
miniature : le mécanisme existe, il n'a simplement jamais été branché
sur le rond.

**Mesuré au banc, sur `/recherche` au web** : `24× reçus 800×1000,
affiché 40×40` — **vingt fois trop grand**, pour l'élément le plus petit
de la carte.

### Web ou mobile ?

| | doigt | web |
|---|---|---|
| avatar de **carte** | **non affiché** — son parent porte `mobile:hidden`, et le banc confirme : 24 balises sans parent affiché | affiché, 40 × 40 |
| avatar de **fiche** | affiché 40 × 40 (**20×**) | affiché 92 × 92 (**8,7×**) |
| appareil correctement détecté par le site | `data-appareil = mobile` ✅ | `data-appareil = web` ✅ |

⚠️ **Ce que le banc ne tranche pas** : une image dont un ancêtre est en
`display:none` n'est en principe pas téléchargée. Au banc, impossible de
le vérifier — les fiches de démonstration partagent leurs fichiers, donc
le cache masque les requêtes. **La mesure A du § 6 tranchera.** Le
doigt paie de toute façon l'avatar de la FICHE, lui bien affiché.

---

## 4 · CE QUI EST DÉJÀ BON — À NE PAS TOUCHER

1. **La photo principale des cartes** en production : optimiseur, AVIF
   puis WebP, largeur exacte de l'écran, qualité 65 (nº 366).
2. **Le logo** : variantes statiques 256/512 en AVIF, repli WebP puis
   original (nº 716).
3. **Les vignettes de `BlocSuivis` et `PortfolioDeLAffiche`** : elles
   servent déjà `photo.miniature`. C'est exactement ce qu'il faut faire
   pour l'avatar.
4. **Le chargement paresseux** : présent sur toutes les grandes listes
   (44 des 49 balises d'une grille) ; six images seulement partent avant
   le premier défilement.
5. **Le pixel transparent** des cartes lointaines : une économie de
   mémoire délibérée (nº 224-§5), pas un défaut.
6. **Les photos de fiche au web** : 800 reçus pour 622 affichés — 1,3×,
   c'est-à-dire juste.

---

## 5 · LE TOP DES CORRECTIONS, PAR GAIN

### 1. L'avatar, à la source *(gain élevé, risque faible)*

**Un seul geste couvre les sept emplacements** : transmettre et stocker
la miniature 160 × 160 que le recadreur fabrique déjà, puis servir cette
miniature partout où l'avatar s'affiche petit. Passer de 800 × 800 à
160 × 160, c'est **vingt-cinq fois moins de pixels**.

*Risque* : il touche le dépôt de la photo de profil (formulaire) et les
sept lieux d'affichage. Les photos DÉJÀ déposées n'ont pas de miniature :
il faut donc un repli sur l'image actuelle — sans quoi les comptes
existants perdraient leur avatar. C'est le point délicat, et il se traite
en une ligne (`miniature ?? photo_profil`).

### 2. La galerie de fiche au doigt *(gain moyen, risque faible)*

Au doigt, les photos de fiche sont reçues en 800 pour 391 affichés (2,0×).
La miniature 320 × 400 existe déjà pour ces mêmes photos ; au web, en
revanche, la pleine résolution est justifiée (1,3×). *À trancher : le
gain est réel mais la netteté au doigt compte, c'est un arbitrage
d'image, pas de technique.*

### 3. L'icône de marque sur « Qui sommes-nous » *(gain très faible)*

11 Ko pour 128 px affichés (2,3×). Une seule page, une seule image :
à ne faire que si l'on y revient pour autre chose.

---

## 6 · LES MESURES DE CONFIRMATION (sonde « Vitesse », depuis `/dev`)

**Mesure A — l'avatar, sur ORDINATEUR.** Ouvrir « Recherche » avec des
portfolios qui ont une photo de profil, défiler jusqu'en bas, et lire la
liste des requêtes : les fichiers `profil-….jpg`, **combien et quel
poids chacun ?** *Autour de 100 Ko pièce confirme le 800 × 800 et chiffre
le gain ; ce sera le nombre à mettre en face de la correction nº 1.*

**Mesure B — l'avatar au DOIGT.** La même page, sur iPhone. Les fichiers
`profil-….jpg` apparaissent-ils dans la liste ? *S'ils n'y sont pas, le
doigt ne paie pas l'avatar des cartes et la correction ne vaut que pour
l'ordinateur et pour les fiches ; s'ils y sont, elle vaut partout.*

**Mesure C — la photo de carte est-elle bien optimisée en production ?**
Toujours dans la liste : les photos de cartes doivent apparaître comme
`/_next/image?url=…`. *Si elles passent en direct vers Supabase, c'est
que les fiches concernées n'ont pas de photo cataloguée — et le levier
serait tout autre.*

**Mesure D — la fiche publique.** Ouvrir une fiche et regarder le poids
des photos de galerie : au web elles sont justes, au doigt elles font
le double du nécessaire. *Le relevé dira si l'écart se voit sur un vrai
réseau.*

---

## 7 · CE QUE CET AUDIT NE DIT PAS

- Il ne chiffre aucun poids en production : le banc n'a que des
  démonstrations (§ 1). Les rapports de sur-dimensionnement, eux, sont
  mesurés et se transposent.
- Il ne dit pas que le doigt paie l'avatar des cartes : il dit que son
  parent est caché et que la question se tranche par la mesure B.
- Il n'applique rien : la nº 717 est une étude, et elle le reste.
