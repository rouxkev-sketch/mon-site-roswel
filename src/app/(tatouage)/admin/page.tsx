import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { AdminYokofolio } from "@/components/AdminYokofolio";

/**
 * /ADMIN — L'ADMINISTRATION DE YOKOFOLIO
 * =======================================
 * REPARTIE DE ZÉRO : l'ancien parcours d'administration des artisans
 * (Roswel) a d'abord été DÉBRANCHÉ, puis SUPPRIMÉ à la passe nº 760 —
 * il n'en reste aucun fichier. Cette page-ci est la seule chose que
 * /admin affiche : l'interface yokofolio (fiches à valider,
 * signalements), réservée aux comptes de COURRIELS_ADMIN
 * (src/config/tatouage.ts).
 *
 * `noindex` : une porte d'administration n'a rien à faire dans Google.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function PageAdmin() {
  return (
    <>
      <EnTeteTatouage />
      <AdminYokofolio />
    </>
  );
}
