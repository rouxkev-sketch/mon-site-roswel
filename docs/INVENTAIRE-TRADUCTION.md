# Inventaire des textes à traduire — passe nº 797

**Ce document ne traduit rien.** Il dit CE QU'IL Y A, OÙ, et COMBIEN,
pour que la passe de traduction (nº 798) n'oublie rien et que son
travail puisse être vérifié fichier par fichier.

---

## 1 · Les totaux

| | |
|---|---:|
| Fichiers de code examinés | 303 |
| Fichiers portant du texte d'écran | 182 |
| Textes relevés, tous cas confondus | **3872** |
| — dont cas particuliers (voir §3) | 2104 |
| **Textes à traduire à la main** | **1768** |

Un « texte » = une chaîne distincte dans un fichier. Le même mot dans
deux fichiers compte deux fois : la traduction devra passer aux deux
endroits. Une phrase à trou (`Bonjour ${nom}`) compte pour une.

---

## 2 · Comment ce compte a été établi (et ce qu'il vaut)

Un programme a lu les 303 fichiers de `src/` et `scripts/`. Il a
d'abord **ôté tous les commentaires** — ce dépôt est commenté en
français, et les compter aurait donné des dizaines de milliers de
faux textes. Puis il a retenu ce qui a la forme d'une phrase
d'écran, et écarté ce qui a la forme d'une valeur technique.

**Quatre erreurs de l'instrument ont été trouvées et corrigées avant
de signer ce compte** — chacune sur un contrôle à la main :

1. il **comptait deux fois** le même texte vu comme attribut puis
   comme littéral ;
2. il **découpait les phrases à trou** et comptait les morceaux en
   plus du tout ;
3. il **ratait du texte visible** (« Mettre le portfolio hors
   ligne ») : sa règle exigeait deux mots-outils français ou un
   accent, et cette phrase n'a ni l'un ni l'autre ;
4. il prenait les **tracés SVG** des icônes (`M12 20.5C7.5…`) et les
   **génériques TypeScript** (`Promise<X | null>`) pour des phrases.

### Ce que ce compte NE garantit PAS

- Il ne distingue pas une chaîne **affichée** d'une chaîne seulement
  **journalisée**. Les natures `attribut`, `métadonnée` et `texte
  JSX` sont sûres ; la nature `littéral` demande un œil.
- Il penche volontairement du côté du **trop** : mieux vaut une ligne
  à écarter en 798 qu'un texte oublié en ligne.
- **Marge d'erreur estimée : ±10 %**, à la baisse (quelques
  littéraux techniques restants). Compter 1 600 à 1 800 textes réels.

---

## 3 · Les cas particuliers — à NE PAS traduire à la main

### `src/lib/emojis-donnees.ts` — 1701 textes

ENGENDRÉ, ne pas traduire à la main. Deux lignes à changer dans `scripts/engendrer-emojis.mjs` (`fr/compact.json` → `en/…`, `fr/messages.json` → `en/…`), puis relancer le script.

### `src/lib/adresse.ts` — 272 textes

TABLE DE CORRESPONDANCE, pas du texte d'écran. Ce sont des couples « nom anglais|nom français » de régions (Georgia|Géorgie). Décision à prendre en 798, pas une traduction.

### `src/lib/tatoueurs-demo.ts` — 96 textes

HORS PRODUCTION. Fiches de démonstration, interdites en ligne (lib/catalogue-demonstration) : elles ne servent qu'aux bancs et au travail local.

### `src/components/SondeNavigation.tsx` — 35 textes

INSTRUMENT INTERNE. Ne s'affiche qu'armée depuis /dev (verrouillée admin).

---

## 4 · Le détail, domaine par domaine

### A · composants d'interface

