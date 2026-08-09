-- ============================================================
--  YOKOFOLIO — MIGRATION Nº 32 : LA RECHERCHE PASSE EN BASE
-- ============================================================
--  À exécuter UNE FOIS dans l'éditeur SQL de Supabase.
--  Repasser ce fichier ne casse rien (tout est « if not exists » ou
--  « create or replace ») : aucune donnée n'est touchée, aucune
--  colonne ajoutée, aucune ligne modifiée. On ne pose que des OUTILS
--  DE LECTURE : une fonction de distance, une vue des points, des
--  index, et LA fonction de recherche.
--
--  LE PROBLÈME QU'ELLE RÈGLE
--  --------------------------
--  Jusqu'ici, afficher 24 cartes voulait dire :
--    1. charger TOUTES les fiches publiées ;
--    2. charger TOUTES leurs photos (20 par fiche) ;
--    3. filtrer, trier et couper… en JavaScript, après coup.
--  À 500 tatoueurs, c'est 10 835 lignes et 3,8 Mo lus pour en montrer
--  24. Le coût grandit avec le nombre d'inscrits : plus le site
--  marche, plus il rame. C'est exactement ce qu'il ne faut pas.
--
--  APRÈS : UNE SEULE requête rend les 24 fiches demandées, leur photo
--  de carte, et le nombre total de résultats. Le filtre, le calcul de
--  distance, le tri et la limite se font là où sont les données.
--
--  ⚠️ LE SITE MARCHE AVEC OU SANS CE FICHIER. Tant qu'il n'est pas
--  passé, la fonction n'existe pas : le code s'en aperçoit et retombe
--  sur l'ancien chemin, sans rien casser (voir src/lib/tatoueurs.ts,
--  `rechercheEnBase`). Rien ne se met à mal fonctionner un dimanche
--  soir parce qu'une migration a été oubliée.
-- ============================================================


-- ------------------------------------------------------------
-- 1) LA DISTANCE — la MÊME formule qu'en JavaScript
-- ------------------------------------------------------------
--  Haversine, rayon terrestre 6371 km : mot pour mot src/lib/geo.ts.
--  Écrite ici pour que le tri par proximité se fasse en base, sans
--  rapatrier une seule fiche pour la mesurer.
create or replace function public.yf_distance_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

comment on function public.yf_distance_km is
  'Distance en kilomètres entre deux points GPS (Haversine) — la copie exacte de distanceKm dans src/lib/geo.ts.';


-- ------------------------------------------------------------
-- 2) COMPARER DEUX NOMS DE LIEU — casse, accents et ponctuation mis
--    de côté
-- ------------------------------------------------------------
--  Le géocodeur ne rend pas toujours exactement ce qu'une fiche a
--  enregistré : « Île-de-France » et « ile de france » sont le même
--  endroit. C'est la fonction `memeNom` du code, transposée.
--
--  ⚠️ PAS d'extension `unaccent` : elle n'est pas « immutable » (elle
--  dépend d'un dictionnaire), donc inutilisable dans un index. Un
--  simple `translate` sur les accents européens est aussi juste ici,
--  et il s'indexe.
create or replace function public.yf_normaliser(texte text)
returns text
language sql immutable parallel safe as $$
  select btrim(regexp_replace(
    lower(translate(
      coalesce(texte, ''),
      'àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôõöÒÓÔÕÖùúûüÙÚÛÜýÿÝ',
      'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY'
    )),
    '[^a-z0-9]+', ' ', 'g'));
$$;

--  LA COMMUNE, arrondissement mis de côté : « Paris 11e » et « Paris »
--  sont la même ville, « Lyon 1er » et « Lyon » aussi. C'est
--  `memeCommune` du code.
create or replace function public.yf_commune(texte text)
returns text
language sql immutable parallel safe as $$
  select public.yf_normaliser(
    regexp_replace(coalesce(texte, ''), '\s+\d+\s*(er|e|ème|eme)?\s*$', '', 'i')
  );
$$;


-- ------------------------------------------------------------
-- 3) LES POINTS D'UNE FICHE — elle en a autant que d'adresses
-- ------------------------------------------------------------
--  L'enseigne qui tient Lyon ET Paris doit sortir dans les deux
--  recherches ; l'artiste en guest à Paris en septembre aussi. La
--  recherche retient LE PLUS PROCHE de ces points — jamais le seul
--  point historique de la fiche. C'est `pointsDeLaFiche` du code.
--
--  Les sessions guest TERMINÉES n'en font pas partie : la vue
--  `modes_exercice_actifs` (migration nº 26) les écarte déjà.
create or replace view public.points_tatoueur as
  select t.id as tatoueur_id, t.latitude, t.longitude
    from public.tatoueurs t
  union all
  select m.tatoueur_id, m.latitude, m.longitude
    from public.modes_exercice_actifs m
   where m.latitude is not null and m.longitude is not null
  union all
  select s.tatoueur_id, s.latitude, s.longitude
    from public.studios s;

