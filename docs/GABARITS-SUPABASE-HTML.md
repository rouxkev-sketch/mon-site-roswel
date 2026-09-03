# Les trois gabarits d'e-mails Supabase, habillés
### passe nº 825 (fond clair) · **nº 826 — carte, logotype, action**

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Ce document est **fabriqué à partir de `src/lib/courriel-habille.ts`** :
la coquille en sort telle quelle, les deux ne peuvent pas diverger.

## ⚠️ IL FAUT RECOLLER LES TROIS

### 1. La carte n'a plus de contour

Le cheveu gris ajouté à la nº 825 est retiré. Le blanc franc de la carte
suffit à la détacher du blanc cassé de la page.

### 2. Le logotype officiel est revenu, sur sa plaque

Le mot du logotype est **blanc** : il lui faut un fond sombre. Et ce fond
ne peut pas être une **couleur** — une couleur, l'inversion la retourne,
et le mot disparaîtrait sur un fond redevenu clair. C'est donc une
**image** (`plaque-courriel.png`, un carré de 16 px du bleu nuit du
site, qui se répète), et **une image ne s'inverse chez personne** : la
plaque reste sombre dans tous les modes, le logotype lisible dessus, le
courriel clair tout autour.

Le logotype à mot noir que la nº 825 attendait **n'est plus nécessaire** :
il n'y a plus rien à déposer.

> Si le lecteur bloque les images, ni la plaque ni le logotype ne
> s'affichent. La cellule porte donc un repli complet : sa couleur de
> fond est celle de la plaque, et son texte est blanc et gras — le
> `alt` (« YokoFolio ») se lit alors sur le sombre.

### 3. L'action est un lien texte, plus un badge

Le bouton rouge a disparu. Même libellé, **sans soulignement**, dans le
bleu des liens d'action — mais dans sa version pour **fond clair**.

**Pourquoi pas le `#7FA9EE` du site :** ce bleu est fait pour le fond
**sombre** du site, où il vaut 8,1:1. Sur la carte blanche il ne vaut que
**2,4:1**, et **2,0:1** une fois l'e-mail inversé — il y serait illisible.
Celui du gabarit, `#1C62D4`, est son homologue pour fond clair : **même
teinte (217°) et même saturation (0,77)**, seule la clarté descend
(0,72 → 0,47). Il vaut 5,6:1 sur la carte et ne descend pas sous 4,8:1
dans les autres sens.

### Ce que ça donne, mesuré

Contrastes WCAG lus dans les pixels d'une capture ; la transformation est
faite au canevas en épargnant les rectangles d'image (**la plaque
comprise**, puisqu'elle en est une). Deux transformations, parce que les
clients n'emploient pas tous la même. **Les dix e-mails donnent les mêmes
chiffres** — c'est le même gabarit.

| | mot | cœur | titre | texte | lien | pied |
| --- | --- | --- | --- | --- | --- | --- |
| clair | 18,9 | 4,0 | 19,2 | 19,2 | 5,6 | 5,4 |
| inversion franche | 18,9 | 4,0 | 18,5 | 18,5 | 9,1 | 7,1 |
| bascule de clarté | 18,9 | 4,0 | 18,2 | 18,2 | 4,8 | 6,7 |

Seuils WCAG AA : 4,5:1 pour du texte courant, 3:1 pour du grand texte
gras et pour un dessin. **Tout passe dans les trois sens** — et le mot et
le cœur du logotype **ne bougent pas d'un dixième** : c'est la
démonstration que la tête est invariante.

Poids : chacun des dix e-mails pèse **moins de 4 Ko**, vingt-cinq fois
sous le seuil de coupure de Gmail (~102 Ko).

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place :
  `{{ .ConfirmationURL }}` (le lien d'action), `{{ .SiteURL }}` (l'adresse
  du site, réglée dans *Authentication → URL Configuration* — elle sert
  aux deux images et au pied de page), `{{ .Email }}` / `{{ .NewEmail }}`
  (les adresses, gabarit 3 seulement).
- **DEUX images sont chargées depuis le site**, et les deux comptent :
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
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Welcome to YokoFolio!</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">One last step: confirm your email address to activate your account.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 24 hours. If you didn't create an account, just ignore this email.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .ConfirmationURL }}" style="color:#1C62D4;text-decoration:none;font-weight:bold;">Confirm my email</a></p>
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
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Forgot your password?</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">No problem. Click the button below to choose a new one.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">This link expires in 1 hour. If you didn't ask for it, ignore this email — your password stays the same.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .ConfirmationURL }}" style="color:#1C62D4;text-decoration:none;font-weight:bold;">Choose a new password</a></p>
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
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#0B0F14;">Confirm your new email</h1>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">You asked to change the email address on your YokoFolio account, from {{ .Email }} to {{ .NewEmail }}.</p>
              <p style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#0B0F14;">Confirm the change below. Until then, your current address stays valid.</p>
              <p style="margin:24px 0 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;"><a href="{{ .ConfirmationURL }}" style="color:#1C62D4;text-decoration:none;font-weight:bold;">Confirm this change</a></p>
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
