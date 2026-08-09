"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lieuVersParametres } from "@/lib/geocodage";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { IconeCoeur, IconeUtilisateur } from "@/components/Icones";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import { MenuEspace } from "@/components/MenuEspace";
import { SelecteurLangue } from "@/components/SelecteurLangue";
import {
  lireDejaConnecte,
  lireDejaConnecteServeur,
  marquerDejaConnecte,
  souscrireStockage,
} from "@/lib/deja-connecte";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  criteresComplets,
  MoteurTatouage,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";

/**
 * LA BARRE FIXE DE YOKOFOLIO
 * ==========================
 * Logo à gauche, moteur de recherche AU CENTRE, et à droite le globe
 * des langues puis le compte. Rien d'autre.
 *
 * LE LOGO COMPLET S'AFFICHE PARTOUT, smartphone compris : une marque
 * se lit, elle ne se devine pas — le cœur seul ne suffit pas. Sur
 * smartphone, c'est le bouton de compte qui se réduit en icône pour
 * lui laisser la place.
 *
 * LE COMPTE, trois états :
 *  - jamais venu : « Rejoindre » (web) / l'icône personnage
 *    grise, du même poids visuel que le globe (smartphone) — la
 *    formule d'invitation est réservée à qui n'a jamais eu de compte
 *    ici ;
 *  - DÉJÀ CONNECTÉ SUR CE NAVIGATEUR puis déconnecté : « Se
 *    connecter » — la mémoire est un simple drapeau local (« 1 »),
 *    sans aucune donnée personnelle, comme le font les grands sites ;
 *  - connecté : « MON ESPACE » (web) / l'icône passée en ROSE
 *    (smartphone) — et le bouton n'emmène plus nulle part : il OUVRE
 *    LE MENU DE COMPTE (MenuEspace) — état de la fiche, Modification,
 *    Ma fiche, Déconnexion.
 *
 * LE MOTEUR peut être retiré de la barre MOBILE (`moteurMobile`) : sur
 * les pages sans rapport avec la recherche (connexion, mentions
 * légales, qui sommes-nous), la barre du smartphone ne montre que le
 * logo, le globe et le compte. Sur le web, le moteur reste : il RAMÈNE
 * à l'accueil avec les critères choisis.
 *
 * DEUX FAÇONS DE CHERCHER, un seul composant :
 *  - sur l'accueil, `criteres` et `surRecherche` sont fournis → la
 *    grille se met à jour sur place, sans rechargement ;
 *  - ailleurs (fiche, page style + ville), ils ne le sont pas → le
 *    moteur garde son propre état et RAMÈNE à l'accueil avec les
 *    critères dans l'adresse.
 */

/** Hauteur du globe et du bouton de compte : ils s'alignent au pixel. */
const HAUTEUR_ACTIONS = 40;

