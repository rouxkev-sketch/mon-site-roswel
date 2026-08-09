import {
  APPELS_GOOGLE_MAXIMUM_PAR_EXECUTION,
  ECHECS_GOOGLE_CONSECUTIFS_MAXIMUM,
  FRAICHEUR_GOOGLE_JOURS,
} from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";

/**
 * RAFRAÎCHISSEMENT AUTOMATIQUE DES AVIS GOOGLE
 * --------------------------------------------
 * La note et le nombre d'avis Google vieillissent. Les conditions
 * d'utilisation de Google interdisent de les conserver plus de
 * 30 jours ; on les remet à jour à FRAICHEUR_GOOGLE_JOURS (28).
 *
 * Cette bibliothèque est appelée par la tâche planifiée
 * (src/app/api/cron/avis-google/route.ts), qui tourne UNE FOIS PAR
 * JOUR. Chaque exécution ne reprend que les lignes réellement
 * périmées : la charge s'étale toute seule sur le mois, au lieu de
 * concentrer tous les appels le même jour.
 *
 * CHAQUE APPEL EST FACTURÉ. Quatre garde-fous, dans cet ordre :
 *  1. jamais deux fois le même identifiant Google dans une même
 *     exécution (le résultat est réutilisé) ;
 *  2. un appel qui échoue n'est PAS réessayé : la ligne n'est pas
 *     écrite, elle repassera d'elle-même à la prochaine exécution ;
 *  3. au bout de ECHECS_GOOGLE_CONSECUTIFS_MAXIMUM échecs d'affilée,
 *     on arrête tout (clé invalide, quota dépassé, panne Google) ;
 *  4. jamais plus de APPELS_GOOGLE_MAXIMUM_PAR_EXECUTION appels.
 *
 * Le rafraîchissement MANUEL de /admin/avis-google reste disponible
 * pour les cas ponctuels : il n'est pas touché.
 */

/** Les deux seuls champs demandés à Google — voir le commentaire du coût. */
const CHAMPS_GOOGLE = "rating,userRatingCount";

/** L'adresse de l'API Google Places — partagée avec la recherche des
    fiches des prospects (src/lib/google-prospects.ts). */
export const URL_PLACES = "https://places.googleapis.com/v1/places";

/** Une ligne à rafraîchir, quelle que soit sa table d'origine. */
type LigneARafraichir = {
  table: "artisans" | "artisans_prospects";
  id: string;
  nom: string;
  placeId: string;
  dateMaj: string | null;
  // Uniquement pour la table `artisans` : les autres composantes du
  // score de confiance, relues ici pour éviter un aller-retour de
  // plus au moment du recalcul.
  abonnesInstagram?: number | null;
  publicationsInstagram?: number | null;
  dateCreationEntreprise?: string | null;
};

export type ResultatRafraichissement = {
  ok: boolean;
  message: string;
  /** Appels RÉELLEMENT passés à Google (c'est ce qui est facturé). */
  appels: number;
  misesAJour: number;
  echecs: number;
  /** Lignes mises à jour sans appel, grâce au résultat déjà obtenu. */
  reutilisations: number;
  /** Lignes encore périmées après cette exécution (0 = tout est à jour). */
  restantes: number | null;
  interrompu: boolean;
  resume: Array<Record<string, string | number>>;
};

/** La date avant laquelle une donnée Google est considérée périmée. */
function dateLimite(): string {
  return new Date(
    Date.now() - FRAICHEUR_GOOGLE_JOURS * 24 * 3600 * 1000
  ).toISOString();
}

/**
 * Le filtre commun aux deux tables : « jamais rafraîchi » OU
 * « rafraîchi il y a plus de FRAICHEUR_GOOGLE_JOURS ».
 * (La valeur est mise entre guillemets : la date contient des points,
 *  que l'analyseur de filtres de Supabase pourrait mal découper.)
 */
function filtrePerime(limite: string): string {
  return `date_maj_google.is.null,date_maj_google.lt."${limite}"`;
}

type ClientAdmin = ReturnType<typeof creerClientSupabaseAdmin>;

/**
 * Les lignes des DEUX tables qui ont besoin d'être rafraîchies, les
 * plus anciennes d'abord (celles qui n'ont jamais été interrogées
 * passent en tête). Seules les lignes AYANT un identifiant Google
 * sont retenues : sans lui, il n'y a rien à demander.
 */