**86 fichiers · 931 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/components/FormulaireFiche.tsx` | 60 | 9 |
| ☐ | `src/components/FenetreNotifications.tsx` | 59 | 6 |
| ☐ | `src/components/BlocModesExercice.tsx` | 45 | 16 |
| ☐ | `src/components/EcranAuthentification.tsx` | 38 | 5 |
| ☐ | `src/components/MenuEspace.tsx` | 38 | 13 |
| ☐ | `src/components/BlocPortfolio.tsx` | 36 | 14 |
| ☐ | `src/components/SondeNavigation.tsx` ⚠︎ cas particulier | 35 | 9 |
| ☐ | `src/components/PageRattachement.tsx` | 34 | 6 |
| ☐ | `src/components/Securite.tsx` | 32 | 8 |
| ☐ | `src/components/CarrouselPortfolio.tsx` | 22 | 2 |
| ☐ | `src/components/BlocSuppressions.tsx` | 20 | 12 |
| ☐ | `src/components/ContenuFiche.tsx` | 20 | 1 |
| ☐ | `src/components/MoteurTatouage.tsx` | 19 | 4 |
| ☐ | `src/components/MenuDeroulant.tsx` | 18 | 0 |
| ☐ | `src/components/TableauDeBordDesSondes.tsx` | 18 | 5 |
| ☐ | `src/components/BoutonPartageFiche.tsx` | 17 | 2 |
| ☐ | `src/components/FenetreConventions.tsx` | 17 | 9 |
| ☐ | `src/components/NouveauMotDePasse.tsx` | 17 | 6 |
| ☐ | `src/components/FormulaireContactYokofolio.tsx` | 16 | 7 |
| ☐ | `src/components/ChampLocalisation.tsx` | 15 | 3 |
| ☐ | `src/components/LienLibre.tsx` | 15 | 10 |
| ☐ | `src/components/BlocEquipeSalon.tsx` | 14 | 1 |
| ☐ | `src/components/BlocLieux.tsx` | 13 | 3 |
| ☐ | `src/components/BlocStudios.tsx` | 13 | 5 |
| ☐ | `src/components/OutilsSonde.tsx` | 13 | 4 |
| ☐ | `src/components/FenetreFiche.tsx` | 12 | 4 |
| ☐ | `src/components/SondeVitesse.tsx` | 12 | 4 |
| ☐ | `src/components/BoutonHorsLigne.tsx` | 11 | 6 |
| ☐ | `src/components/EnTeteTatouage.tsx` | 11 | 5 |
| ☐ | `src/components/FenetreSignalement.tsx` | 11 | 6 |
| ☐ | `src/components/PageRechercheMobile.tsx` | 11 | 3 |
| ☐ | `src/components/SelecteurLangue.tsx` | 11 | 4 |
| ☐ | `src/components/FenetreIdentite.tsx` | 10 | 3 |
| ☐ | `src/components/RechercheFicheInscrite.tsx` | 10 | 2 |
| ☐ | `src/components/BlocHorairesStudio.tsx` | 8 | 4 |
| ☐ | `src/components/RecadreurPhoto.tsx` | 8 | 4 |
| ☐ | `src/components/SelecteurEmojis.tsx` | 8 | 6 |
| ☐ | `src/components/BlocAutreAdresse.tsx` | 7 | 2 |
| ☐ | `src/components/BoutonEnvoyerJournal.tsx` | 7 | 0 |
| ☐ | `src/components/BoutonSuivre.tsx` | 7 | 2 |
| ☐ | `src/components/CalendrierPlage.tsx` | 7 | 2 |
| ☐ | `src/components/CarteTatoueur.tsx` | 7 | 1 |
| ☐ | `src/components/BoutonCoeurPhoto.tsx` | 6 | 0 |
| ☐ | `src/components/IndexTatoueurs.tsx` | 6 | 0 |
| ☐ | `src/components/ChampLienVerifie.tsx` | 5 | 2 |
| ☐ | `src/components/ChampsIdentite.tsx` | 5 | 1 |
| ☐ | `src/components/DeuxZonesLieu.tsx` | 5 | 2 |
| ☐ | `src/components/FenetreInvitationCompte.tsx` | 5 | 2 |
| ☐ | `src/components/FiletDeReparation.tsx` | 5 | 0 |
| ☐ | `src/components/GalerieQuiDefile.tsx` | 5 | 0 |
| ☐ | `src/components/GardeSaisie.tsx` | 5 | 4 |
| ☐ | `src/components/MenusSelection.tsx` | 5 | 1 |
| ☐ | `src/components/PortfolioDeLAffiche.tsx` | 5 | 1 |
| ☐ | `src/components/BlocSuivis.tsx` | 4 | 0 |
| ☐ | `src/components/ChampBio.tsx` | 4 | 0 |
| ☐ | `src/components/FenetreEnvoi.tsx` | 4 | 1 |
| ☐ | `src/components/GrilleGalerie.tsx` | 4 | 1 |
| ☐ | `src/components/MemoireNavigation.tsx` | 4 | 0 |
| ☐ | `src/components/FenetreModale.tsx` | 3 | 1 |
| ☐ | `src/components/Interrupteur.tsx` | 3 | 0 |
| ☐ | `src/components/Pastille.tsx` | 3 | 1 |
| ☐ | `src/components/PhotoRonde.tsx` | 3 | 0 |
| ☐ | `src/components/RetourGaranti.tsx` | 3 | 0 |
| ☐ | `src/components/SquelettesDePage.tsx` | 3 | 1 |
| ☐ | `src/components/SurfaceDeVerre.tsx` | 3 | 1 |
| ☐ | `src/components/BadgesCharte.tsx` | 2 | 0 |
| ☐ | `src/components/ClavierCartes.tsx` | 2 | 0 |
| ☐ | `src/components/FicheTatoueur.tsx` | 2 | 0 |
| ☐ | `src/components/JaugeMotDePasse.tsx` | 2 | 0 |
| ☐ | `src/components/OngletsLigne.tsx` | 2 | 0 |
| ☐ | `src/components/PageFavoris.tsx` | 2 | 1 |
| ☐ | `src/components/PageMessageSombre.tsx` | 2 | 0 |
| ☐ | `src/components/PagePleinEcranMobile.tsx` | 2 | 0 |
| ☐ | `src/components/Squelette.tsx` | 2 | 1 |
| ☐ | `src/components/erreurs-formulaire.tsx` | 2 | 0 |
| ☐ | `src/components/AucunResultat.tsx` | 1 | 1 |
| ☐ | `src/components/CarteStyle.tsx` | 1 | 0 |
| ☐ | `src/components/DefilementEnHaut.tsx` | 1 | 0 |
| ☐ | `src/components/EcranVideSelection.tsx` | 1 | 1 |
| ☐ | `src/components/EncadreBarre.tsx` | 1 | 0 |
| ☐ | `src/components/IconeAjouterPhoto.tsx` | 1 | 0 |
| ☐ | `src/components/LigneResultats.tsx` | 1 | 0 |
| ☐ | `src/components/LogoYokofolio.tsx` | 1 | 0 |
| ☐ | `src/components/PastilleEvenement.tsx` | 1 | 0 |
| ☐ | `src/components/VoileDeLaPage.tsx` | 1 | 0 |
| ☐ | `src/components/champs-recherche.ts` | 1 | 0 |

### B · pages et gabarits

**11 fichiers · 59 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/app/(tatouage)/tatoueur/[slug]/complet/page.tsx` | 17 | 5 |
| ☐ | `src/app/(tatouage)/tatoueur/[slug]/page.tsx` | 15 | 5 |
| ☐ | `src/app/(tatouage)/tatouage/[style]/[ville]/page.tsx` | 14 | 7 |
| ☐ | `src/app/(tatouage)/layout.tsx` | 6 | 5 |
| ☐ | `src/app/(tatouage)/apres-connexion/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/devenir-tatoueur/fiche/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/devenir-tatoueur/nouveau-mot-de-passe/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/devenir-tatoueur/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/devenir-tatoueur/securite/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/mes-favoris/page.tsx` | 1 | 1 |
| ☐ | `src/app/(tatouage)/rejoindre/[jeton]/page.tsx` | 1 | 1 |

### C · pages éditoriales

**3 fichiers · 36 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/app/(tatouage)/mentions-legales/page.tsx` | 24 | 7 |
| ☐ | `src/app/(tatouage)/qui-sommes-nous/page.tsx` | 8 | 3 |
| ☐ | `src/app/(tatouage)/contact/page.tsx` | 4 | 3 |

### D · courriels

**1 fichiers · 6 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/lib/email.ts` | 6 | 0 |

### E · code serveur (API)

