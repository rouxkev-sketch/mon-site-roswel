-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 45 : LA POLITIQUE DES RATTACHEMENTS
--                                RATTRAPE LE PRODUIT
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 44
--  (yokofolio-role-studio-prive.sql).
--
--  ⚠️ C'EST LE CORRECTIF DU BUG BLOQUANT : « Le rattachement n'a pas pu
--  être enregistré. Vérifie que la fiche t'appartient. » Ce message
--  était FAUX. La fiche appartenait bien à celui qui cliquait — c'est
--  la base qui refusait l'écriture, pour une raison que le message ne
--  disait pas.
--
--  CE QUI S'EST PASSÉ, EXACTEMENT
--  -------------------------------
--  La migration nº 26 avait posé une politique d'écriture nommée
--  « demander une liaison ». Elle décrivait le monde d'alors : un
--  rattachement était une DEMANDE, elle naissait forcément à l'état
--  `demande`, et l'autre bout la validait ensuite. La politique
--  exigeait donc, mot pour mot :
--
--        with check ( statut = 'demande' and … )
--
--  La migration nº 39 a supprimé la demande : les rattachements sont
--  devenus IMMÉDIATS. Elle a fait passer les lignes existantes à
--  `validee`, elle a ouvert la contrainte `origine` au mot `adresse`
--  (le bloc « Autre adresse »), et le code écrit depuis lors
--  `statut = 'validee'`.
--
--  MAIS ELLE N'A PAS TOUCHÉ À LA POLITIQUE. Restée telle quelle,
--  celle-ci continuait d'exiger `statut = 'demande'` — c'est-à-dire
--  exactement ce que le produit n'écrit plus. Résultat : TOUTE création
--  de rattachement était refusée, dans les deux blocs, aussi bien sur
--  une fiche déjà enregistrée que pendant la création d'une fiche.
--
--  ET IL Y AVAIT UN SECOND MANQUE, dans la même politique : elle
--  n'énumérait que deux origines, `artiste` et `salon`. Le mot
--  `adresse`, ajouté par la nº 39 pour le bloc « Autre adresse »,
--  n'y figurait pas — ce bloc aurait donc échoué même si le statut
--  avait été le bon.
--
--  CE QUE FAIT CE FICHIER
--  -----------------------
--   1. Il remplace la politique d'écriture par celle qui correspond au
--      produit d'aujourd'hui : un rattachement naît VALIDÉ, et les
--      trois origines sont nommées.
--   2. Il retire la politique de réponse (« repondre a une liaison »),
--      devenue sans objet depuis la nº 39 : plus rien dans le site ne
--      répond à une demande, et la laisser en place, c'était laisser à
--      l'autre bout le droit d'écrire `refusee` sur une liaison sans
--      qu'aucun écran ne le propose. On retire une porte que personne
--      n'ouvre.
--
--  ⚠️ CE QUI NE CHANGE PAS, ET C'EST L'ESSENTIEL :
--  LA RÈGLE DE PROPRIÉTÉ RESTE AUSSI STRICTE QU'AVANT. Pour créer un
--  rattachement, il faut toujours POSSÉDER la fiche d'où il part :
--    · origine `salon`   → on possède le SALON (il ajoute un artiste) ;
--    · origine `artiste` → on possède l'ARTISTE (il déclare son salon) ;
--    · origine `adresse` → on possède la fiche qui pose le lien.
--  Personne ne peut fabriquer un lien entre deux fiches qui ne sont
--  pas les siennes. La lecture reste publique (une équipe est
--  publique) et le retrait reste ouvert AUX DEUX BOUTS — c'est cette
--  réversibilité qui remplace l'accord préalable.
--
--  SANS RISQUE : aucune colonne, aucune table, aucune ligne touchée.
--  Rien n'est effacé — ni les liaisons validées, ni les anciens refus.
--  Rejouable autant de fois qu'on veut.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) L'ÉCRITURE — un rattachement naît validé, et les trois origines
--    sont nommées
-- ---------------------------------------------------------------------
--  ⚠️ ON GARDE L'ANCIEN NOM DE POLITIQUE HORS D'ÉTAT DE NUIRE : on le
--  supprime explicitement, sinon les deux coexisteraient et la
--  permissive la plus large gagnerait — ici ce serait sans effet, mais
--  une politique morte qui traîne finit toujours par tromper quelqu'un.
drop policy if exists "demander une liaison" on public.liaisons_artiste_salon;
drop policy if exists "creer un rattachement" on public.liaisons_artiste_salon;

