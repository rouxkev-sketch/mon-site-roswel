# Les photos passent par le cache mondial de Vercel

**Passe nº 782.** Ce que ça change, ce que ça coûte, et comment le
vérifier une fois en ligne.

---

## Pourquoi

Le stockage Supabase **range** la consigne de cache qu'on lui donne mais
**sert `no-cache`** — établi à la nº 781 sur les deux projets, sur un
fichier neuf, après cinq façons d'écrire différentes. `no-cache` veut
dire « ne réutilise jamais sans me redemander d'abord » : aucun réseau
de diffusion n'a le droit de garder une copie. Chaque affichage de
chaque photo repartait donc jusqu'aux États-Unis.

On cesse d'attendre que ce service change d'avis. **La diffusion passe
de notre côté.**

---

## Comment, en une phrase

Une photo n'est plus demandée à `<projet>.supabase.co` par le
navigateur : elle est demandée à **notre site**, qui la relaie et pose
lui-même la consigne. Vercel garde alors la réponse à son bord — près du
visiteur — et la ressert sans rien redemander.

```
avant :  navigateur ─────────────────────────────► Supabase (États-Unis)
                     à chaque affichage, sans exception

après :  navigateur ──► Vercel, au plus près ──► (la 1re fois) Supabase
                        ensuite : plus rien ne repart
```

**Les adresses en base ne changent pas** (la leçon de la nº 775) : la
base porte toujours l'adresse Supabase entière. C'est à l'affichage
qu'on la traduit — rien à migrer, et rien à défaire pour revenir en
arrière.

---

## Ce qui NE change pas

- **Les octets servis sont ceux du stockage, au bit près** — mesuré au
  banc. Aucun ré-encodage, aucun redimensionnement : rien ne bouge à
  l'œil, et la règle nº 280 (une photo arrive en une seule fois) tient.
- **Les cartes de la mosaïque gardent l'optimiseur d'images** (nº 366) :
  elles ont besoin d'une taille adaptée à l'écran, c'est ce qui a
  corrigé leur grain. Rien n'y est touché.
- **Le service worker se retire des photos**, exprès : son cache est
  vidé à chaque mise en ligne, y ranger mille photos les ferait
  retélécharger à chaque déploiement. Le navigateur, lui, les garde
  grâce à `immutable` — et personne ne vide son cache à notre place.

---

## Ce que ça coûte, à l'échelle d'aujourd'hui

Le plan Pro de Vercel compte trois choses différentes ; celle qui se
facture cher pour des images est la **transformation** :

| Ce qui est compté | Ce que cette passe ajoute |
|---|---|
| **Transformations d'images** | **zéro.** La porte ne transforme rien — elle relaie. Seules les cartes en consomment, exactement comme avant. |
| **Invocations de fonction** | une par photo **et par région de bord**, puis plus rien tant que la copie vit (un an). Pour 1150 photos : quelques milliers au total, contre un million inclus. |
| **Transfert de données** | inchangé la première fois, puis **servi du bord**. Le catalogue entier (1150 photos, ~200 Ko pièce) pèse ~230 Mo — pour 1 To inclus. |

**Autrement dit : négligeable, et surtout sans risque de dépassement du
quota d'images**, qui est le poste sensible.

> **Un point à surveiller, sans rapport avec cette passe** : les cartes
> demandent à l'optimiseur jusqu'à cinq largeurs différentes par photo.
> Si un jour les 1150 photos sont toutes vues à toutes les tailles, cela
> ferait plusieurs milliers de transformations. Le compteur se lit dans
> Vercel ▸ Usage ▸ Image Optimization. Rien à faire aujourd'hui : le
> trafic est faible, et l'on ne paie que ce qui est réellement demandé.

---

## Comment vérifier, une fois en ligne

L'atelier ne peut pas le prouver : le cache de bord est celui de Vercel,
il n'existe qu'en production. Voici les deux commandes, à lancer **après
le déploiement**.

**1. La consigne est bien posée** (une seule photo suffit) :

```
curl -sI "https://<ton-site>/photos/photos-tatoueurs/<chemin>/<photo>.jpg" \
  | grep -iE 'cache-control|x-vercel-cache|age'
```

Attendu : `cache-control: public, max-age=31536000, s-maxage=31536000,
immutable`.

**2. La deuxième demande vient du bord** — relance **la même** commande
aussitôt après :

```
   1re fois : x-vercel-cache: MISS    (Vercel est allé chercher)
   2e  fois : x-vercel-cache: HIT     (il a resservi de sa mémoire)
```

C'est **`HIT` qui prouve la passe**. À partir de là, plus aucune demande
ne repart jusqu'au stockage pour cette photo.

> Souviens-toi de la leçon de la nº 780 : un `HIT` ne prouve rien sur
> l'état d'un fichier. Ici c'est l'inverse — c'est exactement ce qu'on
> veut voir, et `cache-control` dit, lui, ce que la porte a posé.

**3. À l'œil** : une fiche, ses photos, une carte de la mosaïque, un
avatar. Rien ne doit avoir changé — ni la netteté, ni le cadrage, ni la
vitesse d'apparition (elle devrait s'améliorer au second affichage).

---

## Si quelque chose cloche

Tout se défait en une ligne : c'est la fonction `photoDuBord`
(`lib/photos-du-bord`) qui traduit les adresses. Lui faire rendre
l'adresse reçue telle quelle remet le site exactement dans son état
d'avant, sans toucher ni à la base, ni aux fichiers.
