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
| distance / rayon | **Distance**, en **miles**, affichés « **mi** » (nº 806) | la règle « sans unité » de la 804 est remplacée par la décision de la 806 : de VRAIS miles (5 · 10 · 25 · 50 · 100 mi, défaut 25), affichés « 25 mi » — jamais « in miles » en toutes lettres. Web : titre de groupe **DISTANCE (MI)**, pilules numériques ; mobile : curseur « 25 mi » ; champ « Austin, TX · 25 mi » ; « Expand to 50 mi » |

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
| rendu (noir / noir et gris / couleur) | **Ink** : **Black** / **Black & gray** / **Color** | les valeurs vivent en lib (805) ; le titre de groupe « Ink » est posé dans le moteur ; **gray** depuis la 806 (la ligne disait encore « grey » — mise au pas à la 838) |
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

### Ajouts de la 805 (serveur, courriels, bibliothèque)

| Français | Anglais | Note |
|---|---|---|
| les pays (affichage) | **USA**, **UK**, **Germany**, **Spain**… | la table `RACCOURCIS_PAYS` (lib/adresse) reconnaît les formes officielles anglaises ET françaises et affiche la forme courte anglaise ; le géocodeur parle anglais (`lang=en`) |
| les régions (affichage) | le **code** : TX, CA, QC, NSW… | inchangé ; les variantes françaises de la table servent à reconnaître, jamais à afficher |
| les jours | **Monday** … **Sunday** (Mon … Sun) | |
| les mois | **January** … ; abrégés **Jan** … **Dec** | |
| les dates | **September 12, 2026** · **Sep 12** · **9/12** (mois/jour) | ordre américain partout |
| les heures | **9 AM**, **6:30 PM** | l'horloge de douze heures ; « 9h », « 18h30 » disparaissent |
| Ouvert • Ferme à… / Fermé • Ouvre à… | **Open • Closes at…** / **Closed • Opens at…** | |
| À partir du… / Jusqu'au… / (du … au …) | **From…** / **Until…** / **(… – …)** | |
| Fondateur de… | **Founder of…** | le rôle lui-même (« Fondateur », « Résident ») vit en config : 806 |
| Salon / Studio (type de lieu d'un mode) | **Tattoo Shop** / **Private Studio** | |
| En guest au… | **Guest spot at…** | |
| N mois d'attente | **N-month wait** | |
| Site web (lien) | **Website** | |
| Brouillon · En validation · À corriger · Suppression en cours | **Draft** · **Under review** · **Changes requested** · **Deletion in progress** | états d'un portfolio dans le menu du compte |
| Tous les profils / portfolios / favoris | **All profiles** / **All portfolios** / **All favorites** | |
| Trop court · Faible · Moyen · Fort (mot de passe) | **Too short** · **Weak** · **Medium** · **Strong** | |
| Noir · Noir et gris · Couleur (rendu) | **Black** · **Black & grey** · **Color** | |
| Réalisation (nature) | **Tattoo** | |
| Mo (taille de fichier) | **MB** | |
| les courriels aux artistes | sujet **Convention added** / **Convention declined** / **Style added** / **Style declined** ; signature **— YokoFolio** | |
| le message de démarchage | « Hey ${nom} 👋 … It's free, no strings attached. » | même structure, même lien |
| les réponses d'API | même ton que l'écran : « Log in first. », « Incomplete request. », « This portfolio isn't yours. » | |
| les journaux serveur | anglais aussi (« [liaison] write refused ») — les sondes ont suivi à la nº 806 | |

### Ajouts de la 806 (styles, admin, /dev, miles)

| Français | Anglais | Note |
|---|---|---|
| les STYLES du catalogue | les noms **standards du métier**, en Title Case comme les entrées déjà anglaises : **Realism**, **Minimalist**, **Geometric**, **Ornamental**, **Neo-traditional**, **Japanese · Irezumi**, **Watercolor**, **Illustrative**, **Abstract**, **Biomechanical**, **Organic**, **Bio-organic**, **Engraving**, **Berber**, **Celtic**, **Coptic**, **Nordic**, **Polynesian** | les limaces (`realisme`, `neo-traditionnel`, `japonais`…) ne bougent pas : elles sont en base (`tatoueurs.styles`, `photos_tatoueur.style`) et dans les adresses `/tatouage/<limace>/<ville>` |
| Cultures du monde (famille) | **World Cultures** | Title Case comme les styles (Kevin, 809) |
| Maori (style) | **Māori** | le macron, graphie courante en anglais (Kevin, 809) ; la limace reste `maori` |
| Réalisations / Flashs (Explorer) | **Tattoos** / **Flash** ; « All tattoos » / « All flash » | |
| Types de projets · Petit tatouage · Grandes pièces | **Project types** · **Small tattoo** · **Large pieces** | |
| Besoins · Cover · Cicatrice | **Needs** · **Cover-up** · **Scars** | |
| Lieu (groupe de filtres) · Artistes | **Place** · **Artists** | |
| Studio / Salon / Guest (filtres, choix de profil, genres de mode) | **Private Studio** / **Tattoo Shop** / **Guest Spot** | la décision de Kevin (§1), appliquée aux libellés de config |
| Rendu · Noir · Noir et gris · Couleur | **Ink** · **Black** · **Black & gray** · **Color** | **gray**, orthographe américaine (Kevin, 806 : « Black and gray ») — la valeur de lib/photos-tatoueur suit (« Black & grey » → « Black & gray ») |
| Je tatoue en mon nom · Un lieu, une équipe | **I tattoo under my own name** · **One place, one team** | |
| J'accueille du public · Je reçois sur rendez-vous | **Open to the public** · **By appointment only** | |
| Studio privé / Secteur : · Artiste en studio fixe · Résident chez · En session Guest à · En Guest chez | **Private Studio / Area:** · **Resident artist** · **Resident at** · **Guest spot in** · **Guest spot at** | les phrases des lignes de mode (lib/modes-exercice) |
| Résident · Fondateur (rôles) | **Resident** · **Founder** | Kevin, 806 |
| les MOTIFS de modération (admin → artiste) | **Photo not allowed** · **Inappropriate bio** · **Incorrect name** · **Incorrect address** · **Instagram / TikTok account doesn't match** · **Styles don't match the photos** · **Website doesn't match** · **Linktree / Beacons doesn't match** · **Other (explain)** | leurs explications : « One photo doesn't work: replace it, then save again. » … |
| les MOTIFS de signalement | **Impersonation** · **Inappropriate content** · **Account doesn't match** · **Duplicate portfolio** · **Other (explain)** | |
| Portfolios à valider · Signalements · Démarchage (sections admin) | **Portfolios to review** · **Reports** · **Outreach** | |
| Valider — publier · Demander des modifications · Mettre hors ligne · Retirer du site | **Approve — publish…** · **Request changes** · **Take the portfolio offline** · **Remove the portfolio from the site** | |
| Suppressions en cours · Effacer maintenant · Supprimer définitivement | **Deletions in progress** · **Erase … now?** · **Delete permanently** | le mot à taper devient **DELETE**, comme côté public (la comparaison du code a suivi) |
| Ajouté(e) — … / Refusé(e) (suggestions) | **Added — …** / **Declined** | |
| Marquer lu / non lu · Archiver ce signalement · Ajouter une note | **Mark read** / **Mark unread** · **Archive this report** · **Add a note** | |
| À envoyer · Envoyé · Générer le message · Valider l'envoi · Lien de rattachement | **To send** · **Sent** · **Write the message** · **Confirm the send** · **Claim link** | |
| les sondes (/dev) | **Dev probes**, **Speed**, **Navigation probe**, **Logbook** ; « ON / off », « TURN ALL OFF » ; « network wait + render », « first screen », « until the network goes quiet » | décision du propriétaire : /dev et les instruments en anglais aussi — leurs exceptions au recenseur sont retirées |
| les étiquettes `data-source-composant` | « MenuEspace · web window », « EnTeteTatouage · fixed bar (header) », « MoteurTatouage · web filter panel »… | |
| les journaux et réponses des routes admin | « Couldn't load (has migration … been applied?): … », « Incomplete request. », « This request has already been decided. », « Malformed token. » | même ton que le reste du serveur (805) |
| dates de l'admin | `en-US` : **Aug 20, 12:00 AM** (jour, mois abrégé, heure — le format qu'avait `fr-FR`) | |
| renommer un style accepté (admin, nº 807) | **Rename** · **Save the name** · « Renamed to "…" (/…). » · « The URL stays /… : N portfolio(s) or photo(s) use it. » | la limace ne suit le nom que si rien ne la porte — docs/SQL-807-STYLES-AJOUTES.md pour le reste |
| tris alphabétiques | `localeCompare(…, "en")`, `Intl.Collator("en")` | PortfolioDeLAffiche, BlocPortfolio, config (familles), lib/modes-exercice, lib/selection-suivis |

