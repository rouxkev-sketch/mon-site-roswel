-- ============================================================
--  ROSWEL — PROSPECTION : « cette fiche Google est bien la sienne »
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Réexécutable sans danger.
--
--  À QUOI ÇA SERT
--  --------------
--  Rattacher une fiche Google à un artisan est une opération à
--  RISQUE : Google se trompe, et un mauvais rattachement afficherait
--  la note et les avis de QUELQU'UN D'AUTRE sur une fiche Roswel.
--  Un rattachement faux est bien pire qu'un rattachement absent.
--
--  L'outil ne rattache donc automatiquement que lorsque le nom ET
--  l'adresse concordent nettement. Cette colonne mémorise ces
--  rattachements-là.
--
--  false = aucune fiche Google, ou une simple PROPOSITION laissée
--          dans les notes, à valider à la main
--  true  = fiche Google rattachée avec une confiance haute
--
--  La colonne passe à `true` toute seule au moment du rattachement
--  (voir src/lib/google-prospects.ts) : rien à cocher en plus.
-- ============================================================

alter table public.artisans_prospects
  add column if not exists google_confirme boolean not null default false;

-- Les lignes déjà collectées restent « non confirmées » : c'est bien
-- la valeur par défaut ci-dessus, aucune mise à jour n'est nécessaire.

-- ============================================================
-- FIN — vérification rapide dans le SQL Editor :
-- select google_confirme, count(*) from public.artisans_prospects
--   group by google_confirme;
-- ============================================================
