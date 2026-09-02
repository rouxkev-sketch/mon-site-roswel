"use client";

import { useEffect, useRef, useState } from "react";
//  §1 (nº 396) — l'invitation à créer un compte : la MÊME fenêtre
//  que le fanion, écrite une seule fois.
import { FenetreInvitationCompte } from "@/components/FenetreInvitationCompte";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  amorcer,
  definir,
  ecrireFavori,
  estIdentifiantDeBase,
  reprendreLeGeste,
  useEtatFavori,
  //  §2 (nº 506) — « la liste des favoris a-t-elle répondu ? ». Sans
  //  elle, le bouton peignait « Suivre » avant de savoir.
  useListeFavorisConnue,
} from "@/lib/favoris-yokofolio";

/**
 * « SUIVRE » / « SUIVI » — le bouton de la fiche
 * ===============================================
 * UN SEUL BOUTON, DEUX ÉTATS, et le libellé dit lequel : « Suivre »
 * tant qu'on ne suit pas, « Suivi » une fois que c'est fait.
 *
 * SON HABILLAGE (nº 206) : « SUIVRE » EST LA CAPSULE ROSE PLEINE —
 * l'action finale de la fiche, le geste qu'on attend du visiteur, et
 * la charte réserve précisément le rose à cet emploi. C'est la SEULE
 * capsule rose de l'écran : sur la rangée du haut, l'onglet actif
 * porte la capsule de verre grise — la couleur seule distingue
 * l'action de l'onglet (c'était le constat de la passe : trois
 * capsules grises, deux « allumées », illisible).
 * UNE FOIS SUIVI, IL S'ÉTEINT : capsule grise discrète un cran plus
 * clair, texte GRIS DOUX — le gris des mots inactifs, jamais blanc,
 * sinon il reprendrait la robe de l'onglet actif. Toujours cliquable
 * pour se désabonner ; la transition entre les deux états est douce.
 * AUCUNE icône : le mot suffit. Aucun contour.
 *
 * ⚠️ SA PLACE EST LIBRE (la fiche sera refaite) : il se pose là où le
 * parent le met. Il ne suppose donc aucune largeur, et sait vivre en
 * pleine largeur comme dans une rangée.
 *
 * PAS CONNECTÉ ? Même règle que le cœur : on mène à la connexion en
 * gardant la page (`?suite=`) ET le geste, rejoué au retour.
 *
 * ⚠️ SON ÉTAT DE DÉPART VIENT DU SERVEUR (nº 208-§1) : la page de
 * fiche lit le cookie de session et demande à la base si ce compte
 * suit déjà ce tatoueur (`suitCeTatoueur`). Le bouton naît donc
 * « Suivi » quand il doit l'être, au lieu d'afficher « Suivre » puis
 * de se corriger à l'arrivée de la liste des favoris.
 */