export function EnTeteTatouage({
  criteres,
  criteresInitiaux,
  surRecherche,
  moteurMobile = true,
}: {
  /** Critères PILOTÉS PAR LA PAGE (accueil). Absent = état interne. */
  criteres?: CritèresTatouage;
  criteresInitiaux?: Partial<CritèresTatouage>;
  surRecherche?: (criteres: CritèresTatouage) => void;
  /** Faux = pas d'encadré de recherche dans la barre du SMARTPHONE
      (pages connexion, légales, qui sommes-nous). Le web le garde. */
  moteurMobile?: boolean;
}) {
  const router = useRouter();
  const { utilisateur, nom } = useUtilisateur();
  const connecte = utilisateur !== null;

  /** Vrai si un compte s'est DÉJÀ connecté sur ce navigateur : le
      bouton dit alors « Se connecter » au lieu d'inviter à s'inscrire. */
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    lireDejaConnecteServeur
  );
  // Chaque session connectée POSE le drapeau — c'est tout ce qu'on
  // retient de ce navigateur.
  useEffect(() => {
    if (connecte) marquerDejaConnecte();
  }, [connecte]);

  // État interne, utilisé UNIQUEMENT quand la page ne pilote rien
  // (fiche, page style + ville).
  const [internes, setInternes] = useState(() =>
    criteresComplets(criteresInitiaux)
  );
  const valeur = criteres ?? internes;

  function chercher(suivants: CritèresTatouage) {
    if (surRecherche) {
      surRecherche(suivants);
      return;
    }
    setInternes(suivants);
    const parametres = new URLSearchParams();
    if (suivants.style) parametres.set("style", suivants.style);
    if (suivants.exclure.length > 0) {
      parametres.set("exclure", suivants.exclure.join(","));
    }
    if (suivants.lieu) {
      // Le LIEU voyage en clair dans l'adresse (intitulé, contexte,
      // coordonnées) : la recherche reste partageable et survit au
      // rechargement — voir lib/geocodage.
      for (const [cle, valeur] of Object.entries(
        lieuVersParametres(suivants.lieu)
      )) {
        parametres.set(cle, valeur);
      }
      parametres.set("rayon", String(suivants.rayonKm));
    }
    const requete = parametres.toString();
    router.push(requete ? `/?${requete}` : "/");
  }

  /** Déconnecté : « Se connecter » pour qui est déjà venu, la formule
      d'invitation pour les autres. Le même libellé sert d'info-bulle à
      l'icône du smartphone. (Connecté, c'est MenuEspace qui joue.) */
  const libelleDeconnecte = dejaConnecte
    ? "Se connecter"
    : TEXTES_TATOUAGE.lienInscription;

  return (
    <header
      // Le repère du haut de l'écran : la mosaïque s'en sert pour
      // remettre sous les yeux la même carte après un changement de
      // disposition (voir src/lib/carte-du-haut.ts).
      data-barre-fixe=""
      className="sticky top-0 z-50 bg-sombre-fond/95 backdrop-blur border-b border-sombre-bordure"
    >
      <div
        className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                   flex flex-wrap lg:flex-nowrap items-center gap-x-5 gap-y-3 py-3"
      >
        {/* LOGO ET ACTIONS PRENNENT LA MÊME PLACE (`lg:flex-1` des deux
            côtés) : c'est ce qui met le moteur EXACTEMENT au milieu de
            la barre, quelle que soit la longueur du bouton. Les deux
            côtés se resserrent ensemble quand l'écran rétrécit — le
            centre ne bouge donc jamais. */}
        <div className="shrink-0 order-1 lg:flex-1">
          {/* LE LOGO RAMÈNE À L'ACCUEIL — un lien NATIF, exprès. La
              navigation douce de Next a déjà avalé ce clic deux fois
              (page du compte, puis page de création de fiche) : ici,
              c'est le NAVIGATEUR qui navigue, rien ne peut s'interposer
              — et le curseur main est garanti. `draggable=false` :
              une image de lien se laisse « traîner » par défaut, et un
              clic légèrement glissé partait en glisser-déposer muet au
              lieu de naviguer. Le lien épouse le logo (`w-fit`) : pas
              de zone cliquable invisible sur la moitié de la barre. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              c'est un <a> natif PAR CHOIX : la navigation douce de
              <Link> a déjà avalé ce clic en silence, deux fois. */}
          <a
            href="/"
            aria-label={`Accueil ${MARQUE_YOKOFOLIO.nom}`}
            draggable={false}
            className="block w-fit cursor-pointer rounded-lg
                       focus-visible:outline-2 focus-visible:outline-offset-4
                       focus-visible:outline-primaire"
          >
            {/* LE LOGO COMPLET, PARTOUT — le fichier du propriétaire,
                affiché tel quel. Sur smartphone il perd juste quelques
                pixels de hauteur, jamais son nom. */}
            <LogoYokofolio hauteur={48} classe="h-9 sm:h-11 lg:h-12 w-auto" />
          </a>
        </div>

        {/* LE MOTEUR, CENTRÉ. Il passe sous la barre en dessous de
            1024 px (il lui faut de la place pour respirer), et revient
            au milieu dès qu'il y en a. `moteurMobile` faux : il
            disparaît sous 768 px — sur une page sans recherche, un
            moteur dans la barre n'est que du bruit. */}
        <div
          className={`order-3 lg:order-2 basis-full lg:basis-[520px] lg:shrink lg:grow-0
                      min-w-0 justify-center ${
                        moteurMobile ? "flex" : "hidden md:flex"
                      }`}
        >
          <div className="w-full max-w-[560px]">
            <MoteurTatouage criteres={valeur} surChangement={chercher} />
          </div>
        </div>

        <nav
          aria-label="Langue et compte"
          //  gap-3 (nº 141-§7) : le cœur — ou le globe — respirait mal
          //  contre « Mon espace ».
          className="order-2 lg:order-3 ml-auto lg:flex-1 shrink-0 flex items-center justify-end gap-3"
        >
          {/* ⚠️ LA PLACE À GAUCHE DU COMPTE CHANGE DE MAIN SELON QU'ON
              EST CONNECTÉ (passe nº 137) :
               · DÉCONNECTÉ — le GLOBE des langues, comme toujours ;
               · CONNECTÉ — le CŒUR des favoris. Le globe, lui,
                 déménage dans la fenêtre « Mon compte », au-dessus de
                 Sécurité.
              Pourquoi un échange et non un ajout : la barre du
              smartphone tient trois éléments (logo, moteur, compte) et
              pas un de plus. Entre un sélecteur de langue qui ne
              propose qu'une langue et l'accès à ses propres photos, le
              choix se fait tout seul — et le globe reste à un geste,
              dans le menu. */}
          {connecte && utilisateur ? (
            <Link
              href="/mes-favoris"
              aria-label="Mes favoris"
              title="Mes favoris"
              style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
              className="shrink-0 flex items-center justify-center rounded-full
                         transition-colors hover:bg-sombre-eleve
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-primaire
                         text-sombre-texte hover:text-primaire"
            >
              <IconeCoeur taille={Math.round(HAUTEUR_ACTIONS * 0.55)} />
            </Link>
          ) : (
            <SelecteurLangue hauteur={HAUTEUR_ACTIONS} />
          )}

          {connecte && utilisateur ? (
            /* CONNECTÉ : « Mon espace » — le menu de compte (état de
               la fiche, Modification, Ma fiche, Déconnexion). */
            <MenuEspace
              idUtilisateur={utilisateur.id}
              nom={nom}
              hauteur={HAUTEUR_ACTIONS}
            />
          ) : (
            <>
              {/* SMARTPHONE : l'icône personnage, HABILLÉE COMME LE
                  GLOBE (grise, même gabarit, même survol) — elle mène
                  à la connexion. */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                title={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
                className="sm:hidden flex items-center justify-center rounded-full
                           transition-colors hover:bg-sombre-eleve
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire
                           text-sombre-texte hover:text-primaire"
              >
                <IconeUtilisateur taille={22} />
              </Link>

              {/* WEB : le bouton rose. Jamais venu, il invite ; déjà
                  venu, « Se connecter ». */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS }}
                className="hidden sm:flex rounded-full px-5 items-center gap-2
                           bg-primaire hover:bg-primaire-fonce text-white
                           text-sm font-semibold transition-colors whitespace-nowrap
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire"
              >
                <span className="max-w-[180px] truncate">
                  {libelleDeconnecte}
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
