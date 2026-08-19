"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FenetreDeVerre } from "@/components/SurfaceDeVerre";
import { IconeCroix } from "@/components/Icones";
import { retenirLeGeste, versLaConnexion } from "@/lib/favoris-yokofolio";

/**
 * ██ nº 396 — L'INVITATION À CRÉER UN COMPTE ██
 * ==================================================================
 * CE QU'ELLE REMPLACE : un visiteur non connecté qui touchait le
 * fanion d'une photo ou « Suivre » était EMMENÉ SUR-LE-CHAMP à la page
 * de compte. Il perdait ce qu'il regardait — la mosaïque défilée, la
 * fiche ouverte, la photo choisie. Désormais il reste où il est, et le
 * site lui explique en une phrase pourquoi un compte lui servirait.
 *
 * UNE SEULE FENÊTRE, ET UNE SEULE PHRASE CHANGE. Le geste qui l'ouvre
 * décide du mot, rien d'autre : ni la mise en page, ni les boutons, ni
 * les destinations. Deux fenêtres jumelles auraient divergé.
 *
 * ⚠️ CE QUE CETTE FENÊTRE NE FAIT PAS, ET C'EST DEMANDÉ : elle
 * n'enregistre rien et ne reprend rien. Le geste retenu avant le
 * départ (`retenirLeGeste`) existe DEPUIS LA nº 137 et n'est pas
 * touché — voir la note du bouton « Créer mon compte ».
 */

/** Le geste qui a ouvert la fenêtre — c'est lui qui choisit la phrase. */
export type GesteInvite = "photo" | "tatoueur";

/**
 * LA PHRASE, ET RIEN QUE LA PHRASE.
 * ------------------------------------------------------------------
 * Deux écritures, écrites une seule fois, au mot près de ce que le
 * propriétaire a demandé. Une table plutôt qu'un ternaire dans le
 * rendu : un troisième geste (un jour) s'ajoute ici, et nulle part
 * ailleurs.
 */
const PHRASES: Record<GesteInvite, string> = {
  photo: "Envie de retrouver cette photo ?",
  tatoueur: "Envie de garder ce portfolio ?",
};

