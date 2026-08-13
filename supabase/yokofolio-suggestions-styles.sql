-- ============================================================
--  YOKOFOLIO — LES SUGGESTIONS DE STYLES
--  (migration nº 52 — à passer APRÈS yokofolio-liens-libres.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  CE QUE ÇA CRÉE
--  --------------
--  Une table de DEMANDES. Un tatoueur qui ne trouve pas son style
--  dans la fenêtre « Ajouter un style » en propose un ; l'administra-
--  tion accepte ou refuse depuis /admin, en pouvant RENOMMER ce qui a
--  été proposé et CHOISIR OÙ le ranger (la liste principale, ou la
--  famille « Traditionnel ethnique »).
--
--  ⚠️ CETTE TABLE EST AUSSI LE CATALOGUE DES STYLES AJOUTÉS.
--  C'est le point important de cette migration, et il mérite d'être
--  dit clairement : une ligne ACCEPTÉE n'est pas l'archive d'une
--  décision passée, c'est un style VIVANT du site. Le code lit
--  `etat = 'acceptee'` pour agrandir la liste des trente-huit styles
--  du fichier de réglages (src/config/tatouage.ts). Supprimer une
--  ligne acceptée retire donc le style du site — les portfolios qui
--  l'avaient coché garderaient un slug que plus rien ne nomme.
--  Pour retirer un style, on repasse sa ligne à « refusee ».
--
--  POURQUOI PAS UNE TABLE `styles` À PART ?
--  Parce qu'il n'y a qu'une seule façon d'ajouter un style — la
--  suggestion d'un tatoueur, acceptée par l'administration. Deux
--  tables auraient demandé de les tenir d'accord ; une seule dit
--  exactement la même chose, sans risque de désaccord.
--
--  QUI ÉCRIT : le tatoueur crée SA demande (et rien d'autre) ;
--  l'administration décide, avec la clé de service.
--  QUI LIT : le tatoueur ses demandes ; TOUT LE MONDE les lignes
--  acceptées — ce sont des styles publics, ils s'affichent dans le
--  menu Explorer et sur les pages style + ville.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA TABLE
-- ------------------------------------------------------------
create table if not exists public.suggestions_style (
  id uuid primary key default gen_random_uuid(),
  -- QUI A PROPOSÉ — et pourquoi ce lien peut se DÉFAIRE.
  -- ⚠️ `on delete set null`, PAS `cascade`. Un style accepté
  -- appartient au SITE, plus à celui qui l'a proposé : le faire
  -- disparaître avec son compte retirerait un style du catalogue, et
  -- tous les portfolios qui l'avaient coché afficheraient un slug que
  -- plus rien ne nomme. La colonne est donc facultative — ce qui est
  -- la vérité : un style accepté n'a plus besoin de son proposeur.
  -- Personne ne peut CRÉER une demande orpheline (voir la politique
  -- d'insertion, 4) ; seule la fermeture d'un compte en produit.
  user_id uuid references auth.users(id) on delete set null,
  -- La fiche depuis laquelle la demande est partie, pour le contexte
  -- de l'administration. Le nom est recopié en dur : il doit rester
  -- lisible même si la fiche disparaît.
  fiche_id uuid references public.tatoueurs(id) on delete set null,
  fiche_nom text,

  -- CE QUE LE TATOUEUR A ÉCRIT, tel quel — jamais réécrit, même
  -- après renommage : l'administration doit pouvoir relire la demande
  -- d'origine.
  propose text not null,

  -- L'ÉTAT DE LA DEMANDE.
  etat text not null default 'en_attente',

  -- CE QUE L'ADMINISTRATION A ARRÊTÉ (acceptation seulement).
  -- `label` est le nom affiché, `slug` son identifiant d'adresse
  -- (/tatouage/<slug>/<ville>), `famille` son rangement.
  label text,
  slug text,
  famille text,

  -- Le message facultatif transmis au tatoueur, dans les deux cas.
  message text,

  cree_le timestamptz not null default now(),
  traite_le timestamptz
);

comment on table public.suggestions_style is
  'Les styles proposés par les tatoueurs. Une ligne « acceptee » EST un style du site : le code la lit pour agrandir le catalogue de src/config/tatouage.ts.';

-- ------------------------------------------------------------
-- 2) LES RÈGLES DE FORME
-- ------------------------------------------------------------
-- Les trois états possibles, et rien d'autre.
alter table public.suggestions_style
  drop constraint if exists suggestions_style_etat;
alter table public.suggestions_style
  add constraint suggestions_style_etat
  check (etat in ('en_attente', 'acceptee', 'refusee'));

-- LA PROPOSITION : deux caractères au moins (« UV » est un style),
-- quarante au plus. Le plafond n'est pas décoratif : ce texte
-- s'affiche tel quel dans /admin, et un roman y serait illisible.
alter table public.suggestions_style
  drop constraint if exists suggestions_style_propose_longueur;
alter table public.suggestions_style
  add constraint suggestions_style_propose_longueur
  check (char_length(btrim(propose)) between 2 and 40);

-- LE SLUG : minuscules, chiffres et traits d'union — la convention
-- des trente-huit styles du fichier de réglages. Il entre dans des
-- adresses publiques : ni accent, ni espace, ni majuscule.
alter table public.suggestions_style
  drop constraint if exists suggestions_style_slug_forme;
alter table public.suggestions_style
  add constraint suggestions_style_slug_forme
  check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- LA FAMILLE : la liste principale (null) ou la seule famille qui
-- existe aujourd'hui. Ajouter une famille au site = ajouter son slug
-- ici ET dans FAMILLES_STYLES (src/config/tatouage.ts).
alter table public.suggestions_style
  drop constraint if exists suggestions_style_famille;
alter table public.suggestions_style
  add constraint suggestions_style_famille
  check (famille is null or famille = 'traditionnel-ethnique');
--  ⚠️ CETTE CONTRAINTE A ÉTÉ REFAITE PAR LA MIGRATION Nº 67
--  (yokofolio-famille-cultures-du-monde.sql, passe nº 239-§2) : la
--  famille s'appelle désormais `cultures-du-monde`. Ce fichier-ci
--  reste tel qu'il a été passé — une migration est une HISTOIRE, on ne
--  la réécrit pas ; c'est la nº 67 qui dit l'état d'aujourd'hui.

-- UNE ACCEPTATION EST COMPLÈTE, ou n'est pas : accepter sans nom ni
-- slug produirait un style fantôme, listé nulle part et cherchable
-- par personne.
alter table public.suggestions_style
  drop constraint if exists suggestions_style_acceptee_complete;
alter table public.suggestions_style
  add constraint suggestions_style_acceptee_complete
  check (
    etat <> 'acceptee'
    or (label is not null and btrim(label) <> '' and slug is not null)
  );

-- ------------------------------------------------------------
-- 3) LES INDEX
-- ------------------------------------------------------------
-- ⚠️ DEUX STYLES NE PEUVENT PAS PORTER LE MÊME SLUG. L'unicité ne
-- vaut QUE sur les lignes acceptées : deux tatoueurs ont le droit de
-- proposer le même mot le même jour — c'est même le signe qu'il
-- manque vraiment. Seule l'acceptation tranche.
create unique index if not exists idx_suggestions_style_slug_unique
  on public.suggestions_style (slug)
  where etat = 'acceptee';

-- La lecture du catalogue : « tous les styles acceptés ».
create index if not exists idx_suggestions_style_acceptees
  on public.suggestions_style (etat)
  where etat = 'acceptee';

-- La liste de /admin : les demandes en attente d'abord, puis par date.
create index if not exists idx_suggestions_style_attente
  on public.suggestions_style (cree_le desc);

-- Le décompte du quota : « mes demandes des sept derniers jours ».
create index if not exists idx_suggestions_style_par_compte
  on public.suggestions_style (user_id, cree_le desc);

-- ------------------------------------------------------------
-- 4) LES RÈGLES D'ACCÈS
-- ------------------------------------------------------------
alter table public.suggestions_style enable row level security;

