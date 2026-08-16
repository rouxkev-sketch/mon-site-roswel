"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconeCoeur } from "@/components/Icones";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  amorcer,
  definir,
  ecrireFavori,
  estIdentifiantDeBase,
  reprendreLeGeste,
  retenirLeGeste,
  useEtatFavori,
  versLaConnexion,
} from "@/lib/favoris-yokofolio";

/**
 * LE CŒUR — enregistrer une photo
 * ================================
 * IL VIT DANS L'IMAGE, jamais à côté : sur les cartes de la mosaïque
 * en HAUT À DROITE, sur les fiches en bas à droite (smartphone) ou à
 * gauche du partage (web). C'est le geste d'Instagram et de Pinterest,
 * et il n'a pas besoin d'être expliqué.
 *
 * SON DESSIN : le trait blanc sur une pastille sombre allégée — le
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
  const router = useRouter();
  const { utilisateur, pret } = useUtilisateur();
  amorcer("photo", photoId, enregistreeAuDepart);
  const enregistree = useEtatFavori("photo", photoId, enregistreeAuDepart);
  /** L'animation de pose — un rebond court, jamais au retrait. */
  const [pulse, setPulse] = useState(false);
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

    if (!utilisateur) {
      retenirLeGeste({ genre: "photo", id: photoId });
      router.push(versLaConnexion());
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
    <button
      type="button"
      onClick={basculer}
      onAnimationEnd={() => setPulse(false)}
      aria-pressed={enregistree}
      //  ⚠️ LE MOT SUIT LA PAGE (nº 145-§3) : on retire « de ma
      //  sélection », plus « des favoris » — c'est le seul endroit du
      //  site où le cœur prononçait encore l'ancien mot. LE DESSIN, LUI,
      //  RESTE UN CŒUR : sur une photo, il dit un goût, pas un rangement.
      aria-label={
        enregistree
          ? "Retirer cette photo de ma sélection"
          : "Enregistrer cette photo"
      }
      title={enregistree ? "Enregistrée" : "Enregistrer"}
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
      <IconeCoeur
        taille={variante === "carte" ? 24 : 30}
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
  );
}
