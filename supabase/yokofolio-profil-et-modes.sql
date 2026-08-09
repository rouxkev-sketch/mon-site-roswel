-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 38 : LE PROFIL ET LE MODE D'ACTIVITÉ
--                                DEVIENNENT DEUX FILTRES SÉPARÉS
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 37
--  (yokofolio-etablissement-prive.sql).
--
--  LE DÉFAUT. « Artiste » et « À domicile » vivaient dans le même
--  groupe d'interrupteurs. Ils ne répondent pourtant pas à la même
--  question : le premier dit CE QU'EST une fiche, le second CE QU'ELLE
--  FAIT. Mélangés, ils s'annulaient — éteindre « Artiste » faisait
--  disparaître les artistes à domicile alors que « À domicile »
--  restait allumé. Un filtre qui se contredit lui-même.
--
--  CE QUE FAIT CETTE MIGRATION. Elle recrée la fonction de recherche
--  avec DEUX AXES au lieu d'un :
--
--    1. LE PROFIL (`p_types`) — « artiste », « salon », « studio-prive ».
--       Il ne se lit plus dans la seule colonne `type_fiche` : un
--       studio privé est une fiche de LIEU dont `etablissement` vaut
--       « prive » (migration nº 37). La valeur est donc RECOMPOSÉE ici,
--       exactement comme `profilDeLaFiche` la recompose dans le code.
--
--    2. OÙ IL TATOUE (`p_modes`) — les genres déclarés dans
--       `modes_exercice` : « salon », « guest », « domicile », « prive ».
--
--  ⚠️ LE SECOND AXE NE PARLE QUE DES ARTISTES, et c'est LUI qui
--  empêche les deux groupes de se contredire à nouveau. Un salon n'a
--  pas de mode d'exercice — il a des adresses. Éteindre « En guest »
--  ne doit donc retirer AUCUN salon : la condition ne s'applique
--  qu'aux fiches dont `type_fiche = 'artiste'`, les fiches de lieu
--  passent au travers sans être interrogées.
--
--  ⚠️ LES SESSIONS GUEST PÉRIMÉES NE COMPTENT PAS. On interroge la vue
--  `modes_exercice_actifs` (migration nº 26) et non la table : une
--  session guest terminée en septembre ne doit pas répondre « oui » à
--  « En guest » en novembre. C'est déjà ce que fait l'affichage
--  (`modesActifs`) ; la recherche s'aligne.
--
--  ⚠️ UN ARTISTE SANS AUCUN MODE DÉCLARÉ N'EST PAS ÉCARTÉ. Sa fiche
--  est incomplète, elle ne dit pas « non ». On ne cache jamais
--  quelqu'un sur un silence quand le formulaire lui réclame déjà
--  l'information. (Même indulgence que Technique et Types de projets ;
--  Besoins et Rendu, eux, gardent leur sévérité de la nº 35.)
--
--  LE FLASH ET LE BODYSUIT (§4) NE DEMANDENT AUCUN CHANGEMENT ICI :
--  `filtres_composition` est un `text[]` libre, sans liste de valeurs
--  autorisées. Les deux nouveaux slugs s'y écrivent comme les autres.
--  ⚠️ ET LE BODYSUIT NE PEUT PAS ÊTRE RÉTABLI SUR LES FICHES
--  EXISTANTES : la migration nº 17 a fondu `bodysuit`, `piece-dos` et
--  `piece-torse` dans `sleeve`. Les trois sont devenus indiscernables
--  — rien ne permet de savoir laquelle une fiche portait. On ne
--  devine pas : les fiches gardent « Grandes pièces », et leurs
--  propriétaires cocheront « Bodysuit » eux-mêmes s'ils le pratiquent.
--
--  LE MÊME PARTAGE EST ÉCRIT DANS LE CODE (`passeLesFiltres`,
--  src/lib/tatoueurs.ts) : le chemin de secours, quand la base est
--  injoignable, doit répondre exactement pareil.
--
--  SANS RISQUE : aucune donnée touchée, aucune colonne ajoutée ni
--  supprimée — seule la fonction de recherche est refaite. Rejouable
--  autant de fois qu'on veut.
-- =====================================================================

