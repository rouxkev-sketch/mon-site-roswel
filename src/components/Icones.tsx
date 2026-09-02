/**
 * ICÔNES DU SITE (vectorielles, dessinées dans le code)
 * -----------------------------------------------------
 * - Les 3 icônes du menu (favoris, messages, compte), traits fins
 *   et modernes.
 * - Les icônes des modules de l'accueil : G de Google, appareil
 *   photo Instagram, sceau bleu vérifié — recréées fidèlement en
 *   vectoriel (nettes à toutes les tailles).
 */

import type { ReactElement } from "react";

/**
 * ██ §3 (nº 664) — `trait` : L'ÉPAISSEUR, QUAND ELLE DOIT ÊTRE TENUE ██
 * ==================================================================
 * TOUTES CES ICÔNES SONT DESSINÉES DANS UNE `viewBox` DE 24, avec un
 * trait de 1,8 — c'est-à-dire 1,8 UNITÉ DE DESSIN, pas 1,8 pixel. Le
 * navigateur met le dessin à l'échelle de `taille` : à 24 px le trait
 * rend 1,8 px, à 18 px il n'en rend plus que 1,35. LA MÊME FAMILLE
 * D'ICÔNES CHANGE DONC DE GRAISSE SELON SA TAILLE, et c'est ce que le
 * propriétaire voit quand la même coche paraît plus maigre dans la
 * liste des notifications que dans la fenêtre de validation.
 * CE PARAMÈTRE EXISTE POUR CORRIGER ÇA, et pour rien d'autre : celui
 * qui affiche une icône à une taille inhabituelle peut demander
 * l'épaisseur en unités de dessin qui rendra le PIXEL qu'il veut
 * (voir `traitPourTaille` dans PastilleEvenement.tsx).
 * ⚠️ LE DÉFAUT RESTE 1,8, ET C'EST DÉLIBÉRÉ : les quelque cent
 * emplois du site n'en passent aucun et ne bougent donc pas d'un
 * cheveu. Seule la famille des pastilles d'événement s'en sert.
 * ⚠️ IL N'EST BRANCHÉ QUE SUR LES NEUF ICÔNES DE CETTE FAMILLE
 * (horloge, coche, hors ligne, drapeau, croix, cœur, cloche,
 * corbeille, enveloppe) : les autres l'accepteraient sans effet, ce
 * qui serait pire que de ne pas l'accepter du tout.
 */
export type ProprietesIcone = {
  taille?: number;
  classe?: string;
  trait?: number;
};

/** Une icône de la famille : elle sait se dessiner à une taille et à
    une épaisseur données. C'est ce que `PastilleEvenement` reçoit —
    LE COMPOSANT, pas son rendu : la pastille est seule à décider de
    la taille, et elle ne peut pas la décider sur du JSX déjà fait. */
export type ComposantIcone = (proprietes: ProprietesIcone) => ReactElement;

/**
 * §1 (nº 250) — LES ÉTATS DU ROND DES ICÔNES DE LA BARRE, écrits UNE
 * FOIS : loupe, globe, fanion, compte (les deux visages du compte
 * compris) et le bouton de filtres du moteur.
 *  · WEB : le cercle gris au survol.
 *  · SMARTPHONE : il n'y a pas de survol au doigt — l'équivalent est
 *    l'état ENFONCÉ : LE MÊME cercle gris apparaît sous le doigt
 *    (`active:`) et repart au relâchement ; il ne reste jamais
 *    affiché. Même géométrie des deux côtés : le rond de 40
 *    (HAUTEUR_ACTIONS) et son `rounded-full`, déjà partagés.
 *
 * ██ §2 (nº 507) — LE ROSE DU SURVOL EST RETIRÉ ██
 * ------------------------------------------------------------------
 * LA nº 254-§6 faisait passer LE GLYPHE au rose en même temps que le
 * cercle gris apparaissait, et l'appelait « la seule exception rose de
 * la barre ». Le propriétaire la supprime : au survol comme sous le
 * doigt, il ne reste QUE LE CERCLE GRIS — le jeton `bg-sombre-eleve`,
 * déjà là, aucune couleur nouvelle. Le glyphe garde la couleur de son
 * bouton, sans exception.
 * ⚠️ CE QUE CE RETRAIT ALIGNE, d'un seul coup : la loupe, le fanion,
 * la silhouette du déconnecté, les deux boutons de « Mon espace » et
 * le bouton de filtres du moteur portaient tous CETTE constante — ils
 * suivent donc ensemble. Le GLOBE, lui, ne la portait pas (il avait sa
 * propre écriture, grise et sans état enfoncé) : il la reprend à la
 * nº 507 pour que la barre n'ait plus qu'UNE seule écriture.
 * ⚠️ ET LE COMPTE CONNECTÉ RESTE ROSE : sa silhouette porte
 * `text-primaire` AU REPOS (MenuEspace) — c'est l'état connecté que la
 * charte peint, pas un survol. Rien ne change pour elle ; elle cesse
 * seulement de porter deux fois la même couleur (règle nº 389).
 */
export const ETATS_ROND_BARRE =
  "hover:bg-sombre-eleve active:bg-sombre-eleve";

/* ============ Icônes du menu (trait fin) ============ */