comment on view public.points_tatoueur is
  'Tous les points où une fiche exerce : son adresse, ses sessions guest en cours, et les studios de l''enseigne. Sert au tri et au filtre par distance.';

grant select on public.points_tatoueur to anon, authenticated;


-- ------------------------------------------------------------
-- 4) LES INDEX — pour que la base trouve sans tout relire
-- ------------------------------------------------------------
--  Ceux de `tatoueurs` (styles, ville, pays, position…) existent
--  depuis les migrations précédentes. On complète ici ce que la
--  nouvelle recherche interroge vraiment.

--  L'ENTRÉE DE TOUTE RECHERCHE : les fiches publiées et vivantes.
--  Index PARTIEL : il ne contient QUE ces lignes-là, donc il est
--  petit et toujours en mémoire.
create index if not exists idx_tatoueurs_visibles
  on public.tatoueurs (id)
  where publie and supprime_le is null;

--  LE NOM DE COMMUNE NORMALISÉ — la recherche « la ville seule »
--  (rayon à zéro) compare ces valeurs-là.
create index if not exists idx_tatoueurs_commune
  on public.tatoueurs (public.yf_commune(ville_nom));

--  LA RÉGION NORMALISÉE, même raison.
create index if not exists idx_tatoueurs_region_normalisee
  on public.tatoueurs (public.yf_normaliser(region));

--  LE CODE PAYS, comparé sans casse.
create index if not exists idx_tatoueurs_code_pays_haut
  on public.tatoueurs (upper(code_pays));

--  LES INTERRUPTEURS déclarés par la fiche (technique, composition) —
--  `besoins` a déjà le sien (migration nº 31).
create index if not exists idx_tatoueurs_technique
  on public.tatoueurs using gin (filtres_technique);
create index if not exists idx_tatoueurs_composition
  on public.tatoueurs using gin (filtres_composition);

--  LE FILTRE PAR RENDU passe par les photos : il demande « cette
--  fiche a-t-elle au moins une photo en couleur ? ».
create index if not exists idx_photos_fiche_rendu
  on public.photos_tatoueur (tatoueur_id, rendu);

--  LE CLASSEMENT PAR POPULARITÉ lit les clics par slug.
create index if not exists idx_clics_slug
  on public.clics_fiches (tatoueur_slug);


