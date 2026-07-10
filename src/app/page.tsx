import { GEO, MARQUE } from "@/config/roswel";
import { LogoComplet } from "@/components/Logo";

/**
 * PAGE D'ACCUEIL PROVISOIRE (étape 1)
 * -----------------------------------
 * Elle sert à vérifier que tout fonctionne : couleurs venant du
 * fichier de réglages central, logo provisoire, bandeau de zone.
 * La vraie page d'accueil (recherche métier + ville, filtres)
 * sera construite à l'étape 4.
 */
export default function Accueil() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Bandeau informatif : la zone de lancement (réglable dans la config) */}
      <div className="bg-primaire-clair text-primaire-fonce text-sm font-medium text-center px-4 py-2.5">
        {GEO.bandeauZoneLancement}
      </div>

      {/* Contenu centré */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <LogoComplet tailleIcone={56} />

        <h1 className="text-2xl font-bold max-w-sm text-balance">
          {MARQUE.slogan}
        </h1>

        <p className="text-encre-douce max-w-sm text-balance">
          Choisissez votre artisan selon sa réputation réelle&nbsp;: avis
          Google et influence Instagram.
        </p>

        {/* Aperçu du bouton principal (zone tactile ≥ 44 px) */}
        <button
          type="button"
          className="bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white font-semibold rounded-full px-8 min-h-[48px] transition-colors"
        >
          Bientôt disponible
        </button>

        <p className="text-xs text-encre-douce mt-8">
          Site en construction — étape 1 : fondations
        </p>
      </div>
    </main>
  );
}
