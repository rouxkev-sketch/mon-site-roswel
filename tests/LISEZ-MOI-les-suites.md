# Les suites de vérification du projet — inventaire complet

*Inventaire établi à la passe nº 98, ARCHIVAGE FAIT à la passe nº 99.
Chaque suite a été relancée pour écrire ces lignes : rien ici n'est
déduit d'une lecture, tout a été joué.*

---

## En un coup d'œil

### Ce qui reste dans `tests/` — **rejoué à chaque passe**

| suite | ce qu'elle défend | vérifications |
|---|---|---|
| `commun-verif.mjs` | *(pas une suite : le socle partagé)* | — |
| `pages-publiques.mjs` | accueil, fiche publique, filtres, recherche multi-lieux, interrupteur d'essai | 27 |
| `verif-p90.mjs` | champs du formulaire, pied de page, sections Besoins/Rendu, rôles de studio | 44 |
| `verif-p91.mjs` | autocomplétion du navigateur, recherche sur téléphone | 30 |
| `verif-p93.mjs` | blocs du formulaire (nombre, ordre, numérotation), globe, formulaire de demande | 64 |
| `retour-liste.mjs` | retour depuis une fiche : position + pagination *(produit artisan, mais une **mécanique**, pas un dessin)* | 12 |

**177 vérifications, toutes au vert.**

### Ce qui est parti dans `tests/archives/` — rangé, pas supprimé

| suite | pourquoi |
|---|---|
| `verif-p92.mjs` | doublon intégral de `verif-p93.mjs`, et le contredisait sur le globe |
| `cartes-artisan.mjs` | dessin de la carte de l'ancien produit artisan |
| `mode-double-web.mjs` | mise en page deux colonnes de l'ancien produit artisan |
| `ipad-graphique.mjs` | défilement iPad de l'ancien produit artisan |

Voir `tests/archives/LISEZ-MOI.md` : ce qu'elles contiennent, comment
les relancer, et quand les supprimer pour de bon. **Elles passaient
toutes au vert le jour de leur archivage** — aucune n'est cassée.

---

## Comment les lancer

```bash
npm run dev            # dans un premier terminal

npm run test:public    # pages publiques                    (27)
npm run verif:p90      # champs et fiches                   (44)
npm run verif:p91      # autocomplétion, recherche mobile   (30)
npm run verif:p93      # blocs du formulaire                (64)
npm run test:retour    # retour depuis une fiche            (12)

npm run verif:tout     # les cinq à la suite — LE RÉFLEXE DE FIN DE PASSE
```

Les archivées, si besoin :

```bash
npm run archives:p92
npm run archives:cartes
npm run archives:web-double
npm run archives:ipad
```

---

## PERMANENTES ou PONCTUELLES : la distinction

* **PERMANENTE** — elle défend une règle qui doit rester vraie tant que
  le produit existe. On la rejoue à chaque passe. Si elle échoue, ou
  bien on a cassé quelque chose, ou bien la règle a changé et il faut
  la réécrire — jamais l'ignorer.
* **PONCTUELLE** — elle a été écrite pour vérifier UNE correction, un
  jour donné. Une fois la correction ancienne et couverte ailleurs,
  elle ne prouve plus rien de neuf : elle coûte du temps à chaque
  exécution et un doute à chaque échec.

⚠️ **Le vrai danger n'est pas la suite inutile, c'est la suite qui
échoue depuis longtemps.** Quatre suites échouaient depuis six passes ;
personne ne les lisait plus, et elles auraient laissé passer une vraie
régression sans que rien ne le signale. Une suite qui ne peut pas
rester verte doit être réparée ou supprimée — jamais laissée rouge.

---

## Le socle : `commun-verif.mjs`

**Ce n'est pas une suite**, c'est ce que les quatre `verif-p*` se
partagent. Il existe parce que la vraie cause de leur péremption
n'était pas les textes du site : c'était **la quadruple recopie**. Les
quatre portaient chacune son cookie de session, son faux géocodeur, ses
compteurs, son lecteur de blocs et sa façon d'ouvrir le formulaire.
Cent lignes en quatre exemplaires : quatre endroits à corriger quand le
formulaire change, et trois oubliés à chaque fois.

Ce qu'il fournit :

* `ouvrirLeNavigateur()` — un Chromium, le cookie `@supabase/ssr` d'une
  session connectée, et **un faux géocodeur** à la place de Photon,
  hors d'atteinte de ce conteneur. Le code du site n'est pas modifié
  d'une ligne : c'est le RÉSEAU qu'on remplace, pas le produit.
* `formulaireNeuf(page, "artiste" | "salon" | "prive")` — **la pièce
  maîtresse**. Elle joue le parcours réel : choisir la carte de profil,
  situer le lieu, confirmer le bloc 1. Sans elle, les blocs 2 à 12
  n'existent pas et toute assertion qui les concerne ment.
