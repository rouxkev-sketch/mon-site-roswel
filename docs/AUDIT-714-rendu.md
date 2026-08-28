# AUDIT nº 714 — où part le « RENDU » de 1 seconde

*Étude seule, aucune modification. Bancs : Chromium (gabarit iPhone
390 × 844, processeur ralenti ×4), base doublée en local, visite de
chauffe puis rechargement — l'équivalent du « à chaud » du propriétaire.*

---

## 1 · D'ABORD : CE QUE « RENDU » VEUT DIRE, ET C'EST LE POINT DE DÉPART

La sonde de vitesse calcule ce poste en UNE ligne (`src/lib/vitesse.ts`,
ligne 302) :

    rendu = premierEcran − responseStart

C'est-à-dire : **du premier octet de la réponse HTML jusqu'à la première
peinture**. Ce n'est donc PAS « le temps que React met à s'hydrater », ni
« le coût des composants montés ». C'est **tout ce qui se passe avant que
le premier pixel de contenu paraisse** — le transfert du HTML, la feuille
de style bloquante, les polices, les scripts que le navigateur veut avoir
lus, l'analyse du document, le calcul des styles, la mise en page.

**Conséquence directe pour la lecture du relevé du propriétaire** :
« RENDU 1021 ms » ne dit pas « React est lent ». Il dit « il s'écoule une
seconde entre la réponse du serveur et le premier pixel ». Ce qui occupe
cette seconde est justement l'objet de cet audit — et le coupable n'est
pas celui qu'on croyait.

---

## 2 · CE QUE LE BANC PEUT DIRE, ET CE QU'IL NE PEUT PAS

| | |
|---|---|
| **Il peut** | la répartition du travail (analyse, styles, mise en page, exécution), le poids et l'ordre des ressources qui bloquent la peinture, la part du JavaScript par différence, le profil processeur par fichier |
| **Il ne peut pas** | reproduire le chiffre du propriétaire. Au banc, le rendu tient en **216 à 307 ms** — pas 1021. Trois raisons, toutes hors de portée de l'atelier : un vrai iPhone n'est pas un Chromium ralenti ×4 ; le réseau de production a une vraie latence ; et **le compte du banc n'a ni favoris ni portfolio**, donc la page « Ma sélection » y est presque vide alors que celle du propriétaire est pleine |

**Tous les coûts ci-dessous sont donc des RÉPARTITIONS, pas des durées
absolues.** Ce qui se transpose, ce sont les proportions et les
anomalies de structure ; les millisecondes se valident chez le
propriétaire (§ 7).

---

## 3 · LES MESURES

### 3.1 · Les jalons (rechargement à chaud, ×4)

| page | responseStart | domInteractive | **FCP** | rendu |
|---|---|---|---|---|
| accueil | 10-15 ms | 198-331 ms | **299-328 ms** | 216-291 ms |
| Ma sélection | 23-33 ms | 215-392 ms | **324-360 ms** | 243-307 ms |

### 3.2 · Le travail du navigateur, poste par poste (somme des durées)

| poste | accueil | Ma sélection | ce que c'est |
|---|---|---|---|
| `FunctionCall` | 205 ms | 241 ms | exécution du JavaScript (React compris) |
| `EvaluateScript` | 79 ms | 111 ms | lecture + compilation des fichiers de script |
| `Layout` | 53 ms | 80 ms | calcul des positions |
| `UpdateLayoutTree` | 41 ms | 59 ms | calcul des styles |
| `ParseHTML` | 41 ms | 55 ms | analyse du document |
| `EventDispatch` | 18 ms | 25 ms | événements |
| `MinorGC` | 11 ms | 23 ms | ramasse-miettes |
| `ParseAuthorStyleSheet` | 10 ms | 11 ms | analyse de la feuille de style |
| `Paint` + `PrePaint` | 22 ms | 16 ms | la peinture elle-même |

**La peinture ne coûte rien** (16-22 ms). Le temps est *avant* elle.

### 3.3 · Le profil processeur (Ma sélection, échantillonné 2943 ms)

| | temps | part |
|---|---|---|
| **(moteur)** — dont **(idle) 1804 ms** et **(program) 556 ms** | 2517 ms | 86 % |
| `react-dom` (chunk `0iec5q4ack_04`) | 131 ms | 4 % |
| chunk d'observation d'écran (`2oh5rha75m2ak`) | 75 ms | 3 % |
| runtime Turbopack | 54 ms | 2 % |
| Supabase (`31kmsqkjenv_5`) | 24 ms | 1 % |
| page Ma sélection + ses composants | ~62 ms | 2 % |

