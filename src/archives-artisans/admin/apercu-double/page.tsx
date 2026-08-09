import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EcranRecherche } from "@/components/EcranRecherche";
import type { TypeArtisan } from "@/lib/recherche-artisans";
import { ARTISANS, COMMUNES_APERCU, FICHE_SOPHIE } from "./donnees";

export const metadata: Metadata = {
  title: "Aperçu du mode double colonnes (outil)",
};

/**
 * PAGE OUTIL — APERÇU DU MODE DOUBLE COLONNES (≥ 1024 px)
 * -------------------------------------------------------
 * L'écran partagé (liste + fiche) avec des données locales
 * fictives, sans base. Sous 1024 px : liste simple, comme la vraie
 * page de résultats. Développement uniquement :
 * http://localhost:3000/admin/apercu-double
 * (Le clic sur une carte charge la fiche via
 * /api/artisan/fiche-complete — sans base, les fiches non
 * préchargées affichent le message d'échec, c'est attendu ici.
 * Le pendant « page fiche » : /admin/apercu-double-fiche.
 * Avec ?vide=1 : recherche SANS résultat — vérifie l'état calme
 * des deux colonnes.
 * Avec ?n=2 : ne garde que les 2 premiers artisans — c'est le cas
 * « contenu plus court que l'écran », celui qui sert à vérifier que
 * le pied de page reste collé en bas et non juste sous la dernière
 * carte.)
 */
export default async function PageApercuDouble({
  searchParams,
}: {
  searchParams: Promise<{
    vide?: string;
    connecte?: string;
    u?: string;
    nuit?: string;
    w?: string;
    n?: string;
    type?: string;
    f?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const listeVide = params.vide === "1";
  const filtresType: TypeArtisan =
    params.type === "independant" || params.type === "societe"
      ? params.type
      : "tous";
  // ?n=2 : ne garder que les N premières cartes (contenu court)
  const combien = Number(params.n);
  let liste =
    Number.isFinite(combien) && combien > 0 ? ARTISANS.slice(0, combien) : ARTISANS;
  // Le filtre « type d'artisan » s'applique aussi à l'aperçu, pour
  // pouvoir le vérifier sans base de données.
  if (filtresType !== "tous")
    liste = liste.filter((a) => a.type_compte === filtresType);
  // ?connecte=1 : simule un visiteur connecté (test de synchro des
  // favoris entre la carte et la fiche, sans base)
  const userId = params.connecte === "1" ? "demo-user" : null;
  // ?u=1&nuit=1&w=1 : filtres actifs (test du résumé de la barre
  // repliée sur smartphone)
  const filtres = {
    urgence: params.u === "1",
    nuit: params.nuit === "1",
    weekend: params.w === "1",
    type: filtresType,
  };

  return (
    <main className="flex-1 flex flex-col recherche-fixe min-h-0 md:bg-fond-page">
      <EcranRecherche
        metier="electricien"
        libelleMetier="Électricien"
        villeSlug="lyon"
        commune={{ nom: "Lyon", code_insee: "69123", code_postal: "69001" }}
        filtres={filtres}
        filtresActifs={
          filtres.urgence ||
          filtres.nuit ||
          filtres.weekend ||
          filtres.type !== "tous"
        }
        inaccessible={false}
        artisans={listeVide ? [] : liste}
        userId={userId}
        favoris={[]}
        ficheInitiale={
          listeVide
            ? null
            : {
                artisan: FICHE_SOPHIE,
                communesCouvertes: COMMUNES_APERCU,
                // ?f=0 : aucun favori au départ — c'est le cas qui
                // permet de vérifier que le compteur apparaît à 1 puis
                // DISPARAÎT au retrait (le « 0 » ne s'affiche jamais).
                nombreFavoris: Number.isFinite(Number(params.f))
                  ? Number(params.f)
                  : 3,
              }
        }
        modeMobile="liste"
        // L'aperçu garde « Réessayez sans filtre » CHEZ LUI : on peut
        // ainsi rejouer le clic sans base de données, et vérifier que
        // les pilules retombent bien à l'état inactif.
        lienSansFiltre={`/admin/apercu-double${listeVide ? "?vide=1" : ""}`}
      />
    </main>
  );
}