async function lignesARafraichir(
  supabase: ClientAdmin,
  limite: string,
  combien: number
): Promise<LigneARafraichir[]> {
  const { data: fiches, error: erreurFiches } = await supabase
    .from("artisans")
    .select(
      "id, nom_affiche, place_id_google, date_maj_google, abonnes_instagram, publications_instagram, date_creation_entreprise"
    )
    .not("place_id_google", "is", null)
    .or(filtrePerime(limite))
    .order("date_maj_google", { ascending: true, nullsFirst: true })
    .limit(combien);
  if (erreurFiches) throw new Error(`table artisans : ${erreurFiches.message}`);

  const { data: prospects, error: erreurProspects } = await supabase
    .from("artisans_prospects")
    .select("id, raison_sociale, place_id_google, date_maj_google")
    .not("place_id_google", "is", null)
    .or(filtrePerime(limite))
    .order("date_maj_google", { ascending: true, nullsFirst: true })
    .limit(combien);
  if (erreurProspects) {
    throw new Error(`table artisans_prospects : ${erreurProspects.message}`);
  }

  const toutes: LigneARafraichir[] = [
    ...(fiches ?? []).map((f) => ({
      table: "artisans" as const,
      id: f.id as string,
      nom: (f.nom_affiche as string) ?? "(sans nom)",
      placeId: f.place_id_google as string,
      dateMaj: (f.date_maj_google as string | null) ?? null,
      abonnesInstagram: (f.abonnes_instagram as number | null) ?? null,
      publicationsInstagram: (f.publications_instagram as number | null) ?? null,
      dateCreationEntreprise:
        (f.date_creation_entreprise as string | null) ?? null,
    })),
    ...(prospects ?? []).map((p) => ({
      table: "artisans_prospects" as const,
      id: p.id as string,
      nom: (p.raison_sociale as string) ?? "(sans nom)",
      placeId: p.place_id_google as string,
      dateMaj: (p.date_maj_google as string | null) ?? null,
    })),
  ];

  // Les deux listes sont fusionnées puis reclassées ensemble : sans
  // cela, une table pourrait monopoliser le plafond d'appels.
  toutes.sort((a, b) => {
    if (a.dateMaj === b.dateMaj) return 0;
    if (a.dateMaj === null) return -1; // jamais interrogé : priorité
    if (b.dateMaj === null) return 1;
    return a.dateMaj < b.dateMaj ? -1 : 1;
  });

  return toutes.slice(0, combien);
}

/** Combien de lignes restent périmées (les deux tables réunies). */
async function compterRestantes(
  supabase: ClientAdmin,
  limite: string
): Promise<number | null> {
  try {
    const compter = async (table: "artisans" | "artisans_prospects") => {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .not("place_id_google", "is", null)
        .or(filtrePerime(limite));
      return count ?? 0;
    };
    return (await compter("artisans")) + (await compter("artisans_prospects"));
  } catch {
    return null; // information de confort : jamais bloquante
  }
}

type ReponseGoogle =
  | { etat: "ok"; note: number | null; avis: number }
  | { etat: "echec"; message: string };

/**
 * UN appel à Google Places, pour UNE fiche. On ne demande que la note
 * et le nombre d'avis — jamais le détail des avis (règle du cahier
 * des charges §5, et champs les plus chers de la grille tarifaire).
 */
