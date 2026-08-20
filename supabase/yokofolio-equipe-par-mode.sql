-- ============================================================
-- nº 410 — L'ÉQUIPE D'UN SALON, UNE LIGNE PAR MODE
-- ============================================================
-- LE DÉFAUT RÉPARÉ : un artiste RÉSIDENT d'un studio qui déclare EN
-- PLUS un guest chez ce même studio doit apparaître DEUX FOIS sur la
-- fiche du studio — une fois dans l'équipe, une fois dans les guests
-- avec ses dates. Il n'apparaissait qu'une fois.
--
-- LA CAUSE PRINCIPALE N'EST PAS ICI, ET IL FAUT LE DIRE : elle est
-- dans la route `api/tatoueur/liaison`, qui cherchait un doublon sur
-- (artiste, salon) SANS LE MODE et répondait « déjà fait » — la
-- seconde liaison n'était donc jamais créée. La base, elle, avait
-- raison depuis le début : son index `idx_liaisons_unique` porte sur
-- (artiste_id, salon_id, coalesce(mode_id, …)), c'est-à-dire UNE
-- liaison PAR MODE (yokofolio-modes-et-liaisons.sql). Le code était
-- plus sévère que le schéma. C'est corrigé côté site.
--
-- CE QUE CETTE MIGRATION AJOUTE, ET POURQUOI ELLE EST NÉCESSAIRE :
-- une fois les deux liaisons créées, la vue rend DEUX LIGNES pour le
-- même artiste. Le site doit alors pouvoir les DISTINGUER — sans quoi
-- il ne sait ni les identifier séparément à l'écran, ni rattacher à
-- chacune la bonne déclaration (le rôle du résident d'un côté, le
-- guest de l'autre). La vue expose donc deux colonnes de plus :
--
--   liaison_id  — l'identifiant de la liaison, unique par ligne ;
--   mode_id     — le mode d'exercice qui la porte (null pour une
--                 invitation partie DU salon, qui ne pend à aucun).
--
-- AUCUNE CONDITION N'EST TOUCHÉE : mêmes jointures, mêmes filtres,
-- mêmes lignes qu'avant — liaisons validées, artiste en ligne, guest
-- non expiré. On AJOUTE deux colonnes, on ne change rien de ce que la
-- vue décide.
--
-- ⚠️ L'ORDRE : CETTE MIGRATION D'ABORD, LE DÉPLOIEMENT ENSUITE.
--  · migration passée, ancien site déployé → deux colonnes de plus que
--    personne ne lit (`select *` les rapporte, elles sont ignorées) :
--    rien ne change, rien ne casse ;
--  · site nº 410 déployé, migration PAS passée → RIEN NE CASSE NON
--    PLUS. Les deux colonnes sont FACULTATIVES côté site : sans elles,
--    l'identité d'une ligne retombe sur l'identifiant de l'artiste et
--    la déclaration se retrouve par (salon, artiste), exactement comme
--    avant cette passe. Le cas « membre ET guest » reste alors mal
--    rendu — mais aucune fiche ne casse.
--    AUCUNE VERSION DU SITE N'EXIGE DONC CETTE MIGRATION ; elle est ce
--    qui rend le cas des deux modes JUSTE, pas ce qui rend le site
--    vivant.
--
-- ██ POURQUOI `create or replace` ET NON `drop view` (nº 411) ██
-- LA PREMIÈRE ÉCRITURE DE CETTE MIGRATION ÉCHOUAIT dans Supabase :
--
--   ERROR: 42P16: cannot change name of view column "artiste_nom"
--                 to "liaison_id"
--
-- `create or replace view` ne REMPLACE que le corps : la liste des
-- colonnes ne peut qu'être ALLONGÉE, jamais réordonnée ni renommée.
-- Les deux nouvelles colonnes avaient été glissées AU MILIEU, en
-- troisième et quatrième position : PostgreSQL a donc lu « la
-- troisième colonne s'appelait artiste_nom, elle s'appelle maintenant
-- liaison_id » et a refusé. Elles sont désormais EN DERNIER, derrière
-- les dix colonnes de la nº 65 laissées dans leur ordre exact.
--
-- DEUX VOIES ÉTAIENT POSSIBLES ; VOICI POURQUOI CELLE-CI :
--  · `drop view ... cascade` puis recréation aurait tout autorisé,
--    MAIS UNE VUE SUPPRIMÉE PERD SES DROITS. La migration nº 59
--    (yokofolio-lecture-publique.sql) a posé
--    `grant select on public.equipe_salon to anon, authenticated` :
--    c'est ce droit-là qui permet à la fiche publique, PRÉRENDUE et
--    lue par le rôle ANONYME, de voir une équipe. Le `drop` l'aurait
--    emporté en silence, et il aurait fallu penser à le reposer ;
--  · `cascade` aurait en plus détruit sans un mot tout objet
--    dépendant. RECENSÉ : aucune autre vue, fonction ou politique ne
--    dépend de `equipe_salon` — les autres fichiers ne la citent que
--    dans des commentaires ou des requêtes de vérification. Le risque
--    était donc théorique ici, mais le droit de lecture, lui, ne
--    l'était pas.
-- L'ordre des colonnes n'a AUCUNE importance pour le site : il lit la
-- vue par `select *` et nomme ses champs.
--
-- IDEMPOTENTE : `create or replace view` — rejouable telle quelle.
-- ============================================================

begin;

create or replace view public.equipe_salon as
  select
    --  ⚠️ LES DIX PREMIÈRES COLONNES SONT CELLES DE LA nº 65, DANS LEUR
    --  ORDRE EXACT — ne pas y toucher (voir la note ci-dessus).
    l.salon_id,
    l.artiste_id,
    a.nom          as artiste_nom,
    a.slug         as artiste_slug,
    a.photo_profil as artiste_photo,
    m.genre        as genre,
    m.role         as role,
    m.debut_le,
    m.fin_le,
    l.demandee_le,
    --  ██ LES DEUX NOUVELLES, ET ELLES VIENNENT APRÈS TOUTES LES
    --  AUTRES ██ — ce qui distingue deux lignes d'un même artiste.
    l.id           as liaison_id,
    l.mode_id      as mode_id
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
  'L''équipe visible d''un salon : liaisons validées, artiste en ligne, session guest non expirée. Rien n''est stocké — la règle est dans la lecture. Depuis la nº 65 elle rend le RÔLE du mode ; depuis la nº 410 elle rend aussi liaison_id et mode_id, pour qu''un artiste à la fois membre ET guest du même lieu se lise en DEUX lignes distinctes.';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; trois requêtes)
-- ============================================================
-- a) Les deux colonnes existent :
--    select column_name
--      from information_schema.columns
--     where table_schema = 'public' and table_name = 'equipe_salon'
--       and column_name in ('liaison_id', 'mode_id')
--     order by column_name;
--
-- b) Qui a PLUS D'UNE ligne chez un même salon (le cas réparé) —
--    vide tant qu'aucun artiste n'est à la fois membre et guest :
--    select salon_id, artiste_nom, count(*) as lignes
--      from public.equipe_salon
--     group by salon_id, artiste_nom, artiste_id
--    having count(*) > 1;
--
-- c) Aucune ligne ne peut être un VRAI doublon — un mode donné n'a
--    qu'une liaison (l'index l'impose). Doit rendre 0 ligne :
--    select artiste_id, salon_id, mode_id, count(*)
--      from public.liaisons_artiste_salon
--     group by artiste_id, salon_id, mode_id
--    having count(*) > 1;
