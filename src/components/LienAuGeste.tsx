"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RideauDePageTexte } from "@/components/RideauDePageTexte";

/**
 * UN LIEN QUI PRÉCHARGE AU GESTE, ET QUI TIRE LE RIDEAU AU CLIC
 * ==================================================================
 * ██ nº 811 — POURQUOI CE LIEN EXISTE ██
 * Les trois liens du pied de page (About, Contact, Legal) ne
 * préchargent plus rien depuis la nº 793 : sur CHAQUE page vue, ils
 * partaient chercher leurs pages à l'avance, plusieurs fois chacun —
 * quatorze requêtes pour trois pages qu'on ouvre une fois dans sa vie.
 * Cette décision du propriétaire TIENT : un lien de ce pied de page ne
 * demande rien à l'entrée dans la vue (mesuré au banc : 0 requête sur
 * quatre pages vues, pied de page à l'écran).
 *
 * MAIS SANS RIEN EN RÉSERVE, LE RIDEAU D'UNE PAGE NE TOMBE PAS. Mesuré
 * au banc de la nº 811, réseau ralenti de 700 ms : le rideau d'une page
 * (`loading.tsx`) ne peut se peindre que si le routeur tient déjà sa
 * coquille ; sinon il attend TOUT le flux, et au clic rien ne bouge
 * pendant l'aller-retour (page d'un coup à 760 ms, rideau jamais vu).
 *
 * DEUX RÉPONSES, SELON LE GESTE :
 *  1. AU POINTEUR (souris, stylet) ET AU CLAVIER — le modèle documenté
 *     par Next (« Hover-triggered prefetch », guide `prefetching`) :
 *     `prefetch={false}` tant que le visiteur n'a rien montré ; au
 *     premier survol ou focus, `prefetch={null}` rend au `<Link>` sa
 *     conduite normale et lui seul précharge (mesuré : trois requêtes,
 *     une fois ; un second survol n'en refait aucune). La page entière
 *     est alors en réserve : au clic elle paraît en 74-84 ms, sans
 *     requête — mieux qu'un rideau.
 *  2. AU DOIGT — il n'existe AUCUN geste avant le clic : le préchargement
 *     lancé au toucher part APRÈS la navigation (mesuré : trois
 *     requêtes pour rien, derrière celle de la page). Donc pas de
 *     préchargement au doigt (`pointerType === "touch"` ignoré, et le
 *     focus qu'Android pose au tap aussi : seul le focus CLAVIER,
 *     `:focus-visible`, compte). À la place, LE RIDEAU EST TIRÉ AU CLIC :
 *     `useLinkStatus` (déjà employé par « Voir plus », nº 422) dit que la
 *     navigation est en cours, et `RideauAuClic` peint alors, par-dessus
 *     la page, le MÊME rideau que le `loading.tsx` de ces pages — la
 *     barre, un corps vide. La page suivante l'efface en arrivant.
 *
 * ⚠️ LE DÉLAI DE 120 MS AVANT LE RIDEAU : une page en réserve arrive
 * en moins de 100 ms (mesuré) — rien ne doit clignoter dans ce cas. Le
 * rideau ne se montre que si l'attente dure, comme le recommande Next
 * pour tout indicateur de navigation.
 * ⚠️ LE RIDEAU AU CLIC EST PUREMENT VISUEL (`aria-hidden`) : la page
 * réelle reste dessous, le routeur annonce lui-même le changement de
 * page ; son contenu ne reçoit aucun pointeur, et le voile absorbe les
 * clics pour qu'aucun n'atteigne ni la page dessous ni ce lien.
 * ⚠️ RESTE UN VRAI `<Link>` : clic du milieu, nouvel onglet, `href`
 * lisible par les robots — rien ne change pour eux.
 */
const DELAI_AVANT_RIDEAU_MS = 120;

export function LienAuGeste({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [vise, setVise] = useState(false);
  const viser = () => setVise(true);

  return (
    <Link
      href={href}
      prefetch={vise ? null : false}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") viser();
      }}
      onFocus={(e) => {
        //  Le focus posé par un tap (Android) n'est pas « visible » ;
        //  celui du clavier l'est. Navigateur sans `:focus-visible` :
        //  on précharge, c'est le moindre mal.
        let clavier = true;
        try {
          clavier = e.currentTarget.matches(":focus-visible");
        } catch {
          clavier = true;
        }
        if (clavier) viser();
      }}
      className={className}
    >
      {children}
      <RideauAuClic />
    </Link>
  );
}

/** Le rideau tiré au clic — voir la note du fichier. Rend `null` tant
    que la navigation n'attend pas : rien au serveur, rien à
    l'hydratation. */
function RideauAuClic() {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);
  //  La navigation n'attend plus : le rideau part au rendu même (état
  //  ajusté pendant le rendu, le motif React pour suivre une valeur
  //  reçue — pas un effet, qui laisserait une image de trop).
  if (!pending && visible) setVisible(false);

  useEffect(() => {
    if (!pending) return;
    const minuterie = setTimeout(
      () => setVisible(true),
      DELAI_AVANT_RIDEAU_MS
    );
    return () => clearTimeout(minuterie);
  }, [pending]);

  if (!visible) return null;

  return createPortal(
    <div
      data-rideau-au-clic=""
      aria-hidden="true"
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[60] flex flex-col
                 bg-sombre-fond text-sombre-texte"
    >
      <div className="flex flex-1 flex-col pointer-events-none">
        <RideauDePageTexte />
      </div>
    </div>,
    document.body
  );
}
