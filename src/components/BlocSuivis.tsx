"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CADRE_PHOTO_PORTFOLIO } from "@/config/tatouage";
import { CLASSES_LIGNE_CLIQUABLE, PhotoRonde } from "@/components/BlocLieux";
import { IconeCoeur } from "@/components/Icones";
import {
  bandeDeTrois,
  groupesDeSuivis,
  libelleNouveautes,
  lignesDInformation,
} from "@/lib/selection-suivis";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";

/**
 * LES ARTISTES SUIVIS, DANS « MA SÉLECTION » (nº 243, revu nº 245)
 * ==================================================================
 * IL REMPLACE UNE FENÊTRE, et c'est le point de départ : les suivis
 * vivaient dans une fenêtre superposée qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte, que la
 * charte interdit. La fenêtre est SUPPRIMÉE, code compris ; tout vit
 * dans la page, pleine largeur, un seul défilement.
 * ⚠️ ET PLUS DERRIÈRE UN ONGLET NON PLUS (nº 245-§2) : le va-et-vient
 * `Photos · Tatoueurs` est supprimé, code compris. Cette section suit
 * les photos dans la page, et c'est le menu « Mes suivis » de la
 * barre qui décide de ce qu'elle montre.
 *
 * CE QUI SE DÉCIDE N'EST PAS ICI : les trois groupes, leur tri, le
 * choix des trois photos et les libellés vivent dans
 * `lib/selection-suivis`. Ce fichier POSE, il ne juge pas.
 *
 * ⚠️ AUCUNE VALEUR GRAPHIQUE INVENTÉE : la ligne d'identité reprend
 * `CLASSES_LIGNE_CLIQUABLE` (nº 232) et `PhotoRonde` (nº 224/227) —
 * les mêmes briques que les lignes d'équipe et d'adresse d'une fiche.
 * LA FINITION EST CELLE DE LA nº 244-§2 : titres de groupe aux
 * capitales des sections de fiche (13 px), 40 px de part et d'autre
 * des lignes de séparation, 34 px entre blocs, 12/8 px autour de la
 * ligne de provenance, bande à 6 px d'écart et rayon 10 — le rythme
 * du site, pas des valeurs inventées. L'urgence d'une date proche est
 * TYPOGRAPHIQUE (§3) : blanc semi-gras, jamais une couleur.
 *
 * ⚠️ CE QUI EST CLIQUABLE, ET RIEN D'AUTRE (§3) : la ligne d'identité
 * ouvre la fiche — pastille comprise, elle est DANS le lien —, une
 * vignette ouvre la photo. La petite ligne de provenance, les titres
 * de groupe et le compte de nouveautés ne sont pas des boutons.
 */

