"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { IconeChevronBas } from "@/components/Icones";
import {
  laLargeurVeutUneFenetre,
  useOuvertureFiche,
} from "@/components/PileFiches";
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
import { genreMode, libelleRoleCourt } from "@/config/tatouage";
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
export function PhotoRonde({
  source,
  nature,
  classeTaille = "h-13 w-13",
  classeGlyphe = "h-7 w-7",
}: {
  source: string | null | undefined;
  /** « lieu » porte le glyphe d'adresse à défaut de photo ;
      « personne » ne porte rien. */
  nature: "lieu" | "personne";
  /** §3 (nº 254) — LA TAILLE EN PARAMÈTRE, l'écriture reste UNIQUE :
      « Ma sélection » agrandit sa pastille sur le web (72 px) sans
      recopier le rond — une seconde écriture divergerait à la passe
      suivante. Défaut : le rond de 52 de toujours. */
  classeTaille?: string;
  /** Le glyphe du repli « lieu » suit la même échelle (28 → 40). */
  classeGlyphe?: string;
}) {
  return (
    <span
      className={`flex ${classeTaille} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sombre-eleve`}
    >
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
          width={28}
          height={28}
          aria-hidden="true"
          //  §2 (nº 233) — 28 px : un peu plus de la moitié du rond de
          //  52, le glyphe ne se perd plus au milieu. PhotoRonde est
          //  l'unique écriture : TOUS les ronds concernés suivent —
          //  et sa taille suit celle du rond (nº 254-§3).
          className={`${classeGlyphe} invert opacity-40`}
        />
      ) : null}
    </span>
  );
}

/**
 * LE CLIC D'UN LIEN VERS UNE AUTRE FICHE (nº 226-§5) : quand une pile
 * de fenêtres enveloppe (PileFiches), le clic simple ouvre la fiche
 * PAR-DESSUS celle qu'on lit, au lieu de changer de page. Toute autre
 * combinaison (nouvel onglet, clic du milieu…) garde le lien, et
 * l'adresse directe rend toujours la page complète. Sans pile
 * (l'aperçu « Ma fiche ») : `undefined`, le lien navigue.
 *
 * ⚠️ AU DOIGT, LE LIEN NAVIGUE (nº 230-§3). La fenêtre superposée est
 * la présentation du WEB ; sous 1024 px, une fiche liée s'affiche
 * comme n'importe quelle fiche de smartphone — une page. On ne
 * détourne donc pas le clic : `<Link>` fait son métier, pousse UNE
 * entrée d'historique, et le retour revient à la fiche précédente à
 * sa position. La règle de largeur vit dans PileFiches, en un seul
 * endroit ; elle est lue AU CLIC, jamais au rendu.
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
    //  ÉCRAN ÉTROIT : on laisse passer — le lien navigue vers la page.
    if (!laLargeurVeutUneFenetre()) return;
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
 * §1 (nº 229) — LA PASTILLE EST ANCRÉE EN HAUT, LE TEXTE NE LA
 * DÉPASSE JAMAIS. Le `items-center` de la nº 227 centrait la PASTILLE
 * sur son texte : un texte de plusieurs lignes débordait AU-DESSUS
 * d'elle, et un volet qui s'ouvre la faisait DESCENDRE. La règle est
 * désormais celle de la photo de profil (nº 225-§2), en CSS pur : la
 * ligne est calée en haut (`items-start` — la pastille ne bouge
 * JAMAIS), et c'est la COLONNE DE TEXTE qui porte la bascule —
 * `min-h-13` (la hauteur de la pastille) et `justify-center`. Un
 * texte moins haut est centré sur elle ; un texte plus haut aligne
 * son sommet sur le haut de la pastille et continue dessous.
 *
 * §2 (nº 229) — 32 px entre deux lignes à pastille (`gap-8`), 32 px
 * au-dessus de la première comme sous la dernière, 14 px entre la
 * pastille et son texte (`gap-3.5`, inchangé depuis la nº 227).
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
/**
 * L'ENCADRÉ D'UNE LIGNE CLIQUABLE À PASTILLE — UNE SEULE ÉCRITURE
 * (nº 232-§1). La ligne d'un membre d'équipe et la ligne d'adresse
 * portent EXACTEMENT le même : même élément (pastille + colonne de
 * texte DANS l'encadré), mêmes classes, même géométrie. C'est cette
 * constante qui le garantit — il n'existe pas de second dessin.
 */
