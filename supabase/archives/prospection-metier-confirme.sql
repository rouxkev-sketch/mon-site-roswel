-- ============================================================
--  ROSWEL — PROSPECTION : « ce métier, je l'ai relu »
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
--  Le métier d'un prospect est DÉDUIT de l'activité qu'il a déclarée
--  à l'INSEE. C'est une proposition, souvent ambiguë : l'activité
--  « installation d'eau et de gaz » ne dit pas si l'artisan est
--  plombier, chauffagiste, ou les deux.
--
--  Cette colonne mémorise les lignes DÉJÀ RELUES à la main dans
--  /admin/prospection. Sans elle, impossible de savoir où l'on en est
--  dans le tri — on relirait sans fin les mêmes fiches.
--
--  false = métier encore déduit automatiquement (à relire)
--  true  = métier choisi par l'admin (relu, tranché)
--
--  La colonne passe à `true` toute seule dès que le métier est
--  enregistré depuis le tableau (voir src/app/api/admin/prospection/
--  route.ts) : rien à cocher en plus.
-- ============================================================

alter table public.artisans_prospects
  add column if not exists metier_confirme boolean not null default false;

-- Les lignes déjà collectées restent « à relire » : c'est bien la
-- valeur par défaut ci-dessus, aucune mise à jour n'est nécessaire.

-- ============================================================
-- FIN — vérification rapide dans le SQL Editor :
-- select metier_confirme, count(*) from public.artisans_prospects
--   group by metier_confirme;
-- ============================================================
