import "server-only";
import { estCourrielAdmin } from "@/lib/admin-yokofolio";

/**
 * LES FICHES DE L'ADMINISTRATEUR — INVISIBLES DU PUBLIC
 * ======================================================
 * L'administrateur de yokofolio crée des fiches pour ESSAYER le site :
 * vérifier un formulaire, une mise en page, un cas limite. Ces fiches
 * ne sont pas de vrais tatoueurs — elles n'ont donc rien à faire dans
 * la mosaïque, dans les résultats de recherche, dans le plan du site,
 * ni dans Google.
 *
 * ⚠️ LA RÈGLE PORTE SUR LE COMPTE, PAS SUR LA FICHE. Il n'y a AUCUNE
 * case « fiche de test » à cocher, et c'est le point important : une
 * case s'oublie, se décoche, se copie d'une fiche à l'autre. Ici,
 * toute fiche créée par un compte de COURRIELS_ADMIN est masquée, du
 * seul fait de son propriétaire — et le jour où l'on retire une
 * adresse de cette liste, ses fiches redeviennent publiques d'un seul
 * geste.
 *
 * ELLE S'APPLIQUE CÔTÉ SERVEUR, DANS LA REQUÊTE : les lectures
 * publiques (`listerTatoueurs`, `lireTatoueur`, le plan du site)
 * ajoutent un `not in (…)` sur `user_id`. Les fiches masquées ne
 * quittent JAMAIS la base — on ne compte pas sur l'affichage pour les
 * cacher, et aucune adresse devinée ne les fait apparaître.
 *
 * LE PROPRIÉTAIRE, LUI, LES VOIT NORMALEMENT : son espace et sa page
 * de fiche passent par `lireFicheProprietaire`, qui lit avec la clé de
 * service et vérifie l'appartenance. Il peut les consulter, les
 * modifier, les supprimer — rien ne change pour lui.
 *
 * POURQUOI PASSER PAR `auth.users` ? Parce que la table `tatoueurs` ne
 * porte pas l'adresse de son propriétaire, seulement son identifiant.
 * On traduit donc UNE FOIS les adresses administratrices en
 * identifiants, et on garde la réponse en mémoire quelques minutes :
 * une lecture d'annuaire par visite serait absurde.
 */

/** Combien de temps la liste des identifiants reste valable. */
const DUREE_MEMOIRE_MS = 5 * 60 * 1000;

let memoire: { identifiants: string[]; expire: number } | null = null;

/**
 * LES IDENTIFIANTS DES COMPTES ADMINISTRATEURS.
 * Jamais bloquant : si l'annuaire est injoignable, on rend la dernière
 * réponse connue, et à défaut une liste vide. Une fiche d'essai
 * brièvement visible est un moindre mal ; un site vide, non.
 */
export async function identifiantsAdmin(): Promise<string[]> {
  if (memoire && memoire.expire > Date.now()) return memoire.identifiants;
  try {
    const { creerClientSupabaseAdmin } = await import("@/lib/supabase/admin");
    const supabase = creerClientSupabaseAdmin();
    // 1000 comptes par page : très au-delà du nombre d'administrateurs
    // possibles, et une seule requête.
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);
    const identifiants = (data?.users ?? [])
      .filter((compte) => estCourrielAdmin(compte.email))
      .map((compte) => compte.id);
    memoire = { identifiants, expire: Date.now() + DUREE_MEMOIRE_MS };
    return identifiants;
  } catch {
    return memoire?.identifiants ?? [];
  }
}
