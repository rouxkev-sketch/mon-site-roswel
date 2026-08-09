import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarteArtisan } from "@/components/CarteArtisan";
import { RechercheCompacte } from "@/components/RechercheCompacte";
import type { ArtisanResultat } from "@/lib/recherche-artisans";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Aperçu des cartes (outil)",
};

/**
 * PAGE OUTIL — APERÇU DU DESIGN DES CARTES (étape 5)
 * --------------------------------------------------
 * Affiche des cartes avec des données locales fictives, SANS toucher
 * à la base : pratique pour juger le design de tous les cas de
 * figure d'un coup d'œil. Développement uniquement :
 * http://localhost:3000/admin/apercu-cartes
 */

const base = {
  photo_url: null,
  type_compte: "independant" as "independant" | "societe",
  nom_societe: null as string | null,
  nom_responsable: null as string | null,
  whatsapp: null as string | null,
  cree_le: "2026-09-05T00:00:00Z", // date d'inscription sur Roswel
  horaires: null,
  dispo_urgence: false,
  dispo_nuit: false,
  dispo_weekend: false,
  dispo_feries: false,
  absence_debut: null,
  absence_fin: null,
  distance_km: 3.2,
};

const EXEMPLES: ArtisanResultat[] = [
  {
    ...base,
    id: "apercu-1",
    slug: "apercu-1",
    nom_affiche: "Sophie Bertrand",
    ville_nom: "Lyon 3e Arrondissement", // affiché « Lyon (69003) »
    ville_code_postal: "69003",
    telephone: "06 39 98 02 03",
    telephone_visible: true, // icône téléphone présente
    whatsapp: "06 39 98 02 03",
    siren_verifie: true,
    date_creation_entreprise: "2016-03-01", // → « 10 ans d'ancienneté »
    // Ouverte 24h/24 7j/7 : badge « Joignable 24/24 · 7/7 » (vert), stable à toute heure
    horaires: {
      lundi: "24h24", mardi: "24h24", mercredi: "24h24", jeudi: "24h24",
      vendredi: "24h24", samedi: "24h24", dimanche: "24h24",
    },
    pastille: "top", // onglet « Très recommandé » rose sous la carte
    score_total: 85,
    note_google: 4.9,
    nombre_avis_google: 88,
    abonnes_instagram: 12400,
    publications_instagram: 320,
    metiers: ["electricien"],
  },
  {
    ...base,
    id: "apercu-2",
    slug: "apercu-2",
    nom_affiche: "Moreau Chauffage",
    type_compte: "societe", // photo en carré arrondi
    nom_responsable: "Julien Moreau", // « Dirigée par Julien Moreau »
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    telephone: "06 39 98 01 02",
    telephone_visible: true,
    whatsapp: "06 39 98 01 02",
    siren_verifie: true,
    date_creation_entreprise: "2019-09-01",
    // En période de fermeture : DOUBLE onglet (Recommandé + gris)
    absence_debut: "2026-07-01",
    absence_fin: "2026-08-31",
    pastille: "recommande", // onglet « Recommandé » bleu
    score_total: 69,
    note_google: 4.8,
    nombre_avis_google: 127,
    abonnes_instagram: 1850,
    publications_instagram: 210,
    metiers: ["plombier", "chauffagiste"],
  },
  {
    ...base,
    id: "apercu-3",
    slug: "apercu-3",
    nom_affiche: "Karim Benali",
    ville_nom: "Lyon 7e Arrondissement",
    ville_code_postal: "69007",
    telephone: null, // pas de numéro : icône téléphone absente
    telephone_visible: true,
    whatsapp: "06 39 98 06 07", // WhatsApp seul
    siren_verifie: true,
    date_creation_entreprise: "2026-03-01", // < 1 an → « Créée en 2026 »
    // Ouvert seulement le lundi matin : badge rouge « Joignable
    // lundi à 08h00 » (prochaine reprise) le reste de la semaine
    horaires: {
      lundi: ["08:00-12:00"], mardi: null, mercredi: null, jeudi: null,
      vendredi: null, samedi: null, dimanche: null,
    },
    pastille: "recommande",
    score_total: 40,
    note_google: 5.0,
    nombre_avis_google: 23,
    abonnes_instagram: 430,
    publications_instagram: 34,
    metiers: ["plombier"],
  },
  {
    ...base,
    id: "apercu-4",
    slug: "apercu-4",
    nom_affiche: "Atelier Tout Neuf",
    ville_nom: "Vaulx-en-Velin",
    ville_code_postal: "69120",
    telephone: "06 39 98 05 06",
    telephone_visible: false, // numéro masqué : pas d'icône téléphone
    whatsapp: "06 39 98 05 06",
    siren_verifie: false, // pas de badge SIREN
    date_creation_entreprise: null,
    // Sans badge de niveau + absent : l'onglet gris est SEUL et la
    // bordure de la carte prend le même gris
    absence_debut: "2026-07-01",
    absence_fin: "2026-09-30",
    pastille: null,
    score_total: 0,
    note_google: null, // pas encore d'avis Google → « Avis à venir »
    nombre_avis_google: null,
    abonnes_instagram: null, // pas encore saisis → « Abonnés à venir »
    publications_instagram: null,
    // DOUBLE COMPÉTENCE : « Plombier & Chauffagiste · Saint-Priest » est la
    // ligne la plus longue — celle qui déclenche l'abréviation en « St- »
    // sur les écrans étroits.
    metiers: ["plombier", "chauffagiste"],
  },
  {
    ...base,
    id: "apercu-5",
    slug: "apercu-5",
    nom_affiche: "Léa Fontaine",
    ville_nom: "Bron",
    ville_code_postal: "69500",
    telephone: "06 39 98 07 08",
    telephone_visible: true,
    whatsapp: "06 39 98 07 08",
    siren_verifie: true,
    date_creation_entreprise: "2024-05-01", // → « 2 ans d'ancienneté »
    // Ouverte de minuit à 23 h 59 TOUS les jours : actuellement en
    // créneau à toute heure de test → « Joignable jusqu'à 23h59 »
    // (l'heure de FIN du créneau en cours), stable et vert
    horaires: {
      lundi: ["00:00-23:59"], mardi: ["00:00-23:59"], mercredi: ["00:00-23:59"],
      jeudi: ["00:00-23:59"], vendredi: ["00:00-23:59"], samedi: ["00:00-23:59"],
      dimanche: ["00:00-23:59"],
    },
    pastille: null, // sans badge : liseré gris, aucun onglet
    score_total: 30,
    note_google: 4.2,
    nombre_avis_google: 12,
    abonnes_instagram: 260,
    publications_instagram: 18,
    metiers: ["serrurier"],
  },
];

