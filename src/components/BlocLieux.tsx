"use client";

import { useState } from "react";
import Link from "next/link";
import { IconeChevronBas } from "@/components/Icones";
import { useOuvertureFiche } from "@/components/PileFiches";
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
import { ligneFiche, ligneMaps, type LieuAffichable } from "@/lib/adresse";
import { genreMode, libelleRoleCourt, libelleTypeFiche } from "@/config/tatouage";
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
 *  · UN SALON OU UN STUDIO a des ADRESSES, empilées de haut en bas
 *    (nº 226-§3) : celle de l'affiche d'abord — photo, ligne
 *    d'adresse, horaires —, puis chaque autre adresse sur sa ligne
 *    (« Autre adresse : » en lien Google Maps), puis l'équipe,
 *    TOUJOURS après toutes les adresses. Le sélecteur « Adresse /
 *    Autre adresse » de la nº 222 est SUPPRIMÉ, code compris : il
 *    cachait une adresse derrière une autre adresse.
 *  · UN ARTISTE a des PROFILS : à domicile, en studio, en salon,
 *    guest. Une entrée chacun, dans l'ordre imposé (nº 222-§1g).
 *
 * ⚠️ LES LIENS VERS D'AUTRES FICHES (un membre de l'équipe, le salon
 * d'un profil) OUVRENT UNE FENÊTRE SUPERPOSÉE (nº 226-§5) quand une
 * pile enveloppe la fiche (voir PileFiches) — web comme mobile ; le
 * lien reste un vrai lien pour tout le reste (nouvel onglet, moteurs).
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
 * LA PASTILLE D'UN LIEU OU D'UNE PERSONNE — 52 px (nº 227-§1, elle
 * était un peu petite à 44), le gabarit de l'équipe : une adresse et
 * un membre se lisent dans la même colonne. La photo de PROFIL de la
 * fiche, elle, reste à 92 px — elle n'est pas une pastille.
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
    <span className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve">
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

/**
 * LE CLIC D'UN LIEN VERS UNE AUTRE FICHE (nº 226-§5) : quand une pile
 * de fenêtres enveloppe (PileFiches), le clic simple ouvre la fiche
 * PAR-DESSUS celle qu'on lit — web comme mobile — au lieu de changer
 * de page. Toute autre combinaison (nouvel onglet, clic du milieu…)
 * garde le lien, et l'adresse directe rend toujours la page complète.
 * Sans pile (l'aperçu « Ma fiche ») : `undefined`, le lien navigue.
 */
