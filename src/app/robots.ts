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
        "/compte",
        "/favoris",
        "/artisan/espace",
        "/auth/",
      ],
    },
    sitemap: `${adresseDuSite()}/sitemap.xml`,
  };
}
