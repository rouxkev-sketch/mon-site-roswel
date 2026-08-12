"use client";

import { useState } from "react";
import Link from "next/link";
import { IconeChevronBas } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import { ICONE_ADRESSE, PORTRAIT_ROND } from "@/config/tatouage";
import {
  etatOuverture,
  JOURS_STUDIO,
  libelleDuJour,
  momentChezLeStudio,
  semaineDepuisBase,
  semaineRenseignee,
} from "@/lib/horaires-studio";
import {
  dateLongue,
  equipeOrdonnee,
  libelleLieuDuMode,
  libelleSecteurDuMode,
  modesOrdonnes,
  roleDuMembre,
  type MembreEquipe,
  type ModeExerciceFiche,
  type StudioFiche,
} from "@/lib/modes-exercice";
import { ligneFiche, type LieuAffichable } from "@/lib/adresse";
import { genreMode } from "@/config/tatouage";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * OÙ TRAVAILLE CETTE FICHE — les adresses d'un lieu, les profils d'un
 * artiste
 * ==================================================================
 * (passe nº 222-§4 et §5)
 *
 * DEUX FORMES POUR UNE MÊME QUESTION, et c'est pour cela qu'elles
 * vivent dans le même fichier : « où est-ce, et qui y est ? ».
 *
 *  · UN SALON OU UN STUDIO a des ADRESSES. Chacune porte sa photo, sa
 *    ligne d'adresse, ses horaires et son équipe. Plusieurs adresses
 *    se choisissent par un sélecteur — le MÊME que « Réalisation /
 *    Flash » (`OngletsLigne`), pas une copie.
 *  · UN ARTISTE a des PROFILS : à domicile, en studio, en salon,
 *    guest. Une entrée chacun, dans l'ordre imposé (nº 222-§1g).
 *
 * ⚠️ AUCUN ENCADRÉ, AUCUN CONTOUR. La charte de la fiche ne connaît
 * que trois niveaux de gris — la page, le bloc, le badge — et rien
 * n'est cerclé. Les horaires, qui vivaient dans un cadre arrondi, sont
 * désormais du TEXTE NU : un état en couleur, la suite en gris, un
 * chevron qui déroule les sept jours.
 *
 * ⚠️ ÉCRIT UNE SEULE FOIS. La page de fiche et la fenêtre superposée
 * montent toutes les deux `ContenuFiche`, qui monte ce fichier : il
 * n'existe aucun deuxième exemplaire de ces blocs.
 */

/* ==================================================================
 * LES BRIQUES PARTAGÉES
 * ================================================================== */

/**
 * LA PASTILLE D'UN LIEU OU D'UNE PERSONNE — 44 px, le gabarit de
 * l'équipe : une adresse et un membre se lisent dans la même colonne.
 *
 * ⚠️ ELLE EXISTE TOUJOURS (passe nº 224-§1), même sans photo — c'est
 * elle qui tient la colonne, et une ligne sans elle se décalait ou
 * disparaissait. Deux natures, deux replis :
 *  · UN LIEU sans photo (un salon saisi à la main, qui n'a pas de
 *    fiche sur yokofolio) → un rond gris uni portant le glyphe
 *    `adresse.png`, dans un gris NETTEMENT plus foncé que le rond ;
 *  · UNE PERSONNE sans photo → un rond gris uni, ET RIEN DEDANS : ni
 *    icône, ni lettre, ni texte. Une initiale sur un rond gris se lit
 *    comme un avatar bricolé ; le vide se lit comme une absence, ce
 *    qu'elle est.
 * Aucun contour, aucun halo.
 *
 * ⚠️ `adresse.png` EST UN GLYPHE NOIR sur fond transparent, déposé à
 * la main : on ne le retouche jamais. `invert` l'éclaircit, et
 * l'opacité le ramène au gris voulu — plus foncé que le rond, donc
 * lisible dessus.
 */
