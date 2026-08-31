# Déménager la base : Irlande → USA Est

**Passe nº 770.** Faire passer YokoFolio de l'ancien projet Supabase
(Irlande) au nouveau, `yokofolio-us` (East US), **avec les outils
officiels de PostgreSQL** : `pg_dump` et `psql`.

> **Pourquoi ces outils-là, et plus les miens.** J'avais écrit un
> lecteur de schéma maison. Il marchait sur un PostgreSQL ordinaire mais
> échouait dans l'éditeur de Supabase, sans que je puisse reproduire
> l'échec depuis l'atelier — trois allers-retours pour rien. `pg_dump`
> est l'outil de ceux qui font PostgreSQL. Il connaît des recoins que je
> ne connais pas, et il tourne **sur ton Mac**, où l'éditeur de Supabase
> n'a pas son mot à dire.

> **La règle qui tient tout.** L'ancien projet n'est **jamais touché**.
> `pg_dump` ne fait que lire. Tant que tu ne le supprimes pas toi-même,
> le retour arrière tient en trois variables.

> **Les clés et les mots de passe.** Aucun n'est écrit dans le dépôt, ni
> ici, ni dans un message. Ce document dit **où les trouver**, jamais ce
> qu'ils valent. Les commandes ci-dessous sont faites pour qu'ils ne
> s'affichent pas à l'écran et ne restent pas dans l'historique du
> terminal.

---

## La voie courte : quatre commandes

Si tu ne veux pas lire le reste, `outils/demenager-officiel` enchaîne
les mêmes commandes que ce document, avec les garde-fous en place :

```
sh outils/demenager-officiel verifier
sh outils/demenager-officiel schema --reel
   … puis les COMPTES (étape 4) …
sh outils/demenager-officiel donnees --reel
sh outils/demenager-officiel comparer
   … puis les PHOTOS (étape 7) …
```

Sans `--reel`, `schema` et `donnees` **ne font que lire** : ils
prennent la copie, comptent, et n'écrivent rien.

Il faut quand même **l'étape 0** (installer les outils) et **l'étape 1**
(les deux chaînes de connexion) avant la première commande.

> **Le reste de ce document donne les commandes une par une**, telles
> que le script les lance. Sers-t'en si tu veux comprendre ce qui se
> passe, ou si une étape coince et qu'il faut la reprendre à la main.

---

## Ce qui déménage, et par quel moyen

| | quoi | outil |
|---|---|---|
| 1 | la **forme** (tables, vues, fonctions, droits, règles) | `pg_dump` + `psql` |
| 2 | les **comptes** | `sh outils/restaurer-comptes` |
| 3 | les **données** (toutes les lignes) | `pg_dump` + `psql` |
| 4 | les **photos** (les fichiers) | `sh outils/demenager-photos` |
| 5 | les **réglages** du projet | à la main, écran par écran |

**L'ordre n'est pas négociable** : les lignes pointent vers des comptes,
et les comptes ne peuvent pas exister avant les tables.

---

## Étape 0 — les deux outils, sur ton Mac

`pg_dump` et `psql` ne sont pas installés d'origine sur macOS.

```
brew install postgresql@17
export PATH="$(brew --prefix postgresql@17)/bin:$PATH"
```

La seconde ligne ne vaut que pour la fenêtre de terminal ouverte. Pour
qu'elle vaille toujours :

```
echo 'export PATH="'"$(brew --prefix postgresql@17)"'/bin:$PATH"' >> ~/.zprofile
```

**Vérifie :**

```
pg_dump --version
psql --version
```

> **La version compte.** `pg_dump` doit être **au moins aussi récent**
> que le serveur qu'il lit. Supabase tourne en 15 ou 17 selon les
> projets ; la 17 couvre les deux. Un `pg_dump` trop ancien refuse de
> travailler, avec un message clair — ce n'est pas dangereux, juste
> bloquant.

---

## Étape 1 — les deux chaînes de connexion

### Où les prendre

Dans supabase.com, **pour chacun des deux projets** : bouton
**Connect**, en haut de la page ▸ onglet **Session pooler**.

Tu y lis une ligne de la forme
`postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-….pooler.supabase.com:5432/postgres`.
Remplace `[YOUR-PASSWORD]` par **le mot de passe de la base** de ce
projet.

> **Le mot de passe de la base n'est pas une clé d'API.** Si tu ne l'as
> plus : Settings ▸ **Database** ▸ *Reset database password*. Le
> réinitialiser sur l'ANCIEN projet est sans effet sur le site en
> production — le site passe par les clés d'API, pas par ce mot de
> passe.

