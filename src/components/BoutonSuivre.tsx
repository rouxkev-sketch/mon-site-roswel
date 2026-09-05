"use client";

import { useEffect, useRef, useState } from "react";
//  §1 (nº 396) — l'invitation à créer un compte : la MÊME fenêtre
//  que le fanion, écrite une seule fois.
import { FenetreInvitationCompte } from "@/components/FenetreInvitationCompte";
//  §4 (nº 870) — LE BADGE DE LA RANGÉE (icône à gauche du mot) :
//  l'écriture unique des trois actions d'un profil, et ses deux dessins.
import { ActionDeFiche } from "@/components/ActionDeFiche";
//  §6 (nº 871) — LE PLUS ET LA COCHE, les deux signes du site, sur la
//  grille de 24 : le personnage de la nº 869 s'en va.
import { IconeCocheListe, IconePlus } from "@/components/Icones";

/**
 * ██ §1 (nº 872) — UN CRAN AU-DESSUS DU TRAIT DE LA FAMILLE ██
 * ==================================================================
 * LE PROPRIÉTAIRE : le « + » de « Follow » est TROP FIN. Il l'est
 * doublement, et les deux raisons se cumulent : le trait de la famille
 * (1,8 sur la grille de 24) est réglé pour des glyphes de 20 à 24 px
 * posés sur le fond de page, alors que celui-ci est SEUL au milieu
 * d'un aplat blanc de 40 px — un signe nu, sans forme autour de lui
 * pour le porter —, et l'encre sombre sur blanc paraît toujours plus
 * mince que la même encre claire sur sombre.
 * LA VALEUR : 2,2 — LE CRAN AU-DESSUS, et c'est le pas de la famille
 * elle-même (elle va de 1,4 à 1,8 par quatre dixièmes). Un cinquième
 * d'épaisseur en plus se voit à vingt pixels ; deux dixièmes de plus
 * (2,4) auraient donné un signe gras, étranger au reste du site.
 * ⚠️ LA COCHE SUIT, AU MÊME TRAIT, et c'est la consigne : les deux
 * signes se répondent d'un état à l'autre, dans la même boîte. Une
 * seule constante les sert (piège nº 378) — ils ne peuvent pas
 * diverger.
 * ⚠️ ELLE NE DÉBORDE PAS D'ICI : `IconePlus` et `IconeCocheListe`
 * gardent 1,8 par défaut, et leurs autres appelants (le formulaire,
 * les listes) ne passent rien. Aucun autre écran ne bouge.
 */
