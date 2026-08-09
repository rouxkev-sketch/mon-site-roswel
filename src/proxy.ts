import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { infosConnexionSupabase } from "@/lib/supabase/env";

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
  let reponse = NextResponse.next({ request });

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
        reponse = NextResponse.next({ request });
        cookiesAPoser.forEach(({ name, value, options }) =>
          reponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Cette lecture déclenche le renouvellement de la session si besoin.
  // Ne pas ajouter de code entre la création du client et cette ligne.
  await supabase.auth.getClaims();

  return reponse;
}

export const config = {
  // Le proxy s'exécute partout SAUF sur les fichiers statiques
  // (images, icônes, service worker…), inutiles à traiter.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
