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
- LE SCRIPT DE DÉPLOIEMENT `d` EST INCLUS DANS CHAQUE ZIP (règle du
  propriétaire, passe nº 503), au même titre que les deux images de marque.
  C'est lui qui déploie en production sans poser de question ; le propriétaire
  tape `sh d` dans le dossier dézippé, et rien d'autre. Ne jamais l'exclure,
  ne jamais le renommer. Le rendre exécutable avant de zipper (`chmod +x d`) ;
- LE FICHIER DE LIAISON `.vercel/project.json`, LUI, N'EST PAS DANS LE DÉPÔT
  (il est dans `.gitignore` depuis toujours) : il ne peut donc pas être inclus
  dans le zip. Ce n'est pas un oubli — c'est le script `d` qui le fabrique
  tout seul au premier lancement dans un dossier neuf, sans question. Si un
  jour ce fichier apparaît dans le clone, l'OUVRIR AVANT de l'inclure et
  vérifier qu'il ne porte qu'un `projectId` et un `orgId` : s'il contient un
  jeton ou une clé, NE PAS L'INCLURE ;
- LE SCRIPT `livre` EST INCLUS DANS CHAQUE ZIP (règle du propriétaire,
  passe nº 697), au même titre que `d`. C'est LUI que le propriétaire tape
  désormais, et rien d'autre : `sh livre 698.zip` depuis le dossier de
  téléchargement. Il dézippe, remet la clé secrète en place depuis
  `~/.yokofolio/env.local`, lance `sh d`, et se met à jour tout seul à
  partir de la livraison qu'il vient d'ouvrir. Le rendre exécutable avant
  de zipper (`chmod +x livre`) ;
- avant livraison, vérifier avec `unzip -l` que la racine est bien le numéro
  de la passe et que ni `node_modules`, ni `.next`, ni `.git`, ni le journal
  `.ndjson` n'y figurent — et que les images de `public/`, le script `d` ET
  le script `livre` Y FIGURENT ;
- ne JAMAIS exclure `.env.local` du zip (voir « Inclure `.env.local` dans
  chaque livraison » ci-dessous) : il doit TOUJOURS être livré.

# Inclure `.env.local` dans chaque livraison (règle mise à jour, passe nº 697)

À CHAQUE livraison, le fichier `.env.local` DOIT être INCLUS dans le zip.
Ne JAMAIS l'ajouter aux exclusions du `zip -x`, ne JAMAIS le remplacer par
le seul `.env.local.example`.

- CE QUI A CHANGÉ À LA nº 697, ET C'EST LE POINT : **la clé secrète n'y est
  plus**. La ligne `SUPABASE_SECRET_KEY=` est livrée VIDE, précédée du
  commentaire qui dit pourquoi. Toutes les autres variables restent, comme
  avant. La clé a été régénérée et vit désormais à UN seul endroit, sur le
  Mac du propriétaire : `~/.yokofolio/env.local`. Elle n'entre plus jamais
  ni dans un zip, ni dans l'atelier ;
- l'ANCIENNE justification (« il préfère cette commodité au risque de
  sécurité associé ») ne vaut plus : le script `livre` supprime la
  contrainte sans le risque — le propriétaire n'a toujours rien à recopier,
  et la clé ne voyage plus ;
- la règle vaut pour TOUTES les futures livraisons — aucune session ne doit
  la remettre en cause dans un sens ou dans l'autre ;
- après `unzip -l`, vérifier que `.env.local` figure bien dans le zip (en
  plus de `.env.local.example`), ET que sa ligne `SUPABASE_SECRET_KEY=` y
  est vide (`unzip -p N.zip N/.env.local | grep -c '^SUPABASE_SECRET_KEY=$'`
  doit rendre 1 — c'est la SEULE lecture autorisée de ce fichier, et elle
  ne montre aucune valeur).

# NE JAMAIS AFFICHER LE CONTENU DE `.env.local` (interdiction permanente, nº 697)

Ne JAMAIS afficher, citer, recopier ni consigner le contenu de `.env.local`
— ni dans la conversation, ni dans un compte rendu, ni dans un fichier, ni
dans un journal, ni dans un message de commit. Cela vaut pour ce fichier et
pour `~/.yokofolio/env.local`.

