# Score et pastilles — guide (étape 7)

Les grilles (Instagram sur 50, Google sur 50) et les pastilles
(« Recommandé » ≥ 40, « Artisan d'excellence » ≥ 75) sont implémentées depuis
l'étape 5 et lues dans le fichier central `src/config/roswel.ts`.
Cette étape ajoute les outils pour **voir**, **tester** et
**maintenir** le score. Rien à faire côté Supabase.

## Les deux nouveaux outils

Tous les outils sont réunis sur **http://localhost:3000/admin**.

### 1. Le simulateur de score

http://localhost:3000/admin/simulateur-score

- Tape les chiffres d'un artisan (abonnés, publications, note, avis) :
  le score et la pastille se calculent en direct, avec les vraies
  fonctions du site.
- Les deux grilles et les seuils affichés sur la page sont **lus dans
  le fichier de réglages** : si tu modifies une valeur dans
  `src/config/roswel.ts`, les tableaux changent aussi.

### 2. Le recalcul des scores

http://localhost:3000/admin/recalculer-scores

**Le point important de cette étape :** les scores sont *enregistrés*
dans la base (c'est ce qui rend le classement rapide). Donc si tu
modifies une grille ou un seuil dans la config, les artisans déjà
enregistrés gardent leur ancien score **tant que tu n'as pas
recalculé**. Ce bouton contrôle tout le monde et met à jour ce qui a
changé (avec le détail avant → après).

> À l'étape 8, la saisie admin des chiffres Instagram recalculera
> automatiquement le score de l'artisan concerné à chaque
> enregistrement, comme prévu au cahier des charges. Le bouton de
> recalcul global sert, lui, après un changement de **réglages**.

## Test amusant à faire (5 minutes)

1. Ouvre le simulateur : avec 5 600 abonnés / 510 publications /
   4,6 / 203 avis (les chiffres de « Chauffage Rhône Sud »), le score
   affiche **74** → badge bleu « Recommandé », à 1 point de l’Excellence.
2. Ouvre `src/config/roswel.ts` et change le seuil Artisan d'excellence de
   75 à **70** (section PASTILLES).
3. Le simulateur affiche maintenant le badge **rose « Artisan d’excellence »** pour 74.
4. Va sur « Recalculer les scores » → le bouton met à jour Chauffage
   Rhône Sud (74 : recommande → top). Vérifie sa carte dans une
   recherche : badge rose !
5. Remets le seuil à 75, recalcule à nouveau : tout revient.

C'est exactement le circuit prévu : **un seul fichier de réglages**,
un simulateur pour prévoir, un bouton pour propager.
