import "server-only";
import { estCourrielAdmin } from "@/lib/admin-yokofolio";

/**
 * LES IDENTIFIANTS DES COMPTES ADMINISTRATEURS
 * =============================================
 * ⚠️ CE FICHIER NE MASQUE PLUS RIEN AU PUBLIC (passe nº 178).
 * Il servait à retirer des pages publiques toute fiche appartenant à
 * un compte de COURRIELS_ADMIN — mosaïque, recherche, page de fiche et
 * plan du site. Or le propriétaire du site EST l'administrateur : ses
 * propres fiches, publiées et validées, restaient invisibles, et leur
 * adresse répondait « Cette fiche n'est pas encore en ligne » pendant
 * que la base, elle, les donnait sans difficulté.
 *
 * IL N'Y A PLUS QU'UNE RÈGLE DE VISIBILITÉ, celle de la base
 * (`fiche_en_ligne`, migration nº 60), recopiée une seule fois côté
 * site dans `estEnLigne` (lib/artists) : publiée, pas supprimée, pas
 * hors ligne, pas refusée. Une fiche d'essai se cache comme n'importe
 * quelle autre : en ne la publiant pas.
 *
 * CE QUI RESTE ICI, ET SEULEMENT CELA : la traduction des adresses
 * administratrices en identifiants de comptes, dont les écrans
 * d'administration se servent (démarchage, validation). Aucune page
 * publique ne l'appelle plus.
 *
 * POURQUOI PASSER PAR `auth.users` ? Parce que la table `tatoueurs` ne
 * porte pas l'adresse de son propriétaire, seulement son identifiant.
 * On traduit donc UNE FOIS les adresses administratrices en
 * identifiants, et on garde la réponse en mémoire quelques minutes.
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