> **Prends bien le « Session pooler », pas le « Transaction pooler »**
> (port 6543) : celui-là ne sait pas faire tourner `pg_dump`. La
> « Direct connection », elle, ne répond qu'en IPv6 ; la plupart des
> accès internet domestiques sont en IPv4, d'où le Session pooler par
> défaut.

### Comment les taper sans les laisser traîner

Dans le Terminal, **une fois pour toute la session** :

```
printf 'Chaine de connexion de l ANCIEN projet : '; stty -echo; read ANCIEN; stty echo; echo
printf 'Chaine de connexion du NOUVEAU projet : '; stty -echo; read NOUVEAU; stty echo; echo
export ANCIEN NOUVEAU
```

Tu colles la chaîne, tu tapes Entrée. **Rien ne s'affiche**, et rien
n'entre dans l'historique du terminal. Tout le reste du document ne
parle plus que de `"$ANCIEN"` et `"$NOUVEAU"`.

> Ces deux variables vivent le temps de la fenêtre de terminal. Si tu la
> fermes, retape ces trois lignes.

### L'essai de cinq secondes

```
psql "$ANCIEN" -Atc 'select version();'
psql "$NOUVEAU" -Atc 'select version();'
```

Chacune doit répondre une ligne commençant par `PostgreSQL`. Elle te dit
au passage la version du serveur : ton `pg_dump` doit être au moins
aussi récent.

**Si ça ne répond pas**, ne va pas plus loin : c'est la chaîne ou le
mot de passe. Envoie-moi le message d'erreur — jamais la chaîne.

---

## Étape 2 — la sauvegarde, avant tout

```
sh outils/sauvegarde
```

Elle fabrique `sauvegardes/AAAA-MM-JJ/`. **C'est elle qui contient les
comptes** ; l'étape 4 les y lira. Ne la saute pas.

Et, tant qu'on y est, une copie brute de l'ancien projet, à ranger
hors du dépôt :

```
mkdir -p ~/Desktop/demenagement
pg_dump "$ANCIEN" --schema=public --no-owner --quote-all-identifiers \
  -f ~/Desktop/demenagement/ancien-complet.sql
```

> **Ces fichiers ne vont JAMAIS dans le dépôt** : ils contiennent toutes
> les données. Le Bureau est très bien.

---

## Étape 3 — la forme

### 3a. La prendre dans l'ancien projet

```
pg_dump "$ANCIEN" \
  --schema=public \
  --schema-only \
  --no-owner \
  --clean --if-exists \
  --quote-all-identifiers \
  -f ~/Desktop/demenagement/schema.sql
```

> **À quoi sert `--clean --if-exists`.** Sans lui, la restauration
> s'arrête net sur `schema "public" already exists` : un projet neuf a
> déjà un schéma `public`. Avec lui, le fichier commence par supprimer
> ce qu'il va recréer.

> ### ⚠️ CETTE COMMANDE-LÀ EFFACE — lis ce paragraphe
>
> Le fichier produit par `--clean` **vide le schéma `public` de la cible
> avant de le remplir**. Il supprime chaque table, chaque vue, une par
> une. Sur le projet neuf et vide, c'est sans effet. **Sur un projet qui
> contient des données, il les détruit** — et sans rien demander.
>
> J'ai d'abord écrit ici qu'il « refusait de s'exécuter sur un schéma
> non vide ». **C'était faux.** Le banc l'a montré : rejoué sur une
> cible déjà remplie, il est passé sans une erreur et a tout effacé.
> Mieux vaut que tu l'apprennes de cette phrase que de ta base.
>
> **Donc : jamais sur `$ANCIEN`. Jamais sur une cible déjà remplie.**

### 3b. Le garde-fou, avant de poser

Compte ce que contient déjà le schéma `public` du **nouveau** projet :

```
psql "$NOUVEAU" -Atc "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v','m')"
```

- **Il répond `0`** → le projet est vierge, tu peux poser. Continue.
- **Il répond autre chose** → **arrête-toi**. Ou tu t'es trompé de
  projet, ou une tentative précédente a laissé des choses en place.
  Dis-le-moi, on regarde ensemble avant de rien effacer.

### 3c. La poser dans le nouveau projet

```
psql "$NOUVEAU" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file ~/Desktop/demenagement/schema.sql
```

