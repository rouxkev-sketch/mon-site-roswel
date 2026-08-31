-- ============================================================
--  nº 766 ter — LIRE LE SCHÉMA RÉEL DE L'ANCIEN PROJET
--  À coller dans l'éditeur SQL de l'ANCIEN projet (Irlande).
-- ============================================================
--  POURQUOI CE FICHIER EXISTE. Le premier schéma livré était bâti en
--  REJOUANT LES MIGRATIONS DU DÉPÔT. C'était l'erreur : le dépôt n'est
--  pas le miroir de la base. Des colonnes ont été ajoutées à la main
--  au fil des passes, directement dans Supabase, sans jamais passer
--  par une migration — `filtres_motif` en est une, elle n'existe nulle
--  part dans le dépôt. Un schéma tiré du dépôt ne peut décrire que
--  l'idée que le dépôt se fait de la base.
--  Celui-ci lit LA VRAIE BASE. C'est elle qui fait foi, et elle seule.
--
--  ⚠️ IL NE MODIFIE RIEN. Il ne fait que LIRE les catalogues de
--  PostgreSQL (`pg_class`, `pg_attribute`, …) et fabriquer du texte.
--  Aucun CREATE, aucun ALTER, aucun DROP, aucune donnée touchée. Tu
--  peux le lancer sur le projet en production sans crainte.
--
--  ⚠️ IL NE LIT AUCUNE DONNÉE ET AUCUNE CLÉ. Il ne regarde que la
--  FORME des tables (noms de colonnes, types, règles), jamais leur
--  contenu.
--
-- ============================================================
--  CE QUI A CHANGÉ À LA nº 766 ter, ET POURQUOI
--  ------------------------------------------------------------
--  La version précédente échouait dans l'éditeur de Supabase :
--      ERROR: 42P01: relation "public" does not exist
--  Elle employait le raccourci `'public'::regnamespace` pour désigner
--  le schéma. Ce raccourci passe sur un PostgreSQL ordinaire — il a
--  été éprouvé ici — mais l'éditeur de Supabase le lit autrement, et
--  cherche alors une TABLE nommée « public », qui n'existe pas.
--  Le raccourci a donc disparu : plus aucun `::regnamespace` ni
--  `::regclass` dans ce fichier. Les schémas et les catalogues sont
--  désignés par des jointures écrites en toutes lettres, qui ne
--  peuvent se lire que d'une seule façon.
--
-- ============================================================
--  L'ESSAI DE CINQ SECONDES, AVANT DE COLLER LE RESTE
--  ------------------------------------------------------------
--  Je n'ai pas l'éditeur de Supabase sous la main : je ne peux donc
--  pas éprouver ce fichier là où il tourne. Plutôt que de te faire
--  coller trois cents lignes pour rien, colle D'ABORD cette
--  seule ligne, qui emploie exactement la construction corrigée :
--
--      select count(*) from pg_class c
--        join pg_namespace n on n.oid = c.relnamespace
--        where n.nspname = 'public';
--
--  Elle doit rendre UN NOMBRE (le nombre de tables, vues et index du
--  schéma public — quelques dizaines). Si elle le rend, le gros
--  fichier passera. Si elle échoue, envoie-moi l'erreur : c'est que
--  l'éditeur bute sur autre chose, et je saurai quoi.
--
-- ============================================================
--  CE QUE TU EN FAIS, DANS L'ORDRE
--  ------------------------------------------------------------
--   1. Colle tout ce fichier dans l'éditeur SQL de l'ANCIEN projet,
--      et lance (« Run »).
--   2. Sous le résultat, bouton « Download CSV ». Tu obtiens un
--      fichier, par exemple ~/Downloads/resultat.csv.
--   3. Dans le dossier du projet, sur ton Mac :
--
--          sh outils/assembler-schema ~/Downloads/resultat.csv
--
--      Il écrit `supabase/yokofolio-schema-reel.sql`.
--   4. C'est CE fichier-là que tu colles dans le NOUVEAU projet
--      (vide), et plus jamais l'ancien.
--   5. Pour vérifier que les deux se ressemblent : colle
--      `supabase/766-empreinte-schema.sql` dans CHACUN des deux
--      projets et compare les deux résultats ligne à ligne.
-- ============================================================

--  `recursive` sert au seul calcul de profondeur des vues, plus bas :
--  une vue peut en lire une autre, il faut donc les ranger.
with recursive

--  ── LE SCHÉMA QU'ON LIT, nommé une seule fois. Tout le reste s'y
--     rattache par une jointure ordinaire. C'est la disparition du
--     raccourci `::regnamespace` qui a coûté la passe précédente.
schema_lu as (
  select n.oid
  from pg_namespace n
  where n.nspname = 'public'
),

--  ── LES DEUX CATALOGUES qu'on doit désigner par leur numéro, eux
--     aussi en toutes lettres plutôt que par `::regclass`.
cat_classe as (
  select c.oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'pg_class' and n.nspname = 'pg_catalog'
),
cat_reecriture as (
  select c.oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'pg_rewrite' and n.nspname = 'pg_catalog'
),

