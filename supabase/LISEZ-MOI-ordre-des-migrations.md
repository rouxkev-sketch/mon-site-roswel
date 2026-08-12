# Dans quel ordre passer les migrations

Les 62 fichiers de ce dossier se passent **dans cet ordre**, de haut en
bas. L'ordre n'est pas deviné : il est écrit dans les en-têtes des
fichiers eux-mêmes (« à passer APRÈS … »), et il a été **vérifié en
rejouant les fichiers sur une base PostgreSQL vierge**, chacun DEUX
FOIS (les 44 premiers ; les suivants ont été vérifiés à leur
livraison).

## Avant tout : savoir où on en est

Passe d'abord `yokofolio-verification-migrations.sql` dans l'éditeur SQL
de Supabase. Il n'écrit rien et répond, en une exécution, quelles
migrations sont passées et lesquelles manquent — avec la liste précise
de ce qui manque. Tu ne repasses ensuite que les lignes ❌ et ⚠️,
de haut en bas.

## Repasser un fichier déjà appliqué ne casse rien

Tous sont **relançables** : colonnes en `if not exists`, contraintes
refaites par `drop … if exists` puis `add`, index en `if not exists`,
lignes de démonstration écrites par `slug` (donc jamais en double).
Vérifié fichier par fichier, deux passages chacun, sans une erreur.
(⚠️ La nº 48 vide la table des photos à chaque passage — c'est voulu
et documenté dans son en-tête : fiches de test uniquement.)

## ⚠️ L'éditeur Supabase exécute tout le fichier en UNE transaction

Si une seule ligne échoue, **tout le fichier est annulé** — y compris ce
qui avait déjà réussi. Un fichier qui affiche une erreur n'a donc rien
laissé derrière lui : il n'y a rien à nettoyer, on corrige et on
repasse.

## L'ordre

