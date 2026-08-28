import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
//  §1 (nº 692) — le ménage du stockage, écrit une seule fois pour les
//  quatre chemins qui en ont besoin (voir lib/photos-stockage).
import {
  BUCKET_PHOTOS,
  direLeMenage,
  effacerDesFichiers,
  listerToutLeDossier,
} from "@/lib/photos-stockage";

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

    /*  1. LES PHOTOS STOCKÉES.
        ██ §1 (nº 692) — LE SEAU DE YOKOFOLIO Y ENTRE, ET IL MANQUAIT ██
        ------------------------------------------------------------------
        CE QUE L'AUDIT nº 691 A TROUVÉ (R3) : cette route nettoyait
        `photos-artisans` et `photos-messages`, jamais
        `photos-tatoueurs`. Or LES COMPTES SONT PARTAGÉS entre les deux
        produits — un tatoueur qui supprime son compte depuis cet
        écran-ci laissait TOUT son portfolio dans un seau public, pour
        toujours.
        ⚠️ C'EST LE SEUL CHANGEMENT APPORTÉ À CE CHEMIN, et il est
        volontairement minuscule : un nom de seau de plus dans une liste
        qui en comptait deux. Rien du produit artisans ne bouge — ni ce
        qu'il efface, ni l'ordre, ni les messages.
        ⚠️ ET LA PAGINATION VIENT AVEC (R4) : `list()` était appelé sans
        options, le client Supabase plafonne à cent, et un compte à plus
        de cent fichiers en gardait la queue. `listerToutLeDossier`
        pagine et descend dans les sous-dossiers ; `effacerDesFichiers`
        efface par lots sans jamais lever. Les deux vivent dans
        lib/photos-stockage, avec les trois autres chemins. */
    for (const bucket of [
      "photos-artisans",
      "photos-messages",
      BUCKET_PHOTOS,
    ]) {
      const menage = await effacerDesFichiers(
        admin,
        await listerToutLeDossier(admin, user.id, bucket),
        bucket
      );
      if (menage.echecs.length > 0) {
        console.warn(`[compte supprimé] ${bucket} — ${direLeMenage(menage)}`);
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
