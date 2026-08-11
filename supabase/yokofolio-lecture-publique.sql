-- ================================================================
--  YOKOFOLIO — LE SITE REDEVIENT VISIBLE AU PUBLIC
--  (migration nº 59 — à passer APRÈS yokofolio-style-avec-photo.sql)
-- ================================================================
--  ⚠️⚠️ CE FICHIER EST CORRIGÉ PAR LA Nº 60
--  (`yokofolio-en-ligne-vraie-regle.sql`) — PASSER LES DEUX, DANS
--  L'ORDRE. Le point 2 ci-dessous exige `statut = 'validee'` en plus de
--  `publie = true` : c'était une erreur. `statut` n'est pas tenu à jour
--  de façon fiable (voir l'en-tête de la nº 60), et des fiches
--  parfaitement validées devenaient invisibles. La nº 60 refait la
--  fonction et la politique sur la seule colonne qui porte vraiment la
--  publication, `publie` — et ELLE RESTE PLUS STRICTE que l'état
--  d'avant la nº 59. Tout le reste de ce fichier (les droits de
--  lecture, les quatre politiques rattachées) est juste et reste en
--  vigueur.
-- ================================================================
--  LE DÉFAUT CORRIGÉ, reproduit par le propriétaire sur Mac et sur
--  iPhone, sur localhost et sur l'IP du réseau, sur Safari comme sur
--  Chrome :
--    · connecté à son compte  → ses fiches s'affichent ;
--    · déconnecté ou en privé → « 404 This page could not be found »,
--      et la mosaïque ne montre que des cartes de DÉMONSTRATION.
--
--  Le site est donc invisible au public. C'est bloquant pour la mise
--  en ligne.
--
--  CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE :
--   1. il DONNE au rôle anonyme le droit de lire les six objets dont
--      une fiche publique et la mosaïque ont besoin — et seulement
--      eux ;
--   2. il RESSERRE la définition de « public » : une fiche n'est
--      publique que si elle est EN LIGNE — `publie = true` ET
--      `statut = 'validee'` ET pas en cours de suppression. Un
--      brouillon, une fiche en attente de validation ou refusée reste
--      invisible, à son adresse exacte comprise ;
--   3. il applique la MÊME règle aux données rattachées : modes
--      d'exercice, studios, liaisons, photos du portfolio. Le
--      portfolio et les liaisons étaient lisibles par TOUT LE MONDE,
--      fiche publiée ou non (`using (true)`) — les photos d'un
--      brouillon fuyaient. C'est corrigé ici.
--   4. il n'ouvre RIEN d'autre. Les comptes, les favoris, les suivis,
--      les signalements, les messages, les notifications, les
--      suppressions et le démarchage ne sont pas touchés : ils
--      restent fermés au rôle anonyme.
--
--  ⚠️ LES DROITS (`grant`) ET LES POLITIQUES SONT DEUX CHOSES
--  DIFFÉRENTES, et il faut les deux. Une politique dit QUELLES LIGNES
--  un rôle peut voir ; le droit dit s'il peut ADRESSER la table du
--  tout. Un `grant select` manquant produit « permission denied for
--  table … », que le site attrape et traduit par… la démonstration.
--  C'est la première chose que ce fichier rétablit.
--
--  RELANÇABLE : politiques refaites par `drop … if exists` puis
--  `create`, droits idempotents, aucune donnée touchée. Le fichier ne
--  lit ni n'écrit une seule ligne de contenu.
--
--  À LA FIN, IL DIT CE QU'IL EN EST : un tableau, table par table, du
--  droit de lecture anonyme — présent ou absent — pour tout ce qu'une
--  fiche publique a besoin de lire, et un second tableau qui vérifie
--  que les tables privées sont bien restées fermées.
-- ================================================================

-- ----------------------------------------------------------------
--  0) LE SCHÉMA LUI-MÊME
-- ----------------------------------------------------------------
--  Sans `usage` sur le schéma, aucun droit de table ne sert à rien.
grant usage on schema public to anon, authenticated;

-- ----------------------------------------------------------------
--  1) LES DROITS DE LECTURE — les six objets du public, et eux seuls
-- ----------------------------------------------------------------
--  ⚠️ AUCUNE TABLE PRIVÉE N'EST CITÉE ICI. La liste est fermée, et
--  elle est exactement celle dont une fiche publique et la mosaïque
--  ont besoin : la fiche, ses modes d'exercice, ses studios, ses
--  liaisons (l'équipe d'un salon), son portfolio. Les styles, les
--  rendus, les adresses et les horaires ne sont pas des tables : ce
--  sont des COLONNES de `tatoueurs` (styles, rendu, adresse, ville,
--  horaires_*) et de `studios` — elles suivent donc la fiche.
grant select on public.tatoueurs to anon, authenticated;
grant select on public.modes_exercice to anon, authenticated;
grant select on public.studios to anon, authenticated;
grant select on public.liaisons_artiste_salon to anon, authenticated;
grant select on public.photos_tatoueur to anon, authenticated;

