import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { METIERS } from "@/config/roswel";
import { libelleMetiersArtisan, offreDesMetiers } from "@/lib/metiers";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import {
  chargerArtisanComplet,
  communesCouvertesPour,
  compterFavoris,
  type FicheChargee,
} from "@/lib/fiche-artisan";
import {
  rechercherArtisans,
  type ArtisanResultat,
} from "@/lib/recherche-artisans";
import { adresseDuSite } from "@/lib/site";
import { EcranRecherche } from "@/components/EcranRecherche";
import { JsonLd } from "@/components/JsonLd";
import { LogoComplet } from "@/components/Logo";

/**
 * FICHE ARTISAN /artisan/nom (étape 6)
 * ------------------------------------
 * Sous 1024 px : la fiche pleine page, comme toujours. À partir de
 * 1024 px : MODE DOUBLE COLONNES — la liste de la recherche
 * correspondante (métier + ville de l'artisan) à gauche, la fiche
 * ouverte à droite. Adresse, contenu serveur, Schema.org et
 * sitemap inchangés (référencement intact). Fiche inconnue → page
 * introuvable.
 */

type Parametres = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Parametres>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const artisan = await chargerArtisanComplet(slug);
    if (!artisan) return { title: "Artisan" };
    return {
      title: artisan.nom_affiche,
      description:
        artisan.bio ??
        `${artisan.nom_affiche} sur Roswel : avis Google, Instagram et score de confiance.`,
      alternates: { canonical: `/artisan/${slug}` },
    };
  } catch {
    return { title: "Artisan" };
  }
}

