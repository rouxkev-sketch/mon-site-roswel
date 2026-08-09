"use client";

import { usePathname } from "next/navigation";
import { habillageClairVisible } from "@/lib/habillage-public";

/**
 * L'HABILLAGE DU SITE PUBLIC — le filet de sécurité côté navigateur
 * -----------------------------------------------------------------
 * L'en-tête blanc, le pied de page et le bandeau cookies vivent dans
 * la mise en page racine : ils s'afficheraient donc sur TOUTES les
 * pages — outils de /admin, yokofolio, site vitrine compris.
 *
 * La décision est prise CÔTÉ SERVEUR par src/app/layout.tsx, à partir
 * de l'adresse : sur les pages qui ont leur propre habillage, rien
 * n'est même rendu. Ce composant-ci relit la MÊME liste
 * (src/lib/habillage-public.ts) côté navigateur, au cas où l'en-tête
 * d'adresse viendrait à manquer : l'habillage resterait masqué.
 *
 * POURQUOI PAS UN src/app/admin/layout.tsx ? Parce qu'une mise en page
 * imbriquée s'AJOUTE à la mise en page racine, elle ne la remplace
 * pas : le fichier serait créé, l'en-tête resterait. Il faut décider à
 * la RACINE, en regardant l'adresse de la page.
 */
export function CadreSitePublic({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  if (!habillageClairVisible(chemin)) return null;
  return <>{children}</>;
}