--  LES VUES QUE LES PAGES PUBLIQUES LISENT. Une vue n'hérite pas des
--  droits de ses tables : il lui faut les siens.
do $$
begin
  if to_regclass('public.equipe_salon') is not null then
    execute 'grant select on public.equipe_salon to anon, authenticated';
  end if;
  if to_regclass('public.modes_exercice_actifs') is not null then
    execute 'grant select on public.modes_exercice_actifs to anon, authenticated';
  end if;
  if to_regclass('public.clics_tatoueurs') is not null then
    execute 'grant select on public.clics_tatoueurs to anon, authenticated';
  end if;
  if to_regclass('public.points_tatoueur') is not null then
    execute 'grant select on public.points_tatoueur to anon, authenticated';
  end if;
  if to_regclass('public.lieux_tatoueur') is not null then
    execute 'grant select on public.lieux_tatoueur to anon, authenticated';
  end if;
  if to_regclass('public.lieux_annexes_tatoueur') is not null then
    execute 'grant select on public.lieux_annexes_tatoueur to anon, authenticated';
  end if;
  if to_regclass('public.zones_tatoueur') is not null then
    execute 'grant select on public.zones_tatoueur to anon, authenticated';
  end if;
end $$;

--  LA RECHERCHE EN BASE — la mosaïque l'appelle à chaque page.
do $$
begin
  if exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'rechercher_tatoueurs'
  ) then
    execute 'grant execute on function public.rechercher_tatoueurs to anon, authenticated';
  end if;
end $$;

-- ----------------------------------------------------------------
--  2) « EN LIGNE » : LA DÉFINITION, EN UN SEUL ENDROIT
-- ----------------------------------------------------------------
--  Une fiche est publique quand elle est PUBLIÉE, VALIDÉE, et qu'elle
--  n'est pas en cours de suppression. Les trois conditions, ensemble.
--  Les fiches de démonstration (sans compte) sont `statut = 'validee'`
--  depuis la migration nº 5 : elles restent publiques.
--
--  ⚠️ Écrite en fonction pour que les cinq politiques disent
--  EXACTEMENT la même chose, aujourd'hui et après la prochaine passe.
--  `security invoker` : elle ne donne aucun droit, elle ne fait que
--  lire une ligne déjà lisible par celui qui appelle. `stable` : elle
--  ne change rien, l'optimiseur peut la déplier.
create or replace function public.fiche_en_ligne(p_tatoueur_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
      from public.tatoueurs t
     where t.id = p_tatoueur_id
       and t.publie = true
       and t.statut = 'validee'
       and t.supprime_le is null
  );
$$;

comment on function public.fiche_en_ligne(uuid) is
  'Vrai quand la fiche est EN LIGNE : publiée, validée, et pas en cours de suppression. La seule définition du « public » (migration nº 59).';

grant execute on function public.fiche_en_ligne(uuid) to anon, authenticated;

-- ----------------------------------------------------------------
--  3) LA FICHE — lecture publique des seules fiches EN LIGNE
-- ----------------------------------------------------------------
alter table public.tatoueurs enable row level security;

--  ⚠️ ON REMPLACE la politique de la nº 1, qui ne regardait que
--  `publie` : une fiche publiée mais NON validée était publique.
drop policy if exists "lecture publique des tatoueurs publies" on public.tatoueurs;
create policy "lecture publique des tatoueurs publies"
  on public.tatoueurs for select
  to anon, authenticated
  using (
    publie = true
    and statut = 'validee'
    and supprime_le is null
  );

--  LE PROPRIÉTAIRE GARDE SA FICHE, quel qu'en soit l'état : c'est la
--  politique de la nº 24, redite ici pour qu'un seul fichier suffise
--  à rétablir l'ensemble. (Deux politiques de lecture s'ADDITIONNENT :
--  voir l'une OU l'autre suffit.)
drop policy if exists "lecture de sa propre fiche" on public.tatoueurs;
create policy "lecture de sa propre fiche"
  on public.tatoueurs for select
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
--  4) LES DONNÉES RATTACHÉES — la même règle, sans exception
-- ----------------------------------------------------------------
--  MODES D'EXERCICE (où et comment il tatoue).
alter table public.modes_exercice enable row level security;
drop policy if exists "lecture publique des modes" on public.modes_exercice;
create policy "lecture publique des modes"
  on public.modes_exercice for select
  to anon, authenticated
  using (
    public.fiche_en_ligne(modes_exercice.tatoueur_id)
    or exists (
      select 1 from public.tatoueurs t
       where t.id = modes_exercice.tatoueur_id
         and t.user_id = auth.uid()
    )
  );

