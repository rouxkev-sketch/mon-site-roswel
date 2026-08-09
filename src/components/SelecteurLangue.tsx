"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LANGUES_YOKOFOLIO } from "@/config/tatouage";
import { IconeCroix, IconeMonde } from "@/components/Icones";

/**
 * LE SÉLECTEUR DE LANGUE
 * =======================
 * Deux déclencheurs, une seule liste :
 *  - `barre` : le globe rond de la barre fixe (visiteur non connecté) ;
 *  - `entree` : une ligne du menu « Mon compte » — c'est là que le
 *    globe vit une fois connecté, la barre gardant le cœur des
 *    favoris (passe nº 137).
 *
 * LA FENÊTRE (refonte nº 138, à la charte — plus de contour, plus
 * d'ombre, plus de phrase explicative) :
 *  - WEB, depuis la barre : posée SOUS LA BARRE FIXE, alignée sur le
 *    globe — l'habillage EXACT de la fenêtre « Mon compte » (290 px,
 *    coins 2xl, fond carte) ;
 *  - SMARTPHONE, et depuis le menu sur les deux appareils : une
 *    FENÊTRE SUPERPOSÉE centrée derrière son voile — le traitement de
 *    toutes les fenêtres du site (notifications, tatoueurs suivis).
 *    ⚠️ LE PANNEAU QUI MONTAIT DU BAS A DISPARU, et sa poignée de
 *    glissement avec lui : c'était le dernier écran à le faire.
 *
 * QUEL HABILLAGE POUR QUEL APPAREIL : la détection C1
 * (`dataset.appareil`), jamais la largeur de fenêtre — un iPhone
 * tourné reste un téléphone. La question ne se pose qu'au clic
 * d'ouverture, côté navigateur : aucune discordance d'hydratation.
 *
 * ⚠️ RIEN N'EST BRANCHÉ, ET C'EST VOULU. Seul le français est actif ;
 * les autres langues sont grisées et NON CLIQUABLES (`disabled`, et
 * `aria-disabled` pour les lecteurs d'écran) avec la mention
 * « bientôt » — c'est elle qui explique, plus aucune phrase
 * au-dessus de la liste. La structure est prête : voir
 * LANGUES_YOKOFOLIO dans src/config/tatouage.ts.
 *
 * FERMETURE : Échap partout ; un clic hors de la fenêtre (web sous la
 * barre) ; le voile ou la croix (superposée). Le focus revient sur le
 * déclencheur.
 */
