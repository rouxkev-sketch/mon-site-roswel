import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * PAGE DE VÉRIFICATION DE LA BASE DE DONNÉES
 * ------------------------------------------
 * Ouvrir http://localhost:3000/api/verif-supabase dans le
 * navigateur : elle contrôle la connexion à Supabase et la
 * présence de chacune des tables du projet.
 */

// Les tables attendues (créées par supabase/schema.sql)
const TABLES_ATTENDUES = [
  "artisans",
  "artisan_metiers",
  "communes",
  "particuliers",
  "favoris",
  "conversations",
  "messages",
] as const;

export async function GET() {
  const resultats: Record<string, string> = {};
  let toutVaBien = true;

  let supabase;
  try {
    supabase = await creerClientSupabaseServeur();
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        message: erreur instanceof Error ? erreur.message : String(erreur),
      },
      { status: 500 }
    );
  }

  for (const table of TABLES_ATTENDUES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      toutVaBien = false;
      const detail =
        error.message?.trim() ||
        "pas de réponse de Supabase — vérifier la connexion internet et l'adresse du projet dans .env.local";
      resultats[table] = `❌ absente ou inaccessible (${detail})`;
    } else {
      resultats[table] = `✅ présente — ${count ?? 0} ligne(s) visible(s)`;
    }
  }

  return NextResponse.json({
    ok: toutVaBien,
    message: toutVaBien
      ? "Tout est en ordre : Supabase est connecté et toutes les tables existent."
      : "Il manque des tables : exécuter le script supabase/schema.sql dans Supabase (guide : docs/CONFIGURATION-SUPABASE.md).",
    tables: resultats,
  });
}