| nº | fichier | ce qu'il crée |
|---:|---|---|
| 1 | `tatoueurs.sql` | 15 colonnes, 5 index, 1 politique, 1 table |
| 2 | `yokofolio-photos-par-style.sql` | 2 colonnes, 1 contrainte |
| 3 | `yokofolio-styles-adresse.sql` | 2 colonnes |
| 4 | `yokofolio-bio.sql` | 1 colonne, 1 contrainte |
| 5 | `yokofolio-fiches-tatoueurs.sql` | 2 colonnes, 1 contrainte, 1 index, 6 politiques |
| 6 | `yokofolio-site-web.sql` | 1 colonne |
| 7 | `yokofolio-popularite.sql` | 5 colonnes, 2 index, 1 table, 1 vue |
| 8 | `yokofolio-dix-huit-styles.sql` | aucun objet (met à jour des lignes) |
| 9 | `yokofolio-filtres.sql` | 2 colonnes |
| 10 | `yokofolio-moderation.sql` | 3 colonnes, 1 contrainte |
| 11 | `yokofolio-signalements.sql` | 6 colonnes, 1 index, 1 table |
| 12 | `yokofolio-contact.sql` | 7 colonnes, 1 index, 1 table |
| 13 | `yokofolio-bio-150.sql` | 1 contrainte |
| 14 | `yokofolio-signalement-note.sql` | 1 colonne |
| 15 | `yokofolio-fiche-brouillon.sql` | 2 colonnes, 1 declencheur, 1 fonction, 1 politique |
| 16 | `yokofolio-vingt-deux-styles.sql` | aucun objet (met à jour des lignes) |
| 17 | `yokofolio-grandes-pieces.sql` | aucun objet (met à jour des lignes) |
| 18 | `yokofolio-hors-ligne.sql` | 1 colonne, 1 contrainte |
| 19 | `yokofolio-localisation-mondiale.sql` | 4 colonnes, 2 index |
| 20 | `yokofolio-fiches-internationales.sql` | aucun objet (met à jour des lignes) |
| 21 | `yokofolio-type-mode-exercice.sql` | 6 colonnes, 2 contraintes, 1 fonction, 1 index |
| 22 | `yokofolio-suppression-differee.sql` | 5 colonnes, 2 index, 1 table, 1 vue |
| 23 | `yokofolio-delai-30-jours.sql` | aucun objet (met à jour des lignes) |
| 24 | `yokofolio-fiches-multiples.sql` | 1 colonne, 2 index, 3 politiques, 1 vue |
| 25 | `yokofolio-notifications.sql` | 10 colonnes, 2 index, 2 politiques, 1 table |
| 26 | `yokofolio-modes-et-liaisons.sql` | 43 colonnes, 6 contraintes, 9 index, 8 politiques, 3 tables, 2 vues |
| 27 | `yokofolio-annonce-vue.sql` | 1 colonne |
| 28 | `yokofolio-verrou-exercice.sql` | 3 colonnes, 1 declencheur, 1 fonction, 1 index |
| 29 | `yokofolio-debloquer-fiches-existantes.sql` | aucun objet (met à jour des lignes) |
| 30 | `yokofolio-demos-nouveau-modele.sql` | 1 vue |
| 31 | `yokofolio-portfolio-catalogue.sql` | 10 colonnes, 2 contraintes, 6 index, 2 politiques, 1 table |
| 32 | `yokofolio-recherche-en-base.sql` | 4 fonctions, 8 index, 1 vue |
| 33 | `yokofolio-studio-horaires.sql` | 3 colonnes, 4 contraintes |
| 34 | `yokofolio-youtube.sql` | 1 colonne |
| 35 | `yokofolio-filtres-besoins-rendu.sql` | 1 fonction |
| 36 | `yokofolio-formulaire-demande.sql` | 1 colonne |
| 37 | `yokofolio-etablissement-prive.sql` | 1 colonne, 1 contrainte, 1 index |
| 38 | `yokofolio-profil-et-modes.sql` | 1 fonction (la recherche, refaite) |
| 39 | `yokofolio-liaisons-immediates.sql` | 1 contrainte (aucun objet neuf) |
| 40 | `yokofolio-rayon-domicile.sql` | 1 colonne, 1 contrainte |
| 41 | `yokofolio-nature-lieu-guest.sql` | 1 colonne, 1 contrainte |
| 42 | `yokofolio-tous-les-lieux.sql` | 1 fonction, 3 vues, 9 index |
| 43 | `yokofolio-fiche-admin-publique.sql` | 1 colonne, 1 index, 1 fonction |
| 44 | `yokofolio-role-studio-prive.sql` | aucun objet (desserre 1 contrainte) |
| 45 | `yokofolio-politique-rattachements.sql` | aucun objet (remplace 1 politique) |
| 46 | `yokofolio-page-de-liens.sql` | 1 colonne |
| 47 | `yokofolio-suppression-formulaire-demande.sql` | aucun objet (supprime 1 colonne) |
| 48 | `yokofolio-fin-des-zones.sql` | aucun objet (vide les photos, supprime 1 colonne, 2 index, resserre 1 contrainte) |
| 49 | `yokofolio-flash-nature-photo.sql` | 1 colonne, 1 contrainte, 1 index, 1 fonction (la recherche, refaite — **et réparée**) |
| 50 | `yokofolio-styles-de-a-a-z.sql` | aucun objet (élargit le catalogue de styles) |
| 51 | `yokofolio-liens-libres.sql` | 2 colonnes |
| 52 | `yokofolio-suggestions-styles.sql` | 1 table, 2 index, 4 politiques |
| 53 | `yokofolio-favoris-photos.sql` | 1 table, 2 index, 4 politiques |
| 54 | `yokofolio-tatoueurs-suivis.sql` | 1 table, 2 index, 4 politiques |
| 55 | `yokofolio-portfolios-repris.sql` | aucun objet (catalogue les photos que la nº 31 avait laissées) |
| 56 | `yokofolio-recherche-styles-declares.sql` | 1 fonction (la recherche, refaite — **et réparée**) |
| 57 | `yokofolio-catalogue-complet.sql` | aucun objet (complète le catalogue, style par style) |
| 58 | `yokofolio-style-avec-photo.sql` | 1 fonction (la recherche, refaite — **un style sans photo n'existe plus**) |
| 59 | `yokofolio-lecture-publique.sql` | 1 fonction, 6 politiques, les droits de lecture du rôle anonyme (**sans elle, le site est invisible à un visiteur non connecté**) |
| 60 | `yokofolio-en-ligne-vraie-regle.sql` | 1 fonction refaite, 2 politiques, 1 contrainte périmée retirée (**corrige la nº 59** : elle exigeait `statut = 'validee'`, et cachait des fiches validées) |
| 61 | `yokofolio-ordre-stable-pagination.sql` | 1 fonction refaite (**l'ordre ne dépend plus de la taille de la page** : sans elle, « Voir plus » remonte des cartes au-dessus de celles déjà affichées) |
| 62 | `yokofolio-popularite-classement.sql` | 1 vue, 1 fonction refaite, 2 index (**les portfolios les plus appréciés remontent** — score calculé sur tout le catalogue AVANT la coupe) |

## Ce que chaque fichier apporte

1. **`tatoueurs.sql`** — L'index des tatoueurs (création de la table)
2. **`yokofolio-photos-par-style.sql`** — Une photo par style, et TikTok
3. **`yokofolio-styles-adresse.sql`** — Styles sans limite, et l'adresse du salon
4. **`yokofolio-bio.sql`** — La bio du tatoueur (présentation libre)
5. **`yokofolio-fiches-tatoueurs.sql`** — Les fiches des vrais tatoueurs (comptes, statut, politiques)
6. **`yokofolio-site-web.sql`** — Le site web du tatoueur (colonne facultative)
7. **`yokofolio-popularite.sql`** — La popularité des fiches (comptage des clics)
8. **`yokofolio-dix-huit-styles.sql`** — Les 18 styles (migration des fiches de démonstration)
9. **`yokofolio-filtres.sql`** — Les filtres secondaires (technique, composition)
10. **`yokofolio-moderation.sql`** — La modération des fiches (motifs de l'admin)
11. **`yokofolio-signalements.sql`** — Les signalements de fiches
12. **`yokofolio-contact.sql`** — Les messages de contact (/contact)
13. **`yokofolio-bio-150.sql`** — La bio passe à 150 caractères maximum
14. **`yokofolio-signalement-note.sql`** — La note de traitement d'un signalement
15. **`yokofolio-fiche-brouillon.sql`** — Modifications en attente + notification
16. **`yokofolio-vingt-deux-styles.sql`** — Les 22 styles
17. **`yokofolio-grandes-pieces.sql`** — Composition réduite à trois entrées
18. **`yokofolio-hors-ligne.sql`** — Mise hors ligne, motifs par champ, bio libre
19. **`yokofolio-localisation-mondiale.sql`** — La localisation devient mondiale
20. **`yokofolio-fiches-internationales.sql`** — Cinq fiches de démonstration hors de France
21. **`yokofolio-type-mode-exercice.sql`** — Type de fiche, mode d'exercice, photo de profil
22. **`yokofolio-suppression-differee.sql`** — La suppression de compte devient différée (21 jours)
23. **`yokofolio-delai-30-jours.sql`** — Le délai de suppression passe à 30 jours
24. **`yokofolio-fiches-multiples.sql`** — Un compte, plusieurs fiches
25. **`yokofolio-notifications.sql`** — Les notifications du compte
26. **`yokofolio-modes-et-liaisons.sql`** — Modes d'exercice cumulatifs, studios multiples
27. **`yokofolio-annonce-vue.sql`** — L'annonce ne se dit qu'une fois
28. **`yokofolio-verrou-exercice.sql`** — Le verrou du bloc 1 (type de fiche et lieux)
29. **`yokofolio-debloquer-fiches-existantes.sql`** — Débloquer les fiches prises au piège du verrou
30. **`yokofolio-demos-nouveau-modele.sql`** — Les fiches de démonstration, au nouveau modèle
31. **`yokofolio-portfolio-catalogue.sql`** — Le portfolio catalogué (photos taguées)
32. **`yokofolio-recherche-en-base.sql`** — La recherche passe en base
33. **`yokofolio-studio-horaires.sql`** — Le quatrième mode, le sous-choix « en studio », les horaires
34. **`yokofolio-youtube.sql`** — La chaîne YouTube d'une fiche
35. **`yokofolio-filtres-besoins-rendu.sql`** — Les filtres « besoins » et « rendu »
36. **`yokofolio-formulaire-demande.sql`** — Le formulaire de demande d'une fiche
37. **`yokofolio-etablissement-prive.sql`** — Le studio privé, une nature d'établissement
38. **`yokofolio-profil-et-modes.sql`** — Filtres séparés (profil / lieu d'exercice), flash et bodysuit
39. **`yokofolio-liaisons-immediates.sql`** — Les rattachements deviennent immédiats, sans validation
40. **`yokofolio-rayon-domicile.sql`** — Le rayon de déplacement du mode « à domicile »
41. **`yokofolio-nature-lieu-guest.sql`** — Salon ou studio privé, pour une session guest
42. **`yokofolio-tous-les-lieux.sql`** — La recherche connaît TOUS les lieux d'une fiche
43. **`yokofolio-fiche-admin-publique.sql`** — L'interrupteur « fiche d'essai en ligne »
44. **`yokofolio-role-studio-prive.sql`** — Un studio privé peut dire son rôle (fondateur / résident)
45. **`yokofolio-politique-rattachements.sql`** — La politique des rattachements rattrape le produit
46. **`yokofolio-page-de-liens.sql`** — Le site et la page de liens se séparent
47. **`yokofolio-suppression-formulaire-demande.sql`** — Le « formulaire de demande » s'en va
48. **`yokofolio-fin-des-zones.sql`** — Les zones du corps quittent le portfolio (photos de test effacées, rendu obligatoire)
49. **`yokofolio-flash-nature-photo.sql`** — Le flash devient une nature de photo (⚠️ **répare la recherche**, cassée par la nº 48)
50. **`yokofolio-styles-de-a-a-z.sql`** — Les trente-huit styles, et les démonstrations au diapason
51. **`yokofolio-liens-libres.sql`** — Les titres du site et de la page de liens
52. **`yokofolio-suggestions-styles.sql`** — Les styles proposés par les tatoueurs (⚠️ une ligne **acceptée** EST un style du site)
53. **`yokofolio-favoris-photos.sql`** — Les photos enregistrées (le cœur)
54. **`yokofolio-tatoueurs-suivis.sql`** — Les tatoueurs suivis (« Suivre »)
55. **`yokofolio-portfolios-repris.sql`** — Les portfolios que la nº 31 avait oubliés (⚠️ **sans elle, aucun cœur ne s'affiche** sur les fiches dont les images vivent dans `photo_principale`. Les photos reprises reçoivent le rendu **noir et gris** : la colonne est obligatoire depuis la nº 48, et c'est le choix qui se trompe le moins — voir l'en-tête du fichier pour le corriger au cas par cas)
56. **`yokofolio-recherche-styles-declares.sql`** — La recherche par style réparée (⚠️ **sans elle, chercher un style depuis « Explorer » ne remonte qu'une partie des fiches** : le menu envoie toujours une catégorie, et la nature exigeait une photo taguée à la fois du bon style et de la bonne nature. Une fiche qui DÉCLARE un style sans photo encore taguée dessus répond désormais à « Réalisations » ; un flash, lui, se déclare toujours)
57. **`yokofolio-catalogue-complet.sql`** — Le catalogue complété style par style (la nº 55 ne reprenait que les portfolios ENTIÈREMENT vides ; celle-ci comble aussi les fiches qui ont une photo dans un style et en déclarent d'autres — cœurs, photothèque et vignettes suivent)
58. **`yokofolio-style-avec-photo.sql`** — Un style sans photo n'existe plus dans la recherche (la fonction refaite : une fiche ne répond à un style que si une photo le porte)
59. **`yokofolio-lecture-publique.sql`** — Le site redevient visible au public (⚠️ **corrigée par la nº 60 — passer les deux, dans l'ordre** ; **le rôle anonyme n'avait AUCUN droit de lecture** : le site répondait « permission denied », retombait sur les fiches de DÉMONSTRATION, et toute fiche renvoyait un 404 hors connexion). Elle donne ce droit sur les cinq objets d'une fiche publique — et sur eux seuls — et resserre « public » à « EN LIGNE » : publiée, validée, pas en cours de suppression. Le portfolio et les liaisons, jusqu'ici lisibles sans condition, suivent la même règle.
60. **`yokofolio-en-ligne-vraie-regle.sql`** — « En ligne » remis sur la colonne qui porte vraiment la publication (⚠️ **la nº 59 exigeait `statut = 'validee'`** : des fiches publiées par l'administrateur restaient invisibles, et l'écran « en attente » ne les montrait pas puisqu'il ne liste que `statut = 'en_attente'`). Une fiche est en ligne quand elle est PUBLIÉE — colonne `publie`, que le déclencheur `tatoueurs_garde_fou` réserve à l'administrateur —, pas supprimée, pas mise hors ligne, pas refusée. Elle retire au passage la contrainte `tatoueurs_statut_valide` de la nº 5, restée en place à côté de celle de la nº 10 : à elles deux, elles rendaient `statut = 'modifications'` impossible à écrire.
61. **`yokofolio-ordre-stable-pagination.sql`** — L'ordre des résultats ne dépend plus de la taille de la page (⚠️ **sans elle, « Voir plus » fait apparaître des cartes AU-DESSUS de celles déjà affichées**). La fonction `rechercher_tatoueurs` reclassait par nombre de clics la page DÉJÀ COUPÉE : demander 24 cartes puis 48 reclassait deux ensembles différents, et une fiche très consultée sautait du rang 30 à la première place. L'ordre rendu est désormais `s.rang` seul — total, calculé avant la coupe, départagé par `md5(id || jour)`. La popularité garde son rôle là où elle classe le catalogue entier : `p_prioriser_clics`, les pages « style + ville ».
62. **`yokofolio-popularite-classement.sql`** — Les portfolios les plus appréciés remontent (⚠️ **à passer APRÈS la nº 61**, dont elle reprend le corps). Elle crée la vue `popularite_tatoueurs` — le score d'un portfolio, défini UNE seule fois : `consultations + 3 × cœurs + 8 × abonnés` — et l'intègre au `row_number()` de la recherche, c'est-à-dire **sur tout le catalogue filtré, avant le `limit`/`offset`**. Deux fiches de même score gardent le tirage du jour, donc l'ordre reste stable de page en page. La même vue est lue par le chemin de repli JavaScript : un seul classement, deux lecteurs.

---

## Les fichiers qui ne sont PAS des migrations

Deux fichiers du dossier ne portent aucun numéro : ce sont des OUTILS,
à ouvrir le jour où l'on en a besoin, jamais à passer dans l'ordre.

- **`yokofolio-releve-fiches.sql`** — affiche, fiche par fiche, la
  valeur exacte des colonnes qui décident de la visibilité (`publie`,
  `statut`, `supprime_le`, `hors_ligne`) et NOMME celle qui bloque.
  Il n'écrit rien. À passer quand une fiche ne s'affiche pas.
- **`yokofolio-verification-migrations.sql`** — dit lesquelles des
  migrations ci-dessus sont réellement passées. N'écrit rien.
- **`yokofolio-retirer-un-style.sql`** — retire un style accepté du
  catalogue (chemin de secours : /admin le fait en un bouton depuis la
  passe nº 123).

---

## Savoir lesquelles sont passées

Colle **`yokofolio-verification-migrations.sql`** dans l'éditeur SQL de
Supabase et exécute-le : il n'écrit rien, et rend une ligne par
migration — ✅ PASSÉE, ⚠️ INCOMPLÈTE ou ❌ MANQUANTE — avec le détail
de ce qui manque. C'est le seul fichier du dossier qu'on peut lancer
sans conséquence, à n'importe quel moment.

---

*Tableau produit à partir des fichiers eux-mêmes, analysés par
l'analyseur syntaxique de PostgreSQL — pas à la main.*
