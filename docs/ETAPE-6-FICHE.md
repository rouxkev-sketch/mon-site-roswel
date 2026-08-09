# La fiche artisan — guide (étape 6)

Rien à faire côté Supabase pour cette étape. Il faut seulement
**mettre à jour les artisans de démonstration** (leurs horaires et
numéros de test ont été enrichis) :

1. `npm run dev`
2. Ouvrir http://localhost:3000/admin/artisans-demo
3. Cliquer « Créer les artisans de démonstration » (ça met à jour les
   fiches existantes, sans doublon).

## À tester sur les fiches

Depuis une recherche (ex. *Plombier à Villeurbanne*), toucher une
carte pour ouvrir la fiche :

- **Julien Moreau** : la fiche la plus complète — macaron « SIREN
  vérifié », ancienneté, horaires avec statut ouvert/fermé selon
  l'heure réelle, boutons **Appeler + WhatsApp** (numéros fictifs
  06 39 98…, réservés aux tests).
- **Sophie Bertrand** (*Électricien à Lyon*) : pastille dorée « Top
  artisan », bouton **Appeler seulement** (pas de WhatsApp — jamais de
  bouton grisé, il est simplement absent).
- **Chauffage Rhône Sud** : bouton **WhatsApp seulement**.
- **Karim Benali** : fiche minimale — ni téléphone, ni horaires, ni
  rapidité : seul le bouton **Message** apparaît, comme prévu.
- **Luc Ferrand** (*Serrurier à Lyon*) : sans pastille (score 10),
  disponibilités Urgence 24/7 + nuit.

Sur chaque fiche :

- badge de niveau **en haut à gauche**, cœur favori **en haut à
  droite** (il explique que les favoris arrivent à l'étape 10) ;
- liens **Avis Google** et **Instagram** toujours cliquables (pour la
  démo, le lien Google ouvre une recherche du nom, faute de vraie
  fiche Google ; les comptes Instagram fictifs n'existent pas) ;
- **Partage** : « Copier le lien » (avec confirmation) et WhatsApp ;
- bouton **Message** toujours présent → écran provisoire (étape 9).

## Aperçu sans base de données

http://localhost:3000/admin/apercu-fiche — la même fiche avec des
données fictives locales (outil de développement).

## Réglage ajouté

`src/config/roswel.ts` → `ANCIENNETE.minAnneesAffichage` (3 ans par
défaut) : en dessous, l'ancienneté n'est pas affichée (jamais un
« atout » négatif).
