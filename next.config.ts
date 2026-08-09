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
   */
  async headers() {
    const cachePage = [
      {
        key: "Cache-Control",
        value: "private, no-cache, max-age=0, must-revalidate",
      },
    ];
    return [
      { source: "/", headers: cachePage },
      { source: "/tatoueur/:slug", headers: cachePage },
      { source: "/tatouage/:style/:ville", headers: cachePage },
      { source: "/devenir-tatoueur/:chemin*", headers: cachePage },
      { source: "/qui-sommes-nous", headers: cachePage },
      { source: "/contact", headers: cachePage },
      { source: "/mentions-legales", headers: cachePage },
      { source: "/rendez-vous", headers: cachePage },
      { source: "/favoris", headers: cachePage },
    ];
  },
};

export default nextConfig;