create policy "creer un rattachement"
  on public.liaisons_artiste_salon for insert
  to authenticated
  with check (
    --  IMMÉDIAT : il n'y a plus d'attente, donc plus d'autre valeur
    --  possible à la création. Les anciens `refusee` restent en base
    --  et gardent leur effet ; ils ne peuvent simplement plus naître.
    statut = 'validee'
    and (
      --  UN SALON AJOUTE QUELQU'UN À SON ÉQUIPE : il possède le salon.
      (origine = 'salon' and exists (
        select 1 from public.tatoueurs t
         where t.id = liaisons_artiste_salon.salon_id
           and t.user_id = auth.uid()))
      or
      --  UN ARTISTE DÉCLARE OÙ IL TRAVAILLE (origine `artiste`), ou
      --  UNE FICHE POSE UN LIEN VERS UN AUTRE ÉTABLISSEMENT (origine
      --  `adresse`) : dans les deux cas la fiche qui pose le lien est
      --  du côté `artiste_id`, et c'est elle qu'il faut posséder.
      (origine in ('artiste', 'adresse') and exists (
        select 1 from public.tatoueurs t
         where t.id = liaisons_artiste_salon.artiste_id
           and t.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------
-- 2) LA RÉPONSE N'EXISTE PLUS — on retire sa politique
-- ---------------------------------------------------------------------
--  Depuis la nº 39, aucun écran ne propose de « valider » ou de
--  « refuser » un rattachement : le lien est immédiat, et qui n'en
--  veut pas le RETIRE (politique « retirer sa liaison », inchangée).
--  Cette politique-ci n'autorisait plus rien d'utile — seulement, en
--  théorie, d'écrire `refusee` sur la liaison d'autrui.
drop policy if exists "repondre a une liaison" on public.liaisons_artiste_salon;

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Politiques sur liaisons_artiste_salon', (
    select coalesce(string_agg(polname || ' (' ||
             case polcmd when 'r' then 'lecture'
                         when 'a' then 'écriture'
                         when 'w' then 'modification'
                         when 'd' then 'retrait'
                         else polcmd::text end || ')', ' · '
             order by polname), 'aucune')
      from pg_policy
     where polrelid = 'public.liaisons_artiste_salon'::regclass)),
  (2, 'La politique d''écriture attend bien « validee »', (
    select case when exists (
        select 1 from pg_policy
         where polrelid = 'public.liaisons_artiste_salon'::regclass
           and polname = 'creer un rattachement'
           and pg_get_expr(polwithcheck, polrelid) like '%validee%')
      then 'oui' else 'NON — le correctif n''est pas passé' end)),
  (3, 'Elle nomme les trois origines', (
    select case when (
        select pg_get_expr(polwithcheck, polrelid) from pg_policy
         where polrelid = 'public.liaisons_artiste_salon'::regclass
           and polname = 'creer un rattachement') like '%adresse%'
      then 'oui' else 'NON — le bloc « Autre adresse » échouera' end)),
  (4, 'Rattachements en base (aucun n''a bougé)', (
    select count(*)::text from public.liaisons_artiste_salon)),
  (5, '  dont refus anciens, laissés tels quels', (
    select count(*)::text from public.liaisons_artiste_salon
     where statut = 'refusee'))
) as etat(ordre, mesure, valeur)
order by ordre;
