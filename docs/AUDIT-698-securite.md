# AUDIT nº 698 — LA SÉCURITÉ

**Passe de mesure. Aucune correction n'a été faite.**
Lecture seule stricte : rien n'a été modifié dans `src/`, `supabase/` ni
en base. Le site ouvrant au public, l'audit cherche ce qu'un **visiteur
malveillant** pourrait faire.

Méthode : lecture du dépôt (routes, politiques SQL, composants), plus
quelques mesures au banc. Ce qui ne peut pas être vérifié depuis
l'atelier est listé en fin de document, avec les commandes à passer en
production.

---

## LE TOP 5 — par ordre d'importance

| | Le défaut | Pourquoi c'est le pire | Gravité |
|---|---|---|---|
| **1** | Trois **vues publiques** (`points_tatoueur`, `zones_tatoueur`, `lieux_tatoueur`) lisent `tatoueurs` **sans filtre de visibilité** et **sans `security_invoker`** | Un visiteur non connecté peut lire l'**adresse et les coordonnées GPS de TOUS les portfolios** — y compris les brouillons jamais publiés, les refusés, et ceux en cours de suppression. Pour un tatoueur qui travaille à domicile, c'est son adresse personnelle. | 🔴 ROUGE |
| **2** | Le garde-fou de la base (`tatoueurs_garde_fou`) ne protège que `publie` et `validation_a_notifier` | Un tatoueur peut, par un appel direct, remettre `supprime_le` et `purge_le` à `null` sur SA fiche — donc **annuler lui-même la suppression décidée par l'administration** (les 7 jours de la nº 696). La modération est contournable. | 🔴 ROUGE |
| **3** | `JsonLd` insère `JSON.stringify(...)` dans un `<script>` sans échapper `<` | Un nom de portfolio contenant `</script>…` devient du **code exécuté chez tous les visiteurs** de la page. Atténué par la modération (le nom passe devant toi) mais c'est la faille la plus classique du web, et il n'y a **aucune CSP** pour l'arrêter. | 🔴 ROUGE |
| **4** | Quatre routes d'écriture **ouvertes à tous** avec la clé de service : `tatoueur/contact`, `rendez-vous`, `tatoueur/signalement`, `tatoueur/clic` | Aucune session, aucun captcha, aucun plafond. Les deux premières **envoient un e-mail** : n'importe qui peut noyer un tatoueur sous des messages, ou faire brûler ton quota Resend. | 🔴 ROUGE |
| **5** | `/api/verif-supabase` est **publique et sans garde** | Elle annonce le schéma et le **nombre de lignes visibles** de sept tables. C'est un banc d'essai gratuit pour savoir ce que le RLS laisse passer, offert à quiconque connaît l'adresse. | 🟠 ORANGE |

---

