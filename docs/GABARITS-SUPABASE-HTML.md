# Les trois gabarits d'e-mails Supabase, habillés
### **passe nº 825 — les e-mails sont passés en FOND CLAIR**

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Ce document est **fabriqué à partir de `src/lib/courriel-habille.ts`** :
la coquille en sort telle quelle, les deux ne peuvent pas diverger. Les
textes sont ceux de la nº 805, au mot près.

## ⚠️ IL FAUT RECOLLER LES TROIS — tout l'habillage a changé

### Pourquoi le fond passe au clair

Trois passes ont essayé de garder un e-mail **sombre** :

- **nº 822** — verrouiller les couleurs (`color-scheme: only dark`, des
  `!important` partout, une feuille sous `prefers-color-scheme`, les
  sélecteurs d'Outlook.com). Gmail ignore tout ça : son inversion ne se
  désactive pas ;
- **nº 823** — n'employer que ce que l'inversion ne touche pas (le cœur
  en image, le nom en texte). Ça tenait, mais on perdait la
  typographie ;
- **nº 824** — le logotype sur une plaque qui est une image. Ça tenait
  aussi, au prix d'une image de service et d'un bouton dont le rouge
  avait dû quitter le milieu de l'échelle.

**La décision : arrêter de lutter.** C'est le fond sombre qui causait
tout — un client qui l'inverse produit un clair sale, et chaque parade
coûtait quelque chose. L'e-mail passe en **clair**, comme le font
Instagram ou Stripe : un client en mode sombre en tire alors un **sombre
propre**, ce qui est le sens naturel de sa transformation. Le site, lui,
ne change pas : il reste sombre.

### Ce qui a disparu du gabarit

Les quatre couches anti-inversion n'ont plus d'objet. Sont partis les
deux `meta` `color-scheme`, **toute la feuille de style de l'en-tête**
(il n'y a plus de bloc `<style>` à coller), les classes `yf-*` qui ne
servaient que de prise pour elles, les sélecteurs `[data-ogsc]`, la
plaque d'image, et **tous les `!important`**. Le gabarit est d'autant
plus court.

### La tête, et le fichier à déposer

La tête porte le **logotype complet à mot NOIR**,
`{{ .SiteURL }}/yokofolio-logo-noir.png` — le blanc serait invisible sur
un fond clair. **Ce fichier est fourni par le propriétaire.** S'il n'est
pas encore dans `public/`, l'e-mail affiche simplement le texte
« YokoFolio » à la place : rien n'est cassé, mais le logotype manque.

> ⚠️ **Ce que le clair ne règle pas, et il faut le savoir** : une image ne
> s'inverse chez personne. Le logotype à mot noir est parfait sur
> l'e-mail clair ; si un client retourne l'e-mail en sombre, le mot reste
> noir sur un fond devenu sombre — seul le cœur, rouge et de clarté
> moyenne, se lit encore. Le remède, si tu le veux un jour, est celui des
> marques qui envoient clair : un logotype dont le **mot** est d'une
> couleur **moyenne** (le rouge de la marque, par exemple), lisible sur
> les deux fonds. C'est une image à fournir.

### Ce que ça donne, mesuré

Contrastes WCAG lus dans les pixels d'une capture ; la transformation est
faite au canevas en épargnant les rectangles d'image. Deux
transformations, parce que les clients n'emploient pas tous la même :
l'*inversion franche* (255 − v par canal) et la *bascule de clarté* (le
clair et le sombre retournés, teinte gardée). **Les dix e-mails donnent
les mêmes chiffres** — c'est le même gabarit.

| | titre | texte | bouton | pied |
| --- | --- | --- | --- | --- |
| clair | 19,2 | 19,2 | 4,8 | 5,4 |
| inversion franche | 18,5 | 18,5 | 13,9 | 7,1 |
| bascule de clarté | 18,2 | 18,2 | 4,9 | 6,7 |

Seuils WCAG AA : 4,5:1 pour du texte courant, 3:1 pour du grand texte
gras. **Tout passe dans les trois sens** — et c'est la différence avec
les trois passes précédentes : ce n'est plus une parade qui tient, c'est
le sens naturel de la transformation.

### Le poids : le gabarit n'y était pour rien

Gmail coupait les e-mails (les trois points, vers 102 Ko). **Mesuré,
chacun des dix pèse entre 2,4 et 3,4 Ko** — trente fois sous le seuil.
Le gabarit n'était donc pas en cause. Il a quand même maigri, puisque
les couches anti-inversion n'avaient plus d'objet : ces trois gabarits
passent de **5 450 à 3 017 octets, −45 %**. Si la coupure revient, il
faut la chercher ailleurs (une pièce jointe, une signature, un fil de
réponse cité).

### Le bouton

Retour au **rouge vif `#E11144`**, typographie **`#FEFEFE`** (un blanc
cassé : les moteurs qui n'inversent que le blanc *pur* le laissent
passer). La nº 824 avait dû l'assombrir pour survivre à l'inversion d'un
e-mail sombre ; la raison a disparu avec le fond sombre.

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place :
  `{{ .ConfirmationURL }}` (le lien du bouton), `{{ .SiteURL }}` (l'adresse
  du site, réglée dans *Authentication → URL Configuration* — elle sert à
  l'image et au pied de page), `{{ .Email }}` / `{{ .NewEmail }}` (les
  adresses, gabarit 3 seulement).
- **Une seule image est chargée depuis le site** : le logotype. Un e-mail
  n'embarque pas d'image ; tant que *Site URL* vaut
  `https://yokofolio.com`, il s'affiche.
- **HTML d'e-mail robuste** : des tables, des styles en ligne, les
  attributs `bgcolor`/`width`, un bouton « à l'épreuve des balles », un
  commentaire conditionnel pour Outlook, aucune police chargée.
- **Le nom d'expéditeur** et l'adresse d'envoi se règlent ailleurs
  (*Authentication → SMTP Settings*) : ils ne sont pas dans le gabarit.
- Une fois collés, **rejouer les trois parcours** (inscription, mot de
  passe oublié, changement d'adresse) sur un compte d'essai et lire les
  trois e-mails reçus dans Gmail (mode clair **et** mode sombre) et dans
  Outlook : c'est la seule vérification possible.

---

## 1 · Confirm signup — déclenché par l'inscription par mot de passe

**Subject**

```
Confirm your YokoFolio account
```

**Body (HTML)**

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm your YokoFolio account</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F6F8;" bgcolor="#F5F6F8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F6F8" style="background-color:#F5F6F8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="left" style="padding:0 0 20px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;"><img src="{{ .SiteURL }}/yokofolio-logo-noir.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;"></a>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #E6E8EC;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Welcome to YokoFolio!</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">One last step: confirm your email address to activate your account.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 24 hours. If you didn't create an account, just ignore this email.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td bgcolor="#E11144" style="background-color:#E11144;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE;text-decoration:none;border-radius:999px;">Confirm my email</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#5F6670;text-decoration:none;">yokofolio.com</a>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2 · Reset password — déclenché par « Forgot your password? »

**Subject**

```
Reset your YokoFolio password
```

**Body (HTML)**

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset your YokoFolio password</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F6F8;" bgcolor="#F5F6F8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F6F8" style="background-color:#F5F6F8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="left" style="padding:0 0 20px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;"><img src="{{ .SiteURL }}/yokofolio-logo-noir.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;"></a>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #E6E8EC;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Forgot your password?</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">No problem. Click the button below to choose a new one.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 1 hour. If you didn't ask for it, ignore this email — your password stays the same.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td bgcolor="#E11144" style="background-color:#E11144;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE;text-decoration:none;border-radius:999px;">Choose a new password</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#5F6670;text-decoration:none;">yokofolio.com</a>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3 · Change email address — déclenché depuis la page Sécurité

**Subject**

```
Confirm your new email address
```

**Body (HTML)**

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm your new email address</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F6F8;" bgcolor="#F5F6F8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F6F8" style="background-color:#F5F6F8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="left" style="padding:0 0 20px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;"><img src="{{ .SiteURL }}/yokofolio-logo-noir.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;"></a>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #E6E8EC;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Confirm your new email</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">You asked to change the email address on your YokoFolio account, from {{ .Email }} to {{ .NewEmail }}.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">Confirm the change below. Until then, your current address stays valid.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td bgcolor="#E11144" style="background-color:#E11144;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE;text-decoration:none;border-radius:999px;">Confirm this change</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#5F6670;text-decoration:none;">yokofolio.com</a>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
```
