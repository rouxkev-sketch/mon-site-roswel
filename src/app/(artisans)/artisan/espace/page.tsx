import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { FormulaireArtisan, type DonneesFiche } from "@/components/FormulaireArtisan";
import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";

export const metadata: Metadata = { title: "Mon espace artisan" };

/**
 * ESPACE ARTISAN (étape 8a)
 * -------------------------
 * Réservé aux connectés. Affiche l'état de la fiche (en
 * vérification / modifications demandées / validée) puis le
 * formulaire, pré-rempli si la fiche existe. Grâce aux règles de
 * sécurité de la base, un artisan ne voit que SA fiche.
 */
export default async function PageEspaceArtisan() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/devenir-artisan");

  // Sa fiche (s'il en a déjà une)
  const { data: fiche } = await supabase
    .from("artisans")
    .select(
      "nom_affiche, type_compte, nom_societe, nom_responsable, photo_url, ville_code_insee, ville_nom, ville_code_postal, adresse, rayon_intervention_km, lien_instagram, site_internet, bio, horaires, dispo_urgence, dispo_feries, absence_debut, absence_fin, telephone, telephone_visible, whatsapp, siren, slug, statut_validation, motifs_modifications, artisan_metiers ( metier )"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const initial: DonneesFiche | null = fiche
    ? {
        nom_affiche: fiche.nom_affiche,
        type_compte: fiche.type_compte === "societe" ? "societe" : "independant",
        nom_societe: fiche.nom_societe,
        nom_responsable: fiche.nom_responsable ?? null,
        photo_url: fiche.photo_url,
        metiers: (fiche.artisan_metiers ?? []).map(
          (m: { metier: string }) => m.metier
        ),
        ville_code_insee: fiche.ville_code_insee,
        ville_nom: fiche.ville_nom,
        ville_code_postal: fiche.ville_code_postal,
        adresse: fiche.adresse ?? null,
        rayon_intervention_km: fiche.rayon_intervention_km,
        lien_instagram: fiche.lien_instagram,
        site_internet: fiche.site_internet ?? null,
        bio: fiche.bio,
        horaires: fiche.horaires,
        dispo_urgence: fiche.dispo_urgence,
        dispo_feries: fiche.dispo_feries,
        absence_debut: fiche.absence_debut,
        absence_fin: fiche.absence_fin,
        telephone: fiche.telephone,
        telephone_visible: fiche.telephone_visible ?? true,
        whatsapp: fiche.whatsapp,
        siren: fiche.siren,
      }
    : null;

  return (
    <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
      <header className="mb-4 flex items-center justify-end gap-1">
        <BoutonDeconnexion />
      </header>

      <h1 className="text-xl font-bold mb-4">
        {fiche ? "Ma fiche artisan" : "Créer ma fiche artisan"}
      </h1>

      {/* ----- Bandeau d'état de la fiche ----- */}
      {fiche?.statut_validation === "en_attente" && (
        <div className="rounded-2xl border border-alerte/40 bg-alerte/5 p-4 text-sm mb-6">
          <p className="font-semibold">🕐 Vérification en cours</p>
          <p className="text-encre-douce mt-1">
            Notre équipe contrôle votre fiche. Elle sera visible dans les
            résultats de recherche dès validation.
          </p>
        </div>
      )}
      {fiche?.statut_validation === "modifications_demandees" && (
        <div className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm mb-6">
          <p className="font-semibold">✏️ Des modifications sont demandées</p>
          <ul className="text-encre-douce mt-2 space-y-1.5 list-disc pl-4">
            {(fiche.motifs_modifications ?? []).map((motif: string) => (
              <li key={motif}>{motif}</li>
            ))}
          </ul>
          <p className="text-encre-douce mt-2">
            Corrigez ci-dessous puis réenregistrez : la fiche repartira en
            vérification.
          </p>
        </div>
      )}
      {fiche?.statut_validation === "valide" && (
        <div className="rounded-2xl border border-succes/40 bg-succes/5 p-4 text-sm mb-6">
          <p className="font-semibold">✅ Fiche validée et visible</p>
          <p className="text-encre-douce mt-1">
            <Link
              href={`/artisan/${fiche.slug}`}
              className="text-primaire underline font-medium"
            >
              Voir ma fiche publique
            </Link>
          </p>
        </div>
      )}

      <FormulaireArtisan userId={user.id} initial={initial} />
    </main>
  );
}
