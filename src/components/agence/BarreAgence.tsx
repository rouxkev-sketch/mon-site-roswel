"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ANCRES_MENU,
  CHEMINS_AGENCE,
  LIBELLE_RENDEZ_VOUS,
} from "@/config/agence";
import { LogoComplet } from "@/components/Logo";
import { IconeCroix } from "@/components/Icones";

/**
 * LA BARRE DE MENU DU SITE VITRINE
 * =================================
 * Fixe en haut, blanche, et SANS AUCUNE DÉLIMITATION au repos : ni
 * trait, ni ombre. Elle se pose sur le blanc de la page comme si elle
 * en faisait partie — c'est le parti pris demandé, et c'est celui des
 * sites d'agence d'aujourd'hui.
 *
 * WEB : logo à gauche, les trois ancres au centre, le bouton rose à
 * droite. Chaque ancre fait DÉFILER EN DOUCEUR jusqu'à sa section, en
 * s'arrêtant sous la barre (elle est fixe : sans compensation, le
 * titre de section passerait dessous).
 *
 * SMARTPHONE : trois lignes à droite, et le menu entre EN GLISSANT
 * DE LA DROITE VERS LA GAUCHE, plein écran, liens empilés, croix pour
 * fermer.
 *
 * ACCESSIBILITÉ DU TIROIR — trois choses, et elles comptent :
 *  1. Échap ferme ;
 *  2. le focus ENTRE dans le tiroir à l'ouverture et REVIENT sur le
 *     bouton à la fermeture ;
 *  3. la tabulation TOURNE EN ROND à l'intérieur tant qu'il est
 *     ouvert — sans quoi on tabule à l'aveugle dans la page cachée
 *     derrière.
 */

/** Hauteur de la barre, en pixels. Sert aussi au calcul du défilement. */
const HAUTEUR_BARRE = 80;

/** Ce qui peut recevoir le focus dans le tiroir. */
const FOCUSABLES = 'a[href], button:not([disabled])';

