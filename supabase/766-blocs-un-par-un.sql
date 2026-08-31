-- ============================================================
--  nº 766 quater — LIRE LE SCHÉMA RÉEL DE L'ANCIEN PROJET
--  Les quinze morceaux, à essayer UN PAR UN.
-- ============================================================
--  POURQUOI CE FICHIER EXISTE. Le premier schéma livré était bâti en
--  REJOUANT LES MIGRATIONS DU DÉPÔT. Erreur : le dépôt n'est pas le
--  miroir de la base. Des colonnes ont été ajoutées à la main dans
--  Supabase sans passer par une migration — `filtres_motif` en est
--  une, elle n'existe nulle part dans le dépôt.
--  Celui-ci lit LA VRAIE BASE. Elle seule fait foi.
--
--  ⚠️ IL NE MODIFIE RIEN. Rien que des lectures des catalogues de
--  PostgreSQL. Aucun CREATE, aucun ALTER, aucun DROP, aucune donnée
--  touchée, aucune clé regardée. Sans danger sur la production.
--
-- ============================================================
--  CE QUI A CHANGÉ, ET POURQUOI (nº 766 quater)
--  ------------------------------------------------------------
--  La version précédente échouait encore dans l'éditeur de Supabase :
--      ERROR: 42P01: relation "public" does not exist
--  alors qu'un analyseur SQL passé sur le fichier n'y trouve AUCUN
--  « public » nu — pas un seul en dehors des chaînes de caractères.
--  Autrement dit : le fichier est correct au regard de PostgreSQL,
--  mais l'éditeur ne le lit pas comme PostgreSQL.
--
--  N'ayant pas cet éditeur sous la main pour l'éprouver, on a retiré
--  TOUT ce qui pouvait le dérouter, plutôt que de parier sur une
--  cause :
--    · plus aucun raccourci `::regnamespace` ni `::regclass` ;
--    · plus de `with` du tout — ni ordinaire ni `recursive` ;
--    · plus de sous-requête imbriquée dans un `with` imbriqué ;
--    · plus de tri des vues en SQL. Une vue qui en lit une autre doit
--      être créée après elle ; ce rangement est désormais fait par
--      `outils/assembler-schema`, à partir du BLOC 99, qui sort les
--      liens en clair. (Les ranger par âge ne marche pas : une vue
--      refaite reçoit un numéro plus récent que celles qui la lisent.
--      Le banc l'a montré.)
--  Il ne reste que quinze `select` ordinaires, mis bout à bout.
--
--  ET SURTOUT : chaque `select` TIENT DEBOUT TOUT SEUL. Si le gros
--  fichier échoue encore, `supabase/766-blocs-un-par-un.sql` contient
--  les mêmes quinze morceaux, séparés, à essayer un par un pour
--  savoir LEQUEL fâche l'éditeur.
-- ============================================================
--
-- ============================================================
--  COMMENT S'EN SERVIR
--  ------------------------------------------------------------
--  Dans l'éditeur SQL de Supabase, SI TU SÉLECTIONNES DU TEXTE À LA
--  SOURIS, seul le texte sélectionné est exécuté. C'est ce qui rend
--  ce fichier utile.
--
--   1. Colle tout ce fichier dans l'éditeur (ne lance pas encore).
--   2. Sélectionne le BLOC 0 en entier, du `select` jusqu'au dernier
--      caractère avant le trait suivant, et lance.
--   3. Recommence bloc par bloc, jusqu'au BLOC 99 compris.
--   4. DIS-MOI LE NUMÉRO DU PREMIER BLOC QUI ÉCHOUE, et son message.
--      C'est tout ce dont j'ai besoin.
--
--  Si AUCUN ne fâche : ils rendent ensemble exactement ce que rend le
--  gros fichier — vérifié au banc, octet pour octet. Tu peux alors
--  télécharger un CSV par bloc et les donner TOUS à l'assembleur (le
--  99 compris : sans lui, les vues seraient mal rangées), dans
--  n'importe quel ordre :
--
--      sh outils/assembler-schema bloc0.csv bloc1.csv bloc2.csv …
--
--  L'assembleur les remet dans l'ordre tout seul.
-- ============================================================

