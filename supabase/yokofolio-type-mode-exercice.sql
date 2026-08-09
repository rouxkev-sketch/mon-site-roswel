-- ============================================================
--  YOKOFOLIO — TYPE DE FICHE, MODE D'EXERCICE, PHOTO DE PROFIL
--  ET ADRESSES DE FICHE AVEC LA VILLE
--  (migration nº 21 — à passer APRÈS yokofolio-fiches-internationales.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : tout est en « if not exists », et les
--  reprises de données ne touchent que les lignes encore vides.
--
--  CE QUE CE FICHIER AJOUTE
--  ------------------------
--   1. `type_fiche`     — « artiste » ou « salon » ;
--   2. `mode_exercice`  — « adresse » (les salons), « en-salon »,
--                         « sur-zone », « itinerant » (les artistes) ;
--   3. `rayon_zone_km`  — le rayon d'intervention du mode « sur zone » ;
--   4. `villes`         — les villes de tournée du mode « itinérant » ;
--   5. `photo_profil`   — la photo ronde, désormais OBLIGATOIRE à la
--                         saisie (les fiches déjà en base ne sont pas
--                         bloquées : elles la fourniront à leur
--                         prochain enregistrement) ;
--   6. `ancien_slug`    — l'ancienne adresse de la fiche, gardée pour
--                         que les liens déjà partagés continuent de
--                         fonctionner (redirection) ;
--   7. les NOUVEAUX SLUGS, qui portent la ville :
--         maison-vermillon → maison-vermillon-lille
--
--  CE QUE DEVIENNENT LES FICHES DÉJÀ EN BASE
--  -----------------------------------------
--  TOUTES basculent en « salon », mode « adresse », adresse conservée
--  TELLE QUELLE : c'est exactement leur fonctionnement d'avant. Rien
--  n'est perdu, rien n'est deviné. Un tatoueur qui est en réalité un
--  artiste le corrigera en deux clics dans son formulaire.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LES NOUVELLES COLONNES
-- ------------------------------------------------------------
alter table public.tatoueurs
  add column if not exists type_fiche text not null default 'salon',
  add column if not exists mode_exercice text not null default 'adresse',
  add column if not exists rayon_zone_km integer,
  add column if not exists villes jsonb not null default '[]'::jsonb,
  add column if not exists photo_profil text,
  add column if not exists ancien_slug text;

comment on column public.tatoueurs.type_fiche is
  'artiste | salon — le choix qui structure toute la fiche.';
comment on column public.tatoueurs.mode_exercice is
  'adresse (salon) | en-salon | sur-zone | itinerant (artiste).';
comment on column public.tatoueurs.rayon_zone_km is
  'Rayon d''intervention en km — mode « sur zone » uniquement.';
comment on column public.tatoueurs.villes is
  'Villes de tournée — mode « itinérant » uniquement : [{intitule, ville, region, pays, code_pays, latitude, longitude, lieu_id}].';
comment on column public.tatoueurs.photo_profil is
  'Photo de profil (fichier carré, affiché rond). Obligatoire à la saisie depuis la refonte.';
comment on column public.tatoueurs.ancien_slug is
  'Adresse précédente de la fiche : la page /tatoueur/<ancien> y redirige. Ne jamais réécrire.';

-- Des valeurs LIBRES mais BORNÉES : une faute de frappe ne doit pas
-- pouvoir entrer en base et casser l'affichage.
alter table public.tatoueurs drop constraint if exists tatoueurs_type_fiche_connu;
alter table public.tatoueurs
  add constraint tatoueurs_type_fiche_connu
  check (type_fiche in ('artiste', 'salon'));

alter table public.tatoueurs drop constraint if exists tatoueurs_mode_exercice_connu;
alter table public.tatoueurs
  add constraint tatoueurs_mode_exercice_connu
  check (mode_exercice in ('adresse', 'en-salon', 'sur-zone', 'itinerant'));

-- ------------------------------------------------------------
-- 2) LA REPRISE : tout l'existant devient un SALON à une adresse
-- ------------------------------------------------------------
update public.tatoueurs
   set type_fiche = 'salon',
       mode_exercice = 'adresse'
 where type_fiche is null
    or mode_exercice is null
    or type_fiche not in ('artiste', 'salon')
    or mode_exercice not in ('adresse', 'en-salon', 'sur-zone', 'itinerant');

