"use client";

import { useEffect, useState } from "react";
import { IconeChevronBas } from "@/components/Icones";
import {
  etatOuverture,
  JOURS_STUDIO,
  libelleDuJour,
  momentChezLeStudio,
  semaineDepuisBase,
  semaineRenseignee,
} from "@/lib/horaires-studio";

/**
 * LES HORAIRES D'UN STUDIO, SUR SA FICHE PUBLIQUE
 * ================================================
 * UN ACCORDÉON, REPLIÉ PAR DÉFAUT. Ce qu'on vient chercher tient en
 * quatre mots — « ouvert ? jusqu'à quand ? » — et c'est exactement ce
 * que porte l'EN-TÊTE. Le tableau des sept jours est en dessous, pour
 * qui veut préparer sa semaine ; il n'a aucune raison d'occuper
 * l'écran de tous les autres.
 *
 * L'EN-TÊTE DIT L'ÉTAT, EN COULEUR ET EN TOUTES LETTRES :
 *   · « Ouvert • Ferme à 19h »          — en VERT
 *   · « Fermé • Ouvre à 14h »           — en ROUGE (coupure du midi)
 *   · « Fermé • Ouvre demain à 10h »    — en ROUGE
 *   · « Fermé • Ouvre mardi à 10h »     — en ROUGE
 * La couleur ne porte JAMAIS l'information seule : la phrase dit déjà
 * tout, et reste lisible pour qui ne distingue pas le vert du rouge.
 *
 * ⚠️ L'ÉTAT EST CALCULÉ DANS LE FUSEAU DU STUDIO, jamais dans celui
 * du visiteur : un studio de Montréal ne doit pas être annoncé ouvert
 * parce qu'il est 15 h à Paris. Tout se joue dans `etatOuverture`
 * (lib/horaires-studio), à un seul endroit.
 *
 * IL SE MET À JOUR TOUT SEUL. Une page de fiche reste ouverte
 * longtemps ; sans ce rafraîchissement, « Ferme à 19h » resterait
 * affiché à 19 h 30. Une minute de granularité suffit — c'est celle
 * de l'information.
 *
 * `suppressHydrationWarning` SUR LES DEUX ÉLÉMENTS DATÉS : le serveur
 * rend la page à un instant, le navigateur la reprend à un autre. Si
 * une minute a passé entre les deux, les deux textes diffèrent — et
 * c'est NORMAL, pas un défaut à corriger. On le dit à React plutôt
 * que de laisser un avertissement dans la console de tout le monde.
 */

export function HorairesStudio({
  horaires,
  fuseau,
  /** Le style de titre de la fiche qui l'accueille. */
  titreClasse,
}: {
  horaires: unknown;
  fuseau: string | null | undefined;
  titreClasse: string;
}) {
  const semaine = semaineDepuisBase(horaires);
  const [ouvert, setOuvert] = useState(false);
  // L'HORLOGE, RELUE CHAQUE MINUTE. `useState` porte l'instant, et
  // non l'état calculé : ainsi le calcul reste dans une seule
  // fonction, testable, et le composant ne fait que la rappeler.
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const minuteur = window.setInterval(() => setMaintenant(new Date()), 60_000);
    return () => window.clearInterval(minuteur);
  }, []);

  // RIEN DE RENSEIGNÉ : pas d'accordéon du tout. Une semaine vide
  // n'est pas « fermé sept jours sur sept », c'est un studio qui n'a
  // rien dit — et annoncer « Fermé » à sa place serait un mensonge
  // qui lui coûterait des clients.
  if (!semaineRenseignee(semaine)) return null;

  const etat = etatOuverture(semaine, fuseau, maintenant);
  const aujourdhui = momentChezLeStudio(fuseau, maintenant).jour;

  return (
    <section>
      <h2 className={titreClasse}>Horaires</h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-sombre-bordure">
        <button
          type="button"
          onClick={() => setOuvert((etait) => !etait)}
          aria-expanded={ouvert}
          className="flex w-full items-center gap-3 bg-sombre-eleve px-4 py-3.5
                     text-left transition-colors hover:bg-sombre-carte"
        >
          {/* LA PASTILLE — un repère de couleur, jamais l'information
              elle-même : elle est écrite juste à côté. */}
          <span
            aria-hidden="true"
            suppressHydrationWarning
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              etat.ouvert ? "bg-succes" : "bg-erreur"
            }`}
          />
          <span
            suppressHydrationWarning
            className={`min-w-0 flex-1 text-[15px] font-semibold ${
              etat.ouvert ? "text-succes" : "text-erreur"
            }`}
          >
            {etat.libelle}
          </span>
          <span
            aria-hidden="true"
            className={`shrink-0 text-sombre-texte-doux transition-transform
                       duration-200 ${ouvert ? "rotate-180" : ""}`}
          >
            <IconeChevronBas taille={18} />
          </span>
        </button>

        {/* LE TABLEAU DES SEPT JOURS — deux colonnes : le jour à
            gauche, ses heures à droite. LA LIGNE DU JOUR EN COURS est
            en BLANC et en GRAS ; les six autres en gris et en
            typographie normale. C'est le seul repère dont on a
            besoin : on cherche « et aujourd'hui ? » avant tout. */}
        {ouvert && (
          <dl
            className="grid grid-cols-[minmax(90px,auto)_1fr] gap-x-6 gap-y-2
                       border-t border-sombre-bordure px-4 py-3.5
                       opacity-100 transition-opacity duration-200 starting:opacity-0"
          >
            {JOURS_STUDIO.map((jour) => {
              const cest = jour.index === aujourdhui;
              return (
                <div key={jour.index} className="contents">
                  <dt
                    suppressHydrationWarning
                    className={`text-[14.5px] ${
                      cest
                        ? "font-bold text-white"
                        : "font-normal text-sombre-texte-doux"
                    }`}
                  >
                    {jour.label}
                  </dt>
                  <dd
                    suppressHydrationWarning
                    className={`text-[14.5px] ${
                      cest
                        ? "font-bold text-white"
                        : "font-normal text-sombre-texte-doux"
                    }`}
                  >
                    {libelleDuJour(semaine[jour.index] ?? [])}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </section>
  );
}
