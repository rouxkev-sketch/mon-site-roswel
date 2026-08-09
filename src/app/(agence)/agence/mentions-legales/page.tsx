import type { Metadata } from "next";
import { PageJuridique, ContenuAVenir } from "@/components/agence/PageJuridique";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: true },
};

/** Page volontairement VIDE : le gabarit est prêt, le texte viendra. */
export default function PageMentionsLegales() {
  return (
    <PageJuridique titre="Mentions légales">
      <ContenuAVenir quoi="Cette page indiquera l'éditeur du site, son statut juridique, son numéro d'immatriculation, le directeur de la publication et l'hébergeur." />
      <h2>Éditeur du site</h2>
      <p>À compléter.</p>
      <h2>Directeur de la publication</h2>
      <p>À compléter.</p>
      <h2>Hébergeur</h2>
      <p>À compléter.</p>
      <h2>Propriété intellectuelle</h2>
      <p>À compléter.</p>
    </PageJuridique>
  );
}