### Ajouts de la 810 (les localités)

| Français | Anglais | Note |
|---|---|---|
| le PAYS d'un lieu (colonne `pays`, suggestions du filet, badge « Search in … ») | le nom anglais **déduit du code ISO** (`Intl.DisplayNames`, « en ») : **United States**, **Germany** — affiché court par `nomPaysAffiche` : **USA**, **Germany** | `lieuDepuisFiche` (lib/geocodage) ; la base se réécrit par docs/SQL-810-LOCALITES.md ou `outils/relire-les-lieux-en-anglais.mjs` |
| la RÉGION d'un lieu (colonne `region`) | le nom **tel qu'OpenStreetMap l'écrit en anglais** : **California**, **Bavaria**, **Brittany** ; « Texas », « Île-de-France » ne changent pas | c'est le mot que compare la recherche par région (`yf_normaliser`) — la réécriture en base rend les fiches d'avant la 805 à cette recherche |
| la ligne grise d'une suggestion | **« TX, USA »**, **« 75011 Paris, France »** — la règle nº 114 (`contexteSuggestion`), pour le géocodeur ET le filet | plus jamais « Texas, États-Unis » ni « Paris, Île-de-France, France » |
| une VILLE, une RUE | **inchangées** : « Paris », « Munich », « Rue Trousseau » sont des noms | `ville_slug` fait l'adresse publique `/tatouage/<style>/<ville>` — pas de réécriture sans redirection |

