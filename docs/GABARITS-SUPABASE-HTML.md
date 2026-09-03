# Les trois gabarits d'e-mails Supabase, habillés
### passe nº 817 · couleurs verrouillées nº 822 · tête refaite nº 823
### · **logotype complet et bouton, nº 824**

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un — le **Subject** dans le champ du sujet, le **Body** dans le corps
(mode source / HTML).

Les textes sont ceux de la nº 805 (docs/GABARITS-SUPABASE-EN.md), au mot
près. Ce document est **fabriqué à partir de `src/lib/courriel-habille.ts`**
— la coquille en sort telle quelle, les deux ne peuvent pas diverger.

## ⚠️ CE QUI CHANGE À LA nº 824 — IL FAUT RECOLLER LES TROIS

Deux choses bougent : la **tête** et le **bouton**.

### 1. Le logotype complet est revenu, sur une plaque d'image

La nº 823 avait dû remplacer le logotype par le cœur seul plus le nom
écrit en texte : le mot du logotype est en blanc pur, et il disparaissait
dès que Gmail retournait le fond en clair.

Deux fausses pistes, pour qu'elles ne soient pas retentées :

- **choisir l'image selon le fond** (une version blanche, une noire, et
  `prefers-color-scheme` pour trancher) suppose que le client dise dans
  quel mode il est. **Gmail ne le dit pas** — c'est exactement ce qui a
  été constaté ;
- **poser une plaque de fond en `bgcolor`** ne protège rien : une
  couleur de fond, l'inversion la retourne comme le reste. La plaque
  sombre devient claire et le mot blanc disparaît de nouveau.

Ce qui marche : **que la plaque soit elle-même une image**. La cellule de
la tête porte `plaque-courriel.png` en fond — un carré de 16 px d'une
seule couleur, le bleu nuit du site, qui se répète — et le logotype
officiel est posé dessus, tel quel. Aucun client mail n'inverse une
image, ni celle d'une balise `img` ni celle d'un fond de cellule : les
deux couches sont invariantes, et **la tête a exactement le même aspect
dans les deux modes**.

### 2. Le bouton : pourquoi son libellé ne peut pas rester blanc

Dans Gmail sombre, le libellé blanc devenait noir sur le rouge. **C'est
une impossibilité, pas un réglage** : ces moteurs retournent la clarté
(L devient 1 − L), et la transformation est monotone — tout ce qui est
clair devient sombre. Aucune couleur de texte claire ne peut rester
claire après elle. (Les seules couleurs invariantes ont une clarté TSL
de 0,5 : ni blanches, ni noires.) Un libellé garanti blanc devrait être
une **image** — et un bouton d'action qui disparaît quand les images
sont bloquées est un défaut plus grave que celui qu'on corrige.

Deux parades sont donc posées, une par famille de moteurs :

- le libellé n'est plus `#FFFFFF` mais **`#FEFEFE`**. Les moteurs qui
  n'inversent que le blanc *pur* (l'inversion dite partielle) le
  laissent passer : le libellé reste blanc. Cette parade **n'est pas
  mesurable ici** — elle dépend du moteur du client, pas du rendu ;
- le rouge du bouton **quitte le milieu de l'échelle** : `#B80E38`
  (`primaireFonce`, déjà à la charte) au lieu de `#E11144`. C'était
  là toute l'affaire : `#E11144` a une clarté de 0,47, la bascule le
  laissait presque sur place et le libellé noirci se retrouvait sur un
  rouge resté vif. `#B80E38` (clarté 0,39) part à 0,61 — un corail
  clair, sur lequel un libellé sombre se lit comme un bouton de thème
  clair. Voulu, et non plus subi.

### Ce que ça donne, mesuré

Contrastes WCAG lus dans les pixels d'une capture ; la transformation est
faite au canevas en épargnant les rectangles d'image (**la plaque
comprise**, puisqu'elle en est une). Deux transformations, parce que les
clients n'emploient pas tous la même : l'*inversion franche* (255 − v par
canal) et la *bascule de clarté* (le clair et le sombre retournés, teinte
gardée).

| | mot | cœur | titre | texte | bouton |
| --- | --- | --- | --- | --- | --- |
| tel quel | 18,9 | 4,0 | 14,8 | 14,8 | 6,6 |
| inversion franche | 18,9 | 4,0 | 14,8 | 14,8 | 14,6 |
| bascule de clarté | 18,9 | 4,0 | 14,5 | 14,5 | 5,8 |