## 1 · LES RÈGLES D'ACCÈS À LA BASE (RLS)

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| RLS activée partout | Les **26 tables** du dépôt portent `enable row level security`. Aucune oubliée. | 🟢 VERT | — |
| Tables du produit artisans/Roswel | `artisans`, `particuliers`, `favoris`, `conversations`, `messages`, `communes`, `signalements`, `demarchages`, `messages_contact`, `clics_fiches`, `suppressions_comptes`, `artisans_prospects` : RLS activée, **zéro politique** → refus par défaut, clé de service seule. | 🟢 VERT | — |
| Favoris, suivis, visites | `auth.uid() = utilisateur_id` en lecture, écriture et suppression. **A ne peut pas voir les favoris de B.** | 🟢 VERT | — |
| Notifications | Lecture et « marquer comme lue » bornées à `auth.uid() = user_id` ; **aucune** politique d'insertion ni de suppression. | 🟢 VERT | — |
| Photos d'un portfolio | Écriture liée au portfolio possédé (`exists … t.user_id = auth.uid()`). **A ne peut pas effacer les photos de B.** | 🟢 VERT | — |
| Rattachements artiste/salon | Insertion et suppression liées à la possession de la fiche concernée. | 🟢 VERT | — |
| Modification de sa fiche | `using (auth.uid() = user_id)` — A ne peut pas modifier la fiche de B. Insertion forcée à `publie = false`. | 🟢 VERT | — |
| **Le garde-fou ne couvre que deux colonnes** | `tatoueurs_garde_fou` réécrit `new.publie := old.publie` et bloque `validation_a_notifier`. **Rien d'autre.** `supprime_le`, `purge_le`, `hors_ligne`, `statut`, `motifs_moderation`, `decide_le`, `admin_publique` restent modifiables par le propriétaire. | 🔴 ROUGE | Étendre le trigger à ces colonnes (même forme : `new.X := old.X` quand `auth.uid()` n'est pas nul). |
| **Trois vues publiques contournent le RLS** | `points_tatoueur`, `zones_tatoueur`, `lieux_tatoueur` : `security_invoker` absent (donc RLS des tables **non appliqué**), `grant select … to anon`, et **aucun filtre** `publie`/`supprime_le` dans leur corps. `lieux_tatoueur` sélectionne `t.adresse, t.code_postal`. | 🔴 ROUGE | Ajouter `with (security_invoker = true)` **et** un `where public.fiche_en_ligne(t.id)` dans les trois vues. |
| `coeurs_par_photo` | `security_invoker = false` **explicite et commenté** ; la vue ne rend que `photo_id` + un compte, jamais qui. Choix assumé. | 🟢 VERT | — |
| `equipe_salon`, `modes_exercice_actifs`, `clics_tatoueurs` | Même absence de `security_invoker`, mais les données exposées (nom d'artiste, slug, photo, compteurs) sont déjà publiques ou anodines. À revoir avec les trois ci-dessus. | 🟠 ORANGE | Passer toute la famille en `security_invoker = true` d'un coup. |
| Seau de photos | Dépôt/écriture/effacement bornés au dossier `auth.uid()`. **Lecture publique du seau entier.** | 🟠 ORANGE | Les photos d'un portfolio non publié restent joignables par leur adresse directe — voir §3. |

---

## 2 · LES ROUTES DU SERVEUR (52 routes)

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| Routes `/api/admin/yokofolio/*` (7) | Toutes passent par `verifierAdmin()` **côté serveur**, avant tout effet. Un compte ordinaire qui appelle la route en `curl` reçoit un refus. | 🟢 VERT | — |
| Anciennes routes `/api/admin/*` (13, produit artisans) | Aucune vérification d'identité — mais **toutes** portent `if (process.env.NODE_ENV === "production") return 403`, une par méthode exportée (13 méthodes, 13 gardes, vérifié un par un). Inertes en ligne. | 🟢 VERT | — |
| … la même, vue autrement | Le jour où l'une devra servir en production, la garde saute et il n'y a **rien derrière** : ces routes emploient la clé de service. | 🟠 ORANGE | Y ajouter `verifierAdmin()` **avant** d'y toucher, pas après. |
| Routes de tâches planifiées (3) | `CRON_SECRET` exigé ; sans la variable, la route refuse (503) au lieu de s'ouvrir. Bon sens du refus. | 🟢 VERT | — |
| `tatoueur/supprimer-fiche` | Relit la fiche et compare `ligne.user_id !== user.id` → refus. Un identifiant volé ne sert à rien. | 🟢 VERT | — |
| `tatoueur/liaison` | Ne vérifie pas la possession dans le code — **mais** travaille avec le client de la personne (pas la clé de service), donc le RLS tranche, et la route sait lire son refus (`403`). | 🟢 VERT | — |
| **`/api/verif-supabase`** | **Aucune garde.** Annonce l'existence de 7 tables et le **nombre de lignes lisibles** de chacune, plus les messages d'erreur bruts de Supabase. **Mesuré au banc, pas seulement lu** : `curl` sans le moindre cookie → **200**. | 🟠 ORANGE | La supprimer, ou la fermer comme les autres outils (`NODE_ENV === "production"`). |
| `dev/journal-de-bord`, `dev/journal-sonde` | Fermées en production. | 🟢 VERT | — |
| **Quatre routes ouvertes avec la clé de service** | `tatoueur/contact` et `rendez-vous` **envoient un e-mail** ; `tatoueur/signalement` et `tatoueur/clic` écrivent en base. Ni session, ni captcha, ni plafond. | 🔴 ROUGE | Turnstile sur les deux qui envoient un e-mail, plafond par IP sur les quatre. |
| La clé secrète côté navigateur | `SUPABASE_SECRET_KEY` n'est lue que dans `src/lib/supabase/admin.ts`, jamais préfixée `NEXT_PUBLIC_`. Aucun `creerClientSupabaseAdmin` dans un composant client. | 🟢 VERT | — |

---

## 3 · LES ENTRÉES DU SITE

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| **XSS par les données structurées** | `JsonLd` fait `dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}` dans un `<script>`. `JSON.stringify` **n'échappe pas** `<`. Le nom du portfolio y entre (`name: tatoueur.nom`), sur la page publique du tatouage **et** sur celle des artisans. | 🔴 ROUGE | `.replace(/</g, "\\u003c")` après le `stringify` — une ligne. |
| Injection SQL | Aucune requête construite par concaténation. Tout passe par le client Supabase (requêtes paramétrées) ou par deux fonctions `rpc` à paramètres nommés. | 🟢 VERT | — |
| `eval`, `new Function`, `innerHTML` | Aucun dans `src/`. | 🟢 VERT | — |
| Autres `dangerouslySetInnerHTML` (3) | Script anti-clignotement et variables CSS : contenu **produit par le code**, aucune donnée d'utilisateur. | 🟢 VERT | — |
| **Un fichier déguisé passe** | `compresserPhoto` réencode via un canvas — mais son `catch` rend **le fichier d'origine** (« Format non lisible par le navigateur : on envoie l'original »). Le dépôt part **du navigateur directement vers le stockage** : aucune vérification serveur n'existe. | 🟠 ORANGE | Refuser plutôt que de renvoyer l'original, et forcer `contentType: "image/jpeg"` au dépôt. |
| Taille et nombre de photos | **Aucun plafond trouvé** : ni octets par fichier, ni nombre de photos par portfolio. Un compte peut remplir le stockage. | 🟠 ORANGE | Un plafond d'octets côté client + un plafond de fichiers par portfolio en base. |
| Adresses du stockage | `getPublicUrl` partout : **aucune adresse signée**, le seau est public en lecture. Les photos d'un portfolio non publié ou en suppression restent joignables par leur adresse. | 🟠 ORANGE | Adresses signées à durée courte, ou seau privé + route de service. |
| En-têtes de sécurité | `next.config` ne pose **que** `Cache-Control`. Pas de `Content-Security-Policy`, pas de `X-Frame-Options`, pas de `X-Content-Type-Options`, pas de `Referrer-Policy`. | 🟠 ORANGE | Un bloc `headers()` avec ces quatre en-têtes — c'est le filet sous le point nº 3. |

