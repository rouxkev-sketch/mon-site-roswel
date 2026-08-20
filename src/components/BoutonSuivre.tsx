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
}: {
  tatoueurId: string;
  nomTatoueur: string;
  suiviAuDepart?: boolean;
  pleineLargeur?: boolean;
}) {
  const { utilisateur, pret } = useUtilisateur();
  amorcer("tatoueur", tatoueurId, suiviAuDepart);
  const suivi = useEtatFavori("tatoueur", tatoueurId, suiviAuDepart);
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
    if (!pret) return;
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
        suivi ? `Ne plus suivre ${nomTatoueur}` : `Suivre ${nomTatoueur}`
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
       * ██ §1 (nº 383) — LE BADGE DEVIENT UN CONTOUR ██
       * ==================================================================
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
       * ██ §8 (nº 405) — « SUIVRE » REDEVIENT UN BOUTON ROSE PLEIN ██
       * ==================================================================
       * LE PROPRIÉTAIRE RENVERSE À NOUVEAU LA ROBE DE CET ÉTAT, et dans
       * l'écriture QUI EXISTE DÉJÀ — celle du badge de compte de la
       * barre fixe (nº 399) et du bouton « Créer mon compte » de la
       * fenêtre d'invitation (nº 396-397), elle-même reprise de
       * « qui-sommes-nous ». Aucune couleur n'est inventée :
       *  · PAS ENCORE SUIVI — fond ET contour au ROSE DU SITE
       *    (`bg-primaire border-primaire`, `#EE3D6F`), texte BLANC
       *    (`text-sombre-texte`, `#F2F2F4` — le blanc de la charte
       *    sombre, celui du bouton rose de la fenêtre d'invitation).
       *    AU SURVOL, LE FOND ET LE CONTOUR MONTENT ENSEMBLE D'UN CRAN
       *    (`hover:bg-primaire-fonce hover:border-primaire-fonce`) — le
       *    traitement du bouton rose du site, au caractère près ; le
       *    texte reste blanc, comme là-bas ;
       *  · DÉJÀ SUIVI — INCHANGÉ dans son principe : fond transparent,
       *    texte gris doux. SEUL LE CONTOUR S'ASSOMBRIT (voir plus
       *    bas).
       *
       * ⚠️ NI LE BOUTON NI LA RANGÉE NE BOUGENT. Le contour d'un pixel
       * RESTE dans les deux états — c'est lui qui donne les 32 px de
       * haut. Le remplacer par un fond sans trait aurait fait maigrir
       * le bouton de 2 px en hauteur comme en largeur (la règle nº 321,
       * déjà appliquée au badge de la barre fixe). Le rembourrage, la
       * typographie et la mécanique des deux libellés superposés ne
       * changent pas d'un pixel.
       */
      className={`inline-flex min-h-[30px] items-center justify-center rounded-full
                  border px-3.5 text-[14px] font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${
                    pleineLargeur ? "w-full" : ""
                  } ${
                    suivi
                      ? /*  §1 (nº 385) — LE GRIS DU TEXTE POUR LE
                             TRAIT. La nº 384 avait poussé ce contour
                             jusqu'au jeton des TRAITS (`sombre-trait`,
                             #3B3B42) : TROP SOMBRE au jugement du
                             propriétaire, elle fut annulée.
                             ██ §8 (nº 405) — ET `sombre-texte-doux`
                             EST TROP CLAIR ██
                             Le propriétaire tranche entre les deux
                             refus. Le contour prend
                             `sombre-haut-clair` (#55555F), UN JETON DE
                             LA CHARTE, et c'est celui qui tombe entre
                             les deux valeurs jugées : plus sombre que
                             le #A8A8B0 d'aujourd'hui, nettement plus
                             clair que le #3B3B42 refusé à la nº 384
                             (les deux seuls jetons intermédiaires sont
                             `sombre-haut` #4A4A53 et celui-ci ; #55555F
                             est le plus proche du milieu). Aucune
                             couleur n'est inventée.
                             ⚠️ LE TEXTE NE CHANGE PAS — il garde
                             `sombre-texte-doux`, et le survol des deux
                             garde son cran. Trait et mot ne sont donc
                             plus du même gris : c'est ce qui est
                             demandé. */
                        "border-sombre-haut-clair text-sombre-texte-doux hover:text-sombre-texte hover:border-sombre-texte"
                      : //  §8 (nº 405) — LE ROSE PLEIN DU SITE (voir la
                        //  note ci-dessus) : fond et contour au même
                        //  jeton, texte blanc, et le survol monte les
                        //  deux d'un cran. C'est l'écriture du badge de
                        //  la barre fixe (nº 399), au caractère près.
                        "bg-primaire border-primaire text-sombre-texte hover:bg-primaire-fonce hover:border-primaire-fonce"
                  }`}
    >
      {/*  ⚠️ LES DEUX LIBELLÉS OCCUPENT LA MÊME LARGEUR (nº 208-§1) :
           ils sont posés dans la même case de grille, le plus long
           réservant la place. Le bouton ne change donc pas d'un pixel
           entre « Suivre » et « Suivi » — rien ne peut bouger autour,
           quel que soit l'instant où l'état est connu. */}
      <span className="grid text-center">
        <span className="col-start-1 row-start-1">
          {suivi ? "Suivi" : "Suivre"}
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          Suivre
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          Suivi
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
