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
  /*  ██ §1 (nº 699) — FERMÉE EN LIGNE, COMME LES AUTRES OUTILS ██
      CE QUE L'AUDIT nº 698 A MESURÉ (orange, nº 5 du top 5) : cette
      route répondait 200 à n'importe qui, sans le moindre cookie. Et
      ce qu'elle répond n'est pas anodin : elle NOMME sept tables et
      donne, pour chacune, LE NOMBRE DE LIGNES qu'un visiteur peut
      lire — plus les messages d'erreur bruts de la base. C'est
      exactement l'outil qu'on voudrait pour savoir par où entrer :
      un banc d'essai des règles d'accès, offert et gratuit.
      LA CORRECTION EST CELLE DES TREIZE AUTRES OUTILS d'atelier
      (`/api/admin/*`) : la même ligne, le même refus. Elle garde tout
      son intérêt en local, où elle a été écrite pour servir. */
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

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
