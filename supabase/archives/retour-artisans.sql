-- ================================================================
-- RETOUR AU MODÈLE « ARTISANS » — annulation du pivot « chefs à domicile »
-- ================================================================
-- À COPIER-COLLER ENTIÈREMENT dans l'éditeur SQL de Supabase.
-- Idempotent : peut être exécuté plusieurs fois sans risque.
--
-- Ce script rétablit la base dans son état « artisans du bâtiment » :
--   1. la fonction de recherche rechercher_artisans reprend sa version
--      ARTISANS (filtres Urgence / Nuit / Week-end, SANS « moment »,
--      renvoie photo_url — la photo de couverture) ;
--   2. on retire les colonnes ajoutées pour les chefs (photo de plat,
--      photo de visage, galerie, moments, convives, tarifs) ;
--   3. on supprime les derniers vestiges éventuels (table
--      chef_photos_categorie, colonne favoris.categorie_slug).
--
-- IMPORTANT — APRÈS EXÉCUTION :
--   * recréez les fiches de démonstration (page /admin/artisans-demo) ;
--   * pour d'éventuels artisans réels, remettez leurs métiers parmi les
--     5 métiers du bâtiment (plombier, chauffagiste, electricien,
--     peintre, serrurier) : les anciens slugs « chef-… » ne
--     correspondent plus à aucun métier recherchable.
-- ================================================================

-- ----------------------------------------------------------------
-- 1) FONCTION DE RECHERCHE — version ARTISANS
--    (on remplace la version « chefs » ; même signature).
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

-- ----------------------------------------------------------------
-- 2) COLONNES PROPRES AUX CHEFS — on les retire de la table artisans
--    (la fonction ci-dessus ne les référence plus).
-- ----------------------------------------------------------------
alter table public.artisans
  drop column if exists photo_plat_url,
  drop column if exists photo_visage_url,
  drop column if exists galerie,
  drop column if exists moments,
  drop column if exists moment,
  drop column if exists min_couverts,
  drop column if exists max_couverts,
  drop column if exists prix_min_personne,
  drop column if exists prix_min_reservation;

-- ----------------------------------------------------------------
-- 3) VESTIGES ÉVENTUELS (si un ancien script n'avait pas déjà nettoyé)
-- ----------------------------------------------------------------
drop table if exists public.chef_photos_categorie;
alter table public.favoris drop column if exists categorie_slug;

-- ================================================================
-- FIN — pensez à recréer les fiches de démonstration
-- (/admin/artisans-demo) après exécution.
-- ================================================================
