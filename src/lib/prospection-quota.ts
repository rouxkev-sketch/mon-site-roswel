import {
  FENETRE_QUOTA_HEURES,
  PLAFOND_QUOTIDIEN_PAR_SEMAINE,
  SEUIL_PLAINTE_ALERTE,
  SEUIL_PLAINTE_CRITIQUE,
} from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LES INDICATEURS D'ENVOI DE LA PROSPECTION
 * ==========================================
 * Quatre chiffres, et un seul principe : la FENÊTRE GLISSANTE.
 *
 * POURQUOI PAS « AUJOURD'HUI »
 * ----------------------------
 * Un compteur remis à zéro à minuit produit une rafale juste après
 * minuit : le plafond du jour se libère d'un coup, la machine
 * repart, et c'est exactement le comportement qui fait classer un
 * expéditeur en indésirable. On compte donc les envois des
 * DERNIÈRES 24 HEURES, à la seconde près (FENETRE_QUOTA_HEURES) :
 * envoyer 80 messages à 23 h 55 n'ouvre rien à 0 h 05.
 *
 * CE MODULE NE DÉCIDE RIEN, IL COMPTE.
 * Le moteur d'envoi n'existe pas encore ; quand il arrivera, c'est
 * lui qui refusera de dépasser `plafond`. Ces chiffres sont là pour
 * VOIR, et pour qu'ils soient déjà justes le jour où le premier
 * message partira. Aujourd'hui, journal vide = quatre zéros, et
 * c'est normal.
 *
 * Réglages : section 14 de src/config/roswel.ts.
 * Journal : table prospection_envois (supabase/prospection.sql).
 */

export type NiveauPlainte = "aucun_envoi" | "bon" | "alerte" | "critique";

export type IndicateursEnvoi = {
  /** Largeur de la fenêtre glissante, en heures (24). */
  fenetreHeures: number;

  // ----- 1. Taux de plainte -----
  /** Part des destinataires qui ont cliqué « indésirable ». null = aucun envoi. */
  tauxPlainte: number | null;
  plaintes: number;
  seuilAlerte: number;
  seuilCritique: number;
  niveauPlainte: NiveauPlainte;

  // ----- 2. E-mails envoyés sur la fenêtre -----
  envoyes: number;
  plafond: number;
  /** Semaine de montée en charge (1 à 6), comptée depuis le PREMIER envoi. */
  semaine: number;
  /** Vrai une fois la montée en charge terminée (vitesse de croisière). */
  enCroisiere: boolean;

  // ----- 3. Ce qu'il reste -----
  restant: number;

  // ----- 4. Formulaires remplis à la main -----
  formulaires: number;

  /**
   * Le journal n'existe pas encore en base (migration
   * supabase/prospection.sql pas passée) : tout est à zéro, et la
   * page le dit au lieu de laisser croire à un vrai zéro.
   */
  journalManquant: boolean;
};

/** Le nombre de semaines de montée en charge prévues (6). */
export const SEMAINES_MONTEE_EN_CHARGE = PLAFOND_QUOTIDIEN_PAR_SEMAINE.paliers.length;

/**
 * LE PLAFOND DU MOMENT, d'après la semaine de campagne.
 * Semaine 1 → paliers[0], semaine 2 → paliers[1]… puis croisière.
 * `semaine` commence à 1 : semaine 0 n'existe pas.
 */
export function plafondDeLaSemaine(semaine: number): number {
  const index = Math.max(1, Math.floor(semaine)) - 1;
  return (
    PLAFOND_QUOTIDIEN_PAR_SEMAINE.paliers[index] ??
    PLAFOND_QUOTIDIEN_PAR_SEMAINE.croisiere
  );
}

/**
 * La semaine de campagne au moment `maintenant`, comptée depuis le
 * PREMIER envoi — jamais depuis la date du jour. Pas encore d'envoi
 * du tout : on est en semaine 1, le plafond le plus prudent.
 */
export function semaineDeCampagne(
  premierEnvoi: Date | null,
  maintenant: Date = new Date()
): number {
  if (!premierEnvoi) return 1;
  const jours =
    (maintenant.getTime() - premierEnvoi.getTime()) / (24 * 3600 * 1000);
  if (!Number.isFinite(jours) || jours < 0) return 1;
  return Math.floor(jours / 7) + 1;
}

