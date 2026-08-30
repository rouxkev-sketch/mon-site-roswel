-- ====================================================================
-- ██ nº 754 — LES DATES D'UNE CONVENTION, ENFIN ACCEPTÉES PAR LA BASE ██
-- ====================================================================
-- LE DÉFAUT, RELEVÉ EN PRODUCTION : un mode « Convention » complet
-- (pays, convention choisie, dates) ne s'enregistrait pas. Aucune
-- erreur à l'écran, les autres modes partaient normalement — la ligne
-- de convention, elle, était REFUSÉE PAR LA BASE.
--
-- LA CAUSE, EXACTE ET UNIQUE : la contrainte
-- `modes_exercice_dates_coherentes` date de la migration nº 26, quand
-- SEUL le genre « guest » portait des dates. Elle dit, mot pour mot :
--
--     (genre = 'guest'  and debut_le is not null and fin_le is not null
--                       and fin_le >= debut_le)
--  or (genre <> 'guest' and debut_le is null     and fin_le is null)
--
-- La nº 749 a élargi `modes_exercice_genre_connu` pour accueillir
-- « convention » et « independent » — mais PAS celle-ci. Une ligne
-- `genre = 'convention'` AVEC des dates tombe donc dans le second
-- terme, qui exige justement l'absence de dates : PostgreSQL la
-- refuse. Le formulaire, lui, écrit bien ces dates (nº 750) : c'est
-- exactement ce qu'un artiste renseigne — il peut n'être à une
-- convention qu'un jour sur trois.
--
-- CE QUE CE FICHIER CORRIGE : la contrainte accepte désormais les
-- dates pour les DEUX genres datés, `guest` ET `convention`, avec la
-- même exigence pour les deux — les deux bornes, dans le bon ordre.
-- Tout autre genre continue de n'en porter aucune.
--
-- ⚠️ RIEN D'AUTRE NE CHANGE : ni les colonnes, ni les autres
-- contraintes, ni les vues, ni les règles d'accès. C'est une seule
-- contrainte, remplacée par la même règle étendue d'un genre.
--
-- ⚠️ À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, en une fois. Le bloc
-- final n'écrit rien : il montre ce qu'il y a en base après coup.
-- ====================================================================

begin;

alter table public.modes_exercice
  drop constraint if exists modes_exercice_dates_coherentes;

alter table public.modes_exercice
  add constraint modes_exercice_dates_coherentes
  check (
    --  LES GENRES DATÉS — une session guest, une présence en
    --  convention : les deux bornes, et la fin jamais avant le début.
    --  C'est la règle du formulaire (`modeComplet`, lib/modes-exercice)
    --  écrite ici aussi : une donnée fausse ne doit pas pouvoir entrer.
    (genre in ('guest', 'convention')
      and debut_le is not null
      and fin_le is not null
      and fin_le >= debut_le)
    --  TOUS LES AUTRES — studio, salon, « Autre » (independent), et
    --  l'ancien 'disponible' : aucune date. Un lieu fixe n'a pas de
    --  bornes, et une zone de déplacement non plus.
    or (genre not in ('guest', 'convention')
      and debut_le is null
      and fin_le is null)
  );

commit;

-- ====================================================================
-- CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- Trois lignes attendues :
--   1. la contrainte cite bien 'convention'          → true
--   2. aucune ligne de convention n'est en infraction → 0
--   3. les lignes de convention déjà enregistrées     → leur nombre
--      (0 si le défaut les a toutes perdues, ce qui est le cas
--       attendu : elles n'ont jamais pu entrer)
-- ====================================================================
select
  'la contrainte accepte convention' as verification,
  coalesce(
    (select pg_get_constraintdef(oid) like '%convention%'
       from pg_constraint
      where conname = 'modes_exercice_dates_coherentes'),
    false
  )::text as resultat
union all
select
  'lignes convention en infraction',
  (select count(*)::text
     from public.modes_exercice
    where genre = 'convention'
      and (debut_le is null or fin_le is null or fin_le < debut_le))
union all
select
  'lignes convention enregistrées',
  (select count(*)::text
     from public.modes_exercice
    where genre = 'convention')
union all
--  ET LE DIAGNOSTIC DU SECOND RELEVÉ (nº 754, défaut 2) : les lieux
--  saisis à la main qui n'ont PAS de nom d'enseigne. La plaque d'un
--  tel mode affiche sa ville sur la ligne blanche, faute de nom — ce
--  n'est pas un nom perdu, c'est un nom jamais saisi. Ce compte le dit.
select
  'lieux hors site SANS nom saisi',
  (select count(*)::text
     from public.modes_exercice
    where genre in ('salon', 'prive', 'guest')
      and salon_id is null
      and coalesce(nom_lieu, '') = '');