* `nomsDeBlocsAttendus(type)` — lit `ORDRE_BLOCS` et `NOMS_BLOCS` **dans
  `FormulaireFiche.tsx`**. Renommer un bloc dans le produit renomme
  l'attente du test ; le test continue de vérifier ce qui, lui, ne se
  lit nulle part : le NOMBRE, l'ORDRE et la NUMÉROTATION.
* `verif` / `nonJoue` / `bilan` — **trois états, pas deux.** Une section
  qu'on n'a pas pu jouer n'est ni un succès ni un échec : elle est dite.

---

## Les suites yokofolio, une par une

### `pages-publiques.mjs` — PERMANENTE · 27 vérifications

Tout ce qui se voit sans être connecté : l'accueil et son moteur, le
compte Instagram du pied de page, la fiche publique et ses sections
Besoins/Rendu, les filtres qui retirent vraiment des fiches, **la
recherche qui connaît TOUS les lieux d'une fiche** (passe nº 96 : un
guest à Bordeaux fait sortir une fiche lyonnaise ; un guest terminé ne
fait plus sortir personne), et **l'interrupteur « fiche d'essai en
ligne »** contrôlé aux trois endroits serveur (passe nº 97).

Elle ne demande ni session, ni base, ni réseau. **C'est la condition
pour qu'elle ne pourrisse pas** : c'est celle à lancer en premier.

### `verif-p90.mjs` — PERMANENTE · 44 vérifications

Les champs du formulaire sans épingle ni loupe en double, l'Instagram
du pied de page, YouTube et Linktree, les sections Besoins et Rendu
déduites des photos, le mot « Fondateur » selon le lieu, les champs de
studio jamais bloqués.

*Retiré à cette passe :* §5 « la fenêtre de recherche » (12 assertions)
— **caduque depuis la passe nº 104**, la fenêtre superposée a été
remplacée par une page pleine hauteur ; §11 « les deux migrations sont
numérotées 34 et 35 » — une suite permanente ne peut pas porter le
compte des migrations, qui monte à chaque passe. C'est le travail de
`supabase/yokofolio-verification-migrations.sql`.

### `verif-p91.mjs` — PERMANENTE · 30 vérifications

**Sa moitié la plus précieuse est §2, l'autocomplétion du navigateur.**
Safari et Chrome proposent l'adresse personnelle dans le champ
« adresse du salon », et le seul moyen de les en empêcher est un
faisceau de six précautions dont aucune ne suffit seule. Une régression
ici ne se voit pas à l'œil : elle se voit le jour où un tatoueur publie
son domicile sans l'avoir voulu.

Puis §3 : la recherche sur téléphone — l'écran s'ouvre, ses deux vues
sont là, **choisir une ville ne lance aucune recherche**, « Valider »
la lance, l'écran se referme.

⚠️ **§2 bis tient un point VOLONTAIREMENT REPORTÉ.** `ChampVille` et
`TableauProspection` portent encore `autocomplete="off"` — sans
conséquence, car aucun n'appartient à yokofolio. Décision du
propriétaire à la passe nº 99 : ce sera traité **avec la refonte du
formulaire**, pas avant. Le détail est consigné dans
`docs/A-REPRENDRE-refonte-du-formulaire.md`. Si ces assertions se
mettent un jour à échouer, c'est que ces composants ont changé de
mains : **relire ce fichier-là AVANT de toucher au test.**

*Retiré à cette passe :* les 5 assertions géométriques de la fenêtre
flottante et les 7 de « la mécanique de placement » — **caduques depuis
la passe nº 104**. Elles décrivaient le repositionnement manuel qu'on
faisait pendant que le clavier d'iOS arrivait : exactement la mécanique
qu'on a supprimée. Les garder revenait à exiger le retour du défaut.

### `verif-p93.mjs` — PERMANENTE · 64 vérifications

**La suite du formulaire de fiche.** Elle joue trois parcours complets
et lit les blocs à l'écran :

| profil | blocs | numérotation |
|---|---|---|
| Artiste | 9 | 1 → 9 |
| Salon | 12 | 1 → 12 |
| Studio privé | 11 | 1…9, **11**, 12 — le nº 10 est SAUTÉ |

Le trou du studio privé est la **bonne** réponse : il ne reçoit pas de
public, il n'a pas d'heures d'ouverture, et le numéro vient de la
position dans `ORDRE_BLOCS`, pas d'un comptage à l'écran. Le jour où
l'on renumérote « pour faire joli », deux fiches du même site
n'appelleront plus la même chose par le même nom.

Puis : le tutoiement du côté artiste, les textes explicatifs retirés,
le champ « Formulaire de demande » et sa validation, le lien sur la
fiche publique, le globe dessiné de la barre fixe.

