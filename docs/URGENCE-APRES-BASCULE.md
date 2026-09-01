# Les deux défauts du lendemain de bascule

**Passe nº 775.** Deux pannes constatées en production après le passage
à `yokofolio-us`. Elles n'ont aucun rapport entre elles, et elles se
réparent séparément — **la première sans redéployer**.

---

## Défaut 1 — les photos ne s'affichent plus

### La cause

La base ne garde pas des chemins, elle garde des **adresses entières** :

```
https://<projet>.supabase.co/storage/v1/object/public/photos-tatoueurs/…
```

Le déménagement a copié les **fichiers** vers le nouveau projet
(1150 sur 1150), mais les **lignes** nomment toujours l'ancien projet.
Et `next.config.ts` n'autorise l'optimiseur d'images **que sur le
domaine du projet courant** — il le calcule au moment de la
construction, à partir de `NEXT_PUBLIC_SUPABASE_URL`.

Chaque photo restée à l'ancienne adresse est donc **refusée** : le
fichier existe, des deux côtés, mais le site n'a plus le droit de le
demander. D'où l'image cassée.

> C'est aussi pourquoi certaines photos s'affichent encore : celles des
> fiches de démonstration sont des chemins locaux (`/images-demo/…`),
> qui ne passent pas par ce contrôle.

### La réparation — aucun déploiement, tout de suite

`supabase/photos-reprendre-les-adresses.sql`, à coller dans le
**nouveau** projet, **un bloc à la fois**.

- **Bloc 1** — il ne modifie rien. Il compte les adresses **par
  domaine et par seau**. C'est lui qui répond aux trois questions :
  combien pointent encore vers l'Irlande, combien sont déjà bonnes, et
  combien nomment le vieux seau `photos-artisans`.
- **Bloc 2** — la réécriture. **Remplace les deux domaines** de sa
  première ligne par ce que le bloc 1 t'a montré. Il ne touche QUE le
  domaine : le chemin, le seau, le nom du fichier ne bougent pas ; les
  chemins locaux sont ignorés ; il est **rejouable**.
- **Bloc 3** — relance le bloc 1. Plus une seule ligne ne doit porter
  l'ancien domaine.

