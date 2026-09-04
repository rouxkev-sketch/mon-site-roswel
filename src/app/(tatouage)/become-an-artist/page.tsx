import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { EcranAuthentification } from "@/components/EcranAuthentification";

/**
 * MON COMPTE — créer un compte, se connecter, se déconnecter
 * ===========================================================
 * Adresse : /become-an-artist
 *
 * La page ne fait qu'assembler : la barre (SANS moteur sur smartphone
 * — on vient ici pour son compte, pas pour chercher) et l'écran
 * d'authentification, qui porte toute la logique.
 *
 * `noindex` : une page de connexion n'a rien à faire dans Google.
 */

export const metadata: Metadata = {
  title: "My account",
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
/**
 * ⚠️ `?mode=` — L'ONGLET DEMANDÉ (passe nº 397). La fenêtre
 * d'invitation (FenetreInvitationCompte) a DEUX boutons, et chacun doit
 * ouvrir SON onglet : « Créer mon compte » la création, « Déjà
 * inscrit ? » la connexion. Sans ce paramètre, l'écran choisissait
 * d'après un drapeau « ce navigateur a déjà connu un compte » — une
 * présomption inacceptable sur un ordinateur partagé.
 * IL EST LU PAR LE SERVEUR, comme `suite`, et passé en propriété : le
 * bon onglet est donc dans le HTML dès la première image, sans bascule
 * visible après l'hydratation.
 * ⚠️ FILTRÉ ICI, ET PAS AILLEURS : seules les deux valeurs connues
 * passent. Tout le reste vaut « rien demandé », et l'écran retrouve
 * exactement son comportement d'avant cette passe.
 */
export default async function PageCompte({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; mode?: string }>;
}) {
  const { suite, mode } = await searchParams;
  const modeDemande =
    mode === "creer" || mode === "connexion" ? mode : undefined;
  return (
    <>
      <EnTeteTatouage />
      <EcranAuthentification suite={suite} modeDemande={modeDemande} />
    </>
  );
}
