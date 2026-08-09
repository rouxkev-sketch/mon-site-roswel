import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOTIFS_SIGNALEMENT } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { LogoComplet } from "@/components/Logo";
import { BoutonsStatutSignalement } from "@/components/BoutonsStatutSignalement";

export const metadata: Metadata = { title: "Signalements (admin)" };

/**
 * PAGE ADMIN — SIGNALEMENTS DE FICHES
 * -----------------------------------
 * http://localhost:3000/admin/signalements (développement
 * uniquement, comme les autres outils : l'admin travaille en local
 * avec la clé secrète Supabase). Liste les signalements reçus, filtre
 * par statut, renvoie vers la fiche concernée et permet de changer le
 * statut (nouveau / traité / rejeté).
 */

const FILTRES = [
  { cle: "nouveau", label: "Nouveaux" },
  { cle: "traite", label: "Traités" },
  { cle: "rejete", label: "Rejetés" },
  { cle: "tous", label: "Tous" },
];

const LIBELLE_MOTIF = new Map(
  MOTIFS_SIGNALEMENT.map(({ cle, label }) => [cle, label])
);

type LigneSignalement = {
  id: string;
  motifs: string[];
  commentaire: string;
  ip: string | null;
  statut: string;
  cree_le: string;
  particulier_id: string | null;
  artisans: { nom_affiche: string; slug: string | null } | null;
};

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function PageSignalements({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { statut } = await searchParams;
  const filtre = FILTRES.some((f) => f.cle === statut) ? statut! : "nouveau";

  let lignes: LigneSignalement[] = [];
  let probleme: string | null = null;

  try {
    const admin = creerClientSupabaseAdmin();
    let requete = admin
      .from("signalements")
      .select(
        "id, motifs, commentaire, ip, statut, cree_le, particulier_id, artisans ( nom_affiche, slug )"
      )
      .order("cree_le", { ascending: false });
    if (filtre !== "tous") requete = requete.eq("statut", filtre);
    const { data, error } = await requete;
    if (error) throw new Error(error.message);
    lignes = (data ?? []) as unknown as LigneSignalement[];
  } catch (e) {
    probleme = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Signalements</h1>
          <p className="text-encre-douce text-sm mt-1">
            Les fiches signalées par les visiteurs. Vérifie, puis change le
            statut.
          </p>
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2">
          {FILTRES.map(({ cle, label }) => (
            <Link
              key={cle}
              href={`/admin/signalements?statut=${cle}`}
              className={`text-xs font-semibold rounded-full px-3.5 min-h-[36px] flex items-center border transition-colors ${
                filtre === cle
                  ? "bg-primaire text-white border-primaire"
                  : "border-bordure hover:bg-fond-doux"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {probleme && (
          <p className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm">
            ❌ {probleme}
          </p>
        )}

        {!probleme && lignes.length === 0 && (
          <p className="text-sm text-encre-douce">
            Aucun signalement dans cette catégorie.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {lignes.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-bordure p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {s.artisans?.nom_affiche ?? "Fiche supprimée"}
                  </p>
                  <p className="text-xs text-encre-douce">
                    {dateFr.format(new Date(s.cree_le))}
                    {s.particulier_id ? " · visiteur connecté" : " · anonyme"}
                    {s.ip ? ` · IP ${s.ip}` : ""}
                  </p>
                </div>
                {s.artisans?.slug && (
                  <Link
                    href={`/artisan/${s.artisans.slug}`}
                    target="_blank"
                    className="text-xs text-primaire underline shrink-0"
                  >
                    Voir la fiche ↗
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {s.motifs.map((m) => (
                  <span
                    key={m}
                    className="text-xs rounded-full bg-fond-doux border border-bordure px-2.5 py-1"
                  >
                    {LIBELLE_MOTIF.get(m) ?? m}
                  </span>
                ))}
              </div>

              <p className="text-sm text-encre-douce whitespace-pre-wrap break-words">
                {s.commentaire}
              </p>

              <BoutonsStatutSignalement signalementId={s.id} statut={s.statut} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
