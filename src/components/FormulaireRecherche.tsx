"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChampMetier } from "@/components/ChampMetier";
import { ChampVille, type VilleChoisie } from "@/components/ChampVille";
import { memoriserRecherche } from "@/lib/recherche-session";

/** Les 3 filtres de disponibilité proposés sur l'accueil */
const FILTRES = [
  { cle: "urgence", label: "Urgence" },
  { cle: "nuit", label: "La nuit" },
  { cle: "weekend", label: "Le week-end" },
] as const;

type CleFiltre = (typeof FILTRES)[number]["cle"];

/**
 * LE MOTEUR DE RECHERCHE DE L'ACCUEIL (design maquette)
 * -----------------------------------------------------
 * Carte blanche qui déborde sur la photo d'accueil : métier, ville
 * (choisie dans les suggestions), trois filtres sur une ligne,
 * bouton Rechercher. Pas d'étiquettes visibles — les champs se
 * présentent eux-mêmes.
 */
export function FormulaireRecherche({
  disposition = "empile",
  classeCarte,
  idVille = "champ-ville",
  enTete,
}: {
  /** « empile » (mobile) = métier puis ville l'un sous l'autre ;
      « grille » (desktop) = métier et ville côte à côte. */
  disposition?: "empile" | "grille";
  /** Surcharge du style de la carte (accueil desktop : carte flottante). */
  classeCarte?: string;
  /** id du champ ville (unique : le moteur est dupliqué mobile / desktop). */
  idVille?: string;
  /** Contenu optionnel rendu EN TÊTE de la carte, au-dessus des champs
      (accueil desktop : petit intitulé « Confiance vérifiée »). */
  enTete?: ReactNode;
} = {}) {
  const router = useRouter();
  const [metier, setMetier] = useState("");
  const [ville, setVille] = useState<VilleChoisie | null>(null);
  // Moteur desktop (« grille ») : métier + ville dans UN SEUL encadré ;
  // à l'ouverture du menu métier, tout l'encadré passe au rose (la ville
  // le fait déjà via focus-within).
  const [metierOuvert, setMetierOuvert] = useState(false);
  const [filtres, setFiltres] = useState<Record<CleFiltre, boolean>>({
    urgence: false,
    nuit: false,
    weekend: false,
  });

  const pret = metier !== "" && ville !== null;

  function basculerFiltre(cle: CleFiltre) {
    setFiltres((actuels) => ({ ...actuels, [cle]: !actuels[cle] }));
  }

  function lancerRecherche(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!pret || !ville) return;

    // On retient la recherche pour le reste de la visite (pré-remplit
    // la ville du formulaire de message, cahier des charges §9)
    memoriserRecherche({
      metier,
      villeNom: ville.nom,
      villeSlug: ville.slug,
      codeInsee: ville.code_insee,
    });

    const parametres = new URLSearchParams();
    for (const { cle } of FILTRES) {
      if (filtres[cle]) parametres.set(cle, "1");
    }
    const suffixe = parametres.size > 0 ? `?${parametres.toString()}` : "";

    router.push(`/${metier}/${ville.slug}${suffixe}`);
  }

  // MOBILE (« empile ») : métier puis ville, chacun dans son propre
  // encadré, l'un sous l'autre.
  const champsEmpiles = (
    <>
      {/* Métier */}
      <ChampMetier
        valeur={metier}
        surChangement={setMetier}
        placeholder="Quel artisan ?"
      />

      {/* Ville (suggestions branchées sur la base) */}
      <ChampVille
        id={idVille}
        surChoix={setVille}
        etiquette={null}
        texteIndicatif="Quelle ville ?"
      />
    </>
  );

  // DESKTOP / IPAD (« grille ») : métier et ville FUSIONNÉS dans un
  // SEUL encadré (contour unique, coins 12 px), séparés par un fin
  // trait vertical gris — exactement comme le moteur compact des
  // résultats. Contour rose quand le métier (état) OU la ville
  // (focus-within) est actif.
  const champsFusionnes = (
    <div
      className={`flex items-stretch min-h-[52px] rounded-xl border bg-fond ${
        metierOuvert
          ? "border-primaire ring-2 ring-primaire/25"
          : "border-bordure-champ focus-within:border-primaire focus-within:ring-2 focus-within:ring-primaire/25"
      }`}
    >
      {/* Ratio des deux champs. Dès 1024 px (carte assez large), la ville
          gagne de la largeur : métier 48 % / ville 52 %, sans que
          « Quel artisan ? » ne soit tronqué. Sous 1024 px (iPad
          portrait, carte plus étroite), on garde 54 % au métier pour que
          son libellé long tienne sans « … ». */}
      <div className="basis-[60%] lg:basis-[48%] min-w-0">
        <ChampMetier
          valeur={metier}
          surChangement={setMetier}
          placeholder="Quel artisan ?"
          sansBordure
          hauteur="h-full min-h-[50px]"
          onOuvertureChange={setMetierOuvert}
        />
      </div>

      {/* Trait vertical fin entre les deux champs */}
      <span aria-hidden className="w-px self-stretch bg-bordure-champ my-2" />

      <div className="flex-1 min-w-0">
        <ChampVille
          id={idVille}
          surChoix={setVille}
          etiquette={null}
          texteIndicatif="Quelle ville ?"
          sansBordure
        />
      </div>
    </div>
  );

  return (
    <form
      onSubmit={lancerRecherche}
      className={
        classeCarte ??
        // Moteur MOBILE (accueil) : padding et espacement FLUIDES — plus
        // aérés à mesure que la largeur augmente (16→26 px de padding,
        // 12→18 px d'espacement), sans changer la structure empilée.
        "w-full rounded-3xl bg-fond p-[clamp(16px,4.4vw,26px)] shadow-lg shadow-encre/10 border border-bordure-carte-claire flex flex-col gap-[clamp(12px,3vw,18px)]"
      }
    >
      {enTete}
      {disposition === "grille" ? champsFusionnes : champsEmpiles}

      {/* Filtres : une seule ligne pleine largeur, sans icônes.
          « flex-auto » répartit l'espace restant à parts égales :
          les trois boutons gardent exactement le même padding
          autour de leur texte. */}
      <div className="flex gap-2" role="group" aria-label="Besoin particulier">
        {FILTRES.map(({ cle, label }) => (
          <button
            key={cle}
            type="button"
            aria-pressed={filtres[cle]}
            onClick={() => basculerFiltre(cle)}
            className={`flex-auto min-h-[44px] rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
              filtres[cle]
                ? "border-primaire bg-primaire-clair text-primaire-fonce"
                : "border-bordure-champ text-encre"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bouton principal (pâle tant que métier + ville ne sont pas choisis) */}
      <button
        type="submit"
        disabled={!pret}
        className="bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white font-semibold rounded-full min-h-[52px] text-base transition-colors disabled:opacity-45"
      >
        Rechercher
      </button>
    </form>
  );
}
