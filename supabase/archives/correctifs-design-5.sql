-- ============================================================
--  ROSWEL — CORRECTIF DESIGN N°5 : ville de l'artisan, téléphone
--  sur la carte, ancienneté Sirene
-- ============================================================
--  À exécuter : Supabase → SQL Editor → New query → Run
--  (Ce script REMPLACE le correctif n°4 : il fonctionne que les
--   précédents aient été exécutés ou non, sans danger si relancé.
--   Après exécution : recréer les artisans de démonstration depuis
--   /admin/artisans-demo.)
--
--  Nouveautés :
--  - l'artisan choisit sa VILLE (plus d'adresse complète) : le
--    centre de la commune sert au calcul du rayon d'intervention,
--    et « Ville (code postal) » s'affiche sur sa carte ;
--  - case « afficher mon téléphone sur ma fiche » : le bouton
--    d'appel des cartes et de la fiche la respecte ;
--  - la recherche renvoie le SIRET vérifié + la date de création
--    de l'entreprise (annuaire Sirene) pour le badge
--    « SIRET vérifié · X ans d'existence » ;
--  - fin des colonnes d'affichage nom_societe côté recherche (la
--    société reste stockée : formulaire + admin).
-- ============================================================

-- Rattrapage des correctifs précédents (sans danger si déjà faits)
alter table public.artisans add column if not exists nom_societe text;
alter table public.artisans drop column if exists annees_experience;

-- La ville de l'artisan (remplace l'adresse complète)
alter table public.artisans add column if not exists ville_code_insee text;
alter table public.artisans add column if not exists ville_nom text;
alter table public.artisans add column if not exists ville_code_postal text;

-- La case « afficher mon téléphone sur ma fiche » (cochée par défaut)
alter table public.artisans add column if not exists telephone_visible boolean not null default true;

-- L'artisan peut renseigner ces champs depuis son formulaire
grant insert (nom_societe, ville_code_insee, ville_nom, ville_code_postal, telephone_visible)
  on public.artisans to authenticated;
grant update (nom_societe, ville_code_insee, ville_nom, ville_code_postal, telephone_visible)
  on public.artisans to authenticated;

-- ============================================================
-- La recherche : ville, téléphone (avec sa visibilité), SIRET
-- vérifié + date de création (badge d'existence) — sans société
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
  siret_verifie boolean,
  date_creation_entreprise date,
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
    a.siret_verifie,
    a.date_creation_entreprise,
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
