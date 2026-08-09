import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogoComplet } from "@/components/Logo";
import { TableauProspection } from "@/components/TableauProspection";
import { apercuEnvoiFictif } from "./messages-fictifs";
import {
  COMMUNES_APERCU,
  CONSOMMATION_GOOGLE_APERCU,
  INDICATEURS_APERCU,
  PROSPECTS_APERCU,
  SANS_FICHE_GOOGLE_APERCU,
} from "./donnees";

export const metadata: Metadata = { title: "Aperçu de la prospection (outil)" };

/**
 * PAGE OUTIL — APERÇU DE LA PROSPECTION
 * -------------------------------------
 * Le tableau de /admin/prospection avec des données FICTIVES, sans
 * base de données : http://localhost:3000/admin/apercu-prospection
 *
 * Même composant, mêmes styles — seule la provenance des lignes
 * change. En mode aperçu, les modifications restent à l'écran et
 * ne partent JAMAIS vers l'API : on peut saisir une adresse, cocher
 * des lignes, cliquer sur les boutons sans rien abîmer ni rien
 * dépenser.
 *
 * Le filtre par commune fonctionne aussi : ?commune=69081
 */

/** Même valeur que la vraie page, pour vérifier la même mise en page. */
const TAILLE_PAGE = 50;

export default async function PageApercuProspection({
  searchParams,
}: {
  searchParams: Promise<{
    commune?: string;
    page?: string;
    restant?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const filtreCommune = params.commune?.trim() || "toutes";

  // « ?restant=2 » : pour voir de ses yeux ce que donne un quota
  // presque épuisé — cases grisées et message d'explication. Le
  // plafond est la mécanique la plus délicate de la page, elle doit
  // pouvoir être regardée sans attendre d'avoir vraiment envoyé
  // soixante messages.
  const restantDemande = Number(params.restant);
  const indicateurs = Number.isFinite(restantDemande) && restantDemande >= 0
    ? { ...INDICATEURS_APERCU, restant: Math.floor(restantDemande) }
    : INDICATEURS_APERCU;

  // Le filtre se calcule comme sur la vraie page, à partir des lignes
  // fictives : la mise en page est vérifiée en entier, filtre compris.
  const retenues = PROSPECTS_APERCU.filter((l) => {
    if (filtreCommune === "toutes") return true;
    const commune = COMMUNES_APERCU.find((c) => c.code_insee === filtreCommune);
    return Boolean(commune) && l.ville_nom === commune?.nom;
  });

  const demandee = Number(params.page);
  const page =
    Number.isFinite(demandee) && demandee > 0 ? Math.floor(demandee) : 1;
  const debut = (page - 1) * TAILLE_PAGE;
  const lignes = retenues.slice(debut, debut + TAILLE_PAGE);

  return (
    <main className="flex-1 flex flex-col px-5 py-8 w-full">
      <LogoComplet tailleIcone={32} />

      <div className="w-full min-w-0 mt-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Prospection — aperçu</h1>
          <p className="text-encre-douce text-sm mt-1">
            Onze artisans FICTIFS, sans base de données, pour vérifier la mise
            en page. Les modifications restent à l&apos;écran et ne sont jamais
            enregistrées. La vraie page :{" "}
            <span className="font-semibold">/admin/prospection</span>.
          </p>
        </div>

        <TableauProspection
          lignes={lignes}
          communes={COMMUNES_APERCU}
          indicateurs={indicateurs}
          filtreCommune={filtreCommune}
          // « Sans fiche Google » ne se déduit pas des lignes fictives
          // (elles ne portent pas d'identifiant Google) : c'est un
          // nombre inventé, comme le reste de cette page. Le second, en
          // revanche, se calcule vraiment.
          nombreSansGoogle={SANS_FICHE_GOOGLE_APERCU}
          nombreAvecSite={
            retenues.filter((l) => !l.email && Boolean(l.site_internet)).length
          }
          lienBase="/admin/apercu-prospection"
          page={page}
          taillePage={TAILLE_PAGE}
          totalFiltre={retenues.length}
          consommationGoogle={CONSOMMATION_GOOGLE_APERCU}
          apercu
          apercuFictif={apercuEnvoiFictif()}
        />
      </div>
    </main>
  );
}