-- ------------------------------------------------------------
-- 5) LA RECHERCHE
-- ------------------------------------------------------------
--  UNE fonction, appelée par TOUT ce qui affiche une mosaïque :
--  l'accueil, l'API du moteur, les pages style + ville.
--
--  CE QU'ELLE REPRODUIT, à la virgule près (voir `filtrer` dans
--  src/lib/tatoueurs.ts) :
--   · publiée, pas en cours de suppression, pas à un administrateur ;
--   · le style demandé ;
--   · les interrupteurs, par EXCLUSION : dans un groupe où des
--     interrupteurs sont éteints, la fiche reste visible si elle a
--     déclaré au moins une pratique encore allumée — ou si elle n'a
--     RIEN déclaré dans ce groupe (un silence n'écarte personne) ;
--   · le lieu, selon SA PRÉCISION : pays / région / autour d'un point
--     avec rayon / la commune seule quand le rayon est à zéro ;
--   · l'ordre : le plus proche d'abord autour d'un point, sinon le
--     mélange DU JOUR ; puis la page est reclassée par popularité,
--     exactement comme aujourd'hui (le classement réordonne la page,
--     il ne choisit pas qui y figure).
--
--  ⚠️ LE MÉLANGE DU JOUR CHANGE DE FORMULE. Il se faisait sur le RANG
--  d'une fiche dans un tableau JavaScript — impossible à reproduire
--  ici, et de toute façon dépourvu de sens dès qu'on ne charge plus
--  tout. Il se fait désormais sur l'IDENTIFIANT de la fiche, mélangé
--  au numéro du jour : le comportement est le même (un tirage stable
--  qui se renouvelle chaque matin), le tirage lui-même diffère.
--
--  ELLE REND, pour chaque fiche : son contenu public en JSON, sa
--  distance au point cherché, et LE NOMBRE TOTAL de résultats — c'est
--  lui qui permet d'afficher « voir plus » sans seconde requête.
create or replace function public.rechercher_tatoueurs(
  --  LE STYLE, ou null pour tous.
  p_style text default null,
  --  LE LIEU : ses coordonnées, sa précision, et ce qui l'identifie.
  p_niveau text default null,               -- adresse | ville | region | pays
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_rayon_km double precision default 0,
  p_ville_nom text default null,
  --  LE SLUG DE LA VILLE d'une page « style + ville » : c'est lui qui
  --  fait la page /tatouage/blackwork/lyon-1er, quel que soit le pays.
  p_ville_slug text default null,
  p_code_pays text default null,
  p_region text default null,
  --  LES INTERRUPTEURS ENCORE ALLUMÉS, groupe par groupe.
  --  NULL = groupe intact, aucun filtrage.
  p_types text[] default null,              -- artiste | salon
  p_technique text[] default null,
  p_composition text[] default null,
  p_besoins text[] default null,
  p_rendus text[] default null,
  --  LES COMPTES DONT LES FICHES SONT MASQUÉES DU PUBLIC
  --  (administrateurs — voir src/lib/fiches-admin.ts).
  p_comptes_masques text[] default '{}'::text[],
  --  LE RENDU CHERCHÉ, quand il n'en reste qu'un : il décide QUELLE
  --  photo la carte montre.
  p_photo_rendu text default null,
  --  LA PAGE demandée.
  p_limite integer default 24,
  p_decalage integer default 0,
  --  COMBIEN DE PHOTOS par fiche : UNE pour une carte. La fiche
  --  complète, elle, ne passe pas par ici.
  p_photos_max integer default 1,
  --  CLASSER PAR POPULARITÉ AVANT DE COUPER : c'est ce que font les
  --  pages « style + ville » (elles montrent les plus consultés de la
  --  ville). L'accueil, lui, tire au hasard du jour puis reclasse la
  --  page seule — le comportement d'origine, préservé.
  p_prioriser_clics boolean default false,
  --  LE NUMÉRO DU JOUR — la graine du mélange (le code l'envoie pour
  --  que le serveur et le navigateur tirent la même chose).
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
      'ville_nom', s.ville_nom,
      'ville_slug', s.ville_slug,
      'latitude', s.latitude,
      'longitude', s.longitude,
      'styles', to_jsonb(s.styles),
      'lien_instagram', s.lien_instagram,
      'lien_tiktok', s.lien_tiktok,
      'site_web', s.site_web,
      'adresse', s.adresse,
      'code_postal', s.code_postal,
      'bio', s.bio,
      'region', s.region,
      'pays', s.pays,
      'code_pays', s.code_pays,
      'lieu_id', s.lieu_id,
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
      --  LA PHOTO DE LA CARTE — et elle seule. La règle est celle de
      --  `photoChoisie` : ce qui coche le style ET le rendu cherchés
      --  d'abord, puis le style, puis le rendu, puis la première de
      --  la galerie (celle que le tatoueur a mise en vitrine).
      'galerie', coalesce(g.photos, '[]'::jsonb)
    ) as fiche,
    s.km as distance_km,
    s.total as total_resultats
  from (
    select
      t.*,
      count(*) over () as total,
      --  LA DISTANCE au plus proche des points de la fiche — calculée
      --  UNE SEULE FOIS (jointure latérale), et seulement pour les
      --  fiches qui ont passé les filtres.
      d.km,
      row_number() over (
        order by
          --  LES PLUS CONSULTÉS D'ABORD, quand la page le demande.
          --  ⚠️ Le `case` n'est PAS décoratif : sans lui, la base
          --  compterait les clics de TOUTES les fiches retenues alors
          --  que la page d'accueil n'en a que faire.
          case when p_prioriser_clics
               then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
               end desc nulls last,
          --  AUTOUR D'UN POINT : le plus proche d'abord.
          case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
               then d.km end asc nulls last,
          --  SINON : le mélange du jour.
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
    --  LA DISTANCE, UNE SEULE FOIS. Le `p_latitude is not null` est À
    --  L'INTÉRIEUR : sans lieu, la base n'ouvre même pas la table des
    --  points.
    left join lateral (
      select min(public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude)) as km
        from public.points_tatoueur pt
       where p_latitude is not null and p_longitude is not null
         and pt.tatoueur_id = t.id
    ) d on true
    where t.publie
      and t.supprime_le is null
      --  LES FICHES D'ESSAI D'UN ADMINISTRATEUR N'EXISTENT PAS POUR
      --  LE PUBLIC.
      and (
        coalesce(cardinality(p_comptes_masques), 0) = 0
        or t.user_id is null
        or t.user_id::text <> all (p_comptes_masques)
      )
      --  LE STYLE.
      and (p_style is null or t.styles @> array[p_style])
      --  LA VILLE D'UNE PAGE DE RÉFÉRENCEMENT.
      and (p_ville_slug is null or t.ville_slug = p_ville_slug)
      --  LES INTERRUPTEURS. « Rien de déclaré » n'écarte personne.
      and (p_types is null or coalesce(t.type_fiche, 'salon') = any (p_types))
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
        or coalesce(cardinality(t.filtres_besoins), 0) = 0
        or t.filtres_besoins && p_besoins
      )
      --  LE RENDU ne se déclare pas : il se déduit des photos.
      and (
        p_rendus is null
        or not exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.rendu is not null
        )
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.rendu = any (p_rendus)
        )
      )
      --  LE LIEU, selon SA PRÉCISION.
      and (
        case coalesce(p_niveau, 'ville')
          --  TOUT LE PAYS.
          when 'pays' then
            p_code_pays is null
            or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
          --  TOUTE LA RÉGION (dans ce pays, quand on le connaît).
          when 'region' then
            p_region is null
            or (
              public.yf_normaliser(t.region) = public.yf_normaliser(p_region)
              and (
                p_code_pays is null
                or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
              )
            )
          --  AUTOUR D'UN POINT.
          else
            p_latitude is null or p_longitude is null
            or case
              --  AVEC RAYON : le plus proche des points de la fiche
              --  doit y tenir. Le cadre en degrés écarte d'abord le
              --  gros des fiches sans calculer une seule distance.
              --  ⚠️ ON PART DES POINTS, PAS DES FICHES. Chercher « les
              --  fiches dont un point est proche » obligerait à ouvrir
              --  les points de chaque fiche, une par une. On demande
              --  donc d'abord LES POINTS du cadre — c'est un balayage
              --  d'index, très court — puis les fiches qui vont avec.
              when p_rayon_km > 0 then t.id in (
                select pt.tatoueur_id from public.points_tatoueur pt
                 where pt.latitude between p_latitude - (p_rayon_km / 111.045)
                                       and p_latitude + (p_rayon_km / 111.045)
                   and pt.longitude between p_longitude - (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                                        and p_longitude + (p_rayon_km / (111.045 * greatest(cos(radians(p_latitude)), 0.01)))
                   and public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude) <= p_rayon_km
              )
              --  SANS RAYON : LA COMMUNE CHOISIE, arrondissements
              --  compris. Sans nom de ville (cas rare), un très petit
              --  rayon prend le relais.
              when p_ville_nom is not null then
                public.yf_commune(t.ville_nom) = public.yf_commune(p_ville_nom)
              else t.id in (
                select pt.tatoueur_id from public.points_tatoueur pt
                 where pt.latitude between p_latitude - 0.03 and p_latitude + 0.03
                   and pt.longitude between p_longitude - 0.05 and p_longitude + 0.05
                   and public.yf_distance_km(p_latitude, p_longitude, pt.latitude, pt.longitude) <= 2
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
  --  LA PAGE EST RECLASSÉE PAR POPULARITÉ — les fiches les plus
  --  consultées d'abord, à égalité l'ordre ci-dessus. C'est bien LA
  --  PAGE qu'on reclasse, pas la recherche : exactement comme
  --  `classerParPopularite` aujourd'hui.
  --  LA PAGE EST RECLASSÉE PAR POPULARITÉ — mais seulement ses 24
  --  lignes : le compte des clics n'est lu que pour elles.
  order by
    case when p_prioriser_clics then 0
         else -coalesce((select c.total from public.clics_tatoueurs c where c.slug = s.slug), 0)
    end,
    s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Rend une page de fiches en JSON, leur distance, et le nombre total de résultats.';

grant execute on function public.rechercher_tatoueurs(
  text, text, double precision, double precision, double precision, text, text, text, text,
  text[], text[], text[], text[], text[], text[], text, integer, integer, integer, boolean, integer
) to anon, authenticated;
