-- =====================================================================
--  YOKOFOLIO — « UN CŒUR NE MET EN FAVORI QUE LA PHOTO » (passe nº 302)
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 53
--  (yokofolio-favoris-photos.sql), qui crée la table des favoris.
--  Se relance sans risque : tout est idempotent, et la conversion ne
--  peut rien convertir deux fois (une fois faite, plus aucune ligne ne
--  répond à sa condition).
--
--  ⚠️ NE RIEN LANCER AVANT D'AVOIR LU LA SECTION 1 : elle donne la
--  requête de COMPTAGE, à passer d'abord, qui dit exactement combien de
--  lignes seront supprimées. Rien n'est effacé tant que vous ne lancez
--  que ce comptage.
--
--  CE QUE CE FICHIER FAIT — DEUX CHOSES, ET RIEN D'AUTRE
--  -----------------------------------------------------
--   A) IL CONVERTIT LES FAVORIS DE CARROUSEL. Jusqu'ici, aimer une
--      photo enregistrait TOUT le carrousel affiché (règle de la
--      nº 208-§6). Le propriétaire annule cette règle : un cœur ne met
--      en favori QUE la photo cliquée. Les favoris déjà enregistrés
--      sont donc ramenés à UNE ligne par carrousel — SA PREMIÈRE
--      PHOTO, celle que l'artiste a placée en tête.
--
--   B) IL OUVRE UN COMPTE DE J'AIME PAR PHOTO. La galerie de « Ma
--      sélection de portfolios » range désormais chaque style en
--      mettant devant les photos les plus aimées (règle 5 de la
--      nº 302-§1). La table des favoris est PRIVÉE et le reste : cette
--      vue n'en rend qu'un NOMBRE par photo — elle ne nomme personne,
--      elle ne dit pas qui a aimé, et il est impossible d'en déduire
--      un compte.
--
--  COMMENT ON RECONNAÎT UN FAVORI DE CARROUSEL — et c'est le point
--  délicat, alors il est écrit noir sur blanc.
--  Un cœur de carrousel écrivait TOUTES ses lignes EN UNE SEULE
--  REQUÊTE : elles portent donc exactement le MÊME `cree_le`, à la
--  microseconde. Deux photos d'un même carrousel aimées à la main, à
--  deux instants différents, n'ont aucune chance de partager cet
--  horodatage. La conversion ne touche donc QUE les groupes de DEUX
--  LIGNES OU PLUS qui partagent :
--     le même compte, le même carrousel (tatoueur + style + catégorie
--     + rendu), ET le même `cree_le` à la microseconde.
--  Un favori posé photo par photo n'est JAMAIS concerné.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1) LE COMPTAGE — À PASSER D'ABORD, IL N'EFFACE RIEN
-- ---------------------------------------------------------------------
--  Il répond à trois questions : combien de carrousels aimés, combien
--  de lignes au total, et combien seront supprimées (le total moins
--  une ligne gardée par carrousel).
--
--    with groupes as (
--      select
--        f.utilisateur_id,
--        p.tatoueur_id,
--        p.style,
--        coalesce(p.nature, 'tatouage')      as nature,
--        coalesce(p.rendu, 'noir-et-gris')   as rendu,
--        f.cree_le,
--        count(*)                            as lignes
--      from public.favoris_photos f
--      join public.photos_tatoueur p on p.id = f.photo_id
--      group by 1, 2, 3, 4, 5, 6
--      having count(*) > 1
--    )
--    select
--      count(*)                        as carrousels_aimes,
--      coalesce(sum(lignes), 0)        as lignes_concernees,
--      coalesce(sum(lignes), 0) - count(*) as lignes_supprimees
--    from groupes;
--
--  ⚠️ `lignes_supprimees` EST LE NOMBRE À RETENIR : c'est exactement ce
--  que la section 2 va effacer. `lignes_concernees` compte aussi les
--  lignes GARDÉES (une par carrousel).