function useClicVersFiche() {
  const ouvrirFiche = useOuvertureFiche();
  if (!ouvrirFiche) return undefined;
  return (slug: string) => (evenement: React.MouseEvent) => {
    if (
      evenement.metaKey ||
      evenement.ctrlKey ||
      evenement.shiftKey ||
      evenement.altKey
    ) {
      return;
    }
    evenement.preventDefault();
    ouvrirFiche(slug, `/tatoueur/${slug}`);
  };
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
 *
 * ⚠️ TOUTE LA LIGNE EST LE LIEN (nº 226-§4) : pastille, rôle et nom
 * vivent dans UN SEUL élément cliquable — la pastille a le lien pour
 * ancêtre, il n'y a qu'une zone d'appui. Aucun contour, aucun halo.
 * Un membre sans fiche (pas de slug) reste une ligne inerte.
 *
 * §2 (nº 227) — LE TEXTE EST CENTRÉ SUR SA PASTILLE (`items-center` :
 * un texte de deux lignes est centré en BLOC), 20 px entre deux
 * lignes (`gap-5`), 20 px au-dessus de la première comme sous la
 * dernière, 14 px entre la pastille et son texte (`gap-3.5`).
 *
 * §5 (nº 227) — LE SURVOL, le même pour toutes les lignes cliquables :
 * la couleur du texte ne change JAMAIS (le rose est réservé), le fond
 * de la ligne monte d'un cran (un voile blanc léger — la même ligne
 * vit sur l'anthracite de la page ET sur la carte de la fenêtre, un
 * jeton fixe ne serait « un cran au-dessus » que d'un seul des deux),
 * et le texte prend un fin soulignement décalé. Le rembourrage est
 * annulé par des marges négatives : la surface respire sans déplacer
 * le texte d'un pixel. Au doigt, pas de survol : un bref état enfoncé
 * (`active:`), qui ne reste jamais.
 */
function EquipeDuLieu({ equipe }: { equipe: MembreEquipe[] | null | undefined }) {
  const clicVersFiche = useClicVersFiche();
  const membres = equipeOrdonnee(equipe);
  if (membres.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-col gap-5">
      {membres.map((membre) => {
        /*  ⚠️ LA PASTILLE EST LÀ MÊME SANS PHOTO (nº 224-§1) : un
            rond gris uni, rien dedans. C'est elle qui tient la
            colonne — sans elle, une équipe où un seul membre a
            déposé sa photo s'affichait en escalier. */
        const ligne = (avecFiche: boolean) => (
          <>
            <PhotoRonde source={membre.photo} nature="personne" />
            <div className="min-w-0 flex-1">
              <p
                className={`text-[14px] leading-relaxed text-sombre-texte-doux${
                  avecFiche
                    ? " underline-offset-4 decoration-1 group-hover:underline"
                    : ""
                }`}
              >
                {roleDuMembre(membre)} ·{" "}
                <span className="text-[15px] font-medium text-sombre-texte">
                  {membre.nom}
                </span>
              </p>
              {membre.genre === "guest" && (
                <DatesDeSession debut={membre.debut_le} fin={membre.fin_le} />
              )}
            </div>
          </>
        );
        return (
          <li key={membre.artiste_id}>
            {membre.slug ? (
              <Link
                href={`/tatoueur/${membre.slug}`}
                onClick={clicVersFiche?.(membre.slug)}
                className="group flex items-center gap-3.5 rounded-xl -m-2 p-2
                           transition-colors hover:bg-white/5 active:bg-white/10"
              >
                {ligne(true)}
              </Link>
            ) : (
              <div className="flex items-center gap-3.5">{ligne(false)}</div>
            )}
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

/** L'adresse Google Maps d'un lieu — la recherche COMPLÈTE, code
    postal et pays compris : un plan n'est pas un affichage. */
function adresseMaps(lieu: LieuAffichable): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ligneMaps(lieu)
  )}`;
}

/**
 * §3 (nº 225) — LA FENÊTRE D'ADRESSE DU SMARTPHONE
 * ==================================================================
 * Une plaque de VERRE LIQUIDE posée au centre de la page (nº 227-§6) :
 * anthracite à 60 %, flou de 30 px et REMONTÉE DE SATURATION à 180 %
 * — c'est la saturation qui fait le verre, sans elle ce n'est qu'un
 * voile gris. La règle vit dans globals.css (`[data-verre-fenetre]`,
 * les DEUX lignes littérales, préfixée et non préfixée, jamais de
 * `@supports`, jamais de `var()` dans le filtre : les trois pièges
 * payés du nº 225-§4). Le LISERÉ clair très fin fait le tour, PLUS
 * LUMINEUX sur le bord haut que sur le bas — l'épaisseur de la
 * plaque ; c'est la seule exception voulue à « aucun contour ».
 *
 * DEDANS : l'adresse, les badges du lieu en verre blanc translucide
 * (`[data-verre-capsule]` — mêmes flou et saturation), « Copier » en
 * capsule de verre à taille naturelle, puis « Ouvrir dans Google
 * Maps » en capsule pleine largeur de VERRE TEINTÉ ROSE
 * (`[data-verre-action]` — rose translucide, jamais un aplat) :
 * l'action finale de cette fenêtre, et la seule. La fermeture est un
 * mot nu, et l'appui à côté ferme aussi.
 */
function FenetreAdresse({
  adresse,
  lieu,
  badges,
  surFermeture,
}: {
  adresse: string;
  lieu: LieuAffichable;
  badges: string[];
  surFermeture: () => void;
}) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie(true);
      return;
    } catch {
      //  Sans presse-papier (http local) : la méthode ancienne.
    }
    try {
      const zone = document.createElement("textarea");
      zone.value = adresse;
      zone.setAttribute("readonly", "");
      zone.style.cssText =
        "position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(zone);
      zone.focus();
      zone.setSelectionRange(0, adresse.length);
      const fait = document.execCommand("copy");
      zone.remove();
      if (fait) setCopie(true);
    } catch {
      //  Rien : le bouton garde son mot, l'adresse reste lisible.
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adresse du lieu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
    >
      {/*  LE VOILE — un appui à côté de la fenêtre referme. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/55"
      />
      {/*  Le liseré (plus lumineux en haut) vit dans la règle
           [data-verre-fenetre] de globals.css, avec le verre. */}
      <div
        data-verre-fenetre=""
        className="relative w-full max-w-[360px] rounded-3xl p-6
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
      >
        <p className="text-[16px] font-medium leading-relaxed text-sombre-texte [overflow-wrap:anywhere]">
          {adresse}
        </p>

        {badges.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {badges.map((badge) => (
              /*  Blanc translucide léger, mêmes flou et saturation
                  que la plaque, sans contour (nº 227-§6). */
              <li
                key={badge}
                data-verre-capsule=""
                className="inline-flex min-h-[30px] items-center rounded-full
                           px-3 text-[13px] font-medium text-sombre-texte"
              >
                {badge}
              </li>
            ))}
          </ul>
        )}

        {/*  « Copier » — une action INTERMÉDIAIRE : capsule de verre à
             sa taille, sans rose plein. Le mot devient « Copié » quand
             c'est fait — pas d'icône, pas de phrase. */}
        <button
          type="button"
          onClick={() => void copier()}
          data-verre-capsule=""
          className="mt-6 inline-flex min-h-[42px] items-center rounded-full
                     px-5 text-[14px] font-semibold text-sombre-texte
                     transition-colors active:bg-white/20"
        >
          {copie ? "Copié" : "Copier"}
        </button>

        {/*  L'ACTION FINALE — la seule capsule rose de la fenêtre, en
             VERRE TEINTÉ (nº 227-§6) : rose translucide, mêmes flou et
             saturation, jamais un aplat opaque. */}
        <a
          href={adresseMaps(lieu)}
          target="_blank"
          rel="noopener noreferrer"
          data-verre-action=""
          className="mt-3 flex min-h-[48px] w-full items-center justify-center
                     rounded-full text-[15px] font-semibold text-white
                     transition-opacity active:opacity-85"
        >
          Ouvrir dans Google Maps
        </a>

        {/*  FERMER — un mot nu, jamais une capsule. */}
        <button
          type="button"
          onClick={surFermeture}
          className="mx-auto mt-5 block px-2 text-[14px] font-semibold
                     text-sombre-texte-doux transition-colors active:text-sombre-texte"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

/**
 * L'ADRESSE, CLIQUABLE QUAND ELLE EST COMPLÈTE (nº 225-§3).
 *  · WEB : un lien ordinaire vers Google Maps, nouvel onglet ;
 *  · SMARTPHONE : la fenêtre de verre ci-dessus — le lien est
 *    intercepté, rien ne navigue.
 * Une adresse INCOMPLÈTE (pas de rue) reste du texte : un plan sans
 * rue tombe n'importe où.
 * L'ÉTIQUETTE se choisit (nº 226-§3) : « Adresse : » pour celle de
 * l'affiche, « Autre adresse : » pour les suivantes — même grammaire,
 * même lien Google Maps.
 */
function AdresseCliquable({
  etiquette = "Adresse :",
  adresse,
  lieu,
  badges,
}: {
  etiquette?: string;
  adresse: string;
  lieu: LieuAffichable | null;
  badges: string[];
}) {
  const [fenetre, setFenetre] = useState(false);
  const complete = Boolean(lieu?.adresse && adresse);

  if (!complete || !lieu) {
    return <LigneEtiquetee etiquette={etiquette} valeur={adresse} />;
  }

  return (
    <>
      <p className="text-[14px] leading-relaxed text-sombre-texte-doux [overflow-wrap:anywhere]">
        {etiquette}{" "}
        {/*  §5 (nº 227) — PLUS AUCUN ROSE AU SURVOL : la couleur ne
             change jamais, le fond monte d'un cran (voile blanc), un
             fin soulignement décalé apparaît. Au doigt : un bref état
             enfoncé, rien qui reste. */}
        <a
          href={adresseMaps(lieu)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(evenement) => {
            //  SMARTPHONE : la fenêtre, pas la navigation.
            if (document.documentElement.dataset.appareil === "mobile") {
              evenement.preventDefault();
              setFenetre(true);
            }
          }}
          className="text-[15px] font-medium text-sombre-texte rounded-md
                     -mx-1 px-1 transition-colors
                     hover:bg-white/5 active:bg-white/10
                     underline-offset-4 decoration-1 hover:underline"
        >
          {adresse}
        </a>
      </p>
      {fenetre && (
        <FenetreAdresse
          adresse={adresse}
          lieu={lieu}
          badges={badges}
          surFermeture={() => setFenetre(false)}
        />
      )}
    </>
  );
}

export function BlocAdressesFiche({
  tatoueur,
  studioCourantId,
}: {
  tatoueur: Tatoueur;
  /** Le studio que l'adresse désigne (`?studio=<id>`), quand il y en a
      un : c'est lui qui passe en tête. */
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

  //  AUCUN STUDIO ENREGISTRÉ (fiche d'avant la migration nº 26) : on
  //  retombe sur l'adresse portée par la fiche elle-même.
  const lieuPrincipal: LieuAffichable = principal
    ? lieuDuStudio(principal)
    : {
        adresse: tatoueur.adresse,
        code_postal: tatoueur.code_postal,
        ville: tatoueur.ville_nom,
        region: tatoueur.region,
        pays: tatoueur.pays,
        code_pays: tatoueur.code_pays,
      };
  const adressePrincipale = ligneFiche(lieuPrincipal);

  /** LES BADGES DE LA FENÊTRE D'ADRESSE (nº 225-§3) : le type du lieu
      (« Salon », « Studio ») et sa ville — ce qu'on veut savoir avant
      d'ouvrir le plan. */
  const badgesDe = (lieu: LieuAffichable): string[] =>
    [
      libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement),
      lieu.ville ?? "",
    ].filter(Boolean);

  /**
   * §3 (nº 226) — L'EMPILEMENT REMPLACE LE VA-ET-VIENT.
   * Le sélecteur « Adresse / Autre adresse » (OngletsLigne) est
   * SUPPRIMÉ, son état avec : il cachait une adresse derrière une
   * autre adresse. De haut en bas, désormais :
   *  1. l'adresse de l'affiche, telle qu'elle était — photo, ligne
   *     d'adresse cliquable, horaires ;
   *  2. chaque AUTRE adresse sur sa ligne : « Autre adresse : » suivi
   *     de l'adresse, en lien Google Maps (la même mécanique que la
   *     première — fenêtre de verre au doigt, nouvel onglet au web) ;
   *  3. l'ÉQUIPE, TOUJOURS après toutes les adresses — elle appartient
   *     à l'enseigne, pas à une adresse (la vue `equipe_salon` ne
   *     distingue pas les studios).
   */
  return (
    <div>
      {/*  §2 (nº 227) — LE TEXTE EST CENTRÉ SUR SA PASTILLE
           (`items-center`) : un bloc de deux lignes est centré en
           bloc, 14 px le séparent de la pastille (`gap-3.5`). (La
           règle de centrage CONDITIONNEL de la photo de profil, en
           tête de fiche, est une autre règle — nº 225-§2 — et ne
           bouge pas.) */}
      <div className="flex items-center gap-3.5">
        {/*  ⚠️ LA PHOTO DU LIEU EST CELLE DE LA FICHE : un studio n'a
             pas d'image à lui en base (voir `StudioFiche`). */}
        <PhotoRonde source={tatoueur.photo_profil} nature="lieu" />
        <div className="min-w-0 flex-1">
          <AdresseCliquable
            adresse={adressePrincipale}
            lieu={lieuPrincipal}
            badges={badgesDe(lieuPrincipal)}
          />
          <HorairesEnLigne
            horaires={principal?.horaires}
            fuseau={principal?.fuseau}
          />
        </div>
      </div>

      {/*  2. LES AUTRES ADRESSES — une ligne chacune, au bord gauche
           du bloc, comme l'équipe dessous. */}
      {autres.map((studio) => (
        <div key={studio.id} className="mt-5">
          <AdresseCliquable
            etiquette="Autre adresse :"
            adresse={ligneFiche(lieuDuStudio(studio))}
            lieu={lieuDuStudio(studio)}
            badges={badgesDe(lieuDuStudio(studio))}
          />
        </div>
      ))}

      {/*  3. L'ÉQUIPE — après TOUTES les adresses, toujours. */}
      <EquipeDuLieu equipe={tatoueur.equipe} />
    </div>
  );
}

/* ==================================================================
 * §5 — LES PROFILS D'UN ARTISTE
 * ================================================================== */

/**
 * L'ÉTIQUETTE GRISE D'UN PROFIL (nº 228-§2) — « En salon · RÉSIDENT : »
 * ==================================================================
 * Le genre vient de `GENRES_MODE` (« À domicile », « En studio »,
 * « En salon », « Guest »), jamais d'autres mots ; LE RÔLE le suit,
 * EN CAPITALES, séparé d'un point médian. C'est le rôle qui vivait
 * sous le nom jusqu'à la nº 222 : il descend ici, devant l'adresse,
 * où il désigne enfin quelque chose de précis.
 *
 * « Guest » ne redouble pas : son genre EST son rôle, on n'écrit pas
 * « Guest · GUEST ». Un profil sans rôle enregistré garde son genre
 * seul (« À domicile : ») — jamais de rôle inventé.
 */
function etiquetteDuMode(mode: ModeExerciceFiche): string {
  const genre = genreMode(mode.genre).label;
  const role =
    mode.genre === "guest" ? "" : libelleRoleCourt(mode.role).toUpperCase();
  return role ? `${genre} · ${role} :` : `${genre} :`;
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
  /** Le salon lié d'un profil s'ouvre en fenêtre superposée
      (nº 226-§5), comme un membre d'équipe. */
  const clicVersFiche = useClicVersFiche();
  const modes = modesOrdonnes(tatoueur.modes);
  if (modes.length === 0) return null;

  return (
    /*  §2 (nº 227) — le même rythme que l'équipe : 20 px entre deux
        lignes à pastille, texte centré sur la sienne, 14 px entre
        pastille et texte. */
    <ul className="flex flex-col gap-5">
      {modes.map((mode) => (
        <li key={mode.id} className="flex items-center gap-3.5">
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
                  {/*  §5 (nº 227) — le même survol que partout : jamais
                       de rose, le fond monte d'un cran, un fin
                       soulignement décalé. */}
                  <Link
                    href={`/tatoueur/${mode.salon_slug}`}
                    onClick={clicVersFiche?.(mode.salon_slug)}
                    className="font-medium text-sombre-texte rounded-md -mx-1 px-1
                               transition-colors hover:bg-white/5 active:bg-white/10
                               underline-offset-4 decoration-1 hover:underline"
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
