-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 42 : LA RECHERCHE CONNAÎT TOUS LES LIEUX
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 41
--  (yokofolio-nature-lieu-guest.sql).
--
--  LE DÉFAUT. Un artiste peut déclarer plusieurs lieux : un salon à
--  Lyon, une session guest à Paris, un déplacement à domicile autour
--  de Marseille. Sa FICHE les montre tous. LE MOTEUR N'EN CONNAISSAIT
--  QU'UN — celui inscrit sur la ligne `tatoueurs` — sauf pour la seule
--  recherche par rayon, qui savait déjà lire `points_tatoueur`.
--  Chercher « Paris » ne ramenait donc pas l'artiste qui y travaille.
--
--  ⚠️ ET UN DÉFAUT PLUS SOURNOIS, DÉCOUVERT EN ÉCRIVANT CELLE-CI.
--  La vue `modes_exercice_actifs` a été créée en nº 26 avec un
--  `select *`. PostgreSQL FIGE la liste des colonnes à la création :
--  la vue ne connaît donc NI `role` (nº 33), NI `rayon_km` (nº 40),
--  NI `nature_lieu` (nº 41). Le rayon de déplacement livré à la nº 40
--  était invisible pour tout ce qui lit cette vue — donc pour la
--  recherche. Elle est recréée ici avec une LISTE EXPLICITE, et le
--  commentaire dit pourquoi il ne faut plus jamais y écrire `*`.
--
--  CE QUE FAIT CE FICHIER
--  ----------------------
--   1. `yf_slug` — le slug d'un nom de ville, transposition exacte de
--      `slugifier` (src/lib/slug.ts). Les modes et les studios n'ont
--      pas de colonne `ville_slug` ; on la calcule.
--   2. `modes_exercice_actifs` recréée, colonnes nommées une à une.
--   3. `lieux_tatoueur` — UNE LIGNE PAR LIEU où une fiche exerce, avec
--      TOUT ce qui sert à chercher (ville, région, pays, point) et le
--      rayon du mode « à domicile ».
--   4. `points_tatoueur` redevient une simple projection de la
--      précédente : rien de ce qui l'utilisait ne change.
--   5. Les index qui rendent les nouveaux chemins praticables.
--   6. `rechercher_tatoueurs` refaite : les QUATRE recherches
--      géographiques (pays, région, ville, rayon) interrogent
--      désormais TOUS les lieux, et la carte affiche CELUI QUI
--      CORRESPOND.
--
--  CE QUI NE CHANGE PAS, ET C'EST VOULU
--  -------------------------------------
--   · UNE FICHE NE SORT JAMAIS DEUX FOIS. Toutes les conditions
--     s'écrivent en `exists` ou en `in (…)` : elles répondent oui ou
--     non, elles ne multiplient pas les lignes. Le lieu affiché est
--     choisi par une jointure latérale `limit 1`.
--   · LES SESSIONS GUEST PÉRIMÉES RESTENT DEHORS, par la même règle
--     qu'à l'écran (`fin_le` passée). Une session À VENIR, elle, reste
--     visible : l'annoncer d'avance est tout l'intérêt de l'annonce,
--     et la fiche affiche ses dates.
--   · LA PAGINATION, LE TRI PAR POPULARITÉ, LE MÉLANGE DU JOUR, LES
--     FILTRES PROFIL / MODE / TECHNIQUE / COMPOSITION / BESOINS /
--     RENDU : identiques à la nº 38, au caractère près.
--
--  SANS RISQUE : aucune donnée touchée, aucune colonne ajoutée ni
--  supprimée. Deux vues et une fonction refaites. Rejouable autant de
--  fois qu'on veut.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) LE SLUG D'UNE VILLE, EN BASE
-- ---------------------------------------------------------------------
--  Transposition de `slugifier` : minuscules, ligatures séparées,
--  accents retirés, tout le reste devient un tiret, pas de tiret aux
--  bouts. « L'Haÿ-les-Roses » → « l-hay-les-roses ».
--
--  ⚠️ IMMUTABLE, et ce n'est pas cosmétique : sans cela, impossible de
--  s'en servir dans un index.
create or replace function public.yf_slug(texte text)
returns text
language sql immutable parallel safe as $$
  select btrim(
    regexp_replace(
      lower(translate(
        replace(replace(coalesce(texte, ''), 'œ', 'oe'), 'æ', 'ae'),
        'àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôõöÒÓÔÕÖùúûüÙÚÛÜýÿÝ',
        'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY'
      )),
      '[^a-z0-9]+', '-', 'g'),
    '-');
