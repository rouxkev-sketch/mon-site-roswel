-- ============================================================
-- nº 402 — FIN DU MODE « À DOMICILE »
-- ============================================================
-- LE MODE EST SUPPRIMÉ DU SITE (formulaire, filtres, fiches). Cette
-- migration est un VERROU, pas une réparation : l'enregistrement
-- marche déjà sans elle, parce que la contrainte actuelle
-- (modes_exercice_genre_connu, posée par yokofolio-studio-horaires.sql)
-- accepte ('salon','guest','domicile','prive') et que le site n'écrit
-- plus que les trois premiers... moins 'domicile'. Elle fait deux
-- choses :
--  1. PURGER les lignes 'domicile' restantes — le propriétaire
--     confirme qu'aucune vraie fiche n'en a ; la DÉMONSTRATION en
--     avait deux (Trait Nord à Strasbourg, Studio Caméléon à
--     Bordeaux), posées par yokofolio-demos-nouveau-modele.sql ;
--  2. RESSERRER la contrainte à trois valeurs, pour qu'aucun code
--     futur ne puisse réintroduire le mode par accident.
-- IDEMPOTENTE : rejouable telle quelle, sans effet la seconde fois.
-- ⚠️ LA COLONNE rayon_km RESTE : elle est simplement toujours écrite
-- à null désormais (elle n'avait de sens que pour 'domicile').
-- ============================================================

begin;

-- 1) Plus une seule ligne 'domicile'.
delete from public.modes_exercice
 where genre = 'domicile';

-- 2) La contrainte ne connaît plus que les trois modes du site.
alter table public.modes_exercice
  drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'prive'));

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; deux requêtes)
-- ============================================================
-- a) Doit rendre 0 :
--    select count(*) from public.modes_exercice where genre = 'domicile';
-- b) Doit rendre la définition avec ('salon','guest','prive') :
--    select pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname = 'modes_exercice_genre_connu';
