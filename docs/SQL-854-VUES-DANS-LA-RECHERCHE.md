# SQL nº 854 — `vues` dans la fiche de la recherche (FACULTATIF)

> **À COLLER À LA MAIN**, dans l'éditeur SQL de Supabase. Cette passe
> ne l'exécute pas, comme toujours (règle du propriétaire, nº 808).
>
> ⚠️ **RIEN NE PRESSE, ET RIEN N'EN DÉPEND.** Le bogue nº 853 est
> corrigé **côté site**, dans la livraison nº 854 : le nombre de vues
> arrive aux cartes du fil avec la base telle qu'elle est aujourd'hui.
> Ce SQL-ci ne répare rien — il ÉPARGNE une petite lecture. À passer
> quand tu veux, ou jamais.

## Ce qui n'allait pas, et pourquoi

Le bloc « vues + icône statistiques » n'apparaissait sur **aucune**
carte du fil, en production, quoi qu'on fasse. Deux causes, et deux
seulement :

**1 · La recherche ne lit pas des colonnes — elle appelle une
fonction.** Les résultats viennent de `public.rechercher_tatoueurs`,
qui **fabrique** sa fiche champ par champ : un `jsonb_build_object` de
trente-trois entrées, écrites à la main dans
`supabase/yokofolio-recherche-sans-masquage.sql` (migration nº 66).
`vues` n'y figure pas — et ne pouvait pas y figurer : **la colonne est
née après la fonction** (SQL nº 852). La fiche arrivait donc au site
sans le champ, et le pied de carte n'avait rien à montrer.

> Ce n'est **ni un droit de lecture** (les politiques de `tatoueurs`
> n'ont pas bougé : la page d'un profil, elle, lisait bien `vues`),
> **ni le cache** (cinq minutes suffisaient), **ni un déploiement
> manqué**. C'est une **sélection de champs**, dans la fonction.

**2 · Le bloc se cachait à zéro.** La nº 853 le rendait à partir d'une
vue (`vues > 0`), pour ne pas couvrir un site neuf de « 0 ». Tu as
tranché : il doit **afficher « 0 »**. C'est fait.

## Ce que la livraison nº 854 fait, elle, sans rien te demander

`lib/tatoueurs` recolle le nombre sur les fiches rendues par la
fonction : une lecture de deux colonnes (`slug, vues`) pour les
vingt-quatre fiches de la page, juste après la recherche. C'est la
règle de la maison — **aucune version du site n'exige une migration
pour fonctionner** — et ça marche avec la fonction telle qu'elle est.
La moindre erreur (colonne absente, base injoignable) rend les fiches
telles quelles : on perd le nombre, jamais les résultats.

## Le SQL, si tu veux épargner cette lecture

Il **remplace** la fonction par elle-même, une seule ligne en plus dans
la fiche. Le corps est celui de la migration nº 66, au caractère près,
sauf cette ligne. À passer **après** la nº 66 et **après** le SQL
nº 852 (qui crée la colonne).

```sql
--  On ne réécrit pas les 300 lignes de la fonction : on lui ajoute le
--  champ manquant, à l'endroit exact où les autres sont posés.
--  MODE D'EMPLOI, en trois gestes, dans l'éditeur SQL :
--   1. ouvrir supabase/yokofolio-recherche-sans-masquage.sql ;
--   2. dans son `jsonb_build_object`, ajouter la ligne
--         'vues', s.vues,
--      juste après la ligne  'publie', s.publie,  ;
--   3. exécuter le fichier entier tel quel.
--  Rejouable, et sans effet de bord : `create or replace` remplace la
--  fonction, rien d'autre.
```

**Vérifier ensuite** que le champ y est (aucune donnée personnelle
n'est affichée : un slug et un nombre) :

```sql
select (fiche->>'slug') as slug,
       (fiche->>'vues') as vues
from public.rechercher_tatoueurs(p_limite => 3);
```

Trois lignes avec une colonne `vues` remplie : c'est passé. Une colonne
`vues` vide (`null`) : la ligne n'a pas été ajoutée au bon endroit.

## Et le site, lui, ne bouge pas

Que ce SQL soit passé ou non, **l'écran est le même** : la lecture de
rattrapage rend simplement le même nombre que la fiche portera. Le jour
où tu l'auras passé, dis-le — on retirera la lecture de rattrapage en
deux lignes.

> ⚠️ **LE CACHE, COMME TOUJOURS** : les pages de résultats sont mises en
> cache cinq minutes. Une écriture SQL n'est donc visible à l'écran
> qu'après ce délai — ou tout de suite, si un geste depuis
> l'administration invalide le site (`rafraichirToutLeSite`,
> `src/lib/rafraichir.ts`).