$$;

comment on function public.yf_slug is
  'Le slug d''un nom (ville, enseigne) : transposition exacte de slugifier() dans src/lib/slug.ts. Sert à retrouver la ville d''une page /tatouage/style/ville sur un lieu qui n''a pas de colonne ville_slug.';

-- ---------------------------------------------------------------------
-- 2) LES MODES ENCORE ACTIFS — AVEC TOUTES LEURS COLONNES
-- ---------------------------------------------------------------------
--  ⚠️ NE JAMAIS RÉÉCRIRE `select *` ICI. PostgreSQL fige la liste des
--  colonnes au moment du `create view` : un `*` ne « repousse » pas
--  quand une migration ultérieure ajoute une colonne. C'est ce qui a
--  rendu `rayon_km` (nº 40) invisible pendant deux livraisons.
--  Toute colonne ajoutée à `modes_exercice` doit être ajoutée ICI.
--
--  ⚠️ ET LES TROIS NOUVELLES SE METTENT À LA FIN, dans cet ordre.
--  `create or replace view` sait AJOUTER une colonne au bout, il ne
--  sait ni en renommer ni en déplacer une : les dix-huit premières
--  gardent donc l'ordre exact de la nº 26. Les réordonner
--  obligerait à SUPPRIMER la vue — donc aussi `equipe_salon` et
--  `points_tatoueur` qui en dépendent, et les règles d'accès avec
--  elles. On ne détruit pas ce qu'on peut étendre.
create or replace view public.modes_exercice_actifs as
  select
    m.id,
    m.tatoueur_id,
    m.genre,
    m.salon_id,
    m.intitule,
    m.adresse,
    m.code_postal,
    m.ville,
    m.region,
    m.pays,
    m.code_pays,
    m.latitude,
    m.longitude,
    m.lieu_id,
    m.debut_le,
    m.fin_le,
    m.ordre,
    m.cree_le,
    --  AJOUTÉES ICI, ET SEULEMENT ICI — voir l'avertissement ci-dessus.
    m.role,          -- nº 33
    m.rayon_km,      -- nº 40
    m.nature_lieu    -- nº 41
  from public.modes_exercice m
  where m.fin_le is null or m.fin_le >= current_date;

comment on view public.modes_exercice_actifs is
  'Les modes d''exercice à afficher : tous, sauf les sessions guest dont la date de fin est passée. ⚠️ COLONNES NOMMÉES UNE À UNE, jamais « * » : PostgreSQL fige la liste à la création, et un « * » cacherait toute colonne ajoutée plus tard (c''est arrivé à rayon_km).';