**Lecture** : `(idle)` = le navigateur ATTEND (le réseau, une image, une
réponse) — ce n'est pas du travail. `(program)` = travail interne du
moteur non attribuable à une ligne de JavaScript (analyse, styles, mise
en page). Le JavaScript *applicatif* propre au site totalise environ
**366 ms sur 2943**, dont **131 pour React lui-même**.

### 3.4 · LA MESURE DÉCISIVE : le plancher sans JavaScript

On coupe le JavaScript. Ce qui reste, c'est le socle incompressible :
HTML + feuille de style + polices.

| page | FCP sans JS | FCP normal | **part du JavaScript** |
|---|---|---|---|
| **accueil** | **216 ms** | 291 ms | **75 ms** (26 %) |
| **Ma sélection** | *aucune peinture* | 307 ms | **307 ms** (100 %) |

**Deux enseignements, et ce sont les plus importants de l'audit :**

1. **Sur l'accueil, le JavaScript n'est PAS le problème.** Les trois
   quarts du rendu (216 ms sur 291) sont dépensés avant qu'une seule
   ligne de React ne s'exécute : c'est le HTML, la feuille de style et
   les polices. Alléger React n'y gagnerait qu'un quart du poste.
2. **Sur Ma sélection, la page ne peint RIEN tant que React n'a pas
   parlé.** ⚠️ Au banc, c'est en partie un artefact : le compte de test
   n'a aucun favori, donc la page est vide de contenu. Chez le
   propriétaire, elle est pleine — c'est **exactement ce qu'il faut
   vérifier en production** (§ 7, mesure B).

### 3.5 · Ce qui arrive avant la peinture

**30 à 31 ressources, 1 479 à 1 608 Ko** sont demandées avant le premier
pixel. Les plus lourdes :

| ressource | poids | quand |
|---|---|---|
| **`yokofolio-logo.png`** | **139 Ko** | 75 → 90 ms |
| feuille de style `3bwhod9p2f0lw.css` | 121 Ko *(non compressée en local)* | 78 → 146 ms |
| chunk Supabase `31kmsqkjenv_5.js` | 241 Ko | 71 → 270 ms |
| police `caa3a2e1cccd8315-s.p.woff2` | 29 Ko | 71 → 82 ms |
| le document HTML lui-même | **92 à 102 Ko** | — |
| ~25 autres scripts | ~900 Ko | 71 → 273 ms |

---

## 4 · LE TABLEAU DES POSTES

| poste | coût estimé (banc, ×4) | réductible ? | piste |
|---|---|---|---|
| **Le logo `yokofolio-logo.png`** | 139 Ko sur le chemin critique, à chaque page | **OUI, franchement** | Il est servi par une balise `<img>` **brute** (`LogoYokofolio.tsx` ligne ~60) : il ne passe **pas** par l'optimiseur d'images. 139 Ko pour un affichage de 36 à 48 px de haut. ⚠️ Les images officielles sont interdites de retouche (règle nº 356/467) : il faut **demander au propriétaire** soit une version allégée, soit l'autorisation de passer par l'optimiseur |
| **Analyse + compilation des scripts** (`EvaluateScript`) | 79-111 ms | **partiellement** | ~25-30 fichiers séparés, chacun avec son coût fixe. Moins de fichiers = moins de coût fixe |
| **Exécution JavaScript** (`FunctionCall`) | 205-241 ms | **partiellement** | dont React lui-même 131 ms (incompressible). Le reste est applicatif |
| **Styles + mise en page** (`UpdateLayoutTree` + `Layout`) | 94-139 ms | **peu** | proportionnel au nombre de nœuds. La mosaïque en produit beaucoup |
| **Feuille de style** (123 733 octets) | 121 Ko en local, ~20 Ko compressée | **à vérifier** | si la production compresse (elle devrait), le gain réel est faible. **À mesurer chez le propriétaire avant toute action** |
| **Analyse du HTML** (92-102 Ko) | 41-55 ms | **partiellement** | le poids vient en grande partie de la charge React embarquée : moins de composants clients = document plus court |
| **La peinture** | 16-22 ms | non | négligeable |
| **Le socle React/Next** | 131 ms (react-dom) + runtime | **NON** | incompressible |

---

## 5 · LES TROIS LEVIERS, PAR GAIN

### Levier 1 — Le logo de 139 Ko *(gain net, risque quasi nul)*

**Le fait** : `public/yokofolio-logo.png` pèse 142 079 octets et part sur
le réseau **avant la première peinture, sur chaque page**, pour être
affiché à 36-48 px de haut. Il ne passe pas par l'optimiseur d'images.

