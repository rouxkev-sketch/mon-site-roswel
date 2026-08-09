# À reprendre lors de la refonte du formulaire

*Ouvert à la passe nº 99, sur décision du propriétaire : « ne le
corrige pas maintenant, il sera traité plus tard, avec la refonte du
formulaire. Note-le simplement quelque part pour qu'il ne se perde
pas. »*

**Ce fichier ne contient que des points VOLONTAIREMENT reportés.**
Quand la refonte du formulaire commencera, c'est la première chose à
relire. Un point traité se raye d'ici — il ne se garde pas « au cas
où ».

---

## 1. Les deux champs qui portent encore `autocomplete="off"`

### Ce qui est en cause

| fichier | ce que c'est |
|---|---|
| `src/components/ChampVille.tsx` | le champ de ville de l'**ancien produit artisan** |
| `src/components/TableauProspection.tsx` | l'outil de prospection, réservé à l'**administrateur** |

Tous deux posent `autocomplete="off"`. Or **Safari ignore « off »
exprès** : c'est le seul mot que la spécification autorise pour dire
« pas d'autocomplétion », et les navigateurs ont décidé de ne pas
l'écouter, parce que trop de sites l'employaient à tort. Le reste du
projet emploie donc un **jeton non standard** (`hors-carnet`), que la
devinette du navigateur ne sait pas interpréter et qui la fait taire —
voir `src/lib/champs-sans-remplissage.ts`.

### ⚠️ Ce n'est pas une faille ouverte aujourd'hui — et il faut le dire clairement

**Aucun champ de yokofolio n'est concerné.** Vérifié, et désormais
tenu par une assertion permanente (`tests/verif-p91.mjs`, §2 bis) :

* `ChampVille` n'est lu que par `FormulaireRecherche`,
  `FormulaireArtisan` et `RechercheCompacte` — c'est-à-dire les écrans
  `/artisans`, `/artisan/[slug]` et `/artisan/espace`, l'ancien
  produit ;
* `TableauProspection` n'est atteignable que par l'administrateur ;
* **tout le formulaire de fiche passe par `sansRemplissageAuto()`**, et
  chaque champ porte le faisceau complet : jeton `hors-carnet`, `name`
  opaque ou absent, les trois clés des gestionnaires de mots de passe,
  et la prise CSS qui retire la silhouette de WebKit.

Le risque qu'on veut écarter — qu'un tatoueur publie son adresse
personnelle parce que Safari l'a proposée dans le champ « adresse du
salon » — **n'existe donc pas dans le produit vivant**. Le report ne
laisse rien de dangereux en place.

### Ce qu'il faudra faire, et quand

* **Si l'ancien produit artisan est réactivé ou repris** : faire passer
  `ChampVille` par `sansRemplissageAuto()`, comme tout le reste. C'est
  une ligne.
* **Si `TableauProspection` accueille un jour autre chose qu'un
  administrateur** : idem.
* **Si les deux écrans sont retirés** : le point disparaît de lui-même,
  et cette section se raye.

---

## 2. Quatre champs sans attribut `name` — incohérence, pas défaut

Dans `src/components/FormulaireFiche.tsx`, quatre champs étalent la
constante `SANS_REMPLISSAGE_AUTO` au lieu d'appeler la fonction
`sansRemplissageAuto("…")` :

* `fiche-instagram`
* `fiche-tiktok`
* `fiche-youtube`
* `fiche-site`

Ils n'ont donc **aucun attribut `name`** (vérifié :
`hasAttribute("name") === false`), là où tous les autres portent un nom
opaque du genre `q1n7m1n9`.

**Ce n'est pas moins sûr, c'est même plutôt plus :** ce qu'on protège,
c'est qu'aucun mot de dictionnaire ne nourrisse la devinette du
navigateur. Un `name` absent ne lui donne rien du tout. Et ce sont des
champs `type="url"`, que l'autocomplétion d'adresse ne vise pas.

**Ce qui gêne, c'est l'incohérence :** dans le MÊME bloc, le champ
`fiche-formulaire` — également `type="url"` — appelle bien
`sansRemplissageAuto("fiche-formulaire")`. Deux façons de faire la même
chose à trois lignes d'écart, c'est ce qui produit les erreurs de
relecture plus tard.

➜ **À la refonte : aligner les quatre sur la fonction.** Aucun effet
visible, aucun risque, et une règle au lieu de deux. L'assertion de
`verif-p91.mjs` accepte aujourd'hui les deux formes (« opaque OU
absent ») ; le jour où les quatre seront alignés, on pourra la
resserrer sur la seule forme opaque.