--  ── Les tables ordinaires du schéma public, et rien d'autre.
tables_ as (
  select c.oid, c.relname
  from pg_class c
  join schema_lu s on s.oid = c.relnamespace
  where c.relkind = 'r'
),

--  ── LES COLONNES, avec tout ce qui les définit : le type exact, le
--     « pas vide », la valeur par défaut, et — le point qui nous a
--     coûté une passe — les colonnes AUTOMATIQUES (identity) et
--     CALCULÉES (generated).
colonnes as (
  select
    t.oid,
    t.relname,
    a.attnum,
    '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
    || case a.attidentity
         when 'a' then ' generated always as identity'
         when 'd' then ' generated by default as identity'
         else '' end
    || case when a.attgenerated = 's'
         then ' generated always as (' || pg_get_expr(d.adbin, d.adrelid) || ') stored'
         else '' end
    || case when a.atthasdef and a.attgenerated = '' and a.attidentity = ''
         then ' default ' || pg_get_expr(d.adbin, d.adrelid)
         else '' end
    || case when a.attnotnull then ' not null' else '' end as texte
  from tables_ t
  join pg_attribute a on a.attrelid = t.oid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attnum > 0
    and not a.attisdropped
),

--  ── LES SÉQUENCES autonomes (celles des colonnes `serial`). Les
--     séquences d'une colonne `identity` viennent avec la colonne :
--     on ne les crée pas deux fois.
sequences_ as (
  select c.oid, c.relname
  from pg_class c
  join schema_lu s on s.oid = c.relnamespace
  where c.relkind = 'S'
    and not exists (
      select 1
      from pg_depend dep
      join cat_classe cc on cc.oid = dep.classid
      join pg_attribute a on a.attrelid = dep.refobjid and a.attnum = dep.refobjsubid
      where dep.objid = c.oid
        and dep.deptype = 'i'
        and a.attidentity <> ''
    )
),

--  ── LES VUES, RANGÉES PAR PROFONDEUR. Une vue qui en lit une autre
--     doit être créée APRÈS elle : on calcule donc combien de vues
--     chaque vue traverse avant d'être posable.
liens_vues as (
  select distinct fille.oid as vue, mere.oid as socle
  from pg_depend d
  join cat_reecriture cr on cr.oid = d.classid
  join pg_rewrite r on r.oid = d.objid
  join pg_class fille on fille.oid = r.ev_class
  join pg_class mere on mere.oid = d.refobjid
  join schema_lu sf on sf.oid = fille.relnamespace
  join schema_lu sm on sm.oid = mere.relnamespace
  where fille.relkind in ('v', 'm')
    and mere.relkind in ('v', 'm')
    and fille.oid <> mere.oid
),
profondeur as (
  select c.oid, 0 as n
  from pg_class c
  join schema_lu s on s.oid = c.relnamespace
  where c.relkind in ('v', 'm')
    and not exists (select 1 from liens_vues l where l.vue = c.oid)
  union all
  select l.vue, p.n + 1
  from liens_vues l
  join profondeur p on p.oid = l.socle
),
vues as (
  select c.oid, c.relname, c.relkind, coalesce(max(p.n), 0) as etage
  from pg_class c
  join schema_lu s on s.oid = c.relnamespace
  left join profondeur p on p.oid = c.oid
  where c.relkind in ('v', 'm')
  group by c.oid, c.relname, c.relkind
),