**Le gain attendu** : 130 Ko de moins sur le chemin critique. Sur un
téléphone en 4G réelle, c'est le poste le plus directement ressenti — et
il ne coûte aucun risque fonctionnel.

**Le risque** : aucun sur le code. **Mais une règle du propriétaire
l'encadre** : les images officielles ne se retouchent pas sans son
accord (nº 356/467). Deux voies, à son choix :
 · il fournit lui-même une version allégée du fichier ;
 · il autorise le passage par l'optimiseur d'images de Next, qui
   fabrique des variantes **sans toucher au fichier d'origine**.

### Levier 2 — Vérifier la compression en production *(gain inconnu, risque nul)*

**Le fait** : la feuille fait 121 Ko *non compressés* au banc local.
Compressée, elle tombe vers 20 Ko. Si l'hébergement compresse déjà, il
n'y a rien à gagner ; s'il ne le fait pas, c'est 100 Ko sur le chemin
critique.

**Ce n'est pas une correction, c'est une mesure** — et elle doit précéder
toute idée de découper la feuille (ce qui, lui, serait risqué).

### Levier 3 — Réduire le nombre de fichiers de script *(gain modéré, risque réel)*

**Le fait** : 25 à 30 fichiers avant la peinture, pour ~1 500 Ko.
`EvaluateScript` coûte 79-111 ms, et chaque fichier ajoute un coût fixe.

**Le gain attendu** : quelques dizaines de millisecondes.

**Le risque — et il est sérieux** : regrouper des morceaux change ce qui
est chargé par page. La passe nº 704 a déjà montré qu'un découpage mal
choisi coûte plus qu'il ne rapporte (elle avait été *abandonnée après
mesure*). À ne tenter qu'avec un banc avant/après, et jamais en même
temps qu'autre chose.

**⚠️ Aucun de ces trois leviers ne touche la position ni la navigation
(nº 653/661/673).** C'est délibéré : cette zone est la plus fragile du
site, et rien dans cet audit ne justifie d'y entrer.

---

## 6 · CE QUI EST INCOMPRESSIBLE

- **React + Next** : 131 ms de `react-dom`, plus le runtime. C'est le
  prix du socle, il ne se négocie pas sans changer de socle.
- **L'analyse du HTML et le calcul des styles** : proportionnels à la
  taille du document et au nombre de nœuds. On peut les réduire un peu
  en réduisant le document, jamais les supprimer.
- **La peinture** : 16-22 ms. Il n'y a rien à y prendre.

---

## 7 · CE QUE LE PROPRIÉTAIRE DOIT MESURER POUR TRANCHER

Le banc ne peut pas conclure seul. Trois mesures, à faire sur son
iPhone, en production, sonde « Vitesse » allumée depuis `/dev` :

**Mesure A — le logo pèse-t-il vraiment ?**
Ouvrir l'accueil à froid. Dans la sonde, regarder la liste des requêtes :
`yokofolio-logo.png` y figure-t-il avant le premier écran, et pour
combien de millisecondes ? *Si oui, le levier 1 est confirmé.*

**Mesure B — Ma sélection peint-elle avant React ?**
Ouvrir « Ma sélection » (son compte, avec ses favoris) et noter le
premier écran. Puis comparer au même relevé sur l'accueil. *Si l'écart
est important, le levier porte sur cette page en particulier ; si les
deux sont proches, le coût est dans le socle commun.*

**Mesure C — la feuille est-elle compressée ?**
Dans la liste des requêtes de la sonde, la ligne du fichier `.css` :
quel poids annoncé ? *Sous 30 Ko, la compression fonctionne et le
levier 2 tombe ; autour de 120 Ko, il y a 100 Ko à récupérer.*

---

## 8 · CE QUE CET AUDIT NE DIT PAS

- Il ne dit pas que React est lent : sur l'accueil, il ne pèse que
  **26 %** du poste mesuré.
- Il ne nomme pas un composant coupable : aucun composant du site ne
  ressort du profil processeur. Le temps est réparti entre le socle
  (React, Turbopack), l'attente des ressources, et le travail du moteur.
- Il ne reproduit pas la seconde du propriétaire. **C'est la limite
  honnête de l'atelier**, et c'est pourquoi le § 7 existe.

---

*Aucune modification n'a été faite. Les deux corrections qui
apparaissent sûres — le logo, et la vérification de la compression —
sont décrites ci-dessus et attendent une décision du propriétaire.*
