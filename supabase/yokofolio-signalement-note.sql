-- ============================================================
-- YOKOFOLIO — LA NOTE DE TRAITEMENT D'UN SIGNALEMENT (14e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-bio-150.sql (13e).
--  Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  L'admin peut écrire une NOTE sur un signalement (ce qu'il a
--  constaté, ce qu'il a fait). Jusqu'ici, rien ne permettait de la
--  conserver : la colonne `note` la garde, et la section
--  « Signalements » de /admin la réaffiche sur la carte du
--  signalement, avant comme après archivage.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, aucune autre
--  table.

alter table public.signalements_fiches
  add column if not exists note text;

comment on column public.signalements_fiches.note is
  'Note de traitement écrite par l''administrateur, réaffichée sur le signalement.';
