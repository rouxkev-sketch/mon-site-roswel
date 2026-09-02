# Lexique anglais de YokoFolio — passe nº 804

**Ce document fait autorité pour les passes 805 et 806.** Il consigne les
décisions de Kevin (§1), celles prises en 804 pour les appliquer avec
cohérence (§2), le ton (§3), la typographie (§4) et ce qui n'est PAS
traduit (§5). Toute nouvelle décision se consigne ici, pas dans un
message.

---

## 1 · Les décisions de Kevin (à appliquer partout, sans exception)

| Français | Anglais | Note |
|---|---|---|
| tatoueur / tatoueuse | **tattoo artist** | jamais « tattooist » |
| Studio (mode d'exercice) | **Private Studio** | |
| Salon | **Tattoo Shop** | « shop » seul quand le contexte est clair : « Shop name », « No shop found » |
| Guest | **Guest Spot** | |
| Autre (mode d'exercice) | **Independent** | comme les plaques INDEPENDENT des profils |
| Convention | **Convention** | |
| distance / rayon | **Distance**, un nombre **sans unité** | jamais « in miles » : l'unité est implicite aux États-Unis. « Distance: 25 », « Expand to 50 » |

---

## 2 · Les décisions de la 804 (pour la cohérence, à suivre en 805-806)

### Les objets du site

| Français | Anglais | Note |
|---|---|---|
| portfolio | **portfolio** | |
| fiche (visible par le public) | **portfolio** | le mot « fiche » ne s'affiche jamais : c'est le portfolio d'un artiste ou d'un shop |
| profil (l'onglet, l'identité) | **profile** | « Profile or portfolio » |
| style | **style** | |
| variante (de style) | **variant** | aucune n'était visible dans le périmètre 804 ; à appliquer en 806 si le catalogue en montre |
| nature (réalisation / flash) | **Type** : **Tattoo** / **Flash** | la limace `tatouage` reste `tatouage` |
| rendu (noir / noir et gris / couleur) | **Ink** : **Black** / **Black & grey** / **Color** | les valeurs vivent en lib (805) ; le titre de groupe « Ink » est posé dans le moteur |
| technique | **Technique** | |
| booking ouvert / fermé / délai | **Books open** / **Books closed** / **Waitlist** (« 3-month wait ») | le mot des tatoueurs américains |
| équipe du salon | **shop team** (« Is your team on YokoFolio? ») | |
| rattachement (à une équipe, à un compte) | **link** / **linked** (« Already linked », « Linking failed ») | |
| récupérer mon portfolio (/rejoindre) | **Claim my portfolio** | |
| Ma sélection | **My favorites** | l'onglet « Favoris » → **Favorites**, « suivis » → **Following** |
| suivre / suivi | **Follow** / **Following** | |
| enregistrer une photo (le cœur) | **Save** / **Saved** | |
| signaler / signalement | **Report** / **report** | |
| notifications | **Notifications** ; non lue → **Unread** ; « Rien de neuf » → **Nothing new** | |
| mode d'activité / d'exercice | **How you work** (onglet artiste) ; **Organization** (onglet shop/studio) | |
| Spécificités (onglet) | **Details** | |
| horaires | **Hours** ; coupure du midi → **Lunch break** | |
| Mentions légales | **Legal Notice** (le lien du pied de page : **Legal**) | |
| Qui sommes-nous | **About** | |
| Contact / Écris-nous | **Contact** / **Get in touch** | |
| Partout (lieu non choisi) | **Anywhere** | |

### Les gestes et les états

| Français | Anglais |
|---|---|
| Se connecter / Connecte-toi | **Log in** |
| Déconnexion | **Log out** |
| Créer mon compte (bouton) / Crée ton compte (titre) | **Sign up** / **Create your account** |
| Mon compte, Mon espace | **My account** (un seul mot pour les deux) |
| Enregistrer / Enregistrer mes modifications | **Save** / **Save changes** |
| Envoyer / Envoi… / Envoi en cours… | **Send** / **Sending…** |
| Annuler · Supprimer · Retirer · Effacer | **Cancel** · **Delete** · **Remove** · **Clear** |
| Fermer · Retour · Continuer · Valider | **Close** · **Back** · **Continue** · **Done** (« Search » quand c'est une recherche) |
| Modifier / Éditer | **Edit** |
| Ajouter | **Add** |
| Compris | **Got it** |
| Un instant… | **One moment…** |
| Chargement… / Lecture… | **Loading…** |
| Voir plus | **See more** |
| Réessaie | **Try again** |
| L'envoi n'a pas abouti. | **Sending failed.** |
| L'opération n'a pas abouti. | **The operation failed.** |
| en ligne / hors ligne | **online** / **offline** (« Take the portfolio offline ») |
| en validation / en cours de vérification | **under review** |
| modifications demandées | **Changes requested** |
| refusé(e) / accepté(e) | **declined** / **added** (un style, une convention) |
| désactivé | **deactivated** |
| retiré / rétabli | **removed** / **restored** |
| Actif (méthode de connexion) | **Active** |
| Délier / Lier mon compte Google | **Unlink** / **Link my Google account** |
| le mot de confirmation à taper | **DELETE** (était SUPPRIMER — la comparaison du code a suivi) |

### Les champs

| Français | Anglais |
|---|---|
| Adresse e-mail / E-mail | **Email address** / **Email** (sans trait d'union, usage américain) |
| Mot de passe / Mot de passe oublié ? | **Password** / **Forgot your password?** |
| Nom / Ton nom (ou un pseudo) | **Name** / **Your name (or a handle)** |
| Ton nom d'artiste | **Your artist name** |
| Ta présentation / Ta bio | **About you** / **Your bio** |
| Ville, ou adresse complète… | **City, or full address…** |
| Localisation | **Location** |
| Recherche | **Search** |

---

## 3 · Le ton

- **Anglais américain, décontracté** : le « you » direct, phrases
  courtes, jamais guindé. Le site tutoyait ; « you » garde cet esprit.
- Orthographe américaine : *color*, *catalog*, *canceled*, *favorites*,
  *organization*.
- Contractions bienvenues dans les messages (« Couldn't send », « it'll
  be online ») ; pas dans les titres de section.
- Les messages d'erreur disent le fait, puis le geste : « Sending
  failed. Try again. »

---

## 4 · La typographie (ce qui change avec la langue)

- **Plus d'espace avant `?` `!` `:` `;`** — les `&nbsp;` français qui les
  précédaient sont retirés, les espaces insécables U+00A0 / U+202F aussi.
- **Guillemets** : `"…"` droits (`&quot;` en JSX) — les « » disparaissent.
- **Apostrophes** : `'` dans les chaînes JavaScript, `&apos;` dans le
  texte JSX (règle de lint du dépôt).
- **Tiret long** : ` — ` avec espaces, comme avant ; le texte de Kevin sur
  la page About garde SON tiret collé (« portfolio—the core »), tel quel.
- **Dates** : `en-US` (les `toLocaleDateString` et `Intl.DateTimeFormat`
  du périmètre sont passés de `fr-FR` à `en-US` : notifications,
  suppressions, calendrier des sessions). Ceux qui restent en `fr-FR`
  vivent en lib/admin : lot de la 806 (§7 de l'inventaire).
- **`lang="en"`** sur `<html>`, `locale: "en_US"` pour Open Graph,
  `lang: "en"` dans le manifeste.

---

## 5 · Ce qui n'est PAS traduit, et pourquoi

- **Les adresses (routes)** : `/devenir-tatoueur`, `/qui-sommes-nous`,
  `/mentions-legales`, `/mes-favoris`, `/rejoindre`, `/tatouage/…`,
  `/tatoueur/…` restent en français. Ce ne sont pas des textes : ce sont
  des liens, des redirections, des adresses canoniques, des images de
  partage, des bancs. C'est un sujet à part, à décider par Kevin (une
  passe « adresses »).
- **Les limaces** (`fine-line`, `tatouage`, `salon`, `prive`…) : des
  clés, en base et dans les adresses.
- **Les noms propres** : YokoFolio, Instagram, TikTok, Google, Vercel,
  Supabase, les noms de conventions.
- **Les instruments internes** (`SondeNavigation`, `SondeVitesse`,
  `TableauDeBordDesSondes`, `OutilsSonde`, `BoutonEnvoyerJournal`,
  `MemoireNavigation`, `DefilementEnHaut`) et les étiquettes
  `data-source-composant` : lus par les sondes depuis /dev, jamais
  affichés à un visiteur — lot de la 806, déclarés en exception du banc.
- **Les commentaires du code** restent en français : ils sont pour Kevin.
