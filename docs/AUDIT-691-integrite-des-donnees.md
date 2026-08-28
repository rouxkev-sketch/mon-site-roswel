# Audit nº 691 — l'intégrité des données

*Passe de MESURE. Aucune correction, aucun changement au site ni aux
outils. Ce document est le livrable.*

**Méthode.** Lecture du schéma (toutes les clés étrangères), lecture de
tous les chemins de suppression du code, puis épreuve au banc contre la
doublure. Chaque ligne du tableau dit si elle est **prouvée au banc**
ou **établie par lecture** — et, quand le banc n'a pas pu trancher,
quelle mesure le ferait.

---

## 1 · L'inventaire des cycles de vie

| Objet | Naît | Change | Disparaît |
|---|---|---|---|
| **Compte** | inscription (navigateur) | identité, mot de passe | demande différée (21 j, `suppressions_comptes`) → purge cron · ou suppression immédiate côté artisans (`/api/compte/supprimer`) |
| **Portfolio** | formulaire → `en_attente` | validation · modifications demandées · hors ligne · brouillon | demande différée (30 j, `supprime_le`+`purge_le`) → purge cron · suppression admin immédiate (nº 675) · cascade de la purge du compte |
| **Photos** (lignes) | dépôt dans le formulaire | ordre, style, rendu, `en_attente` | retrait dans le formulaire · cascade du portfolio |
| **Photos** (fichiers) | téléversement Storage | — | **rien ne les retire, sauf la purge d'un compte** (voir R1) |
| **Favoris de photo** | cœur | — | cascade compte · cascade photo |
| **Suivis** | bouton Suivre | — | cascade compte · cascade portfolio |
| **Notifications** | décisions admin, bienvenue | lue / tout lu | cascade compte ; `fiche_id` → `null` si le portfolio part |
| **Signalements** | formulaire visiteur | traité | jamais (pas de clé étrangère, par choix) |
| **Suggestions de style** | tatoueur | acceptée / refusée | `user_id` et `fiche_id` → `null` |
| **Rattachements** artiste↔salon | immédiat | — | cascade des deux côtés |
| **Clics / popularité** | visite de fiche | — | jamais (clé par *slug*, par choix) |
| **Démarchage** | admin | états | cascade du portfolio ; `rattache_a` → `null` |

**Le socle est sain.** Les clés étrangères couvrent tout ce qui doit
l'être : `cascade` là où la donnée n'a plus de sens seule,
`set null` là où la trace doit survivre. Les défauts trouvés sont
**au-dessus** de la base — dans le code, et dans un endroit que la base
ne connaît pas : le **stockage des fichiers**.

---

## 2 · Le tableau des cas