--  ⚠️ ON SUPPRIME D'ABORD, ON RECRÉE ENSUITE — et surtout PAS un
--  simple « create or replace ». La fonction gagne un paramètre :
--  « replace » refuserait de changer la signature et créerait une
--  SECONDE fonction du même nom. PostgREST se retrouverait alors avec
--  deux candidates et ne saurait plus laquelle appeler. La boucle
--  ci-dessous retire TOUTES les versions existantes, quelle que soit
--  leur signature — c'est ce qui rend le fichier rejouable.
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
  --  LE PROFIL : artiste | salon | studio-prive. Recomposé plus bas à
  --  partir de `type_fiche` et `etablissement` — voir l'en-tête.
  p_types text[] default null,
  --  OÙ IL TATOUE : les GENRES de modes_exercice — salon | guest |
  --  domicile | prive. Ne concerne QUE les fiches d'artiste.
  p_modes text[] default null,
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
      'lien_youtube', s.lien_youtube,
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
      --  LE PROFIL, RECOMPOSÉ. Une fiche de lieu dont `etablissement`
      --  vaut « prive » est un STUDIO PRIVÉ, pas un salon : c'est la
      --  seule différence avec la version d'avant la nº 38.
      and (
        p_types is null
        or (case
              when coalesce(t.type_fiche, 'salon') = 'artiste' then 'artiste'
              when coalesce(t.etablissement, 'salon') = 'prive' then 'studio-prive'
              else 'salon'
            end) = any (p_types)
      )
      --  OÙ IL TATOUE — ARTISTES SEULEMENT.
      --  ⚠️ LES DEUX PREMIÈRES LIGNES SONT TOUT LE CORRECTIF : un
      --  salon n'est jamais interrogé sur ses modes, il n'en a pas.
      --  Sans elles, éteindre un mode retirerait tous les salons, et
      --  les deux groupes se contrediraient comme avant.
      and (
        p_modes is null
        or coalesce(t.type_fiche, 'salon') <> 'artiste'
        --  Le silence n'écarte pas : une fiche sans aucun mode déclaré
        --  est incomplète, elle ne dit pas « non ».
        or not exists (
          select 1 from public.modes_exercice_actifs m
           where m.tatoueur_id = t.id
        )
        --  Sinon : au moins un mode encore allumé.
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
      --  ⚠️ MIGRATION Nº 35 : LE SILENCE NE PROTÈGE PLUS.
      --  « or cardinality(...) = 0 » épargnait toute fiche n'ayant
      --  rien déclaré. Le groupe étant FACULTATIF au formulaire,
      --  presque aucune fiche ne déclarait rien — donc presque toutes
      --  étaient épargnées, et le filtre ne retirait jamais personne.
      --  Un besoin n'est pas un goût : chercher un cover, c'est
      --  chercher quelqu'un qui l'a DIT.
      and (
        p_besoins is null
        or t.filtres_besoins && p_besoins
      )
      --  LE RENDU ne se déclare pas : il se déduit des photos.
      --  ⚠️ MIGRATION Nº 35, MÊME RAISON. « not exists (… rendu is
      --  not null) » laissait passer toute fiche dont aucune photo
      --  n'était taguée. Une fiche sans photo taguée n'est ni noir et
      --  gris ni couleur : elle ne peut pas répondre « oui » à l'un
      --  des deux.
      and (
        p_rendus is null
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

--  ⚠️ SANS RÉÉCRIRE LA LISTE DES TYPES. L'ancienne version du fichier
--  la recopiait en toutes lettres — et ce fichier-ci ajoute un
--  paramètre : la liste d'hier ne désigne plus rien, le `grant`
--  échouait. PostgreSQL sait retrouver une fonction par son seul nom
--  quand il n'y en a qu'une, et la boucle du haut garantit qu'il n'y
--  en a qu'une. Une signature de moins à tenir à jour.
grant execute on function public.rechercher_tatoueurs to anon, authenticated;


-- =====================================================================
--  LES FICHES DE DÉMONSTRATION, MISES AU DIAPASON
-- =====================================================================
--  Sans ces quelques lignes, trois entrées neuves du moteur ne
--  renverraient JAMAIS rien sur une base de démonstration : « Studios
--  privés », « En studio privé », « Flash » et « Bodysuit » n'existent
--  sur aucune fiche. On ne saurait pas si le filtre marche ou si
--  personne ne correspond.
--
--  ⚠️ SEULES LES FICHES DE DÉMONSTRATION SONT TOUCHÉES, désignées une
--  par une par leur slug. Aucune fiche de vrai tatoueur n'est modifiée.
--  Tout est rejouable : on n'ajoute que ce qui manque.
-- ---------------------------------------------------------------------

--  1. UN STUDIO PRIVÉ parmi les lieux — le même que celui des
--     démonstrations du code (src/lib/tatoueurs-demo.ts).
update public.tatoueurs
   set etablissement = 'prive'
 where slug = 'studio-mille-traits-lyon-6e'
   and type_fiche = 'salon'
   and etablissement <> 'prive';

--  2. UN ARTISTE QUI REÇOIT EN STUDIO PRIVÉ, en plus de ce qu'il fait
--     déjà. On recopie son mode « à domicile » (mêmes lieu et
--     coordonnées, déjà valides) en changeant le genre : ainsi la
--     ligne reste cohérente sans inventer une adresse.
insert into public.modes_exercice (
  tatoueur_id, genre, role, salon_id, intitule, adresse, code_postal,
  ville, region, pays, code_pays, latitude, longitude, lieu_id, ordre
)
select m.tatoueur_id, 'prive', null, null, m.intitule, m.adresse, m.code_postal,
       m.ville, m.region, m.pays, m.code_pays, m.latitude, m.longitude, m.lieu_id,
       coalesce((select max(x.ordre) + 1 from public.modes_exercice x
                  where x.tatoueur_id = m.tatoueur_id), 0)
  from public.modes_exercice m
  join public.tatoueurs t on t.id = m.tatoueur_id
 where t.slug = 'trait-nord-strasbourg'
   and m.genre = 'domicile'
   and not exists (
     select 1 from public.modes_exercice d
      where d.tatoueur_id = m.tatoueur_id and d.genre = 'prive'
   )
 limit 1;

--  3. LE FLASH ET LE BODYSUIT sur quelques fiches, pour que les deux
--     nouvelles cases aient de quoi répondre.
--     `array_append` seulement si le slug n'y est pas déjà : repasser
--     le fichier ne crée pas de doublon.
update public.tatoueurs
   set filtres_composition = array_append(filtres_composition, 'flash')
 where slug in ('camille-fauve-paris-18e', 'typo-sauvage-bordeaux',
                'ligne-claire-studio-nantes')
   and not ('flash' = any (filtres_composition));

update public.tatoueurs
   set filtres_composition = array_append(filtres_composition, 'bodysuit')
 where slug in ('kosei-tattoo-lyon-2e', 'hokusai-mecanique-paris-11e')
   and not ('bodysuit' = any (filtres_composition));

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — à lire dans le panneau de
--  résultats. N'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Fiches d''artiste', (
    select count(*)::text from public.tatoueurs
     where supprime_le is null and type_fiche = 'artiste')),
  (2, 'Salons', (
    select count(*)::text from public.tatoueurs
     where supprime_le is null and type_fiche = 'salon'
       and coalesce(etablissement, 'salon') <> 'prive')),
  (3, 'Studios privés', (
    select count(*)::text from public.tatoueurs
     where supprime_le is null and type_fiche = 'salon'
       and etablissement = 'prive')),
  (4, 'Artistes par mode déclaré', (
    select coalesce(string_agg(g.genre || ' : ' || g.combien, ' · '
                               order by g.genre), 'aucun')
      from (select m.genre, count(distinct m.tatoueur_id) as combien
              from public.modes_exercice_actifs m
              join public.tatoueurs t on t.id = m.tatoueur_id
             where t.supprime_le is null and t.type_fiche = 'artiste'
             group by m.genre) as g)),
  (5, 'Fiches proposant du flash', (
    select count(*)::text from public.tatoueurs
     where supprime_le is null and 'flash' = any (filtres_composition))),
  (6, 'Fiches proposant le bodysuit', (
    select count(*)::text from public.tatoueurs
     where supprime_le is null and 'bodysuit' = any (filtres_composition)))
) as etat(ordre, mesure, valeur)
order by ordre;
