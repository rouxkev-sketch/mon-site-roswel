"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LANGUES_YOKOFOLIO } from "@/config/tatouage";
import { IconeCroix, IconeMonde } from "@/components/Icones";

/**
 * LE SÉLECTEUR DE LANGUE
 * =======================
 * Le globe de la barre fixe. Il ouvre la liste des langues :
 *  - WEB / iPad (≥ 768 px) : une FENÊTRE posée au centre de l'écran ;
 *  - SMARTPHONE (< 768 px) : un PANNEAU QUI MONTE DU BAS.
 * Un seul composant, un seul état : les deux habillages affichent
 * rigoureusement la même liste — impossible qu'ils divergent.
 *
 * ⚠️ RIEN N'EST BRANCHÉ, ET C'EST VOULU. Seul le français est actif ;
 * les autres langues sont grisées et NON CLIQUABLES (`disabled`, et
 * `aria-disabled` pour les lecteurs d'écran). Proposer une langue
 * qu'on ne sert pas serait une promesse en l'air. La structure, elle,
 * est prête : voir LANGUES_YOKOFOLIO dans src/config/tatouage.ts.
 *
 * FERMETURE : la croix, la touche Échap, un clic sur le fond, ou —
 * sur smartphone — un glissement vers le bas. Le focus revient sur le
 * globe : on ne perd jamais le fil au clavier.
 */
