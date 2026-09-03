# À valider par un juriste — pages légales de YokoFolio (nº 804, mise à jour nº 814)

La page `/legal` (« Legal Notice » ; adresse `/mentions-legales` jusqu'à la
nº 811, qui redirige) a été traduite en anglais et adaptée
**raisonnablement** au marché américain (Austin, Texas) à la nº 804 : les
références franco-françaises ont été retirées, les faits ont été gardés.

**La nº 814 a tranché une partie de la liste**, sur décision du
propriétaire : une page `/terms` (« Terms of Use ») existe, la page légale
porte une section « Copyright and DMCA » avec l'agent enregistré, et sa
section vie privée complète ce que le droit américain de base attend. Pour
chaque point ci-dessous : **couvert (814)** dit ce que le code fait
désormais ; **reste pour un juriste** dit ce qu'une passe ne peut pas
trancher seule. Rien n'est urgent tant que le site n'a ni modèle économique
ni société ; tout le devient le jour où l'un des deux apparaît.

Contexte, tel que le propriétaire l'a posé : éditeur particulier français,
non commercial, hébergé aux États-Unis, public américain, pas d'avocat.

---

## 1 · Qui publie, et sous quel droit

1. **Un particulier français qui publie un site pour le public texan.**
   La page dit « published by an individual, on a personal, non-commercial
   basis » et que l'identité complète est remise aux hébergeurs, non
   publiée. C'est l'esprit de la loi française (LCEN, art. 6-III-2) pour un
   éditeur non professionnel.
   *Reste pour un juriste* : si cette réserve tient face à un public
   américain, et si la LCEN continue de s'appliquer à Kevin (elle vise
   l'éditeur, pas le lecteur).
2. **Droit applicable et juridiction.**
   *Couvert (814)* : `/terms`, section « Governing law and disputes » —
   **droit de l'État du Texas**, tribunaux d'État et fédéraux du **comté
   de Travis** (le marché du site), règlement amiable d'abord (trente
   jours), et une réserve pour les droits de consommateur auxquels on ne
   peut renoncer. C'est un CHOIX de la passe, écrit une seule fois
   (`DROIT_APPLICABLE`, en tête de la page).
   *Reste pour un juriste* : **c'est le point nº 1 à confirmer.** Un
   éditeur particulier français qui se soumet aux tribunaux texans, c'est
   commode pour le public et exposé pour lui ; l'alternative (droit
   français, tribunaux français) protège l'éditeur mais peut être tenue
   pour inopposable à un consommateur américain. Un avocat dira lequel,
   et si une clause d'arbitrage ou de renonciation aux actions de groupe
   (usuelle aux États-Unis) a un sens pour un site gratuit.
3. **Terms of Use.**
   *Couvert (814)* : la page `/terms` existe — le service, l'usage
   (interdits : copie en masse, usurpation, contenu illicite, contournement
   des protections), les comptes (18 ans, exactitude, responsabilité du
   compte, suppression depuis le compte), les photos des artistes (ils
   **garantissent** être auteurs ou titulaires des droits, montrer leur
   propre travail, et avoir l'accord des personnes reconnaissables ;
   licence non exclusive, gratuite, mondiale, limitée à la présentation
   du travail, qui cesse à la suppression sauf copies techniques
   quelques heures), les portfolios créés par le site (publics, retirés
   IMMÉDIATEMENT sur demande — décision du propriétaire), le renvoi
   DMCA, « as is », limite de responsabilité (100 $), indemnisation,
   droit applicable, modifications, contact. Liée depuis le pied de
   page, la page légale et la création de compte (« you accept the Terms
   of Use » — le lien nomme le document).
   *Reste pour un juriste* : la rédaction dans son ensemble (elle est
   courte à dessein, dans le ton du site) ; l'âge de 18 ans (choisi parce
   que le tatouage est réservé aux majeurs au Texas — 13 ans avec accord
   parental est l'autre usage) ; le plafond de 100 $ et la clause
   d'indemnisation, qui sont des usages américains posés sans avis ; la
   validité du consentement par simple lien à la création de compte
   (« clickwrap » : une case à cocher est parfois préférée).

## 2 · Les données personnelles

