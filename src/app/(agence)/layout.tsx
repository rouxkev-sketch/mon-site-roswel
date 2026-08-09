import type { Metadata } from "next";
import { HEROS } from "@/config/agence";
import { MARQUE } from "@/config/roswel";
import { BarreAgence } from "@/components/agence/BarreAgence";
import { PiedAgence } from "@/components/agence/PiedAgence";

/**
 * L'HABILLAGE DU SITE VITRINE
 * ============================
 * Fond blanc, barre fixe en haut, pied de page gris clair. Toutes les
 * pages du groupe (vitrine, rendez-vous, pages juridiques) le
 * partagent : la barre ne se recharge donc jamais d'une page à
 * l'autre.
 *
 * « (agence) » entre parenthèses n'apparaît PAS dans les adresses :
 * c'est un groupe de mise en page, pas un dossier d'URL. La vitrine
 * reste « /agence », le rendez-vous « /rendez-vous ».
 *
 * L'en-tête et le pied de page des autres produits du dépôt sont
 * écartés ici par CadreSitePublic (src/components) : ils vivent dans
 * la mise en page racine, qu'une mise en page imbriquée ne peut pas
 * remplacer.
 */

export const metadata: Metadata = {
  title: {
    default: `${MARQUE.nom} — Solutions IA sur mesure`,
    template: `%s · ${MARQUE.nom}`,
  },
  description: HEROS.sousTitre,
};

export default function MiseEnPageAgence({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <BarreAgence />
      <div className="flex-1 flex flex-col">{children}</div>
      <PiedAgence />
    </div>
  );
}
