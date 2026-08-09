"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PORTRAIT_ROND } from "@/config/tatouage";
import { ligneCarte } from "@/lib/adresse";
import { IconeCroix } from "@/components/Icones";
import { definir, ecrireFavori } from "@/lib/favoris-yokofolio";
import type { TatoueurSuivi } from "@/lib/favoris-serveur";

/**
 * LES TATOUEURS SUIVIS — la fenêtre
 * ==================================
 * Ouverte depuis le bouton discret du haut de la page Favoris
 * (« Tatoueurs suivis · 12 »). Elle contient trois choses, et rien de
 * plus :
 *   1. LE NOMBRE, en tête ;
 *   2. LA LISTE, défilante — le nom, la localité en dessous, dans le
 *      traitement des cartes (portrait rond, nom en gras, lieu en gris
 *      doux) ;
 *   3. UNE CROIX à droite de chaque ligne, pour retirer.
 *
 * SA ROBE EST CELLE DES FENÊTRES DEPUIS LA Nº 130 : un fond éclairci
 * d'un cran sur le voile, aucun contour, aucune ombre.
 *
 * ⚠️ RETIRER EST IMMÉDIAT ET SANS CONFIRMATION. Ce n'est pas une
 * suppression : on ne détruit rien, on retire quelqu'un d'une liste
 * personnelle — et le bouton « Suivre » de sa fiche le remet en un
 * geste. Demander « êtes-vous sûr ? » pour cela serait du bruit.
 * La ligne quitte l'écran tout de suite ; le magasin partagé prévient
 * au passage le bouton « Suivi » de la fiche, s'il est à l'écran.
 */
export function FenetreTatoueursSuivis({
  suivis,
  onFermer,
}: {
  suivis: TatoueurSuivi[];
  onFermer: () => void;
}) {
  /** CE QU'ON A RETIRÉ pendant que la fenêtre est ouverte. On garde
      les identifiants plutôt qu'une liste recopiée : remettre une
      ligne à SA place après un refus du serveur devient alors trivial
      — il suffit de l'ôter de cet ensemble, l'ordre d'origine n'a
      jamais bougé. */
  const [retires, setRetires] = useState<string[]>([]);
  const liste = suivis.filter((t) => !retires.includes(t.id));

  // Échap referme, et la page ne défile plus derrière.
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") onFermer();
    }
    const defilementAvant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.body.style.overflow = defilementAvant;
    };
  }, [onFermer]);

  function retirer(tatoueur: TatoueurSuivi) {
    //  L'ÉCRAN RÉPOND TOUT DE SUITE, la base suit.
    setRetires((courants) => [...courants, tatoueur.id]);
    definir("tatoueur", tatoueur.id, false);
    void ecrireFavori("tatoueur", tatoueur.id, false).then((ok) => {
      //  Le serveur a refusé : la ligne revient à SA place (l'ordre
      //  d'origine n'a jamais bougé) plutôt que de laisser croire à
      //  un retrait qui n'a pas eu lieu.
      if (ok) return;
      setRetires((courants) => courants.filter((id) => id !== tatoueur.id));
      definir("tatoueur", tatoueur.id, true);
    });
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tatoueurs suivis"
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onFermer}
        className="absolute inset-0 bg-black/60 cursor-default"
      />

      <div
        className="relative w-full max-w-[440px] max-h-[min(88dvh,700px)]
                   flex flex-col rounded-2xl sm:rounded-3xl bg-sombre-carte
                   overflow-hidden
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
      >
        {/* L'EN-TÊTE — LE NOMBRE EN TÊTE, comme demandé : c'est le
            titre lui-même qui le porte. */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-sombre-bordure/60">
          <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
            Tatoueurs suivis · {liste.length}
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                       text-sombre-texte-doux transition-colors hover:text-sombre-texte"
          >
            <IconeCroix taille={18} />
          </button>
        </div>

        {liste.length === 0 ? (
          <p className="px-6 py-10 text-center text-[14px] leading-relaxed text-sombre-texte-doux">
            Tu ne suis personne pour le moment.
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto overscroll-contain divide-y divide-sombre-bordure/50">
            {liste.map((tatoueur) => (
              <li
                key={tatoueur.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3"
              >
                {/* LE TRAITEMENT DES CARTES — portrait rond, nom, lieu
                    dessous. Une liste qui ne ressemble pas aux cartes
                    du site obligerait à réapprendre à lire. */}
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center
                             overflow-hidden rounded-full bg-sombre-eleve"
                >
                  {tatoueur.photoProfil ? (
                    /* eslint-disable-next-line @next/next/no-img-element --
                       photo déposée par le tatoueur, servie telle quelle. */
                    <img
                      src={tatoueur.photoProfil}
                      alt=""
                      width={PORTRAIT_ROND}
                      height={PORTRAIT_ROND}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-[13px] font-bold text-sombre-texte-doux"
                    >
                      {tatoueur.nom.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                <Link
                  href={`/tatoueur/${tatoueur.slug}`}
                  onClick={onFermer}
                  className="min-w-0 flex-1 outline-none focus-visible:underline"
                >
                  <span className="block truncate text-[14.5px] font-semibold text-sombre-texte leading-tight">
                    {tatoueur.nom}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-sombre-texte-doux">
                    {ligneCarte({
                      ville: tatoueur.ville,
                      region: tatoueur.region,
                      pays: tatoueur.pays,
                      code_pays: tatoueur.codePays,
                    })}
                  </span>
                </Link>

                {/* LA CROIX — à droite de la ligne, comme demandé. */}
                <button
                  type="button"
                  onClick={() => retirer(tatoueur)}
                  aria-label={`Ne plus suivre ${tatoueur.nom}`}
                  title="Retirer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                             text-sombre-texte-doux transition-colors
                             hover:bg-sombre-eleve hover:text-sombre-texte"
                >
                  <IconeCroix taille={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
