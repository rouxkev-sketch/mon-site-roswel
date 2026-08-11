"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconeCoeur } from "@/components/Icones";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  definir,
  ecrireFavorisEnSerie,
  reprendreLeGeste,
  retenirLeGeste,
  useEtatSerie,
  versLaConnexion,
} from "@/lib/favoris-yokofolio";

/**
 * LE CŒUR D'UNE SÉRIE — la vignette d'un style (passe nº 203-§2)
 * ===============================================================
 * LE CŒUR NE PORTE PLUS SUR UNE PHOTO, IL PORTE SUR LA SÉRIE D'UN
 * STYLE : un cœur posé sur la vignette « Abstrait » d'un artiste fait
 * entrer TOUTE sa série abstrait dans « Ma sélection » — chaque photo
 * de la série, d'un seul geste, en une seule demande au serveur.
 * On comprend du premier regard ce qu'on aime : un style de cet
 * artiste, pas un cliché isolé.
 *
 * LE DESSIN EST CELUI DE TOUS LES CŒURS DU SITE (BoutonCoeurPhoto) :
 * trait blanc à l'ombre portée, nu sur la photo, REMPLI DE BLANC quand
 * la série est enregistrée — jamais de rose (nº 141-6B). Il est plein
 * quand TOUTES les photos de la série sont dans la sélection ; en
 * retirer une (depuis « Ma sélection ») le rouvre, honnêtement.
 *
 * PAS CONNECTÉ ? Même promesse que les autres cœurs : la connexion,
 * puis le retour sur cette page, et le geste rejoué tout seul.
 */
export function BoutonCoeurSerie({
  ids,
  label,
}: {
  /** Les photos de la série — identifiants de BASE uniquement (les
      clés fabriquées des fiches d'avant le catalogue sont écartées
      par l'appelant). Vide : le cœur ne s'affiche pas. */
  ids: string[];
  /** « Abstrait » — le nom du style, pour les lecteurs d'écran. */
  label: string;
}) {
  const router = useRouter();
  const { utilisateur, pret } = useUtilisateur();
  const enregistree = useEtatSerie(ids);
  const [pulse, setPulse] = useState(false);
  const dejaRejoue = useRef(false);

  /** La clé du geste en attente : la série est SES photos. */
  const cle = ids.join(",");

  /** LE GESTE REPRIS APRÈS LA CONNEXION — une seule fois, sans
      animation : le cœur est simplement déjà plein à l'arrivée. */
  useEffect(() => {
    if (!pret || !utilisateur || dejaRejoue.current || ids.length === 0) return;
    if (!reprendreLeGeste("serie", cle)) return;
    dejaRejoue.current = true;
    for (const id of ids) definir("photo", id, true);
    void ecrireFavorisEnSerie(ids, true);
  }, [pret, utilisateur, cle, ids]);

  function basculer(evenement: React.MouseEvent) {
    //  La vignette entière ouvre la galerie : les deux gardes.
    evenement.preventDefault();
    evenement.stopPropagation();

    if (!utilisateur) {
      retenirLeGeste({ genre: "serie", id: cle });
      router.push(versLaConnexion());
      return;
    }

    const suivant = !enregistree;
    //  L'ÉCRAN RÉPOND TOUT DE SUITE, la base suit — et si le serveur
    //  refuse, on remet chaque cœur comme il était.
    for (const id of ids) definir("photo", id, suivant);
    if (suivant) setPulse(true);
    void ecrireFavorisEnSerie(ids, suivant).then((ok) => {
      if (!ok) for (const id of ids) definir("photo", id, !suivant);
    });
  }

  if (ids.length === 0) return null;

  return (
    <button
      type="button"
      onClick={basculer}
      onAnimationEnd={() => setPulse(false)}
      aria-pressed={enregistree}
      aria-label={
        enregistree
          ? `Retirer la série ${label} de ma sélection`
          : `Enregistrer la série ${label}`
      }
      title={enregistree ? "Série enregistrée" : "Enregistrer la série"}
      className={`h-10 w-10 relative z-10 inline-flex items-center justify-center
                  transition-transform active:scale-95
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${pulse ? "rw-coeur-anime" : ""}`}
    >
      <IconeCoeur
        taille={22}
        classe={`[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.55))] ${
          enregistree ? "fill-white text-white" : "fill-none text-white"
        }`}
      />
    </button>
  );
}
