-- ============================================================
--  YOKOFOLIO — QUELLES MIGRATIONS SONT VRAIMENT PASSÉES ?
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--
--  ⚠️ CE FICHIER N'ÉCRIT RIEN. Il ne crée rien, ne modifie rien, ne
--  supprime rien : il LIT le catalogue de la base et le compare à ce
--  que chaque migration est censée avoir créé. On peut le passer
--  autant de fois qu'on veut, à n'importe quel moment.
--
--  CE QU'IL RÉPOND
--  ---------------
--  Une ligne par migration, dans l'ordre où elles doivent être
--  passées, avec :
--    · ✅ PASSÉE      — tout ce qu'elle crée est là ;
--    · ⚠️ INCOMPLÈTE  — une partie seulement (elle a échoué en cours
--                      de route, ou quelqu'un a supprimé un objet) ;
--    · ❌ MANQUANTE   — rien de ce qu'elle crée n'existe.
--  et, quand il manque quelque chose, LA LISTE de ce qui manque.
--
--  COMMENT LIRE LE RÉSULTAT
--  ------------------------
--  On repasse les fichiers ❌ et ⚠️ DANS L'ORDRE DE LA COLONNE
--  « ordre », de haut en bas. Aucun risque à repasser un fichier déjà
--  appliqué : toutes sont relançables (vérifié en les rejouant deux
--  fois chacune sur une base vierge).
--
--  D'OÙ VIENT LA LISTE DES OBJETS ATTENDUS
--  ---------------------------------------
--  Elle n'est pas écrite à la main : elle est EXTRAITE des fichiers de
--  supabase/ par l'analyseur syntaxique de PostgreSQL lui-même —
--  chaque `create table`, `add column`, `add constraint`,
--  `create index`, `create view`, `create function`, `create policy`,
--  `create trigger` y figure. 269 objets, plus 20 traces en données.
--
--  ⚠️ LES OBJETS PARTAGÉS SONT COMPTÉS À LA PREMIÈRE MIGRATION QUI LES
--  CRÉE. Exemple : la contrainte `tatoueurs_bio_longueur` est refaite
--  par les nº 4, 13 et 18. La compter trois fois ferait passer les
--  nº 13 et 18 pour appliquées dès la nº 4. Elles sont donc reconnues
--  à leur CONTENU (le plafond de 150, la disparition du minimum de
--  80), pas à leur nom.
--
--  ⚠️⚠️ CE QU'UNE MIGRATION ULTÉRIEURE A SUPPRIMÉ N'EST PLUS ATTENDU.
--  C'est la règle la plus importante de ce fichier, et la plus facile
--  à oublier : une migration qui en DÉFAIT une autre laisse derrière
--  elle des objets qui n'ont plus lieu d'exister. Les chercher encore
--  ferait passer une base PARFAITEMENT À JOUR pour incomplète — le
--  contrôle accuserait à tort, ce qui est pire que de se taire.
--  Ces objets sont donc RETIRÉS de la liste de la migration qui les a
--  créés, avec un commentaire nommant celle qui les a défaits, et leur
--  ABSENCE devient une trace « contenu » de cette dernière : ils
--  changent de camp, ils ne cessent pas d'être vérifiés.
--  Les cas connus, à ce jour :
--    · nº 26 → nº 45 : deux politiques de liaison remplacées ;
--    · nº 36 → nº 47 : la colonne `formulaire_demande`, supprimée ;
--    · nº 31 → nº 48 : la colonne `zone`, sa contrainte et ses deux
--      index (dont l'unicité, sans remplaçant).
--  ⚠️ À RELIRE À CHAQUE MIGRATION QUI SUPPRIME quoi que ce soit.
--
--  ⚠️ CERTAINES MIGRATIONS NE CRÉENT AUCUN OBJET : elles ne font que
--  modifier des lignes (styles des démos, fiches internationales…).
--  Elles sont reconnues à une trace en données — indiquée en clair
--  dans la colonne « objet ». Une base sans fiches de démonstration
--  les montrera « manquantes » alors qu'elles ont peut-être tourné :
--  les repasser ne coûte rien.
-- ============================================================

with attendu (ordre, fichier, genre, objet) as (values
  ( 1, 'tatoueurs.sql', 'table', 'public.tatoueurs'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.id'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.cree_le'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.nom'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.slug'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.ville_code_insee'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.ville_nom'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.ville_slug'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.latitude'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.longitude'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.styles'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.lien_instagram'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.photo_principale'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.photos'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.tatoueurs.publie'),
  ( 1, 'tatoueurs.sql', 'index', 'idx_tatoueurs_ville'),
  ( 1, 'tatoueurs.sql', 'index', 'idx_tatoueurs_styles'),
  ( 1, 'tatoueurs.sql', 'index', 'idx_tatoueurs_publie'),
  ( 1, 'tatoueurs.sql', 'politique', 'lecture publique des tatoueurs publies'),
  ( 1, 'tatoueurs.sql', 'colonne', 'public.favoris.tatoueur_id'),
  ( 1, 'tatoueurs.sql', 'index', 'idx_favoris_tatoueur'),
  ( 1, 'tatoueurs.sql', 'index', 'idx_favoris_particulier_tatoueur'),
  ( 2, 'yokofolio-photos-par-style.sql', 'colonne', 'public.tatoueurs.photos_styles'),
  ( 2, 'yokofolio-photos-par-style.sql', 'colonne', 'public.tatoueurs.lien_tiktok'),
  ( 2, 'yokofolio-photos-par-style.sql', 'contrainte', 'tatoueurs_photos_styles_objet'),
  ( 3, 'yokofolio-styles-adresse.sql', 'colonne', 'public.tatoueurs.adresse'),
  ( 3, 'yokofolio-styles-adresse.sql', 'colonne', 'public.tatoueurs.code_postal'),
  ( 4, 'yokofolio-bio.sql', 'colonne', 'public.tatoueurs.bio'),
  ( 4, 'yokofolio-bio.sql', 'contrainte', 'tatoueurs_bio_longueur'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'colonne', 'public.tatoueurs.user_id'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'colonne', 'public.tatoueurs.statut'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'contrainte', 'tatoueurs_statut_valide'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'creation de sa propre fiche'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'lecture de sa propre fiche'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'photos tatoueurs visibles par tous'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'depot dans son propre dossier'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'remplacement dans son propre dossier'),
  ( 5, 'yokofolio-fiches-tatoueurs.sql', 'politique', 'menage dans son propre dossier'),
  ( 6, 'yokofolio-site-web.sql', 'colonne', 'public.tatoueurs.site_web'),
  ( 7, 'yokofolio-popularite.sql', 'table', 'public.clics_fiches'),
  ( 7, 'yokofolio-popularite.sql', 'colonne', 'public.clics_fiches.id'),
  ( 7, 'yokofolio-popularite.sql', 'colonne', 'public.clics_fiches.tatoueur_slug'),
  ( 7, 'yokofolio-popularite.sql', 'colonne', 'public.clics_fiches.visiteur'),
  ( 7, 'yokofolio-popularite.sql', 'colonne', 'public.clics_fiches.jour'),
  ( 7, 'yokofolio-popularite.sql', 'colonne', 'public.clics_fiches.cree_le'),
  ( 7, 'yokofolio-popularite.sql', 'index', 'clics_fiches_unicite'),
  ( 7, 'yokofolio-popularite.sql', 'index', 'clics_fiches_par_fiche'),
  ( 7, 'yokofolio-popularite.sql', 'vue', 'public.clics_tatoueurs'),
  ( 9, 'yokofolio-filtres.sql', 'colonne', 'public.tatoueurs.filtres_technique'),
  ( 9, 'yokofolio-filtres.sql', 'colonne', 'public.tatoueurs.filtres_composition'),
  (10, 'yokofolio-moderation.sql', 'colonne', 'public.tatoueurs.motifs_moderation'),
  (10, 'yokofolio-moderation.sql', 'colonne', 'public.tatoueurs.note_moderation'),
  (10, 'yokofolio-moderation.sql', 'colonne', 'public.tatoueurs.decide_le'),
  (10, 'yokofolio-moderation.sql', 'contrainte', 'tatoueurs_statut_check'),
  (11, 'yokofolio-signalements.sql', 'table', 'public.signalements_fiches'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.id'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.tatoueur_slug'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.motifs'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.details'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.traite'),
  (11, 'yokofolio-signalements.sql', 'colonne', 'public.signalements_fiches.cree_le'),
  (11, 'yokofolio-signalements.sql', 'index', 'signalements_fiches_a_traiter'),
  (12, 'yokofolio-contact.sql', 'table', 'public.messages_yokofolio'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.id'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.nom'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.email'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.message'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.ip'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.traite'),
  (12, 'yokofolio-contact.sql', 'colonne', 'public.messages_yokofolio.cree_le'),
  (12, 'yokofolio-contact.sql', 'index', 'messages_yokofolio_par_ip'),
  (14, 'yokofolio-signalement-note.sql', 'colonne', 'public.signalements_fiches.note'),
  (15, 'yokofolio-fiche-brouillon.sql', 'colonne', 'public.tatoueurs.brouillon'),
  (15, 'yokofolio-fiche-brouillon.sql', 'colonne', 'public.tatoueurs.validation_a_notifier'),
  (15, 'yokofolio-fiche-brouillon.sql', 'politique', 'modification de sa propre fiche'),
  (15, 'yokofolio-fiche-brouillon.sql', 'fonction', 'public.tatoueurs_garde_fou'),
  (15, 'yokofolio-fiche-brouillon.sql', 'declencheur', 'tatoueurs_garde_fou'),
  (18, 'yokofolio-hors-ligne.sql', 'colonne', 'public.tatoueurs.hors_ligne'),
  (19, 'yokofolio-localisation-mondiale.sql', 'colonne', 'public.tatoueurs.region'),
  (19, 'yokofolio-localisation-mondiale.sql', 'colonne', 'public.tatoueurs.pays'),
  (19, 'yokofolio-localisation-mondiale.sql', 'colonne', 'public.tatoueurs.code_pays'),
  (19, 'yokofolio-localisation-mondiale.sql', 'colonne', 'public.tatoueurs.lieu_id'),
  (19, 'yokofolio-localisation-mondiale.sql', 'index', 'idx_tatoueurs_position'),
  (19, 'yokofolio-localisation-mondiale.sql', 'index', 'idx_tatoueurs_pays'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.type_fiche'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.mode_exercice'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.rayon_zone_km'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.villes'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.photo_profil'),
  (21, 'yokofolio-type-mode-exercice.sql', 'colonne', 'public.tatoueurs.ancien_slug'),
  (21, 'yokofolio-type-mode-exercice.sql', 'contrainte', 'tatoueurs_type_fiche_connu'),
  (21, 'yokofolio-type-mode-exercice.sql', 'fonction', 'public.yokofolio_slug'),
  (21, 'yokofolio-type-mode-exercice.sql', 'index', 'idx_tatoueurs_ancien_slug'),
  (22, 'yokofolio-suppression-differee.sql', 'colonne', 'public.tatoueurs.supprime_le'),
  (22, 'yokofolio-suppression-differee.sql', 'index', 'idx_tatoueurs_supprime_le'),
  (22, 'yokofolio-suppression-differee.sql', 'table', 'public.suppressions_comptes'),
  (22, 'yokofolio-suppression-differee.sql', 'colonne', 'public.suppressions_comptes.user_id'),
  (22, 'yokofolio-suppression-differee.sql', 'colonne', 'public.suppressions_comptes.demandee_le'),
  (22, 'yokofolio-suppression-differee.sql', 'colonne', 'public.suppressions_comptes.purge_le'),
  (22, 'yokofolio-suppression-differee.sql', 'colonne', 'public.suppressions_comptes.courriel'),
  (22, 'yokofolio-suppression-differee.sql', 'index', 'idx_suppressions_purge'),
  (22, 'yokofolio-suppression-differee.sql', 'vue', 'public.comptes_a_purger'),
  (24, 'yokofolio-fiches-multiples.sql', 'index', 'idx_tatoueurs_compte'),
  (24, 'yokofolio-fiches-multiples.sql', 'colonne', 'public.tatoueurs.purge_le'),
  (24, 'yokofolio-fiches-multiples.sql', 'index', 'idx_tatoueurs_purge_le'),
  (24, 'yokofolio-fiches-multiples.sql', 'vue', 'public.fiches_a_purger'),
  (25, 'yokofolio-notifications.sql', 'table', 'public.notifications_compte'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.id'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.user_id'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.fiche_id'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.fiche_nom'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.genre'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.titre'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.detail'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.motifs'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.creee_le'),
  (25, 'yokofolio-notifications.sql', 'colonne', 'public.notifications_compte.lue_le'),
  (25, 'yokofolio-notifications.sql', 'index', 'idx_notifications_compte'),
  (25, 'yokofolio-notifications.sql', 'index', 'idx_notifications_non_lues'),
  (25, 'yokofolio-notifications.sql', 'politique', 'lecture de ses notifications'),
  (25, 'yokofolio-notifications.sql', 'politique', 'marquer ses notifications comme lues'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'table', 'public.modes_exercice'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.tatoueur_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.genre'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.salon_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.intitule'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.adresse'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.code_postal'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.ville'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.region'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.pays'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.code_pays'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.latitude'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.longitude'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.lieu_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.debut_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.fin_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.ordre'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.modes_exercice.cree_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'modes_exercice_genre_connu'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'modes_exercice_dates_coherentes'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'modes_exercice_situe'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_modes_exercice_fiche'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_modes_exercice_salon'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_modes_exercice_point'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'table', 'public.studios'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.tatoueur_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.nom'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.intitule'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.adresse'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.code_postal'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.ville'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.region'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.pays'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.code_pays'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.latitude'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.longitude'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.lieu_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.principal'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.ordre'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.studios.cree_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_studios_un_principal'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_studios_fiche'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_studios_point'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'table', 'public.liaisons_artiste_salon'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.artiste_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.salon_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.mode_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.origine'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.statut'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.demandee_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.liaisons_artiste_salon.repondu_le'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'liaisons_origine_connue'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'liaisons_statut_connu'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'contrainte', 'liaisons_pas_soi_meme'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_liaisons_unique'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_liaisons_salon'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'index', 'idx_liaisons_artiste'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'colonne', 'public.notifications_compte.liaison_id'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'vue', 'public.equipe_salon'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'vue', 'public.modes_exercice_actifs'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'lecture publique des modes'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'lecture publique des studios'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'ecriture de ses modes'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'ecriture de ses studios'),
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'lecture publique des liaisons'),
  --  ⚠️ DEUX POLITIQUES DE LA Nº 26 NE SONT PLUS ATTENDUES, et c'est
  --  la nº 45 qui les a retirées :
  --   · « demander une liaison » est remplacée par « creer un
  --     rattachement » (elle exigeait l'ancien statut `demande`, ce
  --     qui bloquait TOUS les rattachements depuis la nº 39) ;
  --   · « repondre a une liaison » n'a plus d'objet — il n'y a plus
  --     de demande à valider ni à refuser.
  --  Les chercher encore ferait passer une base à jour pour incomplète.
  (26, 'yokofolio-modes-et-liaisons.sql', 'politique', 'retirer sa liaison'),
  (27, 'yokofolio-annonce-vue.sql', 'colonne', 'public.tatoueurs.annonce_vue_le'),
  (28, 'yokofolio-verrou-exercice.sql', 'colonne', 'public.tatoueurs.exercice_verrouille'),
  (28, 'yokofolio-verrou-exercice.sql', 'colonne', 'public.tatoueurs.exercice_debloque_le'),
  (28, 'yokofolio-verrou-exercice.sql', 'colonne', 'public.tatoueurs.exercice_debloque_par'),
  (28, 'yokofolio-verrou-exercice.sql', 'index', 'idx_tatoueurs_exercice_verrouille'),
  (28, 'yokofolio-verrou-exercice.sql', 'fonction', 'public.tatoueurs_verrou_exercice'),
  (28, 'yokofolio-verrou-exercice.sql', 'declencheur', 'trg_tatoueurs_verrou_exercice'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'table', 'public.photos_tatoueur'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.id'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.tatoueur_id'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.style'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.rendu'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.url'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.miniature'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.ordre'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.photos_tatoueur.cree_le'),
  --  ⚠️ QUATRE OBJETS DE LA Nº 31 NE SONT PLUS ATTENDUS, et c'est la
  --  nº 48 (yokofolio-fin-des-zones.sql) qui les a retirés — les
  --  chercher encore fait passer une base PARFAITEMENT À JOUR pour
  --  incomplète :
  --   · colonne `photos_tatoueur.zone` et sa contrainte
  --     `photos_zone_connue` — les zones du corps ont été abandonnées ;
  --   · index `photos_tatoueur_zone` — il n'indexait qu'elle ;
  --   · index `photos_tatoueur_unicite` — il imposait UN couple
  --     zone + rendu par style ; le nouveau modèle accepte plusieurs
  --     photos par couple style + rendu, il n'a pas de remplaçant.
  --  Ce qui les remplace se vérifie à la ligne « contenu » de la nº 48.
  (31, 'yokofolio-portfolio-catalogue.sql', 'contrainte', 'photos_rendu_connu'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'index', 'photos_tatoueur_galerie'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'index', 'photos_tatoueur_rendu'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'index', 'photos_tatoueur_style'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'politique', 'lecture publique des photos'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'politique', 'ecriture de ses photos'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'colonne', 'public.tatoueurs.filtres_besoins'),
  (31, 'yokofolio-portfolio-catalogue.sql', 'index', 'idx_tatoueurs_besoins'),
  (32, 'yokofolio-recherche-en-base.sql', 'fonction', 'public.yf_distance_km'),
  (32, 'yokofolio-recherche-en-base.sql', 'fonction', 'public.yf_normaliser'),
  (32, 'yokofolio-recherche-en-base.sql', 'fonction', 'public.yf_commune'),
  (32, 'yokofolio-recherche-en-base.sql', 'vue', 'public.points_tatoueur'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_visibles'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_commune'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_region_normalisee'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_code_pays_haut'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_technique'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_tatoueurs_composition'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_photos_fiche_rendu'),
  (32, 'yokofolio-recherche-en-base.sql', 'index', 'idx_clics_slug'),
  (32, 'yokofolio-recherche-en-base.sql', 'fonction', 'public.rechercher_tatoueurs'),
  (33, 'yokofolio-studio-horaires.sql', 'colonne', 'public.modes_exercice.role'),
  (33, 'yokofolio-studio-horaires.sql', 'contrainte', 'modes_exercice_role_connu'),
  (33, 'yokofolio-studio-horaires.sql', 'contrainte', 'modes_exercice_role_coherent'),
  (33, 'yokofolio-studio-horaires.sql', 'colonne', 'public.studios.horaires'),
  (33, 'yokofolio-studio-horaires.sql', 'colonne', 'public.studios.fuseau'),
  (33, 'yokofolio-studio-horaires.sql', 'contrainte', 'studios_horaires_sept_jours'),
  (34, 'yokofolio-youtube.sql', 'colonne', 'public.tatoueurs.lien_youtube'),
  --  ⚠️ LA Nº 36 N'EST PLUS ATTENDUE : la nº 47 a SUPPRIMÉ la colonne
  --  `formulaire_demande` qu'elle avait créée, avec son contenu, sur
  --  demande explicite. Chercher encore cette colonne ferait échouer
  --  la vérification sur une base parfaitement à jour.
  (37, 'yokofolio-etablissement-prive.sql', 'colonne', 'public.tatoueurs.etablissement'),
  (37, 'yokofolio-etablissement-prive.sql', 'contrainte', 'tatoueurs_etablissement_valide'),
  (37, 'yokofolio-etablissement-prive.sql', 'index', 'tatoueurs_etablissement_idx'),
  (40, 'yokofolio-rayon-domicile.sql', 'colonne', 'public.modes_exercice.rayon_km'),
  (40, 'yokofolio-rayon-domicile.sql', 'contrainte', 'modes_exercice_rayon_connu'),
  (41, 'yokofolio-nature-lieu-guest.sql', 'colonne', 'public.modes_exercice.nature_lieu'),
  (41, 'yokofolio-nature-lieu-guest.sql', 'contrainte', 'modes_exercice_nature_connue'),
  (42, 'yokofolio-tous-les-lieux.sql', 'fonction', 'public.yf_slug'),
  (42, 'yokofolio-tous-les-lieux.sql', 'vue', 'public.lieux_tatoueur'),
  (42, 'yokofolio-tous-les-lieux.sql', 'vue', 'public.lieux_annexes_tatoueur'),
  (42, 'yokofolio-tous-les-lieux.sql', 'vue', 'public.zones_tatoueur'),
  (42, 'yokofolio-tous-les-lieux.sql', 'index', 'idx_modes_commune'),
  (42, 'yokofolio-tous-les-lieux.sql', 'index', 'idx_studios_commune'),
  (42, 'yokofolio-tous-les-lieux.sql', 'index', 'idx_modes_avec_rayon'),
  (43, 'yokofolio-fiche-admin-publique.sql', 'colonne', 'public.tatoueurs.admin_publique'),
  (43, 'yokofolio-fiche-admin-publique.sql', 'index', 'idx_tatoueurs_admin_publique'),
  ( 8, 'yokofolio-dix-huit-styles.sql', 'contenu', 'les 18 styles sur les démos'),
  (13, 'yokofolio-bio-150.sql', 'contenu', 'la bio plafonnée à 150'),
  (16, 'yokofolio-vingt-deux-styles.sql', 'contenu', 'les 22 styles sur les démos'),
  (17, 'yokofolio-grandes-pieces.sql', 'contenu', 'plus aucune pièce dos/torse/bodysuit'),
  (18, 'yokofolio-hors-ligne.sql', 'contenu', 'la bio sans minimum'),
  (20, 'yokofolio-fiches-internationales.sql', 'contenu', 'les fiches internationales'),
  (23, 'yokofolio-delai-30-jours.sql', 'contenu', 'le délai de 30 jours'),
  (29, 'yokofolio-debloquer-fiches-existantes.sql', 'contenu', 'plus aucune fiche déverrouillée'),
  (30, 'yokofolio-demos-nouveau-modele.sql', 'contenu', 'les démos au nouveau modèle'),
  (35, 'yokofolio-filtres-besoins-rendu.sql', 'contenu', 'la recherche connaît YouTube'),

  --  ⚠️ LES TROIS DERNIÈRES NE CRÉENT PRESQUE RIEN — elles CHANGENT.
  --  Une migration qui remplace une fonction ou vide une table ne
  --  laisse aucun objet nouveau à trouver : on cherche donc sa TRACE
  --  (un paramètre dans la fonction, un mot dans une contrainte, une
  --  ligne qui ne devrait plus exister), et jamais un nom.
  (38, 'yokofolio-profil-et-modes.sql', 'contenu', 'la recherche filtre par mode'),
  (39, 'yokofolio-liaisons-immediates.sql', 'contenu', 'plus aucune demande en attente'),
  (42, 'yokofolio-tous-les-lieux.sql', 'contenu', 'les modes actifs montrent leur rayon'),
  (43, 'yokofolio-fiche-admin-publique.sql', 'contenu', 'la recherche connaît l''exception'),
  --  ⚠️ LA Nº 44 NE CRÉE RIEN DU TOUT — elle DESSERRE une contrainte
  --  posée par la nº 33. Il n'y a donc aucun objet neuf à chercher :
  --  sa trace est le mot « prive » DANS le texte de la contrainte.
  (44, 'yokofolio-role-studio-prive.sql', 'contenu', 'un studio privé peut porter un rôle'),
  --  ⚠️ LA Nº 45 NE CRÉE AUCUN OBJET NON PLUS : elle REMPLACE une
  --  politique de sécurité. Sa trace est le nom de la nouvelle, et le
  --  fait que l'ancienne ait bien disparu.
  (45, 'yokofolio-politique-rattachements.sql', 'contenu', 'les rattachements s''écrivent enfin'),
  (46, 'yokofolio-page-de-liens.sql', 'colonne', 'public.tatoueurs.page_de_liens'),
  --  ⚠️ LA Nº 47 SUPPRIME. Sa trace est donc une ABSENCE — un
  --  « contenu » qui vérifie que quelque chose n'est PLUS là.
  (47, 'yokofolio-suppression-formulaire-demande.sql', 'contenu', 'le formulaire de demande a bien disparu'),
  --  ⚠️ LA Nº 48 SUPPRIME AUSSI (la colonne `zone` des photos), et
  --  resserre `rendu` : sa trace est cette absence, plus le rendu
  --  devenu obligatoire.
  (48, 'yokofolio-fin-des-zones.sql', 'contenu', 'les zones du corps ont quitté le portfolio'),
  (49, 'yokofolio-flash-nature-photo.sql', 'colonne', 'public.photos_tatoueur.nature'),
  --  ⚠️ LA Nº 49 RÉPARE AUSSI LA RECHERCHE, cassée par la nº 48 (elle
  --  nommait encore la colonne `zone`). Cette trace-là compte autant
  --  que la colonne neuve : sans elle, le chemin rapide est mort.
  (49, 'yokofolio-flash-nature-photo.sql', 'contenu', 'la recherche connaît la nature et ne nomme plus zone'),
  --  ⚠️ LA Nº 50 NE CRÉE RIEN NON PLUS : les trente-huit styles vivent
  --  dans le CODE, pas en base (`tatoueurs.styles` est un simple
  --  tableau de textes, et la contrainte qui les énumérait a été
  --  retirée par la nº 3). Elle ne fait que mettre les fiches de
  --  démonstration au diapason, et remplacer partout le style
  --  `floral`, disparu du catalogue. Sa trace tient donc en deux
  --  points : un nouveau style porté par une démo, et plus aucune
  --  fiche sous l'ancien.
  (50, 'yokofolio-styles-de-a-a-z.sql', 'contenu', 'les 38 styles, et plus aucun « floral »'),
  --  Nº 51 : les titres des deux liens libres (passe nº 116) — deux
  --  colonnes sur `tatoueurs`, et leur borne de 16 caractères.
  (51, 'yokofolio-liens-libres.sql', 'colonne', 'public.tatoueurs.titre_site_web'),
  (51, 'yokofolio-liens-libres.sql', 'colonne', 'public.tatoueurs.titre_page_de_liens'),
  (51, 'yokofolio-liens-libres.sql', 'contrainte', 'tatoueurs_titre_site_web_longueur'),
  (51, 'yokofolio-liens-libres.sql', 'contrainte', 'tatoueurs_titre_page_de_liens_longueur'),
  --  Nº 52 : les suggestions de styles (passe nº 122). Une table, ses
  --  cinq règles de forme, ses quatre index et ses trois politiques.
  --  ⚠️ CETTE TABLE EST AUSSI LE CATALOGUE DES STYLES AJOUTÉS : une
  --  ligne « acceptee » EST un style du site (voir le fichier).
  (52, 'yokofolio-suggestions-styles.sql', 'table', 'public.suggestions_style'),
  (52, 'yokofolio-suggestions-styles.sql', 'contrainte', 'suggestions_style_etat'),
  (52, 'yokofolio-suggestions-styles.sql', 'contrainte', 'suggestions_style_propose_longueur'),
  (52, 'yokofolio-suggestions-styles.sql', 'contrainte', 'suggestions_style_slug_forme'),
  (52, 'yokofolio-suggestions-styles.sql', 'contrainte', 'suggestions_style_famille'),
  (52, 'yokofolio-suggestions-styles.sql', 'contrainte', 'suggestions_style_acceptee_complete'),
  (52, 'yokofolio-suggestions-styles.sql', 'index', 'idx_suggestions_style_slug_unique'),
  (52, 'yokofolio-suggestions-styles.sql', 'index', 'idx_suggestions_style_acceptees'),
  (52, 'yokofolio-suggestions-styles.sql', 'index', 'idx_suggestions_style_attente'),
  (52, 'yokofolio-suggestions-styles.sql', 'index', 'idx_suggestions_style_par_compte'),
  (52, 'yokofolio-suggestions-styles.sql', 'politique', 'lecture de ses suggestions'),
  (52, 'yokofolio-suggestions-styles.sql', 'politique', 'les styles acceptes sont publics'),
  (52, 'yokofolio-suggestions-styles.sql', 'politique', 'proposer un style')
),

--  ------------------------------------------------------------
--  CHAQUE OBJET EST-IL LÀ ? On interroge le catalogue de PostgreSQL,
--  jamais les tables du site : cette requête ne peut donc pas échouer
--  parce qu'une colonne manque — c'est précisément ce qu'elle cherche.
--  ------------------------------------------------------------
constate as (
  select a.ordre, a.fichier, a.genre, a.objet,
    case a.genre

      --  TABLES ET VUES : to_regclass rend null si l'objet n'existe
      --  pas, au lieu de lever une erreur.
      when 'table' then to_regclass(a.objet) is not null
      when 'vue'   then to_regclass(a.objet) is not null

      --  COLONNES : « schema.table.colonne ».
      when 'colonne' then exists (
        select 1 from information_schema.columns c
        where c.table_schema = split_part(a.objet, '.', 1)
          and c.table_name   = split_part(a.objet, '.', 2)
          and c.column_name  = split_part(a.objet, '.', 3))

      when 'contrainte' then exists (
        select 1 from pg_constraint where conname = a.objet)

      when 'index' then exists (
        select 1 from pg_class i
        join pg_namespace n on n.oid = i.relnamespace
        where i.relkind in ('i', 'I') and i.relname = a.objet
          and n.nspname = 'public')

      when 'fonction' then exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = split_part(a.objet, '.', 1)
          and p.proname = split_part(a.objet, '.', 2))

      when 'politique' then exists (
        select 1 from pg_policies where policyname = a.objet)

      when 'declencheur' then exists (
        select 1 from pg_trigger where tgname = a.objet and not tgisinternal)

      --  LES TRACES EN DONNÉES ET LES CONTENUS DE CONTRAINTE.
      --  ⚠️ Les colonnes sont lues par `to_jsonb(t)->>'nom'` et non
      --  directement : ainsi, une colonne absente rend simplement
      --  null au lieu de faire échouer toute la requête.
      when 'contenu' then case a.ordre
      when  8 then exists (select 1 from public.tatoueurs t where to_jsonb(t)->>'slug' like 'atelier-corvus%' and (to_jsonb(t)->'styles') ? 'dotwork')
      when 13 then exists (select 1 from pg_constraint where conname = 'tatoueurs_bio_longueur' and pg_get_constraintdef(oid) like '%150%')
      when 16 then exists (select 1 from public.tatoueurs t where to_jsonb(t)->>'slug' like 'hokusai-mecanique%' and (to_jsonb(t)->'styles') ? 'biomecanique')
      when 17 then not exists (select 1 from public.tatoueurs t where (to_jsonb(t)->'filtres_composition') ?| array['piece-dos','piece-torse','bodysuit'])
      when 18 then exists (select 1 from pg_constraint where conname = 'tatoueurs_bio_longueur' and pg_get_constraintdef(oid) not like '%80%')
      when 20 then exists (select 1 from public.tatoueurs t where to_jsonb(t)->>'slug' like 'kreuzberg-nadel%')
      when 23 then coalesce(obj_description(to_regclass('public.comptes_a_purger'), 'pg_class'), '') like '%30 jours%'
      when 29 then not exists (select 1 from public.tatoueurs t where to_jsonb(t)->>'exercice_verrouille' = 'false')
      when 30 then exists (select 1 from public.tatoueurs t where to_jsonb(t)->>'slug' = 'camille-fauve-paris-18e' and to_jsonb(t)->>'type_fiche' = 'artiste')
      when 35 then exists (select 1 from pg_proc where proname = 'rechercher_tatoueurs' and prosrc like '%lien_youtube%')
      --  Nº 38 a REMPLACÉ la fonction de recherche pour lui ajouter le
      --  paramètre `p_modes`. Un nom de fonction ne dit rien de ses
      --  arguments : on regarde donc la SIGNATURE.
      when 38 then exists (
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'rechercher_tatoueurs'
           and pg_get_function_arguments(p.oid) like '%p_modes%')
      --  Nº 39 n'a rien créé : elle a vidé la file d'attente et admis
      --  l'origine « adresse ». Les deux se lisent en données.
      --  Nº 42 a REFAIT deux vues et la recherche. Sa trace la plus
      --  sûre : `rayon_km` redevenu visible dans modes_exercice_actifs
      --  (il y manquait depuis la nº 26 et son « select * »).
      when 42 then exists (
        select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'modes_exercice_actifs'
           and column_name = 'rayon_km')
      --  Nº 43 : la recherche connaît l'exception « fiche d'essai
      --  rendue publique ». Sa trace est dans le corps de la fonction.
      when 43 then exists (
        select 1 from pg_proc
         where proname = 'rechercher_tatoueurs'
           and prosrc like '%admin_publique%')
      --  Nº 44 : le rôle (fondateur / résident) est désormais ACCEPTÉ
      --  pour un studio privé. La contrainte de la nº 33 ne nommait
      --  que « salon » ; celle de la nº 44 nomme aussi « prive ».
      when 44 then exists (
        select 1 from pg_constraint
         where conname = 'modes_exercice_role_coherent'
           and pg_get_constraintdef(oid) like '%prive%')
      when 39 then
        not exists (select 1 from public.liaisons_artiste_salon t
                     where to_jsonb(t)->>'statut' = 'demande')
        and exists (select 1 from pg_constraint
                     where conname = 'liaisons_origine_connue'
                       and pg_get_constraintdef(oid) like '%adresse%')
      --  Nº 45 : la politique d'écriture des rattachements attend
      --  « validee » (et non plus « demande »), nomme les trois
      --  origines, et l'ancienne a bien été retirée. C'EST LE
      --  CORRECTIF DU BUG BLOQUANT : sans lui, aucun rattachement ne
      --  peut s'enregistrer, ni dans l'équipe ni dans « Autre adresse ».
      when 45 then
        exists (select 1 from pg_policy
                 where polrelid = 'public.liaisons_artiste_salon'::regclass
                   and polname = 'creer un rattachement'
                   and pg_get_expr(polwithcheck, polrelid) like '%validee%'
                   and pg_get_expr(polwithcheck, polrelid) like '%adresse%')
        and not exists (select 1 from pg_policy
                         where polrelid = 'public.liaisons_artiste_salon'::regclass
                           and polname = 'demander une liaison')
      --  Nº 47 : la colonne du formulaire de demande n'existe PLUS.
      when 47 then
        not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tatoueurs'
                       and column_name = 'formulaire_demande')
      --  Nº 48 : la colonne `zone` des photos n'existe PLUS, ni rien de
      --  ce qui la portait, et le rendu est devenu obligatoire.
      --  ⚠️ CES QUATRE ABSENCES SONT L'AUTRE MOITIÉ DE LA CORRECTION
      --  FAITE PLUS HAUT : les objets retirés de la liste de la nº 31
      --  ne sont pas devenus invérifiables, ils ont CHANGÉ DE CAMP. La
      --  nº 31 demandait qu'ils existent, la nº 48 demande qu'ils
      --  soient partis — et c'est elle qui a raison en dernier.
      when 48 then
        not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'photos_tatoueur'
                       and column_name = 'zone')
        and not exists (select 1 from pg_constraint
                         where conname = 'photos_zone_connue')
        and not exists (select 1 from pg_class i
                         join pg_namespace n on n.oid = i.relnamespace
                         where i.relkind in ('i', 'I') and n.nspname = 'public'
                           and i.relname in ('photos_tatoueur_zone',
                                             'photos_tatoueur_unicite'))
        and exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'photos_tatoueur'
                       and column_name = 'rendu' and is_nullable = 'NO')
      --  Nº 50 : les seize styles neufs sont sur les démos, et le
      --  style abandonné `floral` n'est plus porté par personne.
      when 50 then
        exists (select 1 from public.tatoueurs t
                 where to_jsonb(t)->>'slug' like 'hokusai-mecanique%'
                   and (to_jsonb(t)->'styles') ? 'suminagashi')
        and not exists (select 1 from public.tatoueurs t
                         where (to_jsonb(t)->'styles') ? 'floral')
      --  Nº 49 : la recherche connaît `p_nature` ET ne nomme plus la
      --  colonne `zone` — c'est ce second point qui la remet en
      --  marche après la nº 48.
      when 49 then
        exists (select 1 from pg_proc
                 where proname = 'rechercher_tatoueurs'
                   and prosrc like '%p_nature%')
        and not exists (select 1 from pg_proc
                         where proname = 'rechercher_tatoueurs'
                           and prosrc like '%p2.zone%')
      end
    end as present
  from attendu a
)

--  ------------------------------------------------------------
--  LE VERDICT, UNE LIGNE PAR MIGRATION.
--  ------------------------------------------------------------
select
  c.ordre,
  c.fichier,
  case
    when count(*) filter (where not c.present) = 0 then '✅ PASSÉE'
    when count(*) filter (where c.present)     = 0 then '❌ MANQUANTE'
    else '⚠️ INCOMPLÈTE'
  end as etat,
  count(*) filter (where c.present) || '/' || count(*) as objets,
  coalesce(
    string_agg(c.genre || ' ' || c.objet, ', ' order by c.genre, c.objet)
      filter (where not c.present),
    '—'
  ) as ce_qui_manque
from constate c
group by c.ordre, c.fichier
order by c.ordre;
