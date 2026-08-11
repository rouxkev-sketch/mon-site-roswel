-- ================================================================
--  YOKOFOLIO — « EN LIGNE » : LA VRAIE RÈGLE
--  (migration nº 60 — à passer APRÈS yokofolio-lecture-publique.sql)
-- ================================================================
--  CE QU'ELLE CORRIGE, ET C'EST UNE ERREUR DE LA Nº 59.
--  La nº 59 a défini « en ligne » comme `publie = true` ET
--  `statut = 'validee'`. Le second terme était de trop, et il rendait
--  invisibles des fiches PARFAITEMENT VALIDÉES. Trois faits, tous
--  vérifiables dans le dépôt :
--
--   1. C'EST `publie` QUI PORTE LA PUBLICATION, ET LUI SEUL.
--      La migration nº 5 l'écrit noir sur blanc, dans le commentaire
--      de la colonne `statut` : « La visibilité publique reste portée
--      par `publie` ».
--
--   2. ET `publie` N'OBÉIT QU'À L'ADMINISTRATEUR. Le déclencheur
--      `tatoueurs_garde_fou` (migration nº 15) remet `publie` à son
--      ancienne valeur dès que la requête vient d'un COMPTE
--      (`auth.uid()` non nul). Seule la clé de service — donc l'écran
--      de validation — peut publier une fiche. `publie = true` EST
--      l'acte de validation : s'y fier n'assouplit rien du tout.
--
--   3. `statut`, LUI, N'EST PAS TENU À JOUR DE FAÇON FIABLE :
--       · « demander des modifications » écrit `statut =
--         'modifications'` ET NE TOUCHE PAS À `publie` — c'est VOULU
--         (une fiche en ligne le reste, sa version publique n'a pas
--         bougé). Sous la règle de la nº 59, cette fiche disparaissait
--         pourtant du site ;
--       · l'écran de validation, quand une colonne récente manque,
--         RETIRE `statut` de sa mise à jour et réessaie — au pire il
--         ne pose plus que `publie = true`. La fiche est alors publiée
--         avec son ancien statut ;
--       · aucun déclencheur ne protège `statut` : contrairement à
--         `publie`, un compte peut l'écrire.
--      Et la liste « en attente » de l'administration ne montre que
--      `statut = 'en_attente'` : une fiche restée en `'modifications'`
--      n'y apparaît donc PAS — d'où « mon administration ne montre
--      aucune fiche en attente » alors que la fiche était bloquée.
--
--  ⚠️ RIEN N'EST ASSOUPLI. La règle posée ici est PLUS STRICTE que
--  celle d'avant la nº 59 (qui ne regardait que `publie`) :
--    · publiée par l'administrateur      (`publie = true`)
--    · pas en cours de suppression       (`supprime_le is null`)
--    · pas mise hors ligne par l'admin   (`hors_ligne` ≠ vrai)
--    · pas refusée                        (`statut` ≠ 'refusee')
--  Une fiche non publiée, refusée, mise hors ligne ou en cours de
--  suppression reste INVISIBLE, à son adresse exacte comprise.
--
--  RELANÇABLE : la fonction est refaite par `create or replace`, la
--  politique par `drop … if exists` puis `create`. Aucune donnée n'est
--  touchée — pas une ligne écrite.
-- ================================================================

-- ----------------------------------------------------------------
--  0) UNE CONTRAINTE OUBLIÉE QUI REND `statut` INUTILISABLE
-- ----------------------------------------------------------------
--  ⚠️ TROUVÉ EN REJOUANT LES MIGRATIONS SUR BASE VIERGE, et c'est un
--  vrai défaut, indépendant de la nº 59 :
--    · la nº 5 crée `tatoueurs_statut_valide`
--        check (statut in ('en_attente','validee','refusee'))
--    · la nº 10 crée `tatoueurs_statut_check`, élargie à
--        ('en_attente','validee','refusee','modifications')
--      …mais elle ne supprime que `tatoueurs_statut_check` avant de le
--      refaire : l'ANCIENNE, à l'autre nom, reste en place.
--  LES DEUX S'APPLIQUENT, et la plus stricte gagne : écrire
--  `statut = 'modifications'` est IMPOSSIBLE en base.
--
--  CE QUE ÇA CASSE : « demander des modifications » et « mettre hors
--  ligne » écrivent exactement cette valeur. Leur mise à jour échoue,
--  l'écran de validation retire alors `statut` et réessaie — la
--  décision s'applique à moitié, et `statut` garde sa vieille valeur.
--  C'est l'une des façons dont une fiche validée se retrouve avec un
--  `statut` qui ne dit pas la vérité.
--
--  On retire donc la contrainte périmée. Celle de la nº 10 reste, et
--  elle continue d'interdire n'importe quelle valeur fantaisiste.
alter table public.tatoueurs drop constraint if exists tatoueurs_statut_valide;

