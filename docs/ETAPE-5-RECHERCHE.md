# La recherche d'artisans — guide (étape 5)

## À faire une fois (2 minutes)

1. **Exécuter le complément SQL** : Supabase → **SQL Editor** →
   **New query** → coller tout le fichier `supabase/etape5.sql` → **Run**.
   (Il ajoute 2 colonnes à la fiche artisan et crée la fonction de
   recherche qui calcule les distances.)

2. **Créer les artisans de démonstration** : `npm run dev`, puis ouvrir
   **http://localhost:3000/admin/artisans-demo** et cliquer
   « Créer les artisans de démonstration ». Neuf profils fictifs autour
   de Lyon apparaissent, avec le détail de leurs scores.

## Recherches à essayer (et ce qu'elles démontrent)

| Recherche | Attendu | Ce que ça démontre |
|---|---|---|
| Plombier à Villeurbanne | 2 artisans | Julien (69 pts) devant Karim (40 pts) : classement par score |
| Chauffagiste à Villeurbanne | 2 artisans | Chauffage Rhône Sud vient de Givors : rayon de 50 km |
| Électricien à Lyon | 2 artisans | Badge rose « Artisan d'excellence » (Sophie, 85 pts) |
| Serrurier à Lyon | 1 artisan | Luc (10 pts) : aucune pastille, jamais de badge dévalorisant ; Thomas (non validé) reste invisible |
| Serrurier à Vénissieux | 0 artisan | Luc a exclu Vénissieux de sa zone (option « communes exclues ») |
| Peintre à Vénissieux | 2 artisans | Scores proches (48 vs 47) : la rapidité départage, Nadia passe devant |

## Comment fonctionne le classement

1. **Le score de confiance d'abord** (critère principal).
2. **La rapidité de réponse ensuite**, uniquement entre scores
   « proches » (même tranche de 5 points — réglable dans
   `src/config/roswel.ts`, section CLASSEMENT).
3. **Filtre Urgence actif** : la tranche passe à 15 points, la
   rapidité pèse donc plus lourd — comme prévu au cahier des charges.

## Bon à savoir

- Une page de résultats **sans aucun artisan** reste consultable pour
  la personne qui cherche, mais est marquée « noindex » : Google ne
  référencera jamais une page vide (règle SEO du cahier des charges).
- L'**aperçu du design des cartes** (sans base de données) :
  http://localhost:3000/admin/apercu-cartes
- Pour **supprimer la démo** plus tard : même page-outil, bouton
  « Supprimer les artisans de démonstration ».
- Les artisans de démo n'ont pas de photo : leurs initiales s'affichent
  sur le dégradé de la marque. Les vraies photos arrivent avec les
  inscriptions (étape 8).
