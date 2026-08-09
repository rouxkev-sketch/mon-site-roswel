import type { Metadata } from "next";
import { PageJuridique, ContenuAVenir } from "@/components/agence/PageJuridique";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false, follow: true },
};

/** Page volontairement VIDE : le gabarit est prêt, le texte viendra. */
export default function PageConfidentialite() {
  return (
    <PageJuridique
      titre="Politique de confidentialité"
      introduction="Comment vos données sont collectées, utilisées et conservées."
    >
      <ContenuAVenir quoi="Cette page décrira les données collectées par le formulaire de rendez-vous, leur durée de conservation, leur hébergement et vos droits (RGPD)." />
      <h2>Données collectées</h2>
      <p>À compléter.</p>
      <h2>Finalité et base légale</h2>
      <p>À compléter.</p>
      <h2>Durée de conservation</h2>
      <p>À compléter.</p>
      <h2>Vos droits</h2>
      <p>À compléter.</p>
    </PageJuridique>
  );
}
