import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COULEURS } from "@/config/roswel";
import type { ArtisanComplet } from "@/lib/fiche-artisan";
import { FicheArtisan } from "@/components/FicheArtisan";

export const metadata: Metadata = {
  title: "Aperçu de la fiche (outil)",
};

/**
 * PAGE OUTIL — APERÇU DE LA FICHE ARTISAN (étape 6)
 * -------------------------------------------------
 * Affiche la fiche avec des données locales fictives, sans base de
 * données. Développement uniquement :
 * http://localhost:3000/admin/apercu-fiche
 */

const ARTISAN_FICTIF: ArtisanComplet = {
  id: "apercu",
  slug: "apercu",
  nom_affiche: "Julien Moreau",
  type_compte: "independant",
  nom_societe: "Moreau Plomberie & Chauffage",
  nom_responsable: null,
  siren: "831254672",
  publications_instagram: 210,
  adresse: null,
  ville_nom: "Villeurbanne",
  ville_code_postal: "69100",
  ville_code_insee: "69266",
  latitude: 45.7719,
  longitude: 4.8902,
  rayon_intervention_km: 25,
  communes_exclues: [],
  photo_url: null,
  bio: `Plombier-chauffagiste à Villeurbanne depuis 7 ans, j'interviens en dépannage comme en installation sur Villeurbanne, Lyon et la première couronne est. Devis gratuit, déplacement sous 24 h en semaine.

- Recherche et réparation de fuite
- Remplacement de chauffe-eau et de ballon
- Entretien et dépannage de chaudière gaz
- Rénovation complète de salle de bains

(Profil de démonstration.)`,
  horaires: {
    // Coupure déjeuner en semaine, samedi matin, dimanche fermé
    lundi: ["08:00-12:00", "14:00-19:00"],
    mardi: ["08:00-12:00", "14:00-19:00"],
    mercredi: ["08:00-12:00", "14:00-19:00"],
    jeudi: ["08:00-12:00", "14:00-19:00"],
    vendredi: ["08:00-12:00", "14:00-19:00"],
    samedi: ["09:00-13:00"],
    dimanche: null,
  },
  absence_debut: null,
  absence_fin: null,
  telephone: "06 39 98 01 02",
  telephone_visible: true,
  whatsapp: "06 39 98 01 02",
  siren_verifie: true,
  date_creation_entreprise: "2019-09-01",
  lien_instagram: "https://www.instagram.com/julien.plomberie.demo",
  site_internet: "https://www.moreau-plomberie-demo.fr",
  abonnes_instagram: 1850,
  note_google: 4.8,
  nombre_avis_google: 127,
  place_id_google: null,
  dispo_urgence: true,
  dispo_nuit: false,
  dispo_weekend: true,
  dispo_feries: false,
  pastille: "recommande",
  cree_le: "2026-03-10T00:00:00Z",
  metiers: ["plombier", "chauffagiste"],
};

export default function PageApercuFiche() {
  if (process.env.NODE_ENV === "production") notFound();

  // Contour TOUJOURS gris (aucune couleur de niveau sur la fiche)
  const contour = COULEURS.bordureCarte;

  // On reproduit EXACTEMENT le gabarit de la vraie page fiche
  // (colonne autonome dès 480 px : la fiche défile à l'intérieur, le
  // contour en calque englobe tout jusqu'au bandeau contact).
  return (
    <main className="flex-1 flex flex-col avec-barre-contact mode-double min-h-0 min-[560px]:bg-fond-page">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:h-full lg:w-full lg:mx-auto lg:gap-5 lg:px-4 lg:pt-4 lg:justify-center">
        <div className="block relative min-w-0 min-[480px]:max-lg:flex-1 min-[480px]:max-lg:min-h-0 min-[480px]:max-lg:mx-auto min-[480px]:max-[560px]:w-full min-[480px]:max-[560px]:max-w-[730px] min-[560px]:max-lg:w-[calc(100%-32px)] min-[560px]:max-lg:max-w-[700px] min-[480px]:max-lg:my-4 lg:w-[563px] lg:shrink-0 lg:min-h-0 lg:mb-4">
          <section
            aria-label="Fiche de l'artisan"
            className="min-[480px]:flex min-[480px]:flex-col min-[480px]:h-full min-[480px]:min-h-0 min-[480px]:overflow-y-auto defilement-discret min-[560px]:rounded-2xl min-[480px]:bg-fond min-[560px]:shadow-[0_1px_4px_rgba(16,27,51,0.06)]"
          >
            <FicheArtisan
              artisan={ARTISAN_FICTIF}
              communesCouvertes={{
                noms: [
                  "Villeurbanne", "Lyon", "Vaulx-en-Velin", "Bron", "Caluire-et-Cuire",
                  "Décines-Charpieu", "Rillieux-la-Pape", "Vénissieux", "Meyzieu",
                  "Écully", "Tassin-la-Demi-Lune", "Oullins", "Sainte-Foy-lès-Lyon",
                  "Saint-Priest", "Chassieu", "Mions", "Genas", "Dardilly",
                  "Craponne", "Francheville",
                ],
                autres: 47,
              }}
            />
          </section>
          <div
            aria-hidden
            className="hidden min-[560px]:block absolute inset-0 z-50 rounded-2xl border pointer-events-none"
            style={{ borderColor: contour }}
          />
        </div>
      </div>
    </main>
  );
}
