import type { Metadata } from "next";
import { RENDEZ_VOUS } from "@/config/agence";
import { FormulaireRendezVous } from "@/components/agence/FormulaireRendezVous";

/**
 * LA PAGE DE PRISE DE RENDEZ-VOUS
 * ================================
 * Adresse : /rendez-vous
 *
 * Sobre et large : un titre, une phrase, un formulaire. Rien d'autre
 * à l'écran — c'est la page où l'on remplit, pas où l'on découvre.
 * Le formulaire est borné à ~720 px : au-delà, les champs deviennent
 * si longs qu'on perd l'étiquette de vue en les remplissant.
 *
 * Non indexable : une page de formulaire n'a rien à faire dans les
 * résultats de recherche, c'est la vitrine qui doit sortir.
 */

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description: RENDEZ_VOUS.accroche,
  robots: { index: false, follow: true },
};

export default function PageRendezVous() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 pt-16 sm:pt-24">
      <div className="max-w-[720px]">
        <h1 className="font-bold tracking-[-0.02em] leading-[1.08] text-[clamp(2.1rem,5vw,3.4rem)]">
          {RENDEZ_VOUS.titre}
        </h1>
        <p className="mt-6 max-w-[56ch] text-[17px] sm:text-lg leading-relaxed text-black/60">
          {RENDEZ_VOUS.accroche}
        </p>

        <div className="mt-12">
          <FormulaireRendezVous />
        </div>
      </div>
    </main>
  );
}