### Ajouts de la 811 (pastilles, boutons d'entrée, adresses, rideau)

| Français | Anglais | Note |
|---|---|---|
| /qui-sommes-nous · /mentions-legales (adresses) | **/about** · **/legal** — /contact inchangé | décision de Kevin (811) ; les anciennes adresses redirigent en 301 ; les constantes vivent dans `lib/chemins-editoriaux` |
| Lier mon compte Google (Sécurité, Google pas lié) | **Link** (lien d'action bleu, à droite) · sous-titre **Not linked** · info-bulle « Link your Google account to log in with it » | même composant que **Unlink** (`PastilleAction`) |
| le rideau de chargement (About, Legal, Contact) | `aria-label="Loading page"` — la même étiquette que les squelettes | `RideauDePageTexte`, pas de squelette |

### Ajouts de la 814 (conformité américaine : Terms of Use + DMCA)

| Français | Anglais | Note |
|---|---|---|
| les conditions d'utilisation (page, titre, lien du pied de page) | **Terms of Use** · adresse **/terms** · pied de page **Terms** | page née en anglais (nº 814) ; constante `CHEMIN_TERMS` |
| « les règles du site » (création de compte) | **« By creating an account, you accept the Terms of Use. »** — le lien nomme le document | menait à /legal sous « site rules » (nº 788) ; mène à /terms |
| la notice légale, ses ancres | **Legal Notice** · `/legal#privacy` (**Personal information (privacy policy)**) · `/legal#dmca` (**Copyright and DMCA**) | `SectionLegale` porte l'`id` |
| l'agent désigné, la notification, la contre-notification, le retrait | **designated agent** · **notice** (« Sending a notice ») · **counter-notification** · **taken down / made inaccessible** · **repeat infringers** (« An account that infringes repeatedly is closed ») | 17 U.S.C. § 512 ; le numéro d'enregistrement s'écrit **Registration DMCA-1079752** |
| « tel quel », sans garantie · limite de responsabilité · indemnisation · droit applicable | **"as is" and "as available"** · **No warranty** · **Limitation of liability** · « you agree to cover the resulting costs, including reasonable attorney's fees » · **Governing law and disputes** | les usages américains, dans le ton du site |
| les portfolios créés par l'administration | **Portfolios created by YokoFolio** · **claim it** · **have it removed** — « taken down immediately, no questions asked » | décision de Kevin (814) |
| ne vend pas, ne partage pas (vie privée) | **does not sell personal information and does not share it for advertising** · **Do Not Track** · **Global Privacy Control** | les mots du CCPA |
| les enfants (COPPA) | **Children.** « not meant for children under 13 » | |
| les sous-traitants | **Who processes it.** Vercel · Supabase · Resend · Google | des noms propres, inchangés |

### Ajouts de la 815 (huit corrections)

| Français | Anglais | Note |
|---|---|---|
| « Terminé » (fenêtre des miles, PC) | **Done** · info-bulle **Close and search** | `PastilleAction`, le bleu de Unlink |
| le surtitre « Compte » (Sécurité, zone Supprimer) | **Account** | resté en français jusqu'à la 815 (un mot seul, invisible au recenseur) |

### Ajouts de la 817 (l'accueil des nouveaux : e-mails habillés + bienvenue)

| Français | Anglais | Note |
|---|---|---|
| l'encart du premier passage (« Ma sélection ») | titre **Welcome to YokoFolio** · **Here, you find tattoo artists by style — not by feed. Pick a style, a city and a distance, and explore portfolios that show exactly that work.** · **A tattoo artist? Build your own portfolio and get discovered.** | `EncartBienvenue`, une seule fois par compte |
| ses deux gestes | **Find your style** (rouge, vers l'accueil) · **Create your portfolio** (gris, `lienCreerPortfolio`) | les boutons de la page About, aux mêmes mesures |
| le courriel de contact reçu par l'admin | sujet **[YokoFolio · Contact] <nom>** (inchangé) · titre **New message from the contact form** · **Name:** / **Email:** · bouton **Reply to <nom>** (`mailto:`) | `habillerCourriel`, lib/courriel-habille |
| les courriels aux artistes (style, convention) | titres = sujets de la 805 · phrase d'accepté **Good news: "…" is now on YokoFolio's style list.** / **…convention list.** · phrase de refus **"…" wasn't accepted.** (textes de la 805, inchangés) · consigne **To add it to your portfolio, open it and check it under "Add a style & photos".** / **…pick it in the "Convention" tab.** · bouton **Open my portfolio** (accepté seulement) | un seul gabarit HTML pour les cinq courriels |
| le pied de tous les courriels | **YokoFolio · yokofolio.com** (le domaine lié au site) ; version texte signée **— YokoFolio** | |
| les trois gabarits Supabase | sujets et textes de la 805 conservés ; boutons **Confirm my email** · **Choose a new password** · **Confirm this change** | `docs/GABARITS-SUPABASE-HTML.md`, à coller |

### Ajouts de la 818 (l'accueil des nouveaux, corrections)

| Français | Anglais | Note |
|---|---|---|
| l'écran de confirmation d'inscription (remplace le formulaire) | titre **Check your inbox** · **We sent a confirmation link to <adresse>. Open it to activate your account.** · **Nothing there? Check your spam folder.** | `EcranAuthentification`, l'ancien « Your account is created… » (encadré sous le formulaire) est parti |
| la bienvenue | textes de la 817 inchangés, à la géométrie d'About | `EncartBienvenue` |
| les états vides de « Ma sélection » | **Your favorite photos will show up here.** · **Follow a portfolio to find it here.** · bouton **Explore styles** (inchangés) | sans boîte depuis la 818, 16 px couleur texte |

### Ajouts de la 819 (chargements de Ma sélection + e-mails de suppression)

| Français | Anglais | Note |
|---|---|---|
| le courriel « compte en cours de suppression » | sujet **Your YokoFolio account will be deleted on <date>** · titre **Account deletion in progress** · **You asked to delete your account. It is hidden from the site right now, portfolios included, and it will be permanently deleted on <date> — photos included.** · **Changed your mind? You have 30 days. Reactivate your account and everything comes back as it was. Simply logging back in cancels the deletion too.** · bouton **Reactivate my account** · note **If you do nothing, the deletion goes ahead on that date.** | `lib/courriels-suppression`, gabarit de la 817 ; la date en toutes lettres (« October 2, 2026 ») |
| le courriel « portfolio en cours de suppression » | sujet **Your portfolio "<nom>" will be deleted on <date>** · titre **Portfolio deletion in progress** · **You asked to delete "<nom>". It is hidden from the site right now, and it will be permanently deleted on <date> — photos included.** · **Changed your mind? You have 30 days. Reactivate it and everything comes back as it was. Your account and your other portfolios don't change.** · bouton **Reactivate my portfolio** | même écriture que le précédent |
| la page Sécurité, après le lien d'un courriel | **Deletion canceled: your account and your portfolios are back as they were.** · **Your account is active — the deletion is canceled.** · **Deletion canceled: your portfolio is back as it was.** · erreur **Reactivation failed. Try again.** | `BlocSuppressions`, `?reactiver=…` |

### Ajouts de la 820 (sorties, langue, textes, rouge)

| Français | Anglais | Note |
|---|---|---|
| « Changer d'e-mail » (titre d'encadré, page Sécurité) | **Change email** | resté en français jusqu'à la 820 : il voyage dans une PROPRIÉTÉ de composant (`titre`), et « changer » manquait au vocabulaire du recenseur — les deux sont réparés |
| la liste des langues | **한국어** rejoint la liste, à venir (`COMING SOON`), après **日本語** | `LANGUES_YOKOFOLIO`, config/tatouage |

> **Le balayage des attributs (nº 820)** — le recenseur lit les
> attributs d'écran (`title`, `aria-label`, `alt`, `placeholder`…) ET
> tous les littéraux ; ce qui lui a manqué, c'est le VOCABULAIRE. Sa
> liste de mots français s'enrichit de trente-deux verbes d'interface
> (changer, afficher, masquer, copier, coller, vérifier, télécharger,
> partager, quitter, créer…), tous français et français seuls : un
> texte anglais ne peut pas être accusé par eux. Preuve faite à la
> passe : avec l'ancien libellé en place, le recenseur en trouve un ;
> avec le nouveau, zéro.

### Ajouts de la 837 (le toast de confirmation)

| Français | Anglais | Note |
|---|---|---|
| la confirmation d'une réactivation (portfolio, page « My portfolio ») | **Deletion canceled: your portfolio is back as it was.** | `ReactivationParCourriel` → le toast du site (`components/Toast`) : bloc sombre, pastille à coche verte, en bas à gauche au web, en bas au centre au doigt, cinq secondes, puis il s'efface seul — la ligne nue sous la barre fixe (819/832) est partie |
| la confirmation d'une réactivation (compte AVEC portfolio(s), page « My selection ») | **Deletion canceled: your account and your portfolios are back as they were.** | même toast ; la route `/api/tatoueur/reactiver` rend le nombre de portfolios revenus, et la phrase suit |
| la confirmation d'une réactivation (compte SANS portfolio) | **Deletion canceled: your account is back as it was.** | même toast ; la phrase raccourcie n'apparaît que sur un zéro certain |
| l'échec d'une réactivation | **Reactivation failed. Try again.** (inchangé) · le message de la route pour un portfolio (inchangé) | le même toast, en rouge, avec la croix (ton « probleme » de la famille des pastilles) |

> **La phrase « Your account is active — the deletion is canceled. » (832)
> n'existe plus.** Elle répondait au cas où la route n'avait « rien à
> annuler » — or c'est le cas NORMAL : demander la suppression déconnecte,
> et la connexion qui suit le clic annule déjà la suppression (l'écran de
> connexion et `auth/callback` appellent la route). À l'arrivée, l'écran
> disait « déjà actif » à quelqu'un dont le clic venait d'annuler la
> suppression. La confirmation parle du geste : « Deletion canceled »,
> dans tous les cas où la route a réussi. La ligne de la 819 ci-dessus
> reste vraie pour les textes ; leur lieu est désormais le toast.


### Ajouts de la 838 (relecture page par page — fin du chantier)

Dix-neuf corrections d'office, toutes dans le code (aucune phrase nouvelle :
des mots restés en français, des fautes d'anglais, deux graphies) :

| Français (ou l'anglais fautif) | Anglais | Note |
|---|---|---|
| Artiste · Studio · Salon (le type d'un portfolio : chaque carte, la ligne de la fiche, le menu « Profile » de Ma sélection, la liste des suivis) | **Tattoo Artist** (nº 852-§10 ; « Artist » jusque-là) · **Private Studio** · **Tattoo Shop** | `libelleTypeFiche` (config/tatouage) et les deux replis de `lib/modes-exercice` : les trois mots de la table 1 étaient restés en français |
| Connecte-toi (l'écran de connexion, la bascule vers la connexion) | **Log in** | `EcranAuthentification` |
| Langue (le titre du menu des langues) | **Language** | `SelecteurLangue` — le bouton disait déjà « Language: English » |
| Filtrer (le bouton des filtres, au doigt) | **Filter** | `MenusSelection` |
| Profil (le groupe « Profil » des filtres de Ma sélection) | **Profile** | `GROUPE_PROFIL` (lib/filtres-selection) |
| E-mail (la fenêtre de partage) | **Email** | `BoutonPartageFiche` — la graphie de la table 1, sans trait d'union |
| Non lu — (lecteur d'écran, messages de l'admin) | **Unread —** | `AdminYokofolio` |
| catalogue non lu (avertissement console des conventions) | **catalog not read** | `lib/conventions` |
| (raison non dite) (journal des positions) | **(reason not given)** | `lib/restitution-position`, deux fois |
| « Give a destinataire to write to. » (diagnostic courriel de l'admin) | **Give a recipient to write to.** | un mot français resté dans une phrase anglaise |
| « yokofolio — Your next tattoo… » et « … — yokofolio » (les images de partage, texte de repli et titre) | **YokoFolio — Your next tattoo starts with a style** · **`<titre>` — YokoFolio** | trois fichiers : les deux `opengraph-image` et `lib/image-partage-fiche` — la marque porte ses majuscules |
| « yokofolio shows the tattoo artists… » (paragraphe d'accueil) | **YokoFolio shows…** | `paragrapheAccueil` (config/tatouage) |
| « Search a name » (texte indicatif, autre adresse) | **Search by name** | `BlocAutreAdresse` |
| « one small and one capital letter » (règle du mot de passe) | **one lower-case letter and one capital letter** | `lib/mot-de-passe` — « lower-case » AVEC trait d'union : sans lui, le mot s'écrit d'un seul tenant, Tailwind le prend pour l'utilitaire des minuscules et la feuille CSS gagne une règle (piège 472). ⚠️ ET CE DOCUMENT EST LU LUI AUSSI (constaté à la nº 839) : la note d'origine citait le mot nu, et fabriquait à elle seule la règle qu'elle décrit |
| « This image is too heavy » (photo trop lourde) | **This image is too large** | `lib/photo` |
| « already has this spot in this country » (collision de convention, admin) | **is already on the list for this country** | `demandes-convention/route` |

> **Ce qui vit en base et n'est pas dans le code** (règle 808) : les
> libellés des styles acceptés (`suggestions_style.label`). La doublure de
> l'atelier montre encore « Néo-japonais » sur l'accueil ; sur le vrai
> site, c'est le SQL de la 807 (`docs/SQL-807-STYLES-AJOUTES.md`) qui fait
> foi — rien de neuf à coller. Aucun autre texte venu de la base n'est
> apparu à l'écran pendant la relecture (144 captures, web et doigt).

> **En attente d'arbitrage (rien de changé)** — des phrases correctes mais
> perfectibles, listées dans le compte rendu de la 838 avec leur
> traduction : la relance « Retype the new password », la chute des
> e-mails de suppression « the deletion goes ahead », le bouton d'admin
> « Reopen the first block », l'état vide du démarchage, la question de
> la mise hors ligne « Why is this portfolio leaving the site? ».

### Ajouts de la 839 (les cartes deviennent des galeries, sur le web)

Aucun texte neuf : les deux étiquettes de la carte-galerie sont
CELLES DU CARROUSEL DES FICHES, reprises à l'identique.

| Français | Anglais | Note |
|---|---|---|
| photo suivante / précédente (les chevrons d'une carte de la mosaïque) | **Next photo** / **Previous photo** | `GalerieDeCarte` — les mêmes étiquettes que le carrousel d'une fiche (`CarrouselPortfolio`), et non celles des galeries de profil (« Next thumbnails ») : sur une carte, ce qui change est bien LA PHOTO, pas une rangée de vignettes |
| le compteur d'une carte (« 7/20 ») | **7/20** | des chiffres, rien à traduire ; la pastille est celle des fiches (`PASTILLE_COMPTEUR`, config/tatouage) |

### Ajouts de la 841 (le fil des résultats au doigt)

Aucune phrase neuve : la carte du fil réemploie mot pour mot les
étiquettes des fiches.

| Français | Anglais | Note |
|---|---|---|
| suivre (le badge de l'en-tête d'une carte du fil) | **Follow** / **Following** (inchangés) | `BoutonSuivre`, le composant des fiches, mêmes états |
| signaler (le fanion du pied d'une carte du fil, icône seule) | **Report <nom>'s portfolio** (l'étiquette accessible, inchangée) | `FenetreSignalement` en variante « icone » : le mot « Report this portfolio » ne s'écrit pas, le drapeau le dit |
| partager (le pied d'une carte du fil) | **Share <nom>'s portfolio** (inchangé) | `BoutonPartageFiche` en variante « icone », comme sous la photo d'une fiche |
| le sous-titre d'une carte (web et fil) | **Artist · Lyon, FR** — le point médian remplace les deux-points | `sousTitreDeCarte` (lib/photo-tatoueur), une seule écriture. ⚠️ La plaque du profil et les portfolios suivis gardent « Artist: Lyon, FR » (nº 613) : la nº 841 ne touche que les cartes |

### Ajouts de la 842 (le titre des cartes, et le fanion du fil)

| Français | Anglais | Note |
|---|---|---|
| le titre d'une carte | **Mara Voss · Private Studio** | le nom demi-gras blanc, le type en gris graisse normale, séparés par le point médian — `components/TitreDeCarte`, une seule écriture pour la carte du web, l'en-tête du fil et la plaque du profil. ⚠️ Le type est INSÉCABLE : un nom long le fait passer à la ligne entier, jamais coupé |
| le sous-titre d'une carte | **Lyon, FR** — la ville seule | le type l'a quitté (nº 842) ; il redevient ce qu'il était avant la nº 613 |
| enregistrer la photo affichée (le fanion du pied, au doigt) | **Save this photo** / **Remove this photo from my favorites** (inchangés) | `BoutonCoeurPhoto` en variante « carte », le cœur des cartes du web — sur « 7/18 », c'est la septième qui part dans Ma sélection |

> **Les portfolios suivis de « Ma sélection » gardent leurs deux-points**
> (« Artist: Lyon, FR », `APRES_LE_TYPE`) : la nº 842 ne parle que des
> cartes et de la plaque du profil.

### Ajouts de la 843 (le badge du type)

| Français | Anglais | Note |
|---|---|---|
| le badge du type, dans le fil du doigt ET sur les cartes du web (nº 852-§8/§9) | **Tattoo Artist** · **Private Studio** · **Tattoo Shop** | `components/BadgeTypeDeFiche` — les trois libellés de la table 1, inchangés ; contour fin, fond de l'interface, et c'est un LIEN vers le profil |
| le titre d'une carte | **Mara Voss** — le nom seul | le type l'a quitté (nº 843) : il est dans le badge au doigt, devant la ville au web |
| le sous-titre d'une carte du web et de la plaque | **Private Studio · Lyon, FR** | `sousTitreDeCarte` (lib/photo-tatoueur), l'écriture partagée des deux porteurs qui n'ont pas la place d'un badge |

> **« Follow » a quitté le fil** (nº 843) et reste sur le profil, où
> l'on décide de suivre quelqu'un qu'on est venu voir. Ses libellés ne
> changent pas.

### Ajouts de la 844 (la pastille, les chevrons, le badge, la plaque)

Un seul mot neuf dans toute la passe — l'étiquette de la croix de
retour ; tout le reste réemploie des étiquettes existantes.

| Français | Anglais | Note |
|---|---|---|
| ~~retour (la croix de la vue photo au doigt)~~ | ~~**Back**~~ | ⚠️ RETIRÉ À LA nº 845 : la croix a été supprimée avec le rétablissement de la plaque (doublon). Ce libellé n'existe plus dans le site |
| photo suivante / précédente (les chevrons d'une FICHE, web) | **Next photo** / **Previous photo** (inchangés) | les fiches prennent le chevron des cartes (nº 844-§2) ; les étiquettes, elles, étaient déjà celles-là |
| le compteur (« 7/20 »), partout | **7/20** | des chiffres, rien à traduire — mais désormais UNE seule écriture (`PastilleCompteur`) pour les cartes, le fil et les fiches |

### Ajouts de la 845 (la plaque rétablie, le squelette du fil)

**Aucun texte neuf, et un texte RETIRÉ.** La nº 845 rétablit la plaque
du profil que la nº 844 avait supprimée : les deux lignes qu'elle
affiche — le nom, puis « Private Studio · Lyon, FR » — reviennent
telles quelles, sans un mot de changé (`sousTitreDeCarte`,
`ligneCarteMobile`). Le seul libellé de la nº 844, « Back », disparaît
avec la croix qui le portait. Le SQUELETTE du fil et la pastille
alignée sur la marge ne portent aucun texte : des rectangles gris et
des chiffres.

> **Les entrées des nº 842 et 843 qui nomment la plaque redeviennent
> vraies au mot près** : elle est de nouveau à l'écran, dans la vue
> photo du doigt.

### Ajouts de la 846 (les en-têtes de recherche)

| Français | Anglais | Note |
|---|---|---|
| le texte d'invite du champ de recherche (barre du doigt, accueil) | **Search a style or a city** | `TEXTES_TATOUAGE.invitePilule` — il disait « Find your tattoo style… », mot pour mot le titre posé au-dessus des cartes. Il dit désormais ce qu'on peut y CHERCHER : les deux entrées du moteur, ni plus ni moins |
| le sous-titre de l'accueil | **15 portfolios • 9 styles** | deux comptes séparés par la puce du site (`SEPARATEUR_GALERIE`) ; le second est neuf, et c'est le nombre de cartes de style posées sous le titre. L'accord tient au singulier : « 1 style » |
| le titre d'une page de résultats | **15 portfolios** | c'est le compte, et rien d'autre ; ce qu'on cherche descend en badges |
| retirer un filtre (la croix d'un badge) | **Remove the Realism filter** · **Remove the Austin, TX filter** | `FiltresActifs` — le nom accessible de la croix nomme le filtre qu'elle retire, parce qu'un lecteur d'écran ne voit pas le texte à sa gauche comme une étiquette |
| ~~le titre d'une recherche sans catégorie~~ | ~~**All tattoos**~~ | ⚠️ RETIRÉ À LA nº 846 : le titre d'une recherche est son compte, il n'y a plus de titre générique. `titreRechercheSansCategorie` est supprimée de `TEXTES_TATOUAGE` |

> **Le titre de l'accueil ne change pas d'un caractère** (« Find your
> tattoo style… ») : il est simplement MONTRÉ au doigt désormais, là où
> la nº 444 l'avait retiré. Et la CATÉGORIE (« Tattoos », « Flashes »)
> n'a pas de badge : elle filtre toujours et se lit dans le moteur,
> mais elle ne s'écrit plus au-dessus des cartes.

### Ajouts de la 847 (six retouches des en-têtes)

**Aucun texte neuf, et un aller-retour.** La nº 847 ne change pas un
mot : elle déplace et rhabille ce que la nº 846 avait posé.

| Français | Anglais | Note |
|---|---|---|
| le texte d'invite du champ (barre du doigt, accueil) | **Find your tattoo style…** | `TEXTES_TATOUAGE.invitePilule` — il redevient ce qu'il était avant la nº 846. Le doublon n'existe plus : le titre de l'accueil est retiré AU DOIGT (nº 847-§1), et la pilule ne vit que là. Deux clés portent donc la même chaîne, et c'est voulu — ce sont deux choses |
| le compte des résultats | **15 portfolios** | ce n'était plus un titre écrit en grand : c'est le PREMIER BADGE de la rangée, sans croix. Le mot ne change pas ; il garde sa balise `h1`, parce qu'il reste le titre de la page |

> **Le titre de l'accueil (« Find your tattoo style… ») et son
> sous-titre (« 15 portfolios • 9 styles ») ne changent pas d'un
> caractère** : ils ne s'affichent simplement plus qu'au WEB, comme
> avant la nº 846.

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
  suppressions, calendrier des sessions). Les derniers `fr-FR` (les
  dates de l'admin, le relevé d'une sonde) sont passés en `en-US` à la
  nº 806 ; les tris (`localeCompare`, `Intl.Collator`) en `en`.
- **`lang="en"`** sur `<html>`, `locale: "en_US"` pour Open Graph,
  `lang: "en"` dans le manifeste.

---

## 5 · Ce qui n'est PAS traduit, et pourquoi

- **Les adresses (routes)** : `/devenir-tatoueur`, `/mes-favoris`,
  `/rejoindre`, `/recherche`, `/tatouage/…`, `/tatoueur/…` restent en
  français. Ce ne sont pas des textes : ce sont des liens, des
  redirections, des adresses canoniques, des images de partage, des
  bancs. C'est un sujet à part, à décider par Kevin (une passe
  « adresses »). **Depuis la nº 811, les trois pages éditoriales sont
  en anglais** : `/about` (ex `/qui-sommes-nous`), `/legal` (ex
  `/mentions-legales`), `/contact` (inchangé) — les anciennes adresses
  redirigent en 301 (lib/chemins-editoriaux, next.config). **La
  quatrième, `/terms` (nº 814), naît en anglais.**
- **Les limaces** (`fine-line`, `tatouage`, `salon`, `prive`…) : des
  clés, en base et dans les adresses.
- **Les noms propres** : YokoFolio, Instagram, TikTok, Google, Vercel,
  Supabase, les noms de conventions.
- **Les commentaires du code** restent en français : ils sont pour Kevin.
- **Les données de banc et de reconnaissance** (`lib/tatoueurs-demo`,
  `lib/emojis-donnees`, les tables de `lib/adresse`, le script
  `engendrer-emojis`) : les quatre seules exceptions du recenseur depuis
  la nº 806 — des DONNÉES, jamais de l'interface. Les instruments
  (sondes, /dev) et les étiquettes `data-source-composant` ne sont plus
  des exceptions : ils sont traduits.

---

## Passe nº 852 — le type d'un artiste se dit en deux mots

| avant | après | où |
| --- | --- | --- |
| **Artist** | **Tattoo Artist** | `libelleTypeFiche` (config/tatouage) — les badges des cartes (web et fil), la ligne sous le nom d'un profil, la plaque, « Ma sélection », la liste des suivis ; les deux replis de `lib/modes-exercice` ; le tableau du démarchage (`lib/demarchage`) ; les deux libellés du formulaire (`TYPES_FICHE`, `CHOIX_PROFIL`) |

> La casse est celle de la famille — deux capitales, comme
> « Tattoo Shop » —, et non des capitales pleines : c'est un libellé,
> pas un cri. Le slug (`artiste`) ne bouge pas d'une lettre : rien en
> base, rien dans les adresses.
>
> **Ce qui n'a PAS changé, et c'est voulu** : le titre du groupe de
> filtres « Artist » (`FILTRE_MODE_ACTIVITE`, config/tatouage) — ce
> n'est pas le type d'un portfolio mais l'en-tête d'une section du
> moteur (« comment travaille l'artiste qu'on cherche »).

---

## Passe nº 857 — le va-et-vient Tattoo / Flash de l'accueil du doigt

| avant | après | où |
| --- | --- | --- |
| **Find your tattoo style…** (le champ de recherche de l'accueil, smartphone) | **Find your tattoo style…** — la première position du va-et-vient, face à une goutte d'encre | `TEXTES_TATOUAGE.invitePilule` — la clé garde son nom et sa chaîne ; elle n'est plus l'invite d'un champ mais le nom d'une position |
| — | **Find your Flash style…** — la seconde position, face à un éclair | `TEXTES_TATOUAGE.inviteFlash` (config/tatouage), lue par `VaEtVientNature` |
| — | **Tattoo or flash** (nom du groupe, lecteurs d'écran) | `VaEtVientNature` — le même nom que les deux onglets de la page de recherche (`PageRechercheMobile`), puisque c'est le même choix |

> **Les mots sont ceux du propriétaire, capitale comprise** : « Flash »
> est le nom de la catégorie (`CATEGORIES_EXPLORER`), pas un adjectif.
> La position inactive ne montre que son icône ; son texte entier reste
> son nom accessible (`aria-label`) — l'œil voit une icône, le lecteur
> d'écran entend la phrase.
>
> **Ce qui n'a PAS changé** : le champ de recherche du web garde son
> écriture ; la page de recherche plein écran garde ses onglets
> « Tattoo | Flash » ; les cartes de style disent toujours « Réalisme •
> 12 portfolios », pour les flashs comme pour les tattoos.

---

## Passe nº 863 — les deux titres du va-et-vient de l'accueil du doigt

| avant | après | où |
| --- | --- | --- |
| **Find your tattoo style…** (la position Tattoo, face à la goutte d'encre) | **Explore tattoo styles** — le titre entier, actif comme inactif | `TEXTES_TATOUAGE.titreVaEtVientTattoo` (config/tatouage), lue par `VaEtVientNature` — la clé `invitePilule` est renommée : ce n'est plus une invite, c'est le titre de la page « / » au doigt |
| **Find your Flash style…** (la position Flash, face à l'éclair) | **Explore flash styles** — le titre entier, actif comme inactif | `TEXTES_TATOUAGE.titreVaEtVientFlash` — la clé `inviteFlash` est renommée de même ; « flash » en minuscule, à la lettre de la consigne |

> **Plus jamais d'abréviation** : le mot court de la nº 859 (« Tattoo »
> / « Flash », la position inactive) est supprimé, code compris. Les
> deux titres restent entiers ; là où la colonne est trop étroite pour
> le titre au corps de la charte, il passe à la ligne, il n'est ni
> coupé ni abrégé.
>
> **Ce qui n'a PAS changé** : le titre de la mosaïque au web
> (`titreMosaique`, « Find your tattoo style… ») — c'est une autre
> clé, pour une autre surface ; le nom du groupe pour les lecteurs
> d'écran (« Tattoo or flash ») ; les onglets « Tattoo | Flash » de la
> page de recherche.