| # | Cas | Comportement constaté | Gravité |
|---|---|---|---|
| **R1** | Un portfolio est supprimé (purge 30 j **ou** suppression admin) | **Aucune photo n'est effacée du stockage.** Le ménage ne garde que les fichiers dont le nom contient l'identifiant du portfolio — or le nom est `<compte>/<style>-<horodatage>-<rang>.jpg` : il ne le contient **jamais**. *Prouvé au banc : la doublure voit le `list`, puis la suppression de la ligne, et **aucun `DELETE` d'objet**.* | 🔴 |
| **R2** | Un portfolio est en suppression différée (30 j) — ou le compte entier l'est | La fiche reste `publie = true` : elle disparaît du public (`estEnLigne`) mais **reste dans « Ma sélection » et dans les suivis des autres**, carte et photo comprises. Le lien mène à « Ce portfolio n'est pas encore en ligne » — un message faux, en plus d'être un lien mort. *Prouvé au banc.* | 🔴 |
| **R3** | Un tatoueur supprime son compte depuis l'écran **artisans** (`/api/compte/supprimer`) | Ce chemin nettoie `photos-artisans` et `photos-messages`, **pas `photos-tatoueurs`**. Les comptes sont partagés entre les deux produits : tout le portfolio reste dans le seau public. *Par lecture.* | 🔴 |
| **R4** | Un compte a plus de **100 fichiers** dans le stockage | Les trois nettoyages appellent `list()` **sans options** ; le client Supabase plafonne à 100 (`DEFAULT_SEARCH_OPTIONS.limit = 100`, vérifié dans le paquet installé). Au-delà, le reste survit à la purge. *Par lecture du paquet installé.* | 🟠 |
| **R5** | Une photo est retirée du portfolio par son propriétaire | La ligne part de `photos_tatoueur` ; **le fichier reste dans le stockage**. Un portfolio remanié dix fois laisse dix jeux de photos. *Par lecture.* | 🟠 |
| **R6** | Le compte a plus de **50 notifications** | La boîte lit les 50 dernières puis pose la bienvenue si elle ne la voit pas. Or la bienvenue est **la plus ancienne** : passé 50, elle sort de la fenêtre → **une bienvenue de plus à chaque ouverture**. *Par lecture ; **non reproduit au banc** — la doublure n'honore ni `order` ni `limit` sur ce chemin. La mesure qui trancherait : un compte réel à plus de 50 nouvelles, ou une doublure qui trie et limite.* | 🟠 |
| **R7** | L'admin **valide** un portfolio dont la suppression est demandée | « Valider » écrit `publie`, `statut`, `hors_ligne` — **jamais `supprime_le`**. Résultat : une fiche « validée » qui reste invisible, une notification « Portfolio en ligne » qui ment, et une purge qui l'effacera à l'échéance. *Par lecture.* | 🟠 |
| **R8** | L'admin supprime un portfolio pendant que la personne l'édite | L'enregistrement vise une ligne qui n'existe plus : PostgREST rend 200 et zéro ligne touchée. Le formulaire annonce « envoyé ». *Par lecture.* | 🟠 |
| **R9** | Un portfolio est purgé, la personne ne rouvre pas « Mon espace » | L'en-tête garde la photo et le nom du portfolio disparu jusqu'à la première ouverture du menu (c'est là que le rattrapage nº 675 tourne). Se répare seul, mais se voit. *Par lecture.* | 🟠 |
| **R10** | Un portfolio est signalé, puis supprimé | `signalements_fiches` est clé par *slug*, sans clé étrangère : le signalement reste, et son lien `/tatoueur/<slug>` ne mène plus nulle part. **Choix assumé et documenté** (« une fiche supprimée ne doit pas emporter la trace »). | 🟠 |
| **R11** | Un portfolio est supprimé puis un autre reprend le même slug | `clics_fiches` est clé par *slug* : le nouveau **hérite de la popularité de l'ancien**. **Choix assumé et documenté**, mais il vaut d'être connu. | 🟠 |
| **R12** | Un salon disparaît, un artiste y déclarait un mode d'exercice | `modes_exercice.salon_id` → `null` : le mode reste, sans salon. L'affichage retombe sur « aucun salon » sans casser. | 🟠 |
| **R13** | La page d'un portfolio absent | Rend **HTTP 200** avec « Ce portfolio n'est pas encore en ligne » ; l'onglet, lui, dit « Tatoueur introuvable ». Le 200 est un choix documenté (nº 176-§3) ; les deux textes se contredisent. | 🟠 |
| V1 | Suppression d'un compte (chemin YokoFolio) | Photos du dossier retirées, compte effacé, portfolios et tables liées en cascade. | 🟢 |
| V2 | Annulation d'une suppression de compte | Ne ressuscite que ce que la suppression du compte avait couché (`is purge_le null`) : une fiche supprimée à part garde son échéance. Écriture soignée. | 🟢 |
| V3 | Favoris et suivis d'un portfolio **purgé** | Partent en cascade. Aucun favori mort après une purge. | 🟢 |
| V4 | Compteurs (cœurs, abonnés, popularité) | **Aucun compteur stocké** : tout est calculé à la lecture (vues `coeurs_par_photo`, `popularite_tatoueurs`). Rien ne peut dériver. | 🟢 |
| V5 | Notifications d'un portfolio supprimé | `fiche_id` → `null`, `fiche_nom` survit : la nouvelle reste lisible. C'est ce qui rend la nº 688 possible. | 🟢 |
| V6 | Un portfolio en suppression différée dans la **recherche** | Le RPC filtre `supprime_le is null`. Invisible, comme il faut. | 🟢 |

---

## 3 · Les cinq corrections, par importance

1. **R1 + R3 + R4 + R5 — le stockage ne se nettoie jamais vraiment.**
   Quatre fuites, une seule cause : **le chemin d'un fichier ne dit pas
   à quel portfolio il appartient**, et le ménage travaille sur les noms
   de fichiers au lieu de travailler sur les lignes. Le remède est le
   même pour les quatre : effacer d'après `photos_tatoueur.url`, lues
   **avant** de supprimer les lignes. C'est de loin le premier chantier
   — c'est un seau public qui grossit sans fin, avec des photos que
   leurs auteurs croient supprimées.
2. **R2 — les listes personnelles ignorent la suppression différée.**
   « Ma sélection » et les suivis filtrent `publie`, quand tout le reste
   du site filtre `estEnLigne`. Une seule règle partout, et le lien mort
   disparaît.
3. **R6 — la bienvenue repose sans fin au-delà de 50 nouvelles.**
   Chercher la bienvenue par une lecture qui la vise (`genre = bienvenue`,
   `limit 1`) au lieu de la chercher dans les 50 dernières.
4. **R7 + R8 — deux décisions qui se croisent, et personne ne le voit.**
   Valider devrait refuser (ou lever) une suppression en cours ;
   enregistrer devrait dire quand aucune ligne n'a été touchée.
5. **R13 + R9 — ce que la personne lit ne correspond pas à ce qui est.**
   Deux textes qui se contredisent sur la même page, et un en-tête qui
   garde l'image d'un portfolio disparu jusqu'à la prochaine ouverture
   du menu.

R10, R11 et R12 sont des **choix assumés**, écrits dans le code. Ils
restent dans ce tableau pour être connus, pas pour être corrigés.

---

## 4 · Ce que ce banc n'a pas pu établir

- **R6** n'est pas reproduit : la doublure n'honore ni `order` ni
  `limit` sur la lecture des nouvelles. La lecture du code est
  univoque, mais ce n'est pas une mesure.
- **R1 est prouvé au banc** avec le nommage réel des fichiers, mais la
  doublure ne cascade pas les clés étrangères (c'est la vraie base qui
  le fait) : le nombre de lignes `photos_tatoueur` restantes après une
  suppression, au banc, ne juge donc pas le site.
- Aucune mesure n'a pu être faite contre la **vraie base** : l'atelier
  n'a aucun accès réseau sortant.