/** Où se situe le taux de plainte par rapport aux deux seuils. */
export function niveauDuTauxDePlainte(taux: number | null): NiveauPlainte {
  if (taux === null) return "aucun_envoi";
  if (taux >= SEUIL_PLAINTE_CRITIQUE) return "critique";
  if (taux >= SEUIL_PLAINTE_ALERTE) return "alerte";
  return "bon";
}

/** Vrai si l'erreur vient d'une table qui n'existe pas encore. */
function tableManquante(message: string, table: string): boolean {
  return message.includes(table);
}

/**
 * LES QUATRE INDICATEURS, lus en base.
 *
 * ⚠️ LES PLAINTES NE SONT PAS ENCORE JOURNALISÉES. La colonne
 * `resultat` de prospection_envois n'accepte aujourd'hui que
 * « envoye », « simule », « echec » et « rebond » : le jour où le
 * moteur d'envoi branchera les notifications de plainte de Resend,
 * il faudra ajouter « plainte » à cette contrainte. D'ici là, la
 * requête ci-dessous compte zéro plainte — ce qui est la vérité, pas
 * une approximation.
 */
export async function lireIndicateursEnvoi(
  maintenant: Date = new Date()
): Promise<IndicateursEnvoi> {
  const depuis = new Date(
    maintenant.getTime() - FENETRE_QUOTA_HEURES * 3600 * 1000
  );

  let envoyes = 0;
  let plaintes = 0;
  let formulaires = 0;
  let premierEnvoi: Date | null = null;
  let journalManquant = false;

  try {
    const supabase = creerClientSupabaseAdmin();

    // ----- Le journal, sur la fenêtre glissante -----
    const { data: recents, error: erreurRecents } = await supabase
      .from("prospection_envois")
      .select("resultat")
      .gte("envoye_le", depuis.toISOString())
      .limit(10000);

    if (erreurRecents) {
      if (tableManquante(erreurRecents.message, "prospection_envois")) {
        journalManquant = true;
      } else {
        throw new Error(erreurRecents.message);
      }
    } else {
      for (const ligne of (recents ?? []) as Array<{ resultat: string }>) {
        // Un « echec » n'est jamais parti : il ne consomme pas le
        // plafond. Un « rebond », si — il a bel et bien été envoyé,
        // c'est la réception qui a échoué.
        if (ligne.resultat === "plainte") {
          plaintes += 1;
          envoyes += 1;
        } else if (ligne.resultat !== "echec") {
          envoyes += 1;
        }
      }
    }

    // ----- Le tout premier envoi de la campagne -----
    if (!journalManquant) {
      const { data: origine } = await supabase
        .from("prospection_envois")
        .select("envoye_le")
        .order("envoye_le", { ascending: true })
        .limit(1)
        .maybeSingle();
      const brut = (origine as { envoye_le?: string } | null)?.envoye_le;
      if (brut) premierEnvoi = new Date(brut);
    }

    // ----- Les contacts pris à la main, HORS QUOTA -----
    // Ils ne passent pas par Resend : ils ne pèsent ni sur la
    // réputation de l'adresse d'expéditeur, ni sur le plafond.
    const { count, error: erreurFormulaires } = await supabase
      .from("artisans_prospects")
      .select("id", { count: "exact", head: true })
      .gte("contact_formulaire_le", depuis.toISOString());
    if (!erreurFormulaires) formulaires = count ?? 0;
  } catch {
    // Base injoignable : on renvoie des zéros plutôt que de casser la
    // page entière. Le bandeau d'erreur de la page dira le reste.
    journalManquant = true;
  }

  const semaine = semaineDeCampagne(premierEnvoi, maintenant);
  const plafond = plafondDeLaSemaine(semaine);
  const tauxPlainte = envoyes > 0 ? plaintes / envoyes : null;

  return {
    fenetreHeures: FENETRE_QUOTA_HEURES,
    tauxPlainte,
    plaintes,
    seuilAlerte: SEUIL_PLAINTE_ALERTE,
    seuilCritique: SEUIL_PLAINTE_CRITIQUE,
    niveauPlainte: niveauDuTauxDePlainte(tauxPlainte),
    envoyes,
    plafond,
    semaine,
    enCroisiere: semaine > SEMAINES_MONTEE_EN_CHARGE,
    restant: Math.max(0, plafond - envoyes),
    formulaires,
    journalManquant,
  };
}
