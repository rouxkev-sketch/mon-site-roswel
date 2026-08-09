import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonRecalculScores } from "@/components/BoutonRecalculScores";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Recalculer les scores (outil)",
};

/**
 * PAGE OUTIL — RECALCUL DES SCORES (étape 7)
 * ------------------------------------------
 * Développement uniquement :
 * http://localhost:3000/admin/recalculer-scores
 */
export default function PageRecalculScores() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Recalculer tous les scores</h1>
          <p className="text-encre-douce text-sm mt-2">
            Les scores sont enregistrés dans la base. Après une
            modification des <strong>grilles</strong> ou des{" "}
            <strong>seuils de pastilles</strong> dans{" "}
            <code className="text-xs">src/config/roswel.ts</code>, ce
            bouton recalcule tous les artisans avec les valeurs
            actuelles et liste ce qui a changé.
          </p>
        </div>

        <BoutonRecalculScores />

        <p className="text-xs text-encre-douce">
          Astuce : pour voir l&apos;effet d&apos;un réglage avant de
          recalculer, utiliser le{" "}
          <Link href="/admin/simulateur-score" className="text-primaire underline">
            simulateur de score
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
