-- ============================================================
--  COMBLER LES ÉCARTS DE DROITS APRÈS LE DÉMÉNAGEMENT
--  À coller dans le NOUVEAU projet (yokofolio-us).
-- ============================================================
--  D'OÙ VIENNENT CES ÉCARTS. La restauration du schéma commence par
--  `DROP SCHEMA IF EXISTS "public"` puis le recrée. Deux choses ne
--  survivent pas à ce passage, et pg_dump ne les remet pas toutes :
--
--   1. LE SCHÉMA RECRÉÉ N'A PLUS LES MÊMES DROITS. Un schéma `public`
--      d'origine laisse USAGE à TOUT LE MONDE (le rôle PUBLIC) ;
--      celui qu'on vient de créer ne le donne qu'à son propriétaire.
--      D'où, dans la comparaison, un
--      « REVOKE USAGE ON SCHEMA public FROM PUBLIC » côté nouveau.
--
--   2. LES DROITS PAR DÉFAUT SONT EFFACÉS. Ce sont les consignes du
--      genre « quand tel rôle crée une table ici, donne-la
--      automatiquement à anon, authenticated et service_role ». Elles
--      vivent dans un catalogue INDEXÉ PAR SCHÉMA : supprimer le
--      schéma les emporte. Vérifié au banc : 2 entrées avant le DROP,
--      0 après.
--      pg_dump les réécrit bien dans le fichier — celles du rôle
--      `postgres` repassent (tu ES postgres) ; celles du rôle
--      `supabase_admin` sont REFUSÉES, parce qu'on ne peut poser les
--      droits par défaut d'un rôle dont on n'est pas membre. Vérifié
--      au banc : « permission denied to change default privileges ».
--
-- ============================================================
--  ⚠️ COLLE UN BLOC À LA FOIS, PAS TOUT D'UN COUP.
--  Le bloc 3 peut être REFUSÉ (voir sa note) ; collé avec les autres,
--  son refus annulerait aussi les blocs 1 et 2, qui, eux, marchent.
-- ============================================================


-- ────────────────────────────────────────────────────────────
--  BLOC 0 · LE CONSTAT — à coller dans LES DEUX projets, et à
--  comparer. Il ne modifie rien.
-- ────────────────────────────────────────────────────────────
select 'proprietaire du schema' as quoi, r.rolname as valeur
from pg_namespace n
join pg_roles r on r.oid = n.nspowner
where n.nspname = 'public'
union all
select 'droits sur le schema', coalesce(array_to_string(n.nspacl, ' | '), '(defaut)')
from pg_namespace n
where n.nspname = 'public'
union all
select 'droits par defaut · ' || g.rolname || ' · ' ||
       case d.defaclobjtype
         when 'r' then 'tables'
         when 'S' then 'sequences'
         when 'f' then 'fonctions'
         else d.defaclobjtype::text
       end,
       array_to_string(d.defaclacl, ' | ')
from pg_default_acl d
join pg_roles g on g.oid = d.defaclrole
join pg_namespace n on n.oid = d.defaclnamespace
where n.nspname = 'public'
order by 1;


-- ────────────────────────────────────────────────────────────
--  BLOC 1 · L'USAGE DU SCHÉMA POUR TOUT LE MONDE
--  ------------------------------------------------------------
--  C'est l'étape 3d du guide, celle qui a dû sauter. Elle remet le
--  droit qu'un schéma `public` d'origine possède.
--  ⚠️ CE N'EST PAS UN TROU DE SÉCURITÉ : USAGE sur un schéma ne
--  donne accès à AUCUNE table — il autorise seulement à NOMMER ce
--  qu'on a déjà le droit de lire. Les tables, elles, restent gardées
--  une par une par leurs propres droits et par les règles RLS.
-- ────────────────────────────────────────────────────────────
grant usage on schema public to public;


-- ────────────────────────────────────────────────────────────
--  BLOC 2 · LE PROPRIÉTAIRE DU SCHÉMA
--  ------------------------------------------------------------
--  Dans un projet Supabase d'origine, `public` appartient à
--  `pg_database_owner` (c'est pourquoi l'ancien projet donne un
--  GRANT explicite à `postgres`). Après DROP + CREATE, il appartient
--  à `postgres`, qui l'a créé.
--  ⚠️ SANS CONSÉQUENCE VISIBLE : postgres en propriétaire a PLUS de
--  droits, pas moins. On le remet par souci d'être au plus près d'un
--  projet neuf — si la ligne est refusée, passe au suivant sans
--  t'inquiéter.
--  LANCE D'ABORD LE BLOC 0 dans l'ancien projet : si le propriétaire
--  y est un autre nom que `pg_database_owner`, mets CE nom-là ici.
-- ────────────────────────────────────────────────────────────
alter schema public owner to pg_database_owner;


-- ────────────────────────────────────────────────────────────
--  BLOC 3 · LES DROITS PAR DÉFAUT DE `supabase_admin`
--  ------------------------------------------------------------
--  ⚠️ CE BLOC SERA PROBABLEMENT REFUSÉ, et c'est normal : poser les
--  droits par défaut d'un rôle demande d'ÊTRE ce rôle (ou membre).
--  Le `postgres` de Supabase n'est pas membre de `supabase_admin`.
--  Message attendu : « permission denied to change default
--  privileges ». Ce n'est PAS une faute de ta part.
--
--  CE QU'ON PERD SI ÇA RESTE REFUSÉ, exactement : les objets créés
--  DANS public PAR SUPABASE LUI-MÊME (son outillage interne)
--  n'auraient pas leurs droits d'office. C'est rare — Supabase
--  installe ses affaires dans d'autres schémas.
--  CE QU'ON NE PERD PAS : les tables que TU crées. Elles dépendent
--  des droits par défaut du rôle `postgres`, et ceux-là sont bien
--  passés (le bloc 0 te le montrera des deux côtés).
-- ────────────────────────────────────────────────────────────
alter default privileges for role supabase_admin in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges for role supabase_admin in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges for role supabase_admin in schema public
  grant all on functions to postgres, anon, authenticated, service_role;


-- ────────────────────────────────────────────────────────────
--  ET APRÈS ? Relance le BLOC 0 dans les deux projets : les deux
--  résultats doivent se ressembler, à la ligne `supabase_admin` près
--  si le bloc 3 a été refusé.
--  Tu peux aussi relancer la comparaison complète :
--      sh outils/demenager-officiel comparer
-- ────────────────────────────────────────────────────────────
