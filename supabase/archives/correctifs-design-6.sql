-- ============================================================
--  ROSWEL — CORRECTIF DESIGN N°6 : horaires multi-créneaux,
--  urgence/fériés/absences, SIRET → SIREN
-- ============================================================
--  À exécuter : Supabase → SQL Editor → New query → Run
--  (Ce script REMPLACE le correctif n°5 : il fonctionne que les
--   précédents aient été exécutés ou non, sans danger si relancé.)
--
--  APRÈS ce script, deux actions dans l'ordre :
--   1. recréer les artisans de démonstration (/admin/artisans-demo) ;
--   2. lancer /admin/recalculer-scores : il recalcule les scores ET
--      les déductions « travaille la nuit / le week-end » de TOUS
--      les artisans à partir de leurs horaires convertis.
--
--  Contenu :
--  - SIRET (14 chiffres) → SIREN (9 chiffres) : colonnes renommées,
--    numéros existants convertis (les 9 premiers chiffres du SIRET
--    SONT le SIREN de l'entreprise) ;
--  - période de fermeture : absence_debut / absence_fin ;
--  - horaires : ancien format « une plage par jour » converti au
--    nouveau (liste de créneaux par jour ; « 24h24» possible) ;
--  - la recherche renvoie en plus les horaires et l'absence (le
--    site applique le filtre Urgence « ouvert maintenant »).
-- ============================================================

-- Rattrapage des correctifs précédents (sans danger si déjà faits)
alter table public.artisans add column if not exists nom_societe text;
alter table public.artisans add column if not exists ville_code_insee text;
alter table public.artisans add column if not exists ville_nom text;
alter table public.artisans add column if not exists ville_code_postal text;
alter table public.artisans add column if not exists telephone_visible boolean not null default true;
alter table public.artisans drop column if exists annees_experience;

-- ----- SIRET → SIREN (renommages idempotents) -----
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'artisans'
               and column_name = 'siret') then
    alter table public.artisans rename column siret to siren;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'artisans'
               and column_name = 'siret_verifie') then
    alter table public.artisans rename column siret_verifie to siren_verifie;
  end if;
end $$;

-- Les numéros déjà enregistrés : SIRET (14 chiffres) → SIREN (9 premiers)
update public.artisans
set siren = left(siren, 9)
where siren is not null and length(siren) = 14;

-- ----- Période de fermeture (absence déclarée par l'artisan) -----
alter table public.artisans add column if not exists absence_debut date;
alter table public.artisans add column if not exists absence_fin date;

-- ----- Horaires : ancien format → nouveau -----
-- Avant : { "lundi": "08:00-19:00", "dimanche": null }
-- Après : { "lundi": ["08:00-19:00"], "dimanche": null }
-- (les valeurs déjà au nouveau format — tableaux ou "24h24" — sont
--  laissées telles quelles ; relançable sans danger)
update public.artisans
set horaires = (
  select jsonb_object_agg(
    jour,
    case
      when jsonb_typeof(valeur) = 'string' and valeur <> '"24h24"'::jsonb
        then jsonb_build_array(valeur #>> '{}')
      else valeur
    end
  )
  from jsonb_each(horaires) as t(jour, valeur)
)
where horaires is not null and horaires <> '{}'::jsonb;

-- L'artisan peut modifier ces champs depuis son formulaire
grant insert (absence_debut, absence_fin) on public.artisans to authenticated;
grant update (absence_debut, absence_fin) on public.artisans to authenticated;

-- ============================================================
-- La recherche : renvoie en plus les horaires, l'absence et le
-- SIREN vérifié (le filtre Urgence « ouvert maintenant, pas
-- absent, fériés si férié » est appliqué par le site)
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
  ville_nom text,
  ville_code_postal text,
  photo_url text,
  pastille text,
  score_total integer,
  note_google numeric,
  nombre_avis_google integer,
  abonnes_instagram integer,
  publications_instagram integer,
  delai_reponse_minutes integer,
  telephone text,
  telephone_visible boolean,
  siren_verifie boolean,
  date_creation_entreprise date,
  horaires jsonb,
  dispo_urgence boolean,
  dispo_nuit boolean,
  dispo_weekend boolean,
  dispo_feries boolean,
  absence_debut date,
  absence_fin date,
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
    a.ville_nom,
    a.ville_code_postal,
    a.photo_url,
    a.pastille,
    a.score_total,
    a.note_google,
    a.nombre_avis_google,
    a.abonnes_instagram,
    a.publications_instagram,
    a.delai_reponse_minutes,
    a.telephone,
    a.telephone_visible,
    a.siren_verifie,
    a.date_creation_entreprise,
    a.horaires,
    a.dispo_urgence,
    a.dispo_nuit,
    a.dispo_weekend,
    a.dispo_feries,
    a.absence_debut,
    a.absence_fin,
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
-- FIN — pensez aux deux actions listées en tête de script
-- ============================================================
