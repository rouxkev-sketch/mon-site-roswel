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
 *  · TIKTOK — une MASSE PLEINE (`fill`, nº 241-§2) : le glyphe ne se
 *    rend pas au trait, la note au contour de la nº 240 ne se lisait
 *    pas. Gardé : tête ronde pleine, hampe droite, fanion recourbé
 *    vers la droite en haut — la courbe épaisse qui signe le logo.
 *    Retiré : l'écho de couleur cyan/magenta. Le poids d'encre est
 *    égalisé sur Instagram par la TAILLE de dessin (~15/24 contre
 *    17/24), jamais en affinant la masse.
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
      {/*  §2 (nº 241) — EN SURFACE PLEINE, ET C'EST STRUCTUREL : le
           glyphe TikTok est une MASSE, un trait de 1,8 ne peut pas le
           rendre — la note au contour de la nº 240 ne se lisait pas.
           Ce qui le fait reconnaître, conservé : la tête ronde pleine
           en bas à gauche, la hampe droite à sa droite, et le FANION
           qui se recourbe franchement vers la droite en haut — c'est
           cette courbe épaisse qui signe le glyphe.
           ⚠️ LE POIDS D'ENCRE : une masse pleine paraît toujours plus
           lourde qu'un contour à surface égale — on compense par la
           TAILLE DE DESSIN, jamais en affinant la masse. Mesuré aux
           pixels rendus contre Instagram : une masse à ~la moitié de
           l'encre BRUTE d'un contour se lit déjà aussi lourde que lui
           (l'aplat est concentré, le contour dispersé) — relevé au
           banc : 934 px² contre 2000, rapport 0,47, boîte de ~16,6 px
           sous les 17,2 d'Instagram.
           `fill="currentColor"` : monochrome, la couleur du texte. */}
      <path
        fill="currentColor"
        transform="translate(3.7 3.6) scale(1.04)"
        d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389
           13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1
           1-5-5v2a3 3 0 1 0 3 3V0Z"
      />
    </svg>
  );
}

/**
 * LE CALENDRIER DU BOOKING (nº 273-§1) — l'état des carnets parle de
 * TEMPS, pas de feu de circulation : les trois ronds de la nº 270
 * (vert, gris clair, gris foncé) sont partis. À leur place, CETTE
 * icône — LA MÊME pour les trois états, sans variante : c'est le MOT
 * qui dit l'état (« Books open », « Books open • 5-month wait »,
 * « Books closed »), l'icône dit seulement de quoi on parle — la
 * disponibilité, ce que le mot seul ne dit pas à l'œil qui balaie.
 * Même écriture que ses voisines : trait 1,8 sur la grille de 24,
 * `currentColor` — elle prend le gris doux du libellé à côté duquel
 * elle vit, sans un seul réglage. Tout en CONTOUR : les icônes de la
 * liste des liens n'ont ni aplat ni fond.
 *
 * ██ §2 (nº 870) — ELLE REVIENT, ET AVEC ELLE LA LIGNE D'AVANT ██
 * La nº 869 l'avait remplacée par un POINT de couleur dans le bloc du
 * nom, et retirée du dépôt faute de lecteur. Le propriétaire tranche :
 * plus de point, l'icône revient — au même dessin, au pixel, celui que
 * la nº 868 servait encore (repris de son fichier tel quel).
 */
export function IconeCalendrier({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/*  Le corps, en contour — mêmes proportions qu'Instagram. */}
      <rect
        x="3.4"
        y="5"
        width="17.2"
        height="15.6"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/*  Les deux anneaux, au-dessus du corps. */}
      <path
        d="M8.2 3v3.4M15.8 3v3.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/*  La ligne du bandeau — le trait qui fait lire « calendrier ». */}
      <path d="M3.4 10h17.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/*  ⛔ L'ÉTOILE (nº 488 → nº 868) N'EST PLUS ICI : les lignes de badges
    d'un profil (styles, techniques) n'ouvrent plus sur une icône depuis
    la nº 869-§1 — texte seul, contour, gris. Le dessin n'avait plus de
    lecteur (l'étoile des notifications est celle d'Icones.tsx), il est
    parti avec la nº 869 (règle nº 386). */

/*  ⛔ §6 (nº 868) — LE DIAMANT A QUITTÉ LE DÉPÔT. Il ouvrait la ligne
    des TECHNIQUES d'un profil depuis la nº 489 ; le propriétaire y met
    désormais l'ÉTOILE (et la GOUTTE sur les styles). Son unique lecteur
    parti, le dessin s'en va avec lui — une écriture sans lecteur est un
    piège pour la passe suivante (règle nº 386). Il est dans git si le
    jour vient de le rappeler. */


