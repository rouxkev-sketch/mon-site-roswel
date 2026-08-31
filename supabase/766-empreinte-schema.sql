-- ============================================================
--  nº 766 bis — L'EMPREINTE D'UN SCHÉMA
--  À coller dans CHACUN des deux projets, et à comparer.
-- ============================================================
--  À QUOI ÇA SERT. Après avoir posé le schéma dans le nouveau projet,
--  il faut savoir s'il est VRAIMENT le même que l'ancien — avant de
--  copier la moindre ligne. C'est faute de cette vérification que la
--  première tentative a échoué en plein milieu.
--
--  COMMENT S'EN SERVIR :
--    1. colle ce fichier dans l'ANCIEN projet, lance, note le résultat ;
--    2. colle-le dans le NOUVEAU projet, lance ;
--    3. compare. La DERNIÈRE LIGNE (« ▓ EMPREINTE ») résume tout : si
--       les deux empreintes sont identiques, les schémas le sont.
--       Si elles diffèrent, les lignes du dessus disent où.
--
--  ⚠️ IL NE MODIFIE RIEN, et ne lit aucune donnée : uniquement la
--  forme des tables.
--
--  ⚠️ NE T'INQUIÈTE PAS d'une différence sur `journal_migrations` ou
--  toute table de service que le nouveau projet n'aurait pas : ce qui
--  compte, ce sont les 17 tables du produit.
-- ============================================================

with

--  ── LA FORME DE CHAQUE TABLE : nom de colonne, type exact, « pas
--     vide », valeur par défaut, caractère automatique. C'est là que
--     se cachait `filtres_motif`.
formes as (
  select
    c.relname as objet,
    string_agg(
      a.attname || ' ' || format_type(a.atttypid, a.atttypmod)
      || case when a.attnotnull then ' nn' else '' end
      || case a.attidentity when 'a' then ' idA' when 'd' then ' idD' else '' end
      || coalesce(' def=' || pg_get_expr(d.adbin, d.adrelid), ''),
      ' | ' order by a.attnum
    ) as detail
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where c.relkind = 'r'
    and c.relnamespace = 'public'::regnamespace
    and a.attnum > 0
    and not a.attisdropped
  group by c.relname
),

--  ── LES COMPTES du reste : ce qui doit se retrouver à l'identique
--     sans qu'on ait besoin d'en lire le détail.
comptes as (
  select 'vues' as quoi, count(*)::text as combien
  from pg_class where relkind in ('v', 'm') and relnamespace = 'public'::regnamespace
  union all
  select 'fonctions', count(*)::text
  from pg_proc where pronamespace = 'public'::regnamespace and prokind in ('f', 'p')
  union all
  select 'règles RLS', count(*)::text
  from pg_policy pol join pg_class c on c.oid = pol.polrelid
  where c.relnamespace = 'public'::regnamespace
  union all
  select 'déclencheurs', count(*)::text
  from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
  where c.relnamespace = 'public'::regnamespace and not tg.tgisinternal
  union all
  select 'index', count(*)::text
  from pg_index i join pg_class c on c.oid = i.indrelid
  where c.relnamespace = 'public'::regnamespace
  union all
  select 'clés étrangères', count(*)::text
  from pg_constraint con join pg_class c on c.oid = con.conrelid
  where c.relnamespace = 'public'::regnamespace and con.contype = 'f'
),

tout_ as (
  --  1 · une ligne par table : son nom, son nombre de colonnes, et une
  --  empreinte courte de sa forme complète.
  select 1 as bloc, objet as ligne,
         (length(detail) - length(replace(detail, '|', '')) + 1)::text || ' col · '
         || left(md5(detail), 8) as valeur
  from formes
  --  2 · les comptes.
  union all
  select 2, quoi, combien from comptes
)

select ligne as objet, valeur
from (
  select bloc, ligne, valeur from tout_
  union all
  --  3 · LE RÉSUMÉ. Une seule chaîne à comparer entre les deux
  --  projets : elle mêle la forme de toutes les tables et tous les
  --  comptes ci-dessus.
  select 3, '▓ EMPREINTE',
         (select md5(string_agg(bloc || ligne || valeur, '~' order by bloc, ligne))
          from tout_)
) resultat
order by bloc, objet;
