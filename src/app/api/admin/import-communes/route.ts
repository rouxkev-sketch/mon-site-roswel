import { NextResponse } from "next/server";
import { GEO } from "@/config/roswel";
import { slugifier } from "@/lib/slug";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * IMPORT DES COMMUNES DE FRANCE (étape 3)
 * ---------------------------------------
 * Télécharge les communes depuis l'annuaire officiel de l'État
 * (geo.api.gouv.fr) puis les enregistre dans la table `communes`
 * avec leurs coordonnées GPS.
 *
 * - La zone importée se règle dans src/config/roswel.ts
 *   (GEO.regionsImportCommunes : tableau vide = TOUTE la France).
 * - Réexécutable sans danger : une commune déjà présente est
 *   simplement mise à jour, jamais dupliquée.
 * - Outil de développement, à lancer depuis la page
 *   http://localhost:3000/admin/import-communes
 */

// Les informations demandées à l'annuaire pour chaque commune
const CHAMPS = "code,nom,codesPostaux,centre,codeDepartement,codeRegion";

// Nombre de communes enregistrées par paquet (pour ne pas surcharger)
const TAILLE_LOT = 1000;

// La forme des données renvoyées par geo.api.gouv.fr
type CommuneGeoApi = {
  code: string;
  nom: string;
  codesPostaux?: string[];
  codeDepartement?: string;
  codeRegion?: string;
  centre?: { type: string; coordinates: [number, number] }; // [longitude, latitude]
};

export async function POST(request: Request) {
  // Outil réservé au développement : jamais accessible sur le site en ligne.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "L'import est désactivé sur le site en ligne. Le lancer depuis " +
          "l'ordinateur avec `npm run dev` (il écrit dans la même base).",
      },
      { status: 403 }
    );
  }

  const debut = Date.now();

  // Mode essai (?essai) : tout faire SAUF écrire dans la base
  let essai = false;
  try {
    const corps = await request.json();
    essai = corps?.essai === true;
  } catch {
    // pas de corps envoyé : import normal
  }

  try {
    // ----- 1. Télécharger les communes ------------------------
    const regions = GEO.regionsImportCommunes;
    const urls =
      regions.length === 0
        ? [`https://geo.api.gouv.fr/communes?fields=${CHAMPS}&format=json`]
        : regions.map(
            (code) =>
              `https://geo.api.gouv.fr/regions/${code}/communes?fields=${CHAMPS}&format=json`
          );
    // Les arrondissements municipaux de Paris, Lyon et Marseille
    // (pour que « Lyon 3e », « Paris 15e »… soient cherchables)
    urls.push(
      `https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields=${CHAMPS}&format=json`
    );

    const communesRecues: CommuneGeoApi[] = [];
    for (const url of urls) {
      console.log(`→ Téléchargement : ${url}`);
      const reponse = await fetch(url);
      if (!reponse.ok) {
        const conseil =
          reponse.status === 404
            ? "Un code région est sans doute invalide : vérifier GEO.regionsImportCommunes dans src/config/roswel.ts (tableau des codes dans docs/IMPORT-COMMUNES.md)."
            : "L'annuaire est peut-être indisponible ou l'accès internet bloqué : réessayer dans quelques minutes.";
        throw new Error(
          `L'annuaire geo.api.gouv.fr a répondu « ${reponse.status} ». ${conseil}`
        );
      }
      communesRecues.push(...((await reponse.json()) as CommuneGeoApi[]));
    }

    // ----- 2. Mettre en forme pour notre table -----------------
    const lignes = [];
    let ignoreesSansGps = 0;
    for (const commune of communesRecues) {
      if (!commune.centre?.coordinates) {
        ignoreesSansGps += 1; // très rare : commune sans coordonnées
        continue;
      }
      const [longitude, latitude] = commune.centre.coordinates;
      lignes.push({
        code_insee: commune.code,
        nom: commune.nom,
        slug: slugifier(commune.nom),
        codes_postaux: commune.codesPostaux ?? [],
        code_departement: commune.codeDepartement ?? null,
        code_region: commune.codeRegion ?? null,
        latitude,
        longitude,
      });
    }

    // ----- 3. Rendre les slugs uniques -------------------------
    // Plusieurs communes portent le même nom (ex. Saint-Denis).
    // Dans ce cas, chacune reçoit son numéro de département :
    // saint-denis-93, saint-denis-974… Les noms uniques restent
    // propres : villeurbanne, lyon…
    const occurrences = new Map<string, number>();
    for (const ligne of lignes) {
      occurrences.set(ligne.slug, (occurrences.get(ligne.slug) ?? 0) + 1);
    }
    for (const ligne of lignes) {
      if ((occurrences.get(ligne.slug) ?? 0) > 1) {
        ligne.slug = ligne.code_departement
          ? `${ligne.slug}-${ligne.code_departement.toLowerCase()}`
          : `${ligne.slug}-${ligne.code_insee}`;
      }
    }
    // Double sécurité si une homonymie subsiste malgré tout
    const slugsVus = new Set<string>();
    for (const ligne of lignes) {
      if (slugsVus.has(ligne.slug)) {
        ligne.slug = `${ligne.slug}-${ligne.code_insee}`;
      }
      slugsVus.add(ligne.slug);
    }

    // ----- 4. Enregistrer par paquets ---------------------------
    let enregistrees = 0;
    if (!essai) {
      const supabase = creerClientSupabaseAdmin();
      for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
        const lot = lignes.slice(i, i + TAILLE_LOT);
        const { error } = await supabase
          .from("communes")
          .upsert(lot, { onConflict: "code_insee" });
        if (error) {
          throw new Error(
            `Supabase a refusé l'enregistrement : ${error.message}`
          );
        }
        enregistrees += lot.length;
        console.log(`  ${enregistrees}/${lignes.length} communes enregistrées…`);
      }
    }

    const dureeSecondes = Math.round((Date.now() - debut) / 1000);
    return NextResponse.json({
      ok: true,
      message: essai
        ? `Test réussi : ${lignes.length} communes prêtes (rien n'a été écrit).`
        : `Import terminé : ${enregistrees} communes enregistrées en ${dureeSecondes} s.`,
      details: {
        communes_recues: communesRecues.length,
        communes_enregistrees: essai ? 0 : enregistrees,
        ignorees_sans_gps: ignoreesSansGps,
        zone: regions.length === 0 ? "toute la France" : `régions ${regions.join(", ")}`,
        duree_secondes: dureeSecondes,
      },
    });
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        message: erreur instanceof Error ? erreur.message : String(erreur),
      },
      { status: 500 }
    );
  }
}
