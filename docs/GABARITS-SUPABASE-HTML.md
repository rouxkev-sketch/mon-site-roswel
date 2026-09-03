# Les trois gabarits d'e-mails Supabase, habillés — passe nº 817,
# couleurs verrouillées à la nº 822,
# couleurs verrouillées à la nº 822

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Les textes sont ceux de la nº 805 (docs/GABARITS-SUPABASE-EN.md), au mot
près. Ce qui change : l'habillage — le logo YokoFolio, le bouton d'action
dans le rouge du site, un pied de page sobre — le même que celui des cinq
e-mails que le site envoie lui-même (`src/lib/courriel-habille.ts`). Si
l'un des deux change un jour, l'autre doit suivre.

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place :
  `{{ .ConfirmationURL }}` (le lien du bouton), `{{ .SiteURL }}` (l'adresse
  du site, réglée dans *Authentication → URL Configuration* — elle sert au
  logo et au pied de page), `{{ .Email }}` / `{{ .NewEmail }}` (les
  adresses, gabarit 3 seulement).
- **Le logo est chargé depuis le site** (`{{ .SiteURL }}/yokofolio-logo.png`,
  le fichier officiel de `public/`) : un e-mail n'embarque pas d'image.
  Tant que *Site URL* vaut `https://yokofolio.com`, le logo s'affiche.
- **HTML d'e-mail robuste** : des tables, des styles en ligne, les
  attributs `bgcolor`/`width`, un bouton « à l'épreuve des balles », un
  commentaire conditionnel pour Outlook, aucune police chargée. Fond
  sombre (le logo est blanc sur transparent).
- **LES COULEURS SONT VERROUILLÉES (nº 822)** : un client en mode sombre
  ne doit plus inverser le courriel (Gmail sombre le rendait clair, et le
  logo blanc disparaissait). Quatre couches le disent : `color-scheme:
  only dark` (méta et feuille), les couleurs en ligne avec
  `!important`, une feuille dans l'en-tête qui redit les mêmes couleurs
  sous `prefers-color-scheme: dark`, et les sélecteurs
  `[data-ogsc]`/`[data-ogsb]` d'Outlook.com. **La petite feuille de
  style de l'en-tête fait partie du gabarit : la coller aussi.**
- **Le nom d'expéditeur** et l'adresse d'envoi se règlent ailleurs
  (*Authentication → SMTP Settings*) : ils ne sont pas dans le gabarit.