function PhotoRonde({
  source,
  nature,
}: {
  source: string | null | undefined;
  /** « lieu » porte le glyphe d'adresse à défaut de photo ;
      « personne » ne porte rien. */
  nature: "lieu" | "personne";
}) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve">
      {source ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={source}
          alt=""
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : nature === "lieu" ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           icône déposée par le propriétaire, affichée telle quelle (le
           filtre CSS ne modifie pas le fichier). */
        <img
          src={ICONE_ADRESSE}
          alt=""
          width={20}
          height={20}
          aria-hidden="true"
          className="h-5 w-5 invert opacity-40"
        />
      ) : null}
    </span>
  );
}

/** « Adresse : » en gris, la valeur en blanc — la grammaire de tout ce
    bloc : une étiquette grise, une valeur blanche. */
function LigneEtiquetee({
  etiquette,
  valeur,
}: {
  etiquette: string;
  valeur: string;
}) {
  //  ⚠️ ELLE NE DISPARAÎT PLUS QUAND LA VALEUR MANQUE (nº 224-§1) :
  //  c'était le défaut — un lieu saisi à la main dont l'adresse ne
  //  rendait rien effaçait toute la ligne, pastille comprise, et
  //  l'information sautait sans laisser de trace. L'étiquette reste,
  //  et dit ce qui manque plutôt que de se taire.
  return (
    <p className="text-[14px] leading-relaxed text-sombre-texte-doux [overflow-wrap:anywhere]">
      {etiquette}{" "}
      {valeur ? (
        <span className="text-[15px] font-medium text-sombre-texte">{valeur}</span>
      ) : (
        <span className="text-[15px] font-medium">non renseignée</span>
      )}
    </p>
  );
}

/** LES DEUX DATES D'UNE SESSION GUEST — sur DEUX lignes, détachées du
    nom : c'est un engagement de plusieurs semaines, il se lit comme
    tel. Rien quand la session n'a pas ses deux bornes. */
function DatesDeSession({
  debut,
  fin,
}: {
  debut: string | null;
  fin: string | null;
}) {
  if (!debut || !fin) return null;
  return (
    <div className="mt-2.5 text-[14px] leading-relaxed text-sombre-texte-doux">
      <p>Du {dateLongue(debut)}</p>
      <p>Au {dateLongue(fin)}</p>
    </div>
  );
}

/**
 * LES HORAIRES, EN TEXTE NU (nº 222-§4).
 * « Fermé · ouvre lundi ⌵ » — l'état en couleur (rouge fermé, vert
 * ouvert), la suite en gris, le chevron déroule les sept jours.
 * ⚠️ SANS AUCUN ENCADRÉ : le cadre arrondi de la nº 122 est supprimé.
 * ⚠️ L'ÉTAT SE CALCULE DANS LE FUSEAU DU LIEU, jamais dans celui du
 * visiteur — la règle vit dans `etatOuverture`, et nulle part ailleurs.
 */