-- ---------------------------------------------------------------------
--  2) LA CONVERSION — chaque favori de carrousel devient un favori sur
--     SA PREMIÈRE PHOTO
-- ---------------------------------------------------------------------
--  LA PREMIÈRE PHOTO, C'EST CELLE DE L'ARTISTE : la colonne `ordre`
--  (migration nº 31) porte la place qu'il a donnée à chaque image dans
--  sa galerie. À `ordre` égal — une base ancienne où tout vaut 0 —, on
--  départage par l'identifiant, pour que le résultat soit le même à
--  chaque exécution.
--
--  ⚠️ ON SUPPRIME, ON N'INSÈRE PAS. La première photo du carrousel est
--  DÉJÀ dans la table (le cœur de galerie les avait toutes écrites) :
--  il n'y a donc rien à créer, seulement les autres à retirer. Aucun
--  favori n'apparaît, aucun compte ne gagne une photo qu'il n'avait
--  pas enregistrée.
with groupes as (
  select
    f.utilisateur_id,
    f.photo_id,
    f.cree_le,
    row_number() over (
      partition by
        f.utilisateur_id,
        p.tatoueur_id,
        p.style,
        coalesce(p.nature, 'tatouage'),
        coalesce(p.rendu, 'noir-et-gris'),
        f.cree_le
      order by coalesce(p.ordre, 0), p.id
    ) as rang,
    count(*) over (
      partition by
        f.utilisateur_id,
        p.tatoueur_id,
        p.style,
        coalesce(p.nature, 'tatouage'),
        coalesce(p.rendu, 'noir-et-gris'),
        f.cree_le
    ) as taille
  from public.favoris_photos f
  join public.photos_tatoueur p on p.id = f.photo_id
)
delete from public.favoris_photos cible
 using groupes g
 where cible.utilisateur_id = g.utilisateur_id
   and cible.photo_id       = g.photo_id
   --  UN GROUPE D'UNE SEULE LIGNE EST UN FAVORI POSÉ À LA MAIN : on n'y
   --  touche pas. On ne retire que les SUIVANTES d'un vrai groupe.
   and g.taille > 1
   and g.rang   > 1;

-- ---------------------------------------------------------------------
--  3) LE COMPTE DE J'AIME PAR PHOTO — une VUE, jamais la table
-- ---------------------------------------------------------------------
--  ⚠️ POURQUOI `security_definer` ET NON `security_invoker` : la table
--  `favoris_photos` est protégée par RLS (nº 53) — chacun ne voit que
--  ses lignes. Une vue « invoker » rendrait donc 1 pour ce que le
--  visiteur a lui-même aimé, et 0 pour tout le reste : le classement
--  serait faux. Cette vue-ci compte SOUS L'IDENTITÉ DE SON
--  PROPRIÉTAIRE, et ne rend qu'un nombre par photo.
--  CE QU'ELLE NE PEUT PAS DIRE, ET C'EST VOULU : qui a aimé. Il n'y a
--  aucune colonne d'utilisateur, aucune date, aucun moyen de croiser.
--  C'est exactement le même compromis que la vue `popularite_tatoueurs`
--  (nº 62), qui compte déjà les cœurs par fiche.
create or replace view public.coeurs_par_photo
with (security_invoker = false) as
  select
    f.photo_id,
    count(*)::bigint as coeurs
  from public.favoris_photos f
  group by f.photo_id;

comment on view public.coeurs_par_photo is
  'Le nombre de j''aime reçus par chaque photo (yokofolio, nº 302-§1, règle 5). Un COMPTE, et rien d''autre : ni qui, ni quand. Lu par la galerie de « Ma sélection de portfolios ».';

grant select on public.coeurs_par_photo to anon, authenticated;

--  L'index du sens « toutes les personnes qui ont aimé UNE photo »
--  existe depuis la nº 53 ; on le redemande pour qu'une base à qui il
--  manquerait ne se traîne pas sur ce comptage.
create index if not exists idx_favoris_photos_par_photo
  on public.favoris_photos (photo_id);

-- ---------------------------------------------------------------------
--  4) VÉRIFICATION — à lancer APRÈS
-- ---------------------------------------------------------------------
--  a) PLUS AUCUN FAVORI DE CARROUSEL NE SUBSISTE : le comptage de la
--     section 1, relancé, doit rendre 0 partout.
--
--  b) LA VUE RÉPOND :
--       select count(*) as photos_aimees from public.coeurs_par_photo;
--
--  c) ET ELLE EST LISIBLE PAR LE SITE :
--       select has_table_privilege('anon', 'public.coeurs_par_photo', 'select')
--            as lisible_anonyme;
--       -- attendu : true