export function SelecteurLangue({
  hauteur = 40,
  variante = "barre",
}: {
  hauteur?: number;
  variante?: "barre" | "entree";
}) {
  const [ouvert, setOuvert] = useState(false);
  /** L'habillage choisi AU CLIC : superposée, ou sous la barre.
      Depuis le menu, toujours superposée ; depuis la barre, seulement
      sur un vrai mobile (C1). */
  const [superposee, setSuperposee] = useState(false);
  const globe = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);

  const langueActive =
    LANGUES_YOKOFOLIO.find((langue) => langue.actif) ?? LANGUES_YOKOFOLIO[0];

  function ouvrir() {
    setSuperposee(
      variante === "entree" ||
        document.documentElement.dataset.appareil === "mobile"
    );
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    globe.current?.focus();
  }

  // Échap ferme ; la page ne défile plus derrière la SUPERPOSÉE (la
  // fenêtre sous la barre, elle, laisse la page vivre — comme le menu
  // de compte). Un clic hors de la fenêtre sous la barre ferme aussi.
  useEffect(() => {
    if (!ouvert) return;
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermer();
    }
    function auPointeur(evenement: MouseEvent) {
      if (superposee) return; // Là-bas, c'est le voile qui ferme.
      if (!zone.current?.contains(evenement.target as Node)) setOuvert(false);
    }
    const defilementAvant = document.body.style.overflow;
    if (superposee) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", auPointeur);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", auPointeur);
      if (superposee) document.body.style.overflow = defilementAvant;
    };
  }, [ouvert, superposee]);

  // Le focus ENTRE dans la fenêtre à l'ouverture et y TOURNE EN ROND :
  // sans ça, la tabulation partirait à l'aveugle dans la page derrière.
  useEffect(() => {
    if (!ouvert) return;
    const boite = panneau.current;
    if (!boite) return;
    const focusables = () => [
      ...boite.querySelectorAll<HTMLElement>("button:not([disabled])"),
    ];
    focusables()[0]?.focus();
    function auTab(evenement: KeyboardEvent) {
      if (evenement.key !== "Tab") return;
      const liste = focusables();
      if (liste.length === 0) return;
      const premier = liste[0];
      const dernier = liste[liste.length - 1];
      if (evenement.shiftKey && document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
      } else if (!evenement.shiftKey && document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
      }
    }
    document.addEventListener("keydown", auTab);
    return () => document.removeEventListener("keydown", auTab);
  }, [ouvert]);

  /** La liste — écrite UNE fois, posée dans les deux habillages. */
  const liste = (
    <ul className="flex flex-col gap-0.5">
      {LANGUES_YOKOFOLIO.map((langue) => (
        <li key={langue.code}>
          <button
            type="button"
            lang={langue.code}
            disabled={!langue.actif}
            aria-disabled={!langue.actif}
            aria-current={langue.actif ? "true" : undefined}
            onClick={langue.actif ? fermer : undefined}
            className={`w-full flex items-center gap-3 min-h-[46px] px-3 rounded-xl
                        text-left text-[14.5px] transition-colors ${
                          langue.actif
                            ? "text-sombre-texte hover:bg-sombre-eleve font-semibold"
                            : "text-sombre-texte-doux/50 cursor-not-allowed"
                        }`}
          >
            {/* La puce ronde désigne la langue en cours — le seul
                repère, puisque aucune autre n'est cliquable. BLANCHE
                (nº 141-§5) : le rose est réservé aux accents forts,
                et une langue active n'en est pas un. */}
            <span
              aria-hidden
              className={`w-2 h-2 rounded-full shrink-0 ${
                langue.actif ? "bg-white" : "bg-sombre-bordure"
              }`}
            />
            {langue.label}
            {!langue.actif && (
              <span className="ml-auto text-[11.5px] uppercase tracking-wide">
                bientôt
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={zone}
      className={variante === "entree" ? "" : "relative shrink-0"}
    >
      {variante === "entree" ? (
        /* ---- LE GLOBE COMME ENTRÉE DE MENU (passe nº 137) ----
           Même costume que les autres entrées : hauteur, graisse,
           boîte d'icône à largeur fixe. La langue courante s'écrit à
           droite, en clair. */
        <button
          ref={globe}
          type="button"
          onClick={ouvrir}
          aria-haspopup="dialog"
          aria-expanded={ouvert}
          className="flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px]
                     text-left text-[14.5px] font-semibold text-sombre-texte
                     hover:bg-sombre-eleve transition-colors"
        >
          <span className="flex w-[22px] shrink-0 justify-center text-sombre-texte/80">
            <IconeMonde taille={22} />
          </span>
          <span className="flex-1">Langue</span>
          <span className="shrink-0 text-[12.5px] font-medium uppercase tracking-wide text-sombre-texte-doux">
            {langueActive.code ?? langueActive.label}
          </span>
        </button>
      ) : (
        <button
          ref={globe}
          type="button"
          onClick={ouvrir}
          aria-haspopup="dialog"
          aria-expanded={ouvert}
          aria-label={`Langue : ${langueActive.label}`}
          title={`Langue : ${langueActive.label}`}
          // MÊME HAUTEUR que le bouton rose à sa droite : la barre garde
          // une seule ligne d'appui, sans décalage d'un pixel.
          style={{ height: hauteur, width: hauteur }}
          // OUVERT, LE GLOBE PASSE EN ROSE : on voit d'un coup d'œil
          // que la fenêtre affichée est LA SIENNE — même langage que
          // l'icône de compte, rose quand on est connecté.
          className={`shrink-0 flex items-center justify-center rounded-full
                     transition-colors hover:bg-sombre-eleve
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire ${
                       ouvert
                         ? "text-primaire"
                         : "text-sombre-texte hover:text-primaire"
                     }`}
        >
          {/* LE GLOBE DESSINÉ — celui du code, en `currentColor`.
              ⚠️ CE N'EST PAS `icone-world.png`. Une passe l'avait
              remplacé ici ; l'image du propriétaire ne sert QU'AU lien
              « Site internet ou Linktree » de la fiche publique. */}
          <IconeMonde taille={22} />
        </button>
      )}

      {/* ---- LA FENÊTRE SOUS LA BARRE (web, depuis le globe) ----
          L'habillage EXACT de la fenêtre « Mon compte » : 290 px sous
          le déclencheur, alignée à droite, fond carte, AUCUN contour,
          AUCUNE ombre. Ni titre ni croix — comme elle : la liste se
          suffit, Échap et le clic extérieur ferment. */}
      {ouvert && !superposee && (
        <div
          ref={panneau}
          role="dialog"
          aria-label="Choisir la langue"
          className="absolute top-full right-0 z-30 mt-2 w-[290px]
                     rounded-2xl bg-sombre-carte"
        >
          <div className="px-2 py-2">{liste}</div>
        </div>
      )}

      {/* ---- LA FENÊTRE SUPERPOSÉE (smartphone, et depuis le menu) --
          Le traitement de toutes les fenêtres du site : voile sombre,
          fenêtre centrée au fond carte, titre et croix en tête, la
          ligne d'en-tête d'un bord à l'autre.
          ⚠️ POSÉE DANS <body> (portail) : le flou d'arrière-plan de la
          barre ferait sinon d'elle le repère des éléments fixes.
          z-[85] : au-dessus du menu « Mon compte » (z-[70]), d'où elle
          peut être ouverte. */}
      {ouvert &&
        superposee &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choisir la langue"
            className="fixed inset-0 z-[85] flex items-center justify-center px-8 py-6"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={fermer}
              className="absolute inset-0 bg-black/60 cursor-default"
            />
            <div
              ref={panneau}
              className="relative w-full max-w-[320px] max-h-[min(88dvh,640px)]
                         flex flex-col rounded-3xl bg-sombre-carte overflow-hidden
                         opacity-100 transition-opacity duration-200 starting:opacity-0"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sombre-bordure/60">
                <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
                  Langue
                </h2>
                <button
                  type="button"
                  onClick={fermer}
                  aria-label="Fermer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                             text-sombre-texte-doux transition-colors hover:text-sombre-texte"
                >
                  <IconeCroix taille={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {liste}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
