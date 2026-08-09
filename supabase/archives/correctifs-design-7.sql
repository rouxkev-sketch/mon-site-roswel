-- ================================================================
-- CORRECTIFS DESIGN 7 — suppression de la messagerie interne
-- ================================================================
-- À COPIER-COLLER ENTIÈREMENT dans l'éditeur SQL de Supabase
-- (après correctifs-design-6.sql).
--
-- Ce qui change :
--  * la recherche renvoie le numéro WHATSAPP de chaque artisan
--    (l'icône message des cartes devient une icône WhatsApp) ;
--  * elle ne renvoie plus le délai de réponse : sans messagerie,
--    il n'y a plus de rapidité à mesurer — le classement repose
--    à 100 % sur le score de confiance (tri fait par le site).
--
-- Les tables de la messagerie (messages, conversations…) ne sont
-- PAS supprimées : elles ne sont simplement plus utilisées par le
-- site. Vous pourrez les archiver ou les supprimer plus tard, à
-- tête reposée.
-- ================================================================

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

-- ============================================================
-- FIN — après exécution : recréer les fiches de démonstration
-- (/admin/artisans-demo) pour donner un WhatsApp à toutes
-- ============================================================
