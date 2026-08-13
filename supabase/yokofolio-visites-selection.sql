-- =====================================================================
--  MIGRATION Nº 68 — LA DERNIÈRE VISITE DE « MA SÉLECTION »
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle se relance sans risque (create if not exists partout).
--
--  CE QU'ELLE FAIT (passe nº 243-§5). La page « Ma sélection » compte
--  les publications de chaque artiste suivi depuis la DERNIÈRE VISITE
--  du compte sur cette page (« 3 nouvelles réalisations »). Il faut
--  donc mémoriser cette visite : UNE LIGNE PAR COMPTE, un horodatage —
--  la page entière est concernée, rien de plus fin n'est utile.
--
--  ⚠️ LE PIÈGE DE L'ÉCRITURE, dit dans le code aussi : l'horodatage
--  n'est JAMAIS écrit à l'ouverture de la page (les compteurs
--  s'effaceraient avant d'avoir été lus) — il s'écrit AU DÉPART,
--  depuis le navigateur (/api/selection/visite).
-- =====================================================================

-- ------------------------------------------------------------
-- 1) LA TABLE — une ligne par compte
-- ------------------------------------------------------------
create table if not exists public.visites_selection (
  utilisateur_id uuid primary key references auth.users(id) on delete cascade,
  vu_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) LA SÉCURITÉ — chacun ne lit et n'écrit QUE sa ligne
-- ------------------------------------------------------------
alter table public.visites_selection enable row level security;

drop policy if exists "lire sa visite" on public.visites_selection;
create policy "lire sa visite"
  on public.visites_selection for select
  using (auth.uid() = utilisateur_id);

drop policy if exists "ecrire sa visite" on public.visites_selection;
create policy "ecrire sa visite"
  on public.visites_selection for insert
  with check (auth.uid() = utilisateur_id);

drop policy if exists "remplacer sa visite" on public.visites_selection;
create policy "remplacer sa visite"
  on public.visites_selection for update
  using (auth.uid() = utilisateur_id)
  with check (auth.uid() = utilisateur_id);

-- ------------------------------------------------------------
-- 3) LE CONTRÔLE — à lire après le Run
-- ------------------------------------------------------------
select case
         when exists (
           select 1 from information_schema.tables
            where table_schema = 'public'
              and table_name = 'visites_selection'
         )
         then 'OK — la table visites_selection existe'
         else 'À REVOIR — la table manque'
       end as verdict;
