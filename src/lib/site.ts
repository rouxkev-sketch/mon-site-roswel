/**
 * L'ADRESSE PUBLIQUE DU SITE (une seule source pour tout le
 * référencement)
 * ---------------------------------------------------------------
 * Sert à construire TOUTES les adresses absolues vues par les
 * moteurs de recherche : liens canoniques, plan du site (sitemap),
 * données structurées Schema.org, aperçus de partage.
 *
 * ⚠️ EN PRODUCTION, CETTE VARIABLE N'A PAS DE REPLI — ET C'EST VOULU.
 * Elle en avait un : le domaine d'un AUTRE produit du dossier. Un
 * oubli de réglage sur l'hébergement suffisait donc à envoyer TOUT le
 * référencement de yokofolio (canoniques, plan du site, données
 * structurées, aperçus de partage) vers un domaine étranger — et le
 * seul signal était une ligne dans les journaux du serveur, que
 * personne ne lit.
 *
 * Un repli silencieux sur une MAUVAISE valeur est pire que pas de
 * repli du tout : le site part en ligne, tourne, et se saborde sans
 * rien dire. On préfère donc une PANNE FRANCHE : la construction du
 * site échoue, avec un message qui dit quelle variable manque et à
 * quoi elle sert. Impossible de déployer par mégarde.
 *
 * Ordre de priorité :
 *  1. la variable d'environnement NEXT_PUBLIC_SITE_URL — le réglage
 *     normal, à définir sur l'hébergement (Vercel → Settings →
 *     Environment Variables) ;
 *  2. en PRODUCTION sans elle : ERREUR, la construction s'arrête ;
 *  3. en développement : http://localhost:3000, comme avant.
 */

/** Retire un éventuel « / » final : les adresses sont construites
    en ajoutant « /quelque-chose » derrière. */
function sansSlashFinal(adresse: string): string {
  return adresse.replace(/\/+$/, "");
}

/** Le message d'erreur, écrit une fois — il sert aussi aux tests. */
export const MESSAGE_ADRESSE_MANQUANTE =
  "NEXT_PUBLIC_SITE_URL is missing. This variable holds the site's " +
  "public address (e.g. https://yokofolio.com): it builds the " +
  "canonical links, the sitemap (sitemap.xml), the structured data " +
  "and the share previews. Without it, all SEO would point to a " +
  "wrong address — so the build stops here. Set it on the host " +
  "(Vercel → Settings → Environment Variables), then rebuild.";

export function adresseDuSite(): string {
  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuree) return sansSlashFinal(configuree);

  if (process.env.NODE_ENV === "production") {
    throw new Error(MESSAGE_ADRESSE_MANQUANTE);
  }

  return "http://localhost:3000";
}