-- LIRE — deux droits bien distincts :
--  · ses propres demandes, quel qu'en soit l'état ;
--  · les styles ACCEPTÉS, par tout le monde, même déconnecté : ce
--    sont des styles publics du site, le menu Explorer les affiche.
drop policy if exists "lecture de ses suggestions" on public.suggestions_style;
create policy "lecture de ses suggestions"
  on public.suggestions_style for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "les styles acceptes sont publics" on public.suggestions_style;
create policy "les styles acceptes sont publics"
  on public.suggestions_style for select
  to anon, authenticated
  using (etat = 'acceptee');

-- ÉCRIRE — un compte connecté crée SA demande, en attente, et sans
-- pouvoir se l'accepter à lui-même : les trois colonnes de décision
-- doivent rester vides.
drop policy if exists "proposer un style" on public.suggestions_style;
create policy "proposer un style"
  on public.suggestions_style for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and etat = 'en_attente'
    and label is null
    and slug is null
    and message is null
  );

-- MODIFIER, SUPPRIMER : personne. Aucune politique — donc aucun
-- droit. Seule la clé de service (l'administration) décide.

-- ------------------------------------------------------------
-- 5) VÉRIFICATION
-- ------------------------------------------------------------
--  À passer après coup pour voir où en est la table :
--
--    select etat, count(*) from public.suggestions_style group by etat;
--    select slug, label, famille from public.suggestions_style
--      where etat = 'acceptee' order by label;
