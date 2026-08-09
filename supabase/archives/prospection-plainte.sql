-- ============================================================
--  ROSWEL — PROSPECTION : journaliser les PLAINTES
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
--  Une PLAINTE, c'est un destinataire qui a cliqué « courrier
--  indésirable ». C'est l'information la plus importante de toute la
--  prospection : au-delà de 3 plaintes pour 1 000 messages
--  (SEUIL_PLAINTE_CRITIQUE dans src/config/roswel.ts), les
--  messageries commencent à bloquer le domaine ENTIER — y compris les
--  e-mails ordinaires du site.
--
--  Jusqu'ici la colonne `resultat` du journal n'acceptait que quatre
--  valeurs : envoye, simule, echec, rebond. Il en manquait une. Sans
--  elle, l'indicateur « taux de plainte » de /admin/prospection
--  affiche zéro quoi qu'il arrive, et le webhook de Resend
--  (/api/webhooks/resend) ne peut pas marquer l'envoi fautif.
--
--  On remplace donc la contrainte par la même, augmentée de
--  « plainte ». Aucune donnée n'est touchée : les lignes existantes
--  restent valables.
-- ============================================================

alter table public.prospection_envois
  drop constraint if exists prospection_envois_resultat_check;

alter table public.prospection_envois
  add constraint prospection_envois_resultat_check
  check (resultat in (
    'envoye',   -- accepté par Resend
    'simule',   -- pas de clé RESEND_API_KEY : affiché dans le terminal
    'echec',    -- refusé (erreur technique)
    'rebond',   -- adresse invalide, signalée après coup
    'plainte'   -- « courrier indésirable » signalé par le destinataire
  ));

-- ============================================================
-- FIN — vérification rapide dans le SQL Editor :
-- select resultat, count(*) from public.prospection_envois
--   group by resultat order by 2 desc;
-- ============================================================