---

## 4 · LES FICHES DE DÉMONSTRATION

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| Le verrou | `catalogueDemoAutorise()` rend faux dès que `NODE_ENV === "production"`. | 🟢 VERT | — |
| Les six points d'appel | `lireVilleParSlug`, `listerTatoueurs`, `lireTatoueur` (×2), `villes-catalogue` : **tous** passent le verrou avant de toucher `TATOUEURS_DEMO`. | 🟢 VERT | — |
| Plan du site et recherche | Aucune référence aux démos dans `sitemap.ts` ni dans les routes `yokofolio/*` : **aucune démo indexable ni servable**. | 🟢 VERT | — |
| La porte dérobée | `if (process.env.CATALOGUE_DEMO === "1") return true` — une variable d'environnement rallume tout, même en production. | 🟠 ORANGE | Vérifier qu'elle n'existe pas sur Vercel (commande en fin de document). |

---

## 5 · LES SECRETS

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| Balayage du dépôt | Recherche des formes `sb_secret_`, `sbp_`, `re_…`, `AIza…`, jetons `eyJ…`, et de tout `password/secret/token = "…"` de plus de 12 caractères, hors `node_modules`. **Aucune clé vivante.** | 🟢 VERT | — |
| `docs/IMPORT-COMMUNES.md:17` | Porte `SUPABASE_SECRET_KEY=sb_secret_…`. Mesuré sans l'afficher : **13 caractères, tous identiques, aucun chiffre** → c'est un gabarit, pas une clé. (La vraie clé publique de comparaison fait 32 caractères.) | 🟢 VERT | — |
| `.env.local.example` | Contient l'adresse réelle du projet Supabase et la clé **publishable**. Les deux sont publiques par nature (la clé part dans le navigateur). | 🟢 VERT | — |
| L'ancienne clé secrète | Régénérée à la passe nº 697 : **morte**. Elle a été retirée du `.env.local` de l'atelier (41 caractères effacés à l'aveugle, jamais affichés) et ne figure dans aucune livraison depuis. Elle n'est recopiée nulle part dans ce rapport. | 🟢 VERT | — |
| `.env.local` livré | Depuis la nº 697 : `SUPABASE_SECRET_KEY=` **vide**, la clé posée par `sh livre` depuis `~/.yokofolio/env.local`. | 🟢 VERT | — |

---

## 6 · LES ABUS

| Point | Constat | Gravité | Correction en une ligne |
|---|---|---|---|
| Limiteur de débit | **Il n'y en a aucun**, nulle part : pas de compteur par IP, pas de `429`, pas de `Retry-After`, aucun middleware. | 🔴 ROUGE | Un plafond par IP sur les routes d'écriture ouvertes (le point nº 4 du top 5). |
| Captcha | Turnstile n'est vérifié que sur **deux** routes, toutes deux du produit artisans : `/api/contact` et `/api/signalements`. Aucune route YokoFolio n'en a. | 🟠 ORANGE | Étendre aux deux routes qui envoient un e-mail. |
| Création de comptes en masse | `signUp` est appelé **depuis le navigateur** dans les trois écrans, sans captcha. La seule barrière est celle de Supabase (confirmation par e-mail, plafonds du projet). | 🟠 ORANGE | Activer le captcha d'inscription dans Supabase (réglage du tableau de bord, pas du code). |
| Longueur des champs | `tatoueur/contact` et `tatoueur/signalement` coupent leurs champs ; **`rendez-vous` ne coupe rien**. | 🟠 ORANGE | Un `.slice(0, n)` sur chaque champ, comme les deux autres. |
| Signalements en masse | Aucune limite par compte ni par fiche. | 🟠 ORANGE | Un signalement par compte et par fiche (index unique). |

---

## CE QUI N'A PAS PU ÊTRE VÉRIFIÉ DEPUIS L'ATELIER

L'atelier **n'a aucun accès réseau sortant** : ni la base, ni Vercel, ni
le stockage. Tout ce qui suit est lu **dans le dépôt**, et le dépôt
n'est pas la base — une politique a pu être modifiée à la main dans la
console Supabase sans que le fichier SQL le sache.

### À coller dans l'éditeur SQL de Supabase (aucune écriture)

**1. Les vraies politiques, table par table** — la question nº 1 de l'audit :

```sql
select tablename, policyname, cmd, roles::text, qual, with_check
  from pg_policies where schemaname = 'public'
 order by tablename, cmd;
```

**2. Les tables SANS RLS** — doit rendre **zéro ligne** :

```sql
select tablename from pg_tables
 where schemaname = 'public' and rowsecurity = false;
```

**3. Les vues qui contournent le RLS** — le point nº 1 du top 5.
Doit rendre zéro ligne une fois corrigé :

```sql
select c.relname as vue,
       coalesce((select option_value from pg_options_to_table(c.reloptions)
                  where option_name = 'security_invoker'), 'absent') as invoker
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'v'
   and coalesce((select option_value from pg_options_to_table(c.reloptions)
                  where option_name = 'security_invoker'), 'false') <> 'true'
 order by 1;
```

**4. Ce qu'un visiteur NON CONNECTÉ peut lire** — le plus parlant :

```sql
set role anon;
select count(*) from public.points_tatoueur;   -- devrait être limité aux fiches en ligne
select count(*) from public.lieux_tatoueur;    -- idem
select count(*) from public.particuliers;      -- doit ÉCHOUER ou rendre 0
select count(*) from public.messages;          -- doit ÉCHOUER ou rendre 0
reset role;
```

**5. Le garde-fou du portfolio** — le point nº 2 du top 5 :

```sql
select prosrc from pg_proc where proname = 'tatoueurs_garde_fou';
```

### À vérifier dans le tableau de bord Vercel

- **Variables d'environnement du projet `yokofolio`** : que `CATALOGUE_DEMO`
  **n'existe pas** (sinon les fiches de démonstration reviennent en
  production), et que `CRON_SECRET` **existe** (sinon les purges ne
  tournent plus).

### À vérifier dans le tableau de bord Supabase

- **Authentication → Attack Protection** : le captcha d'inscription est-il
  activé ? C'est la seule barrière contre la création de comptes en masse,
  et elle ne se règle pas dans le code.
- **Storage → le seau `photos-tatoueurs`** : est-il public ? (l'audit le
  déduit de `getPublicUrl`, mais le réglage fait foi.)

### Ce que le banc ne peut pas trancher

- **Le XSS du point nº 3 n'a pas été déclenché** : il faudrait un
  portfolio nommé `</script>…` **validé par la modération**, ce qui
  suppose de passer devant toi. La lecture du code suffit à établir le
  chemin ; la démonstration demanderait d'écrire en base.
- **Les quatre routes ouvertes n'ont pas été martelées** : mesurer un
  abus de débit dans l'atelier ne dirait rien de la production (Vercel a
  ses propres protections de plateforme, que je ne peux pas observer d'ici).

---

*Audit produit à la passe nº 698. Aucune ligne de `src/` ni de
`supabase/` n'a été modifiée. Aucune clé vivante n'apparaît dans ce
document.*