export const CLASSES_LIGNE_CLIQUABLE =
  "group flex items-start gap-3.5 rounded-xl -m-2 p-2 " +
  "transition-colors hover:bg-white/5 active:bg-white/10";

/**
 * LE SOULIGNEMENT D'UN LIEN DE FICHE — UNE SEULE ÉCRITURE (nº 271-§2)
 * ====================================================================
 * C'est celui de la ligne d'équipe (nº 229), et lui seul : FIN
 * (`decoration-1`), DÉCALÉ (`underline-offset-4`), GRIS DOUX, et il
 * n'apparaît qu'AU SURVOL de la ligne (`group-hover` — l'élément
 * survolable porte la classe `group`). Au repos : du texte nu. Au
 * doigt, pas de survol : l'état enfoncé (`active:`) parle à sa place.
 *
 * ⚠️ LA COULEUR EST ÉCRITE, ET VOICI POURQUOI. La nº 229 tenait son
 * gris du `<p>` gris doux qui déclarait le soulignement — sans un mot.
 * La nº 268 a recopié les mêmes jetons sur des éléments à TEXTE CLAIR
 * (le lien d'artiste, l'adresse) : même `decoration-1`, mais un trait
 * PRESQUE BLANC — c'est lui que le relevé lisait « plus épais ». La
 * couleur (`decoration-sombre-texte-doux`) fait donc partie de
 * l'écriture : le trait est LE MÊME, où que le texte soit clair ou
 * doux.
 *
 * ⚠️ UN SEUL LECTEUR, UN SEUL USAGE (nº 273-§2) : le soulignement ne
 * sert plus qu'à CE QUI SORT DU SITE — et il n'y a qu'un cas,
 * l'ADRESSE (AdresseCliquable : Google Maps sur le web, la fenêtre
 * de verre au doigt — le cas de l'artiste qui a saisi l'adresse de
 * son lieu à la main, faute de portfolio à lier). Les lignes qui
 * mènent à une fiche DU SITE (équipe, profil d'artiste, liens sous
 * la photo) ont perdu le leur : leur fond qui monte au survol dit
 * déjà le clic, le trait faisait double emploi. Si un second endroit
 * doit un jour sortir du site, il importe CETTE constante — jamais
 * une recopie des jetons, et jamais pour un lien interne.
 */
export const SOULIGNEMENT_LIEN =
  "underline-offset-4 decoration-1 decoration-sombre-texte-doux " +
  "group-hover:underline";

