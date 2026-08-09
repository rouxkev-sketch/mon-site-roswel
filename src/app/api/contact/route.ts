import { NextResponse } from "next/server";
import { CONTACT, SUJETS_CONTACT } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { envoyerEmail } from "@/lib/email";
import { verifierTurnstile } from "@/lib/turnstile";

/**
 * FORMULAIRE DE CONTACT (public)
 * ------------------------------
 * Reçoit un message du formulaire /contact et le transmet par email à
 * l'exploitant (adresse CONTACT_EMAIL, via Resend). Une trace est
 * gardée en base (table messages_contact) — elle sert aussi aux
 * garde-fous anti-spam.
 *
 * Garde-fous CÔTÉ SERVEUR :
 *  - vérification anti-robots Turnstile (si la clé est configurée) ;
 *  - au plus CONTACT.maxParIpParJour envois / IP / 24 h.
 * Un envoi refusé (limite atteinte ou Turnstile échoué) reçoit le
 * MÊME message poli qu'un envoi réussi (pas d'aide au spam).
 */

const CLES_SUJET = new Map(SUJETS_CONTACT.map(({ cle, label }) => [cle, label]));
const confirmation = () =>
  NextResponse.json({ ok: true, message: CONTACT.messageConfirmation });

function adresseIp(request: Request): string | null {
  const transmis = request.headers.get("x-forwarded-for");
  if (transmis) return transmis.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

// Contrôle d'email volontairement simple (le vrai test, c'est la
// réception) : une @ entourée de caractères, un point après.
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let corps: {
    nom?: string;
    email?: string;
    sujet?: string;
    message?: string;
    jetonCaptcha?: string;
  };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Requête illisible." },
      { status: 400 }
    );
  }

  const nom = typeof corps.nom === "string" ? corps.nom.trim() : "";
  const email = typeof corps.email === "string" ? corps.email.trim() : "";
  const sujetCle = typeof corps.sujet === "string" ? corps.sujet : "";
  const message =
    typeof corps.message === "string"
      ? corps.message.trim().slice(0, CONTACT.messageMax)
      : "";

  // Validation de forme
  if (
    !nom ||
    !EMAIL_OK.test(email) ||
    !CLES_SUJET.has(sujetCle) ||
    message.length < CONTACT.messageMin
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Vérifie ton nom, ton email et ton message (20 caractères minimum).",
      },
      { status: 400 }
    );
  }

  const ip = adresseIp(request);

  // Anti-robots : en cas d'échec, réponse identique à un succès.
  const humain = await verifierTurnstile(corps.jetonCaptcha, ip);
  if (!humain) return confirmation();

  try {
    const admin = creerClientSupabaseAdmin();

    // Garde-fou par IP (seulement si l'IP est connue)
    if (ip) {
      const depuis24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await admin
        .from("messages_contact")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("cree_le", depuis24h);
      if ((count ?? 0) >= CONTACT.maxParIpParJour) return confirmation();
    }

    const sujetLabel = CLES_SUJET.get(sujetCle)!;

    const { error } = await admin.from("messages_contact").insert({
      nom,
      email,
      sujet: sujetCle,
      message,
      ip,
    });
    if (error) console.error("Message contact non enregistré :", error.message);

    // Transmission par email à l'exploitant
    const destinataire = process.env.CONTACT_EMAIL;
    if (destinataire) {
      await envoyerEmail(
        destinataire,
        `[Roswel · Contact] ${sujetLabel} — ${nom}`,
        `Nouveau message depuis le formulaire de contact.\n\n` +
          `Nom : ${nom}\nEmail : ${email}\nSujet : ${sujetLabel}\n\n` +
          `Message :\n${message}\n`
      );
    } else {
      console.log(
        `\n📨 [CONTACT — renseigner CONTACT_EMAIL dans .env.local]\n` +
          `   ${sujetLabel} — ${nom} <${email}>\n   ${message.replaceAll("\n", "\n   ")}\n`
      );
    }

    return confirmation();
  } catch (e) {
    console.error(
      "Contact — erreur serveur :",
      e instanceof Error ? e.message : String(e)
    );
    return confirmation();
  }
}
