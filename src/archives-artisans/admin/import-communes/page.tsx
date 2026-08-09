import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GEO } from "@/config/roswel";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { BoutonImportCommunes } from "@/components/BoutonImportCommunes";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Import des communes (outil)",
};

/**
 * PAGE OUTIL — IMPORT DES COMMUNES (étape 3)
 * ------------------------------------------
 * Accessible uniquement pendant le développement, à l'adresse
 * http://localhost:3000/admin/import-communes
 * Elle affiche l'état de la table `communes` et le bouton d'import.
 */
export default async function PageImportCommunes() {
  // Sur le site en ligne, cette page n'existe pas.
  if (process.env.NODE_ENV === "production") notFound();

  // Combien de communes sont déjà dans la base ?
  let nombreActuel: number | null = null;
  try {
    const supabase = await creerClientSupabaseServeur();
    const { count, error } = await supabase
      .from("communes")
      .select("*", { count: "exact", head: true });
    if (!error) nombreActuel = count;
  } catch {
    // Connexion impossible : on affichera « inconnu »
  }

  const zone =
    GEO.regionsImportCommunes.length === 0
      ? "toute la France"
      : `régions ${GEO.regionsImportCommunes.join(", ")}`;

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Import des communes</h1>
          <p className="text-encre-douce text-sm mt-2">
            Cet outil remplit la base avec les communes officielles
            (nom, codes postaux, coordonnées GPS) depuis
            geo.api.gouv.fr. Il peut être relancé sans risque : rien
            n&apos;est dupliqué.
          </p>
        </div>

        <dl className="rounded-2xl bg-fond-doux border border-bordure p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Zone à importer</dt>
            <dd className="font-semibold text-right">{zone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Réglage</dt>
            <dd className="text-right">
              <code className="text-xs">src/config/roswel.ts</code>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Communes déjà en base</dt>
            <dd className="font-semibold text-right">
              {nombreActuel === null ? "inconnu (connexion impossible)" : nombreActuel}
            </dd>
          </div>
        </dl>

        <BoutonImportCommunes />

        <p className="text-xs text-encre-douce">
          Après l&apos;import, recharger cette page pour voir le nouveau
          total, ou consulter{" "}
          <Link href="/api/verif-supabase" className="text-primaire underline">
            la page de contrôle
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