export function BarreAgence() {
  // Les ancres ne renvoient à une section de la MÊME page que sur
  // l'accueil : ailleurs (rendez-vous, pages juridiques), ces
  // sections n'existent pas.
  const chemin = usePathname();
  const surAccueil = chemin === CHEMINS_AGENCE.accueil;

  const [ouvert, setOuvert] = useState(false);
  const tiroir = useRef<HTMLDivElement>(null);
  const boutonMenu = useRef<HTMLButtonElement>(null);

  // Le tiroir couvre l'écran : la page derrière ne doit pas défiler.
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  // Le focus entre dans le tiroir, y reste, et Échap ferme.
  useEffect(() => {
    if (!ouvert) return;
    const panneau = tiroir.current;
    if (!panneau) return;

    const premier = panneau.querySelector<HTMLElement>(FOCUSABLES);
    premier?.focus();

    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") {
        setOuvert(false);
        return;
      }
      if (evenement.key !== "Tab" || !panneau) return;

      const cibles = [...panneau.querySelectorAll<HTMLElement>(FOCUSABLES)];
      if (cibles.length === 0) return;
      const debut = cibles[0];
      const fin = cibles[cibles.length - 1];

      // La tabulation tourne en rond DANS le tiroir.
      if (evenement.shiftKey && document.activeElement === debut) {
        evenement.preventDefault();
        fin.focus();
      } else if (!evenement.shiftKey && document.activeElement === fin) {
        evenement.preventDefault();
        debut.focus();
      }
    }

    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ouvert]);

  /**
   * LES ANCRES DU MENU — de VRAIS LIENS, qui marchent partout
   * ---------------------------------------------------------
   * Chaque ancre pointe vers « /#services », « /#equipe »,
   * « /#faq » : une adresse complète, valable depuis n'importe
   * quelle page du site.
   *
   * SUR L'ACCUEIL, on intercepte le clic pour faire défiler EN
   * DOUCEUR jusqu'à la section, plutôt que de la voir apparaître
   * d'un coup. AILLEURS (page de rendez-vous, pages juridiques), on
   * laisse le lien faire son travail : le navigateur va sur
   * l'accueil, à la bonne section. C'est le bug corrigé — ces liens
   * étaient de simples boutons de défilement, donc sans effet sur
   * une page où les sections n'existent pas.
   *
   * Pourquoi des liens et non des boutons : le clic du milieu,
   * « ouvrir dans un nouvel onglet » et « copier l'adresse »
   * fonctionnent, et le lien reste utilisable si le JavaScript n'a
   * pas encore été chargé.
   */
  function surClicAncre(evenement: React.MouseEvent, id: string) {
    setOuvert(false);
    // Pas sur l'accueil, ou clic « ouvrir ailleurs » : on laisse
    // le navigateur suivre le lien normalement.
    if (
      !surAccueil ||
      evenement.metaKey ||
      evenement.ctrlKey ||
      evenement.shiftKey ||
      evenement.button !== 0
    ) {
      return;
    }

    const section = document.getElementById(id);
    if (!section) return; // sécurité : on retombe sur le lien

    evenement.preventDefault();
    // On ne s'en remet pas à `scroll-margin-top` seul : calculer la
    // position ici garantit le même arrêt sous la barre fixe sur
    // tous les navigateurs, tiroir mobile compris.
    const haut =
      section.getBoundingClientRect().top + window.scrollY - HAUTEUR_BARRE - 16;
    window.scrollTo({ top: Math.max(0, haut), behavior: "smooth" });
    // Le clavier suit le regard : la section devient le point de
    // départ de la tabulation.
    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  }

  /** L'adresse d'une ancre, valable depuis n'importe quelle page. */
  const lienAncre = (id: string) => `${CHEMINS_AGENCE.accueil}#${id}`;

  const classeLien =
    "text-[15px] font-medium text-black/80 hover:text-primaire transition-colors " +
    "rounded-lg px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-4 " +
    "focus-visible:outline-primaire";

  const classeBoutonRose =
    "inline-flex items-center justify-center rounded-full bg-primaire " +
    "hover:bg-primaire-fonce text-white font-semibold transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire";

  return (
    <>
      {/* PAS de bordure, PAS d'ombre : la barre ne se distingue du
          fond que par ce qu'elle porte. */}
      <header
        className="fixed top-0 inset-x-0 z-50 bg-white"
        style={{ height: HAUTEUR_BARRE }}
      >
        <div className="mx-auto w-full max-w-[1280px] h-full px-5 sm:px-8 flex items-center justify-between gap-8">
          <Link
            href={CHEMINS_AGENCE.accueil}
            aria-label="Accueil Roswel"
            className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primaire"
          >
            {/* Emplacement du logo — le fichier définitif du
                propriétaire, affiché tel quel. */}
            <LogoComplet tailleIcone={40} classe="h-9 sm:h-10 w-auto" />
          </Link>

          {/* Les ancres, au centre. Masquées sur smartphone. */}
          <nav
            aria-label="Sections du site"
            className="hidden md:flex items-center gap-9 absolute left-1/2 -translate-x-1/2"
          >
            {ANCRES_MENU.map((ancre) => (
              <Link
                key={ancre.id}
                href={lienAncre(ancre.id)}
                onClick={(evenement) => surClicAncre(evenement, ancre.id)}
                className={classeLien}
              >
                {ancre.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={CHEMINS_AGENCE.rendezVous}
              className={`${classeBoutonRose} hidden md:inline-flex px-6 h-12 text-[15px]`}
            >
              {LIBELLE_RENDEZ_VOUS}
            </Link>

            {/* Les trois lignes — smartphone uniquement. */}
            <button
              ref={boutonMenu}
              type="button"
              onClick={() => setOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={ouvert}
              aria-controls="menu-mobile"
              className="md:hidden w-12 h-12 -mr-2 flex flex-col items-center justify-center gap-[5px]
                         rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
            >
              {[0, 1, 2].map((trait) => (
                <span
                  key={trait}
                  aria-hidden="true"
                  className="block w-6 h-[2px] bg-black rounded-full"
                />
              ))}
            </button>
          </div>
        </div>
      </header>

      {/* ---------- LE TIROIR MOBILE ----------
          Toujours monté (jamais démonté) : c'est ce qui permet de le
          voir GLISSER, à l'aller comme au retour. Fermé, il est
          simplement poussé hors écran.
          ⚠️ FERMÉ, IL DOIT SORTIR DU PARCOURS CLAVIER — sans quoi on
          tabulerait dans un menu qu'on ne voit pas. C'est le rôle de
          `inert`, qui retire tout le sous-arbre de la tabulation ET de
          l'arbre d'accessibilité.
          Pourquoi PAS `invisible` (visibility: hidden) : une
          transition sur `visibility` bascule à MI-PARCOURS (c'est une
          propriété discrète). Le tiroir restait donc invisible les
          150 premières millisecondes de son ouverture — et
          `focus()`, qui ne fait rien sur un élément invisible,
          échouait en silence. */}
      <div
        id="menu-mobile"
        ref={tiroir}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!ouvert}
        className={`md:hidden fixed inset-0 z-[60] bg-white flex flex-col
                    transition-transform duration-300 ease-out
                    ${ouvert ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          className="h-20 px-5 flex items-center justify-between shrink-0"
        >
          <LogoComplet tailleIcone={40} classe="h-9 w-auto" />
          <button
            type="button"
            onClick={() => {
              setOuvert(false);
              boutonMenu.current?.focus();
            }}
            aria-label="Fermer le menu"
            className="w-12 h-12 -mr-2 flex items-center justify-center rounded-xl
                       text-black hover:text-primaire transition-colors
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
          >
            <IconeCroix taille={26} />
          </button>
        </div>

        <nav
          aria-label="Sections du site"
          className="flex-1 px-5 pt-6 flex flex-col gap-1"
        >
          {ANCRES_MENU.map((ancre) => (
            <Link
              key={ancre.id}
              href={lienAncre(ancre.id)}
              onClick={(evenement) => surClicAncre(evenement, ancre.id)}
              className="text-left text-3xl font-semibold py-4 text-black
                         hover:text-primaire transition-colors rounded-lg
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
            >
              {ancre.label}
            </Link>
          ))}
        </nav>

        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Link
            href={CHEMINS_AGENCE.rendezVous}
            onClick={() => setOuvert(false)}
            className={`${classeBoutonRose} w-full h-14 text-base`}
          >
            {LIBELLE_RENDEZ_VOUS}
          </Link>
        </div>
      </div>

      {/* La barre est fixe : elle ne pousse rien. On réserve donc sa
          hauteur en haut de page, une fois pour toutes. */}
      <div aria-hidden="true" style={{ height: HAUTEUR_BARRE }} />
    </>
  );
}
