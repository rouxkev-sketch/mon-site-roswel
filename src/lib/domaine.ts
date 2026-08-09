/**
 * LE DOMAINE D'UN SITE, POUR L'AFFICHAGE
 * =======================================
 * Les fiches montrent le site web comme les meilleures fiches 2026 :
 * le DOMAINE SEUL, sans « https:// » ni « www. » ni chemin —
 * « tattoulyon.fr », rien d'autre. Le lien, lui, garde l'adresse
 * complète.
 */
export function domaineDuSite(adresse: string): string {
  try {
    return new URL(adresse).hostname.replace(/^www\./i, "");
  } catch {
    // Adresse sans protocole (ou malformée) : on la taille à la main.
    return adresse
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
  }
}
