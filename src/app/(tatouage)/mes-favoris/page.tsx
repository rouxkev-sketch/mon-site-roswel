import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { lireLesFavoris } from "@/lib/favoris-serveur";
import { BarreSelection } from "@/components/BarreSelection";
import { PageFavoris } from "@/components/PageFavoris";
import {
  entreesDesStyles,
  entreesDuFiltre,
  entreesDuProfil,
  sansGroupeSansPrise,
} from "@/lib/filtres-selection";
import { comptesDesFavoris, comptesDesSuivis } from "@/lib/selection-suivis";
import { cleCookieTexte, phototequeDuCookie } from "@/lib/vue-phototheque";
import { SURFACE_SELECTION } from "@/lib/surface-affichage";
import { FournisseurAffichageServi } from "@/components/AffichageMosaique";

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
  //  §1 et §3 (nº 245, refait nº 247-§3) — LES DEUX MENUS DE LA BARRE,
  //  calculés ICI, au plus près des données : les CATÉGORIES et les
  //  styles réellement présents dans les favoris et dans le travail des
  //  suivis. La structure, l'ordre et les libellés viennent du menu
  //  « Explorer » du moteur (`entreesDuFiltre`) ; un menu sans entrée
  //  ne s'affiche pas.
  //  §1 (nº 257) — DEUX MENUS, DEUX FORMES. Les favoris se divisent en
  //  deux portes (une photo aimée est une réalisation OU un flash) ;
  //  les suivis, non — on ne suit pas une photo, on suit une personne :
  //  leur menu ne porte que la liste des styles, familles en
  //  sous-porte, précédée de « Tous les styles ».
  /*  §2 (nº 576) — ET LES SECTIONS QUI NE PEUVENT RIEN TRIER SONT
      ÉCARTÉES, ICI, AU PLUS PRÈS DES DONNÉES : c'est le seul endroit qui
      tient à la fois les entrées et leur table de comptes. La règle vit
      dans `sansGroupeSansPrise` — les deux menus la partagent, elle
      n'est pas écrite deux fois. */
  const comptesFavoris = comptesDesFavoris(photos);
  const entreesFavoris = sansGroupeSansPrise(
    entreesDuFiltre(comptesFavoris),
    comptesFavoris
  );
  /*  §2 (nº 316) — LE MENU DES PORTFOLIOS A DÉSORMAIS DEUX GROUPES :
      « Styles », celui qui existait, et « Profil » — comment le
      portfolio suivi exerce. Les deux listes viennent de LA MÊME table
      de comptes, et se concatènent : c'est tout ce que le menu à deux
      groupes des favoris demande (il en a deux depuis toujours). Un
      « Profil » sans aucune entrée rend une liste vide, il ne reste
      alors qu'un groupe — et la règle de la nº 304 rouvre le menu
      sans flèche, d'elle-même. */
  const comptesSuivis = comptesDesSuivis(suivis);
  const entreesSuivis = sansGroupeSansPrise(
    [...entreesDesStyles(comptesSuivis), ...entreesDuProfil(comptesSuivis)],
    comptesSuivis
  );

  return (
    /*  §2 (nº 257) — LA MISE EN PAGE MÉMORISÉE, LUE ICI ET SERVIE À
        TOUTE LA PAGE : les cartes (nº 255-§4) et l'icône de la barre
        naissent déjà dans le bon état, comme sur l'accueil. Sans ce
        fournisseur, le HTML montrait le texte des cartes et le
        navigateur le retirait après coup — le saut du §2. */
    <FournisseurAffichageServi
      /*  §1 (nº 263) — LE COOKIE DE CETTE SURFACE-CI : « Ma sélection »
          a sa propre mémoire de mise en page, la recherche la sienne
          (page.tsx) — retirer le texte sur l'une ne touche plus
          l'autre. Même mécanisme, deux clés (cleCookieTexte). */
      phototheque={phototequeDuCookie(
        (await cookies()).get(cleCookieTexte(SURFACE_SELECTION))?.value
      )}
    >
      {/* ⚠️ LE BLOC DE RECHERCHE N'A RIEN À FAIRE ICI (nº 245-§1) :
          la barre porte, à sa place et dans SA rangée, les deux menus
          « Mes favoris » et « Mes suivis ». Il reste intact partout
          ailleurs — c'est `BarreSelection` qui le remplace, pas une
          seconde barre. */}
      <BarreSelection
        entreesFavoris={entreesFavoris}
        entreesSuivis={entreesSuivis}
      />
      {/*  §1 (nº 253) — LA PAGE N'A PLUS BESOIN DES ENTRÉES : les deux
           menus sont retournés à la barre, seule à commander.
           La mise en page, elle, vient du fournisseur au-dessus. */}
      <PageFavoris photos={photos} suivis={suivis} />
    </FournisseurAffichageServi>
  );
}