> `--single-transaction` + `ON_ERROR_STOP=1` : **tout passe, ou rien ne
> passe**. À la moindre erreur, le nouveau projet est laissé exactement
> comme il était. Tu peux recommencer sans rien nettoyer.

### 3d. Une ligne à rajouter

```
psql "$NOUVEAU" -c 'GRANT USAGE ON SCHEMA "public" TO PUBLIC;'
```

> **Pourquoi.** Recréer le schéma `public` lui fait perdre un droit que
> les schémas `public` d'origine possèdent. Sans cette ligne, les deux
> projets ne sont pas tout à fait identiques, et la vérification de
> l'étape 6 le signalerait. Relevé au banc, corrigé ici.

---

## Étape 4 — les comptes

```
NEXT_PUBLIC_SUPABASE_URL='https://xxxxx.supabase.co' \
SUPABASE_SECRET_KEY='la clé secrète du NOUVEAU projet' \
  sh outils/restaurer-comptes sauvegardes/AAAA-MM-JJ
```

Les deux variables en tête **remplacent** celles de `.env.local` le
temps de la commande. Il te fera taper `RESTAURER`.

- `NEXT_PUBLIC_SUPABASE_URL` → yokofolio-us ▸ Settings ▸ **Data API** ▸
  « Project URL »
- `SUPABASE_SECRET_KEY` → yokofolio-us ▸ Settings ▸ **API Keys** ▸ la
  clé **secrète** (service_role)

> ### Les mots de passe ne déménagent pas — et c'est important
>
> Supabase ne rend le mot de passe de personne, pas même à
> l'administration. C'est une protection, pas un manque. Les comptes
> sont donc recréés avec **leur adresse et leur identifiant** —
> l'identifiant étant ce qui relie une personne à ses portfolios — mais
> **sans mot de passe**.
>
> **Conséquence :** chaque personne devra cliquer « mot de passe
> oublié » à sa première connexion. Avec les quelques comptes d'essai
> d'aujourd'hui, c'est une minute de travail. **Préviens-les avant la
> bascule.**
>
> *(Maintenant que `pg_dump` est en place, il existe une autre voie :
> copier aussi la table des comptes, ce qui emporterait les empreintes
> de mots de passe. Elle touche à des tables internes de Supabase et je
> ne peux pas l'éprouver depuis l'atelier. Dis-le-moi si tu la veux, on
> la prépare pour de bon plutôt qu'à l'aveugle.)*

**Vérification —** nouveau projet ▸ **Authentication** ▸ **Users** : le
même nombre de comptes que dans l'ancien, avec les mêmes adresses.

---

## Étape 5 — les données

### 5a. Les prendre

```
pg_dump "$ANCIEN" \
  --schema=public \
  --data-only \
  --no-owner \
  --quote-all-identifiers \
  -f ~/Desktop/demenagement/donnees.sql
```

### 5b. Les poser

```
psql "$NOUVEAU" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' \
  --file ~/Desktop/demenagement/donnees.sql
```

> **`session_replication_role = replica`** met en sommeil, le temps du
> chargement, les vérifications de cohérence entre tables. Sans lui, une
> ligne servie avant celle vers laquelle elle pointe serait refusée, et
> il faudrait trouver le bon ordre pour dix-sept tables. Avec lui,
> l'ordre n'a plus d'importance. Les vérifications reprennent seules à
> la fin — ce réglage ne vaut que pour cette connexion-là.

> **Ce que `pg_dump` fait mieux que ce que j'avais écrit :** il conserve
> les **identifiants** exacts, y compris ceux des trois tables que
> PostgreSQL numérote lui-même (`clics_fiches`, `messages_yokofolio`,
> `signalements_fiches`), et il **repositionne les compteurs** derrière.
> Mon script devait les abandonner. Relevé au banc.

---

## Étape 6 — la vérification

**C'est l'étape à ne pas sauter.** On compare les deux formes en
demandant à `pg_dump` de les décrire, et on regarde si les deux
descriptions sont les mêmes :

```
pg_dump "$ANCIEN"  --schema=public --schema-only --no-owner --quote-all-identifiers \
  | grep -vE '^\\(un)?restrict|^--|^$' > ~/Desktop/demenagement/forme-ancien.txt
pg_dump "$NOUVEAU" --schema=public --schema-only --no-owner --quote-all-identifiers \
  | grep -vE '^\\(un)?restrict|^--|^$' > ~/Desktop/demenagement/forme-nouveau.txt

diff ~/Desktop/demenagement/forme-ancien.txt ~/Desktop/demenagement/forme-nouveau.txt \
  && echo "IDENTIQUES"
```