async function interrogerGoogle(
  placeId: string,
  cle: string
): Promise<ReponseGoogle> {
  try {
    const reponse = await fetch(
      `${URL_PLACES}/${encodeURIComponent(placeId)}`,
      {
        headers: { "X-Goog-Api-Key": cle, "X-Goog-FieldMask": CHAMPS_GOOGLE },
      }
    );
    if (!reponse.ok) {
      return {
        etat: "echec",
        message: `Google a répondu « ${reponse.status} »`,
      };
    }
    const lieu = (await reponse.json()) as {
      rating?: number;
      userRatingCount?: number;
    };
    return {
      etat: "ok",
      note: lieu.rating ?? null,
      avis: lieu.userRatingCount ?? 0,
    };
  } catch (e) {
    return {
      etat: "echec",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Écrit le résultat sur la bonne table.
 * - `artisans` : le score de confiance et la pastille sont RECALCULÉS,
 *   comme le fait déjà l'outil manuel — le score y est une valeur
 *   figée en base, qui sert au classement des résultats.
 * - `artisans_prospects` : rien à recalculer, le score d'un prospect
 *   est calculé à l'affichage (calculerScoreProspect).
 */
async function ecrireResultat(
  supabase: ClientAdmin,
  ligne: LigneARafraichir,
  note: number | null,
  avis: number,
  maintenant: string
): Promise<string> {
  if (ligne.table === "artisans_prospects") {
    const { error } = await supabase
      .from("artisans_prospects")
      .update({
        note_google: note,
        nombre_avis_google: avis,
        date_maj_google: maintenant,
      })
      .eq("id", ligne.id);
    if (error) throw new Error(error.message);
    return `${note ?? "—"} (${avis} avis)`;
  }

  const score = calculerScoreTotal(
    ligne.abonnesInstagram,
    ligne.publicationsInstagram,
    note,
    avis,
    ligne.dateCreationEntreprise
  );
  const pastille = determinerPastille(score);

  const { error } = await supabase
    .from("artisans")
    .update({
      note_google: note,
      nombre_avis_google: avis,
      date_maj_google: maintenant,
      score_total: score,
      pastille,
    })
    .eq("id", ligne.id);
  if (error) throw new Error(error.message);
  return `${note ?? "—"} (${avis} avis) · score ${score}/100`;
}

/**
 * LE RAFRAÎCHISSEMENT COMPLET — appelé par la tâche planifiée.
 * Ne lève jamais d'exception : tout ressort dans le résultat, pour
 * que le journal de l'hébergeur dise exactement ce qui s'est passé.
 */
export async function rafraichirAvisGoogle(): Promise<ResultatRafraichissement> {
  const resume: Array<Record<string, string | number>> = [];
  const vide = {
    appels: 0,
    misesAJour: 0,
    echecs: 0,
    reutilisations: 0,
    restantes: null,
    interrompu: false,
    resume,
  };

  const cle = process.env.GOOGLE_PLACES_API_KEY;
  if (!cle) {
    return {
      ...vide,
      ok: false,
      message:
        "Aucun appel : la clé GOOGLE_PLACES_API_KEY n'est pas renseignée sur l'hébergement.",
    };
  }

  const limite = dateLimite();
  let supabase: ClientAdmin;
  let aTraiter: LigneARafraichir[];
  try {
    supabase = creerClientSupabaseAdmin();
    aTraiter = await lignesARafraichir(
      supabase,
      limite,
      APPELS_GOOGLE_MAXIMUM_PAR_EXECUTION
    );
  } catch (e) {
    return {
      ...vide,
      ok: false,
      message: `Aucun appel : lecture de la base impossible (${
        e instanceof Error ? e.message : String(e)
      }).`,
    };
  }

  if (aTraiter.length === 0) {
    return {
      ...vide,
      ok: true,
      restantes: 0,
      message: `Rien à faire : aucune donnée Google n'a plus de ${FRAICHEUR_GOOGLE_JOURS} jours.`,
    };
  }

  // Le même établissement peut apparaître deux fois (une fiche et son
  // ancienne ligne de prospection, par exemple) : on garde le
  // résultat en mémoire pour n'appeler Google QU'UNE FOIS.
  const dejaDemandes = new Map<string, { note: number | null; avis: number }>();

  let appels = 0;
  let misesAJour = 0;
  let echecs = 0;
  let reutilisations = 0;
  let echecsDAffilee = 0;
  let interrompu = false;

  for (const ligne of aTraiter) {
    const maintenant = new Date().toISOString();
    let valeurs = dejaDemandes.get(ligne.placeId) ?? null;
    // Vrai si l'établissement a DÉJÀ été demandé dans cette exécution :
    // on réutilise alors le résultat, sans repayer un appel.
    const dejaConnu = valeurs !== null;

    if (valeurs === null) {
      const reponse = await interrogerGoogle(ligne.placeId, cle);
      appels += 1;

      if (reponse.etat === "echec") {
        echecs += 1;
        echecsDAffilee += 1;
        // On n'écrit RIEN : la ligne garde sa date et repassera
        // d'elle-même à la prochaine exécution. Pas de réessai ici.
        resume.push({
          table: ligne.table,
          nom: ligne.nom,
          action: "échec",
          detail: reponse.message,
        });
        if (echecsDAffilee >= ECHECS_GOOGLE_CONSECUTIFS_MAXIMUM) {
          interrompu = true;
          break;
        }
        continue;
      }

      echecsDAffilee = 0;
      valeurs = { note: reponse.note, avis: reponse.avis };
      dejaDemandes.set(ligne.placeId, valeurs);
    } else {
      reutilisations += 1;
    }

    try {
      const detail = await ecrireResultat(
        supabase,
        ligne,
        valeurs.note,
        valeurs.avis,
        maintenant
      );
      misesAJour += 1;
      resume.push({
        table: ligne.table,
        nom: ligne.nom,
        action: dejaConnu ? "mise à jour (sans appel)" : "mise à jour",
        detail,
      });
    } catch (e) {
      echecs += 1;
      resume.push({
        table: ligne.table,
        nom: ligne.nom,
        action: "échec",
        detail: `enregistrement impossible : ${
          e instanceof Error ? e.message : String(e)
        }`,
      });
    }
  }

  const restantes = await compterRestantes(supabase, limite);

  const message = interrompu
    ? `Exécution ARRÊTÉE après ${ECHECS_GOOGLE_CONSECUTIFS_MAXIMUM} échecs d'affilée : ` +
      `vérifier la clé Google et le quota du compte. ` +
      `${appels} appel(s) passé(s), ${misesAJour} ligne(s) mise(s) à jour.`
    : `${appels} appel(s) à Google, ${misesAJour} ligne(s) mise(s) à jour` +
      (reutilisations > 0 ? ` (dont ${reutilisations} sans appel)` : "") +
      (echecs > 0 ? `, ${echecs} échec(s)` : "") +
      (restantes != null
        ? restantes > 0
          ? `. Il reste ${restantes} ligne(s) périmée(s) : elles passeront aux prochaines exécutions.`
          : ". Toutes les données Google sont à jour."
        : ".");

  return {
    ok: !interrompu,
    message,
    appels,
    misesAJour,
    echecs,
    reutilisations,
    restantes,
    interrompu,
    resume,
  };
}
