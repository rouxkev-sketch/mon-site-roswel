/*
 * ██ nº 791 — LE SERVICE WORKER DE DÉSINSTALLATION (« pierre tombale ») ██
 * ==================================================================
 * CE FICHIER NE MET PLUS RIEN EN CACHE. Il ne sert plus qu'à UNE
 * chose : faire disparaître proprement le service worker que les
 * navigateurs des visiteurs ont encore en mémoire.
 *
 * POURQUOI L'ANCIEN EST PARTI (décision de l'enquête nº 738) : il a
 * servi de vieilles pages à Safari et brouillé le diagnostic pendant
 * une journée entière. Le site n'a pas besoin de lui — la vitesse
 * vient du cache mondial de Vercel (nº 782) et des fichiers versionnés
 * de Next, pas d'un programme qui garde des copies dans le téléphone.
 *
 * ██ POURQUOI ON NE SUPPRIME PAS SIMPLEMENT LE FICHIER ██
 * ------------------------------------------------------------------
 * Un service worker déjà installé NE DISPARAÎT PAS quand son fichier
 * disparaît du serveur. Il continue de tourner, d'intercepter, et de
 * resservir ses vieilles copies — pendant des MOIS, chez tous les
 * visiteurs qui sont déjà venus. C'est exactement le défaut de la
 * nº 738, mais pour toujours et sans moyen de le corriger.
 * ON LAISSE DONC UN FICHIER À LA MÊME ADRESSE, et c'est lui qui se
 * charge de mourir. Le navigateur revérifie `/sw.js` à chaque
 * navigation dans la portée du programme : il trouve ce texte-ci,
 * l'installe comme une mise à jour, et ce texte-ci se désinscrit.
 *
 * ⚠️ L'ADRESSE PORTAIT UNE REQUÊTE (`/sw.js?v=<empreinte>-<millésime>`)
 * et c'est CETTE adresse-là que le navigateur revérifie. Un fichier
 * de `public/` répond à toutes les requêtes : `?v=n'importe quoi`
 * rend donc ce texte. C'est pour cela que la pierre tombale doit
 * garder LE NOM `sw.js`, et lui seul.
 *
 * ⚠️ ET LA PAGE FAIT LA MÊME CHOSE DE SON CÔTÉ
 * (src/components/DesinscriptionServiceWorker.tsx) : elle appelle
 * `unregister()` sur tout ce qu'elle trouve. Les deux voies se
 * couvrent l'une l'autre, et aucune ne suffit seule :
 *  · la PAGE agit tout de suite, mais seulement si notre code tourne.
 *    Or un visiteur peut recevoir une PAGE ANCIENNE, servie par
 *    l'ancien programme depuis son cache : ce vieux code-là ne
 *    connaît pas la désinscription, il RÉENREGISTRE `/sw.js` — et
 *    tombe alors sur ce fichier-ci, qui l'achève ;
 *  · la PIERRE TOMBALE agit sans notre code, mais seulement quand le
 *    navigateur décide de revérifier. La page, elle, n'attend pas.
 *
 * ⚠️ AUCUN GESTIONNAIRE `fetch` ICI, ET C'EST VOULU : un service
 * worker sans `fetch` est court-circuité par le navigateur — les
 * requêtes ne passent même plus par lui. Tant qu'il n'est pas encore
 * désinscrit, il ne peut donc rien ralentir ni rien resservir.
 *
 * ⚠️ CE FICHIER EST TEMPORAIRE. Il pourra partir quand tous les
 * visiteurs d'avant la nº 791 seront repassés — disons dans un an.
 * Le supprimer plus tôt ressusciterait le problème : un navigateur
 * qui ne trouve rien à `/sw.js` garde son ancien programme.
 */

self.addEventListener("install", () => {
  //  On ne fait la queue derrière personne : la désinstallation doit
  //  prendre effet à cette visite-ci, pas à la suivante.
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    (async () => {
      //  1. VIDER TOUS LES CACHES. Ceux de l'ancien programme portaient
      //     tous le préfixe « yokofolio- », mais on ne trie pas : ce
      //     programme-ci n'en garde aucun, donc aucun cache de cette
      //     origine n'a plus de raison d'exister.
      try {
        const noms = await caches.keys();
        await Promise.all(noms.map((nom) => caches.delete(nom)));
      } catch (e) {
        //  Un cache qu'on ne peut pas effacer ne doit pas empêcher la
        //  désinscription : c'est elle qui compte.
      }
      //  2. PRENDRE LA MAIN sur les pages déjà ouvertes, pour que la
      //     désinscription ci-dessous les concerne elles aussi.
      try {
        await self.clients.claim();
      } catch (e) {}
      //  3. SE DÉSINSCRIRE. À partir de là, plus aucun programme n'est
      //     enregistré pour cette origine : les pages suivantes vont
      //     droit au réseau, comme un site ordinaire.
      try {
        await self.registration.unregister();
      } catch (e) {}
    })()
  );
});
