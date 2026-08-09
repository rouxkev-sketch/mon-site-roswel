"use client";

import { OFFRES_METIER } from "@/config/roswel";
import { MenuDeroulant } from "@/components/MenuDeroulant";

/**
 * LE SÉLECTEUR DE MÉTIER (accueil, résultats et fiche artisan)
 * ------------------------------------------------------------
 * Un simple habillage du menu déroulant commun `MenuDeroulant` (le
 * MÊME composant que le menu Ville et le menu Sujet du contact) :
 * mêmes bordures, arrondis, ombre, options, et contour + flèche rose
 * à l'ouverture.
 *
 * Il est nourri de la LISTE FERMÉE des entrées (src/config/roswel.ts,
 * un seul endroit à modifier) : les DOUBLES COMPÉTENCES d'abord
 * (« Plombier & Chauffagiste »), puis les MÉTIERS UNIQUES — chaque
 * section précédée de son en-tête en gras, non cliquable. La même
 * structure s'affiche sur les QUATRE formats (smartphone, smartphone
 * étiré, tablette, web) puisque c'est le même composant.
 */
export function ChampMetier({
  valeur,
  surChangement,
  placeholder,
  hauteur,
  taillePolice,
  sansBordure,
  onOuvertureChange,
  compact,
}: {
  valeur: string;
  surChangement: (valeur: string) => void;
  placeholder?: string;
  hauteur?: string;
  taillePolice?: string;
  sansBordure?: boolean;
  onOuvertureChange?: (ouvert: boolean) => void;
  /** Padding resserré (moteur des résultats) */
  compact?: boolean;
}) {
  return (
    <MenuDeroulant
      valeur={valeur}
      surChangement={surChangement}
      options={OFFRES_METIER.map(({ slug, label, groupe }) => ({
        value: slug,
        label,
        groupe,
      }))}
      ariaLabel="Catégorie d'artisan"
      placeholder={placeholder ?? "Quel artisan ?"}
      hauteur={hauteur}
      taillePolice={taillePolice}
      sansBordure={sansBordure}
      onOuvertureChange={onOuvertureChange}
      compact={compact}
      feuilleMobile
      // SMARTPHONE uniquement : la feuille monte du bas et RECOUVRE le
      // champ — un titre est donc nécessaire, avec le MÊME libellé que
      // le champ. Sur les grands formats, le menu s'ouvre juste sous le
      // champ, resté visible : pas de titre (voir MenuDeroulant).
      titreFeuille="Quel artisan ?"
    />
  );
}
