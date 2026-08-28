# Les sauvegardes de la base — mode d'emploi

*(passe nº 689 — écrit pour Kevin, pas pour un développeur)*

---

## 1. Faire une sauvegarde

Sur ton Mac, dans le dossier du projet :

```
sh outils/sauvegarde
```

C'est tout. Ça dure de quelques secondes à quelques minutes selon le
nombre de photos.

Le résultat arrive dans un dossier daté :

```
sauvegardes/2026-08-28/
```

Si tu relances le même jour, tu obtiens `2026-08-28-2`, puis `-3` :
**une sauvegarde n'écrase jamais une autre.**

### Ce que tu dois voir à la fin

```
  ──────────────────────────────────────────────
        127 lignes  tatoueurs                 412 ko
       1840 lignes  photos_tatoueur           2.1 Mo
        …
  ──────────────────────────────────────────────
    24 tables · 3 190 lignes · 3.4 Mo
    58 comptes
    1 840 photos · 214.7 Mo
    TOTAL : 218.1 Mo
  ──────────────────────────────────────────────

  ✔  Sauvegarde vérifiée : tout est relu et complet.
```

La dernière ligne est celle qui compte. **`✔ Sauvegarde vérifiée`**
veut dire que le script a **relu** ce qu'il venait d'écrire, et que
les comptes correspondent.

S'il affiche `⚠` à la place, la sauvegarde existe quand même — il te
dit juste ce qui n'a pas pu être copié, et pourquoi. Le détail complet
est toujours dans `resume.json`, au fond du dossier.

### Ce qui n'est PAS sauvegardé, et pourquoi

| | |
|---|---|
| **Les mots de passe** | Supabase ne les rend à personne, même à l'administration. C'est une protection, pas un manque. Après une restauration, les gens devront demander un nouveau mot de passe (« mot de passe oublié »). |
| **La forme des tables** (le schéma) | Elle est déjà sauvegardée, et mieux : les fichiers `supabase/*.sql` du projet la reconstruisent, et ils sont dans **chaque zip** que je te livre. |

### Où ranger les sauvegardes

Le dossier `sauvegardes/` **ne part jamais dans un zip ni sur GitHub** :
il contient des données personnelles (adresses, messages). Il reste
chez toi.

Le conseil, en une phrase : **copie le dossier daté sur un disque
externe ou dans ton iCloud** après chaque sauvegarde. Une sauvegarde
qui vit sur le même Mac que le reste ne protège que d'une erreur, pas
d'un vol ni d'une panne de disque.

---

## 2. Remettre une sauvegarde en place

> **À lire d'abord.** Restaurer, c'est **écraser** ce qu'il y a
> aujourd'hui. On ne le fait que si la base est vraiment perdue ou
> corrompue. Et on commence **toujours** par faire une sauvegarde de
> l'état actuel, même s'il est mauvais : `sh outils/sauvegarde`.

### Étape 1 — Remonter la FORME des tables

Dans Supabase → **SQL Editor**, exécute les fichiers du dossier
`supabase/` du projet. L'ordre compte : commence par `tatoueurs.sql`,
puis les autres migrations dans l'ordre de leurs numéros (le nom de
chaque fichier dit ce qu'il fait).

À la fin, tu dois avoir toutes les tables — vides.

### Étape 2 — Remonter les COMPTES

C'est la première chose, avant les données : les portfolios pointent
vers des comptes, et une base sans comptes les refusera.

Dans Supabase → **Authentication** → **Users** → bouton **Add user**.
Le fichier `comptes.json` de ta sauvegarde donne, pour chaque
personne : son identifiant (`id`), son adresse (`email`), la date
d'inscription.

⚠️ **L'identifiant doit être recopié à l'identique.** C'est lui qui
relie une personne à ses portfolios. Supabase permet de le fixer à la
création (champ *User UID*).

⚠️ Les mots de passe ne se restaurent pas. Préviens les gens : ils
cliquent sur « mot de passe oublié » et en choisissent un nouveau.

> S'il y a beaucoup de comptes, dis-le-moi : je t'écris un petit
> script qui les recrée un par un à partir de `comptes.json`. Je ne
> l'ai pas fait d'avance parce qu'un outil qui CRÉE des comptes est un
> outil dangereux à laisser traîner — et cette passe-ci devait rester
> en lecture seule.

### Étape 3 — Remonter les DONNÉES

Dans Supabase → **Table Editor**, choisis une table, puis
**Insert** → **Import data from CSV**… mais nos fichiers sont en JSON.
Le chemin le plus simple passe par le **SQL Editor** :

1. ouvre `sauvegardes/<date>/tables/tatoueurs.json` ;
2. dans le SQL Editor, colle :

```sql
insert into public.tatoueurs
select * from json_populate_recordset(null::public.tatoueurs, '<<COLLE LE CONTENU DU FICHIER ICI>>');
```

3. remplace `<<COLLE LE CONTENU DU FICHIER ICI>>` par le contenu
   entier du fichier `.json` (c'est un tableau, entre `[` et `]`) ;
4. exécute.

**L'ordre des tables compte**, parce qu'elles se pointent les unes les
autres. Fais-les dans cet ordre :

1. `tatoueurs`
2. `photos_tatoueur`, `modes_exercice`, `studios`
3. `liaisons_artiste_salon`, `notifications_compte`
4. `favoris_photos`, `tatoueurs_suivis`, `clics_fiches`
5. tout le reste, dans n'importe quel ordre

Si une insertion se plaint d'une **clé étrangère**, c'est qu'une table
d'avant n'est pas encore remontée : remonte-la d'abord.

> Les **vues** (`popularite_tatoueurs`, `equipe_salon`, `clics_tatoueurs`…)
> ne se restaurent pas et n'ont pas à l'être : ce sont des calculs sur
> les tables, refaits tout seuls. Elles sont dans la sauvegarde parce
> qu'il vaut mieux copier trop que pas assez, mais tu peux les ignorer.

### Étape 4 — Remonter les PHOTOS

Dans Supabase → **Storage** → panier `photos-tatoueurs`.

Le dossier `sauvegardes/<date>/stockage/photos-tatoueurs/` a
exactement la même organisation : un dossier par compte, les fichiers
dedans. Glisse-dépose les dossiers dans Supabase, en gardant
la même arborescence.

⚠️ **Les noms de fichiers doivent être identiques** : ce sont eux que
la base cite dans ses adresses de photos.

### Étape 5 — Vérifier

1. ouvre le site ;
2. cherche un tatoueur : la mosaïque doit se remplir ;
3. ouvre un portfolio : les photos doivent s'afficher ;
4. connecte-toi : « Mon espace » doit retrouver ton portfolio.

Si les photos manquent mais que les fiches sont là, c'est l'étape 4
qui est incomplète. Si les fiches manquent, c'est l'étape 3.

---

## 3. À quelle fréquence ?

Il n'y a pas de bonne réponse universelle, mais une règle simple :
**tu perds tout ce qui s'est passé depuis la dernière sauvegarde.**

- si des tatoueurs s'inscrivent chaque semaine : une fois par semaine ;
- juste avant chaque changement important (une migration, une mise en
  ligne qui touche la base) : toujours ;
- sinon : une fois par mois, c'est déjà énorme comparé à zéro.

Le plan gratuit de Supabase **ne fait aucune sauvegarde automatique**.
Celle-ci vaut exactement ce que vaut ta régularité — c'est sa force et
sa faiblesse, et il vaut mieux le savoir.