-- ---------------------------------------------------------------------
-- 3) TOUS LES LIEUX D'UNE FICHE — LA VUE QUI PORTE LA CORRECTION
-- ---------------------------------------------------------------------
--  Une ligne par endroit où la fiche exerce, décrit ASSEZ pour
--  répondre aux quatre recherches : par pays, par région, par ville,
--  et autour d'un point.
--
--  `rang` dit d'où vient le lieu, et sert à départager quand plusieurs
--  conviennent : l'adresse de la fiche d'abord (0), puis ses studios
--  (1), puis ses modes (2). On montre d'abord ce qui est le plus
--  stable.
--
--  `rayon_km` NE VAUT QUE POUR « À DOMICILE » : c'est la distance que
--  l'artiste accepte de parcourir autour de ce point. Ailleurs il est
--  à zéro — un salon ne se déplace pas.
--  ⚠️ DEUX VUES, ET LA SÉPARATION EST UNE AFFAIRE DE PERFORMANCE, PAS
--  DE STYLE. `lieux_annexes_tatoueur` ne contient QUE ce qui n'est pas
--  déjà sur la ligne `tatoueurs` : les studios et les modes. Environ un
--  lieu pour dix fiches.
--
--  Pourquoi c'est indispensable : demander « cette fiche a-t-elle un
--  lieu en Île-de-France ? » sur la vue COMPLÈTE oblige la base à
--  refaire la question pour chacune des fiches, une par une — mesuré
--  ici à 97 fois plus de lectures qu'avant la migration. Alors qu'en
--  posant « le pays de la fiche convient, OU son identifiant est dans
--  cette petite liste », la petite liste est construite UNE FOIS,
--  gardée en mémoire, et la comparaison devient gratuite.
create or replace view public.lieux_annexes_tatoueur as
  --  LES ADRESSES DE L'ENSEIGNE (une par studio).
  select
    s.tatoueur_id,
    1               as rang,
    'studio'::text  as provenance,
    null::text      as genre,
    s.adresse,
    s.code_postal,
    s.ville,
    public.yf_slug(s.ville) as ville_slug,
    s.region,
    s.pays,
    s.code_pays,
    s.latitude,
    s.longitude,
    s.lieu_id,
    0               as rayon_km
  from public.studios s

  union all

  --  LES MODES ENCORE ACTIFS — salon, guest en cours, domicile, privé.
  select
    m.tatoueur_id,
    2,
    'mode',
    m.genre,
    m.adresse,
    m.code_postal,
    m.ville,
    public.yf_slug(m.ville),
    m.region,
    m.pays,
    m.code_pays,
    m.latitude,
    m.longitude,
    m.lieu_id,
    --  ⚠️ LE RAYON NE COMPTE QUE POUR « À DOMICILE ». Sur un mode en
    --  salon il serait absurde : le salon a une adresse, on y vient.
    case when m.genre = 'domicile' then coalesce(m.rayon_km, 0) else 0 end
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

comment on view public.lieux_annexes_tatoueur is
  'Les lieux d''une fiche AUTRES que son adresse principale : les studios de l''enseigne et ses modes d''activité en cours. Petite table — c''est ce qui permet à la recherche de la parcourir une seule fois par requête au lieu d''une fois par fiche.';

grant select on public.lieux_annexes_tatoueur to anon, authenticated;

--  ⚠️ LES TROIS BRANCHES SONT RÉÉCRITES ICI, ET NON PAS
--  « … union all select * from lieux_annexes_tatoueur ». La
--  répétition est laide ; elle est MESURÉE. Empilée sur une autre
--  vue, celle-ci empêchait PostgreSQL de faire descendre le filtre
--  « et seulement cette fiche-là » jusqu'aux tables : il assemblait
--  les six mille lignes AVANT de filtrer, vingt-quatre fois par page.
--  65 ms de perdues à chaque recherche. À plat, le filtre descend, et
--  chaque branche se lit par son index.
create or replace view public.lieux_tatoueur as
  --  L'ADRESSE PORTÉE PAR LA FICHE ELLE-MÊME.
  select
    t.id            as tatoueur_id,
    0               as rang,
    'fiche'::text   as provenance,
    null::text      as genre,
    t.adresse,
    t.code_postal,
    t.ville_nom     as ville,
    t.ville_slug,
    t.region,
    t.pays,
    t.code_pays,
    t.latitude,
    t.longitude,
    t.lieu_id,
    0               as rayon_km
  from public.tatoueurs t

  union all

  select
    s.tatoueur_id, 1, 'studio', null,
    s.adresse, s.code_postal, s.ville, public.yf_slug(s.ville),
    s.region, s.pays, s.code_pays, s.latitude, s.longitude, s.lieu_id, 0
  from public.studios s

  union all

  select
    m.tatoueur_id, 2, 'mode', m.genre,
    m.adresse, m.code_postal, m.ville, public.yf_slug(m.ville),
    m.region, m.pays, m.code_pays, m.latitude, m.longitude, m.lieu_id,
    case when m.genre = 'domicile' then coalesce(m.rayon_km, 0) else 0 end
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

