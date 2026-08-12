import type { LieuTrouve } from "@/lib/geocodage/types";

/**
 * LE FOURNISSEUR DU NAVIGATEUR : NOTRE PROPRE SERVEUR (nº 228-§1)
 * ==================================================================
 * Le champ d'adresse ne sort plus du site. Il demande ses suggestions
 * à `/api/lieux`, sur NOTRE domaine ; c'est la route qui interroge le
 * géocodeur, et qui sert nos villes s'il ne répond pas.
 *
 * POURQUOI CE DÉTOUR — la cause mesurée du §1 : un appel du navigateur
 * vers un domaine tiers (`photon.komoot.io`) est à la merci de tout ce
 * qui se met en travers — bloqueur de contenu, protection anti-pistage,
 * réseau d'entreprise, DNS d'opérateur, panne du service. Le champ
 * acceptait bien la frappe, mais aucune suggestion n'arrivait, et la
 * fonction centrale du site était morte. Une requête vers son propre
 * domaine n'a aucun de ces obstacles.
 *
 * ⚠️ IL JETTE quand la route ne répond pas : c'est ce que
 * `chercherLieux` attend d'un fournisseur pour afficher sa panne
 * (voir lib/geocodage/index.ts). L'annulation par une frappe passe
 * par le `signal`, comme avant.
 */
export async function chercherChezNous(
  saisie: string,
  signal: AbortSignal
): Promise<LieuTrouve[]> {
  const reponse = await fetch(
    `/api/lieux?q=${encodeURIComponent(saisie)}`,
    { signal }
  );
  if (!reponse.ok) throw new Error(`suggestions: ${reponse.status}`);
  const donnees = (await reponse.json()) as { lieux?: LieuTrouve[] };
  return Array.isArray(donnees.lieux) ? donnees.lieux : [];
}
