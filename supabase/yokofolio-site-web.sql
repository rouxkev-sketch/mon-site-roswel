-- ============================================================
-- YOKOFOLIO — LE SITE WEB DU TATOUEUR (colonne facultative)
-- ============================================================
-- À passer dans l'éditeur SQL de Supabase, EN DERNIER de la chaîne :
--   1. tatoueurs.sql
--   2. yokofolio-photos-par-style.sql
--   3. yokofolio-styles-adresse.sql
--   4. yokofolio-bio.sql
--   5. yokofolio-fiches-tatoueurs.sql
--   6. yokofolio-site-web.sql   ← ce fichier
--
-- Ce qu'il fait :
--   - ajoute la colonne `site_web` (texte, facultative) à la table
--     `tatoueurs` : l'adresse complète du site du tatoueur
--     (« https://tonatelier.fr »). Les fiches l'affichent sous
--     l'adresse du salon — domaine seul, sans www ni https ;
--   - donne un site crédible à cinq fiches de démonstration (les
--     autres n'en ont pas : le champ est facultatif).
--
-- TANT QUE CE FICHIER N'EST PAS PASSÉ, le site continue de tourner :
-- la lecture retombe d'elle-même sur les colonnes existantes, et le
-- formulaire réessaie sans `site_web` si la colonne manque.
-- Repasser ce fichier une seconde fois ne casse rien (IF NOT EXISTS,
-- UPDATE rejouables).

alter table public.tatoueurs
  add column if not exists site_web text;

comment on column public.tatoueurs.site_web is
  'Adresse complète du site web du tatoueur (facultative), ex. https://tonatelier.fr — affichée sur la fiche en domaine seul.';

-- ------------------------------------------------------------
-- Les démonstrations : cinq fiches avec un site, comme en vrai.
-- ------------------------------------------------------------
update public.tatoueurs set site_web = 'https://ateliercorvus.fr'     where slug = 'atelier-corvus';
update public.tatoueurs set site_web = 'https://studiomilletraits.fr' where slug = 'studio-mille-traits';
update public.tatoueurs set site_web = 'https://encre-et-sel.fr'      where slug = 'encre-et-sel';
update public.tatoueurs set site_web = 'https://maisonvermillon.fr'   where slug = 'maison-vermillon';
update public.tatoueurs set site_web = 'https://studiocameleon.fr'    where slug = 'studio-cameleon';
