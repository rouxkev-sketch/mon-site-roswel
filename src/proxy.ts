import { createServerClient } from "@supabase/ssr";
//  §1 (nº 652) — le chemin de la recherche, écrit une seule fois.
import { ADRESSE_RECHERCHE } from "@/lib/chemin-recherche";
import { NextResponse, type NextRequest } from "next/server";
import { infosConnexionSupabase } from "@/lib/supabase/env";
//  §1 (nº 796) — la règle des effacements, écrite une seule fois.
import { estUnEffacementPur } from "@/lib/supabase/effacement-de-session";

/**
 * PROXY (exécuté avant chaque page)
 * ---------------------------------
 * Son unique rôle : garder la session du visiteur à jour.
 * Les jetons de connexion Supabase expirent régulièrement ;
 * ce code les renouvelle automatiquement à chaque visite,
 * pour que personne ne soit déconnecté sans raison.
 */
export async function proxy(request: NextRequest) {
  // Anciennes URLs « chef à domicile » (pivot abandonné) : redirection
  // PERMANENTE (301) vers l'accueil, pour préserver le référencement des
  // pages /chef-francais/[ville], /chef-italien/[ville], etc.
  const chemin = request.nextUrl.pathname;
  if (/^\/chef-[a-z-]+(?:\/|$)/.test(chemin)) {
    return NextResponse.redirect(new URL("/", request.url), 301);
  }

  // ⚠️ PLUS D'EN-TÊTE D'ADRESSE À POSER (passe nº 145-§1). Le proxy en
  // ajoutait un (`x-chemin`) pour que la mise en page RACINE sache sur
  // quelle page elle travaillait, et décide d'afficher ou non
  // l'habillage du produit artisans. Cet habillage était descendu dans
  // le groupe (artisans), parti à la passe nº 760 : il n'y a plus
  // qu'un site, et personne n'a plus besoin de connaître l'adresse.
  /*  §4 (nº 790) — LE COOKIE DU « NU TOTAL » NE SE POSE PLUS ICI. Le
      banc d'épreuve par variantes (nº 353) coupait les mécanismes du
      site un par un, depuis l'adresse, pour que le téléphone du
      propriétaire nomme le coupable des éjections de retour. Il l'a
      nommé (nº 350 : Chrome iOS saute au retour les entrées créées
      sans interaction) : le banc, son cookie, ses huit portes et son
      bloc du script d'avant peinture partent au grand ménage. */

  /*  nº 357 — L'ACCUEIL NU EST PRÉRENDU ; dès que « / » porte une
      requête (?style=…, ?page=…), on SERT LE JUMEAU
      DYNAMIQUE par réécriture : l'adresse du navigateur reste « / »,
      l'état continue de vivre dans l'adresse (règle nº 328), et le
      rendu serveur des recherches (nº 203) est préservé. */
  const versLeJumeau =
    request.nextUrl.pathname === "/" && request.nextUrl.search !== "";
  /*  nº 359 — LES FICHES AUSSI SONT PRÉPARÉES D'AVANCE, et leurs tags
      (?style=…) sont lus par le navigateur. Les ROBOTS D'APERÇU et
      d'indexation, eux, ne lisent pas le navigateur : pour eux seuls,
      une adresse de fiche À REQUÊTE est servie par le JUMEAU COMPLET
      (rendu dynamique, métadonnées par tags de la nº 281-§2) —
      l'adresse publique ne change pas. Les visiteurs, eux, reçoivent
      la page préparée d'avance. */
  const agent = request.headers.get("user-agent") ?? "";
  const robotDApercu =
    /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|LinkedInBot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|DuckDuckBot/i.test(
      agent
    );
  const ficheTaguee =
    /^\/artist\/[^/]+$/.test(request.nextUrl.pathname) &&
    request.nextUrl.search !== "";
  const versLeJumeauDeFiche = robotDApercu && ficheTaguee;
  const fabriquerReponse = () =>
    versLeJumeau
      ? //  §1 (nº 652) — LE FILET DE L'ANCIENNE ADRESSE. La recherche
        //  a son adresse à elle (`/search`) et les liens du site y
        //  mènent directement ; cette réécriture, elle, RESTE — un
        //  lien « /?style=… » déjà partagé, ou un signet, continue de
        //  servir la même page, sans redirection ni erreur. Le chemin
        //  est lu là où il est écrit une seule fois.
        NextResponse.rewrite(
          new URL(
            ADRESSE_RECHERCHE + request.nextUrl.search,
            request.url
          ),
          { request }
        )
      : versLeJumeauDeFiche
        ? NextResponse.rewrite(
            new URL(
              //  nº 836 — « /complet » s'appelle « /full » depuis que
              //  les adresses parlent anglais (lib/chemins-anglais).
              request.nextUrl.pathname + "/full" + request.nextUrl.search,
              request.url
            ),
            { request }
          )
        : NextResponse.next({ request });
  let reponse = fabriquerReponse();

  const { url, clePublishable } = infosConnexionSupabase();

  const supabase = createServerClient(url, clePublishable, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAPoser) {
        /*  §1 (nº 796) — CE PROXY POSE LA SESSION, IL NE L'EFFACE
            JAMAIS. La règle, le défaut qu'elle corrige et ses cinq
            maillons sont écrits UNE SEULE FOIS, dans le module importé
            en tête de fichier (`lib/supabase/effacement-de-session`) :
            les deux écrivains de cookies du serveur l'appliquent, et un
            seul texte en répond. */
        if (estUnEffacementPur(cookiesAPoser)) return;
        cookiesAPoser.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        reponse = fabriquerReponse();
        cookiesAPoser.forEach(({ name, value, options }) =>
          reponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Cette lecture déclenche le renouvellement de la session si besoin.
  // Ne pas ajouter de code entre la création du client et cette ligne.
  await supabase.auth.getClaims();

  /*  ██ §1 (nº 432) — L'AIGUILLAGE DES FICHES TAGUÉES EST DÉCLARÉ AUX
      CACHES, ET LA COPIE ROBOT N'EST PLUS CAPTURABLE ██
      ------------------------------------------------------------------
      LE RELEVÉ (iPhone, trois navigateurs) : au rechargement d'une
      fiche dont l'adresse porte des tags, un HUMAIN recevait « la page
      des robots » — un document SANS l'habillage d'appareil. Or
      l'aiguillage direct est JUSTE (vérifié en local au user-agent
      près : l'humain reçoit la fiche préparée d'avance, script
      compris ; le jumeau des robots contient LUI AUSSI le script du
      layout). Ce que l'humain recevait était donc une COPIE EN CACHE
      de la réponse robot : la même adresse sert DEUX documents selon
      le user-agent, et rien ne le déclarait — aucun « Vary:
      User-Agent ». N'importe quel cache entre le téléphone et le
      serveur (celui de l'hébergeur, un relais) pouvait donc capturer
      la version robot et la resservir à tout le monde.
      LA RÈGLE, DÉSORMAIS : la réponse du JUMEAU (celle des robots)
      part en « private, no-store » — un aperçu se refabrique à chaque
      demande, il n'a RIEN à faire dans un cache. Une réponse que
      personne ne stocke ne peut plus être resservie à personne : le
      vecteur robot → humain est mort à la source.
      ⚠️ POURQUOI PAS UN « Vary: User-Agent » : essayé, et MESURÉ
      inopérant — le serveur de Next recompose l'en-tête Vary de
      routage après le proxy et écrase toute valeur posée ici. Il
      devient de toute façon inutile : la SEULE réponse qui diverge
      par user-agent sous cette adresse est le jumeau, désormais
      jamais stocké ; la fiche préparée d'avance, elle, est identique
      pour tous les humains.
      ⚠️ LES APERÇUS DES ROBOTS NE CHANGENT PAS : l'aiguillage par
      user-agent est intact, le jumeau rend toujours ses métadonnées
      par tags (nº 281-§2) — seul un en-tête s'ajoute, et les robots
      d'aperçu ne mettent pas leurs requêtes en cache.
      ⚠️ Une copie DÉJÀ capturée par un cache amont ne meurt que par
      expiration ou purge — cet en-tête empêche toute NOUVELLE
      capture, et l'écrivain de secours du crochet d'appareil
      (lib/appareil, §2 nº 432) habille toute vieille copie qui
      atteindrait encore un humain. */
  if (ficheTaguee && robotDApercu) {
    reponse.headers.set("Cache-Control", "private, no-store");
  }

  return reponse;
}

export const config = {
  // Le proxy s'exécute partout SAUF sur les fichiers statiques
  // (images, carte d'identité de l'application, pierre tombale du
  // service worker), inutiles à traiter.
  //  §4 (nº 791) — DEUX NOMS DE MOINS : `offline.html` est supprimée
  //  (seul le service worker la servait) et `icons/` n'a jamais existé
  //  dans ce dépôt. `sw.js` reste : le fichier vit encore, en pierre
  //  tombale.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