comment on view public.lieux_tatoueur is
  'TOUS les endroits où une fiche exerce — son adresse, les studios de l''enseigne, ses modes d''activité en cours — avec de quoi les chercher (ville, région, pays, point) et le rayon de déplacement du mode « à domicile ». Une fiche a autant de lignes que de lieux ; la recherche répond « oui » dès qu''UN SEUL convient.';

grant select on public.lieux_tatoueur to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) LES POINTS — DÉSORMAIS UNE SIMPLE PROJECTION
-- ---------------------------------------------------------------------
--  ⚠️ CES DEUX VUES-CI SONT VOLONTAIREMENT MAIGRES, et ce n'est pas
--  un détail de goût : c'est MESURÉ. Écrire la distance sur la vue
--  riche `lieux_tatoueur` — qui traîne dix colonnes de texte et un
--  calcul de slug — coûtait 79 ms de plus PAR RECHERCHE, y compris
--  sur la page d'accueil qui ne cherche aucun lieu. La distance est
--  demandée pour CHAQUE fiche retenue : elle doit lire trois nombres,
--  pas une fiche d'identité.
--
--  `zones_tatoueur` porte le point ET le rayon de déplacement, parce
--  que les deux vont toujours ensemble : un lieu « à domicile » n'est
--  pas un point, c'est un disque.
create or replace view public.zones_tatoueur as
  select t.id as tatoueur_id, t.latitude, t.longitude, 0 as rayon_km
    from public.tatoueurs t
  union all
  select s.tatoueur_id, s.latitude, s.longitude, 0
    from public.studios s
  union all
  select m.tatoueur_id, m.latitude, m.longitude,
         case when m.genre = 'domicile' then coalesce(m.rayon_km, 0) else 0 end
    from public.modes_exercice_actifs m
   where m.latitude is not null and m.longitude is not null;

comment on view public.zones_tatoueur is
  'Le point de chaque lieu d''une fiche, avec le rayon de déplacement quand il y en a un. Volontairement maigre : c''est la vue que la recherche interroge pour chaque fiche retenue.';

grant select on public.zones_tatoueur to anon, authenticated;

--  Gardée telle quelle pour ne rien casser de ce qui l'utilisait.
create or replace view public.points_tatoueur as
  select z.tatoueur_id, z.latitude, z.longitude
    from public.zones_tatoueur z;

comment on view public.points_tatoueur is
  'Les coordonnées de tous les lieux d''une fiche — projection de zones_tatoueur, gardée pour ce qui l''utilisait déjà.';

grant select on public.points_tatoueur to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) LES INDEX DES NOUVEAUX CHEMINS
-- ---------------------------------------------------------------------
--  Chercher par ville, par région ou par pays part maintenant des
--  LIEUX. Sans index, chaque recherche relirait les trois tables en
--  entier.
create index if not exists idx_studios_commune
  on public.studios (public.yf_commune(ville));
create index if not exists idx_studios_region
  on public.studios (public.yf_normaliser(region));
create index if not exists idx_studios_pays
  on public.studios (upper(code_pays));
create index if not exists idx_studios_ville_slug
  on public.studios (public.yf_slug(ville));

create index if not exists idx_modes_commune
  on public.modes_exercice (public.yf_commune(ville));
create index if not exists idx_modes_region
  on public.modes_exercice (public.yf_normaliser(region));
create index if not exists idx_modes_pays
  on public.modes_exercice (upper(code_pays));
create index if not exists idx_modes_ville_slug
  on public.modes_exercice (public.yf_slug(ville));

--  ⚠️ L'INDEX QUI SAUVE LE RAYON « À DOMICILE ». Un lieu qui porte un
--  rayon ne peut pas être écarté par le cadre en degrés de la
--  recherche (son cercle déborde le cadre). Il faut donc les relire
--  tous — mais ils sont RARES, et cet index partiel ne contient
--  qu'eux.
create index if not exists idx_modes_avec_rayon
  on public.modes_exercice (latitude, longitude)
  where rayon_km is not null and rayon_km > 0;

