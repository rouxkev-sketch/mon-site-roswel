# Déménager la base : Irlande → USA Est

**Passe nº 766.** Tout ce qu'il faut pour faire passer YokoFolio de
l'ancien projet Supabase (Irlande) au nouveau, `yokofolio-us`
(East US) — dans l'ordre, avec ce qu'on vérifie entre chaque étape.

> **La règle qui tient tout.** L'ancien projet n'est **jamais touché**.
> Aucun script de ce kit n'y écrit ni n'y efface quoi que ce soit : ils
> lisent, c'est tout. Tant que tu ne le supprimes pas toi-même, le
> retour arrière est toujours possible, et il tient en trois variables.

> **Les clés.** Aucune n'est écrite dans le dépôt, ni ici, ni dans un
> message. Ce document dit **où les trouver**, jamais ce qu'elles
> valent.

---

## Ce qui déménage, et comment

| | quoi | par quel moyen |
|---|---|---|
| 1 | la **forme** (tables, vues, fonctions, droits) | lue dans la vraie base, puis collée |
| 2 | les **comptes** | `sh outils/restaurer-comptes` |
| 3 | les **lignes** (fiches, photos en base, conventions…) | `sh outils/demenager-donnees` |
| 4 | les **photos** (les fichiers) | `sh outils/demenager-photos` |
| 5 | les **réglages** du projet | à la main, écran par écran |

**L'ordre n'est pas négociable** : les lignes pointent vers des
comptes, et les comptes ne peuvent pas être créés avant que les tables
existent. Chaque étape suppose la précédente.

---

## Étape 0 — la sauvegarde (à faire en premier, toujours)

```
sh outils/sauvegarde
```

Elle fabrique `sauvegardes/AAAA-MM-JJ/`. **C'est elle qui contient les
comptes** — l'étape 2 les y lira. Ne saute pas cette étape : sans elle,
tu n'as rien à restaurer.

**Vérification :** le dossier existe, il contient un fichier par table,
un fichier de comptes, et les photos.

---

## Étape 1 — la forme, dans le nouveau projet

> ### Ce qui a raté la première fois, et pourquoi
>
> Le premier schéma livré était bâti en **rejouant les migrations du
> dépôt**. Il a échoué au moment de copier les lignes :
> *« Could not find the `filtres_motif` column of `tatoueurs` »*.
>
> **La cause :** le dépôt n'est pas le miroir de la base. Des colonnes
> ont été ajoutées à la main, directement dans Supabase, sans jamais
> passer par une migration — `filtres_motif` n'existe nulle part dans
> le dépôt. Un schéma tiré du dépôt ne peut décrire que l'idée que le
> dépôt se fait de la base.
>
> **La correction :** on lit désormais **la vraie base**. C'est elle
> qui fait foi, et elle seule. Le schéma se fabrique en trois gestes,
> ci-dessous, et il se refera de la même façon si la base rebouge.

### 1a — lire la vraie base

> **L'essai de cinq secondes.** Je n'ai pas l'éditeur de Supabase sous
> la main : je ne peux pas éprouver mes fichiers là où ils tournent.
> Avant de coller les trois cents lignes, colle **cette seule ligne**
> dans l'ancien projet :
>
> ```sql
> select count(*) from pg_class c
>   join pg_namespace n on n.oid = c.relnamespace
>   where n.nspname = 'public';
> ```
>
> Elle doit rendre **un nombre**. Si oui, le gros fichier passera. Si
> elle échoue, envoie-moi l'erreur.
>
> *(La version précédente désignait le schéma par le raccourci
> `'public'::regnamespace`. Il passe sur un PostgreSQL ordinaire —
> éprouvé — mais l'éditeur de Supabase le lit autrement et cherchait
> une **table** nommée « public », d'où `42P01`. Le raccourci a
> disparu des deux fichiers SQL.)*

Dans supabase.com, **ANCIEN** projet (Irlande) ▸ **SQL Editor** ▸ colle
d'un bloc et lance :

```
supabase/766-lire-le-schema-reel.sql
```