*Retiré à cette passe :* « les horaires sont DANS le bloc 1 »
(2 assertions) — **la passe nº 95 a fait l'inverse**, et pour une bonne
raison : on les cherchait sans les trouver, et un studio privé se
voyait proposer des heures d'ouverture qu'il n'a pas. L'assertion a été
**retournée**, pas supprimée. Idem pour les 9 assertions de la fenêtre
superposée (passe nº 104).

### `verif-p92.mjs` — ARCHIVÉE à la passe nº 99 · 50 vérifications

**Elle fait entièrement double emploi avec `verif-p93.mjs`.** La passe
nº 93 a repris le fichier de la passe nº 92 ligne pour ligne, en a
corrigé deux points, et l'a enrichi. Il ne reste rien qui lui soit
propre : chacune de ses assertions se retrouve dans p93, à l'identique
ou en mieux.

**Pire : sur un point, les deux se contredisaient.** p92 exigeait que
le sélecteur de langue de la barre fixe porte l'image
`/icone-world.png` en masque CSS ; la passe nº 93 a rendu le globe
DESSINÉ à la barre, parce qu'une image en masque ne suit pas la
couleur du bouton. **Les deux ne pouvaient plus passer en même temps.**
La section a été retirée de p92, et c'est p93 qui garde le point, dans
le bon sens.

Elle a quand même été remise d'aplomb et passe intégralement — pour
qu'elle ne pourrisse pas une passe de plus en attendant ta décision.

---

## Les suites de l'ancien produit artisan

Ces quatre-là **passent toutes**, et ce qu'elles vérifient existe
toujours : les écrans `/artisans`, `/artisan/[slug]` et
`/artisan/espace` n'ont pas été retirés. Elles ne sont donc pas
« cassées » — elles défendent simplement un produit que yokofolio a
remplacé.

| suite | ce qu'elle défend | où elle est |
|---|---|---|
| `retour-liste.mjs` | Le retour depuis une fiche restaure la position ET les pages « Voir plus » déjà chargées, en retour SPA comme en rechargement complet. **Ce bug a résisté à plusieurs corrections** ; sa cause racine (une valeur de défilement rognée pendant la transition) est couverte ici. | **reste dans `tests/`** — c'est la seule des quatre qui défend une mécanique, pas un dessin |
| `cartes-artisan.mjs` | Le dessin de la carte artisan à 7 largeurs : photo ronde, ligne « Métier · Ville », trois chiffres, boutons, bandeau de pied. | archivée (nº 99) |
| `mode-double-web.mjs` | Deux colonnes fluides ≥ 1024 px, rapport 42/58, contour des cartes non rogné. | archivée (nº 99) |
| `ipad-graphique.mjs` | Pas de barre de défilement parasite ; la fiche en un seul bloc continu. | archivée (nº 99) |

Les trois archivées ne décrivent qu'une mise en page figée, qu'on ne
retouche plus. **Le jour où les écrans `/artisans` sont retirés du
site, les quatre peuvent partir ensemble** — `retour-liste.mjs`
comprise.

---

## Ce qui n'est PAS dans le dépôt, et qu'il n'y a rien à supprimer

Les passes précédentes ont produit **des centaines de sondes jetables**
— `repro-page-inerte.mjs`, `sonde-saut-clavier.mjs`,
`filmer-fenetre.mjs`, `flux.mjs`… (**457 fichiers `.mjs` au moment
d'écrire ces lignes**). Elles vivent toutes dans le répertoire de
travail temporaire de la session, **jamais dans le dépôt, jamais dans
un zip livré**, et disparaissent avec le conteneur.

⚠️ **C'était une confusion dans les comptes rendus précédents**, où il
était question de « recenser les 177 fichiers de tests du projet ». Le
dépôt n'en a jamais contenu 177 : il en compte **dix**, tous dans
`tests/`. Le chiffre décrivait le brouillon, pas le projet — et le
brouillon se nettoie tout seul.

**Règle à tenir :** une sonde qui mérite d'être rejouée à la passe
suivante n'est plus une sonde. Elle rejoint `tests/`, avec un en-tête
qui dit ce qu'elle défend et à quelle passe elle a été écrite. Les
autres restent dehors et meurent avec la session — c'est très bien
ainsi.

---

## Ce qui ne se vérifie pas ici

* **Les migrations** — `supabase/yokofolio-verification-migrations.sql`,
  à coller dans l'éditeur SQL de Supabase. Il n'écrit rien et rend une
  ligne par migration : ✅ PASSÉE, ⚠️ INCOMPLÈTE ou ❌ MANQUANTE.
* **La fluidité, image par image** — elle se mesure au film, pas à
  l'assertion. Ces sondes-là restent jetables, par nature.
* **Le rendu visuel** — tu le valides toi-même sur ton environnement.
  Aucune capture n'est produite ni livrée.