- **`IDENTIQUES` s'affiche** → les deux schémas sont les mêmes, colonne
  par colonne, droit par droit. Continue.
- **Des lignes s'affichent** → regarde le paragraphe ci-dessous avant de
  t'inquiéter.

> ### Deux écarts de DROITS sont attendus, et ils se comblent
>
> Le `DROP SCHEMA` de l'étape 3 emporte deux choses que la restauration
> ne remet pas toutes :
>
> - **l'USAGE du schéma pour tout le monde** — d'où un
>   `REVOKE USAGE ON SCHEMA "public" FROM PUBLIC` côté nouveau, et le
>   changement de propriétaire du schéma ;
> - **les droits par défaut** (« quand tel rôle crée une table ici,
>   donne-la d'office à anon/authenticated/service_role »). Ils vivent
>   dans un catalogue indexé par schéma : supprimer le schéma les
>   efface. Ceux du rôle `postgres` repassent avec le fichier ; ceux de
>   `supabase_admin` sont refusés, parce qu'on ne peut poser les droits
>   par défaut d'un rôle dont on n'est pas membre.
>
> **Ce n'est pas grave et rien n'est perdu** : les 17 tables ont bien
> reçu leurs droits (c'est ce qui fait marcher le site), et les tables
> que tu créeras ensuite dépendent des droits par défaut de `postgres`,
> qui sont intacts.
>
> **Pour combler :** `supabase/combler-ecarts-de-droits.sql`, bloc par
> bloc. Tout y est expliqué, y compris ce qui sera refusé et pourquoi.
>
> Tout autre écart — une colonne, une vue, une règle — n'est PAS
> attendu : arrête-toi et envoie-le-moi.

> Le `grep -v` écarte trois sortes de lignes sans intérêt : les
> commentaires, les lignes vides, et deux lignes techniques que
> `pg_dump` change à chaque exécution.

**Et les lignes**, tant qu'on y est :

```
psql "$ANCIEN"  -Atc "select 'fiches '||count(*) from public.tatoueurs" 
psql "$NOUVEAU" -Atc "select 'fiches '||count(*) from public.tatoueurs"
psql "$ANCIEN"  -Atc "select 'photos '||count(*) from public.photos_tatoueur"
psql "$NOUVEAU" -Atc "select 'photos '||count(*) from public.photos_tatoueur"
```

Les nombres doivent être égaux deux à deux.

---

## Étape 7 — les photos

**Avant tout :** crée le seau dans le nouveau projet ▸ **Storage** ▸
**New bucket** :

- nom : `photos-tatoueurs` (au caractère près) ;
- **Public bucket : OUI**. Les photos des portfolios s'affichent pour
  tout le monde, sans jeton — c'est ainsi dans l'ancien projet, et le
  site construit ses adresses en le supposant. Un seau privé donnerait
  des portfolios vides.

Puis, **à blanc** d'abord (il compte, il ne copie rien) :

```
CIBLE_URL='https://xxxxx.supabase.co' \
CIBLE_SECRET_KEY='la clé secrète du NOUVEAU projet' \
  sh outils/demenager-photos
```

Quand le compte te va :

```
CIBLE_URL='…' CIBLE_SECRET_KEY='…' \
  sh outils/demenager-photos --reel
```

> Il ne copie que ce qui manque, ne réécrit jamais par-dessus, et ne
> lit que l'ancien projet. Relancé après une coupure, il reprend où il
> en était. **C'est le plus long des quatre** : compte plusieurs
> minutes. Il s'arrête tout seul au bout de dix échecs d'affilée — c'est
> le signe que le seau n'existe pas ou que la clé n'est pas la bonne.

---

## Étape 8 — les réglages, écran par écran

Ce qui ne vit pas dans le SQL et qu'aucun outil ne peut deviner.
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
- le seau `photos-tatoueurs`, public (étape 7).

### Comparer plutôt que se souvenir
Garde les deux projets ouverts côte à côte dans deux onglets et passe
d'un écran à l'autre. C'est plus sûr que de se fier à sa mémoire.

---

## Étape 9 — la bascule

C'est **le seul moment** où la production change de base.

### 9a. Vercel

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

> L'équipe Vercel s'appelle désormais **yokofolio-team** (renommée le
> 31-08-2026). Le script `d` le sait : il porte ce nom-là.

### 9b. Ton Mac

Le fichier `~/.yokofolio/env.local` porte la clé secrète que `sh livre`
remet en place à chaque livraison. Remplaces-y la ligne
`SUPABASE_SECRET_KEY=` par celle du **nouveau** projet, et
`NEXT_PUBLIC_SUPABASE_URL=` par la nouvelle adresse si elle y figure.

> Tant que tu ne l'as pas fait, ton dossier local continue de parler à
> l'ancien projet. Ce n'est pas grave — c'est même pratique pour
> comparer — mais il faut le savoir.

---

## Étape 10 — le contrôle, dans cet ordre

Sur le site en ligne, après le redéploiement :

1. **La recherche** — ouvre `/recherche`, choisis un style : des fiches
   apparaissent, avec leurs villes.
2. **Une fiche** — ouvre-en une : le portfolio s'affiche, les photos se
   chargent (c'est l'étape 7 qui se vérifie ici).
3. **La connexion** — connecte-toi. Si c'est un compte déménagé, passe
   par « mot de passe oublié » : le courriel doit arriver, et le lien
   doit ramener sur le site (c'est le réglage 8 « URL Configuration »).
4. **Le formulaire** — ouvre ton portfolio, change un mot, enregistre,
   recharge : le changement tient.
5. **Une photo** — ajoute une photo, recharge : elle est là. C'est
   l'écriture dans le nouveau seau qui se vérifie.
6. **Les favoris** — mets une photo en favori, va sur « Ma sélection ».
7. **Les notifications** — la cloche s'ouvre sans erreur.

Si l'un de ces sept points échoue, **ne cherche pas longtemps** :
reviens en arrière (étape 11) et envoie-moi ce que tu as vu. Le site
remarche en trois minutes, et on regarde à froid.

---

## Étape 11 — le retour arrière

**Il tient en trois variables.** Sur Vercel, remets les trois anciennes
valeurs, redéploie : le site reparle à l'Irlande, avec toutes ses
données, comme si rien ne s'était passé. Remets aussi l'ancienne clé
dans `~/.yokofolio/env.local`.

**Rien n'est perdu**, parce que rien n'a été retiré de l'ancien projet :
`pg_dump` n'y a fait que des lectures.

---

## Étape 12 — supprimer l'ancien projet

**Pas tout de suite.** Laisse tourner le nouveau **plusieurs jours**,
avec de vrais passages, avant d'y toucher. Il n'y a aucun avantage à
supprimer vite, et un inconvénient évident.

Avant de supprimer, refais une **sauvegarde de l'ancien** et range-la
ailleurs que sur le Mac. Une suppression de projet Supabase ne se
défait pas.

---

## Ce qui ne déménage pas, et qu'il faut savoir

- **les mots de passe** — voir l'étape 4 ;
- **les identifiants des fournisseurs de connexion** (Google, etc.) —
  à recoller, voir l'étape 8 ;
- **les gabarits de courriels** modifiés — à recopier ;
- **l'historique** : journaux, statistiques d'usage du tableau de bord
  Supabase. Ils appartiennent au projet, pas aux données ;
- **la latence** change, et c'est le but : le nouveau projet est aux
  États-Unis. Depuis la France, les écritures seront un peu plus
  lentes ; depuis l'Amérique, bien plus rapides.

En revanche, et contrairement à ce que disait la version précédente de
ce document, **les identifiants de lignes et les compteurs déménagent
à l'identique** : c'est `pg_dump` qui s'en charge.

---

## Ce qui a été éprouvé, et ce qui ne l'a pas été

**Éprouvé au banc**, sur un vrai PostgreSQL, du début à la fin : les
deux `pg_dump`, les deux `psql`, le `GRANT` de l'étape 3d, la
restauration des comptes avant les données, et la comparaison de
l'étape 6 — qui rend bien `IDENTIQUES`, et qui rendait une différence
avant qu'on ajoute le `GRANT`. Les comptes de lignes et les compteurs
de séquences correspondent des deux côtés.

Le banc a aussi **démenti une phrase que j'avais écrite** : je
prétendais que la restauration du schéma refuserait de s'exécuter sur
une cible non vide. Essayé : elle passe, et elle efface. D'où
l'avertissement et le décompte de l'étape 3b.

**Pas éprouvé :** les particularités propres à Supabase — la connexion
par le Session pooler, et le comportement de leur serveur sur un
`DROP SCHEMA`. Ce sont les seuls endroits où une surprise reste
possible. Si l'un des deux te résiste, l'étape s'arrête proprement
(`ON_ERROR_STOP`) sans rien abîmer : envoie-moi le message.