4. **Le RGPD s'applique-t-il encore ?** Il a été retiré de la page
   (articles 6.1.b, 82, CNIL) parce que la page ne s'adresse plus au
   public européen. Mais l'éditeur est en France, et des visiteurs
   européens peuvent venir.
   *Reste pour un juriste* : s'il faut garder un paragraphe « EU
   residents » (droits, base légale, autorité de contrôle). Les faits qui
   le nourriraient sont toujours vrais et toujours écrits (collecte
   minimale, pas de vente, suppression à la demande).
5. **Lois américaines sur la vie privée (CCPA/CPRA, Texas Data Privacy and
   Security Act).**
   *Couvert (814)* : la section « Personal information (privacy policy) »
   (ancre `/legal#privacy`) dit désormais, en plus de ce qu'elle disait :
   **qui traite** les données pour le compte de l'éditeur (Vercel,
   Supabase, Resend, Google pour la connexion — et ce que Google donne :
   adresse et nom du compte, rien d'autre demandé) ; **les droits**,
   quel que soit l'État — savoir, copie, correction, suppression, depuis
   le compte ou par e-mail, réponse sous quarante-cinq jours, aucune
   différence de traitement pour les avoir exercés, vérification quand
   un tiers écrit au nom de quelqu'un ; « **does not sell personal
   information and does not share it for advertising** », d'où rien à
   refuser pour un signal « Do Not Track » ou Global Privacy Control.
   *Reste pour un juriste* : les seuils de ces lois (chiffre d'affaires,
   volume) ne sont très probablement PAS atteints par un site sans modèle
   économique — à confirmer, et à surveiller si le site grandit ; si les
   mots « sell / share » suffisent au sens de ces lois ; si un lien
   « Your privacy choices » distinct est attendu même quand il n'y a rien
   à choisir.
6. **Mineurs.**
   *Couvert (814)* : `/terms` — 18 ans pour créer un compte ; `/legal` —
   « not meant for children under 13 », rien collecté sciemment, un
   compte d'enfant signalé est supprimé (COPPA).
   *Reste pour un juriste* : le site ne VÉRIFIE toujours pas l'âge (ni
   case, ni date de naissance) — une mention suffit-elle ; et l'âge
   choisi (point 3).
7. **Localisation des données.** La page dit « processed in the United
   States » (base Supabase en région US Est depuis la nº 766 ; Vercel en
   Californie).
   *Reste pour un juriste* : le cache mondial de Vercel (nº 782) fait-il
   transiter des photos par d'autres pays, et faut-il le dire ?

## 3 · Les photos et le contenu des tatoueurs

8. **DMCA.**
   *Couvert (814)* : le propriétaire a enregistré un agent au Copyright
   Office — « DMCA Designated Agent », registration **DMCA-1079752**,
   contact **contact@yokofolio.com** depuis la nº 835 : la boîte existe et
   reçoit (redirection OVH vérifiée par le propriétaire). ⚠️ **IL RESTE À
   METTRE À JOUR LE REGISTRE** du Copyright Office — l'adresse affichée
   doit être celle qui y figure, et le registre porte encore l'ancienne.
   C'est noté en commentaire dans `legal/page.tsx`, constante
   `AGENT_DMCA`. La section « Copyright and
   DMCA » (ancre `/legal#dmca`) décrit : l'agent et son enregistrement
   (§ 512(c)(2)) ; les six éléments d'une notification (§ 512(c)(3)) ;
   le retrait rapide et l'avis à l'artiste ; la contre-notification, ses
   éléments et la remise en ligne sous dix à quatorze jours ouvrés
   (§ 512(g)) ; la clôture des comptes récidivistes (§ 512(i)) ; la
   fausse déclaration (§ 512(f)). `/terms` y renvoie et répète la règle
   des récidivistes.
   *Reste pour un juriste* : **§ 512(c)(2) demande que le site affiche
   aussi le nom, l'adresse postale et le téléphone de l'agent**, tels
   qu'enregistrés. La passe ne les connaît pas et n'en a inventé aucun :
   la page dit qu'ils sont au registre public du Copyright Office. À
   compléter par le propriétaire dans `AGENT_DMCA` (adresse postale,
   téléphone) s'il veut le « safe harbor » complet — ou à faire confirmer
   que le renvoi au registre suffit. Et : une procédure écrite ne suffit
   pas, il faut la TENIR (retirer vite, prévenir l'artiste, garder trace,
   fermer les récidivistes) — aucun outil d'administration ne l'assiste
   aujourd'hui.