export default async function PageArtisan({
  params,
}: {
  params: Promise<Parametres>;
}) {
  const { slug } = await params;

  // OUTIL DE DÉVELOPPEMENT (jamais en production) : les slugs
  // « apercu-… » rendent une fiche fictive SANS base — la carte de
  // /admin/apercu-double y navigue en SPA, ce qui reproduit le vrai
  // parcours du bouton retour pour le test automatique de position.
  if (process.env.NODE_ENV !== "production" && slug.startsWith("apercu-")) {
    const { ARTISANS, COMMUNES_APERCU, ficheDemoDepuisSlug } = await import(
      "@/archives-artisans/admin/apercu-double/donnees"
    );
    const artisanDemo = ficheDemoDepuisSlug(slug);
    if (!artisanDemo) notFound();
    // Le métier suit celui de la fiche de démonstration, comme sur la
    // vraie page : une double compétence affiche donc bien son libellé
    // complet (« Plombier & Chauffagiste ») dans le fil d'Ariane.
    const offreDemo = offreDesMetiers(artisanDemo.metiers);
    const metierDemo = offreDemo?.slug ?? artisanDemo.metiers[0] ?? "electricien";
    const libelleDemo =
      offreDemo?.label ?? libelleMetiersArtisan(artisanDemo.metiers) ?? "Électricien";
    return (
      <main className="flex-1 flex flex-col avec-barre-contact mode-double min-h-0 min-[560px]:bg-fond-page">
        <EcranRecherche
          metier={metierDemo}
          libelleMetier={libelleDemo}
          villeSlug="lyon"
          commune={{ nom: "Lyon", code_insee: "69123", code_postal: "69001" }}
          filtres={{ urgence: false, nuit: false, weekend: false, type: "tous" }}
          filtresActifs={false}
          inaccessible={false}
          artisans={ARTISANS}
          userId={null}
          favoris={[]}
          ficheInitiale={{ artisan: artisanDemo, communesCouvertes: COMMUNES_APERCU }}
          modeMobile="fiche"
        />
      </main>
    );
  }

  let artisan: Awaited<ReturnType<typeof chargerArtisanComplet>> = null;
  let inaccessible = false;
  try {
    artisan = await chargerArtisanComplet(slug);
  } catch {
    inaccessible = true;
  }

  if (inaccessible) {
    return (
      <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
        <header className="mb-6">
          <Link href="/" aria-label="Retour à l'accueil">
            <LogoComplet tailleIcone={30} />
          </Link>
        </header>
        <div className="rounded-3xl border border-bordure bg-fond-doux p-6 text-center">
          <p className="text-encre-douce">
            Impossible de joindre la base pour le moment. Vérifie la
            connexion internet puis recharge la page.
          </p>
        </div>
      </main>
    );
  }

  if (!artisan) notFound();

  // Le visiteur connecté et ses favoris (cœur de la fiche ET cœurs
  // des cartes de la colonne de gauche)
  let userId: string | null = null;
  let favoris: string[] = [];
  try {
    const supabase = await creerClientSupabaseServeur();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data } = await supabase
        .from("favoris")
        .select("artisan_id")
        .eq("particulier_id", user.id);
      favoris = (data ?? []).map((ligne) => ligne.artisan_id);
    }
  } catch {
    // hors ligne : le cœur fonctionne en mode « non connecté »
  }

  // Les communes couvertes par son rayon (accordéon « Zone ») et le
  // nombre de favoris (compteur du cœur, bandeau de la fiche ≥ 1024 px)
  const communesCouvertes = await communesCouvertesPour(artisan);
  const nombreFavoris = await compterFavoris(artisan.id);
  const ficheInitiale: FicheChargee = {
    artisan,
    communesCouvertes,
    nombreFavoris,
  };

  // La recherche « métier + ville de l'artisan » : la liste de la
  // colonne de gauche en mode double colonnes (≥ 1024 px)
  // L'ENTRÉE RÉELLE de l'artisan pilote la liste de gauche du mode
  // double : un « Plombier & Chauffagiste » ouvre la recherche de sa
  // double compétence (et son libellé s'affiche tel quel).
  const offreArtisan = offreDesMetiers(artisan.metiers);
  const metier = offreArtisan?.slug ?? artisan.metiers[0] ?? METIERS[0].slug;
  const libelleMetier = libelleMetiersArtisan(artisan.metiers) || metier;
  let commune: {
    nom: string;
    slug: string;
    code_insee: string;
    code_postal: string;
  } | null = null;
  let artisansListe: ArtisanResultat[] = [];
  try {
    if (artisan.ville_code_insee) {
      const supabase = await creerClientSupabaseServeur();
      const { data } = await supabase
        .from("communes")
        .select("nom, slug, code_insee, codes_postaux")
        .eq("code_insee", artisan.ville_code_insee)
        .maybeSingle();
      if (data) {
        commune = {
          nom: data.nom,
          slug: data.slug,
          code_insee: data.code_insee,
          code_postal: data.codes_postaux?.[0] ?? "",
        };
        artisansListe = await rechercherArtisans(metier, data.code_insee, {
          // La colonne de gauche de la fiche montre TOUS les artisans
          type: "tous",
          urgence: false,
          nuit: false,
          weekend: false,
        });
      }
    }
  } catch {
    // liste indisponible : la colonne de gauche montrera l'état
    // « aucun artisan » — la fiche, elle, reste complète
  }

  // Carte de visite pour les moteurs de recherche (Schema.org).
  // Volontairement sans note agrégée : les avis appartiennent à
  // Google, on y renvoie (règle des moteurs sur les avis tiers).
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: artisan.nom_affiche,
    description: artisan.bio ?? undefined,
    image: artisan.photo_url ?? undefined,
    url: `${adresseDuSite()}/artisan/${slug}`,
    knowsAbout: artisan.metiers,
    telephone:
      artisan.telephone && artisan.telephone_visible
        ? artisan.telephone
        : undefined,
  };

  return (
    // « avec-barre-contact » : sur mobile, le pied de page commun
    // reçoit l'espace de la barre fixe (globals.css) ;
    // « mode-double » : écran partagé à partir de 1024 px
    <main className="flex-1 flex flex-col avec-barre-contact mode-double min-h-0 min-[560px]:bg-fond-page">
      <JsonLd donnees={donneesStructurees} />
      <EcranRecherche
        metier={metier}
        libelleMetier={libelleMetier}
        villeSlug={commune?.slug ?? ""}
        commune={
          commune
            ? {
                nom: commune.nom,
                code_insee: commune.code_insee,
                code_postal: commune.code_postal,
              }
            : null
        }
        filtres={{ urgence: false, nuit: false, weekend: false, type: "tous" }}
        filtresActifs={false}
        inaccessible={false}
        artisans={artisansListe}
        userId={userId}
        favoris={favoris}
        ficheInitiale={ficheInitiale}
        modeMobile="fiche"
      />
    </main>
  );
}
