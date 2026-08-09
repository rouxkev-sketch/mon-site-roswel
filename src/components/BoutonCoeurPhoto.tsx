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
  enregistreeAuDepart?: boolean;
  /** `carte` : dans l'image de la mosaïque. `fiche` : le même dessin,
      au gabarit des actions de fiche (partage). */
  variante?: "carte" | "fiche";
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
      ? "h-9 w-9"
      : //  Sur la fiche, le cœur répond au bouton de partage : même
        //  hauteur, même pastille, même flou.
        "h-10 w-10";

  return (
    <button
      type="button"
      onClick={basculer}
      onAnimationEnd={() => setPulse(false)}
      aria-pressed={enregistree}
      aria-label={
        enregistree ? "Retirer cette photo des favoris" : "Enregistrer cette photo"
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
      className={`${gabarit} relative z-10 inline-flex items-center justify-center rounded-full
                  bg-black/38 backdrop-blur-md transition-[background-color,transform]
                  hover:bg-black/55 active:scale-95
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${pulse ? "rw-coeur-anime" : ""}`}
    >
      <IconeCoeur
        taille={variante === "carte" ? 19 : 21}
        classe={
          enregistree
            ? "fill-primaire text-primaire"
            : "fill-none text-white"
        }
      />
    </button>
  );
}
