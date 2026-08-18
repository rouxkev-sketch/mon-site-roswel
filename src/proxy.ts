import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { infosConnexionSupabase } from "@/lib/supabase/env";
import { COOKIE_NU_TOTAL } from "@/lib/variantes-essai";

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
  // l'habillage du produit artisans. Cet habillage est descendu dans
  // src/app/(artisans)/layout.tsx : il n'atteint plus que les pages de
  // ce groupe, et personne n'a plus besoin de connaître l'adresse.
  /*  nº 354 — LE NU TOTAL SE DÉCIDE AU SERVEUR, et c'est ici que le
      cookie se pose : la mise en page ne reçoit pas les paramètres
      d'adresse, le proxy si. `?variante=nu-total` pose le cookie SUR
      LA REQUÊTE MÊME (le premier rendu est déjà nu) et sur la réponse
      (les suivants aussi) ; tout autre `?variante=` le retire. Sans
      paramètre : rien. */
  const varianteDemandee = request.nextUrl.searchParams.get("variante");
  if (varianteDemandee === "nu-total") {
    request.cookies.set(COOKIE_NU_TOTAL, "1");
  } else if (varianteDemandee !== null) {
    request.cookies.delete(COOKIE_NU_TOTAL);
  }

  /*  nº 357 — L'ACCUEIL NU EST PRÉRENDU ; dès que « / » porte une
      requête (?style=…, ?page=…, ?sonde-…), on SERT LE JUMEAU
      DYNAMIQUE par réécriture : l'adresse du navigateur reste « / »,
      l'état continue de vivre dans l'adresse (règle nº 328), et le
      rendu serveur des recherches (nº 203) est préservé. */
  const versLeJumeau =
    request.nextUrl.pathname === "/" && request.nextUrl.search !== "";
  const fabriquerReponse = () =>
    versLeJumeau
      ? NextResponse.rewrite(
          new URL(
            "/accueil-recherche" + request.nextUrl.search,
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

  //  nº 354 — la moitié durable du cookie du nu total (voir plus haut).
  if (varianteDemandee === "nu-total") {
    reponse.cookies.set(COOKIE_NU_TOTAL, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
  } else if (varianteDemandee !== null) {
    reponse.cookies.delete(COOKIE_NU_TOTAL);
  }

  return reponse;
}

export const config = {
  // Le proxy s'exécute partout SAUF sur les fichiers statiques
  // (images, icônes, service worker…), inutiles à traiter.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
