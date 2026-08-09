-- ============================================================
-- YOKOFOLIO — MODIFICATIONS EN ATTENTE + NOTIFICATION (15e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-signalement-note.sql
--  (14e). Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--   1. LE BROUILLON (`brouillon` jsonb) : quand un tatoueur modifie
--      une fiche DÉJÀ EN LIGNE, la version publique ne bouge pas —
--      ses modifications sont posées ici, en attente de validation.
--      Une seule version en attente à la fois : chaque nouvel
--      enregistrement remplace la précédente. À la validation,
--      l'admin recopie ce contenu dans les colonnes publiques et vide
--      le brouillon. (Une fiche PAS ENCORE publiée, elle, est
--      modifiée directement — pas de doublon dans l'admin.)
--
--   2. LA NOTIFICATION (`validation_a_notifier`) : posée à VRAI par
--      la validation de l'admin ; la fiche du tatoueur lui montre
--      alors « Ta fiche est validée » à sa prochaine connexion, et la
--      remet à FAUX dès qu'il en prend acte. Elle ne revient plus.
--
--   3. LE DROIT DE MODIFIER SA PROPRE FICHE (politique RLS `update`),
--      qui n'existait pas : la création passait, la modification
--      était refusée par la base.
--
--   4. UN GARDE-FOU (déclencheur) : un tatoueur ne peut PAS se
--      publier lui-même ni s'inventer une notification — ces deux
--      colonnes n'obéissent qu'à l'admin (la clé de service, qui ne
--      passe pas par auth.uid()). Il peut en revanche PRENDRE ACTE
--      d'une notification (vrai → faux).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans.

alter table public.tatoueurs
  add column if not exists brouillon jsonb,
  add column if not exists validation_a_notifier boolean not null default false;

comment on column public.tatoueurs.brouillon is
  'Modifications en attente de validation d''une fiche déjà publiée (une seule version à la fois). Null = rien en attente.';
comment on column public.tatoueurs.validation_a_notifier is
  'Vrai = le tatoueur n''a pas encore vu que sa fiche est validée ; sa fiche le lui annonce puis repasse à faux.';

-- Le droit de modifier SA fiche (la création existait déjà).
drop policy if exists "modification de sa propre fiche" on public.tatoueurs;
create policy "modification de sa propre fiche"
  on public.tatoueurs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Le garde-fou : `publie` et la notification n'obéissent qu'à l'admin.
create or replace function public.tatoueurs_garde_fou()
returns trigger
language plpgsql
security definer
as $$
begin
  -- auth.uid() non nul = requête d'un COMPTE (le tatoueur lui-même) ;
  -- la clé de service de l'admin, elle, n'a pas d'uid.
  if auth.uid() is not null then
    new.publie := old.publie;
    -- Prendre acte (vrai → faux) est permis ; s'inventer une
    -- notification (faux → vrai) ne l'est pas.
    if old.validation_a_notifier = false then
      new.validation_a_notifier := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tatoueurs_garde_fou on public.tatoueurs;
create trigger tatoueurs_garde_fou
  before update on public.tatoueurs
  for each row execute function public.tatoueurs_garde_fou();