Il traite les **six** colonnes qui portent des adresses, y compris le
tableau `tatoueurs.photos` (l'ordre est gardé) et le JSON
`tatoueurs.photos_styles`.

### Les 13 photos manquantes, et le second seau

La sauvegarde comptait **1163** photos, le seau en contenait **1150** :
les 1150 fichiers ont tous été copiés, **rien n'a été oublié de ce
seau-là**. Les 13 de différence sont des **lignes** dont l'adresse
pointe ailleurs — très probablement vers `photos-artisans`, le seau de
l'ancien produit artisans (14 fichiers).

**Le bloc 1 te le dira au chiffre près.** S'il montre des lignes en
`photos-artisans`, ces photos-là ne sont pas encore copiées :

1. crée le seau `photos-artisans` dans le nouveau projet
   (Storage ▸ New bucket, **Public : OUI**, nom au caractère près) ;
2. copie-le — l'outil sait déjà changer de seau :

```
SEAU_PHOTOS=photos-artisans \
CIBLE_URL='https://xxxxx.supabase.co' \
CIBLE_SECRET_KEY='la clé secrète du NOUVEAU projet' \
  sh outils/demenager-photos --reel
```

3. relance le bloc 2 : il réécrira aussi ces adresses-là.

> S'il n'y a **aucune** ligne en `photos-artisans`, ce seau ne sert
> plus à rien : le produit artisans est parti à la nº 760. Ne le copie
> pas.

---

## Défaut 2 — la barre dit « Se connecter » alors qu'on est connecté

### La cause — un vrai défaut du code, que seule une bascule révèle

Le site lit qui est connecté **dans un cookie**, et le nom de ce cookie
porte le nom du projet : `sb-<projet>-auth-token`.

Changer de projet change ce nom. Et **rien n'efface l'ancien cookie** :
le navigateur de qui s'était connecté avant la bascule en porte
désormais **deux**. Or la lecture prenait *tous* les cookies
`sb-…-auth-token`, sans regarder de quel projet, et **collait leurs
valeurs bout à bout**. Le résultat n'était plus lisible : la lecture
échouait, rendait « personne », et la barre concluait « Se connecter ».

C'est pourquoi les favoris et le portfolio s'affichaient quand même :
eux passent par le serveur, qui interroge Supabase directement.

Reproduit au banc, sans ambiguïté :

```
le nouveau cookie seul      → kevin@usa
l'ancien cookie seul        → kevin@irlande
LES DEUX ensemble           → AUCUN UTILISATEUR   ← le défaut
```

### La réparation — elle demande un déploiement

`src/lib/session-cookie.ts` **groupe désormais les morceaux par
projet** et n'en recompose jamais qu'un seul. Le projet courant est
essayé d'abord ; si sa session est absente, les autres groupes sont
tentés — un ancien cookie encore valable vaut mieux qu'un écran
déconnecté.

Après déploiement, plus rien à faire : ni vider ses cookies, ni se
reconnecter.

> **En attendant le déploiement**, chacun peut se dépanner en vidant
> les données du site dans son navigateur, puis en se reconnectant.
> Mais ce n'est plus nécessaire une fois la version en ligne.

---

---

## Défaut 3 — les photos repartent aux États-Unis à chaque affichage

**Passe nº 777.** Une fois les images revenues, il restait ceci : les
1150 photos copiées étaient servies en `cache-control: no-cache`.

### La cause

`no-cache` ne veut pas dire « garde-la une heure » : il veut dire **« ne
la réutilise jamais sans me redemander d'abord »**. Le réseau de
diffusion de Supabase, qui a des machines partout dans le monde, devait
donc revalider **chaque photo auprès de l'origine, à chaque
affichage** — et l'origine est maintenant américaine. La distance se
payait sur toutes les photos, de toutes les grilles.

Cette consigne n'est pas **dans** le fichier : elle est dans ses
métadonnées, posées au moment du dépôt. `demenager-photos` copiait les
octets sans la poser, et le service mettait alors son réglage par
défaut. Le site, lui, la pose depuis la nº 721 (`lib/cache-photos`,
un an) : ce sont **les photos déménagées, et elles seules**, qui sont
concernées.

### La réparation — une commande, aucun déploiement

```
sh outils/reprendre-le-cache          # à blanc : il compte
sh outils/reprendre-le-cache --reel   # il renvoie ce qui est mal réglé
```

Il relit chaque photo mal réglée et la renvoie **à son propre chemin**,
avec les octets qu'il vient d'en lire : rien n'est recompressé ni
renommé, aucune adresse ne change, **aucun SQL à passer après**. Une
photo déjà bonne n'est pas touchée — relancé, il ne reprend que ce qui
reste. Pour le second seau : `SEAU_PHOTOS=photos-artisans`.

### Ce que la nº 778 a corrigé dans cet outil

Sa première version **restait muette plusieurs minutes** : elle
demandait la consigne photo par photo — 1150 allers-retours vers les
États-Unis — sans rien afficher. Elle travaillait, mais rien ne le
disait. Trois choses ont changé :

- **la consigne se lit dans la liste du seau**, qui la porte déjà : le
  constat passe de quelques minutes à quelques secondes ;
- **l'outil dit où il en est** — la lecture tous les 200 fichiers, la
  reprise toutes les 25 photos avec l'heure, réussites et échecs
  comptés à part (l'ancien « 1150/1150 » mélangeait les deux) ;
- **tout s'écrit aussi dans `reprise-du-cache.txt`**, au fil de l'eau :
  une fenêtre de terminal fermée ne fait plus perdre le compte rendu.

Et surtout : **il éprouve son geste sur UNE photo avant de dérouler**.
Il la renvoie, relit sa consigne, et ne continue que si elle a
réellement changé — sinon il essaie l'autre façon d'écrire, et s'arrête
net si aucune ne prend. Renvoyer 1150 photos sans effet n'est plus
possible.

> Après coup, le réseau de diffusion peut encore servir quelques
> minutes ses réponses d'avant : c'est normal. Pour regarder toi-même :
> `curl -sI "<adresse d'une photo>" | grep -i cache-control`

Et pour les prochaines fois : `demenager-photos` pose désormais la
consigne sur chaque copie — une bascule future arrivera d'aplomb.

---

## L'ordre à suivre

1. **Le SQL des photos** (bloc 1, puis 2, puis 1 à nouveau) — le site
   retrouve ses images **sans redéploiement**.
2. **Le second seau**, si le bloc 1 en montre.
3. **Déployer** cette version — la barre redevient juste.
4. Contrôler : une fiche avec ses photos, puis une connexion.
5. **`sh outils/reprendre-le-cache --reel`** — les photos cessent de
   repartir aux États-Unis à chaque affichage (défaut 3, sans
   déploiement lui non plus).
