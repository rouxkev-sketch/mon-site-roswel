import type { Metadata } from "next";
import { Suspense } from "react";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { EspaceFiche } from "@/components/EspaceFiche";
//  nº 832 — le bouton « Reactivate my portfolio » d'un courriel de
//  suppression arrive ICI depuis cette passe (lib/reactivation, §1).
import { ReactivationParCourriel } from "@/components/ReactivationParCourriel";

/**
 * LA CRÉATION DE FICHE — réservée aux comptes connectés
 * ======================================================
 * Adresse : /become-an-artist/portfolio
 * Jamais indexée : c'est un espace personnel, pas une page publique.
 * La barre du smartphone n'y montre pas le moteur : on remplit sa
 * fiche, on ne cherche pas.
 */
export const metadata: Metadata = {
  title: "Create my portfolio",
  robots: { index: false, follow: false },
};

export default function PageCreationFiche() {
  return (
    <>
      <EnTeteTatouage />
      {/* Suspense : le formulaire lit l'adresse (useSearchParams —
          ?vue=apercu choisit la vue), et Next demande cette frontière
          pour rendre la page sans bloquer sur ce paramètre.
          L'ENVELOPPE, elle, tient la CLÉ REACT du formulaire : c'est
          elle qui garantit qu'« Ajouter une fiche » ouvre un
          formulaire réellement vierge (voir EspaceFiche). */}
      <Suspense fallback={null}>
        <ReactivationParCourriel />
      </Suspense>
      <Suspense fallback={null}>
        <EspaceFiche />
      </Suspense>
    </>
  );
}
