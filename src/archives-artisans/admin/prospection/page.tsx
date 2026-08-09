import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { lireIndicateursEnvoi } from "@/lib/prospection-quota";
import { lireConsommationGoogle } from "@/lib/journal-google";
import { LogoComplet } from "@/components/Logo";
import {
  TableauProspection,
  type CommuneProspect,
  type LigneProspect,
} from "@/components/TableauProspection";

export const metadata: Metadata = { title: "Prospection (admin)" };

/**
 * PAGE ADMIN — PROSPECTION DES ARTISANS
 * -------------------------------------
 * http://localhost:3000/admin/prospection (développement uniquement,
 * comme les autres outils : l'admin travaille en local avec la clé
 * secrète Supabase).
 *
 * Elle sert à COLLECTER puis DÉMARCHER. Aucun envoi d'e-mail depuis
 * cette page pour l'instant : le moteur d'envoi viendra ensuite, et
 * les colonnes qui l'attendent sont déjà là.
 *
 * Le pendant sans base de données, pour vérifier la mise en page :
 * /admin/apercu-prospection.
 */

/** Lignes affichées par page (au-delà, la pagination apparaît). */
const TAILLE_PAGE = 50;

/** Toutes les lignes servent aux compteurs ; bornées par prudence. */
const TOTAL_MAXIMUM = 5000;

/**
 * Les colonnes affichées. `lien_instagram` demande la migration
 * supabase/prospection-instagram.sql (voir le repli plus bas).
 *
 * Le métier est LU (rempli par la recherche Google) mais plus
 * modifié ; `metier_confirme` n'est plus affiché du tout.
 */
const COLONNES_BASE =
  "id, collecte_le, raison_sociale, nom_commercial, ville_nom, " +
  "ville_code_postal, siren, code_naf, date_creation_entreprise, email, " +
  "site_internet, metiers, metier_confirme, statut, nombre_envois, " +
  "premier_envoi_le, dernier_envoi_le, prochain_envoi_le, " +
  "contact_formulaire_le, notes_admin";
const COLONNES = `${COLONNES_BASE}, lien_instagram`;

/** Vrai si l'erreur vient d'une colonne pas encore créée. */
function colonneManquante(message: string, colonne: string): boolean {
  return message.includes(colonne);
}

