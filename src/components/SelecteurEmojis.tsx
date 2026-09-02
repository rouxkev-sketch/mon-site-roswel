"use client";

import { useEffect, useRef, useState } from "react";
import { IconeEmoji, IconeLoupe } from "@/components/Icones";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { CATEGORIES_EMOJIS, chercherEmojis } from "@/lib/emojis";

/**
 * LE SÉLECTEUR D'ÉMOJIS COMPLET — toutes catégories, avec recherche
 * ==================================================================
 * Un petit bouton visage posé sur le champ bio (WEB uniquement : les
 * claviers des vrais mobiles ont déjà leurs émojis). Il ouvre un
 * panneau : un champ de RECHERCHE en tête (« rose », « dragon »,
 * « skull »…), puis TOUTES les catégories, section par section, dans
 * une grille qui défile. Un clic insère l'émoji À LA POSITION DU
 * CURSEUR et le panneau reste ouvert — on en met souvent plusieurs.
 * Il se ferme d'un clic ailleurs, par Échap, ou en recliquant le
 * bouton. Fait maison, aucune dépendance (src/lib/emojis.ts).
 */
export function SelecteurEmojis({
  surInsertion,
}: {
  /** Reçoit l'émoji cliqué — le champ l'insère au curseur. */
  surInsertion: (emoji: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const racine = useRef<HTMLDivElement>(null);

  // Un clic HORS du sélecteur, ou Échap : le panneau se referme.
  useEffect(() => {
    if (!ouvert) return;
    function auClic(evenement: MouseEvent) {
      if (!racine.current?.contains(evenement.target as Node)) {
        setOuvert(false);
      }
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouvert]);

  const resultats = chercherEmojis(recherche);
  const enRecherche = recherche.trim().length > 0;

  const boutonEmoji = (emoji: string, mots: string) => (
    <button
      key={emoji + mots}
      type="button"
      onClick={() => surInsertion(emoji)}
      aria-label={`Insert ${emoji}`}
      title={mots}
      className="w-8 h-8 flex items-center justify-center rounded-lg
                 text-[17px] leading-none hover:bg-sombre-eleve
                 transition-colors"
    >
      {emoji}
    </button>
  );

  return (
    <div ref={racine} className="relative hidden mobile:hidden lg:block">
      <button
        type="button"
        onClick={() => {
          setOuvert((etat) => !etat);
          setRecherche("");
        }}
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-label="Add an emoji"
        title="Add an emoji"
        className={`w-8 h-8 flex items-center justify-center rounded-full
                   transition-colors ${
                     ouvert
                       ? "text-primaire bg-sombre-eleve"
                       : "text-sombre-texte-doux hover:text-primaire hover:bg-sombre-eleve"
                   }`}
      >
        <IconeEmoji taille={20} />
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label="Choose an emoji"
          className="absolute right-0 top-full mt-2 z-30 w-[324px]
                     rounded-2xl bg-sombre-carte border border-sombre-bordure
                     shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* LA RECHERCHE — en tête, toujours visible. */}
          <div className="p-2.5 border-b border-sombre-bordure">
            <div className="flex items-center gap-2 rounded-xl bg-sombre-eleve px-3">
              <IconeLoupe taille={16} classe="shrink-0 text-sombre-texte-doux" />
              <input
                type="text"
                {...sansRemplissageAuto("recherche-emoji")}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Search (rose, dragon, skull…)"
                aria-label="Search emojis"
                className="w-full min-h-[36px] bg-transparent text-[13.5px]
                           text-sombre-texte placeholder:text-sombre-texte-doux
                           outline-none"
              />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto overscroll-contain p-2.5">
            {enRecherche ? (
              resultats.length > 0 ? (
                <div className="grid grid-cols-8 gap-0.5">
                  {resultats.map(([emoji, mots]) => boutonEmoji(emoji, mots))}
                </div>
              ) : (
                <p className="px-1 py-3 text-[13px] text-sombre-texte-doux">
                  Nothing found — try another word.
                </p>
              )
            ) : (
              CATEGORIES_EMOJIS.map((categorie) => (
                <section key={categorie.slug} className="mb-2 last:mb-0">
                  <h3 className="px-1 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                    {categorie.titre}
                  </h3>
                  <div className="grid grid-cols-8 gap-0.5">
                    {categorie.emojis.map(([emoji, mots]) =>
                      boutonEmoji(emoji, mots)
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
