# Les trois gabarits d'e-mails Supabase, habillés
### **passe nº 827 — le lien corrigé, la carte supprimée**

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Ce document est **fabriqué à partir de `src/lib/courriel-habille.ts`** :
la coquille en sort telle quelle, les deux ne peuvent pas diverger.

## 🚨 IL FAUT RECOLLER LES TROIS — le lien avait un défaut bloquant

### Ce qui n'allait pas

« Choose a new password », cliqué sur un e-mail neuf, menait **à
l'accueil** au lieu de l'écran de nouveau mot de passe.

**La cause est dans la forme du lien.** Les gabarits portaient
`{{ .ConfirmationURL }}`, que Supabase compose ainsi :

```
<projet>.supabase.co/auth/v1/verify
   ?token=…&type=recovery&redirect_to=<ce que le site a demandé>
```

Le clic part donc **chez Supabase**, qui vérifie le jeton puis renvoie
vers `redirect_to` — **mais seulement si cette adresse figure dans sa
liste blanche** (*Authentication → URL Configuration → Redirect URLs*).
Or le site demande `…/auth/callback?next=/devenir-tatoueur/nouveau-mot-
de-passe`, **avec un paramètre**, et la liste ne contenait que
`…/auth/callback`, sans. Une entrée sans joker ne couvre pas une
adresse à paramètres : **Supabase écarte la demande en silence et
retombe sur la Site URL — l'accueil.** Rien n'expire, rien n'échoue : on
est simplement renvoyé ailleurs.

### La correction : le lien ne passe plus par Supabase

Les gabarits n'emploient plus `{{ .ConfirmationURL }}` mais
`{{ .TokenHash }}`, posé sur **notre propre adresse** :

```
{{ .SiteURL }}/auth/callback
   ?token_hash={{ .TokenHash }}&type=recovery&next=<chez nous>
```

Le clic arrive directement sur le site, qui vérifie le jeton lui-même et
mène où il faut. **Plus de détour, plus de liste blanche à tenir à jour
pour les e-mails, plus de repli muet sur l'accueil.**

Un second défaut disparaît avec : l'ancien chemin exigeait le
« vérificateur » déposé dans **le navigateur qui avait fait la
demande** — un lien ouvert ailleurs (demande au bureau, clic dans
l'application Gmail du téléphone) échouait lui aussi vers l'accueil. Le
nouveau marche **depuis n'importe quel appareil**.

Chaque gabarit a **sa** destination :

| gabarit | `type` | `next` |
| --- | --- | --- |
| Confirm signup | `signup` | `/apres-connexion` |
| Reset password | `recovery` | `/devenir-tatoueur/nouveau-mot-de-passe` |
| Change email | `email_change` | `/devenir-tatoueur/securite` |

> ⚠️ **Il reste une chose à faire dans Supabase**, mais pour Google, pas
> pour les e-mails : dans *Authentication → URL Configuration →
> Redirect URLs*, l'entrée doit être
> `https://yokofolio.com/auth/callback**` — **avec les deux étoiles**.
> La connexion Google demande elle aussi une adresse à paramètres, et
> elle, elle dépend encore de cette liste.

### La carte a disparu

Le texte repose maintenant **directement sur le fond clair** : plus de
rectangle blanc derrière lui. Les trois blocs — la plaque du logotype,
le texte, le pied — s'alignent sur le même bord gauche.

**La plaque du logotype reste**, et c'est le seul bloc de l'e-mail. Elle
est assumée : le mot du logotype est blanc, il lui faut un fond sombre,
et ce fond ne peut pas être une couleur (une couleur, l'inversion la
retourne) — c'est donc une **image**, que rien n'inverse.

### Ce que ça donne, mesuré

Contrastes WCAG lus dans les pixels d'une capture ; la transformation est
faite au canevas en épargnant les rectangles d'image (**la plaque
comprise**). Deux transformations, parce que les clients n'emploient pas
tous la même. **Les dix e-mails donnent les mêmes chiffres.**

| | mot | cœur | titre | texte | lien | pied |
| --- | --- | --- | --- | --- | --- | --- |
| clair | 18,9 | 4,0 | 17,8 | 17,8 | 5,7 | 5,4 |
| inversion franche | 18,9 | 4,0 | 17,5 | 17,5 | 9,1 | 7,1 |
| bascule de clarté | 18,9 | 4,0 | 17,3 | 17,3 | 5,0 | 6,7 |

