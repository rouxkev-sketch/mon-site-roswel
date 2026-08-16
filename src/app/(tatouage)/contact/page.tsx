import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { FormulaireContactYokofolio } from "@/components/FormulaireContactYokofolio";

/**
 * CONTACT — /contact
 * ===================
 * La page de contact de yokofolio : un formulaire sobre (nom, e-mail,
 * message), l'enregistrement en base + la transmission e-mail à
 * l'exploitant, et un écran de confirmation. Le lien vit dans le pied
 * de page (src/app/(tatouage)/layout.tsx).
 */

export const metadata: Metadata = {
  title: "Contact",
  description: `Une question, une idée, un problème ? Écris à l'équipe ${MARQUE_YOKOFOLIO.nom}.`,
  alternates: { canonical: `${adresseDuSite()}/contact` },
};

export default function PageContactTatouage() {
  return (
    <>
      <EnTeteTatouage />
      {/*  §1 (nº 319) — LA PAGE PASSE À LA CHARTE : les marges du site
           (px-4 sm:px-6, le rythme des autres pages), et le titre à
           l'échelle des titres du site — 20 px gras, celle des titres
           de page du produit (PageRechercheMobile, la fiche), plus la
           grande typographie propre à cette page. */}
      <main className="flex-1 mx-auto w-full max-w-[560px] px-4 sm:px-6 pt-10 pb-16">
        <h1 className="text-[20px] font-bold text-sombre-texte">
          Écris-nous
        </h1>
        <p className="mt-2 text-[15px] text-sombre-texte-doux leading-relaxed">
          Une question, une idée, un problème&nbsp;? On lit tout, et on
          répond vite.
        </p>
        <FormulaireContactYokofolio />
      </main>
    </>
  );
}
