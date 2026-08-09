import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { infosConnexionSupabase } from "@/lib/supabase/env";
import { ENTETE_CHEMIN } from "@/lib/habillage-public";

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

  // L'ADRESSE DEMANDÉE, TRANSMISE À LA MISE EN PAGE RACINE.
  // Une mise en page ne connaît pas l'adresse de la page qu'elle
  // enveloppe ; sans cet en-tête, elle ne peut pas décider d'afficher
  // ou non l'habillage clair du produit artisans — et le rendrait donc
  // sur toutes les pages, y compris celles de yokofolio.
  // Voir src/lib/habillage-public.ts.
  const enTetes = new Headers(request.headers);
  enTetes.set(ENTETE_CHEMIN, chemin);
  const requeteEtiquetee = { headers: enTetes };

  let reponse = NextResponse.next({ request: requeteEtiquetee });

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
        reponse = NextResponse.next({ request: requeteEtiquetee });
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
