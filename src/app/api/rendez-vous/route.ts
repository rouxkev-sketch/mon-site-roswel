import { NextResponse } from "next/server";
import { RENDEZ_VOUS } from "@/config/agence";
import { MARQUE } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { envoyerEmail } from "@/lib/email";

/**
 * LA DEMANDE DE RENDEZ-VOUS
 * ==========================
 * Reçoit le formulaire de /rendez-vous, l'écrit dans la table
 * `demandes_rdv` ET prévient par e-mail (service Resend déjà en
 * place — aucun service de formulaire extérieur).
 *
 * DEUX ÉCRITURES, DEUX RISQUES SÉPARÉS. Si l'e-mail part mais que la
 * base est tombée, la demande est perdue ; si la base répond mais que
 * l'e-mail échoue, personne n'est prévenu. On fait donc les deux, et
 * on ne renvoie « ok » que si AU MOINS UNE des deux a réussi — avec,
 * dans les journaux, ce qui a échoué.
 *
 * LA VALIDATION EST REFAITE ICI. Celle du navigateur est là pour le
 * confort ; celle-ci est là pour de bon.
 *
 * Route PUBLIQUE : pas de garde NODE_ENV. C'est la porte d'entrée du
 * site vitrine, elle doit fonctionner en production.
 */

export const dynamic = "force-dynamic";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAILLES = new Set(RENDEZ_VOUS.taillesEntreprise.map((t) => t.valeur));

function refus(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  let corps: Record<string, unknown>;
  try {
    corps = await request.json();
  } catch {
    return refus("Requête illisible.");
  }

  const texte = (cle: string, max = 200) =>
    typeof corps[cle] === "string" ? (corps[cle] as string).trim().slice(0, max) : "";

  const nom = texte("nom");
  const entreprise = texte("entreprise");
  const email = texte("email");
  const telephone = texte("telephone", 40);
  const taille = texte("taille", 20);
  const besoin = texte("besoin", RENDEZ_VOUS.besoinMax);

  // ----- Les mêmes règles que le formulaire, mot pour mot -----
  if (nom.length < 2) return refus("Merci d'indiquer votre nom.");
  if (entreprise.length < 2) {
    return refus("Merci d'indiquer le nom de votre entreprise.");
  }
  if (!EMAIL_OK.test(email)) return refus("Adresse e-mail invalide.");
  if (!TAILLES.has(taille)) {
    return refus("Merci de choisir la taille de votre entreprise.");
  }
  if (besoin.length < RENDEZ_VOUS.besoinMin) {
    return refus(
      `Merci de décrire votre besoin en ${RENDEZ_VOUS.besoinMin} caractères au minimum.`
    );
  }

  const libelleTaille =
    RENDEZ_VOUS.taillesEntreprise.find((t) => t.valeur === taille)?.label ?? taille;

  // ----- 1. La trace en base -----
  let enregistre = false;
  try {
    const admin = creerClientSupabaseAdmin();
    const { error } = await admin.from("demandes_rdv").insert({
      nom,
      entreprise,
      email,
      telephone: telephone || null,
      taille_entreprise: taille,
      besoin,
    });
    if (error) throw new Error(error.message);
    enregistre = true;
  } catch (e) {
    const raison = e instanceof Error ? e.message : String(e);
    console.error(
      `[rendez-vous] DEMANDE NON ENREGISTRÉE (${email}) : ${raison}. ` +
        "Si la table n'existe pas encore, passer supabase/demandes-rdv.sql."
    );
  }

  // ----- 2. La notification -----
  let notifie = false;
  const destinataire = process.env.CONTACT_EMAIL;
  const message =
    `Nouvelle demande de rendez-vous depuis le site.\n\n` +
    `Nom : ${nom}\n` +
    `Entreprise : ${entreprise}\n` +
    `E-mail : ${email}\n` +
    `Téléphone : ${telephone || "non communiqué"}\n` +
    `Taille : ${libelleTaille}\n\n` +
    `Besoin :\n${besoin}\n`;

  if (destinataire) {
    const resultat = await envoyerEmail(
      destinataire,
      `[${MARQUE.nom} · Rendez-vous] ${entreprise} — ${nom}`,
      message
    );
    notifie = resultat !== "echec";
  } else {
    // Sans adresse configurée, la demande est au moins lisible dans le
    // terminal : elle ne disparaît jamais en silence.
    console.log(
      `\n📅 [RENDEZ-VOUS — renseigner CONTACT_EMAIL dans .env.local]\n   ` +
        message.replaceAll("\n", "\n   ")
    );
    notifie = true;
  }

  // Les deux ont échoué : on le dit, plutôt que de laisser croire que
  // la demande est partie.
  if (!enregistre && !notifie) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "La demande n'a pas pu être transmise. Merci de réessayer dans quelques minutes.",
      },
      { status: 500 }
    );
  }

  console.log(
    `[rendez-vous] ${entreprise} — ${nom} <${email}> · ` +
      `base ${enregistre ? "ok" : "ÉCHEC"} · notification ${notifie ? "ok" : "ÉCHEC"}`
  );
  return NextResponse.json({ ok: true, message: RENDEZ_VOUS.confirmationTitre });
}