const TRAIT_SIGNE_SUIVI = 2.2;
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
 * UN SEUL BOUTON, DEUX ÉTATS, et le libellé dit lequel : « Follow »
 * tant qu'on ne suit pas, « Following » une fois que c'est fait.
 *
 * ██ §3 (nº 869, REFAIT PAR LA nº 870-§4) — IL VIT DANS LA RANGÉE
 * D'ACTIONS DU PROFIL ██
 * ==================================================================
 * SON HABILLAGE N'EST PLUS LE SIEN : il est celui de la rangée —
 * `ActionDeFiche`, LE BADGE à angles arrondis, l'icône à gauche du mot
 * — partagé avec « Instagram » et « Share ». Ce fichier ne dessine
 * plus rien : il ne garde que L'ÉTAT et LE GESTE, qui n'ont pas changé
 * d'une ligne depuis la nº 208.
 *  · « Follow » — un simple « + », SUR LE BLANC de la charte (§5,
 *    nº 871 : la robe de la nº 528 est rendue à cet état, le seul appel
 *    à l'action d'un profil) ;
 *  · « Following » — une COCHE, sur l'aplat gris des badges d'action.
 * ⛔ LES DEUX PERSONNAGES DE LA nº 869 (une tête, des épaules, et le
 * signe à droite) SONT PARTIS avec la nº 871-§6 : le propriétaire veut
 * LE SIGNE SEUL. Ils n'ont plus de lecteur, donc plus de place dans le
 * dépôt (règle nº 386) ; les deux signes qui les remplacent existaient
 * déjà (`IconePlus` du formulaire, `IconeCocheListe` des listes) — on
 * n'en dessine aucun de neuf.
 * ⛔ DE L'HISTOIRE : la capsule (nº 206 → nº 528) et ses deux réglages
 * de boîte (`pleineLargeur`, `classeBoite`, nº 589) sont partis avec la
 * nº 870, le carré de la nº 869 avec eux (règle nº 386). Ce qui revient
 * à la nº 871 n'est pas la capsule, c'est SA COULEUR — portée par le
 * badge, dont la note dit les deux robes.
 * ⚠️ LA NUANCE DE LA nº 870 QUI TOMBE : les deux états ne portent plus
 * la même robe. L'icône et le mot les séparaient déjà ; la couleur les
 * sépare de nouveau, comme avant la nº 869.
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
}: {
  tatoueurId: string;
  nomTatoueur: string;
  suiviAuDepart?: boolean;
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
      <ActionDeFiche
        cle="follow"
        //  §4 (nº 870) — l'un des deux badges à part égale de la rangée.
        large
        onClick={basculer}
        ariaPressed={suivi}
        /*  ██ §1 (nº 868) — CE GESTE N'ÉCRIT RIEN DANS L'HISTORIQUE ██
            Suivre ou ne plus suivre CHANGE UN ÉTAT, cela ne navigue
            pas. Le filet du retour (RetourGaranti) posait son cran —
            une entrée d'historique — au premier appui franc de la page,
            et c'était presque toujours celui-ci : le retour suivant
            tombait alors sur l'entrée jumelle et le rattrapage renvoyait
            à l'accueil (la régression relevée par le propriétaire sur
            son iPhone après la nº 867). Ce marqueur dit au filet de ne
            pas lire ce geste ; la note entière vit chez lui. */
        sansCran
        ariaLabel={
          suivi ? `Unfollow ${nomTatoueur}` : `Follow ${nomTatoueur}`
        }
        /*  ██ §2 (nº 506) — L'ATTENTE NE DIT RIEN ██
            Tant que l'état n'est pas connu, le bouton ne peut annoncer
            NI « Follow » NI « Following » : il garde SA BOÎTE et se
            tait, icône et mot invisibles. Il est aussi sans effet
            pendant ce moment (voir `basculer`).
            §5 (nº 871) — ET IL ATTEND EN GRIS, jamais en blanc : le
            blanc est un APPEL À L'ACTION, donc une promesse — « suivez
            ce portfolio ». On ne la fait pas à quelqu'un qui le suit
            peut-être déjà. L'aplat d'action est neutre, et c'est le
            raisonnement de la nº 506, transposé à la couleur. */
        muet={!etatConnu}
        blanche={etatConnu && !suivi}
        /*  §4 (nº 870) — VINGT PIXELS, l'icône d'une ligne du site, à
            gauche d'un mot de quatorze : la mesure des icônes qui
            accompagnent un texte (les liens d'un profil, le booking).
            §6 (nº 871) — et le SIGNE seul : le plus, puis la coche. */
        icone={
          suivi ? (
            <IconeCocheListe taille={20} trait={TRAIT_SIGNE_SUIVI} />
          ) : (
            <IconePlus taille={20} trait={TRAIT_SIGNE_SUIVI} />
          )
        }
        /*  ██ §5 (nº 871) — L'ICÔNE ET LE MOT, CENTRÉS ENSEMBLE ██
            ==============================================================
            CE QUE LE PROPRIÉTAIRE VOIT : en « Follow », l'icône reste où
            elle serait pour « Following » et UN TROU se creuse à droite
            du mot — le couple n'est pas centré dans son badge.
            LA CAUSE, ET ELLE ÉTAIT VOULUE AILLEURS : la RÉSERVE DE
            LARGEUR de la nº 208-§1 — deux libellés invisibles empilés
            sous le mot visible, pour que le plus long tienne la place.
            Elle existait quand LA BOÎTE se taillait sur son contenu :
            sans elle, le bouton changeait de largeur à chaque bascule et
            poussait ses voisins. DEPUIS LA nº 870, LA BOÎTE NE DÉPEND
            PLUS DU MOT : c'est la rangée qui donne au badge sa part
            (`flex-1`, une part égale). La réserve n'empêche donc plus
            rien de bouger — elle ne fait qu'empêcher le centrage.
            ELLE PART, et le badge centre son contenu comme les deux
            autres.
            ⚠️ « FOLLOWING » NE BOUGE PAS D'UN PIXEL, et c'est
            mécanique : c'est LE PLUS LONG des deux mots, donc la réserve
            valait exactement sa largeur — le couple y était déjà centré.
            Seul « Follow », plus court, se recentre.
            ⚠️ RIEN NE POUSSE AUTOUR : la largeur du badge est celle de sa
            part de rangée, elle ne se mesure pas sur le mot. */
        mot={suivi ? "Following" : "Follow"}
      />
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
