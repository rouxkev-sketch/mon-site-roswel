-- ============================================================
--  ADRESSE PRÉCISE FACULTATIVE SUR LA FICHE ARTISAN
-- ============================================================
--  Complément d'adresse (rue + numéro) facultatif : la VILLE reste
--  obligatoire, mais l'artisan peut renseigner une adresse précise
--  pour afficher une localisation exacte (carte OpenStreetMap) sur sa
--  fiche — un local où il reçoit ses clients, par exemple.
--
--  La colonne `adresse` existe déjà dans le schéma d'origine
--  (schema.sql) ; cet ajout est idempotent et sans danger si elle est
--  déjà présente. Le formulaire écrit cette valeur via le serveur
--  (clé de service), donc aucun grant supplémentaire n'est nécessaire.
--  À exécuter dans l'éditeur SQL de Supabase.
-- ============================================================

alter table public.artisans add column if not exists adresse text;
