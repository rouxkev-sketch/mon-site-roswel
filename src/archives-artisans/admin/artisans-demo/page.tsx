import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { BoutonsArtisansDemo } from "@/components/BoutonsArtisansDemo";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Artisans de démonstration (outil)",
};

/**
 * PAGE OUTIL — ARTISANS DE DÉMONSTRATION (étape 5)
 * ------------------------------------------------
 * Uniquement en développement : http://localhost:3000/admin/artisans-demo
 */
export default async function PageArtisansDemo() {
  if (process.env.NODE_ENV === "production") notFound();

  // Combien d'artisans de démo sont déjà en base ?
  let nombreActuel: number | null = null;
  try {
    const supabase = creerClientSupabaseAdmin();
    const { count, error } = await supabase
      .from("artisans")
      .select("*", { count: "exact", head: true })
      .like("slug", "demo-%");
    if (!error) nombreActuel = count;
  } catch {
    // clé secrète absente ou connexion impossible : affichera « inconnu »
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Artisans de démonstration</h1>
          <p className="text-encre-douce text-sm mt-2">
            Crée 9 artisans fictifs autour de Lyon pour voir vivre la
            recherche : scores variés, pastilles, rapidité de réponse,
            un profil non validé (invisible) et une commune exclue.
            Relançable sans doublon, supprimable en un clic.
          </p>
        </div>

        <dl className="rounded-2xl bg-fond-doux border border-bordure p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-encre-douce">Artisans de démo en base</dt>
            <dd className="font-semibold">
              {nombreActuel === null ? "inconnu (connexion impossible)" : nombreActuel}
            </dd>
          </div>
        </dl>

        <BoutonsArtisansDemo />

        <div className="text-sm text-encre-douce space-y-1.5">
          <p className="font-semibold text-encre">Recherches à essayer ensuite :</p>
          <ul className="space-y-1">
            <li>
              <Link className="text-primaire underline" href="/plombier/villeurbanne">
                Plombier à Villeurbanne
              </Link>{" "}
              → 2 artisans
            </li>
            <li>
              <Link className="text-primaire underline" href="/chauffagiste/villeurbanne?urgence=1">
                Chauffagiste à Villeurbanne + urgence
              </Link>{" "}
              → 2 artisans
            </li>
            <li>
              <Link className="text-primaire underline" href="/electricien/lyon">
                Électricien à Lyon
              </Link>{" "}
              → 2 artisans (dont un badge « Très recommandé »)
            </li>
            <li>
              <Link className="text-primaire underline" href="/serrurier/lyon">
                Serrurier à Lyon
              </Link>{" "}
              → 1 artisan (sans pastille), le non-validé reste caché
            </li>
            <li>
              <Link className="text-primaire underline" href="/serrurier/venissieux">
                Serrurier à Vénissieux
              </Link>{" "}
              → 0 artisan (commune exclue par le serrurier)
            </li>
            <li>
              <Link className="text-primaire underline" href="/peintre/venissieux">
                Peintre à Vénissieux
              </Link>{" "}
              → 2 artisans (départagés par la rapidité)
            </li>
          </ul>

          <p className="font-semibold text-encre mt-4">Doubles compétences :</p>
          <ul className="space-y-1">
            <li>
              <Link
                className="text-primaire underline"
                href="/plombier-chauffagiste/ecully"
              >
                Plombier &amp; Chauffagiste à Écully
              </Link>{" "}
              → uniquement les doubles compétences
            </li>
            <li>
              <Link className="text-primaire underline" href="/plombier/ecully">
                Plombier à Écully
              </Link>{" "}
              → plombiers simples <em>et</em> doubles compétences
            </li>
            <li>
              <Link className="text-primaire underline" href="/chauffagiste/ecully">
                Chauffagiste à Écully
              </Link>{" "}
              → les doubles compétences aussi
            </li>
          </ul>

          <p className="font-semibold text-encre mt-4">Fiches avec / sans adresse :</p>
          <ul className="space-y-1">
            <li>
              <Link className="text-primaire underline" href="/artisan/demo-sophie-bertrand">
                Sophie Bertrand
              </Link>{" "}
              → adresse complète + carte (section « Adresse » affichée)
            </li>
            <li>
              <Link className="text-primaire underline" href="/artisan/demo-atelier-bois">
                Atelier Bois &amp; Cie
              </Link>{" "}
              → société, avec adresse + carte
            </li>
            <li>
              <Link className="text-primaire underline" href="/artisan/demo-karim-benali">
                Karim Benali
              </Link>{" "}
              → aucune adresse (aucune section « Adresse » sur la fiche)
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
