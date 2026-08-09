import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LA DÉSINSCRIPTION D'UN PROSPECT
 * ================================
 * Une seule fonction, appelée depuis deux endroits : le bouton de la
 * page /desinscription/[jeton] et la désinscription « en un clic »
 * des messageries (/api/desinscription/[jeton]).
 *
 * TROIS RÈGLES, ET ELLES NE SE DISCUTENT PAS :
 *  1. le jeton suffit — aucune connexion, aucun mot de passe : on ne
 *     demande pas à quelqu'un qui veut partir de créer un compte ;
 *  2. c'est DÉFINITIF — statut « ne plus contacter » et date de
 *     désinscription. Le moteur d'envoi refuse ce statut, et la case
 *     à cocher du tableau est grisée ;
 *  3. c'est IDEMPOTENT — cliquer deux fois ne change rien et ne
 *     provoque aucune erreur.
 */

export type ResultatDesinscription = {
  ok: boolean;
  /** Le nom de l'entreprise, pour le lui confirmer nommément. */
  entreprise: string | null;
  dejaFait: boolean;
  message: string;
};

/** Un jeton a la forme d'un uuid : on écarte tout le reste sans lire la base. */
function jetonPlausible(jeton: string): boolean {
  return /^[0-9a-f-]{20,64}$/i.test(jeton);
}

export async function desinscrire(
  jeton: string
): Promise<ResultatDesinscription> {
  const propre = (jeton ?? "").trim();
  if (!jetonPlausible(propre)) {
    return {
      ok: false,
      entreprise: null,
      dejaFait: false,
      message: "Ce lien de désinscription n'est pas valable.",
    };
  }

  try {
    const supabase = creerClientSupabaseAdmin();

    const { data, error } = await supabase
      .from("artisans_prospects")
      .select("id, raison_sociale, nom_commercial, desinscrit_le")
      .eq("jeton_desinscription", propre)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        ok: false,
        entreprise: null,
        dejaFait: false,
        message: "Ce lien de désinscription n'est pas valable.",
      };
    }

    const prospect = data as {
      id: string;
      raison_sociale: string;
      nom_commercial: string | null;
      desinscrit_le: string | null;
    };
    const entreprise = prospect.nom_commercial ?? prospect.raison_sociale;

    if (prospect.desinscrit_le) {
      return {
        ok: true,
        entreprise,
        dejaFait: true,
        message: "Vous étiez déjà désinscrit : aucun message ne vous sera envoyé.",
      };
    }

    const { error: erreurMaj } = await supabase
      .from("artisans_prospects")
      .update({
        desinscrit_le: new Date().toISOString(),
        statut: "ne_plus_contacter",
        // Il sort de la file d'attente immédiatement : un message
        // déjà programmé ne doit pas partir malgré la désinscription.
        prochain_envoi_le: null,
      })
      .eq("id", prospect.id);
    if (erreurMaj) throw new Error(erreurMaj.message);

    console.log(`[désinscription] ${entreprise} — plus aucun message ne partira.`);
    return {
      ok: true,
      entreprise,
      dejaFait: false,
      message: "C'est fait : vous ne recevrez plus aucun message de Roswel.",
    };
  } catch (e) {
    console.error("[désinscription] erreur :", e);
    return {
      ok: false,
      entreprise: null,
      dejaFait: false,
      message:
        "La désinscription n'a pas pu être enregistrée. Réessayer dans un instant, " +
        "ou répondre simplement à l'e-mail : elle sera faite à la main.",
    };
  }
}

/** L'entreprise correspondant à un jeton (pour l'afficher avant le clic). */
export async function entrepriseDuJeton(
  jeton: string
): Promise<{ entreprise: string | null; dejaFait: boolean }> {
  const propre = (jeton ?? "").trim();
  if (!jetonPlausible(propre)) return { entreprise: null, dejaFait: false };
  try {
    const supabase = creerClientSupabaseAdmin();
    const { data } = await supabase
      .from("artisans_prospects")
      .select("raison_sociale, nom_commercial, desinscrit_le")
      .eq("jeton_desinscription", propre)
      .maybeSingle();
    if (!data) return { entreprise: null, dejaFait: false };
    const prospect = data as {
      raison_sociale: string;
      nom_commercial: string | null;
      desinscrit_le: string | null;
    };
    return {
      entreprise: prospect.nom_commercial ?? prospect.raison_sociale,
      dejaFait: Boolean(prospect.desinscrit_le),
    };
  } catch {
    return { entreprise: null, dejaFait: false };
  }
}
