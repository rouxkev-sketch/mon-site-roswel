-- ============================================================
-- nº 413 — LA RECHERCHE REND ENFIN `etablissement`
-- ============================================================
-- LE DÉFAUT : sous les cartes (accueil, résultats, vitrines), la
-- deuxième ligne dit « Salon » ou « Studio ». Elle vient de
-- `libelleTypeFiche(type_fiche, etablissement)` (config/tatouage), qui
-- lit DEUX colonnes — et la fonction `rechercher_tatoueurs` n'en
-- renvoyait qu'UNE. Son `jsonb_build_object` liste `type_fiche` mais
-- pas `etablissement`.
--
-- CE QUE ÇA DONNE, ET C'EST MÉCANIQUE : côté site, `normaliser`
-- (lib/tatoueurs) complète les champs manquants par leur valeur la
-- plus courante — `etablissement: ligne.etablissement ?? "salon"`.
-- L'ABSENCE DEVENAIT DONC UNE AFFIRMATION : toute fiche de lieu servie
-- par la recherche en base était déclarée « salon », studios privés
-- compris. Un STUDIO s'affichait « Salon ».
--
-- ⚠️ CE QUE CETTE MIGRATION NE PEUT PAS EXPLIQUER, ET QU'IL FAUT
-- VÉRIFIER EN BASE : le propriétaire a relevé l'INVERSE — des SALONS
-- affichés « Studio ». Le repli ci-dessus ne peut pas produire cela :
-- il ne sait dire que « salon ». Pour qu'un salon s'affiche « Studio »,
-- il faut que sa colonne `etablissement` VAILLE RÉELLEMENT 'prive' —
-- une donnée fausse, pas une lecture fausse. La requête de diagnostic
-- est en tête du bloc de vérification, plus bas : à coller AVANT de
-- conclure. Les deux causes sont indépendantes ; celle-ci est réparée
-- ici, l'autre se répare dans la fiche concernée (formulaire).
--
-- CE QUE LA MIGRATION CHANGE : UNE LIGNE. Le corps de la fonction est
-- EXTRAIT MÉCANIQUEMENT de `yokofolio-recherche-sans-masquage.sql`
-- (nº 66, la version en vigueur) — mêmes paramètres, mêmes jointures,
-- mêmes filtres, même tri, au caractère près — et l'on y insère
-- `'etablissement', s.etablissement` juste après `'type_fiche'`. La
-- sous-requête `s` fait déjà `select t.*` : la colonne est là, elle
-- n'était simplement pas recopiée dans le résultat.
--
-- ⚠️ `create or replace function` ET NON `drop` : la signature ne
-- change pas (aucun paramètre ajouté ni retiré), le type de retour non
-- plus. Remplacer le corps suffit, et LE DROIT D'EXÉCUTION EST
-- CONSERVÉ — `grant execute ... to anon, authenticated` (nº 59) reste
-- en place, ce qu'un `drop` aurait emporté. La fiche publique et
-- l'accueil sont PRÉRENDUS et lisent par le rôle anonyme : sans ce
-- droit, la recherche ne rendrait plus rien.
--
-- ⚠️ L'ORDRE : AUCUN IMPOSÉ.
--  · migration passée, ancien site déployé → une clé de plus dans le
--    JSON, que personne ne lit encore : rien ne change ;
--  · site déployé, migration pas passée → exactement l'état
--    d'aujourd'hui, le repli « salon ». Rien ne casse ; le mot reste
--    faux pour les studios jusqu'à ce que la migration passe.
--
-- IDEMPOTENTE : `create or replace` — rejouable telle quelle.
-- ============================================================

begin;

