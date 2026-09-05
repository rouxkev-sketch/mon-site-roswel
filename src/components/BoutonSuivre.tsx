"use client";

import { useEffect, useRef, useState } from "react";
//  §1 (nº 396) — l'invitation à créer un compte : la MÊME fenêtre
//  que le fanion, écrite une seule fois.
import { FenetreInvitationCompte } from "@/components/FenetreInvitationCompte";
//  §4 (nº 870) — LE BADGE DE LA RANGÉE (icône à gauche du mot) :
//  l'écriture unique des trois actions d'un profil, et ses deux dessins.
import { ActionDeFiche } from "@/components/ActionDeFiche";
import { IconeSuivi, IconeSuivre } from "@/components/Icones";
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
 *  · « Follow » — le personnage avec un « + » ;
 *  · « Following » — le même personnage avec une COCHE.
 * ⛔ DE L'HISTOIRE : la capsule (nº 206 → nº 528, blanc plein pour
 * « Suivre », gris plein pour « Suivi »), ses deux réglages de boîte
 * (`pleineLargeur`, `classeBoite`, nº 589) et le carré de la nº 869
 * sont partis — ils n'ont plus de lecteur (règle nº 386).
 * ⚠️ LES DEUX ÉTATS PORTENT LA MÊME ROBE (nº 870) : c'est l'icône et le
 * mot qui les séparent, la note du badge le dit et le pourquoi est là.
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
            NI « Follow » NI « Following » : il garde SA BOÎTE — le badge
            et sa robe, la même dans les deux états, qui ne promet donc
            rien — et se tait, icône et mot invisibles. Il est aussi sans
            effet pendant ce moment (voir `basculer`). */
        muet={!etatConnu}
        /*  §4 (nº 870) — VINGT PIXELS, l'icône d'une ligne du site, à
            gauche d'un mot de quatorze : la mesure des icônes qui
            accompagnent un texte (les liens d'un profil, le booking). */
        icone={suivi ? <IconeSuivi taille={20} /> : <IconeSuivre taille={20} />}
        mot={
          /*  ⚠️ LES DEUX LIBELLÉS OCCUPENT LA MÊME LARGEUR (nº 208-§1) :
               ils sont posés dans la même case de grille, le plus long
               réservant la place. Le mot ne change donc pas d'un pixel
               entre « Follow » et « Following ».
               §4 (nº 870) — LA BOÎTE N'EN DÉPEND PLUS (c'est la rangée
               qui donne au badge sa part de largeur), MAIS L'INTÉRIEUR
               SI : sans cette réserve, l'icône et le mot, centrés
               ensemble, se décaleraient à chaque bascule. */
          <span className="grid text-center">
            <span className="col-start-1 row-start-1">
              {suivi ? "Following" : "Follow"}
            </span>
            <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
              Follow
            </span>
            <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
              Following
            </span>
          </span>
        }
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