Seuils WCAG AA : 4,5:1 pour du texte courant, 3:1 pour du grand texte
gras et pour un dessin. **Tout passe dans les trois sens** — et le mot et
le cœur **ne bougent pas d'un dixième** : c'est la démonstration que la
tête est invariante, deux couches d'image l'une sur l'autre, rien à
recalculer.

## Ce qu'il faut savoir en collant

- **Les variables entre accolades doubles sont celles de Supabase**, à
  garder telles quelles et à leur place :
  `{{ .ConfirmationURL }}` (le lien du bouton), `{{ .SiteURL }}` (l'adresse
  du site, réglée dans *Authentication → URL Configuration* — elle sert
  aux deux images et au pied de page), `{{ .Email }}` / `{{ .NewEmail }}`
  (les adresses, gabarit 3 seulement).
- **DEUX images sont chargées depuis le site**, et les deux comptent :
  `{{ .SiteURL }}/yokofolio-logo.png` (le logotype officiel) et
  `{{ .SiteURL }}/plaque-courriel.png` (la plaque). Un e-mail n'embarque
  pas d'image. Tant que *Site URL* vaut `https://yokofolio.com`, les
  deux s'affichent.
- **La plaque est écrite DEUX FOIS dans la cellule** — l'attribut
  `background` (pour Outlook) et la propriété `background-image` (pour
  les autres). Ne pas en supprimer une : ce n'est pas un doublon.
- **Si le lecteur bloque les images**, ni la plaque ni le logotype ne
  s'affichent : il reste le `alt` du logotype, du texte, qui s'inverse
  avec son fond et reste donc lisible. La dégradation est sûre.
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
      .yf-bouton { background-color: #B80E38 !important; }
      .yf-bouton a { color: #FEFEFE !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #B80E38 !important; }
    [data-ogsc] .yf-bouton a { color: #FEFEFE !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 0 24px 0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;line-height:0;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
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
              <td class="yf-bouton" bgcolor="#B80E38" style="background-color:#B80E38 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE !important;text-decoration:none;border-radius:999px;">Confirm my email</a>
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
      .yf-bouton { background-color: #B80E38 !important; }
      .yf-bouton a { color: #FEFEFE !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #B80E38 !important; }
    [data-ogsc] .yf-bouton a { color: #FEFEFE !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 0 24px 0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;line-height:0;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
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
              <td class="yf-bouton" bgcolor="#B80E38" style="background-color:#B80E38 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE !important;text-decoration:none;border-radius:999px;">Choose a new password</a>
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
      .yf-bouton { background-color: #B80E38 !important; }
      .yf-bouton a { color: #FEFEFE !important; }
    }
    /*  OUTLOOK.COM en mode sombre marque les éléments qu'il a
        retouchés (data-ogsc pour la couleur, data-ogsb pour le
        fond) : on remet les nôtres derrière lui. */
    [data-ogsc] .yf-fond, [data-ogsb] .yf-fond { background-color: #0B0F14 !important; }
    [data-ogsc] .yf-carte, [data-ogsb] .yf-carte { background-color: #1A1F26 !important; }
    [data-ogsc] .yf-texte, [data-ogsc] .yf-titre { color: #F2F2F4 !important; }
    [data-ogsc] .yf-doux, [data-ogsc] .yf-doux a { color: #A8A8B0 !important; }
    [data-ogsc] .yf-bouton, [data-ogsb] .yf-bouton { background-color: #B80E38 !important; }
    [data-ogsc] .yf-bouton a { color: #FEFEFE !important; }
  </style>
</head>
<body class="yf-fond" style="margin:0;padding:0;background-color:#0B0F14 !important;" bgcolor="#0B0F14">
  <table role="presentation" class="yf-fond" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td class="yf-fond" align="left" bgcolor="#0B0F14" style="background-color:#0B0F14 !important;padding:0 0 24px 0;">
              <a href="{{ .SiteURL }}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td background="{{ .SiteURL }}/plaque-courriel.png" bgcolor="#0B0F14" style="background-color:#0B0F14;background-image:url('{{ .SiteURL }}/plaque-courriel.png');background-repeat:repeat;border-radius:12px;padding:10px 14px;line-height:0;">
                    <img src="{{ .SiteURL }}/yokofolio-logo.png" width="170" height="33" alt="YokoFolio" style="display:block;border:0;outline:none;width:170px;height:33px;">
                  </td>
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
              <td class="yf-bouton" bgcolor="#B80E38" style="background-color:#B80E38 !important;border-radius:999px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 28px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#FEFEFE !important;text-decoration:none;border-radius:999px;">Confirm this change</a>
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
