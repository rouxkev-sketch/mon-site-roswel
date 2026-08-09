import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * LE COMPTAGE DES CLICS VERS LES FICHES — côté serveur, protégé
 * ==============================================================
 * Chaque clic « carte → fiche » arrive ici (une balise envoyée par la
 * carte, sans attendre de réponse). Trois protections AVANT d'écrire :
 *
 *  1. LES ROBOTS IDENTIFIABLES sont écartés : signature d'automate
 *     dans le navigateur annoncé (bot, crawler, headless…) ou aucun
 *     navigateur annoncé du tout ;
 *  2. LES RAFALES ANORMALES sont ignorées : au-delà de quelques clics
 *     par minute pour un même visiteur, on jette (meilleur effort, en
 *     mémoire du serveur — la vraie garantie est le dédoublonnage) ;
 *  3. LE DÉDOUBLONNAGE PAR VISITEUR SUR 24 H vit en base : l'empreinte
 *     ANONYME du visiteur (condensat IP + navigateur + sel — jamais
 *     l'adresse en clair) est unique par fiche et par jour, et
 *     l'insertion IGNORE les doublons.
 *
 * La réponse est TOUJOURS « ok » : une balise n'attend rien, et un
 * échec de comptage ne doit jamais gêner la navigation. Tant que la
 * migration supabase/yokofolio-popularite.sql n'est pas passée, la
 * route répond « ok » sans rien enregistrer.
 */

/** Une signature d'automate dans l'en-tête User-Agent. */
const SIGNATURE_ROBOT =
  /bot|crawl|spider|slurp|preview|fetch|monitor|scrape|curl|wget|python|httpx|headless|lighthouse|pagespeed/i;

/** Plafond de clics par visiteur et par minute — au-delà, c'est une
    rafale, pas une navigation. */
const PLAFOND_PAR_MINUTE = 8;

/** Les compteurs de rafale, en mémoire (meilleur effort). */
const rafales = new Map<string, { fenetre: number; nombre: number }>();

/** Vrai si ce visiteur dépasse le plafond sur la minute en cours. */
function enRafale(visiteur: string): boolean {
  const minute = Math.floor(Date.now() / 60_000);
  const compteur = rafales.get(visiteur);
  if (!compteur || compteur.fenetre !== minute) {
    // Nouvelle minute : on repart — et on profite du passage pour
    // purger les vieilles entrées (la carte ne grossit jamais).
    if (rafales.size > 5000) rafales.clear();
    rafales.set(visiteur, { fenetre: minute, nombre: 1 });
    return false;
  }
  compteur.nombre += 1;
  return compteur.nombre > PLAFOND_PAR_MINUTE;
}

export async function POST(requete: NextRequest) {
  // Quoi qu'il arrive, la réponse est la même : la balise n'attend
  // rien, et personne ne doit pouvoir sonder ce qui est compté.
  const ok = NextResponse.json({ ok: true });

  try {
    const agent = requete.headers.get("user-agent") ?? "";
    if (!agent || SIGNATURE_ROBOT.test(agent)) return ok;

    const corps = (await requete.json().catch(() => null)) as {
      slug?: string;
    } | null;
    const slug = corps?.slug?.trim().toLowerCase() ?? "";
    // Un slug de fiche : lettres, chiffres, tirets — rien d'autre.
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return ok;

    // L'EMPREINTE ANONYME : condensat (IP + navigateur + sel), tronqué.
    // Le sel vient d'une clé serveur : impossible à recalculer dehors.
    const ip =
      requete.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
    const sel =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 24) ?? "yokofolio";
    const visiteur = createHash("sha256")
      .update(`${ip}|${agent}|${sel}`)
      .digest("hex")
      .slice(0, 32);

    if (enRafale(visiteur)) return ok;

    // L'INSERTION — les doublons (même visiteur, même fiche, même
    // jour) sont ignorés : c'est le dédoublonnage sur 24 h.
    const admin = creerClientSupabaseAdmin();
    await admin
      .from("clics_fiches")
      .upsert(
        { tatoueur_slug: slug, visiteur },
        { onConflict: "tatoueur_slug,visiteur,jour", ignoreDuplicates: true }
      );
    return ok;
  } catch {
    // Base injoignable, migration pas passée, corps difforme : le
    // comptage attendra — jamais d'erreur renvoyée à la balise.
    return ok;
  }
}
