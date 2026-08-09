import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormulaireArtisan } from "@/components/FormulaireArtisan";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Aperçu du formulaire d'inscription (outil)",
};

/**
 * PAGE OUTIL — APERÇU DU FORMULAIRE D'INSCRIPTION (étape 8a)
 * ----------------------------------------------------------
 * Montre le formulaire sans être connecté (l'envoi de photo et
 * l'enregistrement échoueront ici : c'est normal, c'est un aperçu
 * de design). Développement uniquement :
 * http://localhost:3000/admin/apercu-inscription
 */
export default function PageApercuInscription() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col px-5 py-10 max-w-[730px] w-full mx-auto">
      <div className="mb-6">
        <LogoComplet tailleIcone={30} />
      </div>
      <h1 className="text-xl font-bold mb-1">Aperçu : formulaire artisan</h1>
      <p className="text-encre-douce text-sm mb-6">
        Design seulement — l&apos;envoi ne fonctionne pas sur cette page
        d&apos;aperçu.
      </p>
      <FormulaireArtisan userId="apercu" initial={null} />
    </main>
  );
}
