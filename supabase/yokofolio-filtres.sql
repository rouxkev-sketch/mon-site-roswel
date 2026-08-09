-- ============================================================
-- YOKOFOLIO — LES FILTRES SECONDAIRES (technique, composition)
-- ============================================================
-- À passer APRÈS yokofolio-dix-huit-styles.sql (9e de la chaîne).
--
-- Deux colonnes de tableaux de slugs (les listes vivent dans
-- src/config/tatouage.ts, FILTRES_TATOUAGE) : des interrupteurs que
-- le tatoueur ALLUME dans son formulaire (facultatif), et que la
-- recherche propose tous allumés — on y éteint ce qu'on ne veut pas
-- voir. Puis des valeurs crédibles pour les treize fiches de
-- démonstration. Rejouable sans dommage.
--
-- (Le groupe « Motif » a existé sur le papier, jamais en base : ce
-- fichier n'ayant pas encore été exécuté, il est corrigé sur place —
-- aucune migration de suppression n'est nécessaire.)

alter table public.tatoueurs
  add column if not exists filtres_technique text[] not null default '{}',
  add column if not exists filtres_composition text[] not null default '{}';

comment on column public.tatoueurs.filtres_technique is
  'Techniques allumées (handpoke, tebori, machine) — voir FILTRES_TATOUAGE.';
comment on column public.tatoueurs.filtres_composition is
  'Compositions allumées (petit-tatouage, patchwork, sleeve, piece-dos, piece-torse, bodysuit).';

update public.tatoueurs set filtres_technique='{machine,handpoke}', filtres_composition='{sleeve,piece-dos}' where slug='atelier-corvus';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{petit-tatouage,patchwork}' where slug='studio-mille-traits';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{piece-torse,sleeve}' where slug='nadege-roux';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{patchwork,petit-tatouage}' where slug='encre-et-sel';
update public.tatoueurs set filtres_technique='{machine,tebori}', filtres_composition='{sleeve,piece-dos,bodysuit}' where slug='hokusai-mecanique';
update public.tatoueurs set filtres_technique='{handpoke,machine}', filtres_composition='{petit-tatouage}' where slug='camille-fauve';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{petit-tatouage,patchwork}' where slug='typo-sauvage';
update public.tatoueurs set filtres_technique='{machine,handpoke}', filtres_composition='{petit-tatouage}' where slug='ligne-claire-studio';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{sleeve,piece-torse}' where slug='ombre-portee';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{patchwork,sleeve}' where slug='maison-vermillon';
update public.tatoueurs set filtres_technique='{tebori}', filtres_composition='{sleeve,piece-dos,bodysuit}' where slug='kosei-tattoo';
update public.tatoueurs set filtres_technique='{machine}', filtres_composition='{sleeve,patchwork,piece-dos}' where slug='studio-cameleon';
update public.tatoueurs set filtres_technique='{handpoke,machine}', filtres_composition='{petit-tatouage}' where slug='trait-nord';
