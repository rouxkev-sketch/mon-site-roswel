# À valider par un juriste — page légale de YokoFolio (passe nº 804)

La page `/legal` (« Legal Notice » ; adresse `/mentions-legales` jusqu’à la nº 811, qui redirige) a été traduite en anglais et
adaptée **raisonnablement** au marché américain (Austin, Texas) : les
références franco-françaises ont été retirées, les faits ont été gardés.
**Rien n'a été inventé** — pas d'entité américaine, pas de clause de droit
applicable, pas d'agent DMCA. Ce sont précisément les points ci-dessous,
qui demandent un avocat. Aucun n'est urgent tant que le site n'a ni
modèle économique ni société ; tous le deviennent le jour où l'un des
deux apparaît.

---

## 1 · Qui publie, et sous quel droit

1. **Un particulier français qui publie un site pour le public texan.**
   La page dit « published by an individual, on a personal, non-commercial
   basis » et que l'identité complète est remise aux hébergeurs, non
   publiée. C'est l'esprit de la loi française (LCEN, art. 6-III-2) pour un
   éditeur non professionnel. À vérifier : si cette réserve tient face à
   un public américain, et si la LCEN continue de s'appliquer à Kevin
   (elle vise l'éditeur, pas le lecteur).
2. **Droit applicable et juridiction.** La page n'en dit rien. Un avocat
   dira s'il faut une clause (Texas ? France ?) et où la poser — cette
   page, ou des Terms of Use à créer.
3. **Absence de Terms of Use / Terms of Service.** Le site n'en a pas ; la
   page légale en tient lieu (photos, liens sortants, suppression). Aux
   États-Unis, des CGU séparées sont l'usage. À décider.

## 2 · Les données personnelles

4. **Le RGPD s'applique-t-il encore ?** Il a été retiré de la page
   (articles 6.1.b, 82, CNIL) parce que la page ne s'adresse plus au
   public européen. Mais l'éditeur est en France, et des visiteurs
   européens peuvent venir : un avocat dira s'il faut garder un
   paragraphe « EU residents » (droits, base légale, autorité de
   contrôle). Les faits qui le nourriraient sont toujours vrais et
   toujours écrits (collecte minimale, pas de vente, suppression à la
   demande).
5. **Lois américaines sur la vie privée.** CCPA/CPRA (Californie) et
   Texas Data Privacy and Security Act : leurs seuils (chiffre
   d'affaires, volume de données) ne sont très probablement PAS atteints
   par un site sans modèle économique. À confirmer, et à surveiller si le
   site grandit. La page dit déjà « none of this is sold, shared, or used
   for advertising » — un avocat dira si le mot « sold/shared » suffit au
   sens de ces lois.
6. **Mineurs.** Le tatouage est réservé aux majeurs au Texas ; le site
   n'a aucune vérification d'âge, ni pour les visiteurs (compte
   favoris) ni pour les tatoueurs. COPPA (moins de 13 ans) : le site ne
   vise pas les enfants, mais rien ne le dit. À trancher : une mention,
   une case, ou rien.
7. **Localisation des données.** La page dit « processed in the United
   States » (base Supabase en région US Est depuis la nº 766 ; Vercel en
   Californie). À vérifier : le cache mondial de Vercel (nº 782) fait-il
   transiter des photos par d'autres pays, et faut-il le dire ?

## 3 · Les photos et le contenu des tatoueurs

8. **DMCA.** La page promet qu'une image publiée sans autorisation sera
   retirée sur simple e-mail. Pour bénéficier de la protection « safe
   harbor » (17 U.S.C. § 512), il faut un **designated agent** enregistré
   au Copyright Office et une procédure de notification/contre-notification
   décrite. Ni l'un ni l'autre n'existent. C'est le point le plus concret
   de cette liste.
9. **Section 230 / responsabilité éditoriale.** Le site RELIT les photos
   avant publication (« reviewed before they are published »). Un avocat
   dira si cette modération change la responsabilité de l'éditeur sur ce
   qui est publié.
10. **La licence accordée par le tatoueur.** « authorizes its display on
    the site », qui cesse à la suppression du portfolio. À vérifier : la
    formulation vaut-elle licence au sens américain ; faut-il couvrir les
    copies techniques (cache, miniatures, image de partage OG) qui
    survivent quelques heures à la suppression ?
11. **Droit à l'image des personnes tatouées.** Les photos montrent des
    corps. La page ne dit rien du consentement des clients photographiés.
    À décider s'il faut le demander au tatoueur au dépôt.

## 4 · Le reste

12. **Cookies.** La page dit « only strictly necessary cookies » et « no
    analytics tool that would track visitors across sites ». Vrai
    aujourd'hui (session Supabase, cookies de préférences d'affichage).
    Aucune bannière n'est nécessaire aux États-Unis pour cela. À
    revérifier si un outil de mesure est ajouté un jour.
13. **E-mails transactionnels** (confirmation de compte, réinitialisation,
    accusé du formulaire de contact) : pas de prospection, donc CAN-SPAM
    ne joue pas. Le jour d'une newsletter, il jouera.
14. **Accessibilité (ADA / WCAG).** Pas un texte légal, mais une
    exposition réelle aux États-Unis. Le site a des `aria-label` partout ;
    aucun audit formel n'a été fait.
15. **Le nom et le logo.** « remain the property of the publisher » —
    aucune marque n'est déposée (USPTO ni INPI). À décider avant qu'un
    tiers ne le fasse.
16. **La date de mise à jour** est passée au 2 septembre 2026 : le fond a
    changé (adaptation américaine), la date le dit.

---

*Aucun de ces points n'a été tranché dans le code. La page dit ce que le
site fait, et rien qu'elle ne puisse tenir.*