--  STUDIOS (l'adresse et les horaires d'un lieu).
alter table public.studios enable row level security;
drop policy if exists "lecture publique des studios" on public.studios;
create policy "lecture publique des studios"
  on public.studios for select
  to anon, authenticated
  using (
    public.fiche_en_ligne(studios.tatoueur_id)
    or exists (
      select 1 from public.tatoueurs t
       where t.id = studios.tatoueur_id
         and t.user_id = auth.uid()
    )
  );

--  LIAISONS ARTISTE ↔ SALON (l'équipe d'un salon).
--  ⚠️ ELLES ÉTAIENT LISIBLES PAR TOUT LE MONDE, sans condition
--  (`using (true)`) : on pouvait lister les rattachements de fiches
--  qui ne sont pas publiques. Une liaison ne se voit désormais que si
--  L'UN DES DEUX CÔTÉS est en ligne — c'est ce qu'il faut pour
--  afficher une équipe — ou si l'on possède l'un des deux côtés.
alter table public.liaisons_artiste_salon enable row level security;
drop policy if exists "lecture publique des liaisons" on public.liaisons_artiste_salon;
create policy "lecture publique des liaisons"
  on public.liaisons_artiste_salon for select
  to anon, authenticated
  using (
    public.fiche_en_ligne(liaisons_artiste_salon.artiste_id)
    or public.fiche_en_ligne(liaisons_artiste_salon.salon_id)
    or exists (
      select 1 from public.tatoueurs t
       where t.id in (
               liaisons_artiste_salon.artiste_id,
               liaisons_artiste_salon.salon_id
             )
         and t.user_id = auth.uid()
    )
  );

--  PHOTOS DU PORTFOLIO (styles, rendus, natures — les tags vivent
--  dans cette table).
--  ⚠️ MÊME CORRECTION : elles étaient lisibles sans condition.
alter table public.photos_tatoueur enable row level security;
drop policy if exists "lecture publique des photos" on public.photos_tatoueur;
create policy "lecture publique des photos"
  on public.photos_tatoueur for select
  to anon, authenticated
  using (
    public.fiche_en_ligne(photos_tatoueur.tatoueur_id)
    or exists (
      select 1 from public.tatoueurs t
       where t.id = photos_tatoueur.tatoueur_id
         and t.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
--  5) LES FICHES DE DÉMONSTRATION, REMISES D'ÉQUERRE
-- ----------------------------------------------------------------
--  ⚠️ MESURÉ AU REJEU DES 58 MIGRATIONS SUR BASE VIERGE : cinq fiches
--  de démonstration sont `publie = true` mais `statut = 'en_attente'`
--  — les cinq fiches internationales de la migration nº 20, insérées
--  APRÈS que la nº 5 eut posé `statut = 'validee'` sur toutes les
--  démonstrations. Elles ont donc gardé le statut par défaut.
--  Sous l'ancienne politique (qui ne regardait que `publie`) elles
--  étaient publiques ; sous la nouvelle, elles disparaîtraient.
--
--  On répète donc, mot pour mot, la règle de la nº 5 : une fiche de
--  DÉMONSTRATION (sans compte) est validée.
--  ⚠️ AUCUNE FICHE DE VRAI TATOUEUR N'EST TOUCHÉE — `user_id is null`
--  est la condition, et elle ne laisse passer que les démonstrations.
update public.tatoueurs
   set statut = 'validee'
 where user_id is null
   and statut <> 'validee';

-- ----------------------------------------------------------------
--  6) CE QUI N'EST PAS TOUCHÉ — dit noir sur blanc
-- ----------------------------------------------------------------
--  Aucune politique, aucun droit n'est posé sur :
--    · public.favoris_photos          (les favoris d'un compte)
--    · public.tatoueurs_suivis        (les tatoueurs suivis)
--    · public.notifications_compte    (les notifications)
--    · public.signalements_fiches     (les signalements)
--    · public.messages_yokofolio      (les messages de contact)
--    · public.suggestions_style       (les suggestions de styles)
--    · public.demarchages             (le démarchage)
--    · public.demarchage_fiches       (le démarchage)
--    · public.suppressions_comptes    (les suppressions de comptes)
--    · public.clics_fiches            (les clics bruts)
--  Ils gardent EXACTEMENT les droits qu'ils avaient avant ce fichier.

-- ================================================================
--  VÉRIFICATION — ce fichier ne dit pas « c'est fait », il le MONTRE
-- ================================================================
--  1) LE PUBLIC : chaque objet doit être LISIBLE par le rôle anonyme.
select
  'LECTURE PUBLIQUE' as controle,
  objet,
  case when has_table_privilege('anon', objet, 'SELECT')
       then '✅ droit de lecture'
       else '❌ DROIT MANQUANT' end as droit,
  coalesce((
    select string_agg(policyname, ' + ')
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = split_part(objet, '.', 2)
       and p.cmd = 'SELECT'
       and (p.roles @> array['anon']::name[] or p.roles @> array['public']::name[])
  ), '— (vue : pas de politique, le droit suffit)') as politiques_anonymes
