import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * NOTIFICATIONS DE RESEND — REBONDS ET PLAINTES
 * ==============================================
 * Route PUBLIQUE (Resend n'a pas de compte chez nous) mais SIGNÉE :
 * chaque appel porte une signature calculée avec un secret partagé.
 * Sans signature valable, on refuse — sinon n'importe qui pourrait
 * faire passer un prospect en « rebond ».
 *
 * DEUX ÉVÉNEMENTS SEULEMENT NOUS INTÉRESSENT :
 *  - `email.bounced`   → l'adresse n'existe pas / refuse le message.
 *                        Statut « rebond » : ne plus jamais écrire.
 *                        Continuer d'envoyer à une adresse morte est
 *                        le premier signal qui fait classer un
 *                        expéditeur en indésirable.
 *  - `email.complained` → le destinataire a cliqué « courrier
 *                        indésirable ». Statut « ne plus contacter » :
 *                        c'est un refus, plus net encore qu'une
 *                        désinscription.
 *
 * LE RAPPROCHEMENT se fait par `id_resend`, l'identifiant que Resend
 * a renvoyé au moment de l'envoi et que le journal a conservé.
 *
 * À CONFIGURER : dans Resend → Webhooks, ajouter l'adresse
 *   https://roswel.fr/api/webhooks/resend
 * puis recopier le « Signing Secret » (whsec_…) dans la variable
 * d'environnement RESEND_WEBHOOK_SECRET.
 */

export const dynamic = "force-dynamic";

/** Tolérance sur l'horodatage, en secondes (rejeu d'un vieil appel). */
const TOLERANCE_SECONDES = 5 * 60;

/**
 * Vérification de la signature (format Svix, celui de Resend).
 * On signe « identifiant.horodatage.corps » avec le secret, et on
 * compare à durée constante.
 */
function signatureValable(
  corps: string,
  entetes: Headers,
  secret: string
): { ok: true } | { ok: false; raison: string } {
  const id = entetes.get("svix-id");
  const horodatage = entetes.get("svix-timestamp");
  const signatures = entetes.get("svix-signature");
  if (!id || !horodatage || !signatures) {
    return { ok: false, raison: "en-têtes de signature absents" };
  }

  const secondes = Number(horodatage);
  if (!Number.isFinite(secondes)) {
    return { ok: false, raison: "horodatage illisible" };
  }
  const ecart = Math.abs(Date.now() / 1000 - secondes);
  if (ecart > TOLERANCE_SECONDES) {
    return { ok: false, raison: "horodatage trop ancien" };
  }

  // Le secret est fourni sous la forme « whsec_<base64> ».
  const brut = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const cle = Buffer.from(brut, "base64");
  const attendue = createHmac("sha256", cle)
    .update(`${id}.${horodatage}.${corps}`)
    .digest("base64");
  const attendueOctets = Buffer.from(attendue);

  // L'en-tête peut contenir plusieurs signatures séparées par un
  // espace (rotation de secret) : il suffit qu'une seule corresponde.
  for (const morceau of signatures.split(" ")) {
    const valeur = morceau.includes(",") ? morceau.split(",")[1] : morceau;
    const recue = Buffer.from(valeur);
    if (
      recue.length === attendueOctets.length &&
      timingSafeEqual(recue, attendueOctets)
    ) {
      return { ok: true };
    }
  }
  return { ok: false, raison: "signature incorrecte" };
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook resend] REFUSÉ : la variable RESEND_WEBHOOK_SECRET n'est pas configurée."
    );
    return NextResponse.json(
      { ok: false, message: "Webhook désactivé : secret non configuré." },
      { status: 503 }
    );
  }

  // Le corps BRUT, tel qu'il a été signé : le reformater invaliderait
  // la signature.
  const corps = await request.text();
  const controle = signatureValable(corps, request.headers, secret);
  if (!controle.ok) {
    console.warn(`[webhook resend] REFUSÉ : ${controle.raison}.`);
    return NextResponse.json({ ok: false, message: "Accès refusé." }, { status: 401 });
  }

  let evenement: { type?: string; data?: { email_id?: string } };
  try {
    evenement = JSON.parse(corps);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Corps illisible." },
      { status: 400 }
    );
  }

  const type = evenement.type ?? "";
  const idResend = evenement.data?.email_id ?? "";

  // Tous les autres événements (envoyé, ouvert, cliqué…) sont
  // acceptés poliment et ignorés : on ne suit ni les ouvertures ni les
  // clics, et Resend ne doit pas réessayer indéfiniment.
  if (type !== "email.bounced" && type !== "email.complained") {
    return NextResponse.json({ ok: true, message: `Événement ignoré : ${type}.` });
  }
  if (!idResend) {
    return NextResponse.json({ ok: true, message: "Événement sans identifiant." });
  }

  const estPlainte = type === "email.complained";
  const nouveauStatut = estPlainte ? "ne_plus_contacter" : "rebond";
  const nouveauResultat = estPlainte ? "plainte" : "rebond";

  try {
    const supabase = creerClientSupabaseAdmin();

    // ----- Retrouver l'envoi concerné -----
    const { data: envoi, error } = await supabase
      .from("prospection_envois")
      .select("id, prospect_id, email")
      .eq("id_resend", idResend)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!envoi) {
      console.warn(
        `[webhook resend] ${type} : aucun envoi ne porte l'identifiant ${idResend}.`
      );
      return NextResponse.json({
        ok: true,
        message: "Envoi inconnu (message hors prospection).",
      });
    }
    const ligne = envoi as { id: string; prospect_id: string; email: string };

    // ----- Marquer l'envoi -----
    // « plainte » demande la migration supabase/prospection-plainte.sql.
    // Tant qu'elle n'est pas passée, la contrainte refuse la valeur :
    // on le dit dans les journaux, mais SURTOUT on ne bloque pas la
    // mise à jour du prospect, qui est le point important.
    const { error: erreurJournal } = await supabase
      .from("prospection_envois")
      .update({ resultat: nouveauResultat })
      .eq("id", ligne.id);
    if (erreurJournal) {
      console.warn(
        `[webhook resend] journal non mis à jour (${erreurJournal.message}) — ` +
          "passer supabase/prospection-plainte.sql si la valeur « plainte » est refusée."
      );
    }

    // ----- Fermer le dossier du prospect -----
    const misesAJour: Record<string, unknown> = {
      statut: nouveauStatut,
      prochain_envoi_le: null, // il sort de la file d'attente, tout de suite
    };
    if (estPlainte) misesAJour.desinscrit_le = new Date().toISOString();

    const { error: erreurProspect } = await supabase
      .from("artisans_prospects")
      .update(misesAJour)
      .eq("id", ligne.prospect_id);
    if (erreurProspect) throw new Error(erreurProspect.message);

    console.log(
      `[webhook resend] ${type} · ${ligne.email} → statut « ${nouveauStatut} ».`
    );
    return NextResponse.json({ ok: true, message: `Statut « ${nouveauStatut} » posé.` });
  } catch (e) {
    console.error("[webhook resend] erreur :", e);
    // Un 500 fait réessayer Resend plus tard : c'est ce qu'on veut si
    // la base était momentanément injoignable.
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
