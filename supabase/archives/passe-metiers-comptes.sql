-- ================================================================
-- PASSE « 8 MÉTIERS + TYPE DE COMPTE (indépendant / société) »
-- ================================================================
-- À COPIER-COLLER ENTIÈREMENT dans l'éditeur SQL de Supabase.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
--
-- 1) Les 3 nouveaux métiers (vitrier, menuisier, maçon) NE demandent
--    AUCUNE modification de base : les métiers sont du texte libre
--    dans la table artisan_metiers, validés uniquement par le site
--    (src/config/roswel.ts). Rien à faire ici pour eux.
--
-- 2) TYPE DE COMPTE : on ajoute la colonne type_compte
--    ('independant' / 'societe') et la colonne nom_responsable (le
--    « Dirigée par … » facultatif des sociétés). Les fiches existantes
--    passent par défaut en « indépendant ».
--
-- 3) La fonction de recherche renvoie désormais type_compte,
--    nom_societe et nom_responsable (pour afficher la bonne forme de
--    photo et le bon nom sur les cartes).
-- ================================================================

-- ----------------------------------------------------------------
-- 1) COLONNES type_compte + nom_responsable
-- ----------------------------------------------------------------
alter table public.artisans
  add column if not exists type_compte text not null default 'independant',
  add column if not exists nom_responsable text;

-- Valeurs autorisées (on retire d'abord une éventuelle ancienne
-- contrainte du même nom pour rester réexécutable).
alter table public.artisans
  drop constraint if exists artisans_type_compte_check;
alter table public.artisans
  add constraint artisans_type_compte_check
  check (type_compte in ('independant', 'societe'));

-- Les fiches déjà enregistrées restent « indépendant » (défaut).
update public.artisans set type_compte = 'independant' where type_compte is null;

-- ----------------------------------------------------------------
-- 2) FONCTION DE RECHERCHE — ajout de type_compte / nom_societe /
--    nom_responsable (même signature qu'avant).
-- ----------------------------------------------------------------
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
  type_compte text,
  nom_societe text,
  nom_responsable text,
  ville_nom text,
  ville_code_postal text,
  photo_url text,
  pastille text,
  score_total integer,
  note_google numeric,
  nombre_avis_google integer,
  abonnes_instagram integer,
  publications_instagram integer,
  telephone text,
  telephone_visible boolean,
  whatsapp text,
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
    a.type_compte,
    a.nom_societe,
    a.nom_responsable,
    a.ville_nom,
    a.ville_code_postal,
    a.photo_url,
    a.pastille,
    a.score_total,
    a.note_google,
    a.nombre_avis_google,
    a.abonnes_instagram,
    a.publications_instagram,
    a.telephone,
    a.telephone_visible,
    a.whatsapp,
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

-- ================================================================
-- FIN — pensez à recréer les fiches de démonstration
-- (/admin/artisans-demo) après exécution.
-- ================================================================
