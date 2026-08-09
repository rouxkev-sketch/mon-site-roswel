-- ============================================================
--  ROSWEL — CORRECTIF DESIGN N°4 : fin de l'expérience déclarée
-- ============================================================
--  À exécuter : Supabase → SQL Editor → New query → Run
--  (Ce script REMPLACE le correctif n°3 : il fonctionne que le
--   n°3 ait déjà été exécuté ou non, sans danger si relancé.)
--
--  Changement de règle : Roswel n'affiche que des données
--  FIABLES. Les années d'expérience étaient déclarées par
--  l'artisan (invérifiable) : la colonne est SUPPRIMÉE. Le badge
--  « Membre depuis [année] » la remplace — il vient de cree_le,
--  la date d'inscription générée automatiquement par la base.
--
--  Le nom de société devient OBLIGATOIRE : la règle est appliquée
--  par le serveur à l'inscription (aucune contrainte en base pour
--  ne pas bloquer les anciennes fiches — recréez les artisans de
--  démonstration depuis /admin/artisans-demo après ce script).
-- ============================================================

-- Le nom de la société (si le correctif n°3 n'a jamais été passé)
alter table public.artisans add column if not exists nom_societe text;
grant insert (nom_societe) on public.artisans to authenticated;
grant update (nom_societe) on public.artisans to authenticated;

-- SUPPRESSION de l'expérience déclarée (donnée invérifiable)
alter table public.artisans drop column if exists annees_experience;

-- ============================================================
-- La recherche : sans annees_experience, avec nom_societe et
-- cree_le (badge « Membre depuis [année] »)
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