-- ============================================================
--  BLOC 0 · les deux réglages d'entrée
-- ============================================================
select bloc, rang, texte as instruction from (
select 0 as bloc, 0 as rang, 'set check_function_bodies = false;' as texte
union all
select 0, 1, 'set search_path = public;'
) bloc_0
order by bloc, rang;


-- ============================================================
--  BLOC 1 · les fonctions
-- ============================================================
select bloc, rang, texte as instruction from (
select 1 as bloc, row_number() over (order by p.proname) as rang,
       pg_get_functiondef(p.oid) || ';' as texte
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
) bloc_1
order by bloc, rang;


-- ============================================================
--  BLOC 2 · les séquences autonomes
-- ============================================================
select bloc, rang, texte as instruction from (
select 2 as bloc, row_number() over (order by q.relname) as rang,
       'create sequence if not exists public.' || quote_ident(q.relname) || ';' as texte
from pg_class q
join pg_namespace n on n.oid = q.relnamespace
where n.nspname = 'public'
  and q.relkind = 'S'
  and not exists (
    select 1
    from pg_depend dep
    join pg_attribute a on a.attrelid = dep.refobjid and a.attnum = dep.refobjsubid
    where dep.objid = q.oid
      and dep.deptype = 'i'
      and dep.classid = (
        select c2.oid from pg_class c2
        join pg_namespace n2 on n2.oid = c2.relnamespace
        where c2.relname = 'pg_class' and n2.nspname = 'pg_catalog')
      and a.attidentity <> '')
) bloc_2
order by bloc, rang;


-- ============================================================
--  BLOC 3 · les tables et leurs colonnes
-- ============================================================
select bloc, rang, texte as instruction from (
select 3 as bloc, row_number() over (order by c.relname) as rang,
       'create table public.' || quote_ident(c.relname) || ' (' || chr(10)
       || (select string_agg(
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
             || case when a.attnotnull then ' not null' else '' end,
             ',' || chr(10) order by a.attnum)
           from pg_attribute a
           left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
           where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)
       || chr(10) || ');' as texte
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
) bloc_3
order by bloc, rang;


-- ============================================================
--  BLOC 4 · les séquences rattachées à leur colonne
-- ============================================================
select bloc, rang, texte as instruction from (
select 4 as bloc, row_number() over (order by q.relname) as rang,
       'alter sequence public.' || quote_ident(q.relname)
       || ' owned by public.' || quote_ident(tc.relname)
       || '.' || quote_ident(a.attname) || ';' as texte
from pg_class q
join pg_namespace n on n.oid = q.relnamespace
join pg_depend dep on dep.objid = q.oid and dep.deptype = 'a'
join pg_class tc on tc.oid = dep.refobjid
join pg_attribute a on a.attrelid = dep.refobjid and a.attnum = dep.refobjsubid
where n.nspname = 'public'
  and q.relkind = 'S'
  and dep.classid = (
    select c2.oid from pg_class c2
    join pg_namespace n2 on n2.oid = c2.relnamespace
    where c2.relname = 'pg_class' and n2.nspname = 'pg_catalog')
) bloc_4
order by bloc, rang;


-- ============================================================
--  BLOC 5 · clés primaires, unicités, vérifications
-- ============================================================
select bloc, rang, texte as instruction from (
select 5 as bloc, row_number() over (order by c.relname, con.conname) as rang,
       'alter table public.' || quote_ident(c.relname)
       || ' add constraint ' || quote_ident(con.conname) || ' '
       || pg_get_constraintdef(con.oid) || ';' as texte
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and con.contype in ('p', 'u', 'c')
) bloc_5
order by bloc, rang;


-- ============================================================
--  BLOC 6 · les clés étrangères
-- ============================================================
select bloc, rang, texte as instruction from (
select 6 as bloc, row_number() over (order by c.relname, con.conname) as rang,
       'alter table public.' || quote_ident(c.relname)
       || ' add constraint ' || quote_ident(con.conname) || ' '
       || pg_get_constraintdef(con.oid) || ';' as texte
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and con.contype = 'f'
) bloc_6
order by bloc, rang;


