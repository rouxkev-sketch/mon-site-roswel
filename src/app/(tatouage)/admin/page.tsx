import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { AdminYokofolio } from "@/components/AdminYokofolio";

/**
 * /ADMIN — L'ADMINISTRATION DE YOKOFOLIO
 * =======================================
 * REPARTIE DE ZÉRO : l'ancien parcours d'administration des artisans
 * (Roswel) est DÉBRANCHÉ — ses fichiers vivent dans
 * src/archives-artisans/admin, plus aucune adresse ne les sert. Cette
 * page-ci est la seule chose que /admin affiche : l'interface
 * yokofolio (fiches à valider, signalements), réservée aux comptes
 * de COURRIELS_ADMIN (src/config/tatouage.ts).
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
      <EnTeteTatouage moteurMobile={false} />
      <AdminYokofolio />
    </>
  );
}
