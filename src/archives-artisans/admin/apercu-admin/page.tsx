import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarteValidation } from "@/components/CarteValidation";
import { LigneInstagram } from "@/components/LigneInstagram";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Aperçu des écrans admin (outil)",
};

/**
 * PAGE OUTIL — APERÇU DES ÉCRANS ADMIN (étape 8b)
 * -----------------------------------------------
 * Données fictives locales, sans base : montre la carte de
 * validation et la ligne de saisie Instagram. Les boutons ne
 * fonctionnent pas ici (aperçu de design). Développement uniquement :
 * http://localhost:3000/admin/apercu-admin
 */
export default function PageApercuAdmin() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-bold">Aperçu : écrans admin</h1>
          <p className="text-encre-douce text-sm mt-1">
            Données fictives — les boutons sont sans effet ici.
          </p>
        </div>

        <section>
          <h2 className="text-sm font-semibold mb-2">
            Carte de validation d&apos;une fiche
          </h2>
          <CarteValidation
            fiche={{
              id: "apercu",
              nom_affiche: "Amélie Fontaine",
              nom_societe: "Fontaine Peinture Déco",
              photo_url: null,
              bio: "Peintre en bâtiment à Lyon 7e, spécialiste des rénovations d'appartements anciens.",
              ville_nom: "Lyon 7e Arrondissement",
              ville_code_postal: "69007",
              rayon_intervention_km: 25,
              lien_instagram: "https://www.instagram.com/amelie.peinture",
              siren: "123456789",
              metiers: ["peintre"],
              verdictSiren:
                "✔ SIREN 123456789 actif — FONTAINE AMELIE (créée le 2018-04-12) — nom cohérent.",
              sirenVerifie: true,
            }}
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-2">
            Ligne de saisie Instagram
          </h2>
          <LigneInstagram
            artisan={{
              id: "apercu",
              nom_affiche: "Amélie Fontaine",
              lien_instagram: "https://www.instagram.com/amelie.peinture",
              abonnes_instagram: 2300,
              publications_instagram: 180,
              joursDepuisMaj: 45, // → montre l'alerte de fraîcheur
              score_total: 51,
              pastille: "recommande",
              statut_validation: "valide",
            }}
          />
        </section>
      </div>
    </main>
  );
}
