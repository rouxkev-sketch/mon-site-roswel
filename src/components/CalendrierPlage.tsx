"use client";

import { useEffect, useRef, useState } from "react";
import { IconeChevronBas } from "@/components/Icones";

/**
 * LES DATES D'UNE SESSION GUEST — DEUX CHAMPS, UN CALENDRIER (nº 116)
 * ====================================================================
 * ⚠️ CE COMPOSANT REMPLACE LES DEUX `<input type="date">` DU BLOC
 * GUEST, et avec eux le calendrier natif du navigateur — daté sur le
 * web, et responsable de deux défauts au doigt : les champs passaient
 * l'un SOUS l'autre sur les écrans étroits (leur gabarit interne
 * refusait de se comprimer), et ils débordaient jusqu'au bord de
 * l'écran. Un champ dessiné par NOUS n'a pas de gabarit interne : les
 * deux tiennent CÔTE À CÔTE à toutes les largeurs, 320 px compris.
 *
 * LA COMPOSITION — celle des bons sélecteurs de plage de 2026 :
 *  · DEUX CHAMPS CÔTE À CÔTE, « Du » et « Au ». L'intitulé vit DANS
 *    le champ (règle de la charte) et s'efface derrière la date une
 *    fois choisie — « 15 juil. 2026 » ;
 *  · UN SEUL CALENDRIER pour les deux, ouvert sous les champs, DANS
 *    LE FLUX (jamais de panneau flottant qui sort de l'écran) : mois
 *    navigable, semaine commençant le lundi, aujourd'hui repéré ;
 *  · LA PLAGE SE VOIT : les deux bornes en rose plein, les jours
 *    entre elles teintés de rose pâle ;
 *  · LE PARCOURS EST GUIDÉ : choisir la date de début fait passer le
 *    calendrier sur la date de fin ; choisir la fin referme. Les
 *    jours ANTÉRIEURS au début sont éteints quand on choisit la fin —
 *    une fin avant le début ne peut plus être saisie ;
 *  · choisir un début POSTÉRIEUR à la fin déjà posée EFFACE la fin :
 *    on ne garde jamais une plage à l'envers en mémoire.
 *
 * LE FOCUS SUIT LA CHARTE (nº 116) : le champ dont le calendrier est
 * ouvert s'éclaircit — aucun contour rose. Le ROUGE reste celui du
 * manque : la bordure s'allume quand la validation réclame la date.
 *
 * ⚠️ LA VALEUR NE CHANGE PAS DE FORME : « AAAA-MM-JJ », exactement ce
 * que les `<input type="date">` rendaient — l'enregistrement, la
 * comparaison des chaînes (`fin_le >= debut_le`) et la base ne voient
 * aucune différence.
 */

/** « 15 juil. 2026 » — la date telle que le champ l'affiche. */
const FORMAT_COURT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** « mardi 15 juillet 2026 » — pour les lecteurs d'écran. */
const FORMAT_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « juillet 2026 » — l'en-tête du mois affiché. */
const FORMAT_MOIS = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

/** La semaine, lundi en tête — une initiale par colonne. */
const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];

/** « AAAA-MM-JJ » depuis une date LOCALE — jamais par `toISOString`,
    qui passe par UTC et recule d'un jour à l'est de Greenwich. */