export default function PageApercuCartes() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />
      <div className="w-full max-w-[460px] mt-8">
        <h1 className="text-xl font-bold">Aperçu des cartes</h1>
        <p className="text-encre-douce text-sm mt-1 mb-4">
          Données fictives locales — onglets Très recommandé et Recommandé,
          ligne « SIREN · X ans d&apos;ancienneté », joignabilité en texte
          coloré à puce ronde, téléphone visible/masqué/absent, et fiche
          toute neuve sans avis.
        </p>

        {/* Le menu de recherche compact de la page de résultats */}
        <div className="mb-5">
          <RechercheCompacte
            metierActuel="plombier"
            villeActuelle={{
              nom: "Mions",
              slug: "mions",
              code_insee: "69283",
              code_postal: "69780",
            }}
            filtres={{ urgence: false, nuit: false, weekend: false, type: "tous" }}
          />
        </div>
        <div className="flex flex-col gap-3">
          {/* Comme sur la page de résultats : la ville RECHERCHÉE
              (« Couvre Mions », cohérente avec le menu ci-dessus) ;
              la dernière carte montre le repli sans recherche
              (« Couvre [ville de l'artisan] »). */}
          {EXEMPLES.map((artisan, rang) => (
            <CarteArtisan
              key={artisan.id}
              artisan={artisan}
              // Ville CHERCHÉE en « Saint- » : c'est la ville affichée sur la
              // carte — permet de VOIR l'abréviation automatique (« St-Priest »)
              // quand la largeur ne suffit pas au nom entier.
              villeRecherchee={rang < EXEMPLES.length - 1 ? "Saint-Priest" : null}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
