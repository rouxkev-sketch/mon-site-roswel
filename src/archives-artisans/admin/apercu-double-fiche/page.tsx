import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EcranRecherche } from "@/components/EcranRecherche";
import {
  ARTISANS,
  COMMUNES_APERCU,
  FICHE_SOPHIE,
} from "../apercu-double/donnees";

export const metadata: Metadata = {
  title: "Aperçu de la page fiche du mode double (outil)",
};

/**
 * PAGE OUTIL — LA « PAGE FICHE » DU MODE DOUBLE
 * ---------------------------------------------
 * Reproduit EXACTEMENT l'architecture de la vraie page
 * /artisan/[slug] (EcranRecherche en mode « fiche » : fiche pleine
 * page sous 1024 px, colonne de liste MONTÉE mais masquée), avec la
 * même recherche fictive que /admin/apercu-double. Sert au test
 * automatique du retour : fiche → retour → liste retrouvée à sa
 * position, pagination comprise — et JAMAIS de position écrasée par
 * la colonne masquée. Développement uniquement :
 * http://localhost:3000/admin/apercu-double-fiche
 */
export default function PageApercuDoubleFiche() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col avec-barre-contact mode-double min-h-0">
      <EcranRecherche
        metier="electricien"
        libelleMetier="Électricien"
        villeSlug="lyon"
        commune={{ nom: "Lyon", code_insee: "69123", code_postal: "69001" }}
        filtres={{ urgence: false, nuit: false, weekend: false, type: "tous" }}
        filtresActifs={false}
        inaccessible={false}
        artisans={ARTISANS}
        userId={null}
        favoris={[]}
        ficheInitiale={{
          artisan: FICHE_SOPHIE,
          communesCouvertes: COMMUNES_APERCU,
          nombreFavoris: 3,
        }}
        modeMobile="fiche"
      />
    </main>
  );
}
