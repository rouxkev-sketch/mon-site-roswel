"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
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
 *
 * ██ nº 815 — LES ACCÈS AU COMPTE DE LA BARRE PASSENT PAR ICI, ET LA
 * PAGE QU'ON QUITTE S'EFFACE SOUS LE RIDEAU ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE, POUR LA TROISIÈME FOIS (nº 812, 813,
 * 815) : sur son iPhone, en passant de l'accueil à la page de
 * connexion, des MORCEAUX DES LÉGENDES DE CARTES de l'accueil
 * (« 28 portfolios »…) restent visibles, coupés, au milieu et en bas
 * de la page de connexion. La nº 813 a tué une cause réelle et mesurée
 * (la réserve de hauteur qui suivait la navigation) ; le banc de la
 * nº 815, rejoué sur le parcours exact (accueil défilé → accès au
 * compte), ne trouve plus RIEN dans le DOM de la connexion : aucune
 * légende, aucune réserve, position 0 dès la première image, document
 * à sa hauteur. Ce qui reste n'est donc pas dans le document : c'est
 * dans ce que WebKit GARDE PEINT. iOS peint par tuiles et ne
 * re-rasterise que ce qui a changé ; au basculement, l'ancienne page
 * est retirée d'un coup et la nouvelle, plus courte, laisse des zones
 * vides — et des morceaux de l'ancienne peinture (les légendes, sans
 * leurs images, qui vivaient dans d'autres couches) y survivent le
 * temps que WebKit repeigne. (WebKit n'est pas installable dans
 * l'atelier — dépôt bloqué ; Chromium ne montre pas l'artefact.)
 * CE QUI CHANGE, ET POURQUOI C'EST SÛR QUEL QUE SOIT LE DÉTAIL :
 *  · les deux accès au compte de la barre (l'icône du doigt, la
 *    capsule du web) deviennent ce lien : au clic, le rideau se tire
 *    (la page de connexion répond au clic, comme About/Legal/Contact
 *    depuis la nº 811 — elle ne répondait pas : rien ne bougeait le
 *    temps de l'aller-retour) ;
 *  · ET, TANT QUE LE RIDEAU EST TIRÉ, LA PAGE QU'ON QUITTE S'EFFACE
 *    (`html[data-rideau-tire]` → `main` et `footer` en
 *    `visibility: hidden`, globals.css). Elle est déjà couverte, rien
 *    ne se voit ; mais le navigateur, lui, REPEINT ses tuiles avec le
 *    fond nu AVANT le basculement — quand la nouvelle page arrive, ce
 *    que WebKit pourrait garder est un fond, pas des légendes. La page
 *    d'arrivée ne peut plus rien montrer de l'ancienne, puisqu'il ne
 *    reste rien d'elle à montrer.
 * ⚠️ AVANT LA PEINTURE, DANS LES DEUX SENS : l'attribut est posé et
 * retiré dans un effet de mise en page — retiré pendant le commit qui
 * démonte ce lien avec l'ancienne barre, donc avant la première image
 * de la nouvelle page. Une navigation abandonnée le retire de même
 * (le rideau part, l'attribut avec).
 * ⚠️ LES AUTRES ATTRIBUTS DU LIEN (`aria-label`, `title`, `style`,
 * `data-…`) passent tels quels au `<Link>` : c'est ce qui permet aux
 * accès au compte de garder leurs étiquettes, leurs boîtes et leurs
 * marqueurs (l'amorti du compte, nº 357/439, lit `data-acces-compte`).
 */
const DELAI_AVANT_RIDEAU_MS = 120;

type AttributsDuLien = Omit<
  React.ComponentProps<typeof Link>,
  "href" | "prefetch" | "onPointerEnter" | "onFocus" | "className" | "children"
>;

export function LienAuGeste({
  href,
  className,
  children,
  ...reste
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & AttributsDuLien) {
  const [vise, setVise] = useState(false);
  const viser = () => setVise(true);

  return (
    <Link
      {...reste}
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

  //  nº 815 — la page qu'on quitte s'efface sous le rideau (voir la
  //  note du fichier) : posé et retiré AVANT la peinture.
  useLayoutEffect(() => {
    if (!visible) return;
    document.documentElement.setAttribute("data-rideau-tire", "");
    return () => document.documentElement.removeAttribute("data-rideau-tire");
  }, [visible]);

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