--  Et on remet celle de la nº 10, au cas où une base n'aurait pas eu
--  la nº 10 (elle est refaite à l'identique, jamais élargie).
do $$
begin
  alter table public.tatoueurs drop constraint if exists tatoueurs_statut_check;
  alter table public.tatoueurs
    add constraint tatoueurs_statut_check
    check (statut in ('en_attente', 'validee', 'refusee', 'modifications'));
exception when undefined_column then
  null; -- pas de colonne `statut` : rien à contraindre
end $$;

-- ----------------------------------------------------------------
--  1) LA DÉFINITION, EN UN SEUL ENDROIT
-- ----------------------------------------------------------------
--  ⚠️ LES COLONNES SONT LUES PAR `to_jsonb(t)->>'…'` pour `hors_ligne`
--  et `statut` : une base à qui il manquerait une migration récente
--  n'a alors pas d'erreur — la condition se contente d'être vraie.
--  `publie` et `supprime_le`, eux, sont lus directement : ils
--  existent depuis les migrations nº 1 et nº 22, et sans eux la règle
--  n'aurait plus de sens.
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
       and t.supprime_le is null
       and coalesce((to_jsonb(t)->>'hors_ligne')::boolean, false) = false
       and coalesce(to_jsonb(t)->>'statut', '') <> 'refusee'
  );
$$;

comment on function public.fiche_en_ligne(uuid) is
  'Vrai quand la fiche est EN LIGNE : publiée par l''administrateur (colonne `publie`, protégée par le déclencheur tatoueurs_garde_fou), pas supprimée, pas mise hors ligne, pas refusée. La seule définition du « public » (migrations nº 59 et 60).';

grant execute on function public.fiche_en_ligne(uuid) to anon, authenticated;

-- ----------------------------------------------------------------
--  2) LA FICHE — la même règle, écrite en clair
-- ----------------------------------------------------------------
--  ⚠️ ELLE NE PEUT PAS APPELER `fiche_en_ligne()` : la fonction lit
--  `tatoueurs`, et une politique DE `tatoueurs` qui relit `tatoueurs`
--  boucle sur elle-même. Les quatre conditions sont donc répétées ici
--  — c'est le seul endroit où elles le sont, et ce commentaire est là
--  pour qu'on pense à les changer AUX DEUX ENDROITS.
alter table public.tatoueurs enable row level security;

drop policy if exists "lecture publique des tatoueurs publies" on public.tatoueurs;
create policy "lecture publique des tatoueurs publies"
  on public.tatoueurs for select
  to anon, authenticated
  using (
    publie = true
    and supprime_le is null
    and coalesce((to_jsonb(tatoueurs)->>'hors_ligne')::boolean, false) = false
    and coalesce(to_jsonb(tatoueurs)->>'statut', '') <> 'refusee'
  );

--  Le propriétaire garde sa fiche, quel qu'en soit l'état (nº 24).
drop policy if exists "lecture de sa propre fiche" on public.tatoueurs;
create policy "lecture de sa propre fiche"
  on public.tatoueurs for select
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
--  3) LES QUATRE AUTRES POLITIQUES N'ONT PAS À CHANGER
-- ----------------------------------------------------------------
--  Modes, studios, liaisons et photos appellent `fiche_en_ligne()` :
--  refaire la fonction les corrige toutes les quatre d'un coup. C'est
--  exactement pour cela qu'elle existe.

-- ================================================================
--  VÉRIFICATION
-- ================================================================
--  1) La règle, telle que PostgreSQL l'a enregistrée.
select
  'RÈGLE' as controle,
  polname as politique,
  pg_get_expr(polqual, polrelid) as condition
from pg_policy
where polrelid = 'public.tatoueurs'::regclass
  and polname = 'lecture publique des tatoueurs publies';

--  2) Les fiches, et ce qui les bloque encore.
select
  'FICHES' as controle,
  count(*) filter (where publie = true
                     and supprime_le is null
                     and coalesce((to_jsonb(t)->>'hors_ligne')::boolean, false) = false
                     and coalesce(to_jsonb(t)->>'statut','') <> 'refusee') as en_ligne,
  count(*) filter (where publie = false)                                   as non_publiees,
  count(*) filter (where coalesce(to_jsonb(t)->>'statut','') = 'refusee')   as refusees,
  count(*) filter (where coalesce((to_jsonb(t)->>'hors_ligne')::boolean, false)) as hors_ligne,
  count(*) filter (where supprime_le is not null)                          as en_suppression,
  count(*)                                                                 as total
from public.tatoueurs t;

--  3) LA PREUVE PAR L'USAGE : ce qu'un visiteur non connecté voit.
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
  (select count(*) from public.tatoueurs)                          as fiches,
  (select count(*) from public.tatoueurs where user_id is not null) as dont_de_comptes,
  (select count(*) from public.photos_tatoueur)                    as photos;
reset role;
commit;
