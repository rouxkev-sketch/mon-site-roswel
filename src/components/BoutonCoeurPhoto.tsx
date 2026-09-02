"use client";

import { useEffect, useRef, useState } from "react";
//  ██ nº 364 — LE FANION REMPLACE LE CŒUR, PARTOUT ██
//  C'est L'ICÔNE DE LA BARRE FIXE, celle de « Ma sélection »
//  (IconeFanion, components/Icones) — pas un second dessin : le même
//  composant, appelé ici. La nº 145-§3 avait posé la règle inverse
//  (« le fanion ne remplace pas le cœur des photos ») ; le
//  propriétaire la change à cette passe, et c'est le seul endroit du
//  produit YOKOFOLIO où ce dessin est choisi — cartes de la mosaïque,
//  vitrines, résultats, fiches, fenêtres et « Ma sélection » passent
//  tous par ce bouton. RIEN D'AUTRE NE CHANGE : gabarits (24 / 30),
//  couleurs (blanc, plein une fois enregistré), ombre portée,
//  animation de pose, zone tactile.
import { IconeFanion } from "@/components/Icones";
//  §1 (nº 396) — l'invitation à créer un compte, écrite UNE fois et
//  posée par les deux gestes concernés (ici le fanion, et « Suivre »).
import { FenetreInvitationCompte } from "@/components/FenetreInvitationCompte";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  amorcer,
  definir,
  ecrireFavori,
  estIdentifiantDeBase,
  reprendreLeGeste,
  useEtatFavori,
} from "@/lib/favoris-yokofolio";

/**
 * LE FANION — enregistrer une photo (nº 364 ; c'était un CŒUR jusque-là)
 * ======================================================================
 * IL VIT DANS L'IMAGE, jamais à côté : sur les cartes de la mosaïque
 * en HAUT À DROITE, sur les fiches en bas à droite (smartphone) ou à
 * gauche du partage (web). C'est le geste d'Instagram et de Pinterest,
 * et il n'a pas besoin d'être expliqué.
 *
 * ⚠️ SON DESSIN EST CELUI DE LA BARRE FIXE — le fanion de « Ma
 * sélection » (IconeFanion), appelé ici, jamais recopié : une seule
 * main dessine, les deux endroits ne peuvent plus diverger. Décision du
 * propriétaire, nº 364, qui renverse la règle de la nº 145-§3 (« le
 * fanion ne remplace pas le cœur des photos ») : le geste et l'endroit
 * portent désormais le MÊME signe — on range dans sa sélection.
 * SEULE LA FORME CHANGE : gabarits, couleurs, ombre, animation de pose
 * et zone tactile sont ceux du cœur, à l'identique.
 *
 * SON HABILLAGE : le trait blanc sur une pastille sombre allégée — le
 * même vocabulaire que le badge « Artiste / Salon » posé dans l'autre
 * angle. Enregistré, il se remplit de ROSE : c'est l'un des emplois
 * réservés de la couleur (l'état d'un objet), et il se voit sur
 * n'importe quelle photo.
 *
 * ⚠️ IL N'OUVRE JAMAIS LA FICHE. La carte entière est un lien étiré :
 * sans `stopPropagation` ET `preventDefault`, toucher le cœur
 * naviguerait. Le bouton est donc posé AU-DESSUS du lien (`z-10`),
 * avec une zone tactile de 40 px.
 *
 * PAS CONNECTÉ ? On mène à la connexion — mais on ne lui fait perdre
 * ni sa page ni son geste : l'adresse de départ voyage dans `?suite=`,
 * et le geste est REJOUÉ tout seul au retour (voir `reprendreLeGeste`).
 */
