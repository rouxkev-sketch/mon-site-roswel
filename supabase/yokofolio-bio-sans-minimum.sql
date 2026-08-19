-- ============================================================
-- YOKOFOLIO — LA BIO N'A PLUS DE MINIMUM (passe nº 387, point 1)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. Réexécutable sans danger, autant de fois qu'on
--  veut, et sans effet si la borne est déjà la bonne.
--
--  ██ POURQUOI CE FICHIER EXISTE ██
--  --------------------------------
--  LE SYMPTÔME : on modifie sa biographie dans l'espace tatoueur, on
--  enregistre, et rien ne change — ni sur le formulaire au rechargement,
--  ni sur la fiche publique.
--
--  LA CAUSE : la migration nº 13 (`yokofolio-bio-150.sql`) avait posé
--
--      check (bio is null or char_length(bio) between 80 and 150)
--
--  c'est-à-dire un MINIMUM DE 80 CARACTÈRES. La migration nº 18
--  (`yokofolio-hors-ligne.sql`) l'a plus tard remplacée par une borne
--  haute seule — mais elle fait DIX autres choses, et une base sur
--  laquelle elle n'a pas été passée garde le minimum.
--  Or le FORMULAIRE, lui, ne connaît aucun minimum : il annonce la bio
--  comme facultative et n'en contrôle que le plafond de 150. Toute bio
--  de moins de 80 caractères est donc acceptée à l'écran, envoyée, puis
--  REFUSÉE par la base — et comme la fiche s'écrit en UN SEUL `update`,
--  c'est l'enregistrement ENTIER qui est annulé. D'où le symptôme :
--  rien nulle part, ni sur le formulaire, ni sur la fiche.
--
--  CE FICHIER NE FAIT QUE ÇA : reposer la contrainte sans minimum,
--  exactement comme la nº 18, mais seule et sans rien d'autre autour.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : aucune donnée, aucune autre colonne,
--  aucune autre table, et rien du projet artisans. Les bios déjà
--  écrites restent telles quelles.
--
--  POUR VÉRIFIER, AVANT OU APRÈS :
--    select pg_get_constraintdef(oid)
--    from pg_constraint
--    where conname = 'tatoueurs_bio_longueur';
--  La bonne réponse ne contient PAS le mot « between ».

alter table public.tatoueurs
  drop constraint if exists tatoueurs_bio_longueur;

--  `not valid` : les lignes existantes ne sont pas revérifiées (la
--  migration ne peut donc pas échouer sur une vieille bio), mais toute
--  écriture nouvelle l'est.
alter table public.tatoueurs
  add constraint tatoueurs_bio_longueur
  check (bio is null or char_length(bio) <= 150) not valid;

comment on column public.tatoueurs.bio is
  'Présentation libre du tatoueur — FACULTATIVE, 150 caractères au plus, affichée sur la fiche juste sous le nom.';
