"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LARGEUR_SITE,
  renduCherche,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";
import { noterDemontage, noterMontage } from "@/lib/journal-bascule";
import { LigneResultats } from "@/components/LigneResultats";
import {
  criteresComplets,
  libelleExplorer,
  libelleStyleChoisi,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";
import type { Tatoueur } from "@/lib/tatoueurs";
import { lieuVersParametres } from "@/lib/geocodage";
import { ligneCarte } from "@/lib/adresse";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { ContexteAffichageServi } from "@/components/AffichageMosaique";
import {
  lireDisposition,
  reprendreDisposition,
  type DispositionGrille,
} from "@/lib/disposition-grille";
import { lirePhototheque, reprendrePhototheque } from "@/lib/vue-phototheque";
import { memoriserRechercheTatouage } from "@/lib/derniere-recherche";

/**
 * L'ACCUEIL DE YOKOFOLIO (adresse « / ») — L'ADRESSE DÉCIDE DE TOUT
 * ==================================================================
 * REFONTE DE LA PASSE Nº 191, ET C'EST LA SEULE RÈGLE DU FICHIER :
 *
 *   les critères, les cartes affichées et le NOMBRE de cartes chargées
 *   viennent de l'adresse, et de rien d'autre. Aucune mémoire
 *   parallèle ne négocie avec elle. Rien ne s'affiche qui n'en découle.
 *
 * CE QUE CELA VEUT DIRE, CONCRÈTEMENT :
 *  · ce composant ne CHERCHE plus. Il n'appelle aucune API, ne garde
 *    aucune liste, ne met plus rien de côté. Il AFFICHE `premiers` —
 *    ce que le serveur a rendu POUR CETTE ADRESSE — et rien d'autre ;
 *  · chercher, c'est CHANGER D'ADRESSE (`router.push`). Le serveur rend
 *    alors la mosaïque filtrée, et l'écran ne montre qu'un seul état :
 *    l'ancien, puis le nouveau. Jamais un troisième, intermédiaire ;
 *  · « Voir plus », c'est aussi changer d'adresse — `&page=2`, `&page=3`
 *    — mais par un REMPLACEMENT (`router.replace`) : la pagination
 *    n'ajoute pas d'étape d'historique. Le retour depuis une fiche
 *    retrouve donc `&page=3`, c'est-à-dire SOIXANTE-DOUZE cartes, sans
 *    qu'aucune mémoire n'ait eu à les garder ;
 *  · la seule chose qui vive hors de l'adresse est la POSITION de
 *    défilement (voir lib/navigation-session et MemoireNavigation),
 *    rangée sous une clé qui contient les critères.
 *
 * CE QUI A ÉTÉ SUPPRIMÉ AVEC CETTE REFONTE : la mosaïque mise de côté
 * (lib/mosaique-session), les jetons de geste et de validation et le
 * verrou de traversée (lib/etapes-historique), l'écoute d'adresse qui
 * relançait une recherche, l'état local des cartes, l'appel à
 * /api/tatoueurs, les interrupteurs de mesure. Chacun doublait la règle
 * ci-dessus ; à plusieurs, ils se contredisaient.
 *
 * Les premières cartes arrivent DÉJÀ RENDUES par le serveur : la page
 * est lisible et indexable avant même que le navigateur n'exécute la
 * moindre ligne.
 */

/** L'ADRESSE D'UNE RECHERCHE — la seule fonction qui la fabrique.
    Les critères, puis la page demandée (jamais écrite pour la
    première : « / » et « /?page=1 » ne doivent pas être deux adresses
    différentes). */
export function parametresDeRecherche(
  criteres: CritèresTatouage,
  page = 1
): URLSearchParams {
  const parametres = new URLSearchParams();
  if (criteres.style) parametres.set("style", criteres.style);
  //  LA NATURE (tatouage / flash) voyage à côté du style, jamais fondue
  //  dedans : une adresse partagée reste lisible à l'œil nu.
  if (criteres.nature) parametres.set("nature", criteres.nature);
  if (criteres.exclure.length > 0) {
    parametres.set("exclure", criteres.exclure.join(","));
  }
  if (criteres.lieu) {
    // Le LIEU voyage en clair (intitulé, contexte, coordonnées) : la
    // recherche est partageable et survit au rechargement.
    for (const [cle, valeur] of Object.entries(
      lieuVersParametres(criteres.lieu)
    )) {
      parametres.set(cle, valeur);
    }
    parametres.set("rayon", String(criteres.rayonKm));
  }
  if (page > 1) parametres.set("page", String(page));
  return parametres;
}

/** L'adresse complète d'une recherche.
    ⚠️ L'AFFICHAGE VOYAGE AVEC ELLE (nº 203-§1b) : la disposition et le
    texte des cartes vivent dans l'adresse — une nouvelle recherche ou
    un « Voir plus » ne doivent pas les remettre au défaut. On relit
    donc les valeurs courantes au moment de fabriquer l'adresse. */
function adresseDe(criteres: CritèresTatouage, page = 1): string {
  const parametres = parametresDeRecherche(criteres, page);
  if (lireDisposition() === "une") parametres.set("disposition", "une");
  if (lirePhototheque()) parametres.set("texte", "sans");
  const requete = parametres.toString();
  return requete ? `/?${requete}` : "/";
}

export function IndexTatoueurs({
  premiers,
  criteresInitiaux,
  demonstration,
  message,
  total,
  page,
  affichage = { disposition: "deux", phototheque: false },
}: {
  /** LES CARTES DE CETTE ADRESSE — toutes celles qu'elle demande,
      pages cumulées comprises. C'est le SEUL contenu de la mosaïque. */
  premiers: Tatoueur[];
  criteresInitiaux?: Partial<CritèresTatouage>;
  demonstration: boolean;
  message: string | null;
  /** COMBIEN DE TATOUEURS RÉPONDENT EN TOUT — pas seulement ceux de
      cette page. C'est lui qui décide s'il faut proposer « Voir plus ». */
  total: number;
  /** La page demandée par l'adresse (1 par défaut). */
  page: number;
  /** L'AFFICHAGE demandé par l'adresse (nº 203-§1b) : la disposition
      de la mosaïque et le texte des cartes — décodés par le serveur,
      comme les critères. */
  affichage?: { disposition: DispositionGrille; phototheque: boolean };
}) {
  const router = useRouter();
  /** Une navigation du routeur est en cours : la mosaïque s'estompe,
      exactement comme elle le faisait pendant une recherche. */
  const [enTransition, demarrerTransition] = useTransition();

  /**
   * QUI REGARDE ? — pour l'appel aux tatoueurs, en bas de page
   * (passe nº 145-§2). Il ne s'affiche QUE pour un visiteur qui n'a pas
   * de compte : une fois connecté, on n'a plus rien à faire dans une
   * invitation à s'inscrire.
   */
  const { utilisateur } = useUtilisateur();

  /** LES CRITÈRES SERVIS — ceux de l'adresse, décodés par le serveur.
      Ce sont EUX que la mosaïque illustre, toujours. */
  const criteresServis = criteresComplets(criteresInitiaux);
  const cleServie = parametresDeRecherche(criteresServis).toString();

  /**
   * CE QUE LES CHAMPS DU MOTEUR AFFICHENT — et rien de plus.
   * ⚠️ CE N'EST PAS UNE MÉMOIRE PARALLÈLE : cet état ne décide d'AUCUNE
   * carte. Il n'existe que pour que le champ réponde au doigt sans
   * attendre le serveur. Et dès que le serveur rend d'autres critères,
   * IL S'Y REMET — pendant le rendu, sans effet ni clignotement (c'est
   * le motif « ajuster un état pendant le rendu » de React).
   */
  const [criteres, setCriteres] = useState(criteresServis);
  const [cleAffichee, setCleAffichee] = useState(cleServie);
  if (cleServie !== cleAffichee) {
    setCleAffichee(cleServie);
    setCriteres(criteresServis);
  }

  //  ⚠️ LA SONDE DE LA BASCULE (nº 173) : le conteneur de page est-il
  //  démonté au clic ? (N'écrit que sous `?sonde-bascule=1`.)
  useEffect(() => {
    noterMontage("page (IndexTatoueurs)");
    return () => noterDemontage("page (IndexTatoueurs)");
  }, []);

  /** LA RECHERCHE SERVIE EST RETENUE LE TEMPS DE LA VISITE (nº 209-§1)
      — pour que la loupe d'une FICHE ouvre le moteur avec les critères
      en cours. Elle ne décide d'aucune carte : voir
      lib/derniere-recherche. */
  useEffect(() => {
    memoriserRechercheTatouage(criteresServis);
  }, [cleServie, criteresServis]);

  /**
   * L'AFFICHAGE EST REMIS AU PAS À CHAQUE RENDU SERVI (nº 212-§3).
   * ⚠️ ON NE REPOSE PLUS CE QUE LE SERVEUR A RENDU, on relit L'ADRESSE
   * COURANTE — et c'est la correction. Au retour depuis une fiche, le
   * routeur restitue le rendu qu'il avait mis en cache pour l'adresse
   * D'ORIGINE : `affichage.disposition` y vaut encore le défaut, et
   * l'ancien effet écrasait donc la disposition choisie. La reprise
   * lit l'adresse, puis, si celle-ci ne dit rien, la préférence de la
   * visite (voir lib/disposition-grille).
   */
  useEffect(() => {
    reprendreDisposition();
    reprendrePhototheque();
  }, [affichage.disposition, affichage.phototheque]);

  /**
   * CHERCHER, C'EST CHANGER D'ADRESSE.
   * Une recherche PART TOUJOURS DE LA PREMIÈRE PAGE : on ne garde pas
   * les soixante-douze cartes d'une recherche pour la suivante.
   * `scroll: false` : la grille ne saute pas pendant qu'on affine (le
   * retour en haut d'une recherche validée est le geste de la page de
   * recherche, voir MoteurTatouage).
   */
  function chercher(suivants: CritèresTatouage) {
    //  Le champ répond tout de suite ; l'adresse tranchera.
    setCriteres(suivants);
    const adresse = adresseDe(suivants, 1);
    demarrerTransition(() => {
      //  UNE RECHERCHE QUI NE CHANGE RIEN N'AJOUTE PAS D'ÉTAPE : rouvrir
      //  la page de recherche et valider sans avoir touché à un critère
      //  ne doit pas empiler une étape identique à la précédente.
      if (adresse === window.location.pathname + window.location.search) {
        router.replace(adresse, { scroll: false });
      } else {
        router.push(adresse, { scroll: false });
      }
    });
  }

  /**
   * « VOIR PLUS » — LA PAGE SUIVANTE PASSE PAR L'ADRESSE
   * ====================================================
   * ⚠️ ET PAR UN REMPLACEMENT, JAMAIS PAR UNE ÉTAPE. C'est ce qui rend
   * l'exigence nº 5 possible sans aucune mémoire : au retour depuis une
   * fiche, l'adresse porte encore `&page=3`, le serveur rend les
   * soixante-douze cartes, et la page a sa hauteur définitive avant la
   * première peinture — la position mémorisée retombe donc juste.
   * En contrepartie, le retour ne repasse pas par les pages
   * intermédiaires : il quitte la liste entière d'un seul geste, ce qui
   * est bien ce qu'on attend d'un bouton « Voir plus ».
   *
   * Pourquoi un bouton et non un défilement infini ? Parce qu'un
   * défilement infini enlève toute chance d'atteindre le pied de page,
   * casse le retour arrière, et n'est suivi par aucun moteur de
   * recherche.
   */
  function voirPlus() {
    demarrerTransition(() => {
      router.replace(adresseDe(criteresServis, page + 1), { scroll: false });
    });
  }

  const visibles = premiers;
  const resteAVoir = total > visibles.length;
  /** Ce que la ligne de résultats annonce : les critères SERVIS, jamais
      ceux que le doigt vient de poser. */
  const affiches = criteresServis;

  /** L'affichage servi, fourni à la grille, aux cartes et aux boutons
      de bascule : c'est LUI que le HTML du serveur montre (nº 203-§1b). */
  const affichageServi = useMemo(
    () => ({
      disposition: affichage.disposition,
      phototheque: affichage.phototheque,
    }),
    [affichage.disposition, affichage.phototheque]
  );

  return (
    <ContexteAffichageServi.Provider value={affichageServi}>
      <EnTeteTatouage
        criteres={criteres}
        surRecherche={(suivants) => chercher(suivants)}
      />

      <main
        className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
      >
        {/* LE TITRE DIT LA RECHERCHE (nº 140) — la pilule de la barre
            dit toujours « Recherche », c'est donc ICI que les critères
            se lisent. LA RÈGLE : le QUOI en titre (« Flashs ·
            Réalisme », « Tous les flashs », « Réalisme ») ; un lieu
            SEUL devient le titre ; les deux → le quoi en titre, le
            lieu derrière le compte. Sans recherche : « Explorer toutes
            les créations », sans sous-titre. */}
        {(() => {
          const quoi =
            libelleExplorer(affiches.nature, affiches.style) ||
            (affiches.style ? libelleStyleChoisi(affiches.style) : "");
          //  ⚠️ LE LIEU AU FORMAT INTERNATIONAL (nº 211-§1) — « Paris,
          //  France », « Austin, TX, États-Unis ». La règle vit dans
          //  lib/adresse (`ligneCarte`), celle-là même qui écrit la
          //  localité sous les cartes : une seule écriture du monde,
          //  pas deux.
          const lieu = affiches.lieu ? ligneCarte(affiches.lieu) : "";
          //  LE RAYON, seulement quand il veut dire quelque chose : on
          //  cherche « à 50 km de Paris », jamais « à 50 km de la
          //  France ».
          const rayon =
            affiches.lieu &&
            (affiches.lieu.precision === "ville" ||
              affiches.lieu.precision === "adresse")
              ? `${affiches.rayonKm} km`
              : "";
          const compte = `${total} création${total > 1 ? "s" : ""}`;
          if (!quoi && !lieu) {
            //  SANS RECHERCHE : l'invitation, et ce que le site est.
            return (
              <LigneResultats
                titre={TEXTES_TATOUAGE.titreMosaique}
                sousTitre={TEXTES_TATOUAGE.sousTitreMosaique}
              />
            );
          }
          //  AVEC UNE RECHERCHE : le titre dit CE QU'ON CHERCHE, le
          //  sous-titre RÉSUME la recherche — compte · lieu · rayon,
          //  séparés par le point médian entouré d'espaces.
          return (
            <LigneResultats
              titre={quoi || lieu || affiches.lieu!.intitule}
              sousTitre={[compte, quoi ? lieu : "", rayon]
                .filter(Boolean)
                .join(" · ")}
            />
          );
        })()}

        {demonstration && message && (
          <p className="mb-6 rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte">
            {message}
          </p>
        )}

        {visibles.length === 0 && (
          <p className="text-sombre-texte-doux py-10">
            Aucun tatoueur ne correspond à cette recherche. Élargir le rayon, ou
            effacer le lieu pour chercher partout.
          </p>
        )}
        {
          // La grille porte aussi la FENÊTRE de fiche (grand écran).
          //  ⚠️ ELLE N'EST JAMAIS DÉMONTÉE, ET C'EST LE POINT (nº 171) :
          //  elle vivait dans la branche d'un ternaire — un instant où
          //  la liste passe par le vide, et React la DÉTRUIT puis la
          //  reconstruit, images comprises. Vu de l'écran : tout le
          //  contenu disparaît, puis revient d'un coup. Le message du
          //  vide s'affiche désormais À CÔTÉ, sans rien démonter.
          //  ⚠️ ET SA CLÉ EST STABLE ET EXPLICITE : la disposition
          //  change PAR LES STYLES, jamais par un remontage — une clé
          //  qui bougerait suffirait à recréer toute la mosaïque.
          <GrilleTatoueurs
            key="mosaique"
            tatoueurs={visibles}
            styleRecherche={affiches.style}
            // LE RENDU vient des interrupteurs : il n'y a recherche par
            // rendu que lorsqu'il n'en reste qu'un allumé.
            renduRecherche={renduCherche(affiches.exclure)}
            //  LA CATÉGORIE (nº 216-§1) : chaque carte met alors en
            //  avant une photo QUI EN EST — plus de réalisation
            //  affichée quand on cherche des flashs.
            natureRecherche={affiches.nature}
            estompee={enTransition}
          />
        }

        {resteAVoir && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={voirPlus}
              disabled={enTransition}
              className="inline-flex items-center justify-center rounded-full px-6 min-h-[46px]
                         border border-sombre-bordure bg-sombre-carte text-[15px]
                         text-sombre-texte hover:border-primaire hover:text-primaire
                         disabled:opacity-60 transition-colors"
            >
              {enTransition ? "Chargement…" : "Voir plus de tatoueurs"}
            </button>
            <p className="text-[13px] text-sombre-texte-doux">
              {visibles.length} sur {total}
            </p>
          </div>
        )}

        {/* ---------- L'APPEL AUX TATOUEURS (passe nº 137) ----------
            EN BAS DE L'ACCUEIL, APRÈS LA MOSAÏQUE — et nulle part
            ailleurs. La barre fixe s'adresse maintenant à tout le
            monde (« Rejoindre ») : l'invitation aux professionnels
            descend ici, où elle rencontre quelqu'un qui vient de voir
            ce que le site fait de leur travail. Elle n'a rien à faire
            dans la barre, qui n'a pas la place — et quatre visiteurs
            sur cinq arrivent par le téléphone.
            DEUX LIGNES, PAS UNE DE PLUS : une question, un bouton.

            ⚠️ POUR LES VISITEURS SANS COMPTE, ET EUX SEULS (passe
            nº 145-§2). Un connecté a déjà franchi cette porte : lui
            redemander « Tu es tatoueur ? » en bas de chaque page
            d'accueil ne lui apprend rien et le traite en inconnu. La
            réponse vient du serveur avec la page, l'appel n'apparaît
            donc jamais pour disparaître ensuite. */}
        {!utilisateur && (
        <section className="mt-14 rounded-2xl bg-sombre-carte px-5 py-8 text-center">
          <h2 className="text-[19px] font-bold tracking-tight text-sombre-texte">
            {TEXTES_TATOUAGE.titreAppelTatoueur}
          </h2>
          {/* LE BOUTON MÈNE DROIT À LA CRÉATION DE PORTFOLIO — pas à
              une page de présentation. Un compte déjà connecté y
              arrive sur le formulaire vierge ; un visiteur passe
              d'abord par la création de compte, et y revient (c'est
              le rôle de `?suite=`). */}
          {/* ⚠️ ON REMONTE AVANT DE PARTIR (nº 143-§5). Ce bouton est
              le SEUL du site qu'on touche depuis le BAS d'une page très
              longue : la mosaïque fait plusieurs milliers de pixels, et
              la page d'après en fait quelques centaines. Remonter au
              départ, plutôt qu'à l'arrivée, ne laisse aucune chance à
              une image intermédiaire — la nouvelle page naît en haut.
              (DefilementEnHaut tient déjà le cas général, désormais
              avant peinture ; ici, c'est ceinture et bretelles pour le
              chemin le plus exposé.) */}
          <Link
            onClick={() =>
              window.scrollTo({ top: 0, left: 0, behavior: "instant" })
            }
            href={`/devenir-tatoueur?suite=${encodeURIComponent(
              "/devenir-tatoueur/fiche?fiche=nouvelle"
            )}`}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center
                       rounded-full bg-primaire px-7 text-[15px] font-semibold
                       text-white transition-colors hover:bg-primaire-fonce
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {TEXTES_TATOUAGE.boutonAppelTatoueur}
          </Link>
        </section>
        )}
      </main>
    </ContexteAffichageServi.Provider>
  );
}
