-- ============================================================
--  ROSWEL — COMPLÉMENT ÉTAPE 11 : SEO (plan du site)
-- ============================================================
--  À exécuter comme les précédents :
--  Supabase → SQL Editor → New query → tout coller → Run
-- ============================================================

-- ============================================================
-- FONCTION pages_metier_ville — les pages qui EXISTENT
-- ------------------------------------------------------------
-- Le plan du site (sitemap.xml) ne doit référencer que les pages
-- /metier/ville où au moins un artisan validé couvre la commune
-- (règle « jamais de page vide »). Cette fonction les liste.
-- Limitée à 5 000 lignes par prudence (largement assez au
-- lancement ; à optimiser quand il y aura des milliers d'artisans).
-- ============================================================
create or replace function public.pages_metier_ville()
returns table (metier text, ville_slug text)
language sql
stable
set search_path = ''
as $$
  select distinct m.metier, c.slug as ville_slug
  from public.artisans a
  join public.artisan_metiers m on m.artisan_id = a.id
  cross join public.communes c
  where a.statut_validation = 'valide'
    and a.latitude is not null
    and a.longitude is not null
    and public.distance_km(a.latitude, a.longitude, c.latitude, c.longitude)
        <= a.rayon_intervention_km
    and not (c.code_insee = any(a.communes_exclues))
  limit 5000
$$;

grant execute on function public.pages_metier_ville to anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
