# Les trois gabarits d'e-mails Supabase, habillés
### passe nº 817 · couleurs verrouillées nº 822 · **tête refaite nº 823**

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Les textes sont ceux de la nº 805 (docs/GABARITS-SUPABASE-EN.md), au mot
près. Ce qui change : l'habillage — la tête de marque, le bouton d'action
dans le rouge du site, un pied de page sobre — le même que celui des huit
e-mails que le site envoie lui-même (`src/lib/courriel-habille.ts`). Ce
document est **fabriqué à partir de ce fichier-là** : les deux ne peuvent
pas diverger.

## ⚠️ CE QUI CHANGE À LA nº 823 — LA TÊTE DU COURRIEL

**Il faut recoller les trois gabarits.** La tête n'est plus la même.

Gmail **inverse** les couleurs d'un e-mail sombre, et **son inversion ne
peut pas être désactivée** : il ignore `color-scheme` et les requêtes de
média. Les quatre verrous de la nº 822 restent (ils servent chez Apple
Mail, iOS et Outlook récent), mais ils ne suffisaient pas : dans Gmail le
courriel arrivait clair, et le logo disparaissait.

La cause, relevée dans les pixels des deux fichiers officiels :

| fichier | ce qu'il contient | ce qu'il devient sur fond clair |
| --- | --- | --- |
| `yokofolio-icone.png` | 99 % de rouge de marque | **se lit** (4,8:1 sur blanc, 4,0:1 sur le bleu nuit) |
| `yokofolio-logo.png` | le cœur (43 %) **+ le mot en BLANC PUR** (22 %) | le mot **disparaît** |

Ce n'était donc pas le cœur, c'était **le mot**. La tête est maintenant
faite des deux seules choses qui traversent une inversion :

- **le CŒUR**, en image — aucun client mail n'inverse une image, et le
  rouge se lit sur les deux fonds ;
- **le nom « YokoFolio », en TEXTE** — un texte s'inverse *avec* son
  fond, donc leur contraste est conservé quoi qu'il arrive.

Aucune image officielle n'a été touchée (règle nº 356 du dépôt : on ne
recadre pas, on ne recolore pas, on ne fabrique pas de variante).

### Ce que ça donne, mesuré

Contrastes WCAG lus dans les pixels d'une capture, la transformation
faite au canevas en épargnant les rectangles d'image. **Deux**
transformations, parce que les clients n'emploient pas tous la même :
l'*inversion franche* (255 − v par canal) et la *bascule de clarté*
(le clair et le sombre retournés, teinte gardée).

| | cœur | nom | titre | texte | bouton |
| --- | --- | --- | --- | --- | --- |
| tel quel | 4,0 | 17,2 | 14,8 | 14,8 | 4,8 |
| inversion franche | 4,2 | 17,1 | 14,8 | 14,8 | 14,0 |
| bascule de clarté | 4,2 | 17,0 | 14,5 | 14,5 | 4,9 |

Les seuils WCAG AA sont 4,5:1 pour du texte courant et 3:1 pour du
grand texte gras et pour un dessin : **tout passe, dans les trois
sens**. Le cœur tient parce que son rouge est une couleur *moyenne* —
4,0 sur le bleu nuit, 4,2 sur le clair. Ni du blanc ni du noir
n'auraient cette propriété : c'est le rouge de la marque qui sauve la
tête.

> **Une plaque de fond sous le logo ne marcherait pas** : une plaque
> posée en HTML est une couleur de fond, et l'inversion la retourne comme
> le reste — la plaque sombre devient claire, et le mot blanc disparaît
> de nouveau. Le seul support que l'inversion ne touche pas, c'est le PNG
> lui-même. **Si tu veux ton logotype complet dans les e-mails, il faut
> fournir un PNG qui porte son propre fond** (un liseré clair autour des
> lettres, ou une plaque cuite dans l'image).

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place :
  `{{ .ConfirmationURL }}` (le lien du bouton), `{{ .SiteURL }}` (l'adresse
  du site, réglée dans *Authentication → URL Configuration* — elle sert à
  l'image et au pied de page), `{{ .Email }}` / `{{ .NewEmail }}` (les
  adresses, gabarit 3 seulement).
- **L'image est chargée depuis le site**
  (`{{ .SiteURL }}/yokofolio-icone.png`, le fichier officiel de
  `public/`) : un e-mail n'embarque pas d'image. Tant que *Site URL* vaut
  `https://yokofolio.com`, le cœur s'affiche. Et si le lecteur bloque les
  images, il reste le nom **en texte** : la tête tient quand même.
- **HTML d'e-mail robuste** : des tables, des styles en ligne, les
  attributs `bgcolor`/`width`, un bouton « à l'épreuve des balles », un
  commentaire conditionnel pour Outlook, aucune police chargée.
- **Les couleurs restent verrouillées (nº 822)** pour les clients qui
  savent lire ces verrous : `color-scheme: only dark` (méta et feuille),
  les couleurs en ligne avec `!important`, une feuille dans l'en-tête qui
  redit les mêmes couleurs sous `prefers-color-scheme: dark`, et les
  sélecteurs `[data-ogsc]`/`[data-ogsb]` d'Outlook.com. **La petite
  feuille de style de l'en-tête fait partie du gabarit : la coller
  aussi.**
- **Le nom d'expéditeur** et l'adresse d'envoi se règlent ailleurs
  (*Authentication → SMTP Settings*) : ils ne sont pas dans le gabarit.
- Une fois collés, **rejouer les trois parcours** (inscription, mot de
  passe oublié, changement d'adresse) sur un compte d'essai et lire les
  trois e-mails reçus dans Gmail (mode sombre **et** mode clair) et dans
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
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding:0 10px 0 0;" valign="middle"><img src="{{ .SiteURL }}/yokofolio-icone.png" width="26" height="30" alt="" style="display:block;border:0;outline:none;width:26px;height:30px;"></td>
                  <td class="yf-titre" valign="middle" style="font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:30px;font-weight:bold;letter-spacing:-0.2px;color:#F2F2F4 !important;">YokoFolio</td>
                </tr></table>
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
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding:0 10px 0 0;" valign="middle"><img src="{{ .SiteURL }}/yokofolio-icone.png" width="26" height="30" alt="" style="display:block;border:0;outline:none;width:26px;height:30px;"></td>
                  <td class="yf-titre" valign="middle" style="font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:30px;font-weight:bold;letter-spacing:-0.2px;color:#F2F2F4 !important;">YokoFolio</td>
                </tr></table>
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
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding:0 10px 0 0;" valign="middle"><img src="{{ .SiteURL }}/yokofolio-icone.png" width="26" height="30" alt="" style="display:block;border:0;outline:none;width:26px;height:30px;"></td>
                  <td class="yf-titre" valign="middle" style="font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:30px;font-weight:bold;letter-spacing:-0.2px;color:#F2F2F4 !important;">YokoFolio</td>
                </tr></table>
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
