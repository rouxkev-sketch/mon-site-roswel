import { createServerClient } from "@supabase/ssr";
//  §1 (nº 652) — le chemin de la recherche, écrit une seule fois.
import { ADRESSE_RECHERCHE } from "@/lib/chemin-recherche";
//  §1 (nº 873) — le chemin des pages d'un portfolio, écrit une seule
//  fois (une feuille sans dépendance, comme la recherche).
import { cheminDeFiche } from "@/lib/lien-interne";
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

  /*  ██ §1 (nº 873) — LES ANCIENNES ADRESSES DE L'ONGLET PORTFOLIO
      REDIRIGENT EN 301 ██
      ------------------------------------------------------------------
      Le portfolio et les flashs d'un artiste sont des PAGES depuis
      cette passe (`/artist/<nom>/portfolio`, `/artist/<nom>/flash`) :
      l'onglet ne vit plus dans la requête. Deux écritures l'y
      mettaient, et des liens copiés ou des signets peuvent encore les
      porter :
       · « ?onglet=portfolio » — l'onglet Portfolio d'un profil (nº 329) ;
       · « ?entree=portfolio » — le fil de galeries ouvert depuis ce
         même onglet, au doigt (nº 863/866), avec les tags de la galerie
         touchée (style, rendu, nature, photo).
      Les deux mènent DÉFINITIVEMENT à la page qui leur correspond : les
      flashs si les tags disaient « nature=flash », le portfolio sinon.
      Les autres tags se perdent — la page montre TOUTE la catégorie,
      il n'y a plus de galerie « ouverte » (nº 873-§3). Le 301 transfère
      ce que les moteurs savaient de l'ancienne adresse. */
  const ficheAncienOnglet = /^\/artist\/([^/]+)$/.exec(request.nextUrl.pathname);
  if (ficheAncienOnglet) {
    const requete = request.nextUrl.searchParams;
    if (
      requete.get("onglet") === "portfolio" ||
      requete.get("entree") === "portfolio"
    ) {
      return NextResponse.redirect(
        new URL(
          cheminDeFiche(
            ficheAncienOnglet[1],
            requete.get("nature") === "flash" ? "flash" : "portfolio"
          ),
          request.url
        ),
        301
      );
    }
  }

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

  /*  ██ §5 (nº 842) — LE PROXY NE TOMBE PLUS AVEC SUPABASE ██
      ------------------------------------------------------------------
      CETTE LIGNE ÉTAIT LE SEUL POINT DE PANNE GLOBAL DU SITE. Le proxy
      s'exécute sur TOUTES les adresses sauf les fichiers statiques
      (voir le `matcher`, en bas) ; une exception ici n'échoue pas une
      page, elle échoue LA REQUÊTE — donc toutes les pages, tant que la
      cause dure. Or `getClaims` parle au serveur d'authentification de
      Supabase par le réseau : un incident chez lui, une coupure d'une
      seconde, une réponse malformée, et le site entier devient
      injoignable sans qu'une seule ligne du site soit en cause.
      CE QU'ON PERD QUAND ELLE ÉCHOUE, ET C'EST TOUT : la session n'est
      pas RENOUVELÉE pour cette requête-là. Le cookie existant continue
      de valoir ; la page se rend, connectée ou non, selon ce que le
      serveur en lit. La requête suivante retentera. C'est très
      exactement le comportement qu'on veut d'un renouvellement
      d'avance : il aide, il ne conditionne rien.
      ⚠️ ON NE TOUCHE À RIEN D'AUTRE : aucun code ne s'ajoute entre la
      création du client et cette lecture (la consigne d'origine), et
      les cookies posés par `setAll` pendant l'appel restent posés — la
      réponse est déjà refabriquée quand l'exception arrive.
      ⚠️ CE N'EST PAS LE MESSAGE « The site is temporarily unavailable »
      QUE LE PROPRIÉTAIRE A VU : celui-là est le nôtre, et il est
      HONNÊTE — il dit qu'une LECTURE DE BASE a échoué en production, où
      le catalogue de démonstration est interdit (lib/catalogue-
      demonstration). Le site répondait donc ; c'est la base qui ne
      répondait pas. Ce garde-fou-ci couvre l'autre panne possible,
      celle qui n'aurait affiché aucun message du tout. */
  try {
    // Cette lecture déclenche le renouvellement de la session si besoin.
    // Ne pas ajouter de code entre la création du client et cette ligne.
    await supabase.auth.getClaims();
  } catch (erreur) {
    console.warn(
      "[proxy] session not refreshed:",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }

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
