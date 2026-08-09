-- ============================================================
--  YOKOFOLIO — L'ANNONCE NE SE DIT QU'UNE FOIS
--  (migration nº 27 — à passer APRÈS yokofolio-modes-et-liaisons.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  UNE COLONNE, UN PROBLÈME DE FOND
--  ---------------------------------
--  `annonce_vue_le` — LA FENÊTRE « Modifications envoyées » se
--     rouvrait à CHAQUE arrivée sur le formulaire : à chaque
--     reconnexion, et sur chaque appareil. Elle était décidée par
--     l'ÉTAT de la fiche (« une version attend la relecture »), qui
--     reste vrai des jours durant — alors qu'une annonce, par nature,
--     ne se dit qu'une fois.
--     La date de lecture vit donc EN BASE, sur la fiche : elle suit la
--     personne d'un appareil à l'autre. Chaque nouvel envoi la remet à
--     null — c'est une NOUVELLE annonce, elle a le droit de s'afficher.
-- ============================================================

-- ------------------------------------------------------------
-- 1) L'ANNONCE DÉJÀ VUE
-- ------------------------------------------------------------
alter table public.tatoueurs
  add column if not exists annonce_vue_le timestamptz;

comment on column public.tatoueurs.annonce_vue_le is
  'Quand la fenêtre « Modifications envoyées » a été vue pour la version EN COURS d''attente. Null = jamais vue (elle s''affichera). Remise à null à chaque nouvel envoi.';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Les annonces déjà vues :
--  select nom, statut, publie, annonce_vue_le
--    from public.tatoueurs order by nom;
