import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { EcranAuthentification } from "@/components/EcranAuthentification";

/**
 * MON COMPTE — créer un compte, se connecter, se déconnecter
 * ===========================================================
 * Adresse : /devenir-tatoueur
 *
 * La page ne fait qu'assembler : la barre (SANS moteur sur smartphone
 * — on vient ici pour son compte, pas pour chercher) et l'écran
 * d'authentification, qui porte toute la logique.
 *
 * `noindex` : une page de connexion n'a rien à faire dans Google.
 */

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: true },
};

export default function PageCompte() {
  return (
    <>
      <EnTeteTatouage moteurMobile={false} />
      <EcranAuthentification />
    </>
  );
}
