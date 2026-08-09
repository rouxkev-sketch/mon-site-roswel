-- ============================================================
--  YOKOFOLIO — LE VERROU DU BLOC 1 (type de fiche et lieux)
--  (migration nº 28 — à passer APRÈS yokofolio-annonce-vue.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  POURQUOI UN VERROU
--  ------------------
--  Le bloc 1 — « artiste ou salon », et où l'on travaille — décide de
--  TOUT le reste de la fiche : les champs qu'elle demande, ce qu'elle
--  affiche en public, les rattachements qu'elle peut nouer. Le changer
--  en cours de route laisse derrière lui des modes d'exercice
--  orphelins, des studios sans objet et des liaisons devenues fausses.
--
--  Il se confirme donc UNE FOIS, explicitement, puis se ferme. Et
--  comme un formulaire qui masque des champs ne protège rien — il
--  suffit d'une requête forgée pour écrire ce qu'on veut —, LE VERROU
--  EST POSÉ PAR LA BASE. L'interface n'en est que le reflet.
--
--  ⚠️ LES FICHES EXISTANTES NE SONT PAS VERROUILLÉES.
--  C'est une décision, pas un oubli, et elle mérite d'être écrite
--  noir sur blanc : ces fiches ont été créées AVANT que cette
--  confirmation existe. Personne ne leur a montré l'avertissement,
--  personne n'a rien confirmé. Les fermer d'office reviendrait à leur
--  retirer, sans le dire, un droit qu'elles avaient encore la veille
--  — et à transformer la moindre erreur de type en ticket
--  d'assistance.
--  Elles restent donc OUVERTES : leur propriétaire verra
--  l'avertissement à sa prochaine visite du formulaire, confirmera
--  comme tout le monde, et se verrouillera lui-même. Le verrou finit
--  par couvrir tout le monde, mais toujours après un OUI.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA COLONNE, ET LA TRACE DU DÉBLOCAGE
-- ------------------------------------------------------------
alter table public.tatoueurs
  add column if not exists exercice_verrouille boolean not null default false;

comment on column public.tatoueurs.exercice_verrouille is
  'Vrai quand le tatoueur a CONFIRMÉ son type de fiche et ses lieux d''exercice. Le reste du formulaire ne s''ouvre qu''après. Lui ne peut plus le remettre à false — seule l''administration le peut (voir /api/admin/deverrouiller-exercice). Les fiches d''avant cette migration restent à false : elles n''ont jamais vu l''avertissement.';

--  QUI A DÉBLOQUÉ QUOI, ET QUAND. Une action d'administration qui
--  défait le choix de quelqu'un ne doit pas être anonyme : sans
--  trace, personne ne peut répondre à « pourquoi ma fiche est-elle
--  repassée en modifiable ? ».
alter table public.tatoueurs
  add column if not exists exercice_debloque_le timestamptz;
alter table public.tatoueurs
  add column if not exists exercice_debloque_par text;

comment on column public.tatoueurs.exercice_debloque_le is
  'Quand l''administration a rouvert le bloc 1 de cette fiche. Null = jamais débloquée.';
comment on column public.tatoueurs.exercice_debloque_par is
  'Le courriel de l''administrateur qui a rouvert le bloc 1. Conservé même après un nouveau verrouillage : c''est un journal, pas un état.';

create index if not exists idx_tatoueurs_exercice_verrouille
  on public.tatoueurs (exercice_verrouille)
  where exercice_verrouille = false;

-- ------------------------------------------------------------
-- 2) LE GARDE-FOU SERVEUR
-- ------------------------------------------------------------
--  CE QU'IL INTERDIT, une fois `exercice_verrouille` à true :
--   · changer `type_fiche` (artiste ↔ salon) ;
--   · remettre `exercice_verrouille` à false soi-même.
--  Ces deux valeurs sont REMISES À CE QU'ELLES ÉTAIENT, en silence —
--  exactement comme le déclencheur qui protège déjà `publie`
--  (migration nº 18). On ne casse pas l'enregistrement pour autant :
--  la bio, les photos, les styles passent normalement ; seule la
--  partie interdite est ignorée.
--
--  LA CLÉ DE SERVICE PASSE : `auth.uid()` est null hors session
--  authentifiée. C'est par là — et seulement par là — que
--  l'administration déverrouille.
create or replace function public.tatoueurs_verrou_exercice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Administration (clé de service) : rien n'est retenu.
  if auth.uid() is null then
    return new;
  end if;

  if old.exercice_verrouille then
    new.type_fiche := old.type_fiche;
    new.exercice_verrouille := true;
    -- La trace de déblocage n'appartient pas non plus au tatoueur.
    new.exercice_debloque_le := old.exercice_debloque_le;
    new.exercice_debloque_par := old.exercice_debloque_par;
  end if;

  return new;
end;
$$;

comment on function public.tatoueurs_verrou_exercice() is
  'Interdit à un tatoueur de changer son type de fiche, de lever son propre verrou ou de retoucher la trace de déblocage, une fois le bloc 1 confirmé. La clé de service (administration) n''est pas concernée.';

drop trigger if exists trg_tatoueurs_verrou_exercice on public.tatoueurs;
create trigger trg_tatoueurs_verrou_exercice
  before update on public.tatoueurs
  for each row
  execute function public.tatoueurs_verrou_exercice();

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Qui est verrouillé, qui ne l'est pas encore :
--  select nom, type_fiche, exercice_verrouille,
--         exercice_debloque_le, exercice_debloque_par
--    from public.tatoueurs order by exercice_verrouille, nom;
--
--  -- Le garde-fou fonctionne-t-il ? (à jouer DANS UNE SESSION
--  -- authentifiée, pas dans l'éditeur SQL, qui utilise la clé de
--  -- service : le type doit rester inchangé.)
--  -- update public.tatoueurs set type_fiche = 'salon'
--  --  where slug = 'une-fiche-verrouillee';
--
--  -- Déverrouiller à la main (dépannage — l'interface
--  -- d'administration fait la même chose, avec la trace) :
--  -- update public.tatoueurs set exercice_verrouille = false
--  --  where slug = 'nom-de-la-fiche';
