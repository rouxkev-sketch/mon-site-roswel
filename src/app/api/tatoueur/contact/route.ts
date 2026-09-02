import { NextRequest, NextResponse } from "next/server";
import { CONTACT_YOKOFOLIO, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { envoyerEmail } from "@/lib/email";
//  nº 817 — l'habillage des courriels du site, écrit une fois.
import { habillerCourriel } from "@/lib/courriel-habille";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LE CONTACT DE YOKOFOLIO — enregistrement + transmission
 * --------------------------------------------------------
 * Reçoit le formulaire /contact : validation de forme, garde-fou par
 * adresse IP (au plus CONTACT_YOKOFOLIO.maxParIpParJour envois par
 * 24 h — au-delà, la MÊME réponse polie, sans aider le spam), trace
 * en base (`messages_yokofolio`, supabase/yokofolio-contact.sql) puis
 * transmission à l'exploitant par le service e-mail existant
 * (src/lib/email.ts — CONTACT_EMAIL dans .env.local).
 */

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const confirmation = () => NextResponse.json({ ok: true });

export async function POST(requete: NextRequest) {
  const corps = (await requete.json().catch(() => null)) as {
    nom?: string;
    email?: string;
    message?: string;
  } | null;

  const nom = (corps?.nom ?? "").trim().slice(0, 120);
  const email = (corps?.email ?? "").trim().slice(0, 200);
  const message = (corps?.message ?? "")
    .trim()
    .slice(0, CONTACT_YOKOFOLIO.messageMax);

  if (
    nom.length < 2 ||
    !EMAIL_OK.test(email) ||
    message.length < CONTACT_YOKOFOLIO.messageMin
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: `Check your name, your email and your message (at least ${CONTACT_YOKOFOLIO.messageMin} characters).`,
      },
      { status: 400 }
    );
  }

  const ip =
    requete.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;

  try {
    const admin = creerClientSupabaseAdmin();

    // Le garde-fou par IP — seulement si l'adresse est connue.
    if (ip) {
      const depuis24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await admin
        .from("messages_yokofolio")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("cree_le", depuis24h);
      if ((count ?? 0) >= CONTACT_YOKOFOLIO.maxParIpParJour) {
        return confirmation();
      }
    }

    const { error } = await admin.from("messages_yokofolio").insert({
      nom,
      email,
      message,
      ip,
    });
    if (error) {
      console.error("Contact yokofolio not saved:", error.message);
    }
  } catch (e) {
    // Base injoignable ou migration pas passée : la transmission
    // e-mail ci-dessous reste tentée — le message ne se perd pas.
    console.error(
      "Contact yokofolio — database unavailable:",
      e instanceof Error ? e.message : String(e)
    );
  }

  const destinataire = process.env.CONTACT_EMAIL;
  if (destinataire) {
    /*  nº 817 — LE COURRIEL HABILLÉ (lib/courriel-habille) : le même
        contenu qu'avant, dans la charte du site ; le bouton répond à
        l'expéditeur. Le texte nu part à côté, pour les clients qui ne
        lisent pas le HTML. */
    const courriel = habillerCourriel({
      titre: "New message from the contact form",
      paragraphes: [`Name: ${nom}`, `Email: ${email}`, message],
      action: { libelle: `Reply to ${nom}`, url: `mailto:${email}` },
    });
    await envoyerEmail(
      destinataire,
      `[${MARQUE_YOKOFOLIO.nom} · Contact] ${nom}`,
      courriel.texte,
      courriel.html
    );
  } else {
    console.log(
      `\n📨 [CONTACT ${MARQUE_YOKOFOLIO.nom} — set CONTACT_EMAIL in .env.local]\n` +
        `   ${nom} <${email}>\n   ${message.replaceAll("\n", "\n   ")}\n`
    );
  }

  return confirmation();
}
