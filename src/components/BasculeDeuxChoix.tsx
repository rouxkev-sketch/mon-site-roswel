"use client";

import { OngletsLigne } from "@/components/OngletsLigne";

/**
 * LE SÉLECTEUR DE BASCULE — DEUX CHOIX, UN SEUL GESTE
 * ====================================================
 * ⚠️ CE N'EST PAS `Interrupteur.tsx`, ET LES DEUX DOIVENT COEXISTER.
 * L'interrupteur dit OUI ou NON à une chose : « Blackwork, oui ».
 * Celui-ci tranche entre DEUX CHOSES QUI S'EXCLUENT et se valent —
 * « Fondateur du salon » OU « Artiste résident », « Salon » OU
 * « Studio privé ». Aucune des deux n'est l'absence de l'autre : les
 * mettre sur un interrupteur reviendrait à dire qu'être résident,
 * c'est « ne pas être fondateur ».
 *
 * ⚠️ LA PISTE ARRONDIE A DISPARU (passe nº 116). Ce composant était le
 * DERNIER à porter l'ancien sélecteur à glissière — un rail plein et
 * une pastille rose qui coulissait — alors que la charte de la nº 112
 * l'avait remplacé partout ailleurs par les ONGLETS SOULIGNÉS : les
 * mots côte à côte sans piste ni fond, l'actif en blanc, une ligne
 * fine et grise sous toute la largeur, épaisse et rose sous le mot
 * choisi, qui GLISSE au changement. Les modes En salon, En studio et
 * Guest parlaient une autre langue graphique que le reste du bloc 1 ;
 * ils parlent désormais la même.
 *
 * IL DÉLÈGUE DONC TOUT À `OngletsLigne` : même dessin, même ARIA
 * (`radiogroup` + `radio`), même glissement — écrits une seule fois.
 * Ce qui reste ici, c'est le CONTRAT : exactement deux choix, jamais
 * de position vide (une bascule a toujours une réponse — c'est tout
 * l'intérêt d'en avoir posé une).
 */
export function BasculeDeuxChoix<T extends string>({
  choix,
  valeur,
  surChoix,
  etiquette,
}: {
  /** EXACTEMENT DEUX. Le premier est la position de gauche. */
  choix: readonly [{ slug: T; label: string }, { slug: T; label: string }];
  /** Le choix retenu. Jamais null : une bascule a toujours une
      position — c'est tout l'intérêt d'en avoir posé une ici. */
  valeur: T;
  surChoix: (slug: T) => void;
  /** Ce que le lecteur d'écran annonce avant les deux libellés. */
  etiquette: string;
}) {
  return (
    <OngletsLigne
      ariaLabel={etiquette}
      options={choix.map((entree) => ({ cle: entree.slug, label: entree.label }))}
      cleActive={valeur}
      surChoix={(cle) => surChoix(cle as T)}
    />
  );
}