/**
 * ██ §3 (nº 672) — L'ÉTOILE — le symbole de la bienvenue ██
 * ==================================================================
 * TROISIÈME SYMBOLE À CETTE PLACE, ET LE PROPRIÉTAIRE TRANCHE. La
 * nº 667 y avait mis le FICHIER de la marque (`yokofolio-icone.png`) —
 * refusé, et la mesure lui donnait raison : une image ne peut pas
 * hériter de la couleur de sa pastille, elle rendait 2,10:1. La nº 668 y
 * a dessiné une MAIN QUI SALUE — refusée à son tour. Il demande une
 * ÉTOILE, dorée sur un cercle presque noir. Le composant de la main est
 * SUPPRIMÉ avec ce remplacement (elle n'avait qu'un appelant, et le code
 * mort est la façon la plus sûre de faire revenir un dessin qu'on ne
 * veut plus — la leçon de la nº 467 sur `IconeWorld`).
 *
 * COMMENT ELLE EST TRACÉE, ET TOUT SE CALCULE :
 *  · UN PENTAGRAMME RÉGULIER, cinq branches. Les sommets extérieurs sont
 *    sur un cercle de rayon 8,6 tous les 72°, la première pointe en
 *    haut ; les cinq creux sont sur un cercle de rayon 3,285 —
 *    8,6 × sin 18° / sin 126°, le rapport exact d'une étoile régulière.
 *    Aucun point n'est placé à l'œil.
 *  · CENTRÉE POUR L'ŒIL, PAS POUR LE COMPAS. Une étoile pointe en haut
 *    descend moins bas (0,809 R) qu'elle ne monte (R) : centrer le
 *    CERCLE la ferait paraître trop haute. Le centre est donc posé à
 *    12,82 — la valeur qui met le MILIEU DU DESSIN sur celui de la
 *    boîte. VÉRIFIÉ AU BANC (getBBox, trait compris) : 3,22 de marge en
 *    haut, 3,22 en bas. Exactement centrée.
 *  · ELLE PÈSE CE QUE PÈSENT SES VOISINES : le tracé mesure 16,36 ×
 *    15,56 dans le repère de 24 ; trait compris, 18,36 × 17,56 à la
 *    taille de la liste — là où la main faisait 16,9 × 18,4 et
 *    l'horloge 19. Elle ne domine pas la famille.
 * ⚠️ ELLE EST CREUSE, comme les neuf autres — un contour, jamais un
 * aplat : c'est ce qui fait qu'elle porte le même trait qu'elles.
 * ⚠️ LES JONCTIONS SONT ARRONDIES (`strokeLinejoin="round"`), ce qui est
 * la demande « extrémités arrondies » appliquée à un tracé FERMÉ : il
 * n'a pas d'extrémité, il n'a que des pointes. Elles s'émoussent donc
 * exactement comme les bouts de la coche.
 * ⚠️ LE `trait` EST CELUI DE LA FAMILLE, comme partout : rien n'est
 * écrit en dur, la pastille décide (voir PastilleEvenement).
 *
 * ██ nº 811 — REDESSINÉE, AVEC LES NEUF AUTRES SYMBOLES DES PASTILLES ██
 * Le propriétaire redemande les dix dessins de la famille d'un seul
 * trait, le mien. L'étoile reste une étoile régulière à cinq branches
 * (pointe en haut, creux calculés, jamais placés à l'œil), mais PLUS
 * PLEINE : le rapport des rayons passe de 0,382 (le pentagramme
 * exact, aux branches effilées) à 0,42 — les creux remontent, les
 * branches s'élargissent, l'étoile se lit d'un coup dans un rond de
 * 36 px. Rayon extérieur 8,4 ; centre posé à 12,8 pour que le MILIEU
 * DU DESSIN (4,4 → 19,6) tombe sur celui de la boîte : 12,0 exactement.
 */