export function SelecteurLangue({ hauteur = 40 }: { hauteur?: number }) {
  const [ouvert, setOuvert] = useState(false);
  const globe = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);

  const langueActive =
    LANGUES_YOKOFOLIO.find((langue) => langue.actif) ?? LANGUES_YOKOFOLIO[0];

  function fermer() {
    setOuvert(false);
    globe.current?.focus();
  }

  // Échap ferme, et la page derrière ne défile plus tant que la
  // fenêtre est ouverte.
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") {
        setOuvert(false);
        globe.current?.focus();
      }
    }
    document.addEventListener("keydown", auClavier);
    return () => {
      document.body.style.overflow = avant;
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  // Le focus ENTRE dans le panneau à l'ouverture et y TOURNE EN ROND :
  // sans ça, la tabulation partirait à l'aveugle dans la page cachée
  // derrière la fenêtre.
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
      const cibles = focusables();
      if (cibles.length === 0) return;
      const debut = cibles[0];
      const fin = cibles[cibles.length - 1];
      if (evenement.shiftKey && document.activeElement === debut) {
        evenement.preventDefault();
        fin.focus();
      } else if (!evenement.shiftKey && document.activeElement === fin) {
        evenement.preventDefault();
        debut.focus();
      }
    }
    document.addEventListener("keydown", auTab);
    return () => document.removeEventListener("keydown", auTab);
  }, [ouvert]);

  // GLISSEMENT VERS LE BAS pour fermer (smartphone) — même geste que
  // les feuilles du reste du site.
  const [glisse, setGlisse] = useState(0);
  const [enGlissement, setEnGlissement] = useState(false);
  const depart = useRef<number | null>(null);

  function glissementDebut(evenement: React.PointerEvent) {
    depart.current = evenement.clientY;
    setEnGlissement(true);
    try {
      evenement.currentTarget.setPointerCapture(evenement.pointerId);
    } catch {
      // Navigateur sans capture de pointeur : le glissement marche
      // quand même tant que le doigt reste sur la poignée.
    }
  }
  function glissementBouge(evenement: React.PointerEvent) {
    if (depart.current === null) return;
    setGlisse(Math.max(0, evenement.clientY - depart.current));
  }
  function glissementFin() {
    if (glisse > 70) fermer();
    depart.current = null;
    setEnGlissement(false);
    setGlisse(0);
  }

  /** La liste — écrite UNE fois, affichée dans les deux habillages. */
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
            className={`w-full flex items-center gap-3 min-h-[48px] px-3 rounded-xl
                        text-left text-base transition-colors ${
                          langue.actif
                            ? "text-sombre-texte hover:bg-sombre-eleve font-semibold"
                            : "text-sombre-texte-doux/50 cursor-not-allowed"
                        }`}
          >
            {/* La puce ronde désigne la langue en cours — le seul
                repère, puisque aucune autre n'est cliquable. */}
            <span
              aria-hidden
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                langue.actif ? "bg-primaire" : "bg-sombre-bordure"
              }`}
            />
            {langue.label}
            {!langue.actif && (
              <span className="ml-auto text-[12px] uppercase tracking-wide">
                bientôt
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <button
        ref={globe}
        type="button"
        onClick={() => setOuvert(true)}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Langue : ${langueActive.label}`}
        title={`Langue : ${langueActive.label}`}
        // MÊME HAUTEUR que le bouton rose à sa droite : la barre garde
        // une seule ligne d'appui, sans décalage d'un pixel.
        style={{ height: hauteur, width: hauteur }}
        // OUVERT, LE GLOBE PASSE EN ROSE (la couleur primaire de la
        // charte, #EE3D6F) : on voit d'un coup d'œil que l'écran des
        // langues affiché est LE SIEN — même langage que l'icône de
        // compte, rose quand on est connecté.
        className={`shrink-0 flex items-center justify-center rounded-full
                   transition-colors hover:bg-sombre-eleve
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire ${
                     ouvert
                       ? "text-primaire"
                       : "text-sombre-texte hover:text-primaire"
                   }`}
      >
        {/* LE GLOBE DESSINÉ — celui du code, en `currentColor` : il
            suit les couleurs ci-dessus, gris au repos et rose une
            fois la fenêtre ouverte.
            ⚠️ CE N'EST PAS `icone-world.png`. Une passe l'avait
            remplacé ici ; l'image du propriétaire ne sert QU'AU lien
            « Site internet ou Linktree » de la fiche publique. */}
        <IconeMonde taille={Math.round(hauteur * 0.55)} />
      </button>

      {/* ⚠️ POSÉ DIRECTEMENT DANS LA PAGE (createPortal), et non dans
          la barre. Pourquoi : la barre porte un flou d'arrière-plan
          (`backdrop-blur`), et un élément flouté devient le REPÈRE de
          tous ses descendants « fixes ». La fenêtre se serait donc
          calée sur la barre — 110 px de haut — au lieu de l'écran, et
          serait sortie par le haut. Le portail la sort de la barre :
          elle retrouve l'écran entier pour repère. */}
      {ouvert &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choisir la langue"
          className="fixed inset-0 z-[80] flex flex-col justify-end md:items-center md:justify-center"
        >
          {/* Le fond : un clic dessus ferme. */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={fermer}
            className="absolute inset-0 bg-black/60 md:bg-black/50 cursor-default"
          />

          <div
            ref={panneau}
            style={{
              transform: glisse ? `translateY(${glisse}px)` : undefined,
              transition: enGlissement ? "none" : "transform .25s ease",
            }}
            className="relative w-full md:w-[380px] md:max-w-[92vw]
                       rounded-t-3xl md:rounded-3xl
                       bg-sombre-carte text-sombre-texte
                       border-t md:border border-sombre-bordure
                       shadow-2xl
                       pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4
                       animate-[rw-feuille-monte_.25s_ease] md:animate-none"
          >
            {/* La poignée de glissement — smartphone uniquement. */}
            <div
              className="md:hidden pt-3 pb-1 flex justify-center cursor-grab touch-none"
              onPointerDown={glissementDebut}
              onPointerMove={glissementBouge}
              onPointerUp={glissementFin}
              onPointerCancel={glissementFin}
            >
              <span
                aria-hidden
                className="w-10 h-1.5 rounded-full bg-sombre-bordure"
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 pt-2 md:pt-4 pb-2">
              <h2 className="text-lg font-bold">Langue</h2>
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                className="w-10 h-10 -mr-1 flex items-center justify-center rounded-full
                           text-sombre-texte-doux hover:text-sombre-texte
                           hover:bg-sombre-eleve transition-colors"
              >
                <IconeCroix taille={22} />
              </button>
            </div>

            {/* LA PHRASE, JUSTE SOUS LE TITRE : elle explique pourquoi
                six langues sur sept sont éteintes, et il faut l'avoir
                lue AVANT de parcourir la liste. Discrète, sans encadré
                ni couleur — une explication, pas une alerte. */}
            <p className="px-4 pt-1 pb-5 text-[13.5px] leading-relaxed text-sombre-texte-doux">
              Pour le moment, YokoFolio parle français.
            </p>

            <div className="px-2 pb-4">{liste}</div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