-- ------------------------------------------------------------
-- 3) LES NOUVELLES ADRESSES DE FICHE (slugs avec la ville)
-- ------------------------------------------------------------
--  Une fonction de « slug » en SQL, jumelle de celle du site
--  (src/lib/slug.ts) : minuscules, sans accents, tout le reste en
--  tirets. `unaccent` n'est pas supposée installée — on translitère à
--  la main les lettres accentuées du latin, MACRONS COMPRIS (« Kōsei »
--  doit donner « kosei », pas « k-sei ») : sur les noms réels, cette
--  fonction et celle du site rendent la même adresse. (Elle est même
--  un peu plus tolérante — ø, đ, ł y sont traduits ; sans importance,
--  puisque le slug calculé ici est ENSUITE FIGÉ en base.)
create or replace function public.yokofolio_slug(texte text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(
        translate(
          replace(replace(replace(coalesce(texte, ''), 'œ', 'oe'), 'Œ', 'oe'), 'æ', 'ae'),
          'àáâãäåāăçćčđèéêëēĕėęěìíîïīĭįñńňòóôõöōŏőøùúûüūŭůűýÿŷšśşžźżłĺľťţďřŕ' ||
          'ÀÁÂÃÄÅĀĂÇĆČĐÈÉÊËĒĔĖĘĚÌÍÎÏĪĬĮÑŃŇÒÓÔÕÖŌŎŐØÙÚÛÜŪŬŮŰÝŸŶŠŚŞŽŹŻŁĹĽŤŢĎŘŔ',
          'aaaaaaaacccdeeeeeeeeeiiiiiiinnnooooooooouuuuuuuuyyyssszzzlllttdrr' ||
          'AAAAAAAACCCDEEEEEEEEEIIIIIIINNNOOOOOOOOOUUUUUUUUYYYSSSZZZLLLTTDRR'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

--  Le nouveau slug de chaque fiche : nom + ville, numéroté en cas
--  d'homonymie exacte (même nom, même ville). L'ancien est conservé
--  dans `ancien_slug` — et UNE SEULE FOIS : une deuxième exécution ne
--  l'écrase pas (`where ancien_slug is null`).
with calcul as (
  select
    id,
    slug as slug_actuel,
    public.yokofolio_slug(nom || '-' || coalesce(ville_nom, '')) as racine,
    row_number() over (
      partition by public.yokofolio_slug(nom || '-' || coalesce(ville_nom, ''))
      order by cree_le, id
    ) as rang
  from public.tatoueurs
  where ancien_slug is null
),
nouveau as (
  select
    id,
    slug_actuel,
    case when rang = 1 then racine else racine || '-' || rang end as slug_cible
  from calcul
)
update public.tatoueurs as t
   set ancien_slug = n.slug_actuel,
       slug        = n.slug_cible
  from nouveau as n
 where t.id = n.id
   and n.slug_cible <> ''
   and n.slug_cible <> n.slug_actuel;

-- Retrouver une fiche par son ANCIENNE adresse doit être immédiat :
-- c'est la lecture que fait la redirection, à chaque vieux lien.
create index if not exists idx_tatoueurs_ancien_slug
  on public.tatoueurs (ancien_slug)
  where ancien_slug is not null;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Les adresses, avant et après :
--  select nom, ville_nom, ancien_slug, slug from public.tatoueurs order by nom;
--
--  -- La répartition des types (tout doit être « salon » au départ) :
--  select type_fiche, mode_exercice, count(*)
--    from public.tatoueurs group by 1, 2;