-- ============================================================
--  BLOC 7 · les index hors contraintes
-- ============================================================
select bloc, rang, texte as instruction from (
select 7 as bloc, row_number() over (order by ic.relname) as rang,
       pg_get_indexdef(i.indexrelid) || ';' as texte
from pg_index i
join pg_class c on c.oid = i.indrelid
join pg_class ic on ic.oid = i.indexrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not exists (select 1 from pg_constraint con where con.conindid = i.indexrelid)
) bloc_7
order by bloc, rang;


-- ============================================================
--  BLOC 8 · les vues (leur rang est leur numero interne, voir le bloc 99)
-- ============================================================
select bloc, rang, texte as instruction from (
select 8 as bloc, v.oid::bigint as rang,
       case when v.relkind = 'm'
            then 'create materialized view public.' || quote_ident(v.relname) || ' as ' || chr(10)
            else 'create view public.' || quote_ident(v.relname) || ' as ' || chr(10) end
       || pg_get_viewdef(v.oid, true) as texte
from pg_class v
join pg_namespace n on n.oid = v.relnamespace
where n.nspname = 'public'
  and v.relkind in ('v', 'm')
) bloc_8
order by bloc, rang;


-- ============================================================
--  BLOC 9 · les déclencheurs
-- ============================================================
select bloc, rang, texte as instruction from (
select 9 as bloc, row_number() over (order by tg.tgname) as rang,
       pg_get_triggerdef(tg.oid) || ';' as texte
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not tg.tgisinternal
) bloc_9
order by bloc, rang;


-- ============================================================
--  BLOC 10 · allumer la sécurité par ligne
-- ============================================================
select bloc, rang, texte as instruction from (
select 10 as bloc, row_number() over (order by c.relname) as rang,
       'alter table public.' || quote_ident(c.relname)
       || ' enable row level security;' as texte
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
) bloc_10
order by bloc, rang;


-- ============================================================
--  BLOC 11 · les règles de sécurité
-- ============================================================
select bloc, rang, texte as instruction from (
select 11 as bloc, row_number() over (order by c.relname, pol.polname) as rang,
       'create policy ' || quote_ident(pol.polname)
       || ' on public.' || quote_ident(c.relname)
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
       || ';' as texte
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
) bloc_11
order by bloc, rang;


-- ============================================================
--  BLOC 12 · les droits sur les tables
-- ============================================================
select bloc, rang, texte as instruction from (
select 12 as bloc, row_number() over (order by g.table_name, g.grantee) as rang,
       'grant ' || string_agg(lower(g.privilege_type), ', ' order by g.privilege_type)
       || ' on table public.' || quote_ident(g.table_name)
       || ' to ' || quote_ident(g.grantee) || ';' as texte
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.grantee in ('anon', 'authenticated', 'service_role')
group by g.table_name, g.grantee
) bloc_12
order by bloc, rang;


-- ============================================================
--  BLOC 13 · les droits sur les séquences
-- ============================================================
select bloc, rang, texte as instruction from (
select 13 as bloc, row_number() over (order by u.object_name, u.grantee) as rang,
       'grant ' || string_agg(lower(u.privilege_type), ', ' order by u.privilege_type)
       || ' on sequence public.' || quote_ident(u.object_name)
       || ' to ' || quote_ident(u.grantee) || ';' as texte
from information_schema.role_usage_grants u
where u.object_schema = 'public'
  and u.object_type = 'SEQUENCE'
  and u.grantee in ('anon', 'authenticated', 'service_role')
group by u.object_name, u.grantee
) bloc_13
order by bloc, rang;


-- ============================================================
--  BLOC 99 · LES LIENS ENTRE VUES - ce bloc ne produit aucun SQL
-- ============================================================
select bloc, rang, texte as instruction from (
select 99 as bloc, row_number() over (order by f.oid, m.oid) as rang,
       f.oid::text || '|' || m.oid::text as texte
from pg_depend d
join pg_rewrite r on r.oid = d.objid
join pg_class f on f.oid = r.ev_class
join pg_class m on m.oid = d.refobjid
join pg_namespace nf on nf.oid = f.relnamespace
join pg_namespace nm on nm.oid = m.relnamespace
where nf.nspname = 'public'
  and nm.nspname = 'public'
  and f.relkind in ('v', 'm')
  and m.relkind in ('v', 'm')
  and f.oid <> m.oid
group by f.oid, m.oid
) bloc_99
order by bloc, rang;