export function IconeEtoile({
  taille = 24,
  classe = "",
  trait = 1.8,
}: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      {/*  Pointe haute, puis creux et pointes en alternance dans le sens
           des aiguilles d'une montre (R = 8,4 · r = 3,528 · centre 12,8). */}
      <path
        d="M12 4.4 14.07 9.95 19.99 10.2 15.36 13.89 16.94 19.6
           12 16.33 7.06 19.6 8.64 13.89 4.01 10.2 9.93 9.95Z"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeCoeur({ taille = 24, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 20.5C7.5 17.2 3.5 13.9 3.5 9.9 3.5 7 5.7 5 8.2 5c1.6 0 3 .8 3.8 2.1C12.8 5.8 14.2 5 15.8 5c2.5 0 4.7 2 4.7 4.9 0 4-4 7.3-8.5 10.6Z"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * LE FANION — « MA SÉLECTION » (passe nº 145-§3)
 * ----------------------------------------------
 * Le signet que l'on pose sur ce qu'on veut retrouver. Il remplaçait le
 * cœur AUX DEUX ENDROITS QUI DÉSIGNENT LA PAGE : l'entrée « Ma
 * sélection » de la fenêtre « Mon compte », et l'icône de la barre
 * fixe.
 *
 * ⚠️ ET DEPUIS LA nº 364, IL LES REMPLACE TOUS — décision du
 * propriétaire, qui renverse la borne posée ici à la nº 145-§3 (« il ne
 * remplace pas le cœur des photos ni des fiches »). Le geste et
 * l'endroit portent le MÊME signe : enregistrer, c'est ranger dans sa
 * sélection. Un seul appelant le choisit pour tout YOKOFOLIO —
 * `BoutonCoeurPhoto` (cartes, fiches, fenêtres, « Ma sélection ») ;
 * personne ne redessine ce tracé ailleurs.
 * (Le produit artisans n'était pas concerné : son en-tête et son
 * bouton de favori gardaient leur cœur. Il est parti à la nº 760.)
 *
 * Dessiné comme les autres : trait de 1.8, viewBox de 24, angles
 * arrondis — un rectangle ouvert en bas, échancré en V.
 */
export function IconeFanion({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4.4L5.5 19.5v-14a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * LA SILHOUETTE DU COMPTE — SANS CERCLE (passe nº 147-§5)
 * --------------------------------------------------------
 * L'icône de compte de la barre de YOKOFOLIO : la silhouette seule,
 * qui occupe tout le cadre — même hauteur rendue que le globe et le
 * fanion. `IconeUtilisateur` (la version encerclée) reste telle
 * quelle : elle sert le produit artisans et le pictogramme
 * « à domicile » des fiches, qu'on ne touche pas.
 */
export function IconeSilhouette({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="7.6" r="3.8" stroke="currentColor" strokeWidth="1.8" />
      {/*  ⚠️ LE TORSE EST FERMÉ (nº 150-§6) : le `Z` referme le tracé
           par une ligne droite à sa base — la courbe ne reste plus
           ouverte vers le bas. */}
      <path
        d="M4.6 20.2c1.4-4.3 4-6.4 7.4-6.4s6 2.1 7.4 6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * LE TRIANGLE PLEIN DU COMPTE (passe nº 147-§4) — l'indicateur posé à
 * droite de la silhouette, sur le web : pointe en BAS fermé, et la
 * ROTATION le retourne vers le HAUT quand la fenêtre est ouverte.
 * Affiché en 14 (le glyphe fait ~8 px dedans) : un rang de l'échelle.
 */
export function IconeTrianglePlein({ taille = 14, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path d="M12 16.2 5.4 8.6h13.2Z" fill="currentColor" />
    </svg>
  );
}

export function IconeUtilisateur({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9.8" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 18.2c1-2.3 3-3.6 5.5-3.6s4.5 1.3 5.5 3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * ██ §1 (nº 533) — AJOUTER UN PORTFOLIO ██
 * ==================================================================
 * C'EST `IconeUtilisateur`, ET RIEN D'AUTRE — le même cercle de rayon
 * 8,5 centré sur (12 ; 12), la même tête, les mêmes épaules, la même
 * épaisseur de trait. Deux différences, et deux seulement :
 *  · LE CERCLE N'EST PAS REFERMÉ EN HAUT À DROITE : il est dessiné de
 *    −5° à −85° en moins — un vide de 80° centré sur la diagonale
 *    (54° à la nº 533 : le plus y était à l'étroit) ;
 *  · UN « + » se loge dans ce vide, LONG DE 6 (4,4 à la nº 533) et du
 *    même trait que le reste. Il est posé sur la diagonale à −45°,
 *    mais un peu PLUS LOIN QUE LA CIRCONFÉRENCE — en (18,5 ; 5,5), à
 *    9,2 du centre au lieu de 8,5. Mesuré : posé pile sur le cercle,
 *    sa pointe gauche passait à moins d'un demi-point du bord de la
 *    TÊTE (qui, trait compris, s'étend jusqu'à 15,5) — à l'œil, les
 *    deux se touchaient. Décalé, il en reste à plus d'un point, et
 *    ses trois autres pointes gardent près de six points d'écart avec
 *    les deux extrémités du tracé interrompu.
 * C'est le motif que tout le monde connaît : l'objet, et un plus qui
 * dit « en créer un nouveau ». Le lecteur reconnaît le portfolio AVANT
 * de lire le mot.
 * ⚠️ POURQUOI PAS `IconePlus` POSÉE À CÔTÉ : elle serait une seconde
 * icône dans la boîte, avec sa propre taille et son propre centrage.
 * Ici le plus fait PARTIE du dessin — il naît à l'échelle du cercle,
 * quelle que soit la taille demandée.
 */
export function IconeAjouterPortfolio({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      {/*  Le contour, ouvert : de −5° au tour complet moins 80°. */}
      <path
        d="M20.47 11.26A8.5 8.5 0 1 1 12.74 3.53"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="9.8" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 18.2c1-2.3 3-3.6 5.5-3.6s4.5 1.3 5.5 3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/*  Le « + », dans l'ouverture. */}
      <path
        d="M18.5 2.5v6M15.5 5.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeTelephone({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M7.1 4.2 9 4c.5 0 .9.3 1.1.7l1.2 2.9c.2.4.1.9-.3 1.2l-1.5 1.3c1 2 2.6 3.6 4.6 4.6l1.3-1.5c.3-.4.8-.5 1.2-.3l2.9 1.2c.4.2.7.6.7 1.1l-.2 1.9c-.1 1-.9 1.7-1.9 1.7C10.7 18.5 5.5 13.3 5.4 6c0-.9.8-1.7 1.7-1.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** L'icône de partage iOS : une flèche vers le haut sortant d'un carré
    ouvert en bas (utilisée sur les cartes de résultats). */
export function IconePartageIOS({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      {/* La flèche : hampe + pointe */}
      <path d="M12 3v11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.3 6.4 12 2.7l3.7 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Le carré ouvert en haut (par où sort la flèche) */}
      <path
        d="M8 9.5H6.5A2.5 2.5 0 0 0 4 12v6.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V12a2.5 2.5 0 0 0-2.5-2.5H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Le rouleau de peinture (bloc « Vous êtes artisan ? » de l'accueil).
    Dessiné en `currentColor` : on le colore en gris foncé via la classe
    du parent (l'icône source du propriétaire est noire ; ici on la rend
    dans le même esprit, recolorable). */
export function IconeRouleau({ taille = 26, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      {/* La tête du rouleau (le bac de peinture) */}
      <rect x="2.5" y="4" width="13" height="6.4" rx="2" fill="currentColor" />
      {/* Le cadre : sort à droite de la tête puis redescend au centre */}
      <path
        d="M15.5 7.2h2.7A1.8 1.8 0 0 1 20 9v1.3a1.8 1.8 0 0 1-1.8 1.8H12.4A1.4 1.4 0 0 0 11 13.5V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* La poignée */}
      <rect x="9.2" y="15" width="3.6" height="6.4" rx="1.4" fill="currentColor" />
    </svg>
  );
}

/** L'icône de partage (trois nœuds reliés) */
export function IconePartage({ taille = 24, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="18.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.4 10.7 6.8-3.9M8.4 13.3l6.8 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** La petite épingle de localisation (ligne « Intervient sur… ») */
export function IconeEpingle({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 21.6c4.3-4.5 6.9-8 6.9-11.5a6.9 6.9 0 1 0-13.8 0c0 3.5 2.6 7 6.9 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** La clé de l'artisan (ligne « Métier : … » de la fiche) */
export function IconeCle({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** L'horloge (ligne « X ans d'ancienneté » de la fiche) */
/*  ██ nº 811 — L'HORLOGE, REDESSINÉE (la famille des pastilles) ██
    Un cadran de rayon 8,25 — un souffle d'air de plus dans le rond de
    36 px que le 8,7 d'avant — et deux aiguilles d'un seul trait, de
    midi au centre puis vers quatre heures (l'angle qui se lit le mieux
    comme « en attente ») ; extrémités rondes, jonction ronde. */
export function IconeHorloge({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth={trait} />
      <path
        d="M12 7.25V12l3.25 1.95"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** La coche fine des listes (communes couvertes, accordéon Zone) —
    et le symbole du SUCCÈS dans les pastilles (notifications, Contact,
    Signalement, badges cochés).
    ██ nº 811 — REDESSINÉE : un trait court qui descend (4,75 → 9,5),
    un trait long qui monte jusqu'au coin haut droit (19,25 · 7,25) —
    la coche s'ouvre davantage et pèse plus dans un rond que l'ancienne,
    dont la pointe droite s'arrêtait plus bas. Extrémités et jonction
    rondes, comme toute la famille. */
export function IconeCocheListe({ taille = 16, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M4.75 12.25 9.5 17 19.25 7.25"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Le bouclier-coche au trait (ligne « N° SIREN » de la fiche) */
/**
 * CALENDRIER AVEC COCHE — l'ancienneté de l'entreprise.
 * Bandeau supérieur PLEIN, deux petites pattes verticales qui dépassent
 * en haut (les anneaux), corps rectangulaire à coins arrondis en contour,
 * et une coche centrée à l'intérieur. Même épaisseur de trait (1,8) que
 * les autres icônes de la ligne d'infos.
 */
export function IconeCalendrierCoche({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      {/* Les deux anneaux, au-dessus du bandeau */}
      <path d="M8.5 2.4v2.2M15.5 2.4v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Le corps, en contour */}
      <rect x="3.3" y="4.3" width="17.4" height="17.3" rx="3.2" stroke="currentColor" strokeWidth="1.8" />
      {/* Le bandeau supérieur, PLEIN : il épouse exactement le haut du
          corps (mêmes coins arrondis, même origine) — il ne dépasse donc
          jamais du contour. */}
      <path
        d="M3.3 9.4V7.5a3.2 3.2 0 0 1 3.2-3.2h11a3.2 3.2 0 0 1 3.2 3.2v1.9Z"
        fill="currentColor"
      />
      {/* La coche, centrée dans le corps */}
      <path d="m8.3 15.5 2.6 2.6 4.8-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * ██ nº 753 — LE CALENDRIER NU, POUR LE ROND D'UNE PLAQUE DATÉE ██
 * ==================================================================
 * CE QU'IL DIT : « ceci a des dates » — une session guest sans lieu,
 * une présence en convention. Il fait, sur le rond gris d'une
 * plaque-info, ce que le glyphe `adresse.png` fait pour un lieu.
 *
 * POURQUOI IL EST DESSINÉ ICI, ET NON DÉPOSÉ DANS `public/` : le site
 * DESSINE ses icônes dans le code depuis la nº 240-§1, et les images
 * de `public/` sont des fichiers du propriétaire qu'aucune passe ne
 * fabrique (règle nº 356). Un SVG au trait tient les deux règles à la
 * fois, et il suit la couleur qu'on lui donne — le PNG d'adresse, lui,
 * doit être éclairci par `invert` + opacité.
 *
 * L'ALLURE EST CELLE D'`adresse.png` : un trait fin, un contour, aucun
 * aplat. ⚠️ CE N'EST PAS `IconeCalendrierCoche` (l'ancienneté d'une
 * entreprise, plus haut) : celle-là porte un bandeau PLEIN et une
 * coche — un dessin plus lourd, et qui dit autre chose. Ici, la grille
 * du mois est suggérée par trois points, comme sur un calendrier
 * qu'on regarde de loin.
 */
export function IconeCalendrier({
  taille = 20,
  classe = "",
  trait = 1.8,
}: ProprietesIcone) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      className={classe}
      aria-hidden
    >
      {/* Les deux anneaux, au-dessus du corps */}
      <path
        d="M8.5 2.6v2.4M15.5 2.6v2.4"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
      {/* Le corps, en contour */}
      <rect
        x="3.4"
        y="4.4"
        width="17.2"
        height="17"
        rx="3.2"
        stroke="currentColor"
        strokeWidth={trait}
      />
      {/* Le filet qui sépare l'en-tête du mois : un TRAIT, pas un
          aplat — c'est ce qui garde l'icône au même poids visuel que
          le glyphe d'adresse. */}
      <path
        d="M3.4 9.4h17.2"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
      {/* Trois jours, suggérés : la grille sans la dessiner. */}
      <path
        d="M8 13.6h.01M12 13.6h.01M16 13.6h.01M8 17.4h.01M12 17.4h.01"
        stroke="currentColor"
        strokeWidth={trait + 0.4}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * FLÈCHE DIAGONALE (↗) des liens — du bas gauche vers l'angle haut
 * droit. Sa taille par défaut vaut `1em` : elle fait donc EXACTEMENT la
 * hauteur du texte du lien qui la porte, quelle que soit sa taille.
 */
export function IconeFlecheDiagonale({
  taille = "1em",
  classe = "",
}: {
  taille?: number | string;
  classe?: string;
}) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M7 17 17 7m0 0H9.5M17 7v7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeBouclierTrait({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 2.5 20 5.5v6c0 5.2-3.3 9.1-8 10.9-4.7-1.8-8-5.7-8-10.9v-6L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m8.5 12 2.6 2.6 4.7-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Le logo WhatsApp ROND, au trait fin (boutons des cartes) : la
 * bulle circulaire — avec son petit pic en bas à gauche — sert
 * elle-même de cercle, même diamètre et même épaisseur de trait
 * que les boutons téléphone et favori voisins.
 */
export function IconeWhatsAppRonde({
  taille = 32,
  classe = "",
  contour = "currentColor",
}: ProprietesIcone & { contour?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" fill="none" className={classe} aria-hidden>
      {/* Bulle circulaire, pic en bas à gauche : le CONTOUR prend la
          couleur des cercles voisins (téléphone, favori) et
          l'INTÉRIEUR reste BLANC — comme leurs disques — même quand
          le fond de la carte se colore (sélection) */}
      <path
        d="M16 2.6A13.4 13.4 0 0 0 4.35 22.6L2.7 29.3l6.85-1.75A13.4 13.4 0 1 0 16 2.6Z"
        fill="#FFFFFF"
        stroke={contour}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Combiné intérieur, même épaisseur (couleur du texte) */}
      <path
        d="M11.9 9.9c-.5 0-1.3.2-1.3 1.6 0 3.7 5.3 9 9.1 9 1.4 0 1.6-.8 1.6-1.3v-1.9l-3-1.1-1.1 1.3c-1.6-.7-3.5-2.6-4.2-4.2l1.3-1.1-1-3-1.4.7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Le logo WhatsApp (bulle + combiné), au trait — boutons de la fiche */
export function IconeWhatsApp({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.2c-.3 0-.8.1-.8 1 0 2.3 3.3 5.6 5.7 5.6.9 0 1-.5 1-.8v-1.2l-1.9-.7-.7.8c-1-.4-2.2-1.6-2.6-2.6l.8-.7-.6-1.9-.9.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** La flèche « lien externe » (coin des modules cliquables) */
export function IconeLienExterne({ taille = 14, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M14 4.5h5.5V10M19.5 4.5 11 13M9.5 5.5H7A2.5 2.5 0 0 0 4.5 8v9A2.5 2.5 0 0 0 7 19.5h9a2.5 2.5 0 0 0 2.5-2.5v-2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** La flèche « revenir en arrière » (bandeau de la fiche, smartphone).
    Même facture que les autres icônes de trait : `currentColor`, donc
    elle prend automatiquement la couleur du bouton qui la porte (le
    gris des icônes favori et partage à côté d'elle). */
export function IconeFlecheRetour({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M19 12H5m0 0 6-6m-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Le chevron des accordéons (pivote à l'ouverture).
    §2 (nº 250) — c'est AUSSI la flèche de la ligne étroite de « Ma
    sélection » : repliée, la barre la montre vers le bas pour dire
    qu'un appui déploie. Une seule écriture, `currentColor`. */
export function IconeChevronBas({ taille = 18, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path d="m5 9 7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeLoupe({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


/* ============ Icônes des modules de l'accueil ============ */

/**
 * Le « G » de Google — tracés OFFICIELS quadricolores, complets.
 * La marge interne (viewBox élargi) donne au « G » la même taille
 * OPTIQUE que l'icône Instagram à dimension égale : les deux logos
 * s'alignent harmonieusement partout (cartes, fiche, accueil).
 */
/*  §1 (nº 785) — ELLE ACCEPTE UNE CLASSE, comme toutes ses voisines.
    Sans elle, impossible de lui donner la taille de l'appareil : les
    `width`/`height` du SVG sont des attributs, et seule une règle CSS
    peut les remplacer. La couleur, elle, ne se pilote pas — les quatre
    teintes de Google sont écrites dans le dessin, c'est sa marque. */
export function IconeGoogle({ taille = 40, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="-4 -4 56 56" className={classe} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Le dégradé Instagram, défini UNE SEULE FOIS pour toute la page
 * (posé dans le layout). Éviter un `<defs>` par icône est capital :
 * plusieurs `id="rw-ig"` en double faisaient que l'icône de la
 * fiche référençait la première définition — or, sur la page fiche
 * mobile, cette première se trouve dans la colonne liste MASQUÉE
 * (display:none), que WebKit ne peint pas → l'icône Instagram
 * disparaissait. Une définition unique, hors de tout sous-arbre
 * masqué, résout la référence partout.
 */
export function DefinitionsIcones() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <linearGradient id="rw-ig" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD776" />
          <stop offset="0.26" stopColor="#F58529" />
          <stop offset="0.55" stopColor="#E1306C" />
          <stop offset="0.8" stopColor="#C13584" />
          <stop offset="1" stopColor="#8134AF" />
        </linearGradient>
        {/* Dégradé du bouclier « Entreprise vérifiée » — défini ICI (une
            seule fois, hors sous-arbre masqué) pour la MÊME raison que le
            dégradé Instagram : sur iPad/WebKit, l'accueil rend l'icône à la
            fois dans la liste mobile (md:hidden) et dans le bloc desktop ;
            un `<defs id="rw-bouclier">` en double faisait référencer la
            définition MASQUÉE, que WebKit ne peint pas → bouclier invisible. */}
        {/*  nº 762 — LES DEUX ARRÊTS SUIVENT LA CHARTE. Ils portaient
            le dégradé rose de Roswel écrit en dur (#FB7BA2 → #EC3A6E) ;
            ils prennent les deux valeurs déclinées du rouge, celles de
            `CHARTE_CLAIRE.degradeDebut` / `degradeFin`.
            ⚠️ CETTE ICÔNE N'EST MONTÉE NULLE PART aujourd'hui : son
            module (« Entreprise vérifiée ») appartenait au produit
            artisans, parti à la nº 760. Elle est mise d'accord avec la
            charte plutôt que laissée en arrière — mais personne ne la
            voit, et son sort se décidera à part. */}
        <linearGradient id="rw-bouclier" x1="14" y1="4" x2="34" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EF839E" />
          <stop offset="1" stopColor="#DC1143" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * L'appareil photo Instagram (dégradé officiel, défini par
 * DefinitionsIcones). « grise » : version neutre (même gris que les
 * étoiles vides), quand les chiffres Instagram ne sont pas encore
 * saisis.
 */
export function IconeInstagram({
  taille = 40,
  grise = false,
  monochrome = false,
}: ProprietesIcone & { grise?: boolean; monochrome?: boolean }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
      {/* `monochrome` : l'icône prend la couleur du texte autour d'elle
          (yokofolio, où elle est posée SUR une photo, à côté de TikTok —
          deux dégradés de marque côte à côte feraient tache). Les pages
          artisans ne passent jamais cette option et gardent le dégradé
          officiel. */}
      <g fill={monochrome ? "currentColor" : grise ? "#D8DBE0" : "url(#rw-ig)"}>
        {/* Cadre arrondi (anneau) */}
        <path
          fillRule="evenodd"
          d="M15 4h18c6.1 0 11 4.9 11 11v18c0 6.1-4.9 11-11 11H15C8.9 44 4 39.1 4 33V15C4 8.9 8.9 4 15 4Zm0 4.5A6.5 6.5 0 0 0 8.5 15v18a6.5 6.5 0 0 0 6.5 6.5h18a6.5 6.5 0 0 0 6.5-6.5V15A6.5 6.5 0 0 0 33 8.5H15Z"
        />
        {/* Objectif (anneau) */}
        <path
          fillRule="evenodd"
          d="M24 14.2A9.8 9.8 0 1 1 14.2 24 9.8 9.8 0 0 1 24 14.2Zm0 4.3A5.5 5.5 0 1 0 29.5 24 5.5 5.5 0 0 0 24 18.5Z"
        />
        {/* Point du flash */}
        <circle cx="35" cy="13" r="2.7" />
      </g>
    </svg>
  );
}

/**
 * TIKTOK — la note de musique, dessinée d'un seul tracé.
 * Monochrome (`currentColor`) : posée sur une photo à côté
 * d'Instagram, elle prend la couleur du bouton qui la porte.
 */
export function IconeTikTok({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={classe}
      aria-hidden
    >
      <path d="M13.5 3h3.2a5.3 5.3 0 0 0 4.3 4.3v3.2a8.4 8.4 0 0 1-4.3-1.5v5.6a6.3 6.3 0 1 1-6.3-6.3c.36 0 .7.03 1.05.1v3.3a3.1 3.1 0 1 0 2.05 2.9V3Z" />
    </svg>
  );
}

/** Le bouclier avec coche (module « Entreprise vérifiée » de l'accueil).
    Le dégradé « rw-bouclier » est défini par DefinitionsIcones (posé dans
    le layout) — une seule fois, hors de tout sous-arbre masqué. */
export function IconeBouclierCoche({ taille = 40 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
      {/* Le bouclier */}
      <path
        fill="url(#rw-bouclier)"
        d="M24 3.5 40.5 9.6v12.2c0 10.5-6.6 18.3-16.5 22.7C14.1 40.1 7.5 32.3 7.5 21.8V9.6L24 3.5Z"
      />
      {/* La coche */}
      <path
        d="m16 24.5 5.6 5.5L32.5 18"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Le sceau « vérifié » (badges de confiance). « teinte » colore le
    sceau (bleu par défaut ; rose/bleu pour le badge de niveau de la
    fiche) — la coche reste blanche. */
export function IconeBadgeVerifie({
  taille = 40,
  teinte = "#1D9BF0",
}: ProprietesIcone & { teinte?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" aria-hidden>
      <path
        fill={teinte}
        d="M55.2 7.7 Q60.4 11.4 66.7 10.8 Q73.0 10.2 75.6 15.9 Q78.3 21.7 84.1 24.4 Q89.8 27.0 89.2 33.3 Q88.6 39.6 92.3 44.8 Q96.0 50.0 92.3 55.2 Q88.6 60.4 89.2 66.7 Q89.8 73.0 84.1 75.6 Q78.3 78.3 75.6 84.1 Q73.0 89.8 66.7 89.2 Q60.4 88.6 55.2 92.3 Q50.0 96.0 44.8 92.3 Q39.6 88.6 33.3 89.2 Q27.0 89.8 24.4 84.1 Q21.7 78.3 15.9 75.6 Q10.2 73.0 10.8 66.7 Q11.4 60.4 7.7 55.2 Q4.0 50.0 7.7 44.8 Q11.4 39.6 10.8 33.3 Q10.2 27.0 15.9 24.4 Q21.7 21.7 24.4 15.9 Q27.0 10.2 33.3 10.8 Q39.6 11.4 44.8 7.7 Q50.0 4.0 55.2 7.7 Z"
      />
      <path
        d="M32 51.5 44 63 68 37.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

//  ⚠️ « IconeFormulaire » A ÉTÉ SUPPRIMÉE À LA PASSE Nº 102, avec le
//  champ « Formulaire de demande » qu'elle accompagnait. C'était un
//  alias provisoire d'`IconeCocheListe`, laquelle reste : elle sert
//  ailleurs, et n'a jamais été propre à ce champ.

//  ██ §2 (nº 467) — « IconeWorld » EST SUPPRIMÉE, AVEC SON FICHIER ██
//  Elle posait `/icone-world.png` en MASQUE (la forme du fichier,
//  remplie de `currentColor`). Le lien « Site internet ou Linktree »
//  qu'elle servait est DESSINÉ DANS LE CODE depuis la nº 240-§1
//  (`IconeDuLien`, components/IconeReseau) : plus aucun appelant —
//  vérifié dans tout `src/` avant la suppression. Le fichier
//  `public/icone-world.png` part avec elle, sur consigne du
//  propriétaire. ⚠️ CE N'EST PAS LE GLOBE DE LA BARRE : celui-là est
//  `IconeMonde`, dessiné juste dessous, et il ne bouge pas.

/** Globe terrestre (colonne « Internet » de la fiche : « Voir le site ») */
export function IconeMonde({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      {/* L'équateur, puis le méridien : deux traits qui suffisent à lire
          un globe, même en tout petit. */}
      <path
        d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Petit drapeau (lien discret « Signaler cette fiche ») */
/*  ██ nº 811 — LE DRAPEAU, REDESSINÉ (« modifications demandées ») ██
    Une hampe droite (6,25 · de 4 à 20,75) et une flamme ondulée en
    deux vagues symétriques, du haut de la hampe à 19,75 — le tissu se
    referme sur la hampe à 13,75. L'ancienne flamme était plus étroite
    et sa vague, tordue vers le bas. Extrémités rondes. */
export function IconeDrapeau({ taille = 16, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M6.25 20.75V4m0 1.5c2.25-1.4 4.5-1.4 6.75 0s4.5 1.4 6.75 0v8.25c-2.25 1.4-4.5 1.4-6.75 0s-4.5-1.4-6.75 0"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------
 * PARTAGE — les trois icônes qui manquaient à la fenêtre « Partager
 * cette fiche ». Même gabarit que toutes les autres : viewBox 24,
 * trait de 1,8, `currentColor`. AUCUNE couleur de marque : elles
 * prennent le gris du site comme les quatre autres, conformément à la
 * charte (les logos officiels, colorés, ne sont pas utilisés ici).
 * ------------------------------------------------------------------ */

/** Bulle de message — le SMS (cohérente avec WhatsApp, sans la queue
    ronde de la marque : un rectangle arrondi et sa pointe). */
export function IconeBulleMessage({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M20.5 12.2c0 3.7-3.8 6.7-8.5 6.7-.9 0-1.8-.1-2.6-.3L4.5 20.5l1.1-3.2C4.2 16 3.5 14.2 3.5 12.2c0-3.7 3.8-6.7 8.5-6.7s8.5 3 8.5 6.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Enveloppe — l'e-mail */
/**
 * L'ARROBASE (passe nº 784) — le signe de l'adresse e-mail.
 * ------------------------------------------------------------------
 * ELLE REMPLACE LE BOUCLIER sur la ligne « E-mail et mot de passe » de
 * la page Sécurité, sur consigne : le bouclier disait « sécurité »,
 * c'est-à-dire le titre de la page, pas CE dont la ligne parle. Le @
 * dit une adresse, et personne n'a besoin qu'on le lui explique.
 * ⚠️ LE BOUCLIER N'EST PAS SUPPRIMÉ : il sert toujours à l'en-tête de
 * la page et à l'entrée « Sécurité » du menu « Mon espace ».
 * Même trait (1.8) et même viewBox que ses voisines : un rond au
 * centre, et l'anneau ouvert en bas à droite qui l'entoure.
 */
export function IconeArobase({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="11.9" r="3.3" stroke="currentColor" strokeWidth={trait} />
      <path
        d="M15.3 8.6v4.8c0 1.3 1 2.2 2.3 2.2 1.6 0 2.7-1.4 2.7-3.6a8.3 8.3 0 1 0-3.4 6.7"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ██ L'ŒIL, ET L'ŒIL BARRÉ (passe nº 788) ██
 * ------------------------------------------------------------------
 * Ils remplacent les mots « Afficher » / « Masquer » au bout des
 * champs de mot de passe. Un mot dans un champ se lit comme une partie
 * de sa valeur ; un œil ne se confond avec rien, et il tient dans la
 * largeur d'une icône au lieu de huit caractères.
 * ⚠️ LE BARRÉ DIT L'ÉTAT ACTUEL, pas ce qu'on va faire : quand le mot
 * de passe est EN CLAIR, l'œil est barré — c'est ce que l'on peut
 * couper. C'est la convention la plus répandue, et l'inverse fait
 * hésiter tout le monde.
 * Même trait (1.8) et même viewBox que leurs voisines.
 */
export function IconeOeil({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth={trait} />
    </svg>
  );
}

export function IconeOeilBarre({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M2.5 12S6 5.5 12 5.5c1.6 0 3 .47 4.2 1.15M21.5 12s-1.2 2.2-3.4 3.9M9.2 18.2c.9.2 1.8.3 2.8.3"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.7 9.7a3.2 3.2 0 0 0 4.6 4.6"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
      {/*  LA BARRE — d'un coin à l'autre, c'est elle qui dit « coupé ». */}
      <path d="M4 4 20 20" stroke="currentColor" strokeWidth={trait} strokeLinecap="round" />
    </svg>
  );
}

/*  ██ nº 811 — L'ENVELOPPE, REDESSINÉE (« demande reçue », le modèle
    gris de la famille) ██
    Un corps de 17,5 × 12,5 aux coins de 2,75, et un rabat dont les
    deux pans partent des bords (4,25 · 19,75) pour se rejoindre au
    centre par un arc court, à 12,9 — la pointe du rabat est arrondie
    au lieu d'être cassée. L'ancienne était plus large et son rabat
    partait de sous les coins. */
export function IconeEnveloppe({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <rect
        x="3.25"
        y="5.75"
        width="17.5"
        height="12.5"
        rx="2.75"
        stroke="currentColor"
        strokeWidth={trait}
      />
      <path
        d="M4.25 8.25 10.7 12.9a2.2 2.2 0 0 0 2.6 0l6.45-4.65"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** LE « f » DE FACEBOOK, SEUL (nº 141-§9) : le glyphe nu, en plein —
    l'encadré arrondi qui l'entourait datait. La marque, rien autour.
    ⚠️ IL NE SERT PLUS À SE CONNECTER (nº 783) : le bouton « Continuer
    avec Facebook » a été retiré, et sa note parlait encore des « logos
    Google et Apple des boutons voisins » — deux boutons dont l'un
    n'existe plus. CE QU'IL SERT AUJOURD'HUI, ET RIEN D'AUTRE :
    PARTAGER une fiche (`BoutonPartageFiche`, ligne « Facebook »). */
export function IconeFacebook({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" className={classe} aria-hidden>
      <path
        d="M14.3 4.5h2.2V1.6A28 28 0 0 0 13.3 1.5c-3.2 0-5.4 2-5.4 5.7v3.2H4.4v4.1h3.5v10h4.3v-10h3.5l.6-4.1h-4.1V7.7c0-1.2.3-2 2.1-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Croix de fermeture — les fenêtres modales */
/** UN CADENAS FERMÉ — la confidentialité du compte (menu « Mon
    espace »). Trait seul, comme les autres icônes de menu. */
export function IconeCadenas({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      className={classe}
      aria-hidden
    >
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** LA DOUBLE COCHE — « tout marquer comme lu » (fenêtre des
    notifications, passe nº 132). Deux coches décalées, le signe
    universel de la lecture groupée — même trait 1.8 que les autres
    icônes maison. */
/*  ██ nº 811 — LA DOUBLE COCHE, REDESSINÉE (« portfolio rétabli ») ██
    Deux coches de la même ouverture que la coche simple redessinée à
    cette passe, décalées de 6,25 : la seconde ne montre que son trait
    long et un court départ, comme un écho de la première. ⚠️ ELLE
    ACCEPTE ENFIN `trait` : elle vit dans une pastille (le catalogue
    des notifications) et y rendait un trait figé à 1,8 unité — plus
    maigre que ses voisines à 18 px, la maigreur que la nº 664 avait
    corrigée pour les neuf autres. */
export function IconeDoubleCoche({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M2.75 12.75 7.25 17.25 15 8.75"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.75 16 13.25 17.25 21.25 8.75"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*  ██ nº 811 — LA CROIX, REDESSINÉE (« refusé ») ██
    Deux traits de 7 à 17 : une croix un peu plus ramassée que
    l'ancienne (6,5 → 17,5), qui laisse plus d'air dans le rond sans
    perdre de présence — c'est le symbole le plus dense de la famille,
    il n'a pas besoin de toucher les bords. Extrémités rondes. */
export function IconeCroix({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Quatre carreaux — la disposition en DEUX colonnes (mosaïque). */
/** LA PHOTO — l'icône de la vue photothèque au repos (nº 141-4A) :
    UN CADRE, UNE MONTAGNE, UN SOLEIL — le pictogramme universel de
    l'image. Redessinée : la grille 2×2 de la nº 140 se confondait
    avec l'icône de disposition (quatre carrés elle aussi). Comme le
    bouton de disposition, le dessin montre la vue VERS LAQUELLE on
    bascule : celui-ci dit « passe aux images seules ». */
export function IconePhoto({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="9.5" r="1.7" fill="currentColor" />
      <path
        d="m6 19 5.2-5.6a1.4 1.4 0 0 1 2 0l2 2.1 1.6-1.7a1.4 1.4 0 0 1 2 0l1.7 1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** LA VUE AVEC TEXTE — la LETTRE « T » SEULE (passe nº 147-§1,
    troisième demande sur ce point : plus de cadre, plus de paysage,
    plus de montagne, plus de soleil).
    UNE LETTRE À EMPATTEMENTS, à la manière d'un Times : le chapeau
    pleine largeur avec ses empattements PENDANTS aux deux extrémités,
    le fût central, et le pied ÉVASÉ en courbe — une lettre dessinée,
    pas deux traits qui se croisent. Elle occupe tout le cadre de
    l'icône et évoque immédiatement le texte.
    Sa jumelle IconePhoto (le paysage seul) désigne la vue SANS texte ;
    l'état se dit par le DESSIN, jamais par une couleur. Le glyphe est
    PLEIN (fill), comme une lettre imprimée — l'échelle des traits
    (1.8) ne s'applique qu'aux icônes filaires. */
export function IconeCartes({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M4 4.5H20V9h-1.8V6.5h-4.8V17c1.6.15 2.6.9 2.6 2.5H8c0-1.6 1-2.35 2.6-2.5V6.5H5.8V9H4Z"
        fill="currentColor"
      />
    </svg>
  );
}

//  ⚠️ QUATRE PETITS RECTANGLES PORTRAIT (nº 157-§2B) — plus des
//  carrés : ils répondent au grand rectangle portrait de la pleine
//  page. Un grand contre quatre petits, la même silhouette partout.
export function IconeDeuxColonnes({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <rect x="4.5" y="3.5" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3.5" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4.5" y="13" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** UN GRAND RECTANGLE PORTRAIT, AU CONTOUR SEUL (nº 157-§2A) — la
    disposition en UNE colonne : une image à la française, comme les
    photos du site (1080 × 1350). Le PLEIN de la nº 155 écrasait
    l'icône en pavé sombre ; le contour dit la même chose, à armes
    égales avec les quatre petits rectangles d'en face. */
export function IconeUneColonne({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Symbole d'interrupteur (cercle + trait) — « Mettre la fiche hors
    ligne », l'action d'administration posée près du signalement. */
/*  ██ nº 811 — LE HORS-LIGNE, REDESSINÉ (le symbole « marche/arrêt ») ██
    Un arc de rayon 7,5 centré à 12,18 (il descend jusqu'à 19,7),
    ouvert en haut entre 7,05 et 16,95, et le trait vertical qui tombe
    de 4 à 11,75 dans l'ouverture. L'ancien arc était plus large (8) et
    coupait plus haut ; celui-ci laisse l'ouverture nette et le trait
    bien centré. Extrémités rondes. */
export function IconeHorsLigne({ taille = 16, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path d="M12 4v7.75" stroke="currentColor" strokeWidth={trait} strokeLinecap="round" />
      <path
        d="M7.05 6.55A7.5 7.5 0 1 0 16.95 6.55"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Porte et flèche — la déconnexion (menu de l'espace tatoueur). */
export function IconeSortie({ taille = 18, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M13.5 4.5H7a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 7 19.5h6.5M16 8l4 4-4 4m4-4H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Maillon de chaîne — « Copier le lien » */
export function IconeLien({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M10 13.8a3.6 3.6 0 0 0 5.4.4l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5M14 10.2a3.6 3.6 0 0 0-5.4-.4L6 12.4a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Visage souriant — le bouton du sélecteur d'émojis (champ bio). */
export function IconeEmoji({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.4 14.2a4.6 4.6 0 0 0 7.2 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="9.6" r="1.15" fill="currentColor" />
      <circle cx="15" cy="9.6" r="1.15" fill="currentColor" />
    </svg>
  );
}

/** Réglages (curseurs horizontaux) — le bouton « Filtrer » du moteur */
export function IconeReglages({ taille = 19, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M4 7.5h9m3.5 0H20M4 16.5h4.5m3.5 0h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14.75" cy="7.5" r="2.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10.25" cy="16.5" r="2.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * LA FLÈCHE DE L'ADRESSE (fiches yokofolio) — la diagonale type
 * Apple, VERSION LONGUE : le trait part vraiment du bas gauche
 * (5,19) jusqu'à la pointe haut droit (19,5), tête équilibrée.
 * Toujours rose, toujours visible. (`LienFleche`, côté artisans,
 * avait sa propre diagonale plus courte — `IconeFlecheDiagonale` ;
 * il est parti à la nº 760.)
 */
export function IconeFlecheAdresse({ taille = 14, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M4 20 20 4m0 0H10.5M20 4v9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * LA CLOCHE DES NOTIFICATIONS — le dessin universel, au trait, dans
 * la même graisse que les autres icônes du menu (1,8). Aucune
 * pastille dessinée dedans : le compte des non lues est un élément à
 * part, posé À CÔTÉ du titre (voir MenuEspace).
 */
export function IconeCloche({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  /*  §1 (nº 535) — LA CLOCHE EST ENTIÈRE, ET ELLE LE RESTE.
      L'ÉCHANCRURE DES nº 533-534 EST ANNULÉE : le drapeau `ouverte`,
      les deux tracés et l'arc coupé sont supprimés, code compris. Ce
      qui suit est le dessin d'avant la nº 533, au caractère près —
      un seul chemin fermé pour le dôme et le corps, un second pour le
      battant. Le compteur des notifications redevient une PASTILLE
      posée par-dessus (voir MenuEspace) : cette icône ne sait plus
      rien de lui, comme avant. */
  /*  ██ nº 811 — REDESSINÉE, avec les neuf autres symboles des
      pastilles. Un dôme de rayon 4,25 (de 7,75 à 16,25), des flancs
      droits jusqu'à 10,85 puis les deux épaules qui s'évasent vers le
      rebord (5,85 → 18,15) — une cloche plus svelte que l'ancienne, dont
      le dôme de rayon 6 remplissait tout le rond. Le battant est un arc
      de rayon 1,75 sous le rebord. Jonctions rondes, un seul tracé fermé
      pour le corps, comme avant. */
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 4.25a4.25 4.25 0 0 0-4.25 4.25v2.35c0 2.35-.9 3.8-1.9 5.05h12.3c-1-1.25-1.9-2.7-1.9-5.05V8.5A4.25 4.25 0 0 0 12 4.25Z"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 18.4a1.75 1.75 0 0 0 3.5 0"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** LE PLUS — « + Ajouter une fiche », au bas du sélecteur. */
export function IconePlus({ taille = 18, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** LA CORBEILLE — les suppressions (page Sécurité, notifications
    « suppression programmée », « portfolio retiré »).
    ██ nº 811 — REDESSINÉE : un couvercle de 4,5 à 19,5, une poignée
    aux coins ronds, un corps qui s'affine vers le bas (6,25 → 17,75 en
    haut, arrondi de 1,9 aux pieds) et DEUX RAINURES verticales qui
    n'y étaient pas — c'est elles qui font lire « corbeille » d'un coup
    dans un rond de 36 px, là où l'ancien seau nu ressemblait à un
    gobelet. Quatre tracés, extrémités et jonctions rondes. */
export function IconeCorbeille({ taille = 20, classe = "", trait = 1.8 }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 7l.85 11.2A1.9 1.9 0 0 0 9 20h6a1.9 1.9 0 0 0 1.9-1.8L17.75 7"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 10.5v6.25M13.75 10.5v6.25"
        stroke="currentColor"
        strokeWidth={trait}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * LES TROIS ICÔNES DES MODES D'EXERCICE
 * --------------------------------------
 * Elles se posent dans une PASTILLE RONDE, à gauche de chaque ligne
 * de mode, exactement là où un salon lié montrerait son logo. Le
 * dessin dit le mode d'un coup d'œil, sans qu'on ait à lire :
 *  · L'ANCRE      — on est POSÉ quelque part (studio fixe) ;
 *  · L'AVION      — on est DE PASSAGE (session guest) ;
 *  · LA SILHOUETTE (IconeUtilisateur, déjà là) — c'est CHEZ SOI.
 * Même graisse de trait (1,8) que le reste du menu : elles font
 * partie de la même famille, elles n'attirent pas l'œil plus que de
 * raison.
 */
export function IconeAncre({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <circle cx="12" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.2V20M8 10.4h8M4.5 14.2c0 3.4 3.4 5.8 7.5 5.8s7.5-2.4 7.5-5.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeAvion({ taille = 20, classe = "" }: ProprietesIcone) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" className={classe} aria-hidden>
      <path
        d="M10.6 3.6a1.4 1.4 0 0 1 2.8 0v5.6l6.9 3.9v2.1l-6.9-2.1v4l2.3 1.7v1.6L12 19.6l-3.7.8v-1.6l2.3-1.7v-4L3.7 15.2v-2.1l6.9-3.9V3.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