-- ---------------------------------------------------------------------
-- 6) LA RECHERCHE
-- ---------------------------------------------------------------------
--  ⚠️ ON SUPPRIME D'ABORD, ON RECRÉE ENSUITE. Même raison qu'à la
--  nº 38 : « create or replace » refuserait tout changement de
--  signature et laisserait deux fonctions homonymes, entre lesquelles
--  PostgREST ne saurait pas choisir.
do $migration$
declare
  ancienne record;
begin
  for ancienne in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'rechercher_tatoueurs'
  loop
    execute 'drop function ' || ancienne.signature;
  end loop;
end
$migration$;

create function public.rechercher_tatoueurs(
  p_style text default null,
  p_niveau text default null,               -- adresse | ville | region | pays
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_rayon_km double precision default 0,
  p_ville_nom text default null,
  p_ville_slug text default null,
  p_code_pays text default null,
  p_region text default null,
  p_types text[] default null,
  p_modes text[] default null,
  p_technique text[] default null,
  p_composition text[] default null,
  p_besoins text[] default null,
  p_rendus text[] default null,
  p_comptes_masques text[] default '{}'::text[],
  p_photo_rendu text default null,
  p_limite integer default 24,
  p_decalage integer default 0,
  p_photos_max integer default 1,
  p_prioriser_clics boolean default false,
  p_jour integer default 0
)
returns table (
  fiche jsonb,
  distance_km double precision,
  total_resultats bigint
)
language sql
stable
parallel safe
set search_path = public
as $$
  select
    jsonb_build_object(
      'id', s.id,
      'nom', s.nom,
      'slug', s.slug,
      --  ⚠️ LE LIEU AFFICHÉ EST CELUI QUI RÉPOND À LA RECHERCHE, pas
      --  systématiquement l'adresse de la fiche. Chercher « Paris »
      --  et lire « Lyon » sur la carte serait incompréhensible.
      --  `lc` (plus bas) choisit ce lieu ; en son absence — aucune
      --  recherche géographique — on retombe sur la fiche.
      'ville_nom', coalesce(lc.ville, s.ville_nom),
      'ville_slug', coalesce(lc.ville_slug, s.ville_slug),
      'latitude', coalesce(lc.latitude, s.latitude),
      'longitude', coalesce(lc.longitude, s.longitude),
      'adresse', coalesce(lc.adresse, s.adresse),
      'code_postal', coalesce(lc.code_postal, s.code_postal),
      'region', coalesce(lc.region, s.region),
      'pays', coalesce(lc.pays, s.pays),
      'code_pays', coalesce(lc.code_pays, s.code_pays),
      'lieu_id', coalesce(lc.lieu_id, s.lieu_id),
      'styles', to_jsonb(s.styles),
      'lien_instagram', s.lien_instagram,
      'lien_tiktok', s.lien_tiktok,
      'lien_youtube', s.lien_youtube,
      'site_web', s.site_web,
      'bio', s.bio,
      'type_fiche', s.type_fiche,
      'mode_exercice', s.mode_exercice,
      'rayon_zone_km', s.rayon_zone_km,
      'villes', s.villes,
      'photo_principale', s.photo_principale,
      'photo_profil', s.photo_profil,
      'photos', to_jsonb(s.photos),
      'photos_styles', s.photos_styles,
      'filtres_technique', to_jsonb(s.filtres_technique),
      'filtres_composition', to_jsonb(s.filtres_composition),
      'filtres_besoins', to_jsonb(s.filtres_besoins),
      'ancien_slug', s.ancien_slug,
      'publie', s.publie,
      'galerie', coalesce(g.photos, '[]'::jsonb)
    ) as fiche,
    s.km as distance_km,
    s.total as total_resultats
  from (
    select
      t.*,
      count(*) over () as total,
      d.km,
      row_number() over (
        order by
          case when p_prioriser_clics
               then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
               end desc nulls last,
          case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
               then d.km end asc nulls last,
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
    --  LA DISTANCE DE TRI, UNE SEULE FOIS.
    --  ⚠️ ELLE DÉFALQUE LE RAYON DU MODE « À DOMICILE ». Un artiste
    --  qui vient chez vous est « à zéro kilomètre » de vous : le
    --  classer derrière un salon plus proche mais où il faut se
    --  rendre serait un contresens.
    left join lateral (
      select min(greatest(
               public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                 - z.rayon_km, 0)) as km
        from public.zones_tatoueur z
       where p_latitude is not null and p_longitude is not null
         and z.tatoueur_id = t.id
    ) d on true
    where t.publie
      and t.supprime_le is null
      and (
        coalesce(cardinality(p_comptes_masques), 0) = 0
        or t.user_id is null
        or t.user_id::text <> all (p_comptes_masques)
      )
      and (p_style is null or t.styles @> array[p_style])
      --  LA VILLE D'UNE PAGE DE RÉFÉRENCEMENT — sur N'IMPORTE LEQUEL
      --  de ses lieux. Un artiste qui fait un guest à Bordeaux a sa
      --  place sur /tatouage/blackwork/bordeaux.
      and (
        p_ville_slug is null
        or t.ville_slug = p_ville_slug
        or t.id in (
          select l.tatoueur_id from public.lieux_annexes_tatoueur l
           where l.ville_slug = p_ville_slug
        )
      )
      and (
        p_types is null
        or (case
              when coalesce(t.type_fiche, 'salon') = 'artiste' then 'artiste'
              when coalesce(t.etablissement, 'salon') = 'prive' then 'studio-prive'
              else 'salon'
            end) = any (p_types)
      )
      and (
        p_modes is null
        or coalesce(t.type_fiche, 'salon') <> 'artiste'
        or not exists (
          select 1 from public.modes_exercice_actifs m
           where m.tatoueur_id = t.id
        )
        or exists (
          select 1 from public.modes_exercice_actifs m
           where m.tatoueur_id = t.id
             and m.genre = any (p_modes)
        )
      )
      and (
        p_technique is null
        or coalesce(cardinality(t.filtres_technique), 0) = 0
        or t.filtres_technique && p_technique
      )
      and (
        p_composition is null
        or coalesce(cardinality(t.filtres_composition), 0) = 0
        or t.filtres_composition && p_composition
      )
      and (
        p_besoins is null
        or t.filtres_besoins && p_besoins
      )
      and (
        p_rendus is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.rendu = any (p_rendus)
        )
      )
      --  ============================================================
      --  LE LIEU — ET C'EST TOUT LE CORRECTIF DE CETTE MIGRATION.
      --  Les quatre branches interrogent `lieux_tatoueur`, donc TOUS
      --  les lieux de la fiche, et non plus la seule ligne
      --  `tatoueurs`. Chacune reste un `exists` / `in` : une fiche
      --  répond oui ou non, elle ne sort jamais en double.
      --  ============================================================
      and (
        case coalesce(p_niveau, 'ville')
          --  TOUT LE PAYS.
          --  ⚠️ LA FORME EST TOUJOURS LA MÊME, ET ELLE COMPTE :
          --  « la fiche elle-même convient, OU son identifiant est
          --  dans la petite liste des lieux annexes ». Le premier test
          --  est gratuit (la ligne est déjà lue) ; le second se réduit
          --  à une liste construite une seule fois pour toute la
          --  requête. Écrite en `exists` corrélé sur la vue complète,
          --  la même question coûtait 97 fois plus de lectures.
          when 'pays' then
            p_code_pays is null
            or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
            or t.id in (
              select l.tatoueur_id from public.lieux_annexes_tatoueur l
               where upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
            )
          --  TOUTE LA RÉGION (dans ce pays, quand on le connaît).
          --  ⚠️ LE PAYS SE VÉRIFIE SUR LE MÊME LIEU, pas sur la fiche :
          --  sinon un artiste français en guest en Catalogne
          --  ressortirait pour « Catalogne, France ».
          when 'region' then
            p_region is null
            or (
              public.yf_normaliser(t.region) = public.yf_normaliser(p_region)
              and (
                p_code_pays is null
                or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
              )
            )
            or t.id in (
              select l.tatoueur_id from public.lieux_annexes_tatoueur l
               where public.yf_normaliser(l.region) = public.yf_normaliser(p_region)
                 and (
                   p_code_pays is null
                   or upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
                 )
            )
          --  AUTOUR D'UN POINT.
          else
            p_latitude is null or p_longitude is null
            or case
              --  AVEC RAYON. Deux chemins, et la coupure n'est pas
              --  arbitraire :
              --
              --  · LES LIEUX FIXES (rayon 0) — l'immense majorité.
              --    Le cadre en degrés les écarte par index, sans
              --    calculer une seule distance. C'est la stratégie
              --    de la nº 32, conservée mot pour mot.
              --
              --  · LES LIEUX AVEC RAYON — les modes « à domicile ».
              --    Leur cercle DÉBORDE le cadre : un artiste qui
              --    couvre 200 km autour de Lyon doit répondre à une
              --    recherche faite à Vienne, alors que son point est
              --    hors du cadre de la recherche. On ne peut donc pas
              --    les cadrer — on les relit tous. Ils sont rares, et
              --    `idx_modes_avec_rayon` ne contient qu'eux.
              --
              --  LES DEUX RAYONS S'ADDITIONNENT : « je cherche à
              --  40 km » + « je me déplace à 50 km » se rencontrent
              --  jusqu'à 90 km d'écart entre les deux points.
              when p_rayon_km > 0 then t.id in (
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km = 0
                   and z.latitude between p_latitude - (p_rayon_km / 111.045)
                                      and p_latitude + (p_rayon_km / 111.045)
                   and z.longitude between p_longitude - (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                                       and p_longitude + (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude) <= p_rayon_km
                union all
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km > 0
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                       <= p_rayon_km + z.rayon_km
              )
              --  SANS RAYON : LA COMMUNE CHOISIE, arrondissements
              --  compris — sur n'importe lequel de ses lieux.
              --  ⚠️ ET LES ZONES DE DÉPLACEMENT QUI LA COUVRENT : sans
              --  cela, l'artiste qui se déplace dans un rayon de
              --  50 km autour de Lyon ne sortirait pas pour une
              --  recherche « Vienne » sans rayon, alors qu'il s'y
              --  rend. Le point cherché doit tenir dans son cercle.
              when p_ville_nom is not null then
                public.yf_commune(t.ville_nom) = public.yf_commune(p_ville_nom)
                or t.id in (
                  select l.tatoueur_id from public.lieux_annexes_tatoueur l
                   where public.yf_commune(l.ville) = public.yf_commune(p_ville_nom)
                  union all
                  select z.tatoueur_id from public.zones_tatoueur z
                   where z.rayon_km > 0
                     and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                         <= z.rayon_km
                )
              --  SANS NOM DE VILLE (cas rare) : un très petit rayon.
              else t.id in (
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km = 0
                   and z.latitude between p_latitude - 0.03 and p_latitude + 0.03
                   and z.longitude between p_longitude - 0.05 and p_longitude + 0.05
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude) <= 2
                union all
                select z.tatoueur_id from public.zones_tatoueur z
                 where z.rayon_km > 0
                   and public.yf_distance_km(p_latitude, p_longitude, z.latitude, z.longitude)
                       <= 2 + z.rayon_km
              )
            end
        end
      )
    order by
      case when p_prioriser_clics
           then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
           end desc nulls last,
      case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
           then d.km end asc nulls last,
      md5(t.id::text || '-' || p_jour::text)
    limit greatest(coalesce(p_limite, 24), 0)
    offset greatest(coalesce(p_decalage, 0), 0)
  ) s

  --  ------------------------------------------------------------
  --  LE LIEU QUI RÉPOND À LA RECHERCHE — pour la carte.
  --  ⚠️ POSÉE ICI, DEHORS, et pas dans la sous-requête : à cet
  --  endroit la page est déjà coupée à 24 lignes. Le choix du lieu
  --  coûte donc 24 petites lectures, jamais une par fiche retenue.
  --  ------------------------------------------------------------
  left join lateral (
    select l.*
      from public.lieux_tatoueur l
      --  ⚠️ LE GARDE-FOU D'ABORD : sans recherche géographique (la
      --  page d'accueil), il n'y a aucun lieu à désigner. La condition
      --  est constante, la base l'évalue une fois et saute la
      --  jointure entière.
     where (p_latitude is not null or p_code_pays is not null
            or p_region is not null)
       and l.tatoueur_id = s.id
       --  Seuls les lieux qui CORRESPONDENT VRAIMENT sont candidats —
       --  la même condition que le filtre, branche par branche.
       and case coalesce(p_niveau, 'ville')
             when 'pays' then
               p_code_pays is not null
               and upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
             when 'region' then
               p_region is not null
               and public.yf_normaliser(l.region) = public.yf_normaliser(p_region)
               and (p_code_pays is null
                    or upper(coalesce(l.code_pays, '')) = upper(p_code_pays))
             else
               p_latitude is not null and p_longitude is not null
               and l.latitude is not null and l.longitude is not null
               and public.yf_distance_km(p_latitude, p_longitude, l.latitude, l.longitude)
                   <= greatest(p_rayon_km, 2) + l.rayon_km
           end
     order by
       --  LE PLUS PROCHE D'ABORD quand on cherche autour d'un point ;
       --  sinon le plus stable (l'adresse de la fiche avant ses
       --  studios, ses studios avant ses modes).
       case when p_latitude is not null
            then greatest(public.yf_distance_km(p_latitude, p_longitude, l.latitude, l.longitude)
                          - l.rayon_km, 0)
            end asc nulls last,
       l.rang
     limit 1
  ) lc on true

  left join lateral (
    select jsonb_agg(
             jsonb_build_object(
               'id', p.id, 'style', p.style, 'zone', p.zone,
               'rendu', p.rendu, 'url', p.url, 'miniature', p.miniature,
               'ordre', p.ordre
             ) order by p.ordre
           ) as photos
      from (
        select p2.*
          from public.photos_tatoueur p2
         where p2.tatoueur_id = s.id
         order by
           case
             when (p_style is null or p2.style = p_style)
              and (p_photo_rendu is null or p2.rendu = p_photo_rendu) then 0
             when p_style is not null and p2.style = p_style then 1
             when p_photo_rendu is not null and p2.rendu = p_photo_rendu then 2
             else 3
           end,
           p2.ordre
         limit greatest(coalesce(p_photos_max, 1), 1)
      ) p
  ) g on true
  order by
    case when p_prioriser_clics then 0
         else -coalesce((select c.total from public.clics_tatoueurs c where c.slug = s.slug), 0)
    end,
    s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Depuis la nº 42 elle interroge TOUS les lieux d''une fiche (adresse, studios, modes en cours), jamais le seul point historique, et la carte affiche le lieu qui répond à la recherche.';

