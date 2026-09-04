import type { Metadata } from "next";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { LienExpire } from "@/components/LienExpire";

/**
 * LIEN D'E-MAIL PÉRIMÉ — la page où /auth/callback envoie (nº 828)
 * ================================================================
 * Adresse : /link-expired
 *
 * Elle n'assemble rien de plus que l'écran partagé : la même chose
 * s'affiche aussi sur la page du nouveau mot de passe quand on l'ouvre
 * sans session (voir components/LienExpire).
 *
 * `noindex` : elle n'existe que pour un lien mort.
 */

export const metadata: Metadata = {
  title: "Link expired",
  robots: { index: false, follow: true },
};

export default function PageLienExpire() {
  return (
    <>
      <EnTeteTatouage />
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pb-24">
        <LienExpire />
      </main>
    </>
  );
}