Il ne fait que **lire** : aucun `CREATE`, aucun `ALTER`, aucune donnée
touchée, aucune clé regardée. Tu peux le lancer sur la production sans
crainte.

Sous le résultat : bouton **« Download CSV »**.

### 1b — en faire un fichier SQL

Sur ton Mac, dans le dossier du projet :

```
sh outils/assembler-schema ~/Downloads/le-fichier.csv
```

Il écrit `supabase/yokofolio-schema-reel.sql`.

### 1c — le poser dans le nouveau projet

Dans supabase.com, projet **yokofolio-us** ▸ **SQL Editor** ▸ colle
d'un bloc `supabase/yokofolio-schema-reel.sql`.

Il ne contient **aucune donnée**, aucun compte, aucune photo : rien que
la forme.

**Vérification — l'empreinte.** C'est le contrôle qui manquait la
première fois, et c'est le plus important du document. Colle
`supabase/766-empreinte-schema.sql` dans **chacun des deux projets**,
et compare les deux résultats.

La dernière ligne, **▓ EMPREINTE**, résume tout : une seule chaîne de
32 caractères. **Si les deux empreintes sont identiques, les deux
schémas le sont** — colonne par colonne, type par type, règle par
règle. Si elles diffèrent, les lignes au-dessus disent quelle table
n'est pas d'accord.

**Ne passe pas à l'étape 2 tant que les deux empreintes diffèrent.**
Envoie-moi les deux résultats.

---

## Étape 2 — les comptes

```
NEXT_PUBLIC_SUPABASE_URL='https://xxxxx.supabase.co' \
SUPABASE_SECRET_KEY='la clé secrète du NOUVEAU projet' \
  sh outils/restaurer-comptes sauvegardes/AAAA-MM-JJ
```

Les deux variables en tête **remplacent** celles de `.env.local` le
temps de la commande : c'est ainsi que l'outil écrit dans le **nouveau**
projet sans qu'on touche à un fichier. Il te fera taper `RESTAURER`.

