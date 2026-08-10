-- =====================================================================
--  MIGRATION Nº 57 — LE CATALOGUE COMPLÉTÉ, STYLE PAR STYLE
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Se relance sans risque : elle n'écrit que ce qui manque.
--
--  CE QU'ELLE FAIT, ET POURQUOI
--  -----------------------------
--  La nº 31 a créé le catalogue des photos (`photos_tatoueur`) : une
--  ligne par photo, avec son style, son rendu et — depuis la nº 49 —
--  sa nature. Tout ce que le site sait faire de fin repose dessus :
--  les cœurs sur les images, la vue photothèque, le croisement
--  « Flashs · Réalisme », et la photo que chaque carte montre.
--
--  La nº 55 a rattrapé les fiches ENTIÈREMENT vides — celles dont les
--  images vivaient encore dans `photo_principale` / `photos_styles`.
--  Mais elle s'arrêtait là : sa condition (`not exists … p.tatoueur_id
--  = t.id`) ne regarde QUE les fiches sans AUCUNE photo cataloguée.
--
--  IL RESTAIT DONC UN TROU, et c'est le plus fréquent : une fiche qui
--  a UNE photo taguée dans un style et qui en DÉCLARE d'autres. Ses
--  autres styles n'ont aucune ligne — pas de cœur possible dessus, pas
--  de vignette propre, et (avant la nº 56) aucune réponse à une
--  recherche sur ces styles-là.
--
--  Cette migration comble le trou À LA MAILLE DU STYLE : pour CHAQUE
--  style déclaré qui n'a encore aucune photo, on catalogue l'image
--  dont on dispose — celle du style si elle existe
--  (`photos_styles->>style`), sinon la photo principale de la fiche.
--  C'est exactement la vignette que la carte montre déjà aujourd'hui :
--  rien de neuf n'apparaît à l'écran, mais tout devient cliquable et
--  cherchable.
--
--  ⚠️ ON N'INVENTE NI RENDU NI NATURE. `nature` prend son défaut
--  (« tatouage » — une image déposée sans précision est un tatouage,
--  voir la nº 49) et `rendu` reçoit « noir et gris », comme à la
--  nº 55 : la colonne est obligatoire depuis la nº 48 et c'est le
--  choix qui se trompe le moins. Un tatoueur qui reprend son
--  portfolio écrase ces valeurs en deux gestes.
--
--  ⚠️ ELLE NE TOUCHE JAMAIS UNE PHOTO EXISTANTE. Aucun `update`,
--  aucun `delete` : uniquement des lignes pour les styles qui n'en ont
--  pas. Un portfolio soigné par son tatoueur reste tel quel.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) L'ÉTAT AVANT — ce qui manque, et à qui
-- ---------------------------------------------------------------------
do $avant$
declare
  fiches_trouees integer;
  styles_trous integer;
begin
  select count(distinct t.id), count(*)
    into fiches_trouees, styles_trous
    from public.tatoueurs t
    cross join lateral unnest(t.styles) as s(style)
   where t.supprime_le is null
     and not exists (
           select 1 from public.photos_tatoueur p
            where p.tatoueur_id = t.id and p.style = s.style
         );
  raise notice 'AVANT : % style(s) déclaré(s) sans photo, sur % fiche(s).',
    styles_trous, fiches_trouees;
end
$avant$;

-- ---------------------------------------------------------------------
-- 2) LE CATALOGUE COMPLÉTÉ
-- ---------------------------------------------------------------------
--  `ordre` : on prolonge la numérotation existante de la fiche plutôt
--  que de repartir de zéro — sinon deux photos partageraient le même
--  rang, et l'ordre d'affichage deviendrait celui du hasard.
insert into public.photos_tatoueur (tatoueur_id, style, url, ordre, rendu)
select t.id,
       s.style,
       coalesce(
         nullif(t.photos_styles ->> s.style, ''),
         nullif(t.photo_principale, '')
       ),
       coalesce(
         (select max(p.ordre) from public.photos_tatoueur p
           where p.tatoueur_id = t.id),
         -1
       ) + s.rang,
       'black_and_grey'
  from public.tatoueurs t
  cross join lateral unnest(t.styles) with ordinality as s(style, rang)
 where t.supprime_le is null
   --  LE STYLE n'a AUCUNE photo (la fiche, elle, peut en avoir).
   and not exists (
         select 1 from public.photos_tatoueur p
          where p.tatoueur_id = t.id and p.style = s.style
       )
   --  ET on a bien une image à cataloguer.
   and coalesce(
         nullif(t.photos_styles ->> s.style, ''),
         nullif(t.photo_principale, '')
       ) is not null;

-- ---------------------------------------------------------------------
-- 3) L'ÉTAT APRÈS — ce qui reste, et pourquoi
-- ---------------------------------------------------------------------
do $apres$
declare
  catalogues integer;
  restants integer;
begin
  select count(*) into catalogues from public.photos_tatoueur;
  select count(*) into restants
    from public.tatoueurs t
    cross join lateral unnest(t.styles) as s(style)
   where t.supprime_le is null
     and not exists (
           select 1 from public.photos_tatoueur p
            where p.tatoueur_id = t.id and p.style = s.style
         );
  raise notice 'APRÈS : % photo(s) cataloguée(s) en tout.', catalogues;
  if restants > 0 then
    raise notice '% style(s) restent sans photo : ces fiches n''ont AUCUNE image (ni photo de style, ni photo principale). Il n''y a rien à cataloguer pour elles — leur tatoueur doit déposer une image.', restants;
  else
    raise notice 'Chaque style déclaré a désormais au moins une photo.';
  end if;
end
$apres$;

-- ---------------------------------------------------------------------
--  VÉRIFICATION (facultatif) — n'écrit rien.
-- ---------------------------------------------------------------------
--  Le détail par fiche, s'il reste des trous :
-- select t.nom, s.style
--   from public.tatoueurs t
--   cross join lateral unnest(t.styles) as s(style)
--  where t.supprime_le is null
--    and not exists (select 1 from public.photos_tatoueur p
--                     where p.tatoueur_id = t.id and p.style = s.style)
--  order by t.nom, s.style;
--
--  ET POUR CORRIGER UN RENDU AU CAS PAR CAS (les lignes créées ici
--  portent « noir et gris ») :
-- update public.photos_tatoueur set rendu = 'color'
--  where tatoueur_id = (select id from public.tatoueurs where slug = 'le-slug')
--    and style = 'aquarelle';
