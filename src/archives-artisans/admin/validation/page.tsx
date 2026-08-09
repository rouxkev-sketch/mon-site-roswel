import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { verifierSiren } from "@/lib/siren";
import {
  CarteValidation,
  type FicheAExaminer,
} from "@/components/CarteValidation";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = { title: "Validation des fiches (admin)" };

type LigneFiche = {
  id: string;
  nom_affiche: string;
  nom_societe: string | null;
  photo_url: string | null;
  bio: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  rayon_intervention_km: number;
  lien_instagram: string | null;
  siren: string | null;
  statut_validation: string;
  motifs_modifications: string[];
  artisan_metiers: Array<{ metier: string }>;
};

/**
 * Re-vérifie le SIREN en direct et prépare le résumé affiché sur la
 * carte d'examen. `verifie` commande le bouton « Valider » : AUCUNE
 * validation sans SIREN vérifié.
 */
async function verdictSiren(
  fiche: LigneFiche
): Promise<{ texte: string; verifie: boolean }> {
  if (!fiche.siren) {
    return {
      texte: "✖ Pas de SIREN fourni : validation impossible.",
      verifie: false,
    };
  }
  const resultat = await verifierSiren(fiche.siren, fiche.nom_affiche);
  switch (resultat.etat) {
    case "verifie":
      return {
        texte: `✔ SIREN ${fiche.siren} actif — ${resultat.nomLegal}${
          resultat.dateCreation ? ` (créée le ${resultat.dateCreation})` : ""
        } — nom ${resultat.nomCoherent ? "cohérent" : "À VÉRIFIER : différent du nom affiché"}.`,
        verifie: true,
      };
    case "inactif":
      return {
        texte: `✖ SIREN ${fiche.siren} : établissement FERMÉ (${resultat.nomLegal}) — validation impossible.`,
        verifie: false,
      };
    case "introuvable":
      return {
        texte: `✖ SIREN ${fiche.siren} : introuvable dans l'annuaire officiel — validation impossible.`,
        verifie: false,
      };
    default:
      return {
        texte: `… SIREN ${fiche.siren} : annuaire injoignable, réessayer plus tard — validation impossible en attendant.`,
        verifie: false,
      };
  }
}

/**
 * PAGE ADMIN — VALIDATION DES FICHES (étape 8b)
 * ---------------------------------------------
 * http://localhost:3000/admin/validation (développement uniquement).
 * Les fiches en attente d'abord, avec re-vérification SIREN en
 * direct ; puis un récapitulatif des autres statuts.
 */
export default async function PageValidation() {
  if (process.env.NODE_ENV === "production") notFound();

  let enAttente: Array<FicheAExaminer & { statut: string }> = [];
  let enCorrection: LigneFiche[] = [];
  let validees: LigneFiche[] = [];
  let probleme: string | null = null;

  try {
    const supabase = creerClientSupabaseAdmin();
    const { data, error } = await supabase
      .from("artisans")
      .select(
        "id, nom_affiche, nom_societe, photo_url, bio, ville_nom, ville_code_postal, rayon_intervention_km, lien_instagram, siren, statut_validation, motifs_modifications, artisan_metiers ( metier )"
      )
      .order("cree_le", { ascending: true });
    if (error) throw new Error(error.message);

    const lignes = (data ?? []) as LigneFiche[];
    const attente = lignes.filter((l) => l.statut_validation === "en_attente");
    enCorrection = lignes.filter(
      (l) => l.statut_validation === "modifications_demandees"
    );
    validees = lignes.filter((l) => l.statut_validation === "valide");

    // Vérification SIREN en direct pour les fiches à examiner
    enAttente = await Promise.all(
      attente.map(async (fiche) => {
        const siren = await verdictSiren(fiche);
        return {
          id: fiche.id,
          nom_affiche: fiche.nom_affiche,
          nom_societe: fiche.nom_societe,
          photo_url: fiche.photo_url,
          bio: fiche.bio,
          ville_nom: fiche.ville_nom,
          ville_code_postal: fiche.ville_code_postal,
          rayon_intervention_km: fiche.rayon_intervention_km,
          lien_instagram: fiche.lien_instagram,
          siren: fiche.siren,
          metiers: fiche.artisan_metiers.map((m) => m.metier),
          verdictSiren: siren.texte,
          sirenVerifie: siren.verifie,
          statut: fiche.statut_validation,
        };
      })
    );
  } catch (e) {
    probleme = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Validation des fiches</h1>
          <p className="text-encre-douce text-sm mt-1">
            Une fiche n&apos;apparaît dans la recherche qu&apos;une fois
            validée ici.
          </p>
        </div>

        {probleme && (
          <p className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm">
            ❌ {probleme}
          </p>
        )}

        {/* ----- À examiner ----- */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            🕐 En attente de validation ({enAttente.length})
          </h2>
          {enAttente.length === 0 && !probleme && (
            <p className="text-sm text-encre-douce">
              Aucune fiche à examiner pour le moment.
            </p>
          )}
          {enAttente.map((fiche) => (
            <CarteValidation key={fiche.id} fiche={fiche} />
          ))}
        </section>

        {/* ----- En correction ----- */}
        {enCorrection.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">
              ✏️ Modifications demandées ({enCorrection.length})
            </h2>
            <ul className="text-sm text-encre-douce space-y-1">
              {enCorrection.map((fiche) => (
                <li key={fiche.id}>
                  {fiche.nom_affiche} — {fiche.motifs_modifications.length}{" "}
                  motif(s) transmis
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ----- Validées ----- */}
        {validees.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">
              ✅ Fiches validées ({validees.length})
            </h2>
            <p className="text-sm text-encre-douce">
              {validees.map((fiche) => fiche.nom_affiche).join(" · ")}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