export function BlocSuivis({
  suivis,
  favoris,
}: {
  suivis: TatoueurSuivi[];
  /** Les photos aimées — elles décident du premier cas du §4. */
  favoris: PhotoFavorite[];
}) {
  const groupes = groupesDeSuivis(suivis);

  if (suivis.length === 0) {
    return (
      <p
        data-suivis-vide=""
        className="mt-8 rounded-2xl bg-sombre-carte px-5 py-8 text-center
                   text-[14.5px] leading-relaxed text-sombre-texte-doux"
      >
        Suis un artiste pour retrouver ici ce qu&apos;il publie.
      </p>
    );
  }

  return (
    /*  §2 (nº 249) — LES CAPITALES ONT DISPARU : « MES SUIVIS » (le
        titre de section de la nº 245) est parti — c'est le TITRE de la
        page qui dit désormais « Mes suivis » (LigneResultats, comme la
        page de recherche). Et « TOUS LES SUIVIS » ne s'écrit plus
        quand il est SEUL : un unique groupe sous un titre qui dit déjà
        la même chose n'apprenait rien. Les titres de groupe ne
        reviennent que quand le classement de la nº 243 a quelque chose
        à dire — une session guest classe les artistes en « Cette
        semaine », « À venir », « Tous les suivis ». */
    /*  §2 (nº 264) — PLUS AUCUNE MARGE AJOUTÉE SOUS LE BLOC DU TITRE :
        le `pb` de LigneResultats suffit, comme sur la page de
        recherche (relevé vivant : 20 px au doigt, 24 sur le web) — le
        `mt-4` d'ici s'y ajoutait. */
    <div data-section-suivis="">
      {groupes.map((groupe, rang) => (
        /*  ⚠️ UN GROUPE VIDE NE REND RIEN — ni titre, ni espace : il
             n'est même pas dans la liste (voir `groupesDeSuivis`).
             §2 (nº 244) — 40 px DE PART ET D'AUTRE de la ligne de
             séparation entre deux groupes (`mt-10 pt-10`), le rythme
             des sections de fiche depuis la nº 223. Le premier groupe
             n'a pas de ligne au-dessus de lui. */
        <section
          key={groupe.cle}
          data-groupe-suivis={groupe.cle}
          className={
            rang > 0 ? "mt-10 border-t border-sombre-bordure/60 pt-10" : ""
          }
        >
          {/*  §2 (nº 244) — LES CAPITALES DES SECTIONS DE FICHE
               (nº 223) : 13 px, grises, espacées — la classe exacte
               des titres de l'onglet Profil. §2 (nº 249) — SEULEMENT
               quand il y a PLUSIEURS groupes : voir plus haut. */}
          {groupes.length > 1 && (
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
              {groupe.titre}
            </h2>
          )}
          {/*  34 px entre deux blocs d'artiste (nº 244-§2).
               §5 (nº 247) — UNE FICHE PAR LIGNE, PLEINE LARGEUR : les
               deux colonnes de la nº 245 sont ABANDONNÉES. Le format
               du bloc (nº 243/244) ne change pas d'un pixel ; c'est sa
               bande de vignettes qui prend la largeur gagnée.
               ⚠️ `minmax(0,1fr)` ET NON `1fr` — c'est le piège de la
               nº 228 : une colonne `1fr` se dimensionne à son contenu
               (un nom long, une adresse), et la page déborde en
               largeur. Avec le plancher à zéro, la colonne cède, et
               `scrollWidth` reste égal à `clientWidth`. */}
          {/*  §2 (nº 254) — 48 px ENTRE DEUX ARTISTES SUR LE WEB : à
               20 px d'écart interne, les 34 px de la nº 244 ne se
               distinguaient plus assez (14 px de différence) — la
               hiérarchie doit se LIRE. Le doigt garde ses 34 px
               (écart interne 8 : la différence y est nette).
               §3 (nº 264) — L'ESPACEMENT WEB S'ÉLARGIT DE 30 % :
               48 × 1,3 = 62,4 → 62 px, le pixel entier le plus
               proche. Le doigt ne bouge pas.
               §2 (nº 264) — LE `mt-5` N'EXISTE QUE SOUS UN TITRE DE
               GROUPE : groupe unique, pas de titre — la liste part du
               `pb` du bloc de titre, comme la grille de la
               recherche. */}
          <ul
            className={`${
              groupes.length > 1 ? "mt-5 " : ""
            }grid gap-[34px] lg:gap-[62px] grid-cols-[minmax(0,1fr)]`}
          >
            {groupe.suivis.map((suivi) => (
              <li key={suivi.id}>
                <BlocDUnSuivi suivi={suivi} favoris={favoris} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** LE BLOC D'UN ARTISTE — trois étages (§3). */
function BlocDUnSuivi({
  suivi,
  favoris,
}: {
  suivi: TatoueurSuivi;
  favoris: PhotoFavorite[];
}) {
  const lignes = lignesDInformation(suivi);
  const bande = bandeDeTrois(suivi, favoris);
  const nouveautes = libelleNouveautes(suivi.nouveautes);

  return (
    <div data-suivi={suivi.slug} className="flex flex-col">
      {/* 1 · LA LIGNE D'IDENTITÉ — UN SEUL LIEN, pastille comprise. */}
      <Link
        href={`/tatoueur/${suivi.slug}`}
        data-ligne-suivi=""
        /*  §3 (nº 254) — L'ÉCART PASTILLE-TEXTE SE REMET À L'ÉCHELLE :
            14 px pour un rond de 52 (gap-3.5, la proportion de
            toujours) → 20 px pour un rond de 72 (14 × 72 ÷ 52 ≈ 19,4,
            le cran de la grille le plus proche). La ligne reste
            l'écriture partagée, l'écart web s'y ajoute. */
        className={`${CLASSES_LIGNE_CLIQUABLE} lg:gap-5`}
      >
        <PhotoRonde
          source={suivi.photoProfil}
          //  Un suivi peut être un artiste comme un salon : le repli
          //  « lieu » porte le glyphe d'adresse, celui que la fiche
          //  emploie déjà pour un lieu sans photo.
          nature={suivi.modes.length > 0 ? "personne" : "lieu"}
          //  §3 (nº 254) — 72 px SUR LE WEB (52 au doigt, inchangé),
          //  par le paramètre de l'écriture unique. Le glyphe du repli
          //  suit l'échelle (28 → 40).
          classeTaille="h-13 w-13 lg:h-18 lg:w-18"
          classeGlyphe="h-7 w-7 lg:h-10 lg:w-10"
        />
        {/*  §4 (nº 247) — LE NOM NE BOUGE PAS, LES LIGNES S'AJOUTENT
             SOUS LUI. Le bloc de texte est calé EN HAUT
             (`justify-start`) dès qu'il y a plusieurs modes : centré,
             il aurait fait remonter le nom au-dessus du rond quand le
             texte grandit. C'est la règle de la nº 241, telle quelle —
             le rond est ancré en haut (`items-start` de
             CLASSES_LIGNE_CLIQUABLE, `shrink-0` de PhotoRonde), il ne
             bouge JAMAIS, et le texte ne dépasse jamais au-dessus de
             lui. Un seul mode : la boîte de 52 px centre comme avant,
             au pixel. */}
        <span
          className={`flex min-h-13 lg:min-h-18 min-w-0 flex-1 flex-col ${
            lignes.length > 1 ? "justify-start" : "justify-center"
          }`}
        >
          {/*  §3 (nº 254) — le nom 15 → 18 px sur le web, MÊME
               graisse ; l'information 14 → 15, MÊME couleur. Le doigt
               ne change pas. */}
          <span className="truncate text-[15px] lg:text-[18px] font-semibold text-sombre-texte">
            {suivi.nom}
          </span>
          {/*  §2 (nº 244) — la ligne d'information : 14 px, grise.
               §3 — L'URGENCE PAR LA TYPOGRAPHIE, JAMAIS PAR LA
               COULEUR : quand la session tombe dans les sept jours,
               LA DATE seule passe du gris au BLANC semi-gras — aucun
               rose, aucun vert, aucun rouge, aucun badge.
               §4 (nº 247) — UNE LIGNE PAR MODE, les unes sous les
               autres, dans l'ordre de `modesOrdonnes`. */}
          {lignes.map((info) => (
            <span
              key={info.cle}
              data-info-suivi=""
              data-guest-proche={info.proche ? "" : undefined}
              className="truncate text-[14px] lg:text-[15px] leading-relaxed text-sombre-texte-doux"
            >
              {info.avant}
              {info.date && (
                <>
                  {info.avant ? " · " : ""}
                  <span
                    data-date-guest=""
                    className={
                      info.proche ? "font-semibold text-sombre-texte" : ""
                    }
                  >
                    {info.date}
                  </span>
                </>
              )}
            </span>
          ))}
          {/*  LE COMPTE DE NOUVEAUTÉS (§5, nº 243) — sur SA ligne : il
               ne parle d'aucun mode en particulier. */}
          {nouveautes && (
            <span
              data-nouveautes=""
              className="truncate text-[14px] lg:text-[15px] leading-relaxed text-sombre-texte-doux"
            >
              {nouveautes}
            </span>
          )}
        </span>
      </Link>

      {/* 2 · §3 (nº 251) — PLUS AUCUN TITRE AU-DESSUS DES BANDES.
             « Vos coups de cœur », « Ses dernières réalisations », « Ses
             derniers flashs » : les trois sont supprimés, web et
             smartphone. L'information n'est pas perdue — depuis la
             nº 249 c'est LE CŒUR posé en bas à droite de la vignette
             qui dit qu'une photo a été aimée, et il le dit en moins de
             place. (`bande.cas` reste : c'est lui qui décide de ce
             cœur.) */}

      {/* 3 · LA BANDE DE VIGNETTES — §6 (nº 249) : ELLE DÉFILE.
             Elle ne se tronque plus à ce qui tient dans la largeur :
             c'est une rangée à défilement NATIF avec accrochage
             (`scroll-snap`), à la manière des rangées d'Apple ou de
             Netflix — la refonte du carrousel de portfolio (nº 209-§7),
             appliquée telle quelle : AUCUNE translation calculée.
              · au doigt, TROIS vignettes pleines, et la suivante
                DÉPASSE du bord droit — c'est ce dépassement qui dit
                qu'il y en a d'autres ; le web garde ses nombres
                d'aujourd'hui (4, 5, puis 6), même dépassement ;
              · l'accrochage est au CENTRE (`snap-center`) : dès qu'on
                a fait défiler, la précédente dépasse à GAUCHE — la
                rangée n'est jamais coupée net aux deux bords (les
                extrémités, elles, s'alignent au bord : le navigateur
                borne) ;
              · à la souris, deux flèches (`pointer-fine:` — la
                variante EXISTE, déclarée dans globals.css nº 208-§2 :
                vérifié, pas supposé) font défiler par `scrollBy`, une
                position que le navigateur possède ;
              · le débordement vit DANS la rangée (`overflow-x-auto`),
                jamais dans la page : le piège de la nº 228 ne peut pas
                se réveiller.
             ⚠️ MOINS DE PHOTOS QUE LA LARGEUR : on n'affiche que ce
             qui existe, jamais un doublon, jamais une case comblée. */}
      {bande.photos.length > 0 && (
        <RangeeDeVignettes suivi={suivi} bande={bande} />
      )}
    </div>
  );
}

/**
 * LA RANGÉE QUI DÉFILE (§5 et §6, nº 249)
 * ==================================================================
 * Les largeurs de case disent le NOMBRE VISIBLE, pas un pixel choisi :
 * `(100% − les écarts) / N,4` montre N vignettes pleines et 0,4 de la
 * suivante — le dépassement demandé. Les écarts restent les 6 px de la
 * nº 244 (`gap-1.5`), les angles droits ceux de la nº 247.
 *
 * §4 (nº 264) — AU DOIGT, LE DÉPASSEMENT DÉCIDE DE LA TAILLE, plus
 * l'inverse : la vignette de droite ne montre que 10 % de sa largeur
 * AU BORD DE L'ÉCRAN. La rangée déborde des marges (§3) : la largeur
 * disponible au repos va du bord de contenu gauche au bord d'écran
 * droit — 100 % (le contenu) + 16 px (la marge `px-4` de la page).
 * Trois pleines, trois écarts de 6 px, et 10 % de la quatrième :
 * `3,1 × case + 18 px = 100 % + 16 px`, d'où
 * `case = (100 % + 16 px − 18 px) / 3,1`. AUCUNE LARGEUR EN DUR : la
 * règle tient à toutes les largeurs de téléphone ; les vignettes s'en
 * trouvent agrandies, le format 4/5 suit (CADRE_PHOTO_PORTFOLIO).
 * ⚠️ LE WEB NE CHANGE PAS : ses pourcentages se lisent sur la BOÎTE DE
 * CONTENU de la rangée (le rembourrage du débordement n'y entre pas,
 * c'est la règle des pourcentages en flexbox) — mêmes largeurs, mêmes
 * hauteurs qu'avant le débordement.
 */
const CASE_RANGEE =
  "shrink-0 snap-center basis-[calc((100%+16px-18px)/3.1)] " +
  "sm:basis-[calc((100%-18px)/4.4)] lg:basis-[calc((100%-24px)/5.4)] " +
  "xl:basis-[calc((100%-30px)/6.4)]";

function RangeeDeVignettes({
  suivi,
  bande,
}: {
  suivi: TatoueurSuivi;
  bande: ReturnType<typeof bandeDeTrois>;
}) {
  const zone = useRef<HTMLUListElement>(null);

  /**
   * §4 (nº 253) — UNE PAGE ENTIÈRE, ET RIEN D'AUTRE.
   * ------------------------------------------------------------------
   * On VISE une frontière de page (`page × largeur visible`) au lieu
   * d'ajouter une largeur à la position courante : les deux font le
   * même pas, mais viser se corrige tout seul — après un glissement du
   * doigt qui s'est arrêté entre deux pages, l'appui suivant retombe
   * sur une frontière au lieu de propager l'écart.
   * C'est le défilement NATIF (`scrollTo`), avec l'accrochage déjà en
   * place : aucune translation calculée, aucun `transform`.
   * ⚠️ LE NAVIGATEUR BORNE : à la dernière page, la course restante
   * peut être plus courte qu'une largeur — c'est la fin de la rangée,
   * pas un pas raté.
   */
  /*  §3 (nº 264) — LA LARGEUR DE CONTENU, PAS LE `clientWidth` : la
      rangée déborde désormais des marges (rembourrage interne), et
      `clientWidth` les compte. Une PAGE reste une largeur de CONTENU —
      le pas de la nº 253 ne change pas d'un pixel. */
  const largeurContenu = (cadre: HTMLElement) => {
    const style = getComputedStyle(cadre);
    return (
      cadre.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight)
    );
  };

  const defiler = (sens: 1 | -1) => {
    const cadre = zone.current;
    if (!cadre) return;
    const cible = Math.max(0, etat.page + sens) * largeurContenu(cadre);
    cadre.scrollTo({ left: cible, behavior: "smooth" });
  };

  /**
   * §1 (nº 252) — OÙ EN EST LE DÉFILEMENT : c'est lui qui décide quels
   * bandeaux EXISTENT. Celui de droite tant qu'il reste quelque chose à
   * voir à droite ; celui de gauche seulement une fois qu'on a fait
   * défiler — et il repart quand on est revenu au début.
   * §4 (nº 253) — ET COMBIEN DE PAGES, ET LAQUELLE. Le nombre de pages
   * se calcule COMME LE DEMANDE LA RÈGLE : le nombre de vignettes
   * divisé par le nombre VISIBLE — et ce nombre visible se lit dans le
   * DOM (la largeur d'une case et l'écart), jamais dans une constante
   * qui divergerait des classes. La page courante est la position
   * divisée par la largeur visible.
   * Le tout relevé au montage, à chaque défilement, et au
   * redimensionnement — l'observateur de taille posé à la nº 252 est
   * déjà là, il sert aux quatre valeurs.
   */
  const [etat, setEtat] = useState({
    gauche: false,
    droite: false,
    pages: 1,
    page: 0,
    //  §5 (nº 264) — le décalage du bord droit des pointillés : la
    //  distance entre le bord droit du CONTENU et celui de la dernière
    //  vignette ENTIÈREMENT visible — jamais le bord de l'écran,
    //  jamais une vignette coupée. Lu dans le DOM à chaque relevé.
    decalage: 0,
  });
  useEffect(() => {
    const cadre = zone.current;
    if (!cadre) return;
    const lire = () => {
      const premiere = cadre.firstElementChild as HTMLElement | null;
      const largeurCase = premiere?.getBoundingClientRect().width ?? 0;
      //  L'écart entre deux cases, lu dans la mise en page (jamais
      //  recopié) : la distance entre le début de la première et celui
      //  de la deuxième, moins la largeur d'une case.
      const seconde = premiere?.nextElementSibling as HTMLElement | null;
      const pas = seconde
        ? seconde.getBoundingClientRect().left -
          premiere!.getBoundingClientRect().left
        : largeurCase;
      //  §3 (nº 264) — le nombre visible et la page se lisent sur la
      //  LARGEUR DE CONTENU : le débordement des marges (rembourrage)
      //  ne fait pas partie d'une page.
      const contenu = largeurContenu(cadre);
      const visibles = pas > 0 ? Math.max(1, Math.round(contenu / pas)) : 1;
      const total = cadre.children.length;
      //  §5 (nº 264) — le bord droit de la dernière vignette PLEINE :
      //  la plus à droite dont le bord droit reste dans le contenu.
      const boite = cadre.getBoundingClientRect();
      const droiteContenu =
        boite.right - parseFloat(getComputedStyle(cadre).paddingRight);
      let bordDerniere = 0;
      for (const enfant of cadre.children) {
        const droite = enfant.getBoundingClientRect().right;
        if (droite <= droiteContenu + 1 && droite > bordDerniere) {
          bordDerniere = droite;
        }
      }
      setEtat({
        gauche: cadre.scrollLeft > 1,
        droite: cadre.scrollLeft + cadre.clientWidth < cadre.scrollWidth - 1,
        pages: Math.max(1, Math.ceil(total / visibles)),
        page: contenu ? Math.round(cadre.scrollLeft / contenu) : 0,
        decalage: bordDerniere
          ? Math.max(0, Math.round(droiteContenu - bordDerniere))
          : 0,
      });
    };
    lire();
    cadre.addEventListener("scroll", lire, { passive: true });
    const observateur = new ResizeObserver(lire);
    observateur.observe(cadre);
    return () => {
      cadre.removeEventListener("scroll", lire);
      observateur.disconnect();
    };
  }, [bande.photos.length]);

  /*  §6 (nº 264) — LE CHEVRON SE DÉSHABILLE. Le disque de verre de la
      nº 254 faisait daté : un bouton collé sur la photo. Même
      emplacement, même comportement, plus d'habit :
       · un CHEVRON NU, blanc — ni disque, ni verre, ni fond, ni
         contour, ni halo ;
       · plus haut que large : 24 × 12, au trait de l'écriture unique
         des icônes (1,8 — celui d'Icones.tsx) ;
       · il SE POSE SUR LE FONDU du bord (§3) : la zone du bouton est
         la marge même où vit le voile — le fondu efface la vignette,
         le chevron dit la suite, chacun donne son contraste à
         l'autre ;
       · AU SURVOL DE LA RANGÉE seulement (`group-hover`, par la
         VISIBILITÉ — aucun fondu d'opacité : monté et démonté, comme
         les bandeaux de la nº 252) ; au doigt, il n'existe pas
         (`pointer-fine`). */
  const bandeau = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Vignettes suivantes" : "Vignettes précédentes"}
      data-bandeau-defilement={sens === 1 ? "droite" : "gauche"}
      onClick={() => defiler(sens)}
      className={`hidden pointer-fine:flex invisible group-hover:visible
        absolute inset-y-0 z-[2] ${
          sens === 1 ? "-right-4 sm:-right-6" : "-left-4 sm:-left-6"
        } w-4 sm:w-6 items-center justify-center text-white`}
    >
      <svg width="12" height="24" viewBox="0 0 12 24" fill="none" aria-hidden="true">
        <path
          d={sens === 1 ? "M3 4l6 8-6 8" : "M9 4l-6 8 6 8"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  /*  §3 (nº 264) — LE FONDU ANTHRACITE DES BORDS. La rangée déborde
      jusqu'aux bords de l'écran (voir la liste), et chaque MARGE porte
      un voile vertical de la couleur du fond du site — #1A1A1D
      (`sombre-fond`), à 90 % vers rien : légèrement transparent, la
      vignette S'EFFACE DANS LA PAGE au lieu d'être coupée net.
      ⚠️ L'INTERDIT DE LA nº 250 EST LEVÉ PAR LE PROPRIÉTAIRE (nº 264) :
      l'échec d'alors était la COULEUR — un fondu clair qu'on ne
      comprenait pas. L'anthracite dit la vérité : c'est la page qui
      recouvre la vignette.
      Celui de droite existe tant qu'il reste quelque chose à voir,
      celui de gauche dès qu'on a fait défiler — les états mêmes des
      chevrons (montés et démontés ensemble). Jamais d'interception de
      clic (`pointer-events-none`), et le chevron (z-[2]) se pose
      dessus (z-[1]). */
  const voile = (sens: 1 | -1) => (
    <div
      aria-hidden="true"
      data-voile-rangee={sens === 1 ? "droite" : "gauche"}
      className={`pointer-events-none absolute inset-y-0 z-[1] w-4 sm:w-6 ${
        sens === 1
          ? "-right-4 sm:-right-6 bg-gradient-to-l"
          : "-left-4 sm:-left-6 bg-gradient-to-r"
      } from-sombre-fond/90 to-sombre-fond/0`}
    />
  );

  return (
    /*  §2 (nº 252) — l'enveloppe ne contient QUE la rangée (la marge
        haute des flèches de la nº 250 est partie avec elles) : les
        bandeaux `inset-y-0` épousent donc exactement la hauteur des
        images, et l'identité retrouve sa bande juste dessous. */
    /*  §2 (nº 254) — 20 px entre l'identité et sa bande sur le web ;
        §4 (nº 264) — LE DOIGT REJOINT LES 20 px : ses 8 px collaient
        la photo de profil à la rangée agrandie. Une seule valeur
        désormais (`mt-5`). */
    <div className="group relative mt-5">
      <ul
        ref={zone}
        data-bande-suivi=""
        data-cas={bande.cas}
        /*  §2 (nº 244) — 6 px d'écart. Le défilement est NATIF, la
            barre est masquée (elle n'apprendrait rien), l'accrochage
            au centre laisse dépasser les deux voisines.
            §3 (nº 264) — LA RANGÉE DÉBORDE DE SON CADRE, à gauche et à
            droite, jusqu'aux bords de l'écran : marges NÉGATIVES de la
            largeur des marges de la page (`-mx-4 sm:-mx-6`), rendues
            en REMBOURRAGE interne (`px-4 sm:px-6`) — au repos la
            première vignette reste alignée sur le contenu, et la
            partielle se prolonge dans la marge, sous le fondu (§3).
            Les pourcentages des cases se lisent sur la BOÎTE DE
            CONTENU (le rembourrage n'y entre pas) : les largeurs du
            web ne bougent pas d'un pixel.
            ⚠️ PIÈGE DE LA nº 228 : le débordement vit DANS le
            défilement de la rangée (`overflow-x-auto`), jamais dans la
            page — `scrollWidth` du document reste égal à
            `clientWidth`, le banc le mesure. */
        className="flex gap-1.5 -mx-4 px-4 sm:-mx-6 sm:px-6
                   overflow-x-auto snap-x snap-mandatory
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {bande.photos.map((photo) => (
          <li key={photo.id} className={CASE_RANGEE}>
            {/*  UNE VIGNETTE OUVRE LA PHOTO, et elle seule : la fiche
                 s'ouvre sur cette photo, dans son ensemble (style +
                 catégorie + rendu), exactement comme une carte de la
                 mosaïque le fait. */}
            <Link
              href={
                `/tatoueur/${suivi.slug}?style=${photo.style}` +
                `&nature=${photo.nature}` +
                (photo.rendu ? `&rendu=${photo.rendu}` : "") +
                `&photo=${photo.id}`
              }
              data-vignette-suivi={photo.id}
              //  §4 (nº 244) — au doigt, une BRÈVE baisse d'opacité,
              //  rien de plus. §5 (nº 247) — angles droits.
              //  §4 (nº 251) — LE FORMAT PORTFOLIO DU SITE (4:5), lu
              //  là où il vit : `CADRE_PHOTO_PORTFOLIO`. Il réserve
              //  aussi la hauteur AVANT l'image (règle du §3, nº 226).
              className={`relative block ${CADRE_PHOTO_PORTFOLIO} overflow-hidden rounded-none
                         bg-sombre-eleve transition-opacity active:opacity-75`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element --
                  photo déposée par le tatoueur, servie telle quelle. */}
              <img
                src={photo.miniature}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {/*  §5 (nº 249) — LE CŒUR DES VIGNETTES AIMÉES, en bas à
                   droite, sur elles SEULES (le cas « aimees » — les
                   premières affichées, l'ordre de la nº 243). Le
                   glyphe est celui du cœur allumé des photos
                   (nº 141-6B) : blanc plein, et l'ombre du trait —
                   c'est la lisibilité du glyphe sur photo claire comme
                   sombre (la décision de la nº 141-6A), PAS un halo ni
                   un fond : aucun cercle, aucune plaque derrière lui.
                   §3 (nº 250) — SA TAILLE SUIT LA VIGNETTE, il ne
                   l'écrase jamais ; tenu à 8 px des deux bords
                   (`bottom-2 right-2`).
                   §7 (nº 264) — LA PROPORTION DESCEND DE 12,5 À 9 % :
                   au huitième, le cœur d'une vignette web (~250 px)
                   faisait 31 px — PLUS GROS que celui des cartes de
                   favoris (24 px, BoutonCoeurPhoto), sur une photo
                   bien plus petite. À 9 %, il repasse nettement
                   dessous et rend la photo. Les 8 px des bords ne
                   bougent pas. */}
              {bande.cas === "aimees" && (
                <span
                  data-coeur-aime=""
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 right-2 w-[9%]"
                >
                  <IconeCoeur
                    taille={24}
                    classe="block h-auto w-full fill-white text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.55))]"
                  />
                </span>
              )}
            </Link>
          </li>
        ))}
        {/*  §6 (nº 249) — LA CASE « VOIR PLUS », au bout du glissement,
             dès que la source compte au moins dix vignettes : elle
             mène au portfolio entier de la fiche.
             §4 (nº 250) — L'ÉCRITURE DES ACTIONS INTERMÉDIAIRES
             (charte, nº 217-§7) : une CAPSULE À TAILLE NATURELLE,
             centrée dans sa case — le gris relevé qui s'éclaircit au
             survol, jamais de rose plein, jamais une case pleine. */}
        {bande.voirPlus && (
          <li className={CASE_RANGEE}>
            <span className={`flex ${CADRE_PHOTO_PORTFOLIO} items-center justify-center`}>
              <Link
                href={`/tatoueur/${suivi.slug}`}
                data-voir-plus=""
                className="inline-flex items-center justify-center rounded-full
                           bg-sombre-eleve px-3.5 min-h-[32px] text-[13px]
                           font-medium text-sombre-texte transition-colors
                           hover:bg-sombre-haut active:opacity-80"
              >
                Voir plus
              </Link>
            </span>
          </li>
        )}
      </ul>
      {etat.gauche && voile(-1)}
      {etat.droite && voile(1)}
      {etat.gauche && bandeau(-1)}
      {etat.droite && bandeau(1)}
      {/*  §4 (nº 253) — L'INDICATEUR DE PAGES : autant de repères que
           de pages, celui en cours distingué ; dès deux pages
           seulement. Absolu : son apparition ne déplace rien.
           §5 (nº 264) — AU-DESSUS DE LA RANGÉE, à droite
           (`bottom-full`, 6 px au-dessus des photos — l'écart même de
           la rangée), et SON BORD DROIT S'ALIGNE sur celui de la
           dernière vignette ENTIÈREMENT visible (`etat.decalage`, lu
           dans le DOM) — jamais le bord de l'écran, jamais une
           vignette coupée. SUR LE WEB SEULEMENT (`pointer-fine`) : au
           doigt on fait glisser, les repères sont SUPPRIMÉS. */}
      {etat.pages > 1 && (
        <div
          data-indicateur-pages={etat.pages}
          data-page-courante={etat.page}
          aria-hidden="true"
          style={{ right: etat.decalage }}
          className="pointer-events-none absolute bottom-full mb-1.5 z-[3]
                     hidden pointer-fine:flex items-center gap-1"
        >
          {/*  §5 (nº 254) — DES TIRETS, un par page : 16 × 2 px, 4 px
               d'écart (le gap-1 du conteneur), la page en cours en
               blanc plein, les autres très atténuées. Aucun rose.
               (nº 264 : au-dessus de la rangée, ils ne couvrent plus
               de photo — l'ombre de lisibilité de la nº 221 n'a plus
               d'objet et s'en va.) */}
          {Array.from({ length: etat.pages }).map((_, rang) => (
            <span
              key={rang}
              className={`h-0.5 w-4 rounded-full ${
                rang === etat.page ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