export function BoutonSuivre({
  tatoueurId,
  nomTatoueur,
  suiviAuDepart = false,
  pleineLargeur = false,
  /**
   * ██ §1 (nº 589) — LA BOÎTE, QUAND UN APPELANT EN VEUT UNE AUTRE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT : la capsule posée dans la liste des portfolios à la
   * nº 586 mesure 30 px de haut — LA MESURE DU DOIGT, celle de la
   * nº 233. Face au rond de 72 px que le web donne à un portfolio, elle
   * paraît perdue.
   * LE RÉGLAGE EST SÉPARÉ, PAS DÉPLACÉ, et c'est le procédé des
   * nº 537 et nº 557 : un paramètre dont LE DÉFAUT EST LA VALEUR
   * D'AVANT. Sans argument, la boîte ne bouge pas d'un pixel — la
   * FICHE de profil, qui n'a rien demandé, garde exactement sa capsule,
   * et le DOIGT garde partout ses 30 px, qui sont une mesure tactile et
   * non un choix graphique.
   * ⚠️ CE QUI EST PASSÉ ICI NE VAUT QU'AU-DELÀ DU CRAN `lg:` : c'est
   * l'appelant qui l'écrit ainsi, et c'est ce qui garantit que le doigt
   * ne voit rien. La classe de base (`min-h-[30px]`) reste posée, et la
   * variante la remplace au-dessus du cran — jamais deux hauteurs qui
   * se disputeraient au même moment (piège 389).
   */
  classeBoite = "",
}: {
  tatoueurId: string;
  nomTatoueur: string;
  suiviAuDepart?: boolean;
  pleineLargeur?: boolean;
  classeBoite?: string;
}) {
  const { utilisateur, pret } = useUtilisateur();
  amorcer("tatoueur", tatoueurId, suiviAuDepart);
  const suivi = useEtatFavori("tatoueur", tatoueurId, suiviAuDepart);
  /**
   * ██ §2 (nº 506) — SAIT-ON, OUI OU NON, SI CETTE FICHE EST SUIVIE ? ██
   * ==================================================================
   * LE DÉFAUT : au chargement, le bouton annonçait « Suivre », puis
   * basculait sur « Suivi » quand la liste des favoris arrivait. Le
   * délai n'est pas le problème — il est voulu, les favoris se
   * chargent côté navigateur pour que la mosaïque reste en cache
   * (règles 137/203). LE PROBLÈME EST D'AVOIR PEINT « Suivre »
   * PENDANT ce délai : un état de compte FAUX, ce que la règle 203
   * interdit mot pour mot.
   * LA QUESTION SE COMPOSE EN DEUX TEMPS, et les deux comptent :
   *  · `pret` — la SESSION est lue. Avant, `utilisateur` vaut `null`
   *    sans vouloir dire « personne » ;
   *  · ensuite, SEULEMENT SI quelqu'un est connecté, la LISTE de ses
   *    favoris doit être revenue. Sans compte, il n'y a rien à
   *    attendre : personne ne suit rien, et le bouton peut parler tout
   *    de suite.
   * ⚠️ SANS CE SECOND MEMBRE, un visiteur non connecté verrait un
   * bouton muet POUR TOUJOURS : `chargerLesMiens` n'est jamais appelé
   * sans session, donc la liste ne serait jamais « connue ».
   */
  const listeConnue = useListeFavorisConnue();
  const etatConnu = pret && (!utilisateur || listeConnue);
  /** §1 (nº 396) — LA FENÊTRE D'INVITATION EST OUVERTE. Un état
      React, rien d'autre : aucune entrée d'historique. */
  const [invitation, setInvitation] = useState(false);
  const dejaRejoue = useRef(false);

  /** Le geste repris après la connexion — une seule fois. */
  useEffect(() => {
    if (!pret || !utilisateur || dejaRejoue.current) return;
    if (!reprendreLeGeste("tatoueur", tatoueurId)) return;
    dejaRejoue.current = true;
    definir("tatoueur", tatoueurId, true);
    void ecrireFavori("tatoueur", tatoueurId, true);
  }, [pret, utilisateur, tatoueurId]);

  function basculer() {
    /**
     * ██ §1 (nº 396) — L'INVITATION REMPLACE LE DÉPART ██
     * ==============================================================
     * La note complète est dans BoutonCoeurPhoto : même règle, même
     * ordre, même raison. En résumé — `pret` d'abord (règle 137/203 :
     * tant que l'état de connexion n'est pas chargé, `utilisateur`
     * vaut `null` sans vouloir dire « non connecté », et la fenêtre ne
     * doit jamais s'ouvrir devant un connecté) ; puis la fenêtre au
     * lieu du départ ; et le geste retenu déménage au moment du départ
     * vers le compte, pour qu'une fenêtre refermée ne laisse aucune
     * intention derrière elle.
     */
    //  §2 (nº 506) — on ne bascule pas un état qu'on ne connaît pas
    //  encore : le bouton est muet, il est aussi sans effet.
    if (!etatConnu) return;
    if (!utilisateur) {
      setInvitation(true);
      return;
    }
    const suivant = !suivi;
    definir("tatoueur", tatoueurId, suivant);
    void ecrireFavori("tatoueur", tatoueurId, suivant).then((ok) => {
      if (!ok) definir("tatoueur", tatoueurId, !suivant);
    });
  }

  //  ⚠️ APRÈS LES HOOKS. Une fiche de DÉMONSTRATION n'existe pas en
  //  base (son identifiant est « demo-01 ») : on ne peut pas la
  //  suivre, le bouton ne s'affiche donc pas plutôt que d'échouer
  //  sous le doigt.
  if (!estIdentifiantDeBase(tatoueurId)) return null;

  return (
    <>
    <button
      type="button"
      onClick={basculer}
      aria-pressed={suivi}
      aria-label={
        suivi ? `Unfollow ${nomTatoueur}` : `Follow ${nomTatoueur}`
      }
      /*  §3 (nº 231, retouché nº 233) — LE BADGE PÈSE AUTANT QUE LES
          MOTS D'EN FACE, ni plus ni moins : le rose avance
          optiquement, alors la boîte recule. Hauteur descendue à
          30 px (36 à la 231, 44 avant), les EXTRÉMITÉS REDEVIENNENT
          RONDES (nº 233-§3 : `rounded-full` — le rayon vaut la moitié
          de la hauteur), rembourrage latéral réduit (14 px), et la
          MÊME typographie que « Profil » et « Portfolio » : 14 px
          semi-gras (SelecteurOngletAffiche). La rangée `items-center`
          de l'enveloppe cale les centres optiques. */
      /**
       * §1 (nº 383) — LE BADGE DEVIENT UN CONTOUR.
       * ⛔ DE L'HISTOIRE : la nº 405 a rendu son fond plein à
       * « Suivre », la nº 459 à « Suivi », et la nº 528 a retiré le
       * rose du premier. Aucun des deux états n'est plus un contour.
       * On garde la note parce qu'elle dit d'où vient la géométrie que
       * les deux portent encore (le trait d'un pixel, et les 32 px de
       * haut qu'il donne).
       * ------------------------------------------------------------------
       * Le fond plein disparaît des DEUX états. Ne restent qu'un trait
       * d'un pixel et le mot, de la même couleur :
       *  · PAS ENCORE SUIVI — rose sur rose : `border-primaire` +
       *    `text-primaire`, le jeton rose du site (`--rw-primaire`),
       *    celui-là même que le fond portait avant et que le
       *    soulignement des onglets porte depuis la nº 382 ;
       *  · DÉJÀ SUIVI — gris sur gris : `border-sombre-texte-doux` +
       *    `text-sombre-texte-doux`, le gris doux que ce bouton
       *    utilisait DÉJÀ pour son texte dans cet état. Aucune couleur
       *    n'est inventée : les deux existaient sur ce bouton.
       * Le survol reprend le même jeu d'un cran : le rose foncé et le
       * texte plein, tous deux déjà en charte.
       *
       * ⚠️ MÊME TYPOGRAPHIE DANS LES DEUX ÉTATS — 14 px semi-gras,
       * inchangés ; seuls la couleur et le mot changent, et le mot
       * changeait déjà (« Suivre » / « Suivi », nº 208-§1, avec ses
       * deux libellés superposés pour que la largeur ne bouge pas).
       *
       * ⚠️ LA RANGÉE NE GRANDIT PAS. Le bouton passe de 30 à 32 px
       * (les deux pixels du trait), mais ce n'est pas lui qui commande :
       * le bloc des onglets fait 47 px depuis la nº 382, et c'est le
       * plus haut de la rangée. La cible tactile GAGNE donc deux
       * pixels au lieu d'en perdre.
       *
       * §8 (nº 405) — « SUIVRE » ÉTAIT UN BOUTON ROSE PLEIN.
       * ⛔ DE L'HISTOIRE DEPUIS LA nº 528 (note juste dessous) : le
       * rose est parti de cet état. Ce qui reste vrai de cette
       * passe-là, et qui n'a jamais bougé depuis : le fond ET le
       * contour portent LE MÊME jeton, le texte en porte un second, et
       * le survol remplace les deux premiers d'un cran. C'est le
       * squelette de l'état, quelle que soit sa couleur.
       *
       * ⚠️ NI LE BOUTON NI LA RANGÉE NE BOUGENT. Le contour d'un pixel
       * RESTE dans les deux états — c'est lui qui donne les 32 px de
       * haut. Le remplacer par un fond sans trait aurait fait maigrir
       * le bouton de 2 px en hauteur comme en largeur (la règle nº 321,
       * déjà appliquée au badge de la barre fixe). Le rembourrage, la
       * typographie et la mécanique des deux libellés superposés ne
       * changent pas d'un pixel.
       * ⚠️ ET CE CONTOUR N'EST PAS UN CONTOUR AU SENS DE LA CHARTE :
       * il porte TOUJOURS le jeton du fond, donc il ne se voit pas. Ce
       * n'est pas une décoration, c'est la mesure du bouton.
       *
       * ██ §1 (nº 528) — « SUIVRE » PASSE AU BLANC ██
       * ==================================================================
       * LE PROPRIÉTAIRE RETIRE LE ROSE DE CET ÉTAT :
       *  · LE FOND (et son contour) prennent `sombre-texte`, #F2F2F4 —
       *    LE BLANC DE LA CHARTE, pas un blanc pur. C'est ce qu'il a
       *    demandé, et c'est aussi la seule bonne réponse : #FFFFFF
       *    n'existe nulle part dans la palette sombre (nº 466), et un
       *    blanc pur au milieu de blancs cassés se voit — il aurait
       *    fallu l'inventer, puis le tenir ;
       *  · LE TEXTE prend `sombre-fond`, #0B0F14 — le fond de page
       *    lui-même. Les deux jetons s'échangent leurs rôles : ce que
       *    la page porte en fond, le bouton le porte en texte.
       *
       * ⚠️ LE SURVOL ET L'APPUI, QU'IL FALLAIT REPRENDRE. Ils visaient
       * le rose foncé — un jeton qui n'a plus rien à faire ici. Il
       * n'existe AUCUN blanc intermédiaire dans la charte : entre
       * `sombre-texte` (#F2F2F4) et `sombre-texte-doux` (#A8A8B0) il
       * n'y a rien, et le second est un gris franc — le bouton
       * paraîtrait éteint, pas effleuré. LA RÉPONSE EST DONC LE MÊME
       * JETON, VOILÉ D'UN DIXIÈME (`/90`) : le blanc de la charte
       * laisse passer un peu du fond derrière lui et rend #DBDBDE — un
       * blanc à peine moins vif, exactement ce qui était demandé.
       * Aucune couleur n'est inventée : c'est le jeton, et le motif du
       * voile est celui du site (la note de démonstration l'emploie
       * déjà sur le rose).
       * ⚠️ L'APPUI PREND LA MÊME VALEUR QUE LE SURVOL, et c'est un
       * ajout assumé : l'état rose n'avait PAS d'appui, ce qui ne
       * coûtait rien au web mais laissait le doigt sans réponse.
       * « Suivi » en a un depuis la nº 504 ; les deux états se
       * répondent enfin.
       * ⚠️ LE SENS DU MOUVEMENT EST LE MÊME QUE PARTOUT : on
       * S'ASSOMBRIT en touchant. Le rose descendait vers son foncé,
       * « Suivi » descend vers `sombre-carte` (nº 504) ; le blanc
       * descend vers son voile. Aucun état ne monte au contact.
       *
       * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS : ce bouton devient L'ÉLÉMENT
       * LE PLUS CLAIR DE LA FICHE — 17,2 de contraste sur le fond,
       * quand « Suivi » n'en rend que 1,4. C'est voulu (c'est le seul
       * appel à l'action de la page), mais cela veut dire que l'œil y
       * va AVANT d'aller à la photo. Le texte courant de la fiche porte
       * le même jeton, sans que les deux se confondent : ici c'est un
       * aplat, là des lettres.
       * ⚠️ CONSÉQUENCE DE CHARTE : plus rien n'est rose AU REPOS sur
       * une fiche de profil, sauf le trait de 3 px du va-et-vient
       * Profil / Portfolio (OngletsLigne) — il reste, et il devient le
       * dernier rose de la page. Les anneaux de focus au clavier
       * (celui de ce bouton compris) sont rosés eux aussi, mais ils ne
       * se peignent qu'au clavier.
       */
      /*  §3 (nº 456) — LES EXTRÉMITÉS RONDES DEVIENNENT DES ANGLES
          ARRONDIS : `rounded-lg` (8 px), le rayon des badges de la
          charte depuis la nº 449 — la pilule de la nº 233-§3 est
          remplacée. Rien d'autre ne bouge : hauteur, contour,
          rembourrage, typographie au pixel. */
      className={`inline-flex min-h-[30px] items-center justify-center rounded-lg
                  border px-3.5 text-[14px] font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${classeBoite} ${
                    pleineLargeur ? "w-full" : ""
                  } ${
                    !etatConnu
                      ? /*  ██ §2 (nº 506) — L'ATTENTE NE DIT RIEN ██
                             Tant que l'état n'est pas connu, le bouton
                             ne peut annoncer NI « Suivre » NI « Suivi ».
                             Il garde donc SA BOÎTE — même hauteur, même
                             largeur, même rayon — et se tait : le
                             libellé est masqué juste en dessous.
                             LE FOND EST CELUI DE « SUIVI » (le gris du
                             contenu), et ce choix se justifie : aucune
                             couleur n'est inventée, c'est un jeton que
                             ce bouton porte déjà, et il est NEUTRE — le
                             rose, lui, est un appel à l'action, donc
                             une promesse. On préfère se taire en gris
                             que promettre en rose.
                             ⚠️ LE BOUTON EST AUSSI SANS EFFET pendant
                             ce moment (voir `basculer`) : on ne bascule
                             pas un état qu'on ne connaît pas. */
                        "bg-sombre-eleve border-sombre-eleve text-sombre-texte"
                      : suivi
                      ? /*  ██ §3 (nº 459) — « SUIVI » SE REMPLIT ██
                             L'intérieur prend la couleur du contour, et
                             le mot passe au BLANC de la charte
                             (`sombre-texte`) : un état plein, lisible
                             d'un coup d'œil, le miroir gris du
                             « Suivre » rose. Au survol, fond et contour
                             descendent ENSEMBLE d'un cran — le
                             traitement du bouton rose, transposé ; le
                             texte reste blanc. Piège 389 : une seule
                             couleur de fond par état, remplacée au
                             survol, jamais empilée.
                             ⚠️ CE QUE LES NOTES DES nº 385 ET 405
                             RACONTAIENT ICI EST PÉRIMÉ DEUX FOIS, et je
                             le retire plutôt que de le laisser tromper :
                             elles pesaient le choix du gris du CONTOUR
                             entre trois jetons, en citant #55555F,
                             #4A4A53 et #3B3B42 — LES VALEURS D'AVANT LA
                             nº 466, qui a retinté toute l'échelle sur le
                             bleu nuit. Ces trois nombres n'existent plus
                             nulle part dans la charte. Et la nº 459 a de
                             toute façon rempli le bouton, ce qui a ôté
                             au contour son rôle : il porte le même jeton
                             que le fond, donc il ne se voit pas.
                             ██ §4 (nº 504) — « SUIVI » DESCEND AU GRIS
                             DES PLAQUES ██
                             ----------------------------------------
                             LE DÉFAUT, RELEVÉ À LA nº 498 : à
                             `sombre-haut-clair` (#4A525D depuis la
                             nº 466), cet état était LE POINT LE PLUS
                             CLAIR DE TOUTE LA FICHE — pour un état
                             PASSIF, qui dit « c'est déjà fait ». Il
                             attirait l'œil plus qu'un bouton rose.
                             IL PREND DONC `sombre-eleve` (#262C34), le
                             gris des plaques et des capsules : il
                             rejoint le niveau du contenu au lieu de
                             flotter au-dessus. Et il DESCEND ENCORE au
                             survol et à l'appui (`sombre-carte`,
                             #1A1F26) — s'enfoncer, c'est le geste qui
                             dit qu'on va se désabonner ; monter aurait
                             dit l'inverse.
                             ⚠️ LE LIBELLÉ RESTE TRÈS LISIBLE, mesuré :
                             le blanc rend 12,59 sur #262C34 et 14,81 sur
                             #1A1F26 — il GAGNE en contraste, puisque le
                             fond s'assombrit (il rendait 7,07 avant).
                             ⚠️ CE QU'IL PARTAGE MAINTENANT, ET JE LE
                             DIS : `sombre-eleve` est exactement le fond
                             des capsules et des plaques. Le bouton n'en
                             touche aucune — il vit dans la rangée du
                             haut, à côté du partage, et les capsules
                             sont plus bas dans la liste des lignes —
                             mais il partage désormais leur NIVEAU. C'est
                             la conséquence assumée de « le gris des
                             plaques ». */
                        "bg-sombre-eleve border-sombre-eleve text-sombre-texte hover:bg-sombre-carte hover:border-sombre-carte active:bg-sombre-carte active:border-sombre-carte"
                      : //  §1 (nº 528) — LE BLANC DE LA CHARTE (voir la
                        //  note ci-dessus) : fond et contour au même
                        //  jeton, texte à la couleur du fond de page,
                        //  et le survol comme l'appui voilent les deux
                        //  d'un dixième. Une seule couleur par
                        //  propriété, remplacée — jamais empilée ; et
                        //  les classes en ordre alphabétique.
                        "active:bg-sombre-texte/90 active:border-sombre-texte/90 bg-sombre-texte border-sombre-texte hover:bg-sombre-texte/90 hover:border-sombre-texte/90 text-sombre-fond"
                  }`}
    >
      {/*  ⚠️ LES DEUX LIBELLÉS OCCUPENT LA MÊME LARGEUR (nº 208-§1) :
           ils sont posés dans la même case de grille, le plus long
           réservant la place. Le bouton ne change donc pas d'un pixel
           entre « Suivre » et « Suivi » — rien ne peut bouger autour,
           quel que soit l'instant où l'état est connu. */}
      <span className="grid text-center">
        {/*  §2 (nº 506) — LE LIBELLÉ SE TAIT TANT QU'ON NE SAIT PAS.
             `invisible` et non un rendu conditionnel : le mot occupe
             toujours sa case, donc la grille de réserve ci-dessous
             continue de tenir la largeur au pixel. Rien ne saute quand
             le mot arrive — il apparaît, il ne pousse rien. */}
        <span
          className={`col-start-1 row-start-1${etatConnu ? "" : " invisible"}`}
        >
          {suivi ? "Following" : "Follow"}
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          Follow
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          Following
        </span>
      </span>
    </button>
      {/*  §1 (nº 396) — L'INVITATION, POSÉE PAR LE BOUTON LUI-MÊME.
           « Suivre » n'existe qu'à UN endroit du code (ContenuFiche),
           mais ce contenu est monté par DEUX surfaces — la page de
           fiche et la fenêtre superposée du web. L'écrire ici les sert
           donc toutes les deux, sans qu'aucune ait une ligne à ajouter.
           ⚠️ AUCUNE ENTRÉE D'HISTORIQUE (règle 332-§1) : un état React
           et un portail, ni `pushState` ni paramètre d'adresse — rien à
           consommer en refermant. */}
      {invitation && (
        <FenetreInvitationCompte
          geste="tatoueur"
          id={tatoueurId}
          surFermeture={() => setInvitation(false)}
        />
      )}
    </>
  );
}
