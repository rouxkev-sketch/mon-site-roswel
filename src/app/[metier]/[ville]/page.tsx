import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { offreDepuisSlug, estDoubleCompetence } from "@/lib/metiers";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import {
  rechercherArtisans,
  type TypeArtisan,
  type ArtisanResultat,
} from "@/lib/recherche-artisans";
import { chargerFicheComplete, type FicheChargee } from "@/lib/fiche-artisan";
import { EcranRecherche } from "@/components/EcranRecherche";
import { JsonLd } from "@/components/JsonLd";
import { adresseDuSite } from "@/lib/site";
import { nomVilleCourt } from "@/lib/villes";

/**
 * PAGE DE RÉSULTATS /metier/ville
 * -------------------------------
 * Sous 1024 px : liste pleine page (menu compact, cartes par pages
 * de 10). À partir de 1024 px : MODE DOUBLE COLONNES — liste à
 * gauche, fiche du premier artisan à droite dès l'arrivée (l'écran
 * partagé est rendu par EcranRecherche).
 *
 * Règles « à la demande » : métier inconnu ou ville absente → page
 * introuvable ; page sans résultat → noindex (jamais de page vide
 * dans Google), mais affichable pour la personne qui cherche.
 */

type Parametres = { metier: string; ville: string };

const chargerResultats = cache(
  async (
    metier: string,
    villeSlug: string,
    urgence: boolean,
    nuit: boolean,
    weekend: boolean,
    type: TypeArtisan
  ): Promise<{
    commune: { code_insee: string; nom: string; codes_postaux: string[] } | null;
    artisans: ArtisanResultat[];
    inaccessible: boolean;
  }> => {
    try {
      const supabase = await creerClientSupabaseServeur();
      const { data: commune, error } = await supabase
        .from("communes")
        .select("code_insee, nom, codes_postaux")
        .eq("slug", villeSlug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!commune) return { commune: null, artisans: [], inaccessible: false };

      const artisans = await rechercherArtisans(metier, commune.code_insee, {
        urgence,
        nuit,
        weekend,
        type,
      });
      return { commune, artisans, inaccessible: false };
    } catch {
      return { commune: null, artisans: [], inaccessible: true };
    }
  }
);

