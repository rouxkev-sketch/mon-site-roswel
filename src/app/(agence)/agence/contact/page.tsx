import type { Metadata } from "next";
import Link from "next/link";
import { CHEMINS_AGENCE, LIBELLE_RENDEZ_VOUS } from "@/config/agence";
import { PageJuridique, ContenuAVenir } from "@/components/agence/PageJuridique";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: true },
};

/** Page volontairement VIDE : le gabarit est prêt, le texte viendra. */
export default function PageContactAgence() {
  return (
    <PageJuridique
      titre="Contact"
      introduction="Pour toute question qui ne relève pas d'une prise de rendez-vous."
    >
      <ContenuAVenir quoi="Cette page portera l'adresse postale, l'adresse e-mail et le téléphone de l'agence." />
      <h2>Adresse</h2>
      <p>À compléter.</p>
      <h2>E-mail</h2>
      <p>À compléter.</p>
      <h2>Téléphone</h2>
      <p>À compléter.</p>
      <p>
        Pour un projet, le plus simple reste de{" "}
        <Link href={CHEMINS_AGENCE.rendezVous} className="text-primaire underline">
          {LIBELLE_RENDEZ_VOUS.toLowerCase()}
        </Link>
        .
      </p>
    </PageJuridique>
  );
}
