# Suites de vérification archivées — rangées, jamais supprimées

*Rangées ici à la passe nº 99, sur décision du propriétaire. Toutes
passaient au vert le jour de leur archivage : aucune n'est cassée.*

Une suite archivée n'est **pas** une suite morte. Elle n'est simplement
plus rejouée à chaque passe, parce que ce qu'elle défend est soit
couvert ailleurs, soit figé depuis longtemps. Elle reste **lançable
telle quelle**, et sa place ici est réversible : la ramener dans
`tests/` suffit à la remettre au programme.

## Ce qu'il y a dedans

| fichier | ce qu'elle défend | pourquoi elle est ici |
|---|---|---|
| `verif-p92.mjs` | blocs du formulaire, formulaire de demande, icône world | **Doublon intégral de `verif-p93.mjs`.** La passe nº 93 a repris le fichier de la passe nº 92 ligne pour ligne, en a corrigé deux points, et l'a enrichi. Les deux se contredisaient même sur le globe de la barre fixe. |
| `cartes-artisan.mjs` | le dessin de la carte artisan à 7 largeurs | Produit **artisan** — l'ancien produit, remplacé par yokofolio. Décrit une mise en page qu'on ne retouche plus. |
| `mode-double-web.mjs` | deux colonnes fluides ≥ 1024 px, contour des cartes | idem |
| `ipad-graphique.mjs` | barre de défilement iPad, fiche en un bloc | idem |

⚠️ **`retour-liste.mjs` n'est PAS ici**, et c'est délibéré. Elle porte
aussi sur le produit artisan, mais elle défend une **mécanique** — le
retour depuis une fiche restaure la position ET les pages « Voir plus »
déjà chargées — et pas un dessin. Ce bug a résisté à plusieurs
corrections ; sa cause racine (une valeur de défilement rognée écrite
pendant la transition de navigation) ne se re-devine pas. Elle reste
dans `tests/`.

## Les lancer quand même

```bash
npm run dev            # dans un premier terminal

npm run archives:p92
npm run archives:cartes
npm run archives:web-double
npm run archives:ipad
```

⚠️ `verif-p92.mjs` importe `../commun-verif.mjs` : **le socle est resté
dans `tests/`**, il sert aux suites permanentes. Si tu déplaces l'un ou
l'autre, c'est ce chemin-là qu'il faut corriger.

## Quand les supprimer pour de bon

* `verif-p92.mjs` — **dès maintenant, si tu veux.** Elle ne prouve rien
  que `verif-p93.mjs` ne prouve déjà. Elle n'est gardée que par
  précaution.
* Les trois suites artisan — **le jour où les écrans `/artisans`,
  `/artisan/[slug]` et `/artisan/espace` sont retirés du site.** Tant
  qu'ils vivent, ces suites restent le seul témoin écrit de ce à quoi
  ils doivent ressembler.