export default async function PageProspection({
  searchParams,
}: {
  searchParams: Promise<{
    commune?: string;
    page?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const filtreCommune = params.commune?.trim() || "toutes";
  const demandee = Number(params.page);
  const page =
    Number.isFinite(demandee) && demandee > 0 ? Math.floor(demandee) : 1;

  let lignes: LigneProspect[] = [];
  let communes: CommuneProspect[] = [];
  let totalFiltre = 0;
  let nombreSansGoogle = 0;
  let nombreAvecSite = 0;
  let probleme: string | null = null;
  let migrationManquante = false;
  let metierConfirmeManquant = false;

  // Les quatre indicateurs d'envoi (fenêtre glissante de 24 h). Ils
  // sont lus À PART : une table de journal absente ne doit pas
  // empêcher le tableau de s'afficher.
  const indicateurs = await lireIndicateursEnvoi();

  // Où en est la consommation Google du mois. Lue À PART elle aussi :
  // un journal absent ne doit pas empêcher le tableau de s'afficher.
  const consommationGoogle = await lireConsommationGoogle();

  try {
    const admin = creerClientSupabaseAdmin();

    // 1. Une seule lecture légère pour la liste des communes et le
    //    total — plutôt que plusieurs requêtes de comptage.
    const { data: resume, error: erreurResume } = await admin
      .from("artisans_prospects")
      .select("ville_code_insee, ville_nom, email, site_internet, place_id_google")
      .limit(TOTAL_MAXIMUM);
    if (erreurResume) throw new Error(erreurResume.message);

    const toutes = (resume ?? []) as unknown as Array<{
      ville_code_insee: string | null;
      ville_nom: string | null;
      email: string | null;
      site_internet: string | null;
      place_id_google: string | null;
    }>;

    // La liste des communes se calcule sur TOUTES les lignes : le menu
    // de filtre doit proposer les communes même quand l'une d'elles
    // est déjà sélectionnée.
    const parCommune = new Map<string, CommuneProspect>();
    for (const ligne of toutes) {
      const insee = ligne.ville_code_insee;
      if (!insee) continue;
      const connue = parCommune.get(insee);
      if (connue) {
        connue.nombre += 1;
      } else {
        parCommune.set(insee, {
          code_insee: insee,
          nom: ligne.ville_nom ?? insee,
          nombre: 1,
        });
      }
    }
    communes = [...parCommune.values()].sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr")
    );

    const retenues = toutes.filter(
      (l) => filtreCommune === "toutes" || l.ville_code_insee === filtreCommune
    );
    totalFiltre = retenues.length;

    // LE PÉRIMÈTRE DES DEUX BOUTONS, annoncé avant le clic. Ce sont
    // exactement les critères des deux outils : sans fiche Google d'un
    // côté, sans adresse mais avec un site de l'autre.
    nombreSansGoogle = retenues.filter((l) => !l.place_id_google).length;
    nombreAvecSite = retenues.filter(
      (l) => !l.email && Boolean(l.site_internet)
    ).length;

    // 2. Les lignes de la page demandée.
    //    `range` est INCLUSIF des deux côtés : 0-49 = 50 lignes.
    //    LES DERNIERS COLLECTÉS EN HAUT : c'est sur eux qu'on
    //    travaille. Le SIREN sert de second critère — sans lui, deux
    //    fiches collectées à la même seconde pourraient changer
    //    d'ordre d'une page à l'autre, et l'une disparaître.
    const debut = (page - 1) * TAILLE_PAGE;

    const construireRequete = (colonnes: string) => {
      let requete = admin
        .from("artisans_prospects")
        .select(colonnes)
        .order("collecte_le", { ascending: false })
        .order("siren", { ascending: true })
        .range(debut, debut + TAILLE_PAGE - 1);
      if (filtreCommune !== "toutes") {
        requete = requete.eq("ville_code_insee", filtreCommune);
      }
      return requete;
    };

    let { data, error } = await construireRequete(COLONNES);

    // REPLI : tant qu'une migration n'est pas passée, sa colonne
    // n'existe pas et la requête échoue. On relit alors sans elle, et
    // on le dit clairement plutôt que d'afficher une page en erreur.
    if (error && colonneManquante(error.message, "lien_instagram")) {
      migrationManquante = true;
      ({ data, error } = await construireRequete(COLONNES_BASE));
    }
    if (error && colonneManquante(error.message, "metier_confirme")) {
      metierConfirmeManquant = true;
      const sansConfirme = (migrationManquante ? COLONNES_BASE : COLONNES)
        .replace(", metier_confirme", "");
      ({ data, error } = await construireRequete(sansConfirme));
    }
    if (error) throw new Error(error.message);

    lignes = ((data ?? []) as unknown as LigneProspect[]).map((l) => ({
      ...l,
      metiers: l.metiers ?? [],
      lien_instagram: l.lien_instagram ?? null,
      nombre_envois: l.nombre_envois ?? 0,
    }));
  } catch (e) {
    probleme = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex-1 flex flex-col px-5 py-8 w-full">
      <LogoComplet tailleIcone={32} />

      <div className="w-full min-w-0 mt-8 flex flex-col gap-6">
        <h1 className="text-xl font-bold">Prospection</h1>

        {migrationManquante && (
          <p className="rounded-2xl border border-alerte/50 bg-alerte/5 p-4 text-sm">
            ⚠ La colonne <code>lien_instagram</code> n&apos;existe pas encore :
            passer <code>supabase/prospection-instagram.sql</code> dans
            l&apos;éditeur SQL de Supabase. En attendant, la colonne Instagram
            reste vide et la recherche Google n&apos;enregistre pas les comptes
            qu&apos;elle trouve.
          </p>
        )}

        {metierConfirmeManquant && (
          <p className="rounded-2xl border border-alerte/50 bg-alerte/5 p-4 text-sm">
            ⚠ La colonne <code>metier_confirme</code> n&apos;existe pas encore :
            passer <code>supabase/prospection-metier-confirme.sql</code> dans
            l&apos;éditeur SQL de Supabase. En attendant, la colonne Métier
            n&apos;affiche que les métiers déduits d&apos;un code d&apos;activité
            non ambigu.
          </p>
        )}

        {probleme && (
          <p className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm">
            ❌ {probleme}
          </p>
        )}

        {!probleme && (
          <TableauProspection
            lignes={lignes}
            communes={communes}
            indicateurs={indicateurs}
            filtreCommune={filtreCommune}
            nombreSansGoogle={nombreSansGoogle}
            nombreAvecSite={nombreAvecSite}
            lienBase="/admin/prospection"
            page={page}
            taillePage={TAILLE_PAGE}
            totalFiltre={totalFiltre}
            consommationGoogle={consommationGoogle}
          />
        )}
      </div>
    </main>
  );
}
