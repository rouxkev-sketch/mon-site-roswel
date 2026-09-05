# SQL nº 852 — le compteur de vues des portfolios

> **À COLLER À LA MAIN**, dans l'éditeur SQL de Supabase. Cette passe
> ne l'exécute pas, comme toujours (règle du propriétaire, nº 808).
>
> ✅ **PASSÉ EN BASE PAR LE PROPRIÉTAIRE** (avant la passe nº 853) : la
> colonne et la fonction existent. Le site les emploie depuis la
> nº 853-§6 — ce document reste ici comme mémoire de ce qui a été
> exécuté, et pour la base de secours le jour d'un déménagement.

## Pourquoi ce document

La passe nº 852-§7 ajoute au pied des cartes du fil, à gauche du
signalement, **une icône statistiques précédée du nombre de vues**
(« 28 » puis l'icône). Le dessin et sa place sont faits ; le NOMBRE,
lui, n'a **aucune source** :

- aucune colonne `vues` sur `tatoueurs` ni sur `photos_tatoueur` ;
- aucune table de statistiques ;
- aucun signal de vue dans le classement.

Vérifié dans le code et dans la base. **Rien n'a été inventé en
attendant** : sans nombre, le bloc ne se rend pas du tout — un « 28 »
de démonstration serait un chiffre public faux, et c'est le pire des
deux maux.

Ce document donne le SQL qui crée le compteur. Le jour où il est passé,
il restera **une seule ligne à écrire côté site** (ajouter `vues` à la
lecture des fiches, puis la passer au pied de la carte) : c'est une
passe de dix minutes, dis-le et je la fais.

## 1 · La colonne

```sql
alter table public.tatoueurs
  add column if not exists vues integer not null default 0;

comment on column public.tatoueurs.vues is
  'Nombre de vues du portfolio (compteur nº 852). Incrémenté par
   public.compter_vue_portfolio ; jamais écrit directement.';
```

## 2 · La fonction qui compte

Une fonction, et non un `update` ouvert : personne ne doit pouvoir
écrire ce nombre à la main depuis le navigateur.

```sql
create or replace function public.compter_vue_portfolio(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tatoueurs
     set vues = vues + 1
   where slug = p_slug
     and publie
     and supprime_le is null;
$$;

revoke all on function public.compter_vue_portfolio(text) from public;
grant execute on function public.compter_vue_portfolio(text) to anon, authenticated;
```

## 3 · La lecture

`vues` est une colonne publique en LECTURE : elle suit les règles de
`tatoueurs` (RLS), aucune politique nouvelle n'est nécessaire.

## 4 · Ce que le site en fait (nº 853-§6)

- **une vue est comptée à l'ouverture d'un profil** : le composant déjà
  posé sur la fiche publique (`CompteurConsultation`) appelle la
  fonction, à côté de la balise de popularité qu'il envoyait déjà. Les
  deux comptent le même geste et ne se mélangent pas : la popularité
  nourrit le classement (dédoublonnée en base, par visiteur et par
  jour) ; la vue se montre (dédoublonnée par session et par heure) ;
- **le garde-fou vit dans le navigateur** (`lib/vue-portfolio`) : une
  vue par portfolio et par session/heure, comme demandé. Ce n'est pas
  une protection contre la fraude — qui veut gonfler son compteur peut
  vider son magasin —, c'est un garde-fou d'usage ;
- **la route** `POST /api/tatoueur/vue` appelle la fonction avec le
  client ANONYME (la fonction porte les droits, la route n'en a pas
  besoin). Elle répond toujours « ok » : une balise n'attend rien ;
- **le nombre est lu avec la fiche** (colonne `vues`, ajoutée à la liste
  des colonnes publiques) et s'affiche au pied des cartes du fil, à
  partir de UNE vue — un « 0 » partout ne dirait rien.

## 5 · Ce qu'il restera à décider

- **compte-t-on une vue par visite ou par visiteur ?** Le SQL ci-dessus
  compte chaque appel. Un garde-fou par session (une vue par portfolio
  et par heure, par exemple) se pose côté site, pas ici ;
- **le cache** : les pages de résultats sont mises en cache cinq
  minutes (`rafraichirToutLeSite`, src/lib/rafraichir.ts). Le nombre
  affiché sur une carte peut donc avoir jusqu'à cinq minutes de retard.
  C'est sans importance pour un compteur de vues, mais il faut le
  savoir avant de s'étonner.
