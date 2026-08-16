"use client";

import Link from "next/link";
import { GalerieQuiDefile } from "@/components/GalerieQuiDefile";
import {
  CADRE_PHOTO_PORTFOLIO,
  ECRITURE_TITRE_SECTION,
} from "@/config/tatouage";
import {
  CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE,
  PhotoRonde,
} from "@/components/BlocLieux";
import {
  bandeDeTrois,
  groupesDeSuivis,
  libelleNouveautes,
  lignesDInformation,
} from "@/lib/selection-suivis";
import type { TatoueurSuivi } from "@/lib/favoris-serveur";

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

//  §1 (nº 302) — LES FAVORIS DU VISITEUR NE SONT PLUS DEMANDÉS : la
//  galerie ne se compose plus de ses coups de cœur mais des cinq règles
//  de composition (voir `bandeDeTrois`), et la règle 5 lit les j'aime
//  REÇUS par chaque photo, qui voyagent avec elle.
/**
 * §2 (nº 312) — CE QUE « MA SÉLECTION » DEMANDE POUR OUVRIR UNE FICHE.
 * ==================================================================
 * EN WEB, UNE FICHE S'OUVRE EN FENÊTRE CENTRÉE SUPERPOSÉE — partout
 * ailleurs sur le site, et donc ici aussi. C'était le §1 de la passe
 * nº 305, jamais exécutée dans ce dépôt ; la nº 307 n'en avait rattrapé
 * que deux points sur trois, et celui-ci était resté.
 * ⚠️ CE BLOC N'OUVRE RIEN LUI-MÊME, et c'est la règle : `PageFavoris`
 * possède déjà la fenêtre, sa note de retour, sa position de page et sa
 * clé de remontage (elle s'en sert pour les cartes de favoris depuis la
 * nº 213). On lui passe la main — un seul propriétaire de la fenêtre,
 * une seule écriture. Sans ce rappel, les liens restent de VRAIS liens
 * et la page de fiche s'ouvre : c'est ce qui doit arriver au doigt, au
 * clic du milieu, et aux moteurs de recherche.
 */
export type OuvertureDepuisSuivis = (
  slug: string,
  serie: { cle: string; style: string; nature: string; rendu: string; photo: string },
  adresse: string
) => void;

/**
 * LE CLIC QUI OUVRE LA FENÊTRE (§2, nº 312) — l'écriture unique des
 * deux liens de ce bloc, et la MÊME QUE CELLE DES CARTES DE MOSAÏQUE
 * (voir `auClic` dans CarteTatoueur) :
 *  · un clic modifié (nouvel onglet, clic du milieu…) ne touche à rien ;
 *  · sur un VRAI TÉLÉPHONE on ne fait rien non plus — le lien navigue,
 *    et la fenêtre superposée du web n'a rien à y faire ;
 *  · sinon, on empêche la navigation et on ouvre la fenêtre.
 */
function ouvrirEnFenetre(
  evenement: React.MouseEvent,
  surOuverture: OuvertureDepuisSuivis | undefined,
  ...args: Parameters<OuvertureDepuisSuivis>
) {
  if (!surOuverture) return;
  if (
    evenement.metaKey ||
    evenement.ctrlKey ||
    evenement.shiftKey ||
    evenement.altKey
  ) {
    return;
  }
  if (document.documentElement.dataset.appareil === "mobile") return;
  evenement.preventDefault();
  surOuverture(...args);
}