> ### Les mots de passe ne déménagent pas — et c'est important
>
> Supabase ne rend le mot de passe de personne, pas même à
> l'administration. Ce n'est pas un manque de l'outil : c'est une
> protection. Les comptes sont donc recréés avec **leur adresse et leur
> identifiant** — l'identifiant étant ce qui relie une personne à ses
> portfolios — mais **sans mot de passe**.
>
> **Conséquence concrète :** chaque personne devra cliquer
> « mot de passe oublié » à sa première connexion sur le nouveau
> projet. Avec les quelques comptes d'essai d'aujourd'hui, c'est une
> minute de travail. **Préviens-les avant la bascule.**
>
> *(Il existe une autre voie — copier la table `auth.users` avec
> `pg_dump`, ce qui emporte les empreintes de mots de passe. Elle
> demande la chaîne de connexion directe à la base et `pg_dump`
> installé sur ton Mac. Je ne l'ai pas éprouvée depuis l'atelier, qui
> n'a aucun accès réseau : je ne te la recommande donc pas les yeux
> fermés. Dis-le-moi si tu veux qu'on la prépare pour de bon.)*

**Vérification —** dans le nouveau projet ▸ **Authentication** ▸
**Users** : le même nombre de comptes que dans l'ancien, avec les mêmes
adresses.

---

## Étape 3 — les lignes

D'abord **à blanc** (il ne écrit rien, il compte) :

```
CIBLE_URL='https://xxxxx.supabase.co' \
CIBLE_SECRET_KEY='la clé secrète du NOUVEAU projet' \
  sh outils/demenager-donnees
```

Lis les nombres table par table. S'ils correspondent à ce que tu
attends, relance **avec `--reel`** :

```
CIBLE_URL='…' CIBLE_SECRET_KEY='…' \
  sh outils/demenager-donnees --reel
```

Il sert les tables **dans l'ordre des dépendances** (les fiches avant
les photos, les conventions avant les modes d'exercice) et il est
**rejouable** : une ligne déjà écrite est remplacée, jamais dupliquée.
Si ça coupe, relance.

> **Il s'arrête à la première erreur.** Les treize dernières tables
> s'appuient sur les premières : si `tatoueurs` échoue, tout le reste
> échouerait aussi, et treize messages pour une seule cause n'aident
> personne. Il s'arrête donc net, nomme la cause, et marque les
> suivantes « pas tentée ». Corrige, relance.
> *(Pour voir tous les problèmes d'un coup malgré tout : ajoute
> `--continuer`.)*

> **Les trois tables numérotées par la base.** `clics_fiches`,
> `messages_yokofolio` et `signalements_fiches` ont un `id` que
> PostgreSQL se réserve : il refuse qu'on lui en impose la valeur. Le
> script le voit dans le refus, retire la colonne et laisse la nouvelle
> base numéroter — tu verras passer la ligne
> `↺ … « id » est numéroté par la base : on le laisse faire`.
> Les numéros ne seront pas les mêmes des deux côtés. **Ce n'est pas
> grave :** aucune autre table ne pointe vers ces `id`. Rien ne se
> délie.

**Vérification —** dans le nouveau projet ▸ **Table Editor**, ouvre
`tatoueurs` et `photos_tatoueur` : le compte de lignes doit être celui
qu'a affiché le script.

---

## Étape 4 — les photos

**Avant tout :** crée le seau dans le nouveau projet ▸ **Storage** ▸
**New bucket** :

- nom : `photos-tatoueurs` (au caractère près) ;
- **Public bucket : OUI**. Les photos des portfolios s'affichent pour
  tout le monde, sans jeton — c'est ainsi dans l'ancien projet, et le
  site construit ses adresses en le supposant. Un seau privé donnerait
  des portfolios vides.

Puis, à blanc :

```
CIBLE_URL='…' CIBLE_SECRET_KEY='…' sh outils/demenager-photos
```

Il compte les deux côtés et dit ce qui manque. Puis :

```
CIBLE_URL='…' CIBLE_SECRET_KEY='…' sh outils/demenager-photos --reel
```

C'est le plus long des quatre : les fichiers passent un par un. S'il
coupe, relance — il ne recopie que ce qui manque encore, et ne réécrit
jamais par-dessus un fichier déjà là.

**Vérification —** relance-le **sans** `--reel` : il doit annoncer
« à copier : 0 ».

---

## Étape 5 — les réglages, écran par écran

Ce qui ne vit pas dans le SQL et qu'aucun script ne peut deviner.
Dans **yokofolio-us** :

### Authentication ▸ URL Configuration
- **Site URL** : l'adresse publique du site (la même que dans l'ancien
  projet — recopie-la depuis là-bas pour ne pas te tromper).
- **Redirect URLs** : ajoute `…/auth/callback` pour l'adresse publique,
  et `http://localhost:3000/auth/callback` si tu veux continuer à
  travailler en local.

> Ces deux réglages décident où l'on retombe après une connexion. Mal
> renseignés, la connexion « tourne » puis renvoie sur une page
> d'erreur.

### Authentication ▸ Sign In / Providers
- **Email** est actif par défaut. Vérifie qu'il l'est.
- Si tu avais activé Google / Facebook / Apple dans l'ancien projet, il
  faut **recoller leurs identifiants ici** — ils ne suivent pas. Et
  côté Google/Facebook, il faut **ajouter la nouvelle adresse de
  retour** dans leur console, sinon la connexion sera refusée.

### Authentication ▸ Emails
- Si tu avais modifié un texte de courriel (confirmation, mot de passe
  oublié), recopie-le : les gabarits reviennent à leur version d'usine
  dans un projet neuf.

### Storage
- le seau `photos-tatoueurs`, public (étape 4).

### Comparer plutôt que se souvenir
Garde les deux projets ouverts côte à côte dans deux onglets et passe
d'un écran à l'autre. C'est plus sûr que de se fier à sa mémoire.

---

## Étape 6 — la bascule

C'est **le seul moment** où la production change de base.

### 6a. Vercel

Projet du site ▸ **Settings** ▸ **Environment Variables**. Trois
valeurs à remplacer (Production, Preview et Development si tu les as
renseignées) :