function isoLocal(annee: number, mois: number, jour: number): string {
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

function dateDepuisIso(iso: string): Date | null {
  const morceaux = iso.split("-").map(Number);
  if (morceaux.length !== 3 || morceaux.some(Number.isNaN)) return null;
  return new Date(morceaux[0], morceaux[1] - 1, morceaux[2]);
}

function texteDuChamp(iso: string): string {
  const date = dateDepuisIso(iso);
  return date ? FORMAT_COURT.format(date) : "";
}

/** LES SEMAINES DU MOIS, prêtes à poser en grille : chaque case porte
    son numéro de jour, ou null hors du mois (case vide). */
function semainesDuMois(annee: number, mois: number): (number | null)[][] {
  const premier = new Date(annee, mois - 1, 1);
  //  getDay : 0 = dimanche. On compte depuis LUNDI, comme tous les
  //  calendriers français.
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(annee, mois, 0).getDate();
  const cases: (number | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];
  while (cases.length % 7 !== 0) cases.push(null);
  const semaines: (number | null)[][] = [];
  for (let i = 0; i < cases.length; i += 7) {
    semaines.push(cases.slice(i, i + 7));
  }
  return semaines;
}

export function ChampsPlageDates({
  prefixe,
  debut,
  fin,
  surChangement,
  enFauteDebut = false,
  enFauteFin = false,
}: {
  /** Une clé unique — deux sessions guest sur la même page ne doivent
      pas partager les identifiants de leurs champs. */
  prefixe: string;
  /** Les deux bornes, au format « AAAA-MM-JJ » — vides tant que rien
      n'est choisi. */
  debut: string;
  fin: string;
  /** LES DEUX BORNES PARTENT ENSEMBLE : choisir un début postérieur à
      la fin efface la fin — une seule écriture, jamais deux. */
  surChangement: (debut: string, fin: string) => void;
  enFauteDebut?: boolean;
  enFauteFin?: boolean;
}) {
  /** Le champ dont le calendrier est ouvert — null : calendrier fermé. */
  const [ouvert, setOuvert] = useState<"debut" | "fin" | null>(null);
  /** Le mois affiché, indépendant des valeurs (on navigue librement). */
  const [moisAffiche, setMoisAffiche] = useState<{ annee: number; mois: number }>(
    () => {
      const base = dateDepuisIso(debut) ?? new Date();
      return { annee: base.getFullYear(), mois: base.getMonth() + 1 };
    }
  );
  const racine = useRef<HTMLDivElement>(null);

  /* Échap referme — comme toutes les fenêtres du site. Et un clic
     hors du composant aussi : un calendrier resté ouvert sous un
     autre champ serait un piège. */
  useEffect(() => {
    if (!ouvert) return;
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(null);
    }
    function auPointeur(evenement: PointerEvent) {
      if (!racine.current?.contains(evenement.target as Node)) setOuvert(null);
    }
    document.addEventListener("keydown", auClavier);
    document.addEventListener("pointerdown", auPointeur);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("pointerdown", auPointeur);
    };
  }, [ouvert]);

  function ouvrirLeChamp(cible: "debut" | "fin") {
    if (ouvert === cible) {
      setOuvert(null);
      return;
    }
    //  Le calendrier s'ouvre sur le mois de la valeur du champ visé,
    //  sinon sur celui du début, sinon sur aujourd'hui.
    const repere =
      dateDepuisIso(cible === "debut" ? debut : fin) ??
      dateDepuisIso(debut) ??
      new Date();
    setMoisAffiche({ annee: repere.getFullYear(), mois: repere.getMonth() + 1 });
    setOuvert(cible);
  }

  function choisirLeJour(iso: string) {
    if (ouvert === "debut") {
      //  Un début posé APRÈS la fin efface la fin : jamais de plage à
      //  l'envers. Puis le calendrier passe de lui-même à la fin.
      const finGardee = fin && fin >= iso ? fin : "";
      surChangement(iso, finGardee);
      setOuvert(finGardee ? null : "fin");
      return;
    }
    if (ouvert === "fin") {
      surChangement(debut, iso);
      setOuvert(null);
    }
  }

  function changerDeMois(sens: -1 | 1) {
    setMoisAffiche((courant) => {
      const date = new Date(courant.annee, courant.mois - 1 + sens, 1);
      return { annee: date.getFullYear(), mois: date.getMonth() + 1 };
    });
  }

  const { annee, mois } = moisAffiche;
  const aujourdHui = (() => {
    const d = new Date();
    return isoLocal(d.getFullYear(), d.getMonth() + 1, d.getDate());
  })();

  /**
   * ██ §2 (nº 419) — LA PALETTE DU FORMULAIRE, PAS CELLE DU MOTEUR ██
   * ------------------------------------------------------------------
   * CE QUE CES DEUX CHAMPS PORTAIENT : `bg-sombre-eleve` au repos,
   * `bg-sombre-eleve-clair` une fois ouverts. Leur commentaire disait
   * pourtant « celui de tous les champs du formulaire » — il décrivait
   * l'intention, le code appliquait une AUTRE paire.
   * LA CAUSE, ET ELLE EXPLIQUE AUSSI LES nº 399 ET 409 : le site a DEUX
   * palettes de champ, distantes d'un cran.
   *  · LE MOTEUR DE RECHERCHE — `ROBE_CHAMP_SOMBRE` (MenuDeroulant),
   *    règle nº 141-2B : repos `bg-sombre-eleve`, actif
   *    `bg-sombre-eleve-clair` ;
   *  · LE FORMULAIRE — `CHAMP` (champs-formulaire) : repos
   *    `bg-sombre-eleve-clair`, actif `bg-sombre-haut`.
   * Un champ DU FORMULAIRE écrit avec la paire DU MOTEUR paraît donc
   * exactement un cran trop sombre à côté de ses voisins. C'est ce qui
   * s'est produit ici, comme pour les trois champs de la nº 399 et le
   * champ de titre de la nº 409.
   * CE QU'ILS PRENNENT : la paire du formulaire, et rien d'autre — au
   * repos `bg-sombre-eleve-clair` comme la bio, Instagram et le lien
   * libre ; ouverts `bg-sombre-haut`, le cran que ces mêmes champs
   * prennent au focus. Aucune couleur n'est inventée.
   * ⚠️ PAS DE SURVOL AJOUTÉ : `CHAMP` n'en a pas. En ajouter un ferait
   * diverger ces deux champs-ci de tous les autres — ils gardent donc
   * leur couleur de repos sous la souris, comme leurs voisins.
   */
  function classesDuChamp(cible: "debut" | "fin", enFaute: boolean): string {
    return `flex w-full min-w-0 min-h-[48px] items-center rounded-lg border
      px-3.5 text-left text-base transition-colors ${
        ouvert === cible ? "bg-sombre-haut" : "bg-sombre-eleve-clair"
      } ${enFaute ? "border-erreur" : "border-transparent"}`;
  }

  return (
    <div ref={racine}>
      {/* ---------- LES DEUX CHAMPS, CÔTE À CÔTE — à TOUTES les
          largeurs (point 6B) : plus aucun palier d'empilement. ---- */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["debut", "Du", debut, enFauteDebut],
            ["fin", "Au", fin, enFauteFin],
          ] as const
        ).map(([cible, intitule, valeur, enFaute]) => (
          <button
            key={cible}
            id={`${prefixe}-${cible === "debut" ? "debut_le" : "fin_le"}`}
            type="button"
            onClick={() => ouvrirLeChamp(cible)}
            aria-expanded={ouvert === cible}
            aria-label={
              cible === "debut" ? "Date de début de la session" : "Date de fin de la session"
            }
            className={classesDuChamp(cible, enFaute)}
          >
            {valeur ? (
              <span className="truncate text-sombre-texte">
                {texteDuChamp(valeur)}
              </span>
            ) : (
              //  L'intitulé vit DANS le champ (charte) : « Du », « Au ».
              <span className="text-sombre-texte-doux">{intitule}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---------- LE CALENDRIER — un seul pour les deux champs,
          DANS LE FLUX : il pousse le contenu, il ne recouvre rien et
          ne sort jamais de l'écran. ---------- */}
      {ouvert && (
        <div
          /*  §2 (nº 419) — LE PANNEAU SUIT SES CHAMPS, D'UN CRAN.
               Il pendait à `bg-sombre-eleve` : sous des champs passés à
               `bg-sombre-eleve-clair`, il serait devenu plus sombre que
               ce qui l'ouvre. Il prend donc le niveau du champ, et ses
               états internes montent d'autant (voir plus bas) — le
               calendrier entier change de palette, jamais à moitié. */
          className="mt-2 rounded-lg bg-sombre-eleve-clair p-3
                     opacity-100 transition-opacity duration-200 starting:opacity-0"
        >
          {/* L'EN-TÊTE : le mois, encadré par ses deux flèches. */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changerDeMois(-1)}
              aria-label="Mois précédent"
              className="flex h-9 w-9 items-center justify-center rounded-full
                         text-sombre-texte-doux transition-colors
                         hover:bg-sombre-haut hover:text-sombre-texte"
            >
              <IconeChevronBas taille={16} classe="rotate-90" />
            </button>
            <p className="text-[14px] font-semibold capitalize text-sombre-texte">
              {FORMAT_MOIS.format(new Date(annee, mois - 1, 1))}
            </p>
            <button
              type="button"
              onClick={() => changerDeMois(1)}
              aria-label="Mois suivant"
              className="flex h-9 w-9 items-center justify-center rounded-full
                         text-sombre-texte-doux transition-colors
                         hover:bg-sombre-haut hover:text-sombre-texte"
            >
              <IconeChevronBas taille={16} classe="-rotate-90" />
            </button>
          </div>

          {/* LA SEMAINE : sept initiales, lundi en tête. */}
          <div aria-hidden="true" className="mt-2 grid grid-cols-7">
            {JOURS_SEMAINE.map((initiale, rang) => (
              <span
                key={`${initiale}-${rang}`}
                className="text-center text-[11.5px] font-semibold uppercase
                           text-sombre-texte-doux"
              >
                {initiale}
              </span>
            ))}
          </div>

          {/* LES JOURS. */}
          <div className="mt-1">
            {semainesDuMois(annee, mois).map((semaine, rangSemaine) => (
              <div key={rangSemaine} className="grid grid-cols-7">
                {semaine.map((jour, rangJour) => {
                  if (jour === null) {
                    return <span key={rangJour} aria-hidden="true" />;
                  }
                  const iso = isoLocal(annee, mois, jour);
                  const estDebut = iso === debut;
                  const estFin = iso === fin;
                  const dansLaPlage =
                    Boolean(debut && fin) && iso > debut && iso < fin;
                  //  QUAND ON CHOISIT LA FIN, les jours antérieurs au
                  //  début sont éteints : une fin avant le début ne
                  //  peut plus être saisie.
                  const avantLeDebut =
                    ouvert === "fin" && Boolean(debut) && iso < debut;
                  /*  ██ §1 (nº 420) — AUCUNE DATE PASSÉE NE SE CHOISIT ██
                       On annonce une session guest à VENIR : un jour
                       déjà écoulé n'a rien à faire dans ce choix.
                       COMMENT C'EST EMPÊCHÉ : par le CALENDRIER, et là
                       seulement — les jours antérieurs à aujourd'hui
                       sont `disabled`, exactement par le mécanisme qui
                       éteint déjà les jours antérieurs au début quand on
                       choisit la fin. Il n'y a donc rien à contourner :
                       les deux champs n'ont pas d'autre saisie que ce
                       calendrier (le `<input type="date">` du navigateur
                       a disparu à la nº 116).
                       ⚠️ ET RIEN N'EST AJOUTÉ À LA VALIDATION, C'EST
                       DÉLIBÉRÉ : un guest DÉJÀ ENREGISTRÉ dont les dates
                       sont maintenant passées garde ses valeurs telles
                       quelles, et sa fiche continue de s'enregistrer —
                       `modeComplet` n'exige que deux dates cohérentes
                       (la fin pas avant le début), et n'en demandera pas
                       davantage. Interdire ici ce qui existe déjà là
                       aurait bloqué des fiches sur une règle née après
                       elles.
                       ⚠️ SES PROPRES DATES RESTENT VISIBLES : le jour
                       retenu garde son fond rose (le premier cas du
                       ternaire, plus bas) même éteint — on ne peut plus
                       le RECHOISIR, on ne le perd pas. Et le calendrier
                       s'ouvre sur le mois de son début (voir
                       `moisAffiche`) : il lit son ancienne période, puis
                       navigue vers l'avant pour la renouveler. */
                  const eteint = avantLeDebut || iso < aujourdHui;
                  const estAujourdHui = iso === aujourdHui;
                  return (
                    <button
                      key={rangJour}
                      type="button"
                      disabled={eteint}
                      onClick={() => choisirLeJour(iso)}
                      aria-label={FORMAT_LONG.format(new Date(annee, mois - 1, jour))}
                      aria-pressed={estDebut || estFin}
                      className={`mx-auto flex h-10 w-10 items-center justify-center
                                 rounded-full text-[14px] tabular-nums
                                 transition-colors ${
                                   estDebut || estFin
                                     ? "bg-primaire font-semibold text-white"
                                     : eteint
                                       ? "text-sombre-texte-doux/40"
                                       : dansLaPlage
                                         ? "bg-sombre-haut text-sombre-texte"
                                         : estAujourdHui
                                           ? "font-bold text-sombre-texte hover:bg-sombre-haut"
                                           : "text-sombre-texte hover:bg-sombre-haut"
                                 }`}
                    >
                      {jour}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
