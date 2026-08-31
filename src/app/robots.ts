import type { MetadataRoute } from "next";
import { adresseDuSite } from "@/lib/email";

/**
 * CONSIGNES AUX MOTEURS DE RECHERCHE (robots.txt)
 * -----------------------------------------------
 * Tout est indexable SAUF les espaces privés et techniques.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        //  ⚠️ TROIS ADRESSES SONT PARTIES D'ICI (passe nº 760) :
        //  « /compte », « /favoris » et « /artisan/espace » étaient les
        //  espaces privés du produit ARTISANS, supprimé à cette passe.
        //  Interdire une adresse qui n'existe plus n'est pas neutre :
        //  c'est une consigne qui ment aux robots, et la prochaine
        //  personne qui lit ce fichier y cherche une page absente.
        "/auth/",
        //  §1 (nº 712) — le tableau de bord des sondes : un outil
        //  d'atelier, pas une page du site.
        "/dev",
      ],
    },
    sitemap: `${adresseDuSite()}/sitemap.xml`,
  };
}
