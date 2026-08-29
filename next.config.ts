import type { NextConfig } from "next";

// Domaine autorisé pour les photos : celui de notre stockage Supabase
// (déduit de l'adresse du projet dans .env.local)
const domaineSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  /**
   * LE TÉLÉPHONE PASSE PAR L'ADRESSE RÉSEAU — il faut l'autoriser
   * --------------------------------------------------------------
   * Pour tester sur un vrai iPhone, on ouvre le site via l'adresse du
   * PC sur le réseau local (http://192.168.x.x:3000). Or le serveur de
   * DÉVELOPPEMENT de Next 16 refuse par défaut toute origine autre que
   * localhost : la page s'affiche (le HTML passe), mais le moteur React
   * ne démarre jamais — AUCUN bouton ne répond, aucune erreur visible.
   * C'est exactement le bug « tout est mort au doigt » constaté sur
   * iPhone. On autorise donc ici les adresses PRIVÉES du réseau local
   * (et les noms en .local) — uniquement en développement, la version
   * en ligne n'est pas concernée par ce réglage.
   */
  allowedDevOrigins: ["192.*.*.*", "10.*.*.*", "172.*.*.*", "*.local"],

  images: {
    // Les photos des artisans (hébergées chez Supabase) pourront être
    // optimisées et affichées par le site.
    remotePatterns: [
      {
        protocol: "https",
        hostname: domaineSupabase,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    /**
     * ██ nº 366 — LA NETTETÉ DES CARTES, SANS LE POIDS ██
     * ================================================================
     * LES CARTES SERVAIENT LA MINIATURE DE 320 px À DES ÉCRANS QUI EN
     * DEMANDENT 570 À 1170 (densité comprise) : c'était le grain, et
     * il ne venait pas de la source (l'original stocké fait
     * 1080 × 1350). Elles partent désormais de l'original et laissent
     * l'optimiseur fabriquer la taille exacte de CET écran
     * (components/PhotoDeCarte).
     *
     * `formats` — AVIF D'ABORD, WebP ensuite. C'est ce qui paie le
     * changement : à qualité perçue égale, un AVIF pèse environ la
     * moitié d'un JPEG. On quadruple les pixels sans doubler les
     * octets. Le navigateur qui ne sait lire ni l'un ni l'autre reçoit
     * l'original, comme avant.
     *
     * `qualities` — ⚠️ OBLIGATOIRE DEPUIS NEXT 16 : toute qualité
     * employée doit être déclarée ici, sans quoi la demande est
     * refusée. 65 est celle des cartes (PhotoDeCarte) ; 75 reste la
     * valeur par défaut du composant, gardée pour tout le reste.
     *
     * `imageSizes` — la liste par défaut, PLUS 512. C'est le palier qui
     * manquait entre 384 et 640 : une carte de deux colonnes sur un
     * écran Retina de bureau y tombe pile, au lieu de sauter à 640 et
     * de payer un quart de poids pour des pixels que personne ne voit.
     * (Ces largeurs ne servent qu'aux images qui déclarent `sizes`, et
     * doivent toutes rester sous la plus petite de `deviceSizes` —
     * 640. C'est le cas.)
     *
     * ⚠️ `deviceSizes` N'EST PAS TOUCHÉ : la liste par défaut (640,
     * 750, 828, 1080, 1200, 1920, 2048, 3840) couvre déjà nos cas, et
     * la rogner ferait dégringoler d'autres pages sans prévenir.
     */
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75],
    imageSizes: [32, 48, 64, 96, 128, 256, 384, 512],
  },

  /**
   * L'EMPREINTE DE LA COMPILATION
   * ------------------------------
   * Ce fichier est évalué UNE FOIS, au moment de compiler : l'horodatage
   * est donc figé pour toute la durée de vie de cette version du site.
   * Il sert à une seule chose, mais elle est importante : donner au
   * service worker une adresse NEUVE à chaque mise en ligne
   * (`/sw.js?v=…`). Un service worker neuf, c'est un cache neuf, et
   * l'effacement de tous les précédents — sans avoir à penser à
   * incrémenter un numéro à la main, ce qui finit toujours par être
   * oublié.
   */
  env: {
    NEXT_PUBLIC_VERSION_SITE: String(Date.now()),
  },

  /**
   * LES ADRESSES QUI ONT DÉMÉNAGÉ
   * ------------------------------
   * YOKOFOLIO est désormais LE SITE : son index de tatoueurs répond à la
   * racine « / ». Il était à « /tatoueurs » — cette adresse redirige
   * donc vers l'accueil.
   *
   * Le site vitrine de l'agence, qui occupait la racine, passe sur
   * « /agence ». Ses pages juridiques étaient déjà là (/agence/contact,
   * /agence/mentions-legales…) : elles ne bougent pas.
   *
   * Une adresse déplacée doit être REDIRIGÉE, jamais laissée en page
   * introuvable : les liens déjà partagés continuent de fonctionner, et
   * les moteurs de recherche reportent proprement ce qu'ils savaient de
   * l'ancienne page sur la nouvelle (`permanent: true` = 301).
   */
  async redirects() {
    return [
      { source: "/tatoueurs", destination: "/", permanent: true },
      //  La page de réglages du compte s'appelait « Confidentialité »
      //  (passe nº 129). Elle s'appelle « Sécurité », et son adresse
      //  a suivi. Le mot « confidentialité » reste celui de la page
      //  PUBLIQUE (/confidentialite) : les deux ne se croisent pas.
      {
        source: "/devenir-tatoueur/confidentialite",
        destination: "/devenir-tatoueur/securite",
        permanent: true,
      },
      //  ---- LES PAGES DE CRITÈRE DONT LE STYLE A CHANGÉ D'ADRESSE ----
      //  (passe nº 230-§2) La règle du projet est qu'un slug PUBLIÉ ne
      //  change jamais — les renommages de libellé et les DEUX
      //  scissions n'ont donc déplacé aucune adresse : `biomecanique`
      //  et `cyber-tribal` restent les leurs, et « Organique » et
      //  « Cyberpunk » sont des adresses NEUVES qui n'ont jamais eu
      //  d'ancienne. Une seule exception, et c'est une faute de frappe
      //  qu'il fallait corriger : `neo-reaalisme` (deux « a ») était
      //  publié tel quel. Il redirige donc, définitivement.
      //  ⚠️ LES DEUX FORMES : la page de style seule et la page
      //  style + ville — Next ne déduit pas l'une de l'autre.
      //  ⚠️ `statusCode: 301` ET NON `permanent: true` : ce dernier
      //  répond 308. Les deux sont des redirections DÉFINITIVES et
      //  Google les traite pareil, mais le propriétaire a demandé 301
      //  en toutes lettres — et pour une page servie en GET, c'est
      //  exactement équivalent.
      {
        source: "/tatouage/neo-reaalisme",
        destination: "/tatouage/neo-realisme",
        statusCode: 301,
      },
      {
        source: "/tatouage/neo-reaalisme/:ville",
        destination: "/tatouage/neo-realisme/:ville",
        statusCode: 301,
      },
    ];
  },

  /**
   * LE CACHE DE NAVIGATION (bfcache), ET L'ÉCRAN BLANC DU GESTE DE RETOUR
   * =====================================================================
   * MESURÉ, PAS SUPPOSÉ. En version compilée, chaque page de yokofolio
   * partait avec :
   *
   *     Cache-Control: private, no-cache, no-store, max-age=0,
   *                    must-revalidate
   *
   * C'est ce que Next pose d'office sur une page rendue à la demande —
   * et les nôtres le sont, puisqu'elles lisent les cookies de session.
   * Or `no-store` a une conséquence que personne ne cherchait : IL
   * INTERDIT LE CACHE DE NAVIGATION. Chrome comme Safari refusent d'y
   * ranger une page servie ainsi. Mesuré au banc d'essai, la raison
   * exacte du refus est lisible : `notRestoredReasons`.
   *
   * Sans ce cache, un retour arrière ne RESTAURE pas la page vivante :
   * il la redemande au serveur et la reconstruit entièrement. Pendant
   * le balayage depuis le bord de l'écran, il n'y a donc rien à
   * montrer — d'où la seconde de blanc, que repeindre les fonds ne
   * pouvait pas corriger. C'est aussi pourquoi la position se perdait
   * au retour EN AVANT et à la réouverture du navigateur : à chaque
   * fois, un document NEUF.
   *
   * CE QU'ON GARDE : `private` (aucun cache partagé, aucun CDN ne range
   * la page d'un visiteur connecté) et `no-cache` (le navigateur doit
   * revalider auprès du serveur avant de réutiliser sa copie). Seul
   * `no-store` saute : il n'apportait aucune protection que les deux
   * autres ne donnent déjà, et il coûtait le cache de navigation.
   *
   * ⚠️ POURQUOI ICI ET PAS DANS LE PROXY : essayé, mesuré, écarté. Un
   * en-tête posé sur la réponse du proxy ne survit pas au rendu de la
   * page. Next, lui, prévoit explicitement ce réglage : il ne pose sa
   * valeur QUE si la réponse n'en a pas déjà une, « pour permettre de
   * la personnaliser via next.config » (server/send-payload.js).
   *
   * ⚠️ ET LA RÈGLE NE DÉPEND PLUS DE `sec-fetch-dest`. La version
   * précédente ne s'appliquait QUE si la requête portait
   * `sec-fetch-dest: document`. C'était une fragilité que j'ai
   * introduite : cet en-tête n'existe pas partout (Safari ne l'envoie
   * que depuis la version 16.4), et sans lui la règle ne s'applique
   * pas — `no-store` revient, et le cache de navigation reste interdit.
   * Vérifiable en une ligne : la même adresse demandée sans l'en-tête
   * repartait avec `no-store`. C'est peut-être ce qui explique que le
   * défaut ait survécu sur iPhone ; la sonde du retour le dira.
   * On vise donc les ADRESSES DE PAGES, nommément. Rien d'autre n'est
   * touché : `/_next/static/` garde son cache d'un an, les API et les
   * données du routeur gardent le leur.
   *
   * ██████████████████████████████████████████████████████████████████
   * ██  §1 (nº 721) — DEUX AJOUTS, SUR MESURE DE L'AUDIT nº 720      ██
   * ██████████████████████████████████████████████████████████████████
   * A. `/recherche` MANQUAIT À LA LISTE, et ce n'était pas une
   *    décision — c'est un OUBLI. La page est née à la nº 652, APRÈS que
   *    cette liste a été écrite (nº 344-355), et personne n'est revenu
   *    l'y inscrire ; son `force-dynamic` (le rendu serveur des
   *    recherches, décision de la nº 652 qui ne bouge pas d'ici) lui
   *    valait donc le défaut de Next, `no-store` compris. Elle en payait
   *    le prix décrit dans tout le texte ci-dessus : cache de navigation
   *    interdit, geste de retour qui reconstruit la page au lieu de la
   *    restaurer.
   *    ⚠️ CE QUE CE CHANGEMENT N'APPORTE PAS, mesuré et dit : pas de
   *    « rien n'a changé » (304). Une page en `force-dynamic` part en
   *    FLUX, sans ETag ni Last-Modified — faute de témoin, `no-cache`
   *    oblige à retélécharger le corps entier, exactement comme avant.
   *    Le gain de cette ligne est le CACHE DE NAVIGATION, pas les
   *    octets.
   *    (`/mes-favoris` est dans le même cas et n'est PAS traité ici :
   *    une passe, un sujet — il est signalé, pas corrigé.)
   * B. LES IMAGES DE `public/` N'AVAIENT AUCUNE DURÉE. Next les sert en
   *    `public, max-age=0` : avec un ETag, le corps ne repart pas, mais
   *    la permission de réutiliser SANS DEMANDER n'est jamais accordée —
   *    un aller-retour par image et par visite, payé en latence.
   *    ⚠️ UN JOUR, ET SURTOUT PAS `immutable`. Ces fichiers GARDENT LEUR
   *    NOM quand leur contenu change (`yokofolio-icone.png` n'a pas
   *    d'empreinte dedans) : `immutable` figerait l'ancienne image chez
   *    tous les visiteurs le jour d'un remplacement, sans recours. C'est
   *    exactement ce qui les distingue des photos déposées, dont le nom
   *    porte l'instant du dépôt (voir `lib/cache-photos`).
   *    ⚠️ UN SEUL SEGMENT, ET C'EST VOULU : le motif ne descend pas dans
   *    les sous-dossiers, donc `/images-demo/…` garde l'`immutable` que
   *    pose la route qui les fabrique. Et aucune extension de programme
   *    n'y figure : `/sw.js` conserve son `max-age=0`, sans quoi une
   *    mise en ligne ne serait plus vue.
   */
  async headers() {
    const cachePage = [
      {
        key: "Cache-Control",
        value: "private, no-cache, max-age=0, must-revalidate",
      },
    ];
    /*  nº 355 — L'ÉPREUVE DES EN-TÊTES. Le code entier a été innocenté
        (nu-total éjecte encore ; nextjs.org — même moteur, même
        hébergeur — tient) : restent NOS EN-TÊTES et le domaine. Quand
        le cookie du nu total est posé (lib/variantes-essai), les pages
        sont servies avec L'EN-TÊTE D'UN SITE ORDINAIRE — `public,
        max-age=0, must-revalidate` : toujours revalidé (aucune page
        personnalisée ne peut être resservie périmée), mais sans
        `private` ni `no-cache`, les deux jetons qui nous séparent d'un
        site vierge. Un seul essai tranche : nu-total éjectait AVEC les
        en-têtes de la nº 344, le même nu-total tourne désormais SANS.
        Sans le cookie : rien ne change. */
    const cachePageEssai = [
      { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
    ];
    const temoinNuTotal = { type: "cookie" as const, key: "yf_nu_total" };
    const chemins = [
      "/",
      "/recherche",
      "/tatoueur/:slug",
      "/tatouage/:style/:ville",
      "/devenir-tatoueur/:chemin*",
      "/qui-sommes-nous",
      "/contact",
      "/mentions-legales",
      "/rendez-vous",
      "/favoris",
    ];
    /*  §1 (nº 721) — LES IMAGES DÉPOSÉES DANS `public/`. Un jour,
        revalidable, JAMAIS `immutable` (la raison est en tête de cette
        fonction). Le motif tient en UN SEGMENT — `[^/]+` refuse la
        barre oblique — pour ne descendre dans aucun sous-dossier. */
    const cacheImagePublique = [
      { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
    ];
    const imagesPubliques = {
      source: "/:fichier([^/]+\\.(?:png|jpe?g|avif|webp|svg|gif|ico))",
      headers: cacheImagePublique,
    };
    return [
      ...chemins.flatMap((source) => [
        { source, headers: cachePage, missing: [temoinNuTotal] },
        { source, headers: cachePageEssai, has: [temoinNuTotal] },
      ]),
      imagesPubliques,
    ];
  },
};

export default nextConfig;
