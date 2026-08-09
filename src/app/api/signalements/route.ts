import { NextResponse } from "next/server";
import { MOTIFS_SIGNALEMENT, SIGNALEMENT } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { verifierTurnstile } from "@/lib/turnstile";

/**
 * SIGNALEMENT D'UNE FICHE (public, § modération)
 * ----------------------------------------------
 * Reçoit un signalement depuis la fiche artisan : motifs cochés +
 * commentaire obligatoire. Fonctionne SANS compte ; si le visiteur
 * est connecté, on enregistre son identifiant (utile pour repérer
 * les faux signalements récurrents).
 *
 * Garde-fous (tous CÔTÉ SERVEUR, impossibles à contourner) :
 *  - vérification anti-robots Turnstile (si la clé est configurée) ;
 *  - au plus SIGNALEMENT.maxParIpParJour signalements / IP / 24 h ;
 *  - au plus SIGNALEMENT.maxParIpParArtisanParSemaine / IP / artisan
 *    / 7 jours.
 * Un envoi refusé (limite atteinte ou Turnstile échoué) reçoit le
 * MÊME message poli qu'un envoi réussi : on n'indique jamais la
 * raison exacte (pas d'aide au spam).
 */

const CLES_MOTIFS = new Set(MOTIFS_SIGNALEMENT.map(({ cle }) => cle));
const confirmation = () =>
  NextResponse.json({ ok: true, message: SIGNALEMENT.messageConfirmation });

function adresseIp(request: Request): string | null {
  const transmis = request.headers.get("x-forwarded-for");
  if (transmis) return transmis.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  let corps: {
    artisanId?: string;
    motifs?: unknown;
    commentaire?: unknown;
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

  const artisanId = typeof corps.artisanId === "string" ? corps.artisanId : "";
  const motifs = Array.isArray(corps.motifs)
    ? corps.motifs.filter(
        (m): m is string => typeof m === "string" && CLES_MOTIFS.has(m)
      )
    : [];
  const commentaire =
    typeof corps.commentaire === "string"
      ? corps.commentaire.trim().slice(0, SIGNALEMENT.commentaireMax)
      : "";

  // Validation de forme : UNE raison et un commentaire d'au moins
  // SIGNALEMENT.commentaireMin caractères. Le navigateur applique déjà
  // ces deux règles (bouton d'envoi inactif), mais on ne s'y fie pas :
  // la requête peut arriver de n'importe où.
  if (!artisanId || motifs.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Choisissez une raison." },
      { status: 400 }
    );
  }
  if (commentaire.length < SIGNALEMENT.commentaireMin) {
    return NextResponse.json(
      {
        ok: false,
        message: `Merci d'indiquer plus de détails (${SIGNALEMENT.commentaireMin} caractères minimum).`,
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

    // Garde-fous par IP (seulement si l'IP est connue).
    if (ip) {
      const depuis24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const depuis7j = new Date(
        Date.now() - 7 * 24 * 3600 * 1000
      ).toISOString();

      const { count: nbJour } = await admin
        .from("signalements")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("cree_le", depuis24h);
      if ((nbJour ?? 0) >= SIGNALEMENT.maxParIpParJour) return confirmation();

      const { count: nbArtisan } = await admin
        .from("signalements")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .eq("artisan_id", artisanId)
        .gte("cree_le", depuis7j);
      if ((nbArtisan ?? 0) >= SIGNALEMENT.maxParIpParArtisanParSemaine)
        return confirmation();
    }

    // Visiteur connecté ? (facultatif : accessible sans compte)
    let particulierId: string | null = null;
    try {
      const supabase = await creerClientSupabaseServeur();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      particulierId = user?.id ?? null;
    } catch {
      // hors ligne / non connecté : signalement anonyme
    }

    const { error } = await admin.from("signalements").insert({
      artisan_id: artisanId,
      particulier_id: particulierId,
      motifs,
      commentaire,
      ip,
      statut: "nouveau",
    });
    // Même en cas d'erreur d'écriture, on ne révèle rien de plus
    // qu'une confirmation polie (et on trace côté serveur).
    if (error) console.error("Signalement non enregistré :", error.message);

    return confirmation();
  } catch (e) {
    console.error(
      "Signalement — erreur serveur :",
      e instanceof Error ? e.message : String(e)
    );
    return confirmation();
  }
}
