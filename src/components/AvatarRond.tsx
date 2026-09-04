import { PORTRAIT_ROND } from "@/config/tatouage";
import { AVATAR_PETIT, sourceAvatar } from "@/lib/avatar-variantes";

/**
 * ██ LE ROND DE PROFIL DE 40 PIXELS, ÉCRIT UNE SEULE FOIS — nº 841 ██
 * ==================================================================
 * La photo de profil d'un tatoueur dans un rond de quarante pixels, ou
 * son INITIALE quand il n'en a pas déposé (le repli des fiches d'avant
 * la photo de profil, comme partout sur le site).
 *
 * POURQUOI CE FICHIER EXISTE : ce rond était écrit DEUX FOIS, à la
 * main — sous la photo d'une carte du web (CarteTatoueur) et sur la
 * plaque du profil au doigt (FicheTatoueur) — et il avait déjà
 * divergé d'un cran : la plaque pose son rond sur `bg-sombre-haut`
 * avec une initiale de 16 px, la carte sur `bg-sombre-eleve` avec une
 * initiale de 13 px. La carte du FIL mobile (nº 841) en voulait un
 * troisième, à l'écriture de la plaque. Le troisième consommateur
 * extrait (c'est la règle du site, nº 276) : AUCUNE valeur n'est
 * choisie ici, chaque porteur garde LA SIENNE — le fond et la taille de
 * l'initiale sont des paramètres, le reste est commun.
 *
 * ⚠️ LA PETITE VARIANTE DE L'IMAGE (nº 718) : ce rond fait 40 px, il
 * n'a jamais eu besoin des 800 de l'original — `sourceAvatar` sert la
 * variante de 160, et rend telle quelle une photo d'avant la nº 718.
 * ⚠️ LES DIMENSIONS DÉCLARÉES sont celles de `PORTRAIT_ROND` (le
 * carré du site) : elles ne disent que le FORMAT — c'est la classe qui
 * dimensionne, à 40 px, et un carré reste un carré.
 */
export function AvatarRond({
  photo,
  nom,
  classeFond,
  classeInitiale,
  paresseux = false,
  classe = "",
}: {
  photo: string | null | undefined;
  nom: string;
  /** Le fond du rond — le jeton du porteur (piège nº 389 : une seule
      classe de fond, celle-ci). */
  classeFond: string;
  /** La taille (et la graisse) de l'initiale de repli — le porteur la
      donne, avec sa couleur. */
  classeInitiale: string;
  /** `true` sous une carte de mosaïque (une image parmi vingt-quatre,
      différée) ; `false` sur une plaque en tête de page. */
  paresseux?: boolean;
  /** Ce que le porteur ajoute au rond (un masquage d'appareil, par
      exemple) — jamais un second fond ni une seconde taille. */
  classe?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center
                  overflow-hidden rounded-full ${classeFond} ${classe}`}
    >
      {photo ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={sourceAvatar(photo, AVATAR_PETIT)}
          alt=""
          loading={paresseux ? "lazy" : undefined}
          decoding="async"
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className={classeInitiale}>
          {nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