**13 fichiers · 57 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/app/api/tatoueur/liaison/route.ts` | 9 | 0 |
| ☐ | `src/app/api/cron/purge-comptes/route.ts` | 8 | 0 |
| ☐ | `src/app/api/tatoueur/suggestion-convention/route.ts` | 7 | 0 |
| ☐ | `src/app/api/tatoueur/suggestion-style/route.ts` | 6 | 0 |
| ☐ | `src/app/api/tatoueur/supprimer-fiche/route.ts` | 6 | 0 |
| ☐ | `src/app/api/rattachement/route.ts` | 5 | 0 |
| ☐ | `src/app/api/tatoueur/contact/route.ts` | 5 | 0 |
| ☐ | `src/app/api/tatoueur/notifications/route.ts` | 3 | 0 |
| ☐ | `src/app/api/tatoueur/supprimer-compte/route.ts` | 3 | 0 |
| ☐ | `src/app/api/tatoueur/signalement/route.ts` | 2 | 0 |
| ☐ | `src/app/api/tatoueur/clic/route.ts` | 1 | 0 |
| ☐ | `src/app/api/tatoueur/reactiver/route.ts` | 1 | 0 |
| ☐ | `src/app/api/tatoueur/recherche-fiches/route.ts` | 1 | 0 |

### F · espace admin

**12 fichiers · 236 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/components/AdminYokofolio.tsx` | 99 | 41 |
| ☐ | `src/components/AdminDemarchage.tsx` | 34 | 10 |
| ☐ | `src/app/api/admin/yokofolio/fiches/route.ts` | 26 | 0 |
| ☐ | `src/app/api/admin/yokofolio/suggestions-styles/route.ts` | 19 | 0 |
| ☐ | `src/app/api/admin/yokofolio/demandes-convention/route.ts` | 18 | 0 |
| ☐ | `src/app/api/admin/yokofolio/demarchage/route.ts` | 15 | 0 |
| ☐ | `src/app/api/admin/yokofolio/demarchage/fiche/route.ts` | 8 | 0 |
| ☐ | `src/app/api/admin/yokofolio/deverrouiller-exercice/route.ts` | 6 | 0 |
| ☐ | `src/app/api/admin/yokofolio/signalements/route.ts` | 4 | 0 |
| ☐ | `src/lib/supabase/admin.ts` | 4 | 0 |
| ☐ | `src/lib/admin-yokofolio.ts` | 2 | 0 |
| ☐ | `src/app/(tatouage)/admin/page.tsx` | 1 | 1 |

### G · manifeste, 404, métadonnées

**1 fichiers · 2 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/app/not-found.tsx` | 2 | 1 |

### H · page /dev (verrouillée admin)

**2 fichiers · 3 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/app/api/dev/journal-sonde/route.ts` | 2 | 0 |
| ☐ | `src/app/dev/page.tsx` | 1 | 1 |

### I · listes de référence (config)

