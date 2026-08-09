import { NextResponse } from "next/server";
import { METIERS, STATUTS_PROSPECTION } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * MODIFICATION D'UN PROSPECT (admin)
 * ----------------------------------
 * Outil de développement, comme /api/admin/signalements : désactivé
 * sur le site en ligne.
 *
 * QUATRE CHAMPS, PAS UN DE PLUS : e-mail, métiers, statut, notes.
 * Tout le reste — SIREN, raison sociale, adresse, dates, rattachement,
 * compteurs d'envoi — vient de l'annuaire ou du moteur de prospection
 * et ne se corrige PAS depuis le tableau. Un champ inattendu fait
 * échouer la requête, avec son nom dans le message : mieux vaut un
 * refus visible qu'une écriture silencieuse au mauvais endroit.
 *
 * Corps attendu (JSON) :
 *   { "prospectId": "…", "champs": { "email": "a@b.fr" } }
 */

const CHAMPS_AUTORISES = ["email", "metiers", "statut", "notes_admin"] as const;

const SLUGS_METIERS = new Set(METIERS.map((m) => m.slug));
const CLES_STATUT = new Set<string>(STATUTS_PROSPECTION.map((s) => s.cle));

/** Contrôle volontairement simple : le vrai test, c'est l'envoi. */
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longueur maximale des notes libres de l'admin. */
const NOTES_MAX = 2000;

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return erreur("Outil désactivé sur le site en ligne.", 403);
  }

  let corps: { prospectId?: string; champs?: Record<string, unknown> };
  try {
    corps = await request.json();
  } catch {
    return erreur("Requête illisible.");
  }

  const prospectId = (corps.prospectId ?? "").toString().trim();
  const champs = corps.champs ?? {};
  if (!prospectId) return erreur("Prospect manquant.");

  // ----- Liste blanche stricte -----
  const interdits = Object.keys(champs).filter(
    (cle) => !CHAMPS_AUTORISES.includes(cle as (typeof CHAMPS_AUTORISES)[number])
  );
  if (interdits.length > 0) {
    return erreur(
      `Champ(s) non modifiable(s) depuis cette page : ${interdits.join(", ")}. ` +
        `Seuls ${CHAMPS_AUTORISES.join(", ")} sont acceptés.`
    );
  }
  if (Object.keys(champs).length === 0) {
    return erreur("Aucune modification reçue.");
  }

  // ----- Contrôle de chaque valeur -----
  const aEcrire: Record<string, unknown> = {};

  if ("email" in champs) {
    const brut = (champs.email ?? "").toString().trim();
    if (brut === "") {
      aEcrire.email = null;
    } else if (!EMAIL_OK.test(brut) || brut.length > 200) {
      return erreur(
        "Adresse e-mail invalide : il faut une adresse du type nom@domaine.fr."
      );
    } else {
      aEcrire.email = brut;
      // Saisie manuelle : on trace d'où vient l'adresse et quand.
      aEcrire.email_source = "manuel";
      aEcrire.email_verifie_le = new Date().toISOString();
    }
  }

  if ("metiers" in champs) {
    const liste = champs.metiers;
    if (!Array.isArray(liste)) {
      return erreur("Les métiers doivent être une liste.");
    }
    const propres = [...new Set(liste.map((m) => String(m)))];
    const inconnus = propres.filter((m) => !SLUGS_METIERS.has(m));
    if (inconnus.length > 0) {
      return erreur(
        `Métier(s) inconnu(s) : ${inconnus.join(", ")}. ` +
          "Les métiers proposés sont définis dans src/config/roswel.ts."
      );
    }
    aEcrire.metiers = propres;
    // ENREGISTRER LE MÉTIER, C'EST LE CONFIRMER. Le métier arrive
    // déduit de l'activité déclarée à l'INSEE, souvent ambiguë ; dès
    // que l'admin le choisit dans le tableau — même s'il retient la
    // proposition — la ligne est relue. Décidé ici pour que ça ne
    // puisse pas être oublié côté navigateur.
    aEcrire.metier_confirme = true;
  }

  if ("statut" in champs) {
    const statut = (champs.statut ?? "").toString();
    if (!CLES_STATUT.has(statut)) {
      return erreur(`Statut inconnu : « ${statut} ».`);
    }
    aEcrire.statut = statut;
  }

  if ("notes_admin" in champs) {
    const notes = (champs.notes_admin ?? "").toString();
    if (notes.length > NOTES_MAX) {
      return erreur(`Les notes sont limitées à ${NOTES_MAX} caractères.`);
    }
    aEcrire.notes_admin = notes.trim() === "" ? null : notes;
  }

  try {
    const supabase = creerClientSupabaseAdmin();

    // RÈGLE MÉTIER : renseigner l'adresse d'un prospect « e-mail à
    // trouver » le fait passer « non contacté » — le travail qui
    // manquait est fait, il rejoint la file d'attente. Décidé ICI,
    // côté serveur, pour que le navigateur ne puisse pas l'oublier.
    if (aEcrire.email && !("statut" in aEcrire)) {
      const { data: avant } = await supabase
        .from("artisans_prospects")
        .select("statut")
        .eq("id", prospectId)
        .maybeSingle();
      if (avant?.statut === "email_a_trouver") {
        aEcrire.statut = "non_contacte";
      }
    }

    const { data, error } = await supabase
      .from("artisans_prospects")
      .update(aEcrire)
      .eq("id", prospectId)
      .select("id, email, metiers, statut, notes_admin, metier_confirme")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return erreur("Prospect introuvable.", 404);

    return NextResponse.json({
      ok: true,
      message: "Enregistré.",
      // La ligne telle qu'elle est MAINTENANT en base : le tableau s'y
      // recale (utile quand le statut a changé tout seul, ci-dessus).
      ligne: data,
    });
  } catch (e) {
    return erreur(
      `Enregistrement impossible : ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}
