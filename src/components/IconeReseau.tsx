/**
 * LES ICÔNES DES LIENS D'UNE FICHE — dessinées dans le code
 * ==================================================================
 * (passe nº 240-§1)
 *
 * FIN DES FICHIERS D'IMAGES pour ces trois liens : `icone-instagram`,
 * `icone-tiktok` et `site.png` ne sont plus servis, leurs versions
 * rognées (nº 231) non plus, et LE DISQUE BLANC EST PARTI AVEC EUX —
 * toute la mécanique du liseré des passes 231 à 235 n'avait d'objet
 * que parce que ces fichiers étaient dessinés pour un fond noir.
 *
 * LES TROIS RÈGLES, non négociables :
 *  1. MONOCHROMES, EN `currentColor` : aucune couleur écrite dans le
 *     tracé — l'icône prend AUTOMATIQUEMENT la couleur du texte qui
 *     l'accompagne (le gris doux des liens de fiche, le gris du pied
 *     de page, leurs survols) ;
 *  2. MÊME POIDS OPTIQUE que le titre à côté : trait de 1,8 sur une
 *     grille de 24 — l'épaisseur de toutes les icônes du site
 *     (IconeMonde, IconeCloche…), accordée à la graisse des libellés ;
 *  3. UNE SEULE ÉCRITURE, partagée par les fiches ET le pied de page
 *     (`IconeDuLien`) — les deux endroits ne peuvent pas diverger.
 * Aucun disque, aucun contour, aucun fond derrière elles.
 *
 * CE QUE CHAQUE DESSIN SIMPLIFIE, dit franchement :
 *  · INSTAGRAM — le glyphe officiel tel quel : carré aux angles
 *    arrondis, cercle, point. Rien à retirer, il est déjà monochrome.
 *  · TIKTOK — la note du logo est un ruban à double décalage de
 *    couleur, illisible en monochrome à 20 px. RETIRÉ : l'écho de
 *    couleur (le double contour cyan/magenta) et l'épaisseur variable
 *    du ruban. GARDÉ : une note de musique franche — tête ronde,
 *    hampe, fanion courbe — le squelette que le logo stylise.
 *  · LIEN LIBRE — le MAILLON (deux anses obliques, l'icône « lien »
 *    classique) : à 20 px, il reste net là où la flèche qui sort d'un
 *    cadre devient une bouillie de petits traits. C'est lui qu'on
 *    sert, sur les deux champs (site et page de liens).
 */

type ProprietesIconeLien = { taille?: number };

export function IconeInstagram({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3.4"
        y="3.4"
        width="17.2"
        height="17.2"
        rx="5.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      {/*  Le point : PLEIN, comme sur le glyphe officiel — un point
           tracé en contour ne serait qu'un anneau flou à cette taille.
           `fill: currentColor` reste monochrome. */}
      <circle cx="17.1" cy="6.9" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function IconeTikTok({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {/*  La note : tête ronde en bas à gauche, hampe, fanion qui
           s'évase à droite — l'ordre de lecture du logo, sans son
           double contour. */}
      <circle cx="8.4" cy="17.2" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M11.4 17.2V4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.4 4.6c.5 3.1 2.9 5.2 6.2 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeLienLibre({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {/*  Le maillon « lien » classique : deux anses à 45°. */}
      <path
        d="M10.2 13.8a4.5 4.5 0 0 0 6.8.5l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 10.2a4.5 4.5 0 0 0-6.8-.5l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * L'ÉCRITURE PARTAGÉE — les fiches et le pied de page passent par ICI,
 * et par rien d'autre. `reseau` nomme le lien, le composant choisit le
 * tracé ; la couleur, elle, vient TOUJOURS du texte d'à côté.
 */
export function IconeDuLien({
  reseau,
  taille = 20,
}: {
  reseau: "instagram" | "tiktok" | "site";
  taille?: number;
}) {
  if (reseau === "instagram") return <IconeInstagram taille={taille} />;
  if (reseau === "tiktok") return <IconeTikTok taille={taille} />;
  return <IconeLienLibre taille={taille} />;
}
