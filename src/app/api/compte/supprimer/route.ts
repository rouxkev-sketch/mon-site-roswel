import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * SUPPRESSION DU COMPTE (RGPD, §15) — action définitive
 * -----------------------------------------------------
 * Efface : le compte de connexion, le profil, les conversations et
 * messages (suppression en cascade prévue dès l'étape 2), la fiche
 * artisan éventuelle, et les photos stockées. Fonctionne quel que
 * soit le mode de connexion (email, Google, Apple…).
 */
export async function POST() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Connecte-toi pour supprimer ton compte." },
      { status: 401 }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();

    // 1. Les photos stockées (profil artisan éventuel + messages)
    for (const bucket of ["photos-artisans", "photos-messages"]) {
      try {
        const { data: fichiers } = await admin.storage
          .from(bucket)
          .list(user.id);
        if (fichiers && fichiers.length > 0) {
          await admin.storage
            .from(bucket)
            .remove(fichiers.map((fichier) => `${user.id}/${fichier.name}`));
        }
      } catch {
        // un dossier introuvable n'empêche pas la suppression du compte
      }
    }

    // 2. Le compte lui-même : les tables liées (profil, fiche artisan,
    //    conversations, messages, favoris) suivent en cascade.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Suppression impossible : ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
