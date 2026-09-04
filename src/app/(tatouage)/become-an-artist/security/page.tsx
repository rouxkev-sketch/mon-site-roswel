import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { Securite } from "@/components/Securite";

/**
 * LA SÉCURITÉ DU COMPTE — réservée aux comptes connectés
 * =======================================================
 * Adresse : /become-an-artist/security
 * Ouverte depuis le menu « Mon espace », sous « Ma fiche ».
 * Elle s'appelait « Confidentialité » et vivait à
 * /become-an-artist/confidentialite (passe nº 129) : l'ancienne
 * adresse redirige ici, définitivement (voir next.config).
 * Jamais indexée : c'est un espace personnel, pas une page publique.
 * La barre du smartphone n'y montre pas le moteur : on règle son
 * compte, on ne cherche pas.
 */
export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

export default function PageSecurite() {
  return (
    <>
      <EnTeteTatouage />
      <Securite />
    </>
  );
}
