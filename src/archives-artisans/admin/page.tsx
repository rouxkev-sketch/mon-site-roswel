import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Outils de développement",
};

const OUTILS = [
  {
    lien: "/admin/validation",
    titre: "Validation des fiches",
    description: "Examiner les inscriptions : 3 cases à cocher, messages types",
  },
  {
    lien: "/admin/signalements",
    titre: "Signalements",
    description: "Les fiches signalées par les visiteurs : filtrer et traiter",
  },
  {
    lien: "/admin/prospection",
    titre: "Prospection",
    description:
      "Les artisans collectés depuis Sirene : e-mails, métiers, statuts",
  },
  {
    lien: "/admin/instagram",
    titre: "Saisie Instagram",
    description: "Abonnés + publications, alerte 30 jours, recalcul auto du score",
  },
  {
    lien: "/admin/avis-google",
    titre: "Avis Google",
    description: "Associer les fiches Google et rafraîchir les notes (API Places)",
  },
  {
    lien: "/admin/simulateur-score",
    titre: "Simulateur de score",
    description: "Tester les grilles Instagram/Google et les pastilles en direct",
  },
  {
    lien: "/admin/recalculer-scores",
    titre: "Recalculer les scores",
    description: "Après une modification des grilles ou des seuils dans la config",
  },
  {
    lien: "/admin/artisans-demo",
    titre: "Artisans de démonstration",
    description: "Créer ou supprimer les 9 profils fictifs autour de Lyon",
  },
  {
    lien: "/admin/import-communes",
    titre: "Import des communes",
    description: "Remplir ou rafraîchir la base des communes de France",
  },
  {
    lien: "/admin/apercu-cartes",
    titre: "Aperçu des cartes",
    description: "Le design des cartes de résultats, sans base de données",
  },
  {
    lien: "/admin/apercu-fiche",
    titre: "Aperçu de la fiche",
    description: "Le design de la fiche artisan, sans base de données",
  },
  {
    lien: "/admin/apercu-prospection",
    titre: "Aperçu de la prospection",
    description: "Le tableau de prospection avec 9 artisans fictifs",
  },
  {
    lien: "/api/verif-supabase",
    titre: "Contrôle de la base",
    description: "Vérifier la connexion Supabase et la présence des tables",
  },
];

/**
 * PAGE OUTIL — SOMMAIRE DES OUTILS DE DÉVELOPPEMENT
 * -------------------------------------------------
 * http://localhost:3000/admin (développement uniquement).
 * La vraie interface d'administration (validation des artisans,
 * saisie Instagram) arrive à l'étape 8.
 */
export default function PageOutils() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8">
        <h1 className="text-xl font-bold">Outils de développement</h1>
        <p className="text-encre-douce text-sm mt-1 mb-5">
          Visibles uniquement sur ton ordinateur, jamais sur le site en ligne.
        </p>

        <div className="flex flex-col gap-2.5">
          {OUTILS.map(({ lien, titre, description }) => (
            <Link
              key={lien}
              href={lien}
              className="rounded-2xl border border-bordure p-4 hover:bg-fond-doux transition-colors"
            >
              <p className="font-semibold text-sm">{titre}</p>
              <p className="text-xs text-encre-douce mt-0.5">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