--  ── TOUT LE SCRIPT, MORCEAU PAR MORCEAU. Le premier nombre est
--     l'ORDRE DE POSE : il n'est pas décoratif, c'est lui qui fait que
--     le fichier se rejoue d'un bloc sans rien casser.
morceaux as (

  --  0 · les réglages d'entrée. `check_function_bodies = false`
  --  autorise une fonction à nommer une table pas encore créée : sans
  --  lui, rien ne passe.
  select 0 as bloc, 0 as rang, 'set check_function_bodies = false;' as texte
  union all
  select 0, 1, 'set search_path = public;'

  --  1 · LES FONCTIONS, avant tout le reste.
  union all
  select 1, row_number() over (order by p.proname),
         pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  join schema_lu s on s.oid = p.pronamespace
  where p.prokind in ('f', 'p')

  --  2 · LES SÉQUENCES autonomes.
  union all
  select 2, row_number() over (order by q.relname),
         'create sequence if not exists public.' || quote_ident(q.relname) || ';'
  from sequences_ q

  --  3 · LES TABLES, colonnes seules — aucune contrainte encore.
  union all
  select 3, row_number() over (order by t.relname),
         'create table public.' || quote_ident(t.relname) || ' (' || chr(10)
         || (select string_agg(c.texte, ',' || chr(10) order by c.attnum)
             from colonnes c where c.oid = t.oid)
         || chr(10) || ');'
  from tables_ t

  --  4 · les séquences rattachées à leur colonne.
  union all
  select 4, row_number() over (order by q.relname),
         'alter sequence public.' || quote_ident(q.relname)
         || ' owned by public.' || quote_ident(tc.relname) || '.' || quote_ident(a.attname) || ';'
  from sequences_ q
  join pg_depend dep on dep.objid = q.oid and dep.deptype = 'a'
  join cat_classe cc on cc.oid = dep.classid
  join pg_class tc on tc.oid = dep.refobjid
  join pg_attribute a on a.attrelid = dep.refobjid and a.attnum = dep.refobjsubid

  --  5 · clés primaires, unicités, vérifications.
  union all
  select 5, row_number() over (order by t.relname, con.conname),
         'alter table public.' || quote_ident(t.relname)
         || ' add constraint ' || quote_ident(con.conname) || ' '
         || pg_get_constraintdef(con.oid) || ';'
  from pg_constraint con
  join tables_ t on t.oid = con.conrelid
  where con.contype in ('p', 'u', 'c')

  --  6 · LES CLÉS ÉTRANGÈRES, après toutes les tables — sinon elles
  --  désigneraient des tables pas encore là.
  union all
  select 6, row_number() over (order by t.relname, con.conname),
         'alter table public.' || quote_ident(t.relname)
         || ' add constraint ' || quote_ident(con.conname) || ' '
         || pg_get_constraintdef(con.oid) || ';'
  from pg_constraint con
  join tables_ t on t.oid = con.conrelid
  where con.contype = 'f'

  --  7 · les index qui ne servent pas déjà une contrainte.
  union all
  select 7, row_number() over (order by ic.relname),
         pg_get_indexdef(i.indexrelid) || ';'
  from pg_index i
  join tables_ t on t.oid = i.indrelid
  join pg_class ic on ic.oid = i.indexrelid
  where not exists (select 1 from pg_constraint con where con.conindid = i.indexrelid)

  --  8 · LES VUES, de la moins emboîtée à la plus emboîtée.
  union all
  select 8, row_number() over (order by v.etage, v.relname),
         case when v.relkind = 'm'
              then 'create materialized view public.' || quote_ident(v.relname) || ' as ' || chr(10)
              else 'create view public.' || quote_ident(v.relname) || ' as ' || chr(10) end
         || pg_get_viewdef(v.oid, true)
  from vues v

  --  9 · les déclencheurs (les internes ne comptent pas : ce sont
  --  ceux que PostgreSQL pose lui-même pour les clés étrangères).
  union all
  select 9, row_number() over (order by tg.tgname),
         pg_get_triggerdef(tg.oid) || ';'
  from pg_trigger tg
  join tables_ t on t.oid = tg.tgrelid
  where not tg.tgisinternal

  --  10 · la sécurité par ligne : d'abord l'allumer…
  union all
  select 10, row_number() over (order by t.relname),
         'alter table public.' || quote_ident(t.relname) || ' enable row level security;'
  from tables_ t
  join pg_class c on c.oid = t.oid
  where c.relrowsecurity

  --  11 · … puis chaque règle, telle qu'elle est écrite dans la base.
  union all
  select 11, row_number() over (order by t.relname, pol.polname),
         'create policy ' || quote_ident(pol.polname)
         || ' on public.' || quote_ident(t.relname)
         || ' as ' || case when pol.polpermissive then 'permissive' else 'restrictive' end
         || ' for ' || case pol.polcmd
                         when 'r' then 'select'
                         when 'a' then 'insert'
                         when 'w' then 'update'
                         when 'd' then 'delete'
                         else 'all' end
         || ' to ' || coalesce(
              (select string_agg(quote_ident(r.rolname), ', ' order by r.rolname)
               from pg_roles r where r.oid = any (pol.polroles)), 'public')
         || coalesce(' using (' || pg_get_expr(pol.polqual, pol.polrelid) || ')', '')
         || coalesce(' with check (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')', '')
         || ';'
  from pg_policy pol
  join tables_ t on t.oid = pol.polrelid

  --  12 · les droits donnés aux trois rôles de Supabase.
  union all
  select 12, row_number() over (order by g.table_name, g.grantee),
         'grant ' || string_agg(lower(g.privilege_type), ', ' order by g.privilege_type)
         || ' on table public.' || quote_ident(g.table_name)
         || ' to ' || quote_ident(g.grantee) || ';'
  from information_schema.role_table_grants g
  where g.table_schema = 'public'
    and g.grantee in ('anon', 'authenticated', 'service_role')
  group by g.table_name, g.grantee

  --  13 · et ceux sur les séquences (sans quoi une insertion échoue
  --  sur les tables à identifiant automatique).
  union all
  select 13, row_number() over (order by u.object_name, u.grantee),
         'grant ' || string_agg(lower(u.privilege_type), ', ' order by u.privilege_type)
         || ' on sequence public.' || quote_ident(u.object_name)
         || ' to ' || quote_ident(u.grantee) || ';'
  from information_schema.role_usage_grants u
  where u.object_schema = 'public'
    and u.object_type = 'SEQUENCE'
    and u.grantee in ('anon', 'authenticated', 'service_role')
  group by u.object_name, u.grantee
)

select
  row_number() over (order by bloc, rang) as ordre,
  texte as instruction
from morceaux
order by bloc, rang;