function EquipeDuLieu({ equipe }: { equipe: MembreEquipe[] | null | undefined }) {
  const clicVersFiche = useClicVersFiche();
  const membres = equipeOrdonnee(equipe);
  if (membres.length === 0) return null;
  return (
    <ul className="mt-8 flex flex-col gap-8">
      {membres.map((membre) => {
        /*  ⚠️ LA PASTILLE EST LÀ MÊME SANS PHOTO (nº 224-§1) : un
            rond gris uni, rien dedans. C'est elle qui tient la
            colonne — sans elle, une équipe où un seul membre a
            déposé sa photo s'affichait en escalier. */
        //  §2 (nº 273) — la ligne s'écrit PAREIL avec ou sans fiche :
        //  le soulignement qui les distinguait est parti, seul
        //  l'encadré du Link (au survol) dit encore le clic.
        const ligne = () => (
          <>
            <PhotoRonde source={membre.photo} nature="personne" />
            <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
              <p
                //  §2 (nº 273) — PLUS DE SOULIGNEMENT sur une ligne
                //  d'équipe : l'encadré au survol (CLASSES_LIGNE_
                //  CLIQUABLE) dit déjà qu'elle se clique — le trait
                //  faisait double emploi. Le soulignement est réservé
                //  au seul cas qui SORT du site : l'adresse (voir
                //  AdresseCliquable, l'unique lecteur).
                className="text-[14px] leading-relaxed text-sombre-texte-doux"
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
                className={CLASSES_LIGNE_CLIQUABLE}
              >
                {ligne()}
              </Link>
            ) : (
              <div className="flex items-start gap-3.5">{ligne()}</div>
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
 * §3 (nº 225) — LA FENÊTRE D'ADRESSE DU SMARTPHONE, DÉPOUILLÉE
 * ==================================================================
 * (nº 231-§2) Elle portait trop de choses : la croix, l'adresse
 * répétée (le visiteur vient de cliquer dessus), les badges du lieu —
 * tout est SUPPRIMÉ, code compris. Il ne reste que LES DEUX ACTIONS,
 * empilées, de dimensions identiques : « Copier l'adresse » en verre
 * blanc au-dessus, « Ouvrir dans Google Maps » en verre teinté rose
 * dessous — l'unique action finale. La fenêtre se referme par un
 * appui à côté d'elle, et rétrécit à la hauteur de son contenu.
 *
 * LE VERRE GARDE LES VALEURS DE LA Nº 229-§5 : plaque anthracite à
 * 40 %, `blur(30px) saturate(180%)`, liseré atténué — la règle vit
 * dans globals.css (`[data-verre-fenetre]`, les DEUX lignes
 * littérales, préfixée d'abord, jamais de `@supports`, jamais de
 * `var()` dans le filtre : les pièges payés du nº 225-§4).
 */
function FenetreAdresse({
  adresse,
  lieu,
  surFermeture,
}: {
  /** L'adresse en toutes lettres — elle ne s'AFFICHE plus, mais c'est
      elle que « Copier l'adresse » met au presse-papier. */
  adresse: string;
  lieu: LieuAffichable;
  surFermeture: () => void;
}) {
  const [copie, setCopie] = useState(false);

  /** Dit si la copie a VRAIMENT eu lieu : c'est elle qui autorise la
      fermeture différée (nº 232-§2) — une copie ratée laisse la
      fenêtre ouverte plutôt que de mimer un succès. */
  async function copier(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie(true);
      return true;
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
      return fait;
    } catch {
      //  Rien : le bouton garde son mot, l'adresse reste lisible.
      return false;
    }
  }

  /**
   * §2 (nº 232) — LA FENÊTRE SE REFERME APRÈS L'ACTION.
   * « Adresse copiée » se lit 600 ms — assez pour la confirmation,
   * pas assez pour attendre — puis la fenêtre part. Elle ne part QUE
   * si la copie a réussi.
   * ⚠️ AUCUNE ENTRÉE D'HISTORIQUE À RETIRER : l'ouverture n'en pousse
   * pas (un simple état React, voir AdresseCliquable) — l'historique
   * ne grossit donc jamais d'un cran par adresse consultée, et le
   * banc le compte.
   */
  function copierPuisFermer() {
    void copier().then((fait) => {
      if (fait) window.setTimeout(surFermeture, 600);
    });
  }

  /**
   * §2 (nº 234) — LA FENÊTRE EST POSÉE DANS LE CORPS DU DOCUMENT
   * ==================================================================
   * TROIS PASSES ONT MESURÉ DES VALEURS JUSTES DANS CHROMIUM pendant
   * que l'iPhone montrait une plaque presque noire. Les valeurs
   * n'étaient pas le sujet : la STRUCTURE l'était. Deux causes, toutes
   * deux corrigées ici, et aucune n'est une question d'opacité.
   *
   * 1. CE QUE LA PLAQUE FLOUTE, C'EST LE VOILE. Un `backdrop-filter`
   *    floute TOUT CE QUI EST PEINT DERRIÈRE lui dans sa racine
   *    d'arrière-plan — le voile compris, puisqu'il est peint juste
   *    avant elle. Un voile noir à 55 % couvrant tout l'écran, c'est
   *    donc un aplat noir que la plaque floute : flouter du noir uni
   *    donne du noir uni. Aucun réglage de la plaque ne pouvait
   *    corriger cela — c'est LE VOILE qu'il fallait alléger (il passe
   *    à 25 %), et c'est mesurable partout, sans WebKit.
   *
   * 2. LA PLAQUE ÉTAIT SA PROPRE RACINE D'ARRIÈRE-PLAN pendant son
   *    ouverture. Elle portait `transition-opacity` +
   *    `starting:opacity-0` : une opacité INFÉRIEURE À 1 crée une
   *    nouvelle racine, et l'élément ne floute alors plus la page mais
   *    son propre plan. Relevé au banc, plaque saisie en pleine
   *    ouverture : `opacity 0.0852719`. Le fondu est donc passé AU
   *    VOILE, qui ne floute rien ; la plaque, elle, n'a plus aucune
   *    opacité partielle, à aucun instant.
   *
   * ⚠️ ET ELLE EST MONTÉE DANS `document.body` (portail) : plus aucun
   * ancêtre de la fiche — bloc collant, conteneur, futur `transform`
   * d'animation — ne peut créer une racine au-dessus d'elle. Le voile
   * et la plaque restent FRÈRES, et leur seul parent est un conteneur
   * nu (`position: fixed`, qui ne crée aucune racine).
   */
  const fenetre = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adresse du lieu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
    >
      {/*  LE VOILE — un appui à côté de la fenêtre referme. Sa couleur
           est en `rgba` (jamais une `opacity`, qui créerait une racine
           d'arrière-plan), il ne porte AUCUN filtre, et c'est LUI qui
           porte le fondu d'ouverture. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
      />
      {/*  Le liseré (plus lumineux en haut, ATTÉNUÉ à la nº 229-§5 —
           il se devine, il ne se lit pas) vit dans la règle
           [data-verre-fenetre] de globals.css, avec le verre. */}
      {/*  ⚠️ AUCUNE OPACITÉ, AUCUNE TRANSITION D'OPACITÉ ICI : ce sont
           elles qui faisaient de la plaque sa propre racine
           d'arrière-plan pendant l'ouverture (voir la note ci-dessus).
           Le fondu appartient au voile. */}
      <div
        data-verre-fenetre=""
        className="relative w-full max-w-[360px] rounded-3xl p-6"
      >
        {/*  DEUX CAPSULES, ET RIEN D'AUTRE (nº 231-§2). « Copier
             l'adresse » — LE JUMEAU EXACT du badge d'ouverture : même
             largeur (pleine), même hauteur, même rayon — en verre
             blanc, jamais en rose (l'action finale reste seule à le
             porter). Le mot devient « Adresse copiée » après l'appui. */}
        {/*  §1 (nº 244) — LA CAPSULE EST NUE : la lumière de la nº 242
             est RETIRÉE (plus d'anneau, plus de trait clair), le blanc
             remonte à 20 %. Tout vit dans `data-verre-capsule`
             (globals.css) — l'unique écriture, partagée avec le badge
             « Copier » de la fenêtre Partage : retirée là-bas, retirée
             partout. */}
        <button
          type="button"
          onClick={copierPuisFermer}
          data-verre-capsule=""
          className="flex min-h-[48px] w-full items-center justify-center
                     rounded-full text-[15px] font-semibold text-sombre-texte"
        >
          {copie ? "Adresse copiée" : "Copier l'adresse"}
        </button>

        {/*  L'ACTION FINALE — la seule capsule rose de la fenêtre, en
             VERRE TEINTÉ (nº 227-§6, allégé nº 229-§5 : rose à 45 %,
             mêmes flou et saturation que la plaque — jamais un aplat
             opaque). */}
        {/*  Le lien s'ouvre (nouvel onglet), la fenêtre se referme
             DANS LE MÊME GESTE (nº 232-§2) — rien à attendre ici. */}
        <a
          href={adresseMaps(lieu)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={surFermeture}
          data-verre-action=""
          //  Nue elle aussi (nº 244-§1) : le rose reste à 40 %, sans
          //  ombre interne ni contour, et l'état enfoncé ne passe
          //  jamais par `opacity` (nº 234).
          className="mt-3 flex min-h-[48px] w-full items-center justify-center
                     rounded-full text-[15px] font-semibold text-white"
        >
          Ouvrir dans Google Maps
        </a>
      </div>
    </div>
  );

  //  LE PORTAIL — jamais pendant le rendu du serveur (`document`
  //  n'existe pas) ; la fenêtre ne s'ouvre que sur un geste, donc
  //  toujours côté navigateur.
  return typeof document === "undefined"
    ? fenetre
    : createPortal(fenetre, document.body);
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
  pastille,
}: {
  etiquette?: string;
  adresse: string;
  lieu: LieuAffichable | null;
  /** LA PASTILLE DU LIEU, quand la ligne en porte une (l'adresse de
      l'affiche) : elle entre alors DANS l'encadré (nº 232-§1), comme
      la pastille d'un membre d'équipe. Les « Autre adresse » n'en ont
      pas et gardent leur ligne de texte seule. */
  pastille?: React.ReactNode;
}) {
  const [fenetre, setFenetre] = useState(false);
  const complete = Boolean(lieu?.adresse && adresse);

  const ligneTexte = (cliquable: boolean) => (
    <p className="text-[14px] leading-relaxed text-sombre-texte-doux [overflow-wrap:anywhere]">
      {etiquette}{" "}
      {/*  §1 (nº 271) — LE SOULIGNEMENT N'APPARAÎT QU'AU SURVOL. La
           nº 268 l'avait posé AU REPOS (consigne trop vague, corrigée) :
           au repos, l'adresse est du TEXTE NU. Au survol de la ligne,
           le soulignement de la nº 229 — l'écriture UNIQUE
           (`SOULIGNEMENT_LIEN`), plus une recopie de jetons : fin,
           décalé, gris doux. La couleur du texte, elle, ne change
           jamais. Au doigt, pas de survol : l'état enfoncé (voir le
           lien plus bas). */}
      <span
        className={`text-[15px] font-medium text-sombre-texte${
          cliquable ? ` ${SOULIGNEMENT_LIEN}` : ""
        }`}
      >
        {adresse}
      </span>
    </p>
  );

  if (!complete || !lieu) {
    //  ADRESSE INCOMPLÈTE : pas de plan, pas de lien — mais la ligne
    //  garde sa pastille et sa colonne quand elle en a une, comme une
    //  ligne d'équipe sans fiche.
    return pastille ? (
      <div className="flex items-start gap-3.5">
        {pastille}
        <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
          <LigneEtiquetee etiquette={etiquette} valeur={adresse} />
        </div>
      </div>
    ) : (
      <LigneEtiquetee etiquette={etiquette} valeur={adresse} />
    );
  }

  return (
    <>
      {/*  §3 (nº 268, tenu à la nº 271) — PLUS D'ENCADRÉ SUR SA PROPRE
           ADRESSE. La ligne d'adresse d'un salon ou d'un studio
           portait l'encadré de la nº 232 (celui d'un membre
           d'équipe) : or l'encadré dit « cette ligne mène à une
           fiche », et il n'y a pas de fiche au bout — ce serait un
           lien vers soi-même. AUCUN fond de survol ici : au survol,
           seul le soulignement s'allume (voir `ligneTexte`).
           §1 (nº 271) — la ligne devient le `group` du soulignement
           (il s'allume au survol de LA LIGNE, comme à l'équipe), et
           AU DOIGT, où il n'y a pas de survol : l'état enfoncé de la
           nº 229 (`active:bg-white/10`, bref, jamais un état qui
           reste) — avec la géométrie annulée (`-m-2 p-2`) pour que
           rien ne bouge d'un pixel.
           ⚠️ LES HORAIRES RESTENT DEHORS (nº 230-§4, tenu) : le
           chevron ne peut pas déclencher le lien de l'adresse.
           §5 (nº 227) — aucun rose : la couleur ne change jamais. */}
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
        className={`group rounded-xl -m-2 p-2 transition-colors active:bg-white/10 ${
          pastille ? "flex items-start gap-3.5" : "block"
        }`}
      >
        {pastille}
        {pastille ? (
          <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
            {ligneTexte(true)}
          </div>
        ) : (
          ligneTexte(true)
        )}
      </a>
      {fenetre && (
        <FenetreAdresse
          adresse={adresse}
          lieu={lieu}
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
      {/*  §1 (nº 232) — L'ENCADRÉ DE LA LIGNE D'ADRESSE EST CELUI DE
           L'ÉQUIPE : la pastille et la colonne de texte vivent DANS
           l'élément cliquable (voir AdresseCliquable, qui porte
           CLASSES_LIGNE_CLIQUABLE — l'unique écriture). La pastille
           reste ancrée en haut (nº 229-§1), la colonne garde sa
           bascule de centrage.
           ⚠️ LES HORAIRES SONT DEHORS (nº 230-§4, tenu) : hors de
           l'encadré, hors du lien — le chevron ne peut pas déclencher
           l'adresse. Leur retrait gauche (66 px = 52 de pastille + 14
           d'écart) les garde alignés sous la colonne de texte, là où
           ils ont toujours été.
           ⚠️ `flex flex-col` N'EST PAS DÉCORATIF : l'encadré porte des
           marges négatives — dans un bloc ordinaire elles fusionnent
           avec les marges voisines et le rythme du bloc se fausse. */}
      <div className="flex flex-col">
        <AdresseCliquable
          adresse={adressePrincipale}
          lieu={lieuPrincipal}
          //  ⚠️ LA PHOTO DU LIEU EST CELLE DE LA FICHE : un studio n'a
          //  pas d'image à lui en base (voir `StudioFiche`).
          pastille={<PhotoRonde source={tatoueur.photo_profil} nature="lieu" />}
        />
        <div className="pl-[66px]">
          <HorairesEnLigne
            horaires={principal?.horaires}
            fuseau={principal?.fuseau}
          />
        </div>
      </div>

      {/*  2. LES AUTRES ADRESSES — une ligne chacune, au bord gauche
           du bloc, comme l'équipe dessous. Le rythme du bloc est de
           32 px (nº 229-§2).
           ⚠️ `flex flex-col` N'EST PAS DÉCORATIF (nº 230-§4) : le lien
           d'adresse porte des marges négatives (son encadré), et dans
           un bloc ordinaire elles FUSIONNENT avec le `mt-8` — l'écart
           mesuré tombait à 24 px. Un conteneur flex ne laisse aucune
           marge d'enfant s'échapper : le rythme reste 32, au pixel. */}
      {autres.map((studio) => (
        <div key={studio.id} className="mt-8 flex flex-col">
          <AdresseCliquable
            etiquette="Autre adresse :"
            adresse={ligneFiche(lieuDuStudio(studio))}
            lieu={lieuDuStudio(studio)}
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
 * L'ÉTIQUETTE GRISE D'UN PROFIL (nº 228-§2) — « En salon · Résident : »
 * ==================================================================
 * Le genre vient de `GENRES_MODE` (« À domicile », « En studio »,
 * « En salon », « Guest »), jamais d'autres mots ; LE RÔLE le suit,
 * séparé d'un point médian. C'est le rôle qui vivait sous le nom
 * jusqu'à la nº 222 : il descend ici, devant l'adresse, où il désigne
 * enfin quelque chose de précis.
 *
 * §1 (nº 268) — LES CAPITALES SONT PARTIES : la consigne de la nº 228
 * est annulée par le propriétaire — des capitales sur un mot long
 * crient là où le reste de la fiche parle. Le rôle s'écrit comme le
 * reste de la ligne, l'initiale seule en majuscule : c'est le mot même
 * de `libelleRoleCourt` (« Fondateur », « Résident »), celui du
 * formulaire et de l'équipe — plus aucune transformation. Taille et
 * couleur n'ont pas bougé, seule la casse.
 *
 * « Guest » ne redouble pas : son genre EST son rôle, on n'écrit pas
 * « Guest · Guest ». Un profil sans rôle enregistré garde son genre
 * seul (« À domicile : ») — jamais de rôle inventé.
 */
function etiquetteDuMode(mode: ModeExerciceFiche): string {
  const genre = genreMode(mode.genre).label;
  const role = mode.genre === "guest" ? "" : libelleRoleCourt(mode.role);
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
    /*  §1 et §2 (nº 229) — le même rythme que l'équipe : la pastille
        ANCRÉE en haut (`items-start`), la colonne de texte porte la
        bascule `min-h-13` + `justify-center` (un guest à plusieurs
        lignes ne dépasse jamais au-dessus), 32 px entre deux lignes
        (`gap-8`), 14 px entre pastille et texte. */
    <ul className="flex flex-col gap-8">
      {modes.map((mode) => {
        /*  ⚠️ « À DOMICILE », C'EST CHEZ L'ARTISTE (nº 224-§1) : la
            pastille est SA photo de profil, pas un glyphe d'adresse
            — il n'y a pas d'autre lieu à montrer. Les autres modes
            portent le logo du salon lié, ou le glyphe d'adresse
            quand le lieu a été saisi à la main. */
        const pastille = (
          <PhotoRonde
            source={
              mode.genre === "domicile"
                ? tatoueur.photo_profil
                : mode.salon_photo
            }
            nature="lieu"
          />
        );
        const lie = Boolean(mode.salon_slug && mode.salon_nom);
        const colonne = (
          <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
            <p className="text-[14px] leading-relaxed text-sombre-texte-doux [overflow-wrap:anywhere]">
              {etiquetteDuMode(mode)}{" "}
              {lie ? (
                /*  §2 (nº 268) — CE QUI EST CLIQUABLE : le NOM plus
                    l'ADRESSE, rien de plus. L'étiquette « En salon ·
                    Fondateur » DÉCRIT — elle n'est ni soulignée ni
                    dans le lien, elle ne mène nulle part. Le
                    soulignement fin décalé s'allume au survol de LA
                    LIGNE (`group-hover`, l'encadré de la 232 est le
                    groupe) — l'écriture de l'équipe, au jeton près.
                    Jamais de rose : la couleur ne change pas. */
                <Link
                  href={`/tatoueur/${mode.salon_slug}`}
                  //  `lie` garantit le slug ; le `?? ""` ne sert qu'au
                  //  typage (le rappel exige une chaîne).
                  onClick={clicVersFiche?.(mode.salon_slug ?? "")}
                  //  §2 (nº 273) — PLUS DE SOULIGNEMENT : cette ligne
                  //  mène à une fiche DU SITE, et l'encadré de la 232
                  //  (le groupe, au survol) dit déjà qu'elle se
                  //  clique. Le soulignement est réservé au seul cas
                  //  qui SORT du site : l'adresse (AdresseCliquable).
                  className="text-[15px] font-medium text-sombre-texte"
                >
                  {mode.salon_nom}
                  {libelleLieuDuMode(mode)
                    ? ` · ${libelleLieuDuMode(mode)}`
                    : ""}
                </Link>
              ) : (
                <span className="text-[15px] font-medium text-sombre-texte">{valeurDuMode(mode)}</span>
              )}
            </p>
            {mode.genre === "guest" && (
              <DatesDeSession debut={mode.debut_le} fin={mode.fin_le} />
            )}
          </div>
        );
        return (
          <li key={mode.id}>
            {lie ? (
              /*  §2 (nº 268) — LE LIEU A SA PROPRE FICHE : la ligne se
                  comporte comme celle d'un membre d'équipe sur la
                  fiche d'un salon — au survol, L'ENCADRÉ englobe la
                  pastille et le texte. C'est `CLASSES_LIGNE_CLIQUABLE`
                  (nº 232), l'unique écriture — jamais un second
                  dessin. Le lien, lui, reste borné au nom + adresse
                  (voir la colonne) : l'encadré dit « cette ligne mène
                  quelque part », le soulignement dit où l'on clique. */
              <div className={CLASSES_LIGNE_CLIQUABLE}>
                {pastille}
                {colonne}
              </div>
            ) : (
              /*  AUCUNE FICHE : ni encadré, ni soulignement — rien
                  n'est cliquable, la ligne garde sa géométrie. */
              <div className="flex items-start gap-3.5">
                {pastille}
                {colonne}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
