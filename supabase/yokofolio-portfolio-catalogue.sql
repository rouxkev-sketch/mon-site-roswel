-- ============================================================
--  YOKOFOLIO — LE PORTFOLIO CATALOGUÉ (photos taguées)
--  (migration nº 31 — à passer APRÈS
--   yokofolio-demos-nouveau-modele.sql)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque.
--
--  CE QU'ON QUITTE
--  ---------------
--  `photos_styles` : un objet JSON { style → adresse d'image }. UNE
--  photo par style, sans autre information. Impossible d'en mettre
--  deux, impossible de savoir ce qu'elles montrent.
--
--  CE QU'ON POSE
--  -------------
--  Une TABLE, une LIGNE par photo, et TROIS TAGS :
--    · `style` — le slug du style (les 22 déjà en place) ;
--    · `zone`  — l'endroit du corps, 19 valeurs ;
--    · `rendu` — noir et gris, ou couleur.
--
--  ⚠️ LES IDENTIFIANTS SONT EN ANGLAIS, ET FIGÉS : `forearm`,
--  `chest`, `black_and_grey`… Le libellé français vit dans le code
--  (src/lib/photos-tatoueur.ts), jamais en base. Le jour où le site
--  parlera une autre langue, on ajoutera des libellés SANS toucher à
--  une seule ligne enregistrée. Stocker « Avant-bras » comme clé
--  aurait condamné la traduction — ou imposé de migrer toutes les
--  photos de tous les tatoueurs.
--
--  L'UNICITÉ : dans un même style, un seul couple ZONE + RENDU. Un
--  index unique la tient — c'est la seule garantie qui compte, celle
--  que le formulaire ne fait que refléter.
--
--  LE FUTUR FILTRE PAR ZONE ne demandera AUCUNE migration : `zone`
--  est déjà une colonne indexée. Il suffira de brancher un groupe de
--  filtres de plus, exactement comme le rendu aujourd'hui.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LA TABLE
-- ------------------------------------------------------------
create table if not exists public.photos_tatoueur (
  id uuid primary key default gen_random_uuid(),
  tatoueur_id uuid not null references public.tatoueurs(id) on delete cascade,

  --  LE STYLE — obligatoire : une photo est toujours déposée dans un
  --  bloc de style, c'est le geste même du formulaire.
  style text not null,

  --  ⚠️ ZONE ET RENDU SONT NULLABLES, et c'est VOULU : les photos
  --  d'avant cette migration n'ont jamais eu de tags. On les garde
  --  toutes — perdre le portfolio de quelqu'un pour un changement de
  --  modèle serait indéfendable —, et leur propriétaire est invité à
  --  les compléter à sa prochaine visite, sans que rien ne le bloque.
  --  Toute photo DÉPOSÉE DÉSORMAIS porte ses deux tags : le
  --  formulaire refuse de l'enregistrer sans (voir point 2).
  zone text,
  rendu text,

  --  L'IMAGE PLEINE RÉSOLUTION (1080 × 1350) et sa MINIATURE
  --  (320 × 400). Deux fichiers, deux usages : la fiche montre la
  --  première, les cartes et la grille du formulaire la seconde.
  url text not null,
  miniature text,

  --  LA PLACE DANS LA GALERIE. Le rang 0 est la vignette de la fiche.
  ordre integer not null default 0,
  cree_le timestamptz not null default now()
);

comment on table public.photos_tatoueur is
  'Le portfolio d''un tatoueur : une ligne par photo, taguée style + zone du corps + rendu. Remplace la colonne photos_styles (une seule photo par style, sans tags), conservée en base le temps de la bascule.';
comment on column public.photos_tatoueur.zone is
  'Zone du corps, identifiant ANGLAIS figé (arm, forearm, chest…). Null = photo d''avant la refonte, à compléter par son propriétaire. Le libellé français vit dans le code.';
comment on column public.photos_tatoueur.rendu is
  'black_and_grey | color — identifiant ANGLAIS figé. Null = photo d''avant la refonte.';
comment on column public.photos_tatoueur.miniature is
  'Vignette 320 × 400 servie aux cartes et à la grille du formulaire. Null = photo d''avant la refonte : on retombe sur la pleine résolution.';
comment on column public.photos_tatoueur.ordre is
  'Place dans la galerie. Le rang 0 est la vignette de la fiche sur les cartes.';

-- ------------------------------------------------------------
-- 2) LES VALEURS ADMISES — bornées, pour qu'une faute de frappe ne
--    puisse pas entrer et casser un futur filtre.
-- ------------------------------------------------------------
alter table public.photos_tatoueur drop constraint if exists photos_zone_connue;
alter table public.photos_tatoueur
  add constraint photos_zone_connue check (
    zone is null or zone in (
      'arm', 'forearm', 'shoulder', 'hand', 'chest', 'stomach', 'ribs',
      'hip', 'buttocks', 'back', 'nape', 'neck', 'face', 'skull', 'ear',
      'thigh', 'knee', 'leg', 'foot'
    )
  );

alter table public.photos_tatoueur drop constraint if exists photos_rendu_connu;
alter table public.photos_tatoueur
  add constraint photos_rendu_connu check (
    rendu is null or rendu in ('black_and_grey', 'color')
  );