Seuils WCAG AA : 4,5:1 pour du texte courant, 3:1 pour du grand texte
gras et pour un dessin. **Tout passe dans les trois sens**, et le mot et
le cœur du logotype ne bougent pas d'un dixième — la tête est
invariante.

> Le bleu du lien a été assombri d'un cran (`#1C62D4` → `#1A5CC8`) :
> en disparaissant, la carte a remplacé le blanc franc par le blanc
> cassé sous le lien, et son contraste sous bascule tombait pile sur le
> seuil (4,5). Un cran plus sombre lui rend sa marge (5,0) sans changer le
> bleu à l'œil.

Poids : chacun des dix e-mails pèse **moins de 4 Ko**, vingt-cinq fois
sous le seuil de coupure de Gmail (~102 Ko).

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place : `{{ .TokenHash }}` (le jeton
  du lien), `{{ .SiteURL }}` (l'adresse du site, réglée dans
  *Authentication → URL Configuration*), `{{ .Email }}` /
  `{{ .NewEmail }}` (les adresses, gabarit 3 seulement).
  **`{{ .ConfirmationURL }}` ne doit plus apparaître nulle part.**
- **DEUX images sont chargées depuis le site** :
  `{{ .SiteURL }}/yokofolio-logo.png` (le logotype officiel) et
  `{{ .SiteURL }}/plaque-courriel.png` (la plaque). Un e-mail n'embarque
  pas d'image.
- **La plaque est écrite DEUX FOIS dans la cellule** — l'attribut
  `background` (pour Outlook) et la propriété `background-image` (pour
  les autres). Ne pas en supprimer une : ce n'est pas un doublon.
- **HTML d'e-mail robuste** : des tables, des styles en ligne, les
  attributs `bgcolor`/`width`, un commentaire conditionnel pour
  Outlook, aucune police chargée, **aucun bloc `<style>`**.
- **Le nom d'expéditeur** et l'adresse d'envoi se règlent ailleurs
  (*Authentication → SMTP Settings*).
- Une fois collés, **rejouer les trois parcours** (inscription, mot de
  passe oublié, changement d'adresse) sur un compte d'essai — et pour
  celui du mot de passe, **cliquer le lien depuis le téléphone**, pas
  seulement depuis l'ordinateur qui a fait la demande : c'est le cas qui
  échouait.

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
            <td align="left" style="padding:0 0 24px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;font-family:Arial, Helvetica, sans-serif;font-size:20px;line-height:33px;font-weight:bold;color:#FEFEFE;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
                </tr></table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:4px 0 0 0;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Welcome to YokoFolio!</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">One last step: confirm your email address to activate your account.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 24 hours. If you didn't create an account, just ignore this email.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=%2Fapres-connexion" style="color:#1A5CC8;text-decoration:none;font-weight:bold;">Confirm my email</a></p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:28px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
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
            <td align="left" style="padding:0 0 24px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;font-family:Arial, Helvetica, sans-serif;font-size:20px;line-height:33px;font-weight:bold;color:#FEFEFE;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
                </tr></table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:4px 0 0 0;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Forgot your password?</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">No problem. Click the button below to choose a new one.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 1 hour. If you didn't ask for it, ignore this email — your password stays the same.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=%2Fdevenir-tatoueur%2Fnouveau-mot-de-passe" style="color:#1A5CC8;text-decoration:none;font-weight:bold;">Choose a new password</a></p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:28px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
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
            <td align="left" style="padding:0 0 24px 0;line-height:0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;font-family:Arial, Helvetica, sans-serif;font-size:20px;line-height:33px;font-weight:bold;color:#FEFEFE;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
                </tr></table>
              </a>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:4px 0 0 0;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Confirm your new email</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">You asked to change the email address on your YokoFolio account, from {{ .Email }} to {{ .NewEmail }}.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">Confirm the change below. Until then, your current address stays valid.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change&next=%2Fdevenir-tatoueur%2Fsecurite" style="color:#1A5CC8;text-decoration:none;font-weight:bold;">Confirm this change</a></p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:28px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#5F6670;">
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