export function BlocSuivis({
  suivis,
  surOuverture,
}: {
  suivis: TatoueurSuivi[];
  /** Fournie par « Ma sélection » sur le web ; absente ailleurs. */
  surOuverture?: OuvertureDepuisSuivis;
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
            //  §3 (nº 276) — la classe exacte vit désormais dans
            //  ECRITURE_TITRE_SECTION (config), partagée avec l'onglet
            //  Profil et les titres du Portfolio.
            <h2 className={ECRITURE_TITRE_SECTION}>
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
                <BlocDUnSuivi suivi={suivi} surOuverture={surOuverture} />
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
  surOuverture,
}: {
  suivi: TatoueurSuivi;
  surOuverture?: OuvertureDepuisSuivis;
}) {
  const lignes = lignesDInformation(suivi);
  const bande = bandeDeTrois(suivi);
  const nouveautes = libelleNouveautes(suivi.nouveautes);

  return (
    <div data-suivi={suivi.slug} className="flex flex-col">
      {/* 1 · LA LIGNE D'IDENTITÉ — UN SEUL LIEN, pastille comprise. */}
      <Link
        href={`/tatoueur/${suivi.slug}`}
        data-ligne-suivi=""
        /*  §2 (nº 312) — EN WEB, LA FICHE S'OUVRE PAR-DESSUS. Le lien
            reste un vrai lien : au doigt il navigue, et un clic du
            milieu ouvre toujours la page. */
        onClick={(evenement) =>
          ouvrirEnFenetre(
            evenement,
            surOuverture,
            suivi.slug,
            //  Aucune série demandée : la fiche s'ouvre sur ce qu'elle
            //  montre par défaut, comme le ferait sa page.
            { cle: `suivi-${suivi.slug}`, style: "", nature: "", rendu: "", photo: "" },
            `/tatoueur/${suivi.slug}`
          )
        }
        /*  §3 (nº 254) — L'ÉCART PASTILLE-TEXTE SE REMET À L'ÉCHELLE :
            14 px pour un rond de 52 (gap-3.5, la proportion de
            toujours) → 20 px pour un rond de 72 (14 × 72 ÷ 52 ≈ 19,4,
            le cran de la grille le plus proche). La ligne reste
            l'écriture partagée, l'écart web s'y ajoute.
            §3 (nº 301) — ET PLUS AUCUN ENCADRÉ AU SURVOL, web comme
            doigt : le propriétaire n'en veut plus SUR CETTE PAGE. La
            ligne reste un lien vers la fiche, pastille comprise ; seule
            la plaque grise disparaît. La géométrie ne bouge pas d'un
            pixel — `-m-2 p-2` s'annulaient (voir la note de
            `CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE`). */
        className={`${CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE} lg:gap-5`}
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
        <RangeeDeVignettes suivi={suivi} bande={bande} surOuverture={surOuverture} />
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
  surOuverture,
}: {
  suivi: TatoueurSuivi;
  bande: ReturnType<typeof bandeDeTrois>;
  surOuverture?: OuvertureDepuisSuivis;
}) {
  return (
    /*  §2 (nº 254) — 20 px entre l'identité et sa bande sur le web ;
        §4 (nº 264) — LE DOIGT REJOINT LES 20 px : ses 8 px collaient la
        photo de profil à la rangée agrandie. Une seule valeur (`mt-5`).
        §3 (nº 264) — LA RANGÉE DÉBORDE DE SON CADRE, à gauche et à
        droite, jusqu'aux bords de l'écran : marges NÉGATIVES de la
        largeur des marges de la page (`-mx-4 sm:-mx-6`), rendues en
        REMBOURRAGE interne (`px-4 sm:px-6`) — au repos la première
        vignette reste alignée sur le contenu, et la partielle se
        prolonge dans la marge, sous le fondu.
        ⚠️ PIÈGE DE LA nº 228 : le débordement vit DANS le défilement de
        la rangée, jamais dans la page.
        §1 (nº 306) — ET LE DESSIN N'EST PLUS ÉCRIT ICI : c'est
        `GalerieQuiDefile`, partagé avec la colonne Portfolio d'une
        fiche. Ce composant ne décide plus que du CONTENU. */
    <GalerieQuiDefile
      classeEnveloppe="mt-5"
      classeRangee="-mx-4 px-4 sm:-mx-6 sm:px-6"
      cleDuContenu={bande.photos.length}
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
            /*  §2 (nº 312) — EN WEB, LA FICHE S'OUVRE PAR-DESSUS, ET
                SUR CETTE PHOTO : les trois tags de la série ET
                l'identifiant de la photo voyagent, exactement comme
                dans l'adresse juste au-dessus. Les deux chemins
                ouvrent donc la même chose — c'est ce qui permet au
                doigt de naviguer sans qu'on écrive rien de plus. */
            onClick={(evenement) =>
              ouvrirEnFenetre(
                evenement,
                surOuverture,
                suivi.slug,
                {
                  cle: `suivi-${photo.id}`,
                  style: photo.style,
                  nature: photo.nature,
                  rendu: photo.rendu ?? "",
                  photo: photo.id,
                },
                `/tatoueur/${suivi.slug}?style=${photo.style}` +
                  `&nature=${photo.nature}` +
                  (photo.rendu ? `&rendu=${photo.rendu}` : "") +
                  `&photo=${photo.id}`
              )
            }
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
            {/*  §2 (nº 302) — PLUS AUCUN CŒUR SUR CES VIGNETTES,
                 web comme doigt. Le cœur de la nº 249 disait qu'une
                 photo avait été aimée par le visiteur ; la galerie ne
                 se compose plus de ses coups de cœur (nº 302-§1),
                 ce signe n'a donc plus rien à signaler. Supprimé,
                 code compris — le glyphe n'est plus importé. */}
          </Link>
        </li>
      ))}
      {/*  §1 (nº 302) — LA CASE « VOIR PLUS » EST SUPPRIMÉE, code
           compris. La galerie s'arrête à vingt photos ; s'il y en a
           moins, il y en a moins, et sans message — c'est la
           consigne, au mot près. Le drapeau `voirPlus` a disparu du
           type avec elle : plus rien ne le calcule. */}
    </GalerieQuiDefile>
  );
}