**1 fichiers · 129 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/config/tatouage.ts` | 129 | 0 |

### J · bibliothèque (lib)

**52 fichiers · 2413 textes**

| ✓ | Fichier | Textes | dont sûrs (attribut / JSX / méta) |
|---|---|---:|---:|
| ☐ | `src/lib/emojis-donnees.ts` ⚠︎ cas particulier | 1701 | 0 |
| ☐ | `src/lib/adresse.ts` ⚠︎ cas particulier | 272 | 0 |
| ☐ | `src/lib/tatoueurs-demo.ts` ⚠︎ cas particulier | 96 | 0 |
| ☐ | `src/lib/tatoueurs.ts` | 54 | 2 |
| ☐ | `src/lib/modes-exercice.ts` | 44 | 0 |
| ☐ | `src/lib/demarchage.ts` | 25 | 0 |
| ☐ | `src/lib/mot-de-passe.ts` | 24 | 0 |
| ☐ | `src/lib/horaires-studio.ts` | 23 | 0 |
| ☐ | `src/lib/notifications.ts` | 19 | 0 |
| ☐ | `src/lib/connexion-google.ts` | 14 | 0 |
| ☐ | `src/lib/vitesse.ts` | 13 | 0 |
| ☐ | `scripts/engendrer-emojis.mjs` | 10 | 0 |
| ☐ | `src/lib/liens-fiche.ts` | 9 | 0 |
| ☐ | `src/lib/selection-suivis.ts` | 9 | 0 |
| ☐ | `src/lib/fiches-compte.ts` | 7 | 0 |
| ☐ | `src/lib/site.ts` | 7 | 0 |
| ☐ | `src/lib/geste-toucher.ts` | 6 | 0 |
| ☐ | `src/lib/image-partage-fiche.tsx` | 6 | 0 |
| ☐ | `src/lib/photo.ts` | 6 | 0 |
| ☐ | `src/app/(tatouage)/tatouage/[style]/[ville]/opengraph-image.tsx` | 5 | 0 |
| ☐ | `src/lib/filtres-selection.ts` | 5 | 0 |
| ☐ | `src/app/photos/[...chemin]/route.ts` | 4 | 0 |
| ☐ | `src/lib/photos-tatoueur.ts` | 4 | 0 |
| ☐ | `src/app/(tatouage)/opengraph-image.tsx` | 3 | 1 |
| ☐ | `src/app/images-demo/tatouage/[fichier]/route.ts` | 3 | 2 |
| ☐ | `src/lib/enregistrer-exercice.ts` | 3 | 1 |
| ☐ | `src/lib/image-partage.tsx` | 3 | 0 |
| ☐ | `src/lib/liste-neuve.ts` | 3 | 0 |
| ☐ | `src/lib/photos-stockage.ts` | 3 | 0 |
| ☐ | `src/lib/remontee-champ.ts` | 3 | 0 |
| ☐ | `src/lib/supabase/env.ts` | 3 | 0 |
| ☐ | `src/lib/suppression-compte.ts` | 3 | 0 |
| ☐ | `src/lib/bas-de-la-pile.ts` | 2 | 0 |
| ☐ | `src/lib/defilement-programme.ts` | 2 | 0 |
| ☐ | `src/lib/televerser-photos.ts` | 2 | 0 |
| ☐ | `src/app/layout.tsx` | 1 | 0 |
| ☐ | `src/lib/carte-du-haut.ts` | 1 | 0 |
| ☐ | `src/lib/catalogue-demonstration.ts` | 1 | 0 |
| ☐ | `src/lib/conventions.ts` | 1 | 0 |
| ☐ | `src/lib/demarchage-serveur.ts` | 1 | 0 |
| ☐ | `src/lib/emojis.ts` | 1 | 0 |
| ☐ | `src/lib/enregistrer-photos.ts` | 1 | 0 |
| ☐ | `src/lib/gel-du-corps.ts` | 1 | 0 |
| ☐ | `src/lib/geocodage/index.ts` | 1 | 0 |
| ☐ | `src/lib/geocodage/photon.ts` | 1 | 0 |
| ☐ | `src/lib/glissement-lateral.ts` | 1 | 0 |
| ☐ | `src/lib/journal-de-bord.ts` | 1 | 1 |
| ☐ | `src/lib/photo-tatoueur.ts` | 1 | 0 |
| ☐ | `src/lib/preposition-pays.ts` | 1 | 0 |
| ☐ | `src/lib/restitution-position.ts` | 1 | 0 |
| ☐ | `src/lib/styles-ajoutes.ts` | 1 | 0 |
| ☐ | `src/lib/supabase/delai.ts` | 1 | 0 |
---

## 5 · Les courriels

### 5a · Ceux que le site écrit lui-même (Resend)

`src/lib/email.ts` n'est que le **transport** : il prend un sujet et un
corps, et les remet à Resend. Les textes, eux, sont **chez les trois
appelants** — c'est là qu'il faut traduire, pas dans `email.ts`.

| ✓ | Fichier | Ce qu'il envoie |
|---|---|---|
| ☐ | `src/app/api/admin/yokofolio/demandes-convention/route.ts` | « Convention acceptée » / « Convention refusée » + le corps de chaque cas |
| ☐ | `src/app/api/admin/yokofolio/suggestions-styles/route.ts` | « Style ajouté » / « Style refusé » + le corps de chaque cas |
| ☐ | `src/app/api/tatoueur/contact/route.ts` | l'accusé du formulaire de contact (sujet et corps) |

### 5b · Ceux que Supabase envoie à notre place

**Ceux-là ne sont PAS dans le dépôt.** Ils vivent dans le tableau de
bord Supabase (*Authentication → Email Templates*) et se traduisent
**à la main, là-bas**. Le site en déclenche trois :

| ✓ | Gabarit Supabase | Déclenché par |
|---|---|---|
| ☐ | **Confirm signup** | `EcranAuthentification.tsx:295` (inscription par mot de passe) |
| ☐ | **Reset password** | `EcranAuthentification.tsx:369` et `Securite.tsx:437` |
| ☐ | **Change email address** | `Securite.tsx:328` (changement d'adresse) |

Les autres gabarits proposés par Supabase (Magic Link, Invite user,
Reauthentication) **ne sont pas utilisés** par ce site : rien à y faire.

> ⚠️ Ces trois gabarits sont aussi les seuls textes de tout ce projet
> qu'aucune passe ne peut vérifier au banc. Il faudra les regarder à
> l'œil dans le tableau de bord, une fois traduits.

---

## 6 · Ce qui vit en base de données

**Bonne nouvelle, et c'est le résultat le plus important de cette
section : presque rien n'est à traduire par SQL.** Le site a été bâti
avec les libellés dans le CODE et les clés dans la BASE. Vérifié table
par table.

### 6a · Ce qui est déjà à l'abri (aucun SQL)

| Sujet | Ce que la base garde | Ce qui s'affiche | Vérifié dans |
|---|---|---|---|
| Styles de tatouage | la limace (`fine-line`) | `label` du code | `src/config/tatouage.ts` |
| Motifs de modération | la limace (`bio-inappropriee`) | `label` du code | `src/config/tatouage.ts:2073` |
| Motifs de signalement | la limace (`usurpation`) | `label` du code | `src/config/tatouage.ts:2143` |
| Modes d'exercice | la clé (`convention`, `independent`) | libellé du code | `src/lib/modes-exercice.ts` |
| Titres de notification | `titre` en français **est** stocké… | …mais **l'affichage dérive du `genre`**, pas de la colonne | `src/lib/notifications.ts:159` et `FenetreNotifications` |

La dernière ligne mérite un mot : la colonne `notifications_compte.titre`
contient bien du français pour les lignes déjà écrites, **mais elle
n'est plus lue pour l'affichage**. Une note du code le dit
explicitement : « l'affichage dérive du GENRE pour que les anciennes
lignes parlent aussi la nouvelle langue ». Traduire l'interface suffira
donc à traduire les anciennes notifications. **Aucun SQL.**

### 6b · Ce qui porte du texte, mais qui appartient aux gens

Ces colonnes sont remplies **par les tatoueurs eux-mêmes** ou par
l'administration. Ce n'est pas de l'interface : ce n'est **pas à
traduire**, ni par nous ni par personne.

| Table | Colonnes concernées |
|---|---|
| `tatoueurs` | `nom`, `bio`, `ville_nom`, `region`, `pays`, adresse |
| `studios` | `nom`, adresse |
| `conventions` | `nom` (nom propre d'une convention) |
| `equipe_salon` | `nom`, `role` |
| `messages_yokofolio` | le message du visiteur |
| `suggestions_style` | le style proposé par un tatoueur |
| `demarchages`, `demarchage_fiches` | notes de prospection |
| `signalements_fiches` | le texte libre « Autre (préciser) » |
| `notifications_compte` | `fiche_nom`, `detail`, `motifs` (limaces) |

### 6c · Ce qui reste à décider

Une seule chose, et elle demande l'avis de Kevin :

- **`src/lib/adresse.ts` (272 correspondances)** — une table
  « nom anglais | nom français » pour les régions du monde
  (`Georgia|Géorgie`, `Quebec|Québec`). Elle sert à normaliser ce que
  rend le géocodeur. En anglais, la colonne de gauche devient la bonne
  réponse : ce n'est pas une traduction à écrire, c'est un **sens de
  lecture à inverser**. À trancher en 798.

> Aucune de ces tables n'a été modifiée par cette passe. Aucun SQL n'a
> été écrit ni exécuté.

---

## 7 · Les mécanismes qui dépendent de la langue

À traiter en **nº 799**, pas en 798 : ce ne sont pas des textes, ce sont
des réglages.

| ✓ | Mécanisme | Où | Ce qu'il faudra faire |
|---|---|---|---|
| ☐ | **Suggestions de villes (Photon)** | `src/lib/geocodage/photon.ts:177` | `lang=fr` → la langue du site. Une ligne. |
| ☐ | **Nom du pays** | `src/lib/geocodage/index.ts:256` (`nomFrancaisDuPays`) | fonction à renommer et à faire suivre la langue |
| ☐ | **Dates courtes/longues** | `src/components/CalendrierPlage.tsx:44,51,59` | trois `Intl.DateTimeFormat("fr-FR")` |
| ☐ | **Dates d'écran** | `BlocSuppressions.tsx:242`, `AdminYokofolio.tsx:288`, `AdminDemarchage.tsx:90`, `FenetreNotifications.tsx:422` | quatre `toLocaleDateString("fr-FR")` |
| ☐ | **Tri alphabétique des styles** | `PortfolioDeLAffiche.tsx:198`, `BlocPortfolio.tsx:335`, `config/tatouage.ts:407` | trois `localeCompare(…, "fr")` |
| ☐ | **Tri des tatoueurs suivis** | `src/lib/selection-suivis.ts:436` | `Intl.Collator("fr")` |
| ☐ | **Tri des modes d'exercice** | `src/lib/modes-exercice.ts:556` | `localeCompare(…, "fr")` |
| ☐ | **Jours de la semaine** | `src/lib/horaires-studio.ts` | « Lundi »…« Dimanche », écrits en dur |

**Deux endroits sont DÉJÀ en anglais** et n'ont rien à changer :
`src/lib/conventions.ts:206` (`Intl.DisplayNames(["en"])`) et
`src/lib/horaires-studio.ts:305` (`Intl.DateTimeFormat("en-US")`, un
calcul de fuseau, pas un affichage).

`src/lib/emojis.ts` emploie `Intl.Segmenter("fr")` pour découper les
émojis caractère par caractère : la langue n'y change rien (c'est une
règle Unicode), **à ne pas toucher**.

---

## 8 · Le script d'avant peinture, le manifeste, la page 404

| ✓ | Quoi | Verdict |
|---|---|---|
| ☐ | `src/lib/script-avant-peinture.ts` | **aucun texte visible** — que des requêtes de média et des adresses. Rien à traduire, et le millésime ne bougera donc pas pour ce motif. |
| ☐ | `src/app/manifest.ts` | 2 textes, tous deux dérivés de `MARQUE_YOKOFOLIO` et `TEXTES_TATOUAGE` (`src/config/tatouage.ts`) : se traduiront tout seuls. |
| ☐ | `src/app/not-found.tsx` | la page 404, à traduire comme une page ordinaire. |

---

## 9 · Faut-il découper la passe 798 ?

**Oui. En trois passes, et voici pourquoi.**

1 768 textes à la main, ce n'est pas une passe. La règle du projet est
« une passe = un seul sujet » ; ici le sujet est unique mais le volume
ne l'est pas. Trois découpes se tiennent d'elles-mêmes, chacune
vérifiable au banc séparément :

| Passe | Périmètre (les lettres renvoient au §4) | Textes | Pourquoi ce lot |
|---|---|---:|---|
| **798** | **A + B + C + G** — composants d'interface, pages et gabarits, pages éditoriales, manifeste et 404 | **993** | C'est tout ce que voit un visiteur. Le lot le plus gros, mais le plus facile à vérifier : chaque écran se regarde. |
| **799** | **D + E + J** — courriels (Resend **et** les trois gabarits Supabase), messages d'API, bibliothèque | **407** | Un parcours complet à éprouver — inscription, fiche, notifications — et les seuls textes qu'aucun banc ne peut voir. |
| **800** | **F + H + I** — espace admin, `/dev`, listes de référence (`config/tatouage.ts`), plus les mécanismes du §7 | **368** | Personne d'autre que Kevin ne les voit : on peut les faire en dernier sans aucun risque pour les visiteurs. |

993 + 407 + 368 = **1 768**, le compte du §1. Aucun texte n'est laissé
hors lot.

**Avant la 798, une passe de préparation est nécessaire** — et c'est le
vrai enseignement de cet inventaire : **il n'existe aujourd'hui aucune
mécanique de langue dans ce site.** Rien ne porte de dictionnaire, rien
ne choisit une langue, `SelecteurLangue.tsx` ne concerne que les langues
**parlées par le tatoueur**. Deux chemins s'offrent, et c'est une
décision de Kevin :

- **A · Remplacer** le français par l'anglais, sans mécanique. Le plus
  simple et le plus rapide ; le site devient anglais, point.
- **B · Poser une mécanique à deux langues** (dictionnaire + choix),
  puis traduire. Beaucoup plus long, et cela touche 182 fichiers au lieu
  d'en modifier le texte.

Le compte de 1 768 vaut pour **A**. Pour **B**, il faut y ajouter le
travail de mécanique, qui ne se mesure pas en textes.

---

## 10 · Liste de contrôle de la 798

À la fin de chaque passe de traduction, rejouer ce recensement et
vérifier que le compte des fichiers traités correspond au tableau du
§4. Un fichier dont le compte n'a pas bougé n'a pas été traduit.

Les bancs à garder verts, à chaque passe : **732**, **746**, **747**,
plus une lecture d'écran sur les pages touchées.

---

## 11 · Ce que la 804 a fait (traduction 1/3 : le site public)

La première passe de traduction a été la **nº 804** (les numéros 798-800
prévus ici ont servi à d'autres sujets). Kevin a tranché **A —
remplacer** le français par l'anglais, sans mécanique à deux langues.

- **Traduit** : les lots **A + B + C + G** du §4 (composants, pages et
  gabarits, pages éditoriales, manifeste et 404), plus les dix phrases
  d'interface de `config/tatouage.ts` que ces écrans affichent par leur
  nom (`TEXTES_TATOUAGE`, `slogan`) — le catalogue des styles et les
  motifs, eux, restent pour la 806.
- **Le banc** : `node scripts/recenser-textes.mjs --francais
  --perimetre=A,B,C,G` — un mode nouveau du recenseur, qui ne retient
  que ce qui ressemble à du français et liste ses exceptions avec leur
  raison. Résultat : **0 texte français**, 66 exceptions déclarées
  (instruments internes de /dev, étiquettes lues par les sondes).
- **Les émojis** : générateur relancé sur `en/` (1914 émojis, 9
  catégories aux titres anglais).
- **Le lexique** : `docs/LEXIQUE-ANGLAIS.md`, à suivre en 805-806.
- **Non traduit, par décision** : les adresses (routes), les limaces,
  les noms propres, les instruments internes, les commentaires du code.
- **Reste français sur le site public jusqu'aux 805-806** : ce qui vient
  de lib et de config — libellés des styles, des rendus et des natures,
  des modes d'exercice sur les profils publics (« Résident », « Au
  studio »), jours de la semaine, critères de mot de passe, noms de
  pays, message de site indisponible, courriels et messages d'API.

## 12 · Ce que la 805 a fait (traduction 2/3 : serveur, courriels, lib)

- **Traduit** : les lots **D + E + J** — le transport des courriels et
  ses trois appelants (les deux courriels aux artistes vivent dans des
  routes admin : seuls leurs sujets et corps ont bougé, l'écran admin
  reste pour la 806), les treize routes d'API, la bibliothèque (jours,
  mois, dates et heures à l'américaine, critères de mot de passe, rendus
  et natures, états de portfolio, messages de validation des modes,
  message de démarchage, journaux serveur).
- **Les pays** (§6c tranché) : le géocodeur passe en anglais
  (`lang=en`), `nomFrancaisDuPays` devient `nomDuPays` (`en`), et la
  table `RACCOURCIS_PAYS` de `lib/adresse` reconnaît désormais les
  formes officielles anglaises ET françaises (celles que portent les
  fiches écrites avant la 805) pour afficher la forme courte anglaise —
  le « sens de lecture » est inversé sans réécrire une seule ligne de
  base. Les variantes françaises des régions restent, comme données de
  reconnaissance. `lib/preposition-pays.ts` (« en France », « aux
  États-Unis ») n'avait plus d'appelant : supprimé.
- **Trois mécanismes du §7 faits en passant**, parce qu'ils vivent dans
  les fichiers traduits : Photon `lang`, le nom du pays, les jours de la
  semaine. Restent pour la 806 : les tris (`localeCompare("fr")`,
  `Intl.Collator("fr")`) et les dates de l'admin.
- **Les gabarits Supabase** (§5b) : `docs/GABARITS-SUPABASE-EN.md`, à
  coller à la main.
- **Le banc** : `--francais --perimetre=D,E,J` → **0 texte français**,
  162 exceptions déclarées (données Unicode, fiches de démonstration,
  tables de reconnaissance des pays et régions, sondes). Deux défauts
  d'instrument corrigés : les littéraux d'expression régulière (qui
  désynchronisaient le découpeur sur `tatoueurs.ts`) et les
  identifiants en majuscules (« NOM_… » lu « nom »).
- **Reste français jusqu'à la 806** : `config/tatouage.ts` (styles,
  motifs, rôles Fondateur/Résident, genres de mode « En salon »/« Au
  studio », filtres), l'espace admin et ses API, `/dev`.

## 13 · Ce que la 806 a fait (traduction 3/3 : styles, admin, /dev, miles)

- **Traduit** : les lots **F + H + I** — `config/tatouage.ts` (les
  styles du catalogue aux noms standards du métier, les familles, les
  filtres, les types de fiche, les genres de mode et leurs phrases, les
  rôles Founder/Resident, les motifs de modération et de signalement),
  l'espace admin entier (`AdminYokofolio`, `AdminDemarchage`, la page
  `/admin`, les huit routes `api/admin/yokofolio/*`, `lib/admin-yokofolio`,
  `lib/supabase/admin`), `/dev` et sa route `journal-sonde`, ET — décision
  du propriétaire — tous les instruments (les sept sondes, les dix
  modules de défilement, les étiquettes `data-source-composant`) : leurs
  exceptions au recenseur sont retirées. Le lexique : §2 « Ajouts de la
  806 » de `docs/LEXIQUE-ANGLAIS.md`.
- **Les styles et la base** (§6 vérifié) : le catalogue vit en code
  (`STYLES_TATOUAGE`) ; la base et les adresses ne portent que les
  LIMACES (`tatoueurs.styles`, `photos_tatoueur.style`,
  `/tatouage/<limace>/<ville>`), qui ne bougent pas — **aucun SQL**. Les
  styles nés d'une suggestion (`suggestions_style.label`) sont saisis
  par les artistes eux-mêmes, en anglais sur la base US : rien à
  réécrire non plus. La limace française d'un style (`realisme`,
  `neo-traditionnel`) reste visible dans les adresses — le sujet
  « adresses » de la 804 (§5 du lexique), à trancher à part.
- **Les miles** : `RAYONS_TATOUAGE = [5, 10, 25, 50, 100]` (miles,
  défaut 25 — c'était 10…200 km, défaut 50), le critère `rayonKm` devient
  `rayonMi` de bout en bout (moteur, index, en-tête, page d'accueil,
  `lib/tatoueurs`), et la conversion `milesEnKm` (lib/geo, 1,609344)
  n'intervient qu'aux DEUX frontières où un rayon quitte le site :
  l'appel `rechercher_tatoueurs` (`p_rayon_km`) et la Haversine du
  chemin de secours. La base reste en kilomètres (`yf_distance_km`,
  `modes_exercice.rayon_km` et sa contrainte nº 40) : aucun SQL. Les
  paliers `RAYONS_DEPLACEMENT` (zones Independent) restent en km parce
  que ce sont les valeurs de la contrainte et qu'aucun écran ne les
  propose plus (note posée dans la config). Affichage : « Austin, TX ·
  25 mi » dans le champ, « … · 25 mi » au pied de liste, « Expand to
  50 mi », curseur mobile « 25 mi » (aria-valuetext compris) ; le
  panneau web dit l'unité dans son titre (« DISTANCE (MI) », pilules
  numériques) parce que « 5 mi · 10 mi · … · 100 mi » débordait sur deux
  rangées dans les 272 px du panneau. Un lien partagé d'avant la 806
  (`?rayon=50`) est relu en miles : 50 mi au lieu de 50 km — plus large,
  jamais vide.
- **Les mécanismes** (§7 soldé) : `localeCompare(…, "en")` ×4 (config,
  PortfolioDeLAffiche, BlocPortfolio, lib/modes-exercice),
  `Intl.Collator("en")` (lib/selection-suivis), les dates de l'admin
  et du relevé de sonde en `en-US`. Restent en `"fr"` sans effet visible
  et hors sujet : `toLocaleLowerCase("fr")` (normalisation de saisie) et
  `Intl.Segmenter("fr")` (découpe des émojis en graphèmes) — deux
  fonctions insensibles à la langue pour l'alphabet latin.
- **Le script d'avant peinture** : son texte émis change (le marqueur
  `origine:"avant peinture"` de lib/bas-de-la-pile devient `"before
  paint"`) → millésime **806**.
- **Le banc** :
  · recenseur, périmètre ENTIER : **0 texte français**, 4 exceptions
    (emojis-donnees, tatoueurs-demo, adresse.ts, engendrer-emojis — des
    données). Un défaut d'instrument corrigé : la moisson de « texte
    JSX » lisait `(quand) => Date.now() - quand < FENETRE_MS` d'un
    fichier `.ts` comme un texte entre deux balises ; elle ne lit plus
    que les `.tsx` ;
  · les miles, MESURÉS (`miles-806.mjs`) : deux fiches semées à 30 km
    (18,6 mi) et 50 km (31 mi) plein est d'Austin, la doublure honorant
    le rayon (nouveau cran `RAYON=1`, même Haversine que la base) —
    25 mi trouve la première et pas la seconde, la base a reçu
    `p_rayon_km = 40.2336`, 10 mi ne trouve rien et propose « Expand to
    25 mi », 50 mi trouve les deux ; champ, pied de liste, pilules,
    curseur mobile relevés ;
  · l'admin (`admin-806.mjs`) : les cinq sections sans un mot de
    français dans leur interface, validation (motifs en anglais,
    « Send the request » → statut `modifications`), suppression en cours
    (« Scheduled for Sep 9, 12:16 PM », « Admin · 7 days »), suggestion
    acceptée (« Added — … (/…) »), convention refusée (« Declined »),
    message « Mark read » → « Mark unread », signalement
    (« Impersonation », « Archive this report » → « · archived »),
    Outreach ;
  · 732 (web), 746 (web), 747 (doigt) : verts.
- **La feuille CSS** : un piège de mesure trouvé et fermé — Tailwind lit
  tous les fichiers non ignorés du dépôt (les `.md` de `docs/` et le
  `.gitignore` compris), et la sortie du recenseur
  (`recensement-textes.json`, à la racine) lui apportait deux mots-clés
  d'émojis qui sont aussi des noms d'utilitaires (ceux-là mêmes que la
  nº 804 avait écartés par `@source not`) : 14 règles mortes au bâti
  d'atelier, invisibles chez le propriétaire (le zip l'exclut). Le
  fichier est désormais dans `.gitignore` — et les deux mots ne sont
  écrits nulle part, pas même ici : les nommer dans une note suffirait
  à faire renaître leurs règles.

## 14 · Ce que la 810 a fait (les localités : suggestions et base)

- **Le relevé du propriétaire** : le champ de ville/pays (création de
  portfolio ET moteur) suggérait encore du français, et les adresses
  déjà en base sont françaises (« 44 Rue Trousseau, Paris, France »).
- **Le chemin des suggestions, établi** : le navigateur ne parle qu'à
  NOTRE route `/api/lieux` (lib/geocodage/notre-serveur, nº 228), le
  moteur et les trois champs du formulaire (fiche, studios, modes)
  passant par le même `chercherLieux`. La route appelle Photon avec
  `lang=en` (photon.ts, le SEUL appel au géocodeur du dépôt — vérifié
  dans src, outils, scripts) et, s'il ne répond pas en 4,5 s, sert le
  FILET : nos villes relues en base (lib/villes-catalogue), pendant
  30 s à chaque panne. **Deux sources de français, donc** : un nom
  qu'OpenStreetMap ne connaît pas en anglais (une rue française EST
  française), et le filet, qui recollait ville, région et pays BRUTS
  d'une fiche d'avant la 805 (« Texas, États-Unis », « Paris,
  Île-de-France, France ») — sans la règle d'adresse ni la traduction
  du pays. Le géocodeur public n'est pas joignable depuis l'atelier
  (réseau fermé) : le `lang=en` est prouvé chez un faux Photon, pas chez
  le vrai. Pour le constater chez toi : ouvrir
  `https://<le site>/api/lieux?q=austin` et lire `source`
  (« geocodeur » ou « catalogue ») et `contexte`.
- **Corrigé** : `lieuDepuisFiche` (lib/geocodage) dit le pays en
  anglais d'après son code ISO (`Intl.DisplayNames`, « en » — la source
  de `paysDuLieu`) et compose la ligne grise par `contexteSuggestion`
  (lib/adresse, nº 114) : « TX, USA » sous « Austin », « France » sous
  « Paris ». Une fiche rouverte dans le formulaire repart avec ce nom
  anglais et l'écrit à l'enregistrement. Quatre notes devenues fausses
  depuis la 805 (« lang=fr », « nom français du code », « géocodeur
  interrogé en français », « nom français sinon ») mises à jour
  (piège 472).
- **La base, inventoriée** (docs/SQL-810-LOCALITES.md) : trois tables
  portent un lieu à plat — `tatoueurs` (`adresse`, `code_postal`,
  `ville_nom`, `ville_slug`, `region`, `pays`, `code_pays`, `lieu_id`,
  point), `studios` et `modes_exercice` (`intitule`, `adresse`,
  `code_postal`, `ville`, `region`, `pays`, `code_pays`, `lieu_id`,
  point) — plus `conventions` (`ville`, `region`, `code_pays`, point ;
  le pays se déduit du code). Ce qui est français par ERREUR D'ÉPOQUE :
  `pays` (« États-Unis ») et `region` quand le français a son mot
  (« Californie », « Bavière »). Ce qui l'est par NATURE : une rue, une
  ville françaises. **Réécrire `region` compte pour la recherche** : la
  fonction `rechercher_tatoueurs` compare le nom normalisé
  (`yf_normaliser`), et « Californie » ne répond plus à « California »
  que le champ propose depuis la 805. `pays` n'est que d'affichage (la
  recherche par pays lit le code). **Jamais réécrits** : `ville_nom`
  (`ville_slug` = adresse publique `/tatouage/<style>/<ville>`, sans
  redirection), `adresse`, `code_postal`, `lieu_id`, les points,
  `slug`, `tatoueurs.villes` (héritage).
- **Deux voies, livrées, relançables** : A · le SQL (pays d'après le
  code ISO, régions par table d'exonymes français → nom anglais tel
  qu'OpenStreetMap l'écrit — les variantes de lib/adresse plus l'Europe
  courante, transactions, comptes-rendus) ; B · le script
  `outils/relire-les-lieux-en-anglais.mjs` : pour chaque ligne qui a un
  point, `/reverse?lat&lon&lang=en` chez le géocodeur, et `region` +
  `pays` réécrits dans ses mots exacts (`code_pays` posé s'il manque),
  essai à blanc par défaut, `--reel` pour agir, une requête par seconde,
  ligne ignorée quand le point n'est pas dans le pays qu'elle dit. Le
  SQL est collé par Kevin, le script lancé par Kevin : rien n'a été
  exécuté sur la vraie base.
- **Le banc** (`localites-810.mjs`, faux Photon sur 3777 bâti dans le
  serveur par `NEXT_PUBLIC_PHOTON_URL`) : la route appelle le géocodeur
  en `lang=en` et rend « Austin / TX, USA » ; le champ du moteur (web)
  propose la même ligne ; Photon muet → le filet répond en 4,5 s, une
  fiche « Los Angeles / Californie / États-Unis » se lit « Los Angeles /
  CA, USA », pays « United States », « Munich / Bavière / Allemagne » →
  « Munich / Germany » ; le script à blanc liste les réécritures sans
  rien écrire (vérifié en base), `--reel` réécrit region et pays du
  portfolio, du studio et du mode, laisse la ville, laisse la ligne
  incohérente, laisse « Paris » ; une relance ne réécrit rien. 732, 746,
  747 : verts.

## 15 · Ce que la 811 a fait pour la langue (les adresses éditoriales)

- **Deux adresses passent en anglais**, sur décision de Kevin :
  `/qui-sommes-nous` → `/about`, `/mentions-legales` → `/legal` ;
  `/contact` ne bouge pas. Les anciennes redirigent en **301**
  (next.config, depuis `lib/chemins-editoriaux` — une seule écriture
  pour le pied de page, le plan du site, les adresses canoniques, le
  lien « site rules » de la création de compte et la liste des en-têtes
  de cache). Les outils de banc (`outils/balayage-vitesse`,
  `banc-vitesse`, `banc-resilience-703`, `banc-supabase-differe`,
  `reference-vitesse.json`) et le recenseur (le lot « C · pages
  éditoriales » reconnaît les nouveaux dossiers) suivent.
- **Les autres adresses restent françaises** (voir §5 du lexique) —
  la liste, avec une proposition anglaise pour la passe dédiée :
  `/devenir-tatoueur` → `/account` (la page du compte : Sign up / Log
  in) ; `/devenir-tatoueur/securite` → `/account/security` ;
  `/devenir-tatoueur/nouveau-mot-de-passe` → `/account/new-password` ;
  `/devenir-tatoueur/fiche` → `/account/portfolio` (l'éditeur) ;
  `/mes-favoris` → `/my-selection` (l'écran s'appelle « My selection ») ;
  `/rejoindre/<jeton>` → `/join/<token>` (le rattachement par lien) ;
  `/apres-connexion` → `/after-login` ; `/recherche` → `/search` ;
  `/tatouage/<style>/<ville>` → `/tattoo/<style>/<city>` ;
  `/tatoueur/<slug>` → `/artist/<slug>` (et `/complet` → `/full`) ;
  `/admin` et `/dev` sont déjà neutres. ⚠️ `/tatouage/…` et
  `/tatoueur/…` sont les adresses INDEXÉES et PARTAGÉES du site (fiches,
  pages de ville, images de partage, redirection `ancien_slug`) : leur
  déménagement demande des redirections par motif et une relecture du
  proxy, du plan du site et des liens internes — une passe à part
  entière, pas un renommage de dossier.

## 16 · Ce que la 814 a fait pour la langue (Terms of Use, DMCA)

- **Une quatrième page éditoriale, `/terms` (« Terms of Use »)**, née
  en anglais — le recenseur la classe avec les trois autres (« C · pages
  éditoriales », regex `(about|contact|legal|terms)`), résultat : 0
  texte français. Le pied de page dit **Terms** ; la création de compte
  dit **« you accept the Terms of Use »** (le lien menait à /legal sous
  « site rules »).
- **La page légale** gagne deux sections et deux ancres : **Copyright
  and DMCA** (`#dmca`, l'agent enregistré DMCA-1079752, notification,
  retrait, contre-notification) et **Terms of Use** (renvoi) ; la
  section vie privée s'intitule **Personal information (privacy
  policy)** (`#privacy`) et reçoit trois paragraphes (sous-traitants,
  droits, enfants). Les mots sont ceux du lexique (§ « Ajouts de la
  814 »). Ce qu'un juriste doit encore lire : docs/A-VALIDER-AVOCAT.md.
- **Deux textes d'interface nouveaux**, en anglais : « Not linked » et
  « Link » (page Sécurité, ligne Google), avec l'info-bulle « Link your
  Google account to log in with it ». Le rideau des pages de texte porte
  l'étiquette des squelettes, « Loading page ».
- **Un reste français relevé, non touché** (hors sujet de la passe) :
  `EcranAuthentification.tsx` dit « Connecte-toi » comme titre du mode
  connexion EN RATTACHEMENT — un état que l'écran de rattachement ne
  propose plus (il n'ouvre que la création), donc jamais peint, mais le
  mot est là. Le recenseur ne l'a pas vu : c'est la seconde branche d'un
  ternaire de JSX. À corriger à la prochaine passe de textes.
