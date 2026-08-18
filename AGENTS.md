<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Livraisons zip (règle mise à jour par le propriétaire, passe nº 356)

Une extraction a déjà ÉCRASÉ le dossier de travail du propriétaire parce que
le zip livré contenait un dossier racine nommé `mon-site-roswel`, identique
au sien. Les garde-fous d'origine restent entiers ; seule la FORME du nom a
changé, sur ordre du propriétaire (après la passe nº 355) :

- le nom du zip livré = LE NUMÉRO DE LA PASSE, rien d'autre : `356.zip`,
  racine `356/` ; la passe suivante `357.zip`, etc. — chaque numéro est
  unique par construction, aucune réutilisation possible ;
- JAMAIS le nom `mon-site-roswel` (ni comme racine du zip, ni comme nom de
  fichier zip) ;
- le fichier zip porte le même nom que son dossier racine ;
- technique : créer un lien symbolique au nom de la passe puis zipper à
  travers ce lien (zip suit les liens par défaut) :

      ln -s /chemin/du/projet /tmp/356
      cd /tmp && zip -r 356.zip 356 \
        -x "*/node_modules/*" -x "*/.next/*" -x "*/.git/*" \
        -x "*/journal-de-bord*.ndjson"

- LES IMAGES DE `public/` SONT DÉSORMAIS INCLUSES dans chaque zip (règle du
  propriétaire, passe nº 356 — voir « Les images officielles » plus bas) :
  plus AUCUNE exclusion d'image ;
- avant livraison, vérifier avec `unzip -l` que la racine est bien le numéro
  de la passe et que ni `node_modules`, ni `.next`, ni `.git`, ni le journal
  `.ndjson` n'y figurent — et que les images de `public/` Y FIGURENT ;
- ne JAMAIS exclure `.env.local` du zip (voir « Inclure `.env.local` dans
  chaque livraison » ci-dessous) : il doit TOUJOURS être livré.

# Inclure `.env.local` dans chaque livraison (règle permanente)

À CHAQUE livraison, le fichier `.env.local` DOIT être INCLUS dans le zip,
exactement comme avant. Ne JAMAIS l'ajouter aux exclusions du `zip -x`, ne
JAMAIS le remplacer par le seul `.env.local.example`.

- c'est un choix explicite et éclairé du propriétaire : il préfère cette
  commodité au risque de sécurité associé (ne pas avoir à recopier le
  fichier à la main à chaque livraison) ;
- la règle vaut pour TOUTES les futures livraisons — aucune session ne doit
  la remettre en cause « par prudence » ;
- après `unzip -l`, vérifier que `.env.local` figure bien dans le zip (en
  plus de `.env.local.example`).

# Livraisons SANS captures d'écran (règle permanente)

Ne plus générer ni joindre de captures d'écran destinées au propriétaire :
ni envoyées dans la conversation, ni incluses dans les zips de livraison.
Les vérifications visuelles automatisées (tests de mise en page Playwright,
mesures de pixels) restent autorisées comme outil de travail interne si
utiles, mais AUCUNE image ne doit être produite pour le propriétaire ni
envoyée avec une livraison : il valide lui-même visuellement sur son
environnement.

# Les images officielles de `public/` (règle mise à jour, passe nº 356)

L'ANCIENNE règle excluait des zips toutes les images déposées à la main et
demandait au propriétaire de les recopier après chaque extraction. LE
PROPRIÉTAIRE L'A REMPLACÉE (message du 18-08-2026, avant la passe nº 356) :

1. **LES IMAGES SONT INCLUSES dans chaque zip livré**, à leur emplacement
   exact dans `public/`, pour qu'il n'ait plus rien à recopier. Les versions
   du dépôt font foi ; il a confirmé comme OFFICIELLES les quatre qu'il a
   rejointes ce jour-là : `yokofolio-icone.png`, `yokofolio-logo.png`,
   `adresse.png`, `ajouter-une-photo.png`.
2. **TOUJOURS INTERDIT, et sans changement** : les modifier, les recréer,
   les régénérer, les recadrer, les compresser, ou en DEVINER le contenu
   pour fabriquer une variante (favicon.ico, apple-touch-icon, copie sous un
   autre nom…). Si une variante technique est nécessaire, la DEMANDER.
3. **Si une image de la liste est ABSENTE du clone, ne pas la recréer** — la
   dire absente dans le compte rendu, c'est tout. État au 18-08-2026 :
   `public/icone-partage.png` est absente du clone, ainsi que
   `public/images/roswel-logo.png` et `public/images/roswel-icone.png` (les
   logos du produit artisans) — le propriétaire les fournira s'il les veut
   dans les zips.
4. La liste des images officielles de `public/`, à jour :

    public/yokofolio-logo.png      public/yokofolio-icone.png
    public/icone-partage.png       public/icone-instagram.png
    public/icone-tiktok.png        public/icone-youtube.png
    public/icone-world.png         public/adresse.png
    public/site.png                public/ajouter-une-photo.png

`ajouter-une-photo.png` (passe nº 111) est un appareil photo au trait fin
marqué d'un plus : il remplace « ronde » dans le cercle du profil et
« + Ajouter » dans une case vide de galerie (`IconeAjouterPhoto`).

Les glyphes (adresse, site, partage, réseaux, ajouter-une-photo) sont des
GLYPHES NOIRS sur fond transparent : le code les éclaircit par `invert` +
opacité (jamais en retouchant le fichier) pour qu'ils se lisent sur
l'anthracite.

Le code référence les logos roswel uniquement par leurs deux chemins
(`/images/roswel-logo.png`, `/images/roswel-icone.png`) — composants
`LogoIcone` / `LogoComplet` dans `src/components/Logo.tsx`, favicon dans
`src/app/layout.tsx`, icônes PWA dans `src/app/manifest.ts`, page
`public/offline.html`.