create or replace function public.rechercher_tatoueurs(
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
  --  LA NATURE DE PHOTO cherchée — 'tatouage' | 'flash'
  --  (migration nº 49). Null = on ne cherche pas par nature.
  p_nature text default null,
  p_rendus text[] default null,
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
      --  nº 413 — LA COLONNE QUI MANQUAIT (voir l'en-tête).
      'etablissement', s.etablissement,
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
          --  ⚠️ LE SCORE DE POPULARITÉ — ET IL EST RÉPÉTÉ À
          --  L'IDENTIQUE dans l'`order by` du `limit`, plus bas
          --  (migration nº 63). Ici il NUMÉROTE, là-bas il CHOISIT :
          --  les deux doivent dire exactement la même chose.
          --  Il vient de la vue `popularite_tatoueurs`, définie une
          --  seule fois plus haut : consultations + cœurs + abonnés.
          coalesce(pop.score, 0) desc,
          --  LE DÉPARTAGE, INCHANGÉ ET TOTAL : deux fiches de même score
          --  — le cas de l'immense majorité, à zéro — gardent le tirage
          --  du jour, identique d'une requête à l'autre.
          md5(t.id::text || '-' || p_jour::text)
      ) as rang
    from public.tatoueurs t
    --  LE SCORE DE LA FICHE — une lecture de vue, jamais un calcul
    --  répété : la vue agrège les trois tables une fois pour toutes.
    left join public.popularite_tatoueurs pop on pop.id = t.id
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
      --  ============================================================
      --  LE STYLE SE LIT DANS LES PHOTOS (migration nº 58)
      --  ------------------------------------------------------------
      --  AVANT : `t.styles @> array[p_style]` — la DÉCLARATION de la
      --  fiche. Un style annoncé et jamais rempli remontait donc dans
      --  une photothèque, pour n'y rien montrer.
      --  MAINTENANT : il faut une PHOTO CATALOGUÉE de ce style. C'est
      --  la seule preuve qu'il y a quelque chose à regarder — et elle
      --  se vérifie d'un coup d'œil, contrairement à une déclaration.
      --  ============================================================
      and (
        p_style is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id and p.style = p_style
        )
      )
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
      --  LA NATURE (migration nº 49) — ELLE SE LIT DANS LES PHOTOS.
      --  C'est toute la différence avec l'ancienne case « Flash » :
      --  on ne croit personne sur parole, on regarde ce qui est
      --  déposé. Et elle se croise AVEC LE STYLE quand il y en a
      --  un — « des flashs EN réalisme », pas « des flashs ET du
      --  réalisme » : sans ce croisement, un tatoueur qui fait du
      --  réalisme et des flashs de old school répondrait « oui » à
      --  « Flashs · Réalisme », ce qui est faux.
      --  ============================================================
      and (
        p_nature is null
        or exists (
          select 1 from public.photos_tatoueur p
           where p.tatoueur_id = t.id
             and p.nature = p_nature
             and (p_style is null or p.style = p_style)
        )
        --  ============================================================
        --  ⚠️ LE REPLI DE LA Nº 56 A ÉTÉ RETIRÉ ICI (migration nº 58).
        --  Il gardait une fiche « quand on n'avait rien à lui
        --  opposer » : aucune photo cataloguée pour le style cherché,
        --  donc le style DÉCLARÉ faisait foi. C'est exactement ce que
        --  le propriétaire a annulé — un style sans photo n'a rien à
        --  montrer, il ne doit pas remonter. La nature redevient donc
        --  ce qu'elle a toujours dû être : une lecture des photos, et
        --  rien d'autre.
        --  ============================================================
      )
      --  LE LIEU, sur TOUS les lieux de la fiche (migration nº 42).
      and (
        case coalesce(p_niveau, 'ville')
          when 'pays' then
            p_code_pays is null
            or upper(coalesce(t.code_pays, '')) = upper(p_code_pays)
            or t.id in (
              select l.tatoueur_id from public.lieux_annexes_tatoueur l
               where upper(coalesce(l.code_pays, '')) = upper(p_code_pays)
            )
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
          else
            p_latitude is null or p_longitude is null
            or case
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
    --  ============================================================
    --  ⚠️ C'EST CET `order by` QUI DÉCIDE DE LA PAGE (migration nº 63)
    --  ============================================================
    --  LE DÉFAUT DE LA Nº 62 : elle avait mis le score dans le
    --  `row_number()` ci-dessus — donc dans `s.rang`, qui sert au tri
    --  FINAL — mais PAS ici. Or c'est ce tri-ci que suivent le `limit`
    --  et l'`offset` : il choisissait les vingt-quatre lignes par le
    --  seul `md5` du jour, et le tri final ne faisait que reclasser
    --  ces vingt-quatre-là entre elles. Vu de l'écran : les fiches les
    --  plus populaires n'arrivaient en tête qu'une fois TOUT le
    --  catalogue chargé — le classement s'appliquait à ce qui était
    --  déjà reçu, pas au catalogue.
    --  LES DEUX `order by` SONT DÉSORMAIS IDENTIQUES, terme pour
    --  terme. Ils doivent l'être : celui-ci CHOISIT les lignes, celui
    --  du `row_number()` les NUMÉROTE, et deux règles différentes pour
    --  un même classement, c'est la panne assurée.
    order by
      case when p_prioriser_clics
           then (select c.total from public.clics_tatoueurs c where c.slug = t.slug)
           end desc nulls last,
      case when coalesce(p_niveau, 'ville') in ('adresse', 'ville')
           then d.km end asc nulls last,
      coalesce(pop.score, 0) desc,
      md5(t.id::text || '-' || p_jour::text)
    limit greatest(coalesce(p_limite, 24), 0)
    offset greatest(coalesce(p_decalage, 0), 0)
  ) s

  left join lateral (
    select l.*
      from public.lieux_tatoueur l
     where (p_latitude is not null or p_code_pays is not null
            or p_region is not null)
       and l.tatoueur_id = s.id
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
               'id', p.id, 'style', p.style,
               'rendu', p.rendu, 'nature', p.nature,
               'url', p.url, 'miniature', p.miniature,
               'ordre', p.ordre
             ) order by p.ordre
           ) as photos
      from (
        select p2.*
          from public.photos_tatoueur p2
         where p2.tatoueur_id = s.id
         order by
           --  ⚠️ LA NATURE PASSE AVANT TOUT (migration nº 49) :
           --  chercher des flashs et voir une photo de tatouage
           --  serait le même mensonge d'affichage que chercher
           --  « couleur » et voir du noir et gris.
           case when p_nature is not null and p2.nature <> p_nature
                then 1 else 0 end,
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
  --  ------------------------------------------------------------
  --  L'ORDRE EST CELUI DE `s.rang`, ET RIEN D'AUTRE (migration nº 61)
  --  ------------------------------------------------------------
  --  ⚠️ CE QUI ÉTAIT ÉCRIT ICI, ET QUI RENDAIT LA PAGINATION
  --  INSTABLE :
  --      case when p_prioriser_clics then 0
  --           else -coalesce((select c.total from clics_tatoueurs …), 0)
  --      end,
  --      s.rang
  --  Ce tri s'appliquait à `s`, c'est-à-dire à la page DÉJÀ COUPÉE
  --  (le `limit`/`offset` est dans la sous-requête). Les vingt-quatre
  --  premières cartes étaient donc reclassées par nombre de clics
  --  ENTRE ELLES ; en demander quarante-huit reclassait un AUTRE
  --  ensemble, et une fiche très consultée qui occupait le rang 30
  --  remontait en tête de la mosaïque. Vu de l'écran : « Voir plus »
  --  fait apparaître des cartes AU-DESSUS de celles déjà affichées.
  --
  --  `s.rang` est un ordre TOTAL et DÉTERMINÉ : il départage tout,
  --  jusqu'à `md5(id || jour)` qui ne laisse aucune égalité. Il ne
  --  dépend pas du nombre de lignes demandées — la page 1 garde donc
  --  exactement le même début quand on charge la page 2.
  --
  --  LA POPULARITÉ VIT DANS `s.rang` (voir le `row_number()` plus
  --  haut), donc AVANT la coupe, sur le catalogue filtré ENTIER. Un
  --  tri qui s'applique après la coupe n'est pas un classement : c'est
  --  un remaniement de page — c'est ce que faisait la nº 58, et c'est
  --  ce qui faisait remonter des cartes au-dessus de celles déjà
  --  affichées.
  order by s.rang;
$$;

comment on function public.rechercher_tatoueurs is
  'LA recherche de yokofolio : filtre, distance, tri, limite — tout en base. Corps de la nº 66 (masquage retiré), auquel la nº 413 ajoute UNE clé au résultat : `etablissement`. Sans elle, le site ne pouvait pas distinguer un salon d''un studio privé sur une carte — il lisait « salon » par défaut.';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration)
-- ============================================================
-- ⚠️ a) LE DIAGNOSTIC DEMANDÉ AU PROPRIÉTAIRE — la vraie valeur en
--    base des fiches de lieu. Une fiche dont `etablissement` vaut
--    'prive' s''affiche « Studio » ; toute autre valeur (ou null)
--    s''affiche « Salon ». Si « Hand In Glove Tattoo » y apparaît en
--    'prive', la donnée est fausse et se corrige dans son formulaire,
--    pas ici :
--    select nom, slug, type_fiche, etablissement
--      from public.tatoueurs
--     where type_fiche is distinct from 'artiste'
--       and supprime_le is null
--     order by etablissement nulls first, nom;
--
-- b) La fonction rend bien la clé — doit afficher un booléen VRAI :
--    select (fiche ? 'etablissement') as cle_presente
--      from public.rechercher_tatoueurs(p_limite => 1);
--
-- c) Ce que la recherche dit du type, fiche par fiche (les deux
--    colonnes qui décident du mot) :
--    select fiche->>'nom'           as nom,
--           fiche->>'type_fiche'    as type_fiche,
--           fiche->>'etablissement' as etablissement
--      from public.rechercher_tatoueurs(p_limite => 50)
--     order by 1;
