-- ============================================================
--  ROSWEL — CORRECTIF DESIGN N°3 : société, expérience, SIRET
-- ============================================================
--  À exécuter : Supabase → SQL Editor → New query → Run
--  (Remplace les correctifs précédents — sans danger s'ils ont
--   déjà été exécutés.)
--
--  - nom_societe : nom de la société (optionnel, affiché sur la
--    carte sous le nom de l'artisan) ;
--  - annees_experience : années d'expérience déclarées par
--    l'artisan (badge « X ans d'expérience » sur la carte).
-- ============================================================

alter table public.artisans add column if not exists nom_societe text;
alter table public.artisans add column if not exists annees_experience integer;

-- L'artisan peut renseigner ces deux champs depuis son formulaire
grant insert (nom_societe, annees_experience) on public.artisans to authenticated;
grant update (nom_societe, annees_experience) on public.artisans to authenticated;

-- ============================================================
-- La recherche renvoie les nouveaux champs
-- ============================================================
drop function if exists public.rechercher_artisans(text, text, boolean, boolean, boolean);

create function public.rechercher_artisans(
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
  nom_societe text,
  photo_url text,
  pastille text,
  score_total integer,
  note_google numeric,
  nombre_avis_google integer,
  abonnes_instagram integer,
  publications_instagram integer,
  annees_experience integer,
  delai_reponse_minutes integer,
  dispo_urgence boolean,
  dispo_nuit boolean,
  dispo_weekend boolean,
  dispo_feries boolean,
  distance_km double precision,
  metiers text[],
  cree_le timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    a.id,
    a.slug,
    a.nom_affiche,
    a.nom_societe,
    a.photo_url,
    a.pastille,
    a.score_total,
    a.note_google,
    a.nombre_avis_google,
    a.abonnes_instagram,
    a.publications_instagram,
    a.annees_experience,
    a.delai_reponse_minutes,
    a.dispo_urgence,
    a.dispo_nuit,
    a.dispo_weekend,
    a.dispo_feries,
    public.distance_km(a.latitude, a.longitude, c.latitude, c.longitude) as distance_km,
    array(
      select m.metier from public.artisan_metiers m where m.artisan_id = a.id
    ) as metiers,
    a.cree_le
  from public.artisans a
  cross join (
    select latitude, longitude
    from public.communes
    where code_insee = p_code_insee
  ) c
  where a.statut_validation = 'valide'
    and a.latitude is not null
    and a.longitude is not null
    and public.distance_km(a.latitude, a.longitude, c.latitude, c.longitude)
        <= a.rayon_intervention_km
    and not (p_code_insee = any(a.communes_exclues))
    and exists (
      select 1 from public.artisan_metiers m
      where m.artisan_id = a.id and m.metier = p_metier
    )
    and (not p_urgence or a.dispo_urgence)
    and (not p_nuit or a.dispo_nuit)
    and (not p_weekend or a.dispo_weekend)
$$;

grant execute on function public.rechercher_artisans to anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
