import type { Metadata } from "next";
import { FormulaireContact } from "@/components/FormulaireContact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question, un signalement, une suggestion ? Contactez l'équipe Roswel.",
  alternates: { canonical: "/artisans/contact" },
};

/**
 * PAGE CONTACT (/contact)
 * -----------------------
 * Le logo et le menu viennent de l'en-tête commune (layout) ; le pied
 * de page commun suit automatiquement. Ici : le titre, l'intro et le
 * formulaire (transmis par email à l'exploitant).
 */
export default function PageContact() {
  return (
    <main className="flex-1 flex flex-col px-5 py-8 max-w-[730px] w-full mx-auto">
      <h1 className="text-2xl font-bold">Contactez-nous</h1>
      <p className="text-encre-douce mt-2 mb-6">
        Une question, un signalement, une suggestion ? Écrivez-nous, nous vous
        répondrons rapidement.
      </p>

      <FormulaireContact />
    </main>
  );
}