/**
 * §3 (nº 388) — LA LOCALISATION, POUR LA LIGNE DE L'ADRESSE.
 * ==================================================================
 * Elle coiffe l'adresse d'un salon ou d'un studio, descendue dans la
 * série des lignes de profil. Aucun fichier ajouté au dépôt.
 *
 * MÊME TRAITEMENT QUE SES VOISINES, sans rien choisir : `fill="none"`,
 * trait de 1,8 sur la grille de 24, `currentColor`, 20 px dans la
 * boîte de 22.
 *
 * ██ LE TRACÉ EST REFAIT (passe des icônes) ██
 * ------------------------------------------------------------------
 * CE QUI N'ALLAIT PAS, ET CE N'ÉTAIT PAS UNE QUESTION DE GOÛT : les
 * deux flancs partaient des EXTRÊMES HORIZONTAUX du cercle — de son
 * point le plus à gauche et de son point le plus à droite. Le repère
 * était donc large à mi-hauteur puis rentrait d'un coup : la
 * silhouette d'une goutte retournée, exactement celle qu'`IconeGoutte`
 * portait sur la ligne voisine. Et la tête, d'un rayon de 6,4 pour une
 * boîte de 24, pesait trop lourd — 12,8 unités de large, plus de la
 * moitié du dessin.
 * ⚠️ CE QUI ALLAIT, ET QU'IL FAUT DIRE : l'anneau n'était pas en
 * cause. Il avait 1,75 px de jour, un peu PLUS que celui d'aujourd'hui
 * (1,50 px) — la tête ayant maigri, l'anneau a suivi. Le défaut était
 * la forme, pas l'espacement.
 *
 * LE TRACÉ D'AUJOURD'HUI, LE REPÈRE DE PLAN CLASSIQUE : les flancs
 * sont les DEUX TANGENTES menées depuis la pointe au cercle de la
 * tête. C'est ce qui donne sa forme au repère — des flancs droits qui
 * rejoignent la tête sans cassure, parce qu'une tangente touche le
 * cercle sans le couper. Les valeurs ne sont pas dessinées à vue,
 * elles se déduisent (tête centrée en (12 ; 9,2), rayon 5,8, pointe en
 * (12 ; 20,6)) :
 *  · les points de contact tombent en (7,01 ; 12,15) et (16,99 ; 12,15) ;
 *  · l'arc qui les relie par le haut vaut 241,2° — plus d'un
 *    demi-tour, d'où le drapeau `large-arc` à 1 ;
 *  · la pointe fait un angle de 61,2°, largement au-dessus des ~30° en
 *    dessous desquels un sommet arrondi se bouche à 20 px.
 * L'encre va de y = 2,5 à y = 21,5 : elle est centrée dans la boîte.
 *
 * ⚠️ L'ANNEAU EST RÉGLÉ SUR LE TRAIT : rayon 2,2 dans une tête de 5,8.
 * Le jour entre les deux cercles vaut alors 1,50 px — EXACTEMENT
 * l'épaisseur du trait — et le trou du milieu 2,17 px, soit une fois
 * et demie. C'est la règle qui tient à cette taille : en dessous d'un
 * trait de jour, deux courbes voisines se rejoignent à l'affichage et
 * l'anneau devient une pastille.
 * ⚠️ DEUX FORMES, PAS UNE DE PLUS : à 20 px, tout détail supplémentaire
 * se referme.
 */
export function IconeLocalisation({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20.6 7.01 12.15A5.8 5.8 0 1 1 16.99 12.15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.2" r="2.2" stroke="currentColor" strokeWidth="1.8" />
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

/* ==================================================================
 * LES QUATRE ICÔNES DE LA FENÊTRE PARTAGE (nº 241-§4B) — même
 * écriture que les trois du dessus : tracé 1,8 sur la grille de 24,
 * `currentColor`, aucun logo de couleur, aucun fond de marque, aucun
 * disque. Elles ne servent QU'À la fenêtre de partage sombre
 * (YokoFolio) — la fenêtre claire du produit artisans garde ses
 * icônes historiques, il n'est jamais touché.
 * ================================================================== */

export function IconePartageWhatsApp({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/*  La bulle ronde à queue, et le combiné dedans — le squelette
           du glyphe, sans son vert. */}
      <path
        d="M12 3.6a8.4 8.4 0 0 1 0 16.8 8.6 8.6 0 0 1-4-1l-4 1 1.1-3.8
           a8.4 8.4 0 0 1 6.9-13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.6c.2-.5.8-.6 1.2-.2l.8 1c.2.3.2.7 0 1l-.5.6c.5 1 1.4 1.9 2.5 2.4l.6-.5c.3-.2.7-.3 1-.1l1 .7c.5.3.4 1-.1 1.3-.7.4-1.5.5-2.2.2a8.2 8.2 0 0 1-4.4-4.3c-.3-.7-.2-1.4.1-2.1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconePartageSms({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/*  La bulle de message, trois points de conversation. */}
      <path
        d="M4 6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v7A2.8 2.8 0 0 1 17.2 16.6H9.4L5.2 20v-3.6A2.8 2.8 0 0 1 4 13.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8.8" cy="10.4" r="1" fill="currentColor" />
      <circle cx="12" cy="10.4" r="1" fill="currentColor" />
      <circle cx="15.2" cy="10.4" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconePartageEmail({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/*  L'enveloppe : le cadre, puis le rabat en V. */}
      <rect
        x="3.4"
        y="5.4"
        width="17.2"
        height="13.2"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4.6 7.4 7.4 5.6 7.4-5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconePartageFacebook({ taille = 20 }: ProprietesIconeLien) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/*  Le « f » seul, au trait — jamais le disque bleu. */}
      <path
        d="M15.5 4h-2.2A3.3 3.3 0 0 0 10 7.3V10H7.6v3H10v7h3.1v-7h2.5l.5-3h-3V7.7a.9.9 0 0 1 .9-.9h2.5V4Z"
        stroke="currentColor"
        strokeWidth="1.8"
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
