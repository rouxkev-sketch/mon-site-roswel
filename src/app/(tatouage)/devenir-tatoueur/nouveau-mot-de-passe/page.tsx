import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { NouveauMotDePasse } from "@/components/NouveauMotDePasse";

/**
 * NOUVEAU MOT DE PASSE — la page du lien de réinitialisation
 * ===========================================================
 * Adresse : /devenir-tatoueur/nouveau-mot-de-passe
 * (l'e-mail « Mot de passe oublié ? » y mène, via /auth/callback).
 *
 * `noindex` : une page de réinitialisation n'a rien à faire dans
 * Google.
 */

export const metadata: Metadata = {
  title: "New password",
  robots: { index: false, follow: true },
};

export default function PageNouveauMotDePasse() {
  return (
    <>
      <EnTeteTatouage />
      <NouveauMotDePasse />
    </>
  );
}