export function FenetreInvitationCompte({
  geste,
  id,
  surFermeture,
}: {
  geste: GesteInvite;
  /** L'identifiant de l'objet visé — il part dans le geste retenu,
      exactement comme avant cette passe. */
  id: string;
  surFermeture: () => void;
}) {
  const router = useRouter();

  /**
   * ÉCHAP REFERME — et c'est l'écriture de la fenêtre de partage
   * sombre (BoutonPartageFiche) : `FenetreDeVerre` porte le voile, le
   * clic à côté, la plaque et le portail, mais pas le clavier. On
   * l'ajoute donc ici, à l'identique, plutôt que de le refaire
   * autrement.
   */
  useEffect(() => {
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") surFermeture();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [surFermeture]);

  return (
    /**
     * ██ L'APPARENCE EST REPRISE, PAS RECOMPOSÉE ██
     * ==============================================================
     * `FenetreDeVerre` (components/SurfaceDeVerre, nº 236-§2) est
     * L'UNIQUE écriture du verre du site. Elle apporte, sans qu'une
     * seule valeur soit réécrite ici :
     *  · LA PLAQUE `data-verre-fenetre` — anthracite à 22 %, flou de
     *    40 px, saturation 200 %, liseré divisé ;
     *  · LE VOILE derrière, à 25 %, qui porte le FONDU D'OUVERTURE
     *    (`starting:opacity-0`, 200 ms) — l'animation demandée est
     *    donc celle de toutes les autres fenêtres, au caractère près ;
     *  · L'ARRONDI `rounded-3xl` ;
     *  · LE CLIC À CÔTÉ qui referme (le voile EST un bouton) ;
     *  · LE PORTAIL dans <body>, sans quoi le flou ne flouterait que
     *    le plan de son parent (la leçon de la nº 234).
     * C'est la coque de la fenêtre de partage d'une fiche et de celle
     * des langues. Aucune charte n'est créée.
     *
     * ⚠️ L'ÉTAGE PAR DÉFAUT SUFFIT, ET IL EST FAIT POUR ÇA : `z-[80]`,
     * dont la note de `FenetreDeVerre` dit « une fenêtre ouverte depuis
     * une autre monte au-dessus d'elle ». La fenêtre de fiche du web
     * est à `z-[60]` : sur le web, toucher le fanion DANS une fiche
     * déjà ouverte pose donc cette invitation PAR-DESSUS elle, sans la
     * refermer ni la déranger. Les deux fermetures sont indépendantes —
     * cet état-ci vit dans le bouton du fanion, celui de la fiche dans
     * la mosaïque.
     */
    <FenetreDeVerre
      ariaLabelledby="titre-invitation-compte"
      surFermeture={surFermeture}
      largeur="max-w-[400px]"
    >
      {/*  LA CROIX — l'écriture du sélecteur de langue (la seule croix
           de fenêtre sombre du site) : rond de 36, gris doux qui
           blanchit au survol, `IconeCroix` de 18. Elle est ici SEULE
           sur sa ligne, calée à droite : le titre est une phrase, pas
           un titre de section, et le propriétaire le veut centré sur
           son propre bloc. */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={surFermeture}
          aria-label="Fermer"
          className="-mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center
                     rounded-full text-sombre-texte-doux
                     transition-colors hover:text-sombre-texte"
        >
          <IconeCroix taille={18} />
        </button>
      </div>

      {/*  1. LA PHRASE — blanche et grasse, comme demandé. La taille et
           la graisse sont celles du TITRE des fenêtres sombres
           (SelecteurLangue) : 17 px, `font-bold`, `tracking-tight`. */}
      <h2
        id="titre-invitation-compte"
        className="mt-1 text-[17px] font-bold tracking-tight text-sombre-texte"
      >
        {PHRASES[geste]}
      </h2>

      {/*  2. LE BOUTON PRINCIPAL — la capsule rose pleine du site
           (l'écriture de « qui-sommes-nous », reprise au caractère
           près), en pleine largeur puisqu'elle est seule dans une
           fenêtre de 400 px. */}
      <button
        type="button"
        onClick={() => {
          /*  ⚠️ LE GESTE RETENU RESTE CE QU'IL ÉTAIT (nº 137), et la
               reprise après inscription N'EST PAS ÉCRITE ICI : elle
               existe déjà, dans les deux boutons, et le propriétaire la
               réserve à une passe séparée. Ce qui change est le MOMENT
               où l'intention est notée — au départ vers le compte, et
               non plus au premier appui. Sans quoi refermer cette
               fenêtre laisserait derrière soi une intention qui
               s'exécuterait plus tard, toute seule.
               LA DESTINATION NE CHANGE PAS D'UN CARACTÈRE :
               `versLaConnexion()`, celle-là même où le fanion menait
               jusqu'ici, chemin de retour compris. */
          retenirLeGeste({ genre: geste, id });
          router.push(versLaConnexion());
        }}
        className="mt-5 w-full inline-flex items-center justify-center rounded-full
                   px-7 min-h-[54px] bg-primaire hover:bg-primaire-fonce
                   text-white font-semibold transition-colors
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        Créer mon compte
      </button>

      {/*  3. LE LIEN DISCRET — gris doux qui blanchit au survol, le
           traitement de toutes les lignes secondaires de la charte
           sombre. */}
      <button
        type="button"
        onClick={() => {
          /*  MÊME ADRESSE, ET C'EST VOULU : le site n'a qu'UNE page de
               compte (`/devenir-tatoueur`), qui porte les deux modes —
               « Créer mon compte » et « Me connecter » — sur une
               bascule interne. Il n'existe aucune adresse de connexion
               séparée. On ne change donc aucune destination, comme
               demandé, et le chemin de retour voyage pareil. */
          router.push(versLaConnexion());
        }}
        className="mt-3 w-full text-center text-[14px] text-sombre-texte-doux
                   transition-colors hover:text-sombre-texte"
      >
        Déjà inscrit ? Se connecter
      </button>
    </FenetreDeVerre>
  );
}
