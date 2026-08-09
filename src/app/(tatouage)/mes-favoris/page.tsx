import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { lireLesFavoris } from "@/lib/favoris-serveur";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { PageFavoris } from "@/components/PageFavoris";

/**
 * MES FAVORIS — la page du compte (passe nº 137)
 * ===============================================
 * Adresse : /mes-favoris
 *
 * ⚠️ POURQUOI PAS « /favoris » ? Parce que cette adresse appartient
 * DÉJÀ à l'autre produit du dépôt (les artisans, src/app/favoris) :
 * deux pages ne peuvent pas répondre à la même adresse. « /mes-favoris »
 * dit d'ailleurs mieux ce que c'est, et parle comme le reste du site.
 *
 * ELLE EST RENDUE PAR LE SERVEUR, avec ses images : la personne arrive
 * sur ses photos, pas sur un écran d'attente. Les cœurs, eux, sont
 * déjà allumés — ce sont ses propres favoris.
 *
 * PAS DE SESSION ? On mène à la connexion en emportant le chemin de
 * retour : après connexion, on revient ICI. C'est la même promesse que
 * celle du cœur (voir `versLaConnexion`).
 *
 * ⚠️ JAMAIS INDEXÉE ni mise en cache : c'est une page personnelle.
 */
export const metadata: Metadata = {
  //  ⚠️ « MA SÉLECTION » (nº 145-§3) — le titre d'onglet suit le titre
  //  de la page. L'ADRESSE, elle, ne change pas : /mes-favoris reste
  //  /mes-favoris, pour ne casser aucun lien déjà partagé ni aucune
  //  redirection après connexion.
  title: "Ma sélection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PageMesFavoris() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/devenir-tatoueur?suite=${encodeURIComponent("/mes-favoris")}`);
  }

  const { photos, suivis } = await lireLesFavoris(user.id);

  return (
    <>
      {/* La barre fixe SANS moteur sur smartphone : cette page n'est
          pas une page de recherche. Le web garde le moteur — il ramène
          à l'accueil avec les critères choisis. */}
      <EnTeteTatouage moteurMobile={false} />
      <PageFavoris photos={photos} suivis={suivis} />
    </>
  );
}
