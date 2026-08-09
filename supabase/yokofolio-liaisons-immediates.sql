-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 39 : LES RATTACHEMENTS DEVIENNENT IMMÉDIATS
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 38
--  (yokofolio-profil-et-modes.sql).
--
--  CE QUI CHANGE. Un rattachement entre deux fiches était une DEMANDE :
--  elle partait en « attente », une notification arrivait chez l'autre,
--  et il fallait cliquer « Valider » pour que l'artiste apparaisse dans
--  l'équipe du salon. Trois écrans et deux personnes pour une
--  information que les deux connaissaient déjà. Le lien est désormais
--  IMMÉDIAT, dans les deux sens.
--
--  ⚠️ CE QUI N'EST PAS TOUCHÉ : LA MODÉRATION PAR L'ADMINISTRATEUR.
--  La validation d'une fiche, la mise hors ligne, les motifs de refus
--  restent exactement comme ils sont. Un rattachement est un fait entre
--  deux professionnels ; une publication est une décision éditoriale.
--
--  CE QUE FAIT CE FICHIER, ET RIEN DE PLUS
--  ----------------------------------------
--   1. LES DEMANDES EN ATTENTE SONT VALIDÉES. Elles deviennent des
--      rattachements réels — c'est ce que les deux parties voulaient
--      en les créant. ⚠️ AUCUNE LIGNE N'EST SUPPRIMÉE : ni les
--      demandes, ni les liaisons déjà validées, ni celles qui avaient
--      été REFUSÉES (voir le point 2).
--   2. LES REFUS RESTENT DES REFUS. Un « non » explicite est une
--      décision, pas une attente : le transformer en oui reviendrait à
--      remettre dans une équipe quelqu'un qui en avait été écarté. Ces
--      lignes ne bougent pas. Elles n'ont plus d'effet visible (la vue
--      `equipe_salon` ne lit que les validées) et leurs propriétaires
--      peuvent refaire le lien d'un clic si c'était une erreur.
--   3. L'ORIGINE « adresse » EST ADMISE, pour le nouveau bloc 12 :
--      elle marque les liens entre DEUX ÉTABLISSEMENTS, à distinguer
--      des rattachements d'équipe.
--   4. LES NOTIFICATIONS DE RATTACHEMENT SONT EFFACÉES. Elles portent
--      des boutons « Valider / Refuser » qui n'existent plus : les
--      laisser afficherait des actions impossibles. Les autres
--      notifications — validation de fiche, mise hors ligne,
--      suppression programmée — ne sont pas touchées.
--
--  SANS RISQUE : aucune colonne ajoutée ni supprimée, aucune table
--  effacée. Rejouable autant de fois qu'on veut.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LES DEMANDES EN ATTENTE DEVIENNENT DES RATTACHEMENTS
-- ---------------------------------------------------------------------
update public.liaisons_artiste_salon
   set statut = 'validee',
       repondu_le = coalesce(repondu_le, now())
 where statut = 'demande';

-- ---------------------------------------------------------------------
-- 2) L'ORIGINE « adresse » — le bloc 12
-- ---------------------------------------------------------------------
alter table public.liaisons_artiste_salon
  drop constraint if exists liaisons_origine_connue;
alter table public.liaisons_artiste_salon
  add constraint liaisons_origine_connue
  check (origine in ('artiste', 'salon', 'adresse'));

comment on column public.liaisons_artiste_salon.origine is
  'Qui a créé le lien : ''artiste'' ou ''salon'' pour un rattachement d''équipe, ''adresse'' pour un lien entre deux établissements (bloc 12).';

comment on column public.liaisons_artiste_salon.statut is
  'Toujours ''validee'' depuis la migration nº 39 : les rattachements sont immédiats. ''refusee'' subsiste sur d''anciennes lignes, et continue d''écarter le lien.';

-- ---------------------------------------------------------------------
-- 3) LES NOTIFICATIONS DE RATTACHEMENT S'EFFACENT
-- ---------------------------------------------------------------------
--  ⚠️ SEULS CES TROIS GENRES PARTENT. `validee`, `modifications`,
--  `hors_ligne`, `suppression_fiche`, `suppression_compte` et
--  `annulation` restent : ce sont les décisions de l'administrateur et
--  les échéances du compte, qui n'ont pas d'autre canal.
delete from public.notifications_compte
 where genre in ('liaison', 'liaison_validee', 'liaison_refusee');

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Rattachements validés', (
    select count(*)::text from public.liaisons_artiste_salon
     where statut = 'validee')),
  (2, '  dont liens entre établissements (bloc 12)', (
    select count(*)::text from public.liaisons_artiste_salon
     where statut = 'validee' and origine = 'adresse')),
  (3, 'Refus anciens, laissés tels quels', (
    select count(*)::text from public.liaisons_artiste_salon
     where statut = 'refusee')),
  (4, 'Demandes encore en attente (doit être 0)', (
    select count(*)::text from public.liaisons_artiste_salon
     where statut = 'demande')),
  (5, 'Notifications restantes, par genre', (
    select coalesce(string_agg(g.genre || ' : ' || g.combien, ' · '
                               order by g.genre), 'aucune')
      from (select genre, count(*) as combien
              from public.notifications_compte group by genre) as g)),

  --  ⚠️ LE COMPTAGE PROMIS À LA PASSE A : LES ENSEIGNES À PLUSIEURS
  --  ADRESSES. Le bloc 1 ne permet plus d'en ajouter (bloc 12), mais
  --  CELLES QUI EXISTENT NE SONT PAS TOUCHÉES — ni ici, ni par le
  --  formulaire (voir `ecrireStudios`, qui préserve désormais les
  --  adresses qu'il ne gère plus).
  (6, 'Enseignes à plusieurs adresses', (
    select count(*)::text from (
      select s.tatoueur_id
        from public.studios s
        join public.tatoueurs f on f.id = s.tatoueur_id
       where f.supprime_le is null and f.type_fiche = 'salon'
       group by s.tatoueur_id having count(*) > 1) as multi)),
  (7, '  lesquelles', (
    select coalesce(string_agg(d.nom || ' (' || d.adresses || ')', ', '
                               order by d.adresses desc, d.nom), 'aucune')
      from (select f.nom as nom, count(*) as adresses
              from public.studios s
              join public.tatoueurs f on f.id = s.tatoueur_id
             where f.supprime_le is null and f.type_fiche = 'salon'
             group by f.id, f.nom having count(*) > 1) as d))
) as etat(ordre, mesure, valeur)
order by ordre;
