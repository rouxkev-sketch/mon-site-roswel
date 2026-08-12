-- =====================================================================
--  MIGRATION Nº 65 — L'ÉQUIPE D'UN LIEU DIT LE RÔLE DE CHACUN
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée : elle refait la seule vue
--  `equipe_salon`. Se relance sans risque.
--
--  CE QU'ELLE APPORTE (passe nº 222-§4)
--  -------------------------------------
--  La fiche d'un salon ou d'un studio écrit désormais, sous chaque
--  adresse, l'équipe qui y travaille — avec le RÔLE devant le nom :
--
--      Fondateur · Kevin Roux
--      Résident  · Lola Roux
--      Guest     · Marie Dupont
--
--  Or la vue ne rendait que le GENRE du mode (« salon » ou « guest ») :
--  elle ne pouvait pas distinguer un fondateur d'un résident. Le rôle
--  existe pourtant depuis la migration nº 21 (`modes_exercice.role`),
--  et la liaison désigne déjà le mode qui la porte.
--
--  ⚠️ UNE COLONNE DE PLUS, ET RIEN D'AUTRE. Ni condition changée, ni
--  ligne ajoutée ou retirée : les mêmes membres, dans les mêmes cas.
--  Le site sait lire la vue SANS cette colonne (il lit alors
--  « résident » partout) : passer cette migration n'est pas un
--  préalable, c'est une précision.
--
--  ⚠️ `role` EST NULL QUAND LA LIAISON NE PEND À AUCUN MODE — une
--  invitation partie DU SALON. C'est un résident par construction, et
--  c'est ce que le site en fait (voir `roleDuMembre`).
-- =====================================================================

create or replace view public.equipe_salon as
  select
    l.salon_id,
    l.artiste_id,
    a.nom          as artiste_nom,
    a.slug         as artiste_slug,
    a.photo_profil as artiste_photo,
    m.genre        as genre,
    --  LA COLONNE DE CETTE MIGRATION : « fondateur » ou « resident »,
    --  null quand la liaison ne pend à aucun mode d'exercice.
    m.role         as role,
    m.debut_le,
    m.fin_le,
    l.demandee_le
  from public.liaisons_artiste_salon as l
  join public.tatoueurs as a on a.id = l.artiste_id
  left join public.modes_exercice as m on m.id = l.mode_id
  where l.statut = 'validee'
    and a.publie = true
    and a.hors_ligne = false
    and a.supprime_le is null
    -- Un guest expiré n'est plus de l'équipe. Un mode sans dates
    -- (résident) n'expire jamais.
    and (m.fin_le is null or m.fin_le >= current_date);

comment on view public.equipe_salon is
  'L''équipe visible d''un salon : liaisons validées, artiste en ligne, session guest non expirée. Rien n''est stocké — la règle est dans la lecture. Depuis la nº 65 elle rend aussi le RÔLE (fondateur / resident) du mode qui porte la liaison.';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — n'écrit rien.
-- ------------------------------------------------------------
--  select salon_id, artiste_nom, genre, role, debut_le, fin_le
--    from public.equipe_salon
--   order by salon_id, (role is distinct from 'fondateur'), artiste_nom;