-- ------------------------------------------------------------
-- 3) L'UNICITÉ — un couple ZONE + RENDU par style, et par fiche
-- ------------------------------------------------------------
--  INDEX PARTIEL : il ne s'applique qu'aux photos RÉELLEMENT taguées.
--  Sans cela, les photos d'avant (zone et rendu à null) se seraient
--  bloquées entre elles dès la deuxième — alors qu'elles n'ont
--  justement rien qui les distingue.
create unique index if not exists photos_tatoueur_unicite
  on public.photos_tatoueur (tatoueur_id, style, zone, rendu)
  where zone is not null and rendu is not null;

--  LA LECTURE : la galerie d'une fiche, dans l'ordre.
create index if not exists photos_tatoueur_galerie
  on public.photos_tatoueur (tatoueur_id, ordre);

--  LES FILTRES : le rendu sert dès aujourd'hui, la zone servira
--  demain — l'index est posé maintenant pour que ce « demain » ne
--  demande aucune migration.
create index if not exists photos_tatoueur_rendu
  on public.photos_tatoueur (rendu) where rendu is not null;
create index if not exists photos_tatoueur_zone
  on public.photos_tatoueur (zone) where zone is not null;
create index if not exists photos_tatoueur_style
  on public.photos_tatoueur (style);

-- ------------------------------------------------------------
-- 4) LES DROITS
-- ------------------------------------------------------------
--  LIRE : tout le monde. Un portfolio est public par nature.
--  ÉCRIRE : le propriétaire de la fiche, et lui seul — vérifié ligne
--  par ligne, comme pour les modes et les studios.
alter table public.photos_tatoueur enable row level security;

drop policy if exists "lecture publique des photos" on public.photos_tatoueur;
create policy "lecture publique des photos"
  on public.photos_tatoueur for select
  using (true);

drop policy if exists "ecriture de ses photos" on public.photos_tatoueur;
create policy "ecriture de ses photos"
  on public.photos_tatoueur for all
  to authenticated
  using (
    exists (
      select 1 from public.tatoueurs t
       where t.id = photos_tatoueur.tatoueur_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tatoueurs t
       where t.id = photos_tatoueur.tatoueur_id and t.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5) LE GROUPE « BESOINS », DÉCLARÉ AU NIVEAU DE LA FICHE
-- ------------------------------------------------------------
--  Cover et cicatrice ne sont pas des goûts : ce sont des demandes
--  précises, que tous les tatoueurs ne prennent pas. Elles vivent
--  donc sur la FICHE, comme la technique et la composition — et pas
--  photo par photo.
alter table public.tatoueurs
  add column if not exists filtres_besoins text[] not null default '{}'::text[];

comment on column public.tatoueurs.filtres_besoins is
  'cover | scar — identifiants ANGLAIS figés, comme les tags de photos. Ce que le tatoueur accepte de prendre en charge.';

create index if not exists idx_tatoueurs_besoins
  on public.tatoueurs using gin (filtres_besoins);

-- ------------------------------------------------------------
-- 6) LA REPRISE DES PHOTOS EXISTANTES — AUCUNE PERTE
-- ------------------------------------------------------------
--  CHAQUE ENTRÉE de `photos_styles` devient une ligne, avec son style
--  et son adresse d'image. SANS ZONE NI RENDU : on ne les invente
--  pas. Deviner « avant-bras » sur une photo qu'on n'a pas vue
--  produirait des données fausses — et le futur filtre par zone
--  renverrait n'importe quoi, ce qui est pire que de ne pas exister.
--
--  CES PHOTOS RESTENT AFFICHÉES, exactement comme avant. Leur
--  propriétaire verra, à sa prochaine modification, un rappel discret
--  lui proposant de les compléter — sa fiche n'est jamais bloquée
--  pour autant, et rien ne l'oblige à répondre tout de suite.
--
--  L'ORDRE reprend celui des styles de la fiche : la première photo
--  de la galerie est donc celle du premier style déclaré — soit
--  exactement la photo principale d'aujourd'hui.
--  RELANÇABLE : on n'insère que ce qui n'y est pas déjà.
insert into public.photos_tatoueur (tatoueur_id, style, url, ordre)
select t.id,
       paire.key,
       paire.value #>> '{}',
       coalesce(array_position(t.styles, paire.key), 999) - 1
  from public.tatoueurs t
  cross join lateral jsonb_each(coalesce(t.photos_styles, '{}'::jsonb)) as paire
 where paire.value #>> '{}' is not null
   and paire.value #>> '{}' <> ''
   and not exists (
     select 1 from public.photos_tatoueur p
      where p.tatoueur_id = t.id and p.style = paire.key
   );

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- Combien de photos, combien reste-t-il à taguer :
--  select count(*) as photos,
--         count(*) filter (where zone is null or rendu is null) as a_completer
--    from public.photos_tatoueur;
--
--  -- Le portfolio d'une fiche, dans l'ordre :
--  select style, zone, rendu, ordre
--    from public.photos_tatoueur p
--    join public.tatoueurs t on t.id = p.tatoueur_id
--   where t.slug = 'atelier-corvus-lyon-1er'
--   order by p.ordre;
--
--  -- L'unicité tient-elle ? (doit rendre zéro ligne)
--  select tatoueur_id, style, zone, rendu, count(*)
--    from public.photos_tatoueur
--   where zone is not null and rendu is not null
--   group by 1, 2, 3, 4 having count(*) > 1;