9. **Section 230 / responsabilité éditoriale.** Le site RELIT les photos
   avant publication (« reviewed before they are published »).
   *Reste pour un juriste* : si cette modération change la responsabilité
   de l'éditeur sur ce qui est publié. Les Terms disent que le site peut
   refuser ou retirer une photo, et pourquoi.
10. **La licence accordée par le tatoueur.**
    *Couvert (814)* : `/terms` — licence non exclusive, gratuite,
    mondiale, pour héberger, stocker, redimensionner et afficher les
    photos et le portfolio, sur le site et dans ses aperçus (réseaux
    sociaux, moteurs), au seul but de présenter le travail ; elle cesse
    à la suppression, **les copies techniques (caches, aperçus) pouvant
    survivre quelques heures** (nº 782). La page légale garde la version
    courte (« authorizes its display on the site »).
    *Reste pour un juriste* : la formulation vaut-elle licence au sens
    américain.
11. **Droit à l'image des personnes tatouées.**
    *Couvert (814)* : `/terms` — l'artiste garantit « the permission of
    any person recognizable in it ».
    *Reste pour un juriste* : une garantie suffit-elle, ou faut-il le
    demander au dépôt (une case, un texte sous le bouton d'ajout).

## 4 · Le reste

12. **Cookies.** La page dit « only strictly necessary cookies » et « no
    analytics tool that would track visitors across sites ». Vrai
    aujourd'hui (session Supabase, cookies de préférences d'affichage).
    Aucune bannière n'est nécessaire aux États-Unis pour cela. À
    revérifier si un outil de mesure est ajouté un jour.
13. **E-mails transactionnels** (confirmation de compte, réinitialisation,
    accusé du formulaire de contact) : pas de prospection, donc CAN-SPAM
    ne joue pas. Le jour d'une newsletter, il jouera. (Resend, qui les
    envoie, est nommé depuis la nº 814 comme sous-traitant.)
14. **Accessibilité (ADA / WCAG).** Pas un texte légal, mais une
    exposition réelle aux États-Unis. Le site a des `aria-label` partout ;
    aucun audit formel n'a été fait.
15. **Le nom et le logo.** « remain the property of the publisher » —
    aucune marque n'est déposée (USPTO ni INPI). À décider avant qu'un
    tiers ne le fasse.
16. **La date de mise à jour** : 2 septembre 2026 sur les deux pages
    (nº 804 pour l'adaptation américaine, nº 814 pour DMCA, vie privée et
    Terms — le même jour).
17. **La boîte contact@yokofolio.com** (nouveau, nº 814). C'est l'adresse
    que la page légale affiche depuis la nº 322 ; le propriétaire dit à la
    nº 814 qu'elle « existera ». ⚠️ **CETTE RÉSERVE EST LEVÉE (nº 835)** :
    la boîte contact@yokofolio.com existe et reçoit (redirection OVH,
    vérifiée par le propriétaire). Les demandes de suppression et d'accès
    de `/legal` arrivent donc bien quelque part.
    `/terms` n'affiche aucune adresse : les questions passent par la page
    de contact (le formulaire fonctionne, quelle que soit la boîte), les
    notifications de droit d'auteur par l'agent DMCA.
18. **L'écran de consentement Google** (nouveau, nº 814). La console
    Google pointe « règles » et « confidentialité » vers `/legal`
    (nº 811). Depuis la nº 814, l'adresse des conditions d'utilisation est
    `/terms`, et la politique de confidentialité a une ancre :
    `/legal#privacy`. À mettre à jour dans la console — le site ne peut
    pas le faire.

---

*Le code dit ce que le site fait, et rien qu'il ne puisse tenir. Les
choix de la nº 814 (Texas, 18 ans, 100 $, indemnisation) sont écrits une
seule fois chacun, en tête de `terms/page.tsx`, pour être repris d'un
geste si le juriste en décide autrement.*