| variable | où prendre la nouvelle valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yokofolio-us ▸ Settings ▸ **Data API** ▸ « Project URL » |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yokofolio-us ▸ Settings ▸ **API Keys** ▸ la clé **publiable** (publishable / anon) |
| `SUPABASE_SECRET_KEY` | yokofolio-us ▸ Settings ▸ **API Keys** ▸ la clé **secrète** (service_role) |

> **Note les anciennes valeurs quelque part avant de les remplacer**
> (dans tes notes personnelles, pas dans le dépôt). C'est ton retour
> arrière, et il doit être à portée de main.

**Puis redéploie** : sur Vercel, changer une variable ne suffit pas —
il faut un nouveau déploiement pour qu'elle soit prise. Deployments ▸
le dernier ▸ **Redeploy**.

### 6b. Ton Mac

Le fichier `~/.yokofolio/env.local` porte la clé secrète que `sh livre`
remet en place à chaque livraison. Remplace-y la ligne
`SUPABASE_SECRET_KEY=` par celle du **nouveau** projet, et
`NEXT_PUBLIC_SUPABASE_URL=` par la nouvelle adresse si elle y figure.

> Tant que tu ne l'as pas fait, ton dossier local continue de parler à
> l'ancien projet. Ce n'est pas grave — c'est même pratique pour
> comparer — mais il faut le savoir.

---

## Étape 7 — le contrôle, dans cet ordre

Sur le site en ligne, après le redéploiement :

1. **La recherche** — ouvre `/recherche`, choisis un style : des fiches
   apparaissent, avec leurs villes.
2. **Une fiche** — ouvre-en une : le portfolio s'affiche, les photos se
   chargent (c'est l'étape 4 qui se vérifie ici).
3. **La connexion** — connecte-toi. Si c'est un compte déménagé, passe
   par « mot de passe oublié » : le courriel doit arriver, et le lien
   doit ramener sur le site (c'est le réglage 5 « URL Configuration »).
4. **Le formulaire** — ouvre ton portfolio, change un mot, enregistre,
   recharge : le changement tient.
5. **Une photo** — ajoute une photo, recharge : elle est là. C'est
   l'écriture dans le nouveau seau qui se vérifie.
6. **Les favoris** — mets une photo en favori, va sur « Ma sélection ».
7. **Les notifications** — la cloche s'ouvre sans erreur.

Si l'un de ces sept points échoue, **ne cherche pas longtemps** :
reviens en arrière (étape 8) et envoie-moi ce que tu as vu. Le site
remarche en trois minutes, et on regarde à froid.

---

## Étape 8 — le retour arrière

**Il tient en trois variables.** Sur Vercel, remets les trois anciennes
valeurs, redéploie : le site reparle à l'Irlande, avec toutes ses
données, comme si rien ne s'était passé. Remets aussi l'ancienne clé
dans `~/.yokofolio/env.local`.

**Rien n'est perdu**, parce que rien n'a été retiré de l'ancien projet :
les scripts de ce kit n'y ont fait que des lectures.

---

## Étape 9 — supprimer l'ancien projet

**Pas tout de suite.** Laisse tourner le nouveau **plusieurs jours**,
avec de vrais passages, avant d'y toucher. Il n'y a aucun avantage à
supprimer vite, et un inconvénient évident.

Avant de supprimer, refais une **sauvegarde de l'ancien** (`sh
outils/sauvegarde` avec les anciennes variables) et range-la ailleurs
que sur le Mac. Une suppression de projet Supabase ne se défait pas.

---

## Ce qui ne déménage pas, et qu'il faut savoir

- **les mots de passe** — voir l'étape 2 ;
- **les identifiants des fournisseurs de connexion** (Google, etc.) —
  à recoller, voir l'étape 5 ;
- **les gabarits de courriels** modifiés — à recopier ;
- **l'historique** : journaux, statistiques d'usage du tableau de bord
  Supabase. Ils appartiennent au projet, pas aux données.
- **la latence** change, et c'est le but : le nouveau projet est aux
  États-Unis. Depuis la France, les écritures seront un peu plus
  lentes ; depuis l'Amérique, bien plus rapides.
