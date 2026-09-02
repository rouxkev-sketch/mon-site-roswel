# Les trois gabarits d'e-mails Supabase, en anglais — passe nº 805

Ces trois e-mails ne sont **pas dans le dépôt** : Supabase les envoie à
notre place, et leurs gabarits vivent dans son tableau de bord
(**Authentication → Email Templates**). Kevin les colle à la main, un par
un. Aucune passe ne peut les vérifier au banc : les relire à l'œil dans
le tableau de bord une fois collés.

Les variables entre accolades doubles sont celles de Supabase, à garder
telles quelles : `{{ .ConfirmationURL }}` est le lien, `{{ .SiteURL }}`
l'adresse du site, `{{ .Email }}` / `{{ .NewEmail }}` les adresses.

Le ton est celui du lexique de la 804 : anglais américain, « you »
direct, phrases courtes.

---

## 1 · Confirm signup — déclenché par l'inscription par mot de passe

**Subject**

```
Confirm your YokoFolio account
```

**Body (HTML)**

```html
<h2>Welcome to YokoFolio!</h2>
<p>One last step: confirm your email address to activate your account.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm my email</a></p>
<p>If you didn't create an account on YokoFolio, you can ignore this email — nothing will happen.</p>
<p>— YokoFolio</p>
```

---

## 2 · Reset password — déclenché par « Forgot your password? » (page de
connexion et page Sécurité)

**Subject**

```
Reset your YokoFolio password
```

**Body (HTML)**

```html
<h2>Forgot your password?</h2>
<p>Follow this link to choose a new one. It only takes a minute.</p>
<p><a href="{{ .ConfirmationURL }}">Choose a new password</a></p>
<p>If you didn't ask for this, you can ignore this email — your password stays as it is.</p>
<p>— YokoFolio</p>
```

---

## 3 · Change email address — déclenché par « Change my email » (page
Sécurité)

**Subject**

```
Confirm your new email address
```

**Body (HTML)**

```html
<h2>Confirm your new email</h2>
<p>You asked to change the email address of your YokoFolio account from {{ .Email }} to {{ .NewEmail }}.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm this change</a></p>
<p>Until you confirm, your current address stays valid. If you didn't ask for this, ignore this email.</p>
<p>— YokoFolio</p>
```

---

## Ce qu'il faut savoir en collant

- **Le nom d'expéditeur** (« YokoFolio ») et l'adresse d'envoi se règlent
  ailleurs, dans *Authentication → SMTP Settings* : ils ne sont pas dans
  le gabarit.
- **Magic Link, Invite user, Reauthentication** ne sont pas utilisés par
  le site (inventaire nº 797, §5b) : rien à y faire.
- Les liens pointent vers `/auth/callback`, puis vers la page prévue par
  le site : ne pas modifier `{{ .ConfirmationURL }}`.
- Une fois collés, **rejouer les trois parcours** (inscription, mot de
  passe oublié, changement d'adresse) sur un compte d'essai et lire les
  trois e-mails reçus : c'est la seule vérification possible.