- Une fois collés, **rejouer les trois parcours** (inscription, mot de
  passe oublié, changement d'adresse) sur un compte d'essai et lire les
  trois e-mails reçus dans Gmail et dans Outlook : c'est la seule
  vérification possible.

---## 1 · Confirm signup — déclenché par l'inscription par mot de passe

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
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>Confirm your YokoFolio account</title>
  <style type="text/css">
    /*  nº 822 — LE THÈME DU LECTEUR NE DÉCIDE PLUS DES COULEURS :
        « only dark » dit aux clients qui savent lire (Apple Mail, iOS,
        Outlook récent) que ce courriel a UN SEUL habillage et qu'il ne
        faut rien recalculer. */
    :root { color-scheme: only dark; supported-color-schemes: only dark; }
    /*  Le mode sombre du client ne doit rien changer : on redit les
        mêmes couleurs, en priorité. */
    @media (prefers-color-scheme: dark) {
      .yf-fond { background-color: #0B0F14 !important; }
      .yf-carte { background-color: #1A1F26 !important; }
      .yf-texte, .yf-titre { color: #F2F2F4 !important; }
      .yf-doux, .yf-doux a { color: #A8A8B0 !important; }
      .yf-bouton { background-color: #E11144 !important; }
      .yf-bouton a { color: #FFFFFF !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #E11144 !important; }
    [data-ogsc] .yf-bouton a { color: #FFFFFF !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 4px 24px 4px;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="yf-carte" bgcolor="#1A1F26" style="background-color:#1A1F26 !important;border-radius:16px;padding:32px 28px;">
              <h1 class="yf-titre" style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#F2F2F4 !important;">Welcome to YokoFolio!</h1>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">One last step: confirm your email address to activate your account.</p>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">This link expires in 24 hours. If you didn't create an account, just ignore this email.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td class="yf-bouton" bgcolor="#E11144" style="background-color:#E11144 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FFFFFF !important;text-decoration:none;border-radius:999px;">Confirm my email</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td class="yf-doux yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#A8A8B0 !important;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#A8A8B0 !important;text-decoration:none;">yokofolio.com</a>
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
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>Reset your YokoFolio password</title>
  <style type="text/css">
    /*  nº 822 — LE THÈME DU LECTEUR NE DÉCIDE PLUS DES COULEURS :
        « only dark » dit aux clients qui savent lire (Apple Mail, iOS,
        Outlook récent) que ce courriel a UN SEUL habillage et qu'il ne
        faut rien recalculer. */
    :root { color-scheme: only dark; supported-color-schemes: only dark; }
    /*  Le mode sombre du client ne doit rien changer : on redit les
        mêmes couleurs, en priorité. */
    @media (prefers-color-scheme: dark) {
      .yf-fond { background-color: #0B0F14 !important; }
      .yf-carte { background-color: #1A1F26 !important; }
      .yf-texte, .yf-titre { color: #F2F2F4 !important; }
      .yf-doux, .yf-doux a { color: #A8A8B0 !important; }
      .yf-bouton { background-color: #E11144 !important; }
      .yf-bouton a { color: #FFFFFF !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #E11144 !important; }
    [data-ogsc] .yf-bouton a { color: #FFFFFF !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 4px 24px 4px;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="yf-carte" bgcolor="#1A1F26" style="background-color:#1A1F26 !important;border-radius:16px;padding:32px 28px;">
              <h1 class="yf-titre" style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#F2F2F4 !important;">Forgot your password?</h1>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">No problem. Click the button below to choose a new one.</p>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">This link expires in 1 hour. If you didn't ask for it, ignore this email — your password stays the same.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td class="yf-bouton" bgcolor="#E11144" style="background-color:#E11144 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FFFFFF !important;text-decoration:none;border-radius:999px;">Choose a new password</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td class="yf-doux yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#A8A8B0 !important;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#A8A8B0 !important;text-decoration:none;">yokofolio.com</a>
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
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>Confirm your new email address</title>
  <style type="text/css">
    /*  nº 822 — LE THÈME DU LECTEUR NE DÉCIDE PLUS DES COULEURS :
        « only dark » dit aux clients qui savent lire (Apple Mail, iOS,
        Outlook récent) que ce courriel a UN SEUL habillage et qu'il ne
        faut rien recalculer. */
    :root { color-scheme: only dark; supported-color-schemes: only dark; }
    /*  Le mode sombre du client ne doit rien changer : on redit les
        mêmes couleurs, en priorité. */
    @media (prefers-color-scheme: dark) {
      .yf-fond { background-color: #0B0F14 !important; }
      .yf-carte { background-color: #1A1F26 !important; }
      .yf-texte, .yf-titre { color: #F2F2F4 !important; }
      .yf-doux, .yf-doux a { color: #A8A8B0 !important; }
      .yf-bouton { background-color: #E11144 !important; }
      .yf-bouton a { color: #FFFFFF !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #E11144 !important; }
    [data-ogsc] .yf-bouton a { color: #FFFFFF !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 4px 24px 4px;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:auto;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="yf-carte" bgcolor="#1A1F26" style="background-color:#1A1F26 !important;border-radius:16px;padding:32px 28px;">
              <h1 class="yf-titre" style="margin:0 0 18px 0;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:#F2F2F4 !important;">Confirm your new email</h1>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">You asked to change the email address on your YokoFolio account, from {{ .Email }} to {{ .NewEmail }}.</p>
              <p class="yf-texte" style="margin:0 0 14px 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:23px;color:#F2F2F4 !important;">Confirm the change below. Until then, your current address stays valid.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px 0;">
            <tr>
              <td class="yf-bouton" bgcolor="#E11144" style="background-color:#E11144 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FFFFFF !important;text-decoration:none;border-radius:999px;">Confirm this change</a>
              </td>
            </tr>
          </table>
            </td>
          </tr>
          <tr>
            <td class="yf-doux yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:20px 4px 0 4px;font-family:Arial, Helvetica, sans-serif;font-size:12.5px;line-height:18px;color:#A8A8B0 !important;">
              YokoFolio &middot; <a href="{{ .SiteURL }}" style="color:#A8A8B0 !important;text-decoration:none;">yokofolio.com</a>
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
