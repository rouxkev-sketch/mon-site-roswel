-- ============================================================
--  ROSWEL — COMPLÉMENT ÉTAPE 5 : LA RECHERCHE D'ARTISANS
-- ============================================================
--  À exécuter comme le premier script :
--  Supabase → SQL Editor → New query → tout coller → Run
--  (réexécutable sans danger)
-- ============================================================

-- Deux informations nouvelles sur la fiche artisan :

-- 1) L'adresse web de sa fiche (ex. /artisan/julien-moreau)
alter table public.artisans add column if not exists slug text unique;

-- 2) Son temps de réponse moyen, en minutes. Calculé automatiquement
--    par la messagerie (étape 9), JAMAIS saisi à la main.
--    Vide = pas d'historique = rien d'affiché.
alter table public.artisans add column if not exists delai_reponse_minutes integer;

-- ============================================================
-- FONCTION rechercher_artisans — le cœur de la recherche
-- ------------------------------------------------------------
-- Pour un métier et une commune donnés, renvoie les artisans :
--   - dont la fiche est validée (règle de sécurité déjà en place),
--   - dont la zone (point GPS + rayon) couvre la commune,
--   - qui n'ont pas exclu cette commune,
--   - qui correspondent aux filtres cochés (urgence, nuit, week-end).
-- Le classement final (score puis rapidité) est fait par le site.
-- ============================================================
create or replace function public.rechercher_artisans(
  p_metier text,
  p_code_insee text,
  p_urgence boolean default false,
  p_nuit boolean default false,
  p_weekend boolean default false
)
returns table (
  id uuid,
  slug text,
  nom_affiche text,
  photo_url text,
  pastille text,
  score_total integer,
  note_google numeric,
  nombre_avis_google integer,
  abonnes_instagram integer,
  delai_reponse_minutes integer,
  dispo_urgence boolean,
  dispo_nuit boolean,
  dispo_weekend boolean,
  dispo_feries boolean,
  distance_km double precision,
  metiers text[]
)
language sql
stable
set search_path = ''
as $$
  select
    a.id,
    a.slug,
    a.nom_affiche,
    a.photo_url,
    a.pastille,
    a.score_total,
    a.note_google,
    a.nombre_avis_google,
    a.abonnes_instagram,
    a.delai_reponse_minutes,
    a.dispo_urgence,
    a.dispo_nuit,
    a.dispo_weekend,
    a.dispo_feries,
    public.distance_km(a.latitude, a.longitude, c.latitude, c.longitude) as distance_km,
    array(
      select m.metier from public.artisan_metiers m where m.artisan_id = a.id
    ) as metiers
  from public.artisans a
  cross join (
    select latitude, longitude
    from public.communes
    where code_insee = p_code_insee
  ) c
  where a.statut_validation = 'valide'
    and a.latitude is not null
    and a.longitude is not null
    -- La zone de l'artisan couvre-t-elle la commune ?
    and public.distance_km(a.latitude, a.longitude, c.latitude, c.longitude)
        <= a.rayon_intervention_km
    -- L'artisan n'a pas exclu cette commune (option avancée)
    and not (p_code_insee = any(a.communes_exclues))
    -- Il exerce bien ce métier
    and exists (
      select 1 from public.artisan_metiers m
      where m.artisan_id = a.id and m.metier = p_metier
    )
    -- Les filtres cochés
    and (not p_urgence or a.dispo_urgence)
    and (not p_nuit or a.dispo_nuit)
    and (not p_weekend or a.dispo_weekend)
$$;

-- Autoriser le site à appeler cette fonction
grant execute on function public.rechercher_artisans to anon, authenticated;

-- ============================================================
-- FIN — vérification rapide possible dans le SQL Editor :
-- select nom_affiche, distance_km from rechercher_artisans('plombier', '69266');
-- (69266 = Villeurbanne ; liste vide tant qu'aucun artisan validé)
-- ============================================================
