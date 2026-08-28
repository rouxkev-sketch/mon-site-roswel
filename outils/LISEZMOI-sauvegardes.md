# Les sauvegardes de la base — mode d'emploi

*(passes nº 689 et nº 690 — écrit pour Kevin, pas pour un développeur)*

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

### Il avance sous tes yeux *(passe nº 690)*

Pendant qu'il travaille, il écrit où il en est :

```
   7/40 · photos_tatoueur · 1840 lignes
```

Une vraie base prend des minutes — surtout les photos, téléchargées une
par une. **Tant qu'une ligne bouge, tout va bien.** Si elle reste
bloquée sur une table, tu sais laquelle, et tu peux me le dire.

Et il ne peut plus rester bloqué indéfiniment : chaque lecture a un
délai de garde (60 secondes par page, 30 par photo). Passé ce délai, il
le dit, **passe à la suite**, et le résumé final liste ce qui a manqué.
Si une table de ta base demande vraiment plus de temps :

```
DELAI_LECTURE=180 sh outils/sauvegarde
```

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

**Une commande, en nommant la sauvegarde** *(passe nº 690)* :

```
sh outils/restaurer-comptes sauvegardes/2026-08-28
```

Il te montre ce qu'il compte faire, puis te demande de **taper
RESTAURER**. Tant que tu ne l'as pas tapé, rien n'est créé.

```
  Comptes du fichier : 58
  Déjà en base       : 12  (ils ne seront pas touchés)
  À créer            : 46

  Tape RESTAURER pour créer ces 46 comptes :
```

Ce que tu dois voir à la fin :

```
    46 compte(s) créé(s)
    12 ignoré(s) — déjà en base

  ✔  Relu : tous les comptes créés sont bien en base.
```

**Ses quatre garde-fous**, pour que tu saches ce qu'il ne peut pas
faire :

| | |
|---|---|
| Il ne devine rien | Sans dossier nommé, il s'arrête. Il ne va pas « prendre la plus récente » tout seul. |
| Il fait taper le mot | RESTAURER, comme pour supprimer un portfolio. |
| Il ne touche **jamais** un compte existant | Une adresse déjà connue est ignorée, et il le dit ligne par ligne. Il ne sait qu'**ajouter** ce qui manque — il ne modifie, n'écrase et ne supprime rien. |
| Il se relit | À la fin il redemande la liste à la base et vérifie que les comptes créés y sont. |

Tu peux donc le relancer sans risque : la seconde fois, il dira
« Rien à faire : tous ces comptes existent déjà ».

⚠️ **Les mots de passe ne se restaurent pas.** Préviens les gens : ils
cliquent sur « mot de passe oublié » et en choisissent un nouveau.
C'est Supabase qui ne les rend à personne — une protection, pas un
manque.

⚠️ **Si tu vois « créé avec un AUTRE identifiant »**, arrête-toi et
dis-le-moi. L'identifiant est ce qui relie une personne à ses
portfolios : un compte recréé sous un autre numéro serait un étranger
pour ses propres fiches. Le script le détecte et le nomme plutôt que de
te laisser le découvrir plus tard.

*(Faire cette étape à la main reste possible — Supabase →
**Authentication** → **Users** → **Add user**, en recopiant l'`id` du
fichier `comptes.json` dans le champ *User UID*. C'est simplement long
dès qu'il y a plus de quelques comptes.)*

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
