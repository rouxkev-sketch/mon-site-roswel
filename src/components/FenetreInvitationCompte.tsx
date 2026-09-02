"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FenetreDeVerre } from "@/components/SurfaceDeVerre";
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
  photo: "Want to find this photo again?",
  tatoueur: "Want to follow this portfolio?",
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
      //  §1 (nº 544) — FOND OPAQUE au jeton `carte` : le drapeau de la
      //  nº 543, la teinte des nº 542-543. Ni la place, ni la largeur,
      //  ni le voile ne changent.
      opaque
    >
      {/*  ██ §1 (nº 397) — LA CROIX EST PARTIE ██
           Le propriétaire la retire : l'appui à côté et Échap
           referment, et ce sont les deux gestes que toutes les fenêtres
           de verre du site portent déjà (partage d'une fiche, langues).
           ⚠️ ET L'AIR DU HAUT PART AVEC ELLE. La croix occupait une
           ligne entière : rond de 36 px remonté de 8 (`-mt-2`), plus
           les 4 px de `mt-1` sous elle. Le haut de la phrase était donc
           à 24 (le `p-6` de la plaque) + 28 + 4 = 56 px du bord.
           IL EST MAINTENANT À 24 px — le rembourrage de la plaque, et
           rien d'autre. Ce n'est pas une valeur inventée : c'est le
           `rembourrage` par défaut de `FenetreDeVerre`, l'air intérieur
           de toutes les fenêtres de verre. */}
      {/*  1. LA PHRASE — blanche et grasse, comme demandé. La taille et
           la graisse sont celles du TITRE des fenêtres sombres
           (SelecteurLangue) : 17 px, `font-bold`, `tracking-tight`. */}
      <h2
        id="titre-invitation-compte"
        className="text-[17px] font-bold tracking-tight text-sombre-texte"
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
               §5 (nº 397) — ET IL DIT DÉSORMAIS SON ONGLET : « creer ».
               La page portait deux onglets et choisissait le sien
               d'après un drapeau « ce navigateur a déjà connu un
               compte » ; ce bouton-ci ouvre TOUJOURS la création, quoi
               qu'il y ait sur l'appareil. Le chemin de retour, lui, ne
               bouge pas : `suite` reste le premier paramètre. */
          retenirLeGeste({ genre: geste, id });
          router.push(versLaConnexion("creer"));
        }}
        /*  §2 (nº 397) — LE BLANC EST CELUI DU SITE. C'était
             `text-white` (#FFFFFF), venu de l'écriture d'origine du
             bouton ; c'est désormais `text-sombre-texte` (#F2F2F4), le
             jeton de la charte — CELUI DE LA PHRASE juste au-dessus. Un
             seul blanc dans la fenêtre, et il est en charte. */
        className="mt-5 w-full inline-flex items-center justify-center rounded-full
                   px-7 min-h-[54px] bg-primaire hover:bg-primaire-fonce
                   text-sombre-texte font-semibold transition-colors
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        Sign up
      </button>

      {/*  3. LE LIEN DISCRET — blanc comme le reste depuis la nº 397 ;
           c'est sa TAILLE et sa GRAISSE qui le mettent en retrait, plus
           sa couleur (voir la note de son `className`). */}
      <button
        type="button"
        onClick={() => {
          /*  ██ §5 (nº 397) — CE BOUTON OUVRE L'ONGLET CONNEXION ██
               Le site n'a qu'UNE page de compte (`/devenir-tatoueur`),
               qui porte les deux modes sur une bascule interne — il
               n'existe pas d'adresse de connexion séparée. Jusqu'à cette
               passe, les deux boutons y menaient sans rien dire, et la
               page choisissait son onglet d'après un drapeau local.
               DÉSORMAIS L'ADRESSE LE DIT : « connexion », et ce choix
               l'emporte sur tout — session en cours, compte déjà créé
               sur cet appareil, préférence mémorisée. C'est un site
               consulté sur des ordinateurs partagés : rien ne doit être
               présumé de qui est devant l'écran.
               ⚠️ LE GESTE EST RETENU ICI AUSSI, exactement comme sur
               l'autre bouton — et c'est ce que faisait le site AVANT la
               fenêtre : un seul chemin menait au compte, et il notait
               l'intention pour tout le monde. La reprise de la nº 137
               se joue sur « connecté », pas sur « vient de s'inscrire » :
               ne la noter que d'un côté aurait fait perdre son geste à
               qui possède déjà un compte. Rien n'est ajouté au
               mécanisme, il est seulement servi par les deux portes.
               ⚠️ LE CHEMIN DE RETOUR VOYAGE PAREIL : `suite` d'abord,
               le mode derrière. */
          retenirLeGeste({ genre: geste, id });
          router.push(versLaConnexion("connexion"));
        }}
        /*  §2 et §3 (nº 397) — BLANC, ET PLUS D'AIR AU-DESSUS.
             LA COULEUR : c'était `text-sombre-texte-doux` (#A8A8B0), le
             gris doux — illisible sur une plaque translucide de 22 %.
             C'est maintenant `text-sombre-texte` (#F2F2F4), le MÊME
             blanc que la phrase et que le bouton.
             LA HIÉRARCHIE TIENT SANS LA COULEUR, et c'est ce que le
             propriétaire demande : 14 px en graisse normale contre
             17 px en gras pour la phrase et un semi-gras sur capsule
             rose pour le bouton. Trois poids, une seule couleur.
             ⚠️ LE SURVOL NE CHANGE DONC PLUS RIEN : il éclaircissait le
             gris vers ce blanc-ci, et il n'y a plus d'écart à parcourir.
             La règle est retirée plutôt que laissée sans effet ; aucun
             autre traitement n'est inventé à la place.
             L'AIR : `mt-3` (12 px) devient `mt-5` (20 px) — la valeur
             qui sépare DÉJÀ la phrase du bouton, sur cette fenêtre.

             ██ §2 (nº 398) — LE SURVOL LUI REVIENT ██
             Passé au blanc, ce lien n'avait plus aucun retour au survol
             (la nº 397 avait retiré l'éclaircissement, devenu sans
             objet). Il reprend LE VOILE TRANSLUCIDE DES LIGNES
             CLIQUABLES — `hover:bg-white/5 active:bg-white/10`, le
             traitement de `CLASSES_LIGNE_CLIQUABLE` (nº 232), des
             lignes de menu (nº 237-§2), du sélecteur de langue et des
             quatre partages de la fenêtre de verre. C'est le seul
             survol de la charte sombre qui ne touche pas à la couleur
             du texte — exactement ce qu'il faut ici, puisque le blanc
             ne doit plus bouger. Rien n'est inventé.
             ⚠️ L'ÉCART VISIBLE NE CHANGE PAS D'UN PIXEL : le lien porte
             maintenant 8 px de rembourrage (`py-2`) pour que le voile
             ait un corps, donc sa marge passe de 20 à 12 px. Du bas du
             bouton au texte du lien : 12 + 8 = 20 px, la valeur posée à
             la nº 397. Deux écritures, une seule distance. */
        className="mt-3 w-full rounded-xl py-2 text-center text-[14px]
                   text-sombre-texte transition-colors
                   hover:bg-white/5 active:bg-white/10"
      >
        Already have an account? Log in
      </button>
    </FenetreDeVerre>
  );
}
