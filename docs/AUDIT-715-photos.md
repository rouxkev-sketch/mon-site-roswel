# AUDIT nº 715 — les quatre éléments des cartes, sur les trois grilles

*Étude seule : aucune correction n'a été faite sur les cartes ni sur les
photos. Bancs : Chromium (iPhone 390 × 844 à densité 3, et web 1280 × 900
à densité 2), base doublée en local.*

**Les trois grilles montent la MÊME carte** — `CarteTatoueur`, importée
par `GrilleTatoueurs` (accueil et recherche) et par `PageFavoris`
(Ma sélection). Tout ce qui suit vaut donc pour les trois, sans
exception : il n'y a pas trois cartes à tenir d'accord, il n'y en a
qu'une.

---

## 1 · LA LIMITE DU BANC, DITE D'ABORD

Les fiches de démonstration **n'ont pas de photo cataloguée**
(`urlPleine`). Or c'est précisément ce champ qui décide du chemin dans
`PhotoDeCarte` : avec lui, l'optimiseur ; sans lui, la miniature servie
telle quelle. **Le banc emprunte donc le chemin de repli, pas celui de
la production.** Les poids d'images relevés ici ne valent rien pour la
production ; la STRUCTURE, elle, se transpose entièrement — et c'est
elle qui porte les constats ci-dessous.

---

## 2 · LE TABLEAU, ÉLÉMENT PAR ÉLÉMENT

| élément | constat | gravité | correction (une ligne) |
|---|---|---|---|
| **① Photo principale** | Passe par l'optimiseur (`next/image`) dès que la photo est cataloguée : AVIF puis WebP, largeur exacte de l'écran (`sizes`), qualité 65, chargement piloté par l'appelant. | **aucune** — c'est l'état de l'art, acquis à la nº 366 | rien à faire |
| **② Avatar (rond de profil)** | **Balise `<img>` brute, jamais optimisée.** Sa source est `photo_profil`, c'est-à-dire la **sortie 800 × 800** du recadreur — affichée en **40 × 40**. Soit 400 fois plus de pixels que nécessaire. | **ÉLEVÉE au web** (24 avatars par grille, ~2 à 3,6 Mo estimés en JPEG q 0,85), **faible au doigt** (voir § 3) | Servir la miniature **160 × 160 que le recadreur fabrique déjà** — ou faire passer l'avatar par `next/image` en 40 × 40 |
| **③ Nom** | Texte du HTML serveur. Présent dès le premier écran : **24 cartes portent leur texte au moment du FCP** (276 ms au doigt, 328 ms au web). N'attend aucune image. | **aucune** | rien à faire |
| **④ Sous-ligne** | Même chose que le nom, même rendu serveur, même instant. | **aucune** | rien à faire |

---

## 3 · LE DÉFAUT PRINCIPAL, INSTRUIT

### Ce que le recadreur fabrique, et ce qu'on en garde

`RecadreurPhoto` déclare, pour chaque forme, une sortie ET une
miniature (`components/RecadreurPhoto.tsx`) :

    portrait : sortie 1080 × 1350 · miniature 320 × 400
    rond     : sortie  800 × 800  · miniature 160 × 160

Pour les photos de portfolio, **les deux sont utilisées** : la miniature
part au stockage à côté de la pleine résolution, et les cartes la
servent (`vignetteDe`). C'est le gain de la nº 366, et il fonctionne.

**Pour le rond, non.** Le formulaire ne reçoit que le fichier :

    function photoRondeCadree(photo: { fichier: File; apercu: string })

La miniature 160 × 160 est **fabriquée puis jetée** — elle n'est jamais
transmise, jamais stockée. Le stockage ne garde que le 800 × 800, et
c'est cette image-là que chaque carte télécharge pour peindre un rond de
40 px.

### Ce que cela coûte, et où

| | au doigt | au web |
|---|---|---|
| l'avatar est-il affiché ? | **non** (`mobile:hidden`) | oui, 40 × 40 |
| conséquence | le navigateur ne charge pas une image en `display:none` : **mesuré, seules 6 images partent au chargement** — le doigt ne paie pas ce défaut | 24 avatars de 800 × 800 par grille, chargés au fil du défilement |

**La gravité est donc entièrement du côté du web** — et elle est réelle :
c'est le poste d'images le plus lourd de la grille, pour l'élément le
plus petit de la carte.

---

## 4 · LE CHARGEMENT PARESSEUX : IL FONCTIONNE

| mesure | résultat |
|---|---|
| balises `<img>` sur une grille de 24 cartes | **49** (24 photos + 24 avatars + le logo) — le compte du prompt est exact |
| dont en chargement paresseux | **44** |
| images réellement téléchargées **sans défiler** | **6** |
| après défilement jusqu'en bas | +4 (doigt, recherche) |
| **« Voir plus »** (second lot) | **+3 à +7 images seulement** |

**Rien n'est tiré d'avance.** Le second lot de « Voir plus » ne
déclenche pas un chargement massif : les images du nouveau lot restent
elles aussi paresseuses et n'arrivent qu'à l'approche de l'écran. Sur ce
point, il n'y a rien à corriger.

*(Sur l'accueil, le relevé « 0 image de plus après défilement » n'est pas
un défaut : la page de démonstration du banc n'a pas de mosaïque de
cartes à cet endroit.)*

---

## 5 · LES POLICES NE BLOQUENT PAS LE TEXTE

La feuille servie porte **`font-display: swap`** sur ses cinq
déclarations : le texte est peint immédiatement avec une police de
repli, puis échangé quand la vraie arrive. Une police (29 Ko) est
préchargée. **Aucun blocage** — c'est le bon réglage, il n'y a rien à
faire.

---

## 6 · CE QUE LE PROPRIÉTAIRE MESURE POUR CONFIRMER

Sonde « Vitesse » allumée depuis `/dev`, **sur ordinateur** (le défaut
ne se voit pas au doigt) :

**Mesure A — le poids des avatars.** Ouvrir « Recherche » ou
« Ma sélection » avec des portfolios qui ont une photo de profil, puis
défiler jusqu'en bas. Dans la liste des requêtes, repérer les fichiers
`profil-….jpg` : **combien, et quel poids chacun ?** *Autour de 100 Ko
pièce confirme le 800 × 800 ; autour de 10 Ko dirait que le stockage
contient déjà du petit.*

**Mesure B — la photo principale est-elle bien optimisée en
production ?** Dans la même liste, les photos de cartes doivent
apparaître comme `/_next/image?url=…` (et non comme une adresse
Supabase directe). *Si elles passent en direct, c'est que les fiches
concernées n'ont pas de photo cataloguée — et le levier serait tout
autre.*

**Mesure C — le texte arrive-t-il avant les images ?** Regarder l'écran
au chargement : les noms des tatoueurs doivent être lisibles **avant**
que les photos ne se posent. *C'est ce que le banc mesure ; à confirmer
sur un vrai réseau.*

---

## 7 · CE QUE CET AUDIT NE DIT PAS

- Il ne chiffre pas le poids réel d'un avatar en production : le banc
  n'a que des fiches de démonstration. La fourchette de 80 à 150 Ko est
  une **estimation** pour un JPEG 800 × 800 de qualité 0,85 — c'est la
  mesure A qui tranchera.
- Il ne propose aucune correction appliquée : le point 2 de la nº 715
  est une étude, et elle le reste.