function lireFiltres(parametres: Record<string, string | string[] | undefined>) {
  // « type » n'accepte que trois valeurs : tout le reste retombe sur
  // « tous », y compris une adresse bricolée à la main.
  const type: TypeArtisan =
    parametres.type === "independant" || parametres.type === "societe"
      ? parametres.type
      : "tous";
  return {
    urgence: parametres.urgence === "1",
    nuit: parametres.nuit === "1",
    weekend: parametres.weekend === "1",
    type,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Parametres>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { metier, ville } = await params;
  const filtres = lireFiltres(await searchParams);
  const infosMetier = offreDepuisSlug(metier);
  if (!infosMetier) return { title: "Recherche" };

  const { commune, artisans } = await chargerResultats(
    metier,
    ville,
    filtres.urgence,
    filtres.nuit,
    filtres.weekend,
    filtres.type
  );

  return {
    // « de confiance » dans le titre SEO (le gabarit ajoute « · Roswel »)
    title: commune
      ? `${infosMetier.label} de confiance à ${nomVilleCourt(commune.nom)}`
      : `${infosMetier.label} de confiance`,
    // Meta description (invisible, mais affichée sous le titre bleu dans
    // Google) : ~150 caractères, générée selon le métier et la ville.
    description: commune
      ? `Trouvez un ${infosMetier.label.toLowerCase()} de confiance à ${nomVilleCourt(commune.nom)}. ` +
        "Score sur 100 basé sur les avis Google, Instagram et l'ancienneté vérifiée. Sans publicité."
      : undefined,
    alternates: { canonical: `/${metier}/${ville}` },
    // Page vide, ou vue « double compétence » (sous-ensemble des pages
    // métier simple, absente du plan du site) : jamais indexée — MAIS
    // les liens qu'elle contient restent SUIVIS (follow), pour ne pas
    // couper le maillage interne vers les fiches artisans.
    robots:
      artisans.length === 0 || estDoubleCompetence(metier)
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function PageResultats({
  params,
  searchParams,
}: {
  params: Promise<Parametres>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { metier, ville } = await params;
  const filtres = lireFiltres(await searchParams);

  const infosMetier = offreDepuisSlug(metier);
  if (!infosMetier) notFound();

  const { commune, artisans, inaccessible } = await chargerResultats(
    metier,
    ville,
    filtres.urgence,
    filtres.nuit,
    filtres.weekend,
    filtres.type
  );
  if (!inaccessible && !commune) notFound();

  // Le visiteur connecté et ses favoris (pour les cœurs des cartes)
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
    // hors ligne : les cœurs fonctionnent en mode « non connecté »
  }

  // Un filtre actif au moins ? (sert au message « aucun résultat » ;
  // les filtres eux-mêmes restent visibles dans la barre de recherche)
  const filtresActifs =
    filtres.urgence || filtres.nuit || filtres.weekend || filtres.type !== "tous";

  // Mode double colonnes (≥ 1024 px) : la fiche du PREMIER artisan
  // s'affiche à droite dès l'arrivée — préparée ici, côté serveur
  // (jamais de zone vide, pas d'appel réseau au premier rendu)
  let ficheInitiale: FicheChargee | null = null;
  if (artisans[0]?.slug) {
    try {
      ficheInitiale = await chargerFicheComplete(artisans[0].slug);
    } catch {
      // la colonne de droite se rabattra sur un chargement au clic
    }
  }

  // Adresse absolue du site (jamais localhost en ligne — voir lib/site.ts)
  const base = adresseDuSite();
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: commune
      ? `${infosMetier.label} à ${nomVilleCourt(commune.nom)}`
      : infosMetier.label,
    itemListElement: artisans.map((artisan, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: artisan.nom_affiche,
      url: `${base}/artisan/${artisan.slug ?? artisan.id}`,
    })),
  };

  // Fil d'Ariane (BreadcrumbList) : INVISIBLE pour le visiteur, mais
  // Google peut afficher un fil d'Ariane discret dans ses résultats.
  // Généré dynamiquement selon le métier et la ville de la page.
  // IMPORTANT — chaque niveau doit pointer vers une page qui EXISTE
  // vraiment : le niveau intermédiaire « métier seul » (/plombier/) a
  // été RETIRÉ car cette page n'existe pas (elle renvoyait une 404 aux
  // moteurs). Ne le remettre que le jour où ces pages seront créées.
  const filAriane = commune
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${base}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: `${infosMetier.label} à ${nomVilleCourt(commune.nom)}`,
            item: `${base}/${metier}/${ville}/`,
          },
        ],
      }
    : null;

  return (
    // « recherche-fixe » : à TOUTES les tailles, le haut de page
    // (moteur + filtres) reste statique et seule la liste défile ;
    // à partir de 1024 px la page devient un écran à deux colonnes
    // (voir globals.css — le pied de page du layout est masqué, il
    // vit dans la zone défilante)
    <main className="flex-1 flex flex-col recherche-fixe min-h-0 min-[560px]:bg-fond-page">
      {artisans.length > 0 && <JsonLd donnees={donneesStructurees} />}
      {filAriane && <JsonLd donnees={filAriane} />}
      <EcranRecherche
        metier={metier}
        libelleMetier={infosMetier.label}
        villeSlug={ville}
        commune={
          commune
            ? {
                nom: commune.nom,
                code_insee: commune.code_insee,
                code_postal: commune.codes_postaux[0] ?? "",
              }
            : null
        }
        filtres={filtres}
        filtresActifs={filtresActifs}
        inaccessible={inaccessible}
        artisans={artisans}
        userId={userId}
        favoris={favoris}
        ficheInitiale={ficheInitiale}
        modeMobile="liste"
      />
    </main>
  );
}