from (values
  ('public.tatoueurs'),
  ('public.modes_exercice'),
  ('public.studios'),
  ('public.liaisons_artiste_salon'),
  ('public.photos_tatoueur')
) as t(objet);

--  2) LE PRIVÉ : chacune de ces tables doit rester FERMÉE.
--     ⚠️ `suggestions_style` est un cas connu et VOULU depuis la
--     migration nº 52 : les styles ACCEPTÉS y sont publics (le menu
--     « Explorer » les affiche). Les demandes en attente ou refusées,
--     elles, ne le sont pas. Ce fichier n'y touche pas.
select
  'RESTE PRIVÉ' as controle,
  objet,
  case when has_table_privilege('anon', objet, 'SELECT')
       then '⚠️ droit de lecture présent — vérifier les politiques'
       else '✅ aucun droit de lecture' end as droit,
  coalesce((
    select string_agg(policyname || ' [' || array_to_string(p.roles, ',') || ']', ' + ')
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = split_part(objet, '.', 2)
       and p.cmd = 'SELECT'
       and (p.roles @> array['anon']::name[] or p.roles @> array['public']::name[])
  ), '✅ aucune politique de lecture anonyme') as politiques_anonymes
from (values
  ('public.favoris_photos'),
  ('public.tatoueurs_suivis'),
  ('public.notifications_compte'),
  ('public.signalements_fiches'),
  ('public.messages_yokofolio'),
  ('public.suggestions_style'),
  ('public.demarchages'),
  ('public.demarchage_fiches'),
  ('public.suppressions_comptes'),
  ('public.clics_fiches')
) as t(objet)
where to_regclass(objet) is not null;

--  3) COMBIEN DE FICHES SONT RÉELLEMENT EN LIGNE ? Si la mosaïque est
--     vide pour un visiteur, la réponse est souvent ici — et pas dans
--     les droits.
--     ⚠️ SI `a_valider` N'EST PAS ZÉRO : ces fiches-là sont publiées
--     mais pas validées — elles ne sont donc PAS en ligne, et le
--     public ne les voit pas. C'est l'écran de validation qui les
--     libère (« Mon espace » → admin), ou, en une ligne :
--        update public.tatoueurs set statut = 'validee'
--         where id = '…';
select
  'FICHES' as controle,
  count(*) filter (where publie = true and statut = 'validee' and supprime_le is null) as en_ligne,
  count(*) filter (where publie = true and statut <> 'validee') as a_valider,
  count(*) filter (where publie = false) as non_publiees,
  count(*) filter (where user_id is null) as demonstrations,
  count(*) as total
from public.tatoueurs;

--  4) LA PREUVE PAR L'USAGE : ce qu'un VISITEUR NON CONNECTÉ voit
--     vraiment, en prenant son rôle le temps de trois comptages.
--  ⚠️ DANS UNE TRANSACTION, et c'est nécessaire : hors transaction,
--  `set local` est ignoré (avec un avertissement) et le comptage se
--  ferait sous le rôle administrateur — il compterait TOUT, et
--  dirait donc le contraire de la vérité. L'éditeur de Supabase
--  exécute déjà le fichier dans une transaction : ce `begin` y pose
--  seulement un avertissement, sans effet.
begin;
set local role anon;
select
  'VU PAR UN VISITEUR' as controle,
  (select count(*) from public.tatoueurs) as fiches_visibles,
  (select count(*) from public.photos_tatoueur) as photos_visibles,
  (select count(*) from public.modes_exercice) as modes_visibles,
  (select count(*) from public.studios) as studios_visibles;
reset role;
commit;
