"use client";

import { evaluerMotDePasse, NIVEAUX_MOT_DE_PASSE } from "@/lib/mot-de-passe";

/**
 * LA JAUGE DE FORCE D'UN MOT DE PASSE — un seul dessin pour tout le site
 * ======================================================================
 * CE COMPOSANT NE DESSINE RIEN DE NEUF. Le rendu ci-dessous est celui
 * de l'écran de création de compte (`EcranAuthentification`), déplacé
 * ici SANS retouche : trois segments qui se colorent, le niveau écrit
 * à droite (« Faible », « Moyen », « Fort »), puis les quatre exigences
 * cochées en direct. Il vivait dans deux écrans à la fois, et les deux
 * copies avaient déjà divergé — celle de la page « Sécurité » empilait
 * les critères sur une colonne, avec des ronds « ○ » que l'autre
 * n'avait pas. Une jauge qui ne dit pas la même chose selon la page,
 * c'est pire que pas de jauge : on n'apprend plus la règle.
 *
 * La RÈGLE, elle, n'a jamais été qu'à un seul endroit :
 * `lib/mot-de-passe` (quatre exigences, trois niveaux). Ce composant
 * n'en est que la peinture.
 *
 * Il ne s'affiche que lorsqu'on tape : tant que le champ est vide, il
 * n'y a rien à mesurer, et une jauge à zéro ressemblerait à un
 * reproche.
 */
export function JaugeMotDePasse({ motDePasse }: { motDePasse: string }) {
  if (motDePasse.length === 0) return null;
  const force = evaluerMotDePasse(motDePasse);
  const niveau = NIVEAUX_MOT_DE_PASSE[force.niveau];

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((segment) => (
            <span
              key={segment}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  segment <= niveau.segments ? niveau.couleur : "#38383F",
              }}
            />
          ))}
        </div>
        <span
          role="status"
          className="text-[12.5px] font-semibold w-[68px] text-right"
          style={{ color: niveau.couleur }}
        >
          {niveau.libelle}
        </span>
      </div>
      <ul className="mt-2.5 grid grid-cols-1 min-[400px]:grid-cols-2 gap-x-4 gap-y-1">
        {force.criteres.map((critere) => (
          <li
            key={critere.cle}
            className={`flex items-center gap-1.5 text-[12.5px] ${
              critere.ok ? "text-sombre-texte" : "text-sombre-texte-doux"
            }`}
          >
            {/*  ██ §1 (nº 787) — LA CASE COCHÉE SE VOIT, ENFIN ██
                 LE DÉFAUT DU PROPRIÉTAIRE : « les cases cochées sont
                 roses et ne se voient pas ». LA CAUSE EST UN ROSE SUR
                 UN ROSE — la coche portait `text-primaire` (le rouge de
                 la marque) sur `bg-primaire-voile`, sa propre version
                 diluée. Deux tons du même rouge, l'un sur l'autre : le
                 ✓ s'effaçait dans son fond, et de loin la case n'était
                 qu'une tache rose.
                 LE REMÈDE RÈGLE LES DEUX MOITIÉS DE LA PHRASE : fond
                 BLANC (plus de tache rose) et coche de la couleur du
                 fond du site (plus de coche invisible). C'est aussi
                 l'usage : une case cochée se remplit.
                 ⚠️ LA CASE NON COCHÉE NE BOUGE PAS : son gris sur gris
                 est voulu — elle ne doit pas s'annoncer. */}
            <span
              aria-hidden="true"
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                critere.ok
                  ? "bg-white text-sombre-fond"
                  : "bg-sombre-eleve text-sombre-texte-doux"
              }`}
            >
              ✓
            </span>
            {critere.libelle}
          </li>
        ))}
      </ul>
    </div>
  );
}
