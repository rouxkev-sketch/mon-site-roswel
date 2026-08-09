<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Livraisons zip (règle permanente et non négociable)

Une extraction a déjà ÉCRASÉ le dossier de travail du propriétaire parce que
le zip livré contenait un dossier racine nommé `mon-site-roswel`, identique
au sien. Pour que cela ne se reproduise JAMAIS :

- chaque zip livré doit avoir un dossier racine à nom UNIQUE, daté et
  versionné : `roswel-AAAA-MM-JJ-<sujet-court>`
  (ex. `roswel-2026-07-15-corrections-moteur`) ;
- JAMAIS deux livraisons avec le même nom — si deux livraisons ont lieu le
  même jour, ajouter un suffixe (`-2`, `-3`…) ;
- JAMAIS le nom `mon-site-roswel` (ni comme racine du zip, ni comme nom de
  fichier zip) ;
- le fichier zip porte le même nom que son dossier racine ;
- technique : créer un lien symbolique au nom de la livraison puis zipper à
  travers ce lien (zip suit les liens par défaut), en gardant TOUTES les
  exclusions habituelles :

      ln -s /chemin/du/projet /tmp/roswel-AAAA-MM-JJ-sujet
      cd /tmp && zip -r roswel-AAAA-MM-JJ-sujet.zip roswel-AAAA-MM-JJ-sujet \
        -x "*/node_modules/*" -x "*/.next/*" -x "*/.git/*" \
        -x "*/public/images/roswel-logo.png" \
        -x "*/public/images/roswel-icone.png"

- avant livraison, vérifier avec `unzip -l` que la racine est bien le nom
  daté et que ni `node_modules`, ni `.git`, ni les deux logos n'y figurent.
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

# Fichiers INTOUCHABLES — logos définitifs (règle stricte, non négociable)

`public/images/roswel-logo.png` et `public/images/roswel-icone.png` sont les
logos DÉFINITIFS, déposés à la main par le propriétaire du projet et lui
appartenant EXCLUSIVEMENT. Ils sont intouchables, exactement comme
`.env.local`. Cette règle s'applique à TOUTES les futures livraisons, aucune
session ne doit la remettre en cause :

1. **JAMAIS dans les zips livrés.** Toujours EXCLURE `roswel-icone.png` et
   `roswel-logo.png` au moment de l'archivage (comme `.env.local`), même si on
   les voit passer dans l'environnement de travail :
   `-x "*/public/images/roswel-logo.png" -x "*/public/images/roswel-icone.png"`.
   Vérifier avec `unzip -l` qu'ils n'y figurent pas.
2. **JAMAIS les modifier, recréer, régénérer, recadrer ni compresser.** Ne
   JAMAIS proposer d'« en générer une nouvelle version » ni d'« ajuster le
   design ». Ils sont intouchables, point.
3. **JAMAIS deviner leur contenu pour créer des variantes** (favicon.ico,
   apple-touch-icon, autre nom, autre dossier, copie dans `src/app/`…). Si une
   variante technique est nécessaire, la DEMANDER au propriétaire — ne jamais
   la fabriquer soi-même.
4. **Le propriétaire les recopie à la main** depuis son ordinateur à chaque
   nouveau zip : c'est la SEULE façon dont ils entrent dans le projet. S'ils
   sont absents du clone (ils ne sont pas toujours poussés sur GitHub), ne pas
   les recréer.

Le code doit les référencer uniquement par ces deux chemins
(`/images/roswel-logo.png`, `/images/roswel-icone.png`) — composants
`LogoIcone` / `LogoComplet` dans `src/components/Logo.tsx`, favicon dans
`src/app/layout.tsx`, icônes PWA dans `src/app/manifest.ts`, page
`public/offline.html`.

## La même règle vaut pour TOUTES les images déposées à la main

Le propriétaire recopie aussi d'autres fichiers dans `public/`. Ils suivent
EXACTEMENT les quatre points ci-dessus — jamais dans un zip, jamais modifiés,
jamais devinés, recopiés à la main. La liste, à jour :

    public/yokofolio-logo.png      public/yokofolio-icone.png
    public/icone-partage.png       public/icone-instagram.png
    public/icone-tiktok.png        public/icone-youtube.png
    public/icone-world.png         public/adresse.png
    public/site.png                public/ajouter-une-photo.png

`ajouter-une-photo.png` (passe nº 111) est un appareil photo au trait fin
marqué d'un plus : il remplace « ronde » dans le cercle du profil et
« + Ajouter » dans une case vide de galerie (`IconeAjouterPhoto`).

Ce sont des GLYPHES NOIRS sur fond transparent : le code les éclaircit par
`invert` + opacité (jamais en retouchant le fichier) pour qu'ils se lisent sur
l'anthracite. Chacune doit figurer dans les exclusions du `zip -x`, et
`unzip -l` doit le confirmer.