export function BoutonCoeurPhoto({
  photoId,
  enregistreeAuDepart = false,
  variante = "carte",
}: {
  /** La photo telle qu'elle vit en base. Absente (galerie vide, fiche
      d'avant le portfolio catalogué) : le cœur ne s'affiche pas. */
  photoId: string;
  /**
   * §3 (nº 302) — ANNULATION EXPLICITE : LE CŒUR NE PORTE PLUS QUE SUR
   * CETTE PHOTO.
   * ------------------------------------------------------------------
   * LA RÈGLE ANNULÉE, mot pour mot : « quand un utilisateur aime une
   * des photos du carrousel, c'est l'ensemble du carrousel qui est
   * aimé » (nº 208-§6). Elle avait été posée sur une consigne ; le
   * propriétaire la change. Le paramètre `galerie` qui la portait est
   * SUPPRIMÉ, code compris — aucun appelant ne peut donc la
   * réintroduire par mégarde.
   * DÉSORMAIS : un cœur met en favori UNE SEULE PHOTO, celle sur
   * laquelle on a cliqué. Le carrousel n'est plus concerné.
   */
  enregistreeAuDepart?: boolean;
  /** `carte` : dans l'image de la mosaïque. `fiche` : le même dessin,
      au gabarit des actions de fiche (partage). */
  /** « fiche-mobile » (nº 198-§2) : le cœur posé sur la photo de
      l'affiche au doigt — cible de 48 px (au-dessus du minimum tactile
      de 44), glyphe à 30. Les deux autres gabarits ne bougent pas. */
  variante?: "carte" | "fiche" | "fiche-mobile";
}) {
  const { utilisateur, pret } = useUtilisateur();
  amorcer("photo", photoId, enregistreeAuDepart);
  const enregistree = useEtatFavori("photo", photoId, enregistreeAuDepart);
  /** L'animation de pose — un rebond court, jamais au retrait. */
  const [pulse, setPulse] = useState(false);
  /** §1 (nº 396) — LA FENÊTRE D'INVITATION EST OUVERTE. Un ÉTAT REACT,
      rien d'autre : aucune adresse, aucune entrée d'historique (voir la
      note du rendu, tout en bas). */
  const [invitation, setInvitation] = useState(false);
  const dejaRejoue = useRef(false);

  /** LE GESTE REPRIS APRÈS LA CONNEXION. On revient sur la page qu'on
      regardait, et le cœur qu'on avait touché s'allume tout seul :
      c'est la promesse tenue jusqu'au bout. Une seule fois. */
  useEffect(() => {
    if (!pret || !utilisateur || dejaRejoue.current) return;
    if (!reprendreLeGeste("photo", photoId)) return;
    dejaRejoue.current = true;
    //  ⚠️ PAS D'ANIMATION ICI, et ce n'est pas un oubli : le rebond
    //  accompagne un GESTE, or celui-ci a été fait sur la page
    //  précédente. Le cœur est simplement déjà plein à l'arrivée —
    //  ce qui est exactement ce qu'on veut montrer.
    //  (`definir` passe par le magasin partagé, pas par un état React :
    //  aucun rendu en cascade depuis cet effet.)
    //  §3 (nº 302) — LE GESTE REPRIS PORTE EXACTEMENT AUSSI LOIN QUE
    //  LE GESTE D'ORIGINE : cette photo, et elle seule.
    definir("photo", photoId, true);
    void ecrireFavori("photo", photoId, true);
  }, [pret, utilisateur, photoId]);

  function basculer(evenement: React.MouseEvent) {
    //  LA CARTE EST UN LIEN ÉTIRÉ : les deux gardes sont nécessaires.
    evenement.preventDefault();
    evenement.stopPropagation();

    /**
     * ██ §1 (nº 396) — L'INVITATION REMPLACE LE DÉPART ██
     * ==============================================================
     * ⚠️ `pret` D'ABORD, ET C'EST LA RÈGLE 137/203 : l'état de
     * connexion se charge côté navigateur, APRÈS le premier rendu.
     * Tant qu'il n'est pas connu, `utilisateur` vaut `null` — ce qui
     * ne veut PAS dire « non connecté », mais « on ne sait pas
     * encore ». Ouvrir la fenêtre sur cette valeur-là la montrerait
     * une fraction de seconde à quelqu'un qui EST connecté. On ne fait
     * donc rien : l'état arrive en quelques dizaines de millisecondes,
     * et un second appui agit. C'est aussi ce qui manquait avant cette
     * passe — le même appui envoyait alors un connecté sur la page de
     * compte.
     * ⚠️ LE GESTE RETENU A DÉMÉNAGÉ, IL N'A PAS DISPARU : il est noté
     * au DÉPART vers le compte (voir FenetreInvitationCompte), et non
     * plus ici. Sans ce déplacement, refermer la fenêtre laisserait une
     * intention derrière soi, qui se jouerait à la prochaine connexion.
     */
    if (!pret) return;
    if (!utilisateur) {
      setInvitation(true);
      return;
    }

    const suivant = !enregistree;
    //  L'ÉCRAN RÉPOND TOUT DE SUITE, la base suit. Un cœur qui attend
    //  le réseau pour se remplir donne l'impression d'un site cassé.
    //  §3 (nº 302) — UNE SEULE PHOTO : celle-ci.
    definir("photo", photoId, suivant);
    if (suivant) setPulse(true);
    void ecrireFavori("photo", photoId, suivant).then((ok) => {
      //  Le serveur a refusé : on remet le cœur comme il était plutôt
      //  que de laisser croire à un enregistrement qui n'existe pas.
      if (!ok) definir("photo", photoId, !suivant);
    });
  }

  //  ⚠️ APRÈS LES HOOKS, JAMAIS AVANT : React exige que le nombre de
  //  hooks appelés ne change pas d'un rendu à l'autre. Une photo qui
  //  n'existe pas en base (démonstration, portfolio d'avant le
  //  catalogue) n'a pas de cœur — proposer un geste qui échouerait
  //  serait pire que de ne rien proposer.
  if (!estIdentifiantDeBase(photoId)) return null;

  const gabarit =
    variante === "carte"
      ? //  ⚠️ 40 px de cible, glyphe 24 (nº 212-§5) : agrandi en nº 211
        //  (36 → 44), il pesait trop lourd sur une carte de deux
        //  colonnes, qui ne fait que 190 px de large. Sur une mosaïque
        //  d'images, le cœur reste le seul geste possible sans ouvrir
        //  une fiche : il doit se voir et s'atteindre, sans dominer.
        "h-10 w-10"
      : //  ⚠️ LE MÊME GABARIT SUR LES DEUX ÉCRANS (nº 208-§3) : 48 px
        //  de cible, le standard tactile de la nº 198-§2. Le cœur du
        //  web était resté à 40 — trop petit sur une photo qui occupe
        //  la moitié de l'écran. La carte EN PLEINE LARGEUR le reprend
        //  tel quel (nº 211-§4) : à cette taille d'image, c'est le même
        //  geste que sur une fiche.
        "h-12 w-12";

  return (
    <>
    <button
      type="button"
      onClick={basculer}
      onAnimationEnd={() => setPulse(false)}
      aria-pressed={enregistree}
      //  ⚠️ LE MOT SUIT LA PAGE (nº 145-§3) : on retire « de ma
      //  sélection », plus « des favoris » — c'est le seul endroit du
      //  site où le cœur prononçait encore l'ancien mot. ET LE DESSIN
      //  SUIT LE MOT DEPUIS LA nº 364 : c'est le fanion de la barre
      //  fixe, le signe du rangement, ici comme là-bas.
      aria-label={
        enregistree
          ? "Remove this photo from my favorites"
          : "Save this photo"
      }
      title={enregistree ? "Saved" : "Save"}
      //  ⚠️ `relative z-10` — ET LES DEUX MOTS COMPTENT. La carte est
      //  un LIEN ÉTIRÉ (`after:absolute after:inset-0`) qui recouvre
      //  toute la vignette. `z-10` seul ne sert à RIEN sur un élément
      //  non positionné : le cœur restait sous le lien, et le toucher
      //  ouvrait la fiche au lieu d'enregistrer (mesuré par le banc
      //  de la passe). `relative` le positionne, `z-10` le fait passer
      //  devant — et il porte les deux lui-même, pour qu'aucun endroit
      //  où on le pose n'ait à s'en souvenir.
      //  ⚠️ LE CERCLE A DISPARU (nº 141-6A) : le cœur vit NU sur la
      //  photo, comme sur Instagram. La zone tactile, elle, garde son
      //  gabarit — invisible. L'OMBRE PORTÉE du trait (drop-shadow)
      //  n'est pas un contour ni une ombre de bloc : sans elle, un
      //  trait blanc disparaît sur une photo claire — c'est la
      //  lisibilité du glyphe, décision notée au compte rendu.
      className={`${gabarit} relative z-10 inline-flex items-center justify-center
                  transition-transform active:scale-95
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${pulse ? "rw-coeur-anime" : ""}`}
    >
      <IconeFanion
        /*  §1 (nº 487) — LE GLYPHE DE LA VUE PHOTO DESCEND À 26. Il
            partageait les trente pixels de la fiche du WEB ; le
            propriétaire le trouve un peu gros au doigt, sur la ligne
            du titre où il voisine la flèche de partage. Les DEUX
            variantes se séparent donc ici, et le web garde ses trente
            — c'est la seule façon de bouger l'un sans l'autre.
            ⚠️ LA CIBLE NE CHANGE PAS (48 px, la même pour les deux) :
            c'est le DESSIN qui rétrécit, pas la surface qu'on touche.
            ⚠️ ET LE DÉCALAGE QUI LE CALE SUR LA MARGE SUIT (nº 483,
            recalculé nº 487) : le vide autour du glyphe vaut
            (48 − 26) / 2 = ONZE pixels, contre neuf auparavant. La
            valeur vit chez l'appelant — FicheTatoueur, la ligne du
            titre — et elle y a été reprise. */
        taille={
          variante === "carte" ? 24 : variante === "fiche-mobile" ? 26 : 30
        }
        classe={`[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.55))] ${
          enregistree
            ? //  ⚠️ BLANC PLEIN une fois enregistré (nº 141-6B) — plus
              //  jamais de rouge ni de rose : la couleur signalait un
              //  état là où le REMPLISSAGE suffit à le dire.
              "fill-white text-white"
            : "fill-none text-white"
        }`}
      />
    </button>
      {/*  ██ §1 (nº 396) — L'INVITATION, POSÉE PAR LE BOUTON LUI-MÊME ██
           ==========================================================
           ELLE EST ÉCRITE ICI, ET NULLE PART AILLEURS, et c'est ce qui
           couvre TOUTES les surfaces d'un coup : ce bouton est le seul
           fanion du produit — cartes de la mosaïque, vitrines,
           résultats, « Ma sélection », page de fiche et fenêtre de
           fiche du web montent CE composant. Aucune
           surface ne peut donc en être privée, et aucune n'a une ligne
           à écrire.
           ⚠️ AUCUNE ENTRÉE D'HISTORIQUE (règle 332-§1) : `invitation`
           est un état React, la fenêtre est peinte par un portail dans
           <body>. Ni `pushState`, ni `replaceState`, ni paramètre
           d'adresse — donc rien à consommer en refermant, et le bouton
           « précédent » quitte la page comme si la fenêtre n'existait
           pas. C'est déjà le régime des fenêtres de partage et de
           langue ; celle-ci ne fait pas exception.
           ⚠️ ELLE EST DANS LE <button>, ET ÇA NE PÈSE RIEN : le portail
           la sort du flux et de tout contexte d'empilement — sa place
           dans l'arbre React n'a aucun effet sur la mise en page de la
           carte ni de la fiche. */}
      {invitation && (
        <FenetreInvitationCompte
          geste="photo"
          id={photoId}
          surFermeture={() => setInvitation(false)}
        />
      )}
    </>
  );
}