grant execute on function public.rechercher_tatoueurs to anon, authenticated;

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Fiches publiées', (
    select count(*)::text from public.tatoueurs
     where publie and supprime_le is null)),
  (2, 'Lieux connus de la recherche', (
    select count(*)::text from public.lieux_tatoueur)),
  (3, '  dont adresses de fiche', (
    select count(*)::text from public.lieux_tatoueur where provenance = 'fiche')),
  (4, '  dont studios d''enseigne', (
    select count(*)::text from public.lieux_tatoueur where provenance = 'studio')),
  (5, '  dont modes d''activité en cours', (
    select count(*)::text from public.lieux_tatoueur where provenance = 'mode')),
  (6, 'Fiches ayant plus d''un lieu', (
    select count(*)::text from (
      select tatoueur_id from public.lieux_tatoueur
       group by tatoueur_id having count(*) > 1) as multi)),
  (7, 'Modes « à domicile » avec un rayon', (
    select count(*)::text from public.lieux_tatoueur where rayon_km > 0)),
  (8, 'rayon_km visible dans modes_exercice_actifs', (
    select case when exists (
      select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'modes_exercice_actifs'
         and column_name = 'rayon_km') then 'oui' else 'NON' end)),
  (9, 'Villes distinctes atteignables', (
    select count(distinct public.yf_commune(ville))::text
      from public.lieux_tatoueur where ville is not null))
) as etat(ordre, mesure, valeur)
order by ordre;