- pas de `cat`, `head`, `tail`, `less`, ni de `Read` sur ces fichiers ;
- pour connaître les NOMS des variables, lire `.env.local.example` (public,
  dans le dépôt) — jamais le fichier réel ;
- pour vérifier qu'une variable est remplie, employer `grep -c` ou
  `grep -q`, qui répondent par un nombre ou par oui/non sans montrer la
  ligne. Jamais `grep` tout court ;
- pour modifier une ligne, opérer À L'AVEUGLE (`sed -i`, ou un script qui
  écrit sans imprimer) et n'annoncer qu'un décompte ;
- la règle vaut pour TOUTES les passes futures, sans exception et sans
  qu'il soit besoin de la rappeler dans le prompt.

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
4. **LES DEUX IMAGES DE MARQUE SONT TOUJOURS DANS LE ZIP** (règle du
   propriétaire, passe nº 467) : `public/yokofolio-logo.png` et
   `public/yokofolio-icone.png`, à chaque livraison, sans exception. Il en
   a fourni de NOUVELLES VERSIONS à la nº 467 (logo 1590 × 336, icône
   300 × 336) : ce sont elles qui font foi.
5. **CINQ IMAGES ONT ÉTÉ SUPPRIMÉES DU PROJET** (passe nº 467, sur ordre du
   propriétaire) : `site.png`, `icone-instagram.png`, `icone-tiktok.png`,
   `icone-youtube.png`, `icone-world.png`. Elles ne servaient plus (les
   icônes de liens sont DESSINÉES dans le code depuis la nº 240-§1) ; le
   composant mort `IconeWorld` est parti avec elles. Ne pas les recréer, ne
   pas s'étonner de leur absence.
6. La liste des images officielles de `public/`, à jour (nº 467) :

    public/yokofolio-logo.png      public/yokofolio-icone.png
    public/icone-partage.png       public/adresse.png
    public/ajouter-une-photo.png

`ajouter-une-photo.png` (passe nº 111) est un appareil photo au trait fin
marqué d'un plus : il remplace « ronde » dans le cercle du profil et
« + Ajouter » dans une case vide de galerie (`IconeAjouterPhoto`).

Les glyphes restants (adresse, partage, ajouter-une-photo) sont des GLYPHES
NOIRS sur fond transparent : le code les éclaircit par `invert` + opacité
(jamais en retouchant le fichier) pour qu'ils se lisent sur le fond sombre
(le bleu nuit `#0B0F14` depuis la nº 466).

Le code référence les logos roswel uniquement par leurs deux chemins
(`/images/roswel-logo.png`, `/images/roswel-icone.png`) — composants
`LogoIcone` / `LogoComplet` dans `src/components/Logo.tsx`, favicon dans
`src/app/layout.tsx`, icônes PWA dans `src/app/manifest.ts`, page
`public/offline.html`.

# Traductions et corrections de textes : LES DONNÉES EN BASE EN FONT PARTIE (règle du propriétaire, passe nº 808)

Après la traduction 3/3 (nº 806), deux styles acceptés depuis l'admin
sont restés en français À L'ÉCRAN parce que leurs libellés vivent en
base (`suggestions_style.label`), pas dans le code — et le propriétaire
l'a découvert lui-même. Cela ne doit JAMAIS se reproduire :

- toute passe de traduction ou de correction de textes recense
  D'OFFICE ce qui s'affiche depuis la base : `suggestions_style.label`
  (les styles acceptés), et tout autre texte saisi par l'administration
  ou par les artistes que l'écran montre tel quel ;
- le SQL de relecture ET de correction est LIVRÉ AVEC LA PASSE, dans
  un document `docs/SQL-<nº>-….md` (modèle : `docs/SQL-807-STYLES-
  AJOUTES.md`) — jamais exécuté par la passe, toujours collé à la main
  par le propriétaire ; le compte rendu le nomme ;
- le compte rendu dit en clair « ces textes vivent en base, voici le
  SQL » — pas « rien à réécrire » sans avoir lu ce que la base peut
  contenir ;
- et quand la base change, le site ne suit pas seul : la liste des
  styles est cuite dans les pages mises en cache (voir
  `rafraichirToutLeSite`, `src/lib/rafraichir.ts`). Un geste depuis
  l'admin invalide tout ; une écriture SQL attend la revalidation (cinq
  minutes) — le document SQL le dit, le compte rendu aussi.
