/* eslint-disable @next/next/no-img-element --
   icônes déposées par le propriétaire (versions rognées de la
   nº 231), affichées telles quelles. */

/**
 * L'ICÔNE D'UN RÉSEAU SUR SON DISQUE BLANC — L'UNIQUE ÉCRITURE
 * ==================================================================
 * (passe nº 235-§2)
 *
 * Les fiches (ContenuFiche) et le pied de page (layout du groupe
 * tatouage) montraient chacun leur propre version — le pied servait
 * encore le fichier NON rogné, sans disque, en `invert`. Deux
 * écritures divergent toujours à la passe suivante : il n'en reste
 * qu'une, ici.
 *
 * LES TAILLES (nº 235-§1) : disque blanc de 22 px, glyphe de 21 — le
 * liseré fait 0,5 px, un seul pixel physique sur un écran à haute
 * densité, la ligne la plus fine qui se rende proprement. (Sur un
 * écran à densité simple, un demi-pixel CSS s'anticrène en une frange
 * plus claire — c'est la limite physique de cette finesse, elle est
 * dite dans le compte rendu de la passe.)
 * `object-contain` : le glyphe n'est jamais rogné ; le fichier est
 * carré et son dessin touche les bords (rognage de la nº 231), le
 * centrage est donc exact par construction.
 *
 * SANS `"use client"` : aucun état, aucun crochet — le composant sert
 * aussi bien le pied de page (serveur) que la fiche (client).
 */
export function IconeReseauSurDisque({ fichier }: { fichier: string }) {
  return (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white">
      <img
        src={fichier}
        alt=""
        width={21}
        height={21}
        className="h-[21px] w-[21px] object-contain"
      />
    </span>
  );
}