function HorairesEnLigne({
  horaires,
  fuseau,
}: {
  horaires: unknown;
  fuseau: string | null | undefined;
}) {
  const [ouvert, setOuvert] = useState(false);
  const semaine = semaineDepuisBase(horaires);
  if (!semaineRenseignee(semaine)) return null;

  //  ⚠️ L'HEURE N'EST PAS RELUE CHAQUE MINUTE ICI : ce bloc est rendu
  //  par le serveur puis repris tel quel. Un rafraîchissement change
  //  le texte entre les deux et l'hydratation le signale — d'où
  //  `suppressHydrationWarning`, comme dans HorairesStudio.
  const etat = etatOuverture(semaine, fuseau);
  const aujourdhui = momentChezLeStudio(fuseau).jour;
  //  « Ouvert • Ferme à 19h » → l'état d'un côté, la suite de l'autre.
  const [motEtat, ...reste] = etat.libelle.split(" • ");
  const suite = reste.join(" • ");

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOuvert((etait) => !etait)}
        aria-expanded={ouvert}
        className="flex items-center gap-1.5 text-left text-[15px] leading-snug"
      >
        <span
          suppressHydrationWarning
          className={`font-semibold ${etat.ouvert ? "text-succes" : "text-erreur"}`}
        >
          {motEtat}
        </span>
        {suite && (
          <span suppressHydrationWarning className="text-sombre-texte-doux">
            {/*  « ouvre lundi », pas « Ouvre lundi » : la phrase
                 continue après l'état, elle ne recommence pas. */}
            · {suite.charAt(0).toLowerCase() + suite.slice(1)}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`shrink-0 text-sombre-texte-doux transition-transform
                     duration-200 ${ouvert ? "rotate-180" : ""}`}
        >
          <IconeChevronBas taille={16} />
        </span>
      </button>

      {ouvert && (
        <dl className="mt-3 grid grid-cols-[minmax(84px,auto)_1fr] gap-x-6 gap-y-2">
          {JOURS_STUDIO.map((jour) => {
            const cest = jour.index === aujourdhui;
            const robe = cest
              ? "font-semibold text-sombre-texte"
              : "font-normal text-sombre-texte-doux";
            return (
              <div key={jour.index} className="contents">
                <dt suppressHydrationWarning className={`text-[14px] ${robe}`}>
                  {jour.label}
                </dt>
                <dd suppressHydrationWarning className={`text-[14px] ${robe}`}>
                  {libelleDuJour(semaine[jour.index] ?? [])}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}

/**
 * L'ÉQUIPE D'UNE ADRESSE — « Fondateur · Kevin Roux ».
 * Le rôle en gris, le nom en blanc ; l'ordre est imposé (fondateurs,
 * résidents, guests) et vit dans `equipeOrdonnee`. Un guest porte ses
 * deux dates, sur deux lignes.
 * ⚠️ ALIGNÉE SOUS LA PHOTO DU LIEU : elle commence au bord gauche du
 * bloc, pas dans la colonne de texte de l'adresse.
 */
function EquipeDuLieu({ equipe }: { equipe: MembreEquipe[] | null | undefined }) {
  const membres = equipeOrdonnee(equipe);
  if (membres.length === 0) return null;
  return (
    <ul className="mt-6 flex flex-col gap-3.5">
      {membres.map((membre) => {
        const nom = (
          <span className="text-[15px] font-medium text-sombre-texte">
            {membre.nom}
          </span>
        );
        return (
          /*  ⚠️ LA PASTILLE EST LÀ MÊME SANS PHOTO (nº 224-§1) : un
              rond gris uni, rien dedans. C'est elle qui tient la
              colonne — sans elle, une équipe où un seul membre a
              déposé sa photo s'affichait en escalier. */
          <li key={membre.artiste_id} className="flex items-start gap-4">
            <PhotoRonde source={membre.photo} nature="personne" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-relaxed text-sombre-texte-doux">
                {roleDuMembre(membre)} ·{" "}
                {membre.slug ? (
                  <Link
                    href={`/tatoueur/${membre.slug}`}
                    className="transition-colors hover:text-primaire active:text-primaire"
                  >
                    {nom}
                  </Link>
                ) : (
                  nom
                )}
              </p>
              {membre.genre === "guest" && (
                <DatesDeSession debut={membre.debut_le} fin={membre.fin_le} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ==================================================================
 * §4 — LES ADRESSES D'UN SALON OU D'UN STUDIO
 * ================================================================== */

/** Un studio, ramené au format que lit lib/adresse. */
function lieuDuStudio(studio: StudioFiche): LieuAffichable {
  return {
    adresse: studio.adresse,
    code_postal: studio.code_postal,
    ville: studio.ville,
    region: studio.region,
    pays: studio.pays,
    code_pays: studio.code_pays,
  };
}

/** UNE ADRESSE, ENTIÈRE : la photo, la ligne d'adresse, les horaires,
    puis l'équipe dessous. */
function UneAdresse({
  photo,
  adresse,
  horaires,
  fuseau,
  equipe,
}: {
  photo: string | null | undefined;
  adresse: string;
  horaires: unknown;
  fuseau: string | null | undefined;
  equipe: MembreEquipe[] | null | undefined;
}) {
  return (
    <div>
      {/*  ⚠️ `items-start` : le texte commence au HAUT de la photo et
           se prolonge dessous s'il est long — jamais au-dessus. C'est
           la même règle que le nom de la fiche (nº 222-§1e). */}
      <div className="flex items-start gap-4">
        <PhotoRonde source={photo} nature="lieu" />
        <div className="min-w-0 flex-1">
          <LigneEtiquetee etiquette="Adresse :" valeur={adresse} />
          <HorairesEnLigne horaires={horaires} fuseau={fuseau} />
        </div>
      </div>
      <EquipeDuLieu equipe={equipe} />
    </div>
  );
}

export function BlocAdressesFiche({
  tatoueur,
  studioCourantId,
}: {
  tatoueur: Tatoueur;
  /** Le studio que l'adresse désigne (`?studio=<id>`), quand il y en a
      un : c'est lui que le sélecteur ouvre. */
  studioCourantId?: string | null;
}) {
  const studios = (tatoueur.studios ?? [])
    .slice()
    .sort((a, b) => a.ordre - b.ordre);

  /** Le studio de la fiche elle-même, en tête : c'est « Adresse ». */
  const principal =
    studios.find((studio) => studio.id === studioCourantId) ??
    studios.find((studio) => studio.principal) ??
    studios[0] ??
    null;
  const autres = studios.filter((studio) => studio.id !== principal?.id);

  /** LE SÉLECTEUR N'EXISTE QU'À DEUX ADRESSES OU PLUS. Une seule
      adresse ne se choisit pas — une ligne de séparation la précède,
      comme tous les autres blocs de la fiche. */
  const [onglet, setOnglet] = useState<"adresse" | "autres">("adresse");
  const aDesAutres = autres.length > 0;

  //  AUCUN STUDIO ENREGISTRÉ (fiche d'avant la migration nº 26) : on
  //  retombe sur l'adresse portée par la fiche elle-même.
  const adressePrincipale = principal
    ? ligneFiche(lieuDuStudio(principal))
    : ligneFiche({
        adresse: tatoueur.adresse,
        code_postal: tatoueur.code_postal,
        ville: tatoueur.ville_nom,
        region: tatoueur.region,
        pays: tatoueur.pays,
        code_pays: tatoueur.code_pays,
      });

  return (
    <div>
      {aDesAutres && (
        <OngletsLigne
          ariaLabel="Adresse ou autre adresse"
          cleActive={onglet}
          surChoix={(cle) => setOnglet(cle === "autres" ? "autres" : "adresse")}
          options={[
            { cle: "adresse", label: "Adresse" },
            { cle: "autres", label: "Autre adresse" },
          ]}
        />
      )}

      <div className={aDesAutres ? "mt-7" : ""}>
        {onglet === "adresse" || !aDesAutres ? (
          <UneAdresse
            //  ⚠️ LA PHOTO DU LIEU EST CELLE DE LA FICHE : un studio
            //  n'a pas d'image à lui en base (voir `StudioFiche`).
            //  Le jour où il en aura une, c'est la seule ligne à
            //  changer — ici, et dans la boucle des autres adresses.
            photo={tatoueur.photo_profil}
            adresse={adressePrincipale}
            horaires={principal?.horaires}
            fuseau={principal?.fuseau}
            //  L'ÉQUIPE APPARTIENT À L'ENSEIGNE, pas à une adresse : la
            //  vue `equipe_salon` ne distingue pas les studios. Elle
            //  s'affiche donc sous l'adresse principale — celle qu'on
            //  regarde.
            equipe={tatoueur.equipe}
          />
        ) : (
          /*  LES AUTRES ADRESSES S'EMPILENT — même présentation,
              l'une sous l'autre. */
          <div className="flex flex-col gap-10">
            {autres.map((studio) => (
              <UneAdresse
                key={studio.id}
                photo={tatoueur.photo_profil}
                adresse={ligneFiche(lieuDuStudio(studio))}
                horaires={studio.horaires}
                fuseau={studio.fuseau}
                equipe={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================================================================
 * §5 — LES PROFILS D'UN ARTISTE
 * ================================================================== */

/** L'étiquette d'un profil — « À domicile », « En studio », « En
    salon », « Guest » : les libellés de `GENRES_MODE`, jamais d'autres
    mots. */
function etiquetteDuMode(mode: ModeExerciceFiche): string {
  return `${genreMode(mode.genre).label} :`;
}

/**
 * CE QUI S'ÉCRIT À DROITE DE LA PHOTO D'UN PROFIL.
 *  · à domicile → « Lyon, France · Rayon 200 km » (le secteur) ;
 *  · en studio  → « Lyon, France » (jamais la rue : un studio privé
 *    est privé — la règle vit dans `libelleLieuDuMode`) ;
 *  · en salon / guest → le nom du lieu quand il est connu, puis son
 *    adresse complète.
 * ⚠️ LE LIEU EST ÉCRIT PAR `lib/adresse`, comme partout ailleurs sur
 * le site : ville, code administratif quand le pays l'écrit, pays.
 */
function valeurDuMode(mode: ModeExerciceFiche): string {
  const lieu =
    mode.genre === "domicile"
      ? libelleSecteurDuMode(mode)
      : libelleLieuDuMode(mode);
  const nom = mode.salon_nom ?? mode.intitule ?? "";
  //  Le nom du lieu ne se répète pas s'il EST déjà le lieu (un mode
  //  situé à la main n'a que son intitulé).
  if (!nom || nom === lieu) return lieu;
  return lieu ? `${nom} · ${lieu}` : nom;
}

export function BlocProfilsArtiste({
  tatoueur,
}: {
  tatoueur: Tatoueur;
}) {
  const modes = modesOrdonnes(tatoueur.modes);
  if (modes.length === 0) return null;

  return (
    <ul className="flex flex-col gap-7">
      {modes.map((mode) => (
        <li key={mode.id} className="flex items-start gap-4">
          {/*  ⚠️ « À DOMICILE », C'EST CHEZ L'ARTISTE (nº 224-§1) : la
               pastille est SA photo de profil, pas un glyphe d'adresse
               — il n'y a pas d'autre lieu à montrer. Les autres modes
               portent le logo du salon lié, ou le glyphe d'adresse
               quand le lieu a été saisi à la main. */}
          <PhotoRonde
            source={
              mode.genre === "domicile"
                ? tatoueur.photo_profil
                : mode.salon_photo
            }
            nature="lieu"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-relaxed text-sombre-texte-doux [overflow-wrap:anywhere]">
              {etiquetteDuMode(mode)}{" "}
              {mode.salon_slug && mode.salon_nom ? (
                <>
                  <Link
                    href={`/tatoueur/${mode.salon_slug}`}
                    className="font-medium text-sombre-texte transition-colors
                               hover:text-primaire active:text-primaire"
                  >
                    {mode.salon_nom}
                  </Link>
                  <span className="text-[15px] font-medium text-sombre-texte">
                    {libelleLieuDuMode(mode) ? ` · ${libelleLieuDuMode(mode)}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-[15px] font-medium text-sombre-texte">{valeurDuMode(mode)}</span>
              )}
            </p>
            {mode.genre === "guest" && (
              <DatesDeSession debut={mode.debut_le} fin={mode.fin_le} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
