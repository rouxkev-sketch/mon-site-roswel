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

/**
 * ⚠️ `?suite=` — LE CHEMIN DU RETOUR (passe nº 137). Un visiteur non
 * connecté qui touche un cœur ou « Suivre » est mené ici ; l'adresse
 * qu'il regardait voyage dans ce paramètre, et il y retourne une fois
 * connecté. Il est LU PAR LE SERVEUR et passé en propriété : lire
 * l'adresse depuis le composant client aurait obligé à l'envelopper
 * d'un <Suspense> (exigence de `useSearchParams`) pour rien.
 */
export default async function PageCompte({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  return (
    <>
      <EnTeteTatouage />
      <EcranAuthentification suite={suite} />
    </>
  );
}
