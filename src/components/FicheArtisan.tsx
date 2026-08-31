import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { COULEURS, MARQUE } from "@/config/roswel";
import type { ArtisanComplet } from "@/lib/fiche-artisan";
import { lienAvisGoogle, lienTelephone, lienWhatsApp } from "@/lib/contact";
import { anneesExistence, nomVilleCourt } from "@/lib/villes";
import { estSociete } from "@/lib/compte-artisan";
import {
  libelleMetiersArtisan,
  libellesMetiersSepares,
  offreDepuisSlug,
} from "@/lib/metiers";
import { adresseDuSite } from "@/lib/site";
import { cascadeMetierServices } from "@/lib/cascade-metier";
import { cascadeNomArtisan } from "@/lib/largeur-nom";
import { CLASSE_LIEN_FLECHE, TexteLienFleche } from "@/components/LienFleche";
import { lignesJourCalendrier, septProchainsJours } from "@/lib/horaires";
import { badgeDisponibilite, Etoiles } from "@/components/CarteArtisan";
import { infosNiveau } from "@/components/Pastille";
import { BoutonFavoriCarte } from "@/components/BoutonFavoriCarte";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonRetour } from "@/components/BoutonRetour";
import { BoutonSignalement } from "@/components/BoutonSignalement";
import { StatutJoignabilite } from "@/components/StatutJoignabilite";
import { PiedDePage } from "@/components/PiedDePage";
import { VilleCouverte } from "@/components/VilleCouverte";
import { JsonLd } from "@/components/JsonLd";
import {
  IconeBadgeVerifie,
  IconeBouclierTrait,
  IconeChevronBas,
  IconeCle,
  IconeCocheListe,
  IconeEpingle,
  IconeGoogle,
  IconeHorloge,
  IconeCalendrierCoche,
  IconeInstagram,
  IconeDrapeau,
  IconeLienExterne,
  IconeMonde,
  IconeTelephone,
  IconeWhatsApp,
} from "@/components/Icones";

const formatCompact = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatNote = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Les communes couvertes, préparées par la page (accordéon « Zone ») */
export type CommunesCouvertes = { noms: string[]; autres: number };

/**
 * LA FICHE ARTISAN (maquette de refonte)
 * --------------------------------------
 * - photo CARRÉE pleine largeur (retour à gauche ; cœur favori puis
 *   partage à droite — disques blancs sans contour, même diamètre
 *   que le retour) ;
 * - nom directement sous la photo, puis quatre lignes d'infos aux
 *   icônes grises alignées : Métier, Intervient sur [ville
 *   recherchée, repli ville artisan], X ans d'ancienneté,
 *   N° SIREN ;
 * - modules Google et Instagram (cliquables, nouvel onglet) ;
 * - trois accordéons : Joignabilité (titre = badge automatique,
 *   contenu = horaires), Services (bio), Zone (communes couvertes
 *   en deux colonnes à coches) ;
 * - le pied de page commun suit naturellement le 3e accordéon ;
 * - barre FIXE en bas : les badges (niveau + disponibilité) posés
 *   dessus, collés à son bord supérieur (onglets inversés, angles
 *   hauts arrondis) ; la ligne supérieure de la barre prend la
 *   couleur du niveau. Boutons Appeler (si téléphone affiché) et
 *   WhatsApp : contour, texte et icônes à la couleur du niveau
 *   (gris fin sans badge) — jamais de bouton grisé, fond opaque,
 *   elle ne recouvre jamais les liens légaux (espace réservé via
 *   globals.css sur la page).
 */
export function FicheArtisan({
  artisan,
  favori = { userId: null, actif: false },
  communesCouvertes = null,
  nombreFavoris = null,
  metierSlug = null,
  villeSlug = null,
  titrePrincipal = true,
}: {
  artisan: ArtisanComplet;
  favori?: { userId: string | null; actif: boolean };
  communesCouvertes?: CommunesCouvertes | null;
  /** Compteur du cœur affiché dans le bandeau (≥ 1024 px). null =
      inconnu → aucun compteur. */
  nombreFavoris?: number | null;
  /** Métier + ville de la recherche (fil d'Ariane du bandeau et
      balisage BreadcrumbList). À défaut : métier de l'artisan. */
  metierSlug?: string | null;
  villeSlug?: string | null;
  /** SEO — UN SEUL <h1> par page. Vrai (défaut) sur la page fiche
      /artisan/nom : le nom de l'artisan est le titre principal. Faux
      quand la fiche n'est qu'une COLONNE de la page de résultats (le
      <h1> y est « Métier de confiance à Ville ») : le nom passe alors
      en <h2>, sans changement visuel. */
  titrePrincipal?: boolean;
}) {
  // L'ENTRÉE RÉELLE de l'artisan (« Plombier & Chauffagiste » pour une
  // double compétence, jamais « Plombier · Chauffagiste »)
  const libelleMetiers = libelleMetiersArtisan(artisan.metiers);
  const niveau = infosNiveau(artisan.pastille);
  const dispo = badgeDisponibilite(artisan);
  // Type de compte : cercle (indépendant) / carré arrondi (société).
  // Plus de ligne secondaire (ni société, ni « Dirigée par … »).
  const societe = estSociete(artisan);

  // « X ans d'ancienneté » (date de création Sirene, durée d'existence
  // de l'entreprise — jamais l'expérience professionnelle) ; entreprise
  // de moins d'un an : « Entreprise créée en [année] »
  const annees =
    artisan.siren_verifie && artisan.date_creation_entreprise
      ? anneesExistence(artisan.date_creation_entreprise)
      : null;
  // « 18 ans » (sans « d'ancienneté ») ; entreprise de moins d'un an →
  // « Créée en AAAA ». La MÊME valeur sert aux deux mises en page : la
  // ligne d'infos empilée du téléphone comme les 4 colonnes du grand
  // format. La forme longue (« 18 ans d'ancienneté ») n'est plus
  // affichée nulle part depuis que le téléphone a repris cette charte.
  const ancienneteCourte =
    annees == null
      ? null
      : annees >= 1
        ? `${annees} an${annees > 1 ? "s" : ""}`
        : `Créée en ${new Date(artisan.date_creation_entreprise!).getFullYear()}`;

  const villeArtisan = nomVilleCourt(artisan.ville_nom ?? "");

  const aDesAvis =
    artisan.note_google != null && (artisan.nombre_avis_google ?? 0) > 0;

  const initiales = artisan.nom_affiche
    .split(/\s+/)
    .filter((mot) => /^[\p{L}]/u.test(mot))
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();

  const telephoneAffiche = Boolean(artisan.telephone) && artisan.telephone_visible;

  // Nom en grand format : une ligne en 26 px tant qu'il tient, sinon
  // deux lignes en 20 px (voir src/lib/largeur-nom.ts)
  const cascadeNom = cascadeNomArtisan(artisan.nom_affiche);

  // ===== Fil d'Ariane (bandeau ≥ 1024 px) + balisage SEO =====
  const metierFil = metierSlug ?? artisan.metiers[0] ?? null;
  const metierLabelFil =
    (metierFil ? offreDepuisSlug(metierFil)?.label : null) ??
    libelleMetiers ??
    "Artisan";
  const lienRecherche =
    metierFil && villeSlug ? `/${metierFil}/${villeSlug}` : null;
  const pageActuelle = `Artisan ${metierLabelFil} ${artisan.nom_affiche}`;
  // Adresse absolue du site (jamais localhost en ligne — voir lib/site.ts)
  const siteUrl = adresseDuSite();
  const filArianeJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
      ...(lienRecherche
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: `${metierLabelFil} à ${villeArtisan}`,
              item: `${siteUrl}${lienRecherche}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: lienRecherche ? 3 : 2,
        name: pageActuelle,
      },
    ],
  };

  // Adresse complète (section conditionnelle du bandeau ≥ 1024 px) :
  // affichée UNIQUEMENT si l'artisan a renseigné une adresse.
  // « rue, code postal ville » (ex. « 24 rue Paul Bert, 69003 Lyon »)
  // AFFICHAGE sur DEUX LIGNES : la rue, puis le code postal et la ville
  // (sans virgule entre les deux — c'est le retour à la ligne qui sépare).
  const adresseRue = artisan.adresse?.trim() || null;
  const adresseVille =
    [artisan.ville_code_postal, villeArtisan].filter(Boolean).join(" ") || null;
  // La forme d'un seul tenant (avec virgule) sert au titre de la carte et
  // à la RECHERCHE Google Maps, qui géocode mieux avec le séparateur.
  const adresseComplete = adresseRue
    ? [adresseRue, adresseVille].filter(Boolean).join(", ")
    : null;
  // Lien Google Maps : une simple URL de RECHERCHE publique — aucune clé
  // d'API, aucun coût, aucun quota. La carte affichée dans l'encadré
  // reste, elle, celle d'OpenStreetMap (gratuite également).
  const lienGoogleMaps = adresseComplete
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        adresseComplete
      )}`
    : null;
  const aCoordonnees = artisan.latitude != null && artisan.longitude != null;

  return (
    <>
      {/* Balisage SEO : le fil d'Ariane (Accueil › Métier à Ville ›
          fiche), lu par les moteurs (invisible à l'écran). */}
      <JsonLd donnees={filArianeJsonLd} />

      {/* Fiche pleine page sur iPad/web (hors mode double) : un
          contour aux angles arrondis, ALIGNÉ sur les bords de la
          photo, à la couleur du badge de niveau (gris sans badge).
          En mode double (lg), le contenu occupe TOUTE la largeur de
          la colonne (lg:max-w-none) : le contour de la colonne
          épouse les bords de la fiche, sans marge gauche/droite. */}
      {/* Dès 480 px, la fiche est un BLOC AUTONOME (colonne qui défile
          à l'intérieur) : le contour est le calque de la colonne
          parente (EcranRecherche / la page fiche), qui englobe TOUT
          jusqu'au bandeau de contact. Ici, plus de bordure propre :
          on remplit simplement la colonne (max-w-none dès 480 px).
          Sous 480 px (smartphone) : carte centrée max-w-[730px] sans
          bordure, contenu qui défile normalement. */}
      {/* ===== MISE EN PAGE < 560 px (téléphone tenu en main : iPhone 12,
              iPhone 14 Pro Max…) : inchangée, à la lettre.
              LA BASCULE EST À 560 px (elle était à 768, puis à 640) : dès
              que le téléphone
              est assez large (mode paysage, petite tablette), la fiche
              adopte la présentation de la version web — celle du bloc
              « bandeau gris + avatar » plus bas — parce qu'il y a enfin
              la place pour ses 4 colonnes d'infos et ses sections. La
              présentation web sert donc TOUTES les largeurs ≥ 560 px
              (smartphone étiré 560–767, tablette 768–1023, web ≥ 1024). ===== */}
      <div className="min-[560px]:hidden max-w-[730px] w-full mx-auto min-[480px]:max-w-none">
      {/* ----- Bandeau gris (doux) -----
          MÊME gris que le grand format (#EBEBEF), mais PLUS BAS (84 px
          contre 111) : sur un téléphone, le vide sous la rangée
          d'icônes était trop généreux. 84 − 48 (les boutons) = 36, soit
          18 px EXACTEMENT au-dessus et 18 px en dessous.
          Et SANS le liseré blanc de 4 px : ici la fiche n'a aucun contour,
          le bandeau va donc franchement d'un bord à l'autre de l'écran.
          Il porte, comme en grand format, l'avatar qui chevauche son
          bas et, en haut à droite, les trois boutons retour / favori /
          partage. */}
      <div className="relative z-20 shrink-0 h-[84px] bg-[#EBEBEF]">
        {/* Avatar : cercle (indépendant) / carré arrondi (société), son
            CENTRE aligné sur le BAS du bandeau. Même diamètre qu'en
            grand format (104 px) et même contour blanc. */}
        <span
          className={`absolute left-5 bottom-0 translate-y-1/2 z-10 w-[104px] h-[104px] overflow-hidden bg-gradient-to-br from-degrade-debut to-degrade-fin flex items-center justify-center ring-4 ring-fond ${
            societe ? "rounded-2xl" : "rounded-full"
          }`}
        >
          {artisan.photo_url ? (
            <Image
              src={artisan.photo_url}
              alt={`Photo de ${artisan.nom_affiche}`}
              fill
              priority
              sizes="104px"
              className="object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-white/95 select-none" aria-hidden>
              {initiales || "?"}
            </span>
          )}
        </span>

        {/* Retour + favori (compteur) + partage : EXACTEMENT le gabarit
            du grand format — carrés de 48 px aux angles de 12 px, fond
            blanc SANS contour, icônes grises. */}
        <div className="absolute top-[18px] right-5 flex items-center gap-2">
          <BoutonRetour variante="bandeau" />
          <BoutonFavoriCarte
            artisanId={artisan.id}
            nomArtisan={artisan.nom_affiche}
            userId={favori.userId}
            initialActif={favori.actif}
            variante="compteur"
            nombreFavoris={nombreFavoris}
            sansContour
          />
          <BoutonPartageFiche
            nomArtisan={artisan.nom_affiche}
            variante="carte"
            sansContour
            bulleEnDessous
            //  nº 759 — voir la note du composant : son défaut est
            //  désormais la marque de YokoFolio.
            marque={MARQUE.nom}
          />
        </div>
      </div>

      {/* ----- Corps de la fiche -----
          Le NOM est exactement à la place qu'il occupe en grand format :
          à DROITE de l'avatar, dans une rangée de 48 px qui démarre au
          bas du bandeau, et calé à 8 px du bord droit de l'avatar —
          l'écart EXACT mesuré en grand format.
          `ml-[112px]` et non 116 : en grand format le bandeau porte un
          liseré de 4 px, dont l'avatar (positionné dans la boîte de
          remplissage) hérite ; ici le bandeau n'en a pas, il faut donc
          retirer ces 4 px pour retrouver le même écart.
          UNE différence : le nom N'EST PAS tronqué ici mais passe à la
          ligne. À 320 px il ne reste que 164 px à côté de l'avatar —
          « Sophie Bertrand » y serait coupé au milieu. */}
      <div className="px-5 pb-6">
        {/* `min-h-[52px]` = le débord EXACT de l'avatar sous le bandeau :
            avec un nom d'une ligne, le bas de cette rangée tombe donc
            pile sur le bas de l'avatar, et la marge qui suit se mesure
            directement depuis la photo.
            TAILLE DU NOM : 20 px, FIXE — la même quelle que soit la
            longueur du nom (elle était auparavant réduite pour les noms
            longs, ce qui n'est pas le rendu voulu). L'interligne est
            calé à 25 px : DEUX lignes font donc 50 px et tiennent
            exactement dans les 52 px de débord de l'avatar — le bas de
            la seconde ligne ne dépasse jamais le bas de la photo. Au
            delà de deux lignes, `line-clamp-2` tronque avec des points
            de suspension. */}
        <div className="ml-[112px] min-h-[52px] flex items-center">
          {/* SEO : <h1> sur la page fiche, <h2> quand la fiche n'est
              qu'une colonne de la page de résultats (rendu identique).
              C'est CETTE mise en page qui porte le <h1> de la page :
              l'indexation de Google est « mobile d'abord ». */}
          {titrePrincipal ? (
            <h1 className="text-[20px] leading-[25px] font-bold text-encre line-clamp-2">
              {artisan.nom_affiche}
            </h1>
          ) : (
            <h2 className="text-[20px] leading-[25px] font-bold text-encre line-clamp-2">
              {artisan.nom_affiche}
            </h2>
          )}
        </div>

        {/* BADGE + LIGNE D'INFOS : une SEULE colonne, un SEUL écart.
            C'est ce qui garantit — sans réglage au cas par cas — que la
            marge sous le badge est EXACTEMENT celle qui sépare
            « Ancienneté » de « N° SIREN ». 10 px : 8 px tassaient les
            lignes, 14 les éloignait trop.
            `mt-6` (24 px) : la marge entre le BAS DE LA PHOTO et le badge.
            Elle vaut exactement celle qui sépare la dernière ligne
            d'infos des encadrés Google / Instagram, posée plus bas avec
            le même `mt-6`. */}
        <div className="flex flex-col gap-2.5 mt-6">
          {/* Badge de niveau — même place qu'en grand format : juste
              sous le nom, avant la ligne d'infos. */}
          {niveau && (
            <p
              className="flex items-center gap-2 font-bold text-[15px]"
              style={{ color: niveau.couleur }}
            >
              <IconeBadgeVerifie taille={20} teinte={niveau.couleur} />
              {niveau.label}
            </p>
          )}

          {/* Ligne d'infos — MÊME CONTENU et MÊMES ICÔNES que les quatre
              colonnes du grand format (Ancienneté · N° SIREN · Internet ·
              Problème), mais EMPILÉES : la largeur d'un téléphone ne
              permet pas quatre colonnes côte à côte.
              Les quatre lignes sont TOUJOURS présentes : une information
              absente s'écrit « — », comme sur les cartes. */}
          {/* MÊME TAILLE que le badge « Très recommandé » juste au-dessus
              (15 px), mais SANS le gras : seule la taille est commune. */}
          <>
            {[
              {
                cle: "anciennete",
                valeur: ancienneteCourte ? (
                  <>Ancienneté : {ancienneteCourte}</>
                ) : (
                  <>Ancienneté : <span aria-label="non renseignée">—</span></>
                ),
                icone: <IconeCalendrierCoche taille={19} />,
              },
              {
                cle: "siren",
                valeur: artisan.siren ? (
                  <>N° SIREN : {artisan.siren}</>
                ) : (
                  <>N° SIREN : <span aria-label="non renseigné">—</span></>
                ),
                icone: <IconeBouclierTrait taille={19} />,
              },
              {
                cle: "internet",
                // Le libellé et le lien ne font plus qu'un :
                // « Voir le site Internet ». Sans site renseigné, une
                // simple mention en gris — ni lien, ni flèche, ni survol.
                valeur: artisan.site_internet ? (
                  <a
                    href={artisan.site_internet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASSE_LIEN_FLECHE}
                  >
                    <TexteLienFleche>Voir le site Internet</TexteLienFleche>
                  </a>
                ) : (
                  "Pas de site Internet"
                ),
                icone: <IconeMonde taille={19} />,
              },
              {
                cle: "probleme",
                // Le signalement vit ICI, plus en pied de fiche.
                valeur: (
                  <BoutonSignalement
                    artisanId={artisan.id}
                    variante="lien"
                    libelle="Signaler cet artisan"
                  />
                ),
                icone: <IconeDrapeau taille={19} />,
              },
            ].map((ligne) => {
              const l = ligne as {
                cle: string;
                valeur: ReactNode;
                icone: ReactNode;
              };
              return (
                <p
                  key={l.cle}
                  className="flex items-center gap-2.5 min-w-0 text-[15px] text-encre-douce"
                >
                  <span className="w-[19px] shrink-0 flex justify-center" aria-hidden>
                    {l.icone}
                  </span>
                  <span className="min-w-0 truncate">{l.valeur}</span>
                </p>
              );
            })}
          </>
        </div>

        {/* ===== Modules Google et Instagram — fond blanc + liseré, icônes
                  G et Instagram, flèche « lien externe » en haut à droite,
                  contour et flèche au rose au survol comme au tap.
                  ESPACEMENT INTERNE : les deux espaces ne sont plus égaux.
                  Un `gap-2.5` unique donnait 10 px PARTOUT ; il est
                  remplacé par deux marges explicites, 10 px sous le titre
                  et 6 px seulement entre la ligne 2 et la ligne 3, qui se
                  lisent alors comme un seul bloc « chiffre + son volume ».
                  Les 4 px gagnés ne sont PAS redistribués : les marges
                  hautes et basses (py-4) et l'espace sous le titre ne
                  bougent pas, l'encadré raccourcit d'autant (115 → 111 px).
                  Les deux encadrés gardent la même hauteur : ils sont dans
                  une grille, la rangée prend la hauteur du plus grand, et
                  `justify-between` répartit comme avant. ===== */}
          <div className="grid grid-cols-2 gap-2.5 mt-6">
            <a
              href={lienAvisGoogle(artisan)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl bg-white border border-bordure hover:border-primaire active:border-primaire py-4 px-4 text-left flex flex-col items-start justify-between transition-colors"
            >
              <IconeLienExterne
                taille={19}
                classe="absolute top-2.5 right-2.5 text-encre-douce group-hover:text-primaire group-active:text-primaire transition-colors"
              />
              <p className="flex items-center gap-1.5 font-bold text-[15px]">
                <IconeGoogle taille={20} /> Google
              </p>
              {aDesAvis ? (
                <>
                  <p className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <Etoiles note={Number(artisan.note_google)} />
                    <strong className="text-[15px]">
                      {formatNote.format(Number(artisan.note_google))}
                    </strong>
                  </p>
                  <p className="mt-1.5 text-xs text-encre-douce">
                    {formatCompact.format(artisan.nombre_avis_google ?? 0)} avis
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <Etoiles note={null} />
                  </p>
                  <p className="mt-1.5 text-xs text-encre-douce">Avis à venir</p>
                </>
              )}
            </a>

            <a
              href={artisan.lien_instagram ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl bg-white border border-bordure hover:border-primaire active:border-primaire py-4 px-4 text-left flex flex-col items-start justify-between transition-colors"
            >
              <IconeLienExterne
                taille={19}
                classe="absolute top-2.5 right-2.5 text-encre-douce group-hover:text-primaire group-active:text-primaire transition-colors"
              />
              <p className="flex items-center gap-1.5 font-bold text-[15px]">
                <IconeInstagram
                  taille={20}
                  grise={artisan.abonnes_instagram == null}
                />{" "}
                Instagram
              </p>
              <p className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {artisan.abonnes_instagram != null ? (
                  <strong className="text-[15px]">
                    {formatCompact.format(artisan.abonnes_instagram)} abonnés
                  </strong>
                ) : (
                  <span className="text-encre-douce text-sm">Abonnés à venir</span>
                )}
              </p>
              <p className="mt-1.5 text-xs text-encre-douce">
                {artisan.publications_instagram != null
                  ? `${formatCompact.format(artisan.publications_instagram)} publications`
                  : "publications à venir"}
              </p>
            </a>
          </div>

        {/* ===== Sections — MÊME présentation qu'en grand format : plus
                d'encadrés, de simples LIGNES DE SÉPARATION horizontales,
                une icône devant chaque intitulé, et le même ordre —
                ce que fait l'artisan, quand il répond, où il se déplace,
                puis son adresse. `pl-[30px]` = largeur de l'icône (20) +
                son écart (10) : le contenu déroulé se cale sur le TEXTE
                de l'intitulé, jamais sur l'icône. ===== */}
        <div className="flex flex-col border-t border-bordure-carte mt-5">
          {/* ----- 1. Métier · Services ----- */}
          {(() => {
            const pastilles = libellesMetiersSepares(artisan.metiers);
            // LA CASCADE EN TROIS TEMPS, DÉCIDÉE AVANT LE RENDU.
            // `cascadeMetierServices` calcule, à partir des largeurs
            // RÉELLES des huit métiers possibles, les deux largeurs de
            // fenêtre auxquelles la ligne change d'étape, et rend le CSS
            // correspondant (voir `src/lib/cascade-metier.ts` pour le
            // détail du calcul et des trois étapes).
            //   ÉTAPE 1 — icône + « Métier · Services » + pastilles + chevron ;
            //   ÉTAPE 2 — la place manque : « · Services » disparaît, tout
            //             reste sur UNE ligne ;
            //   ÉTAPE 3 — la place manque encore : les pastilles passent à
            //             la ligne, « · Services » revient.
            // Le navigateur applique la bonne étape dès le premier tracé :
            // aucune mesure après rendu, donc aucun saut visuel.
            //   `pl-[30px]` sur le conteneur + `-ml-[30px]` sur l'icône :
            //     l'icône revient se placer tout à gauche, mais TOUTES les
            //     lignes suivantes démarrent à 30 px, c'est-à-dire pile
            //     sous le TEXTE de l'intitulé (20 px d'icône + 10 d'écart)
            //     et jamais sous l'icône.
            const cascade = cascadeMetierServices(pastilles, Boolean(artisan.bio));
            const intitule = (
              <>
                <style>{cascade.css}</style>
                <span
                  className={`${cascade.classe} min-w-0 flex-1 flex items-center gap-x-2.5 gap-y-2.5 pl-[30px] text-[15px]`}
                >
                  <span className="-ml-[30px] shrink-0 flex text-encre-douce" aria-hidden>
                    <IconeCle taille={20} />
                  </span>
                  <span className="whitespace-nowrap shrink-0">
                    <strong>Métier</strong>
                    {/* L'espace est DANS le fragment effaçable : quand
                        « · Services » disparaît, il disparaît avec lui. */}
                    <span className="metier-services text-encre-douce">
                      {" · Services"}
                    </span>
                  </span>
                  {pastilles.length > 0 && (
                    <span className="metier-pastilles flex flex-wrap items-center gap-2">
                      {pastilles.map((pastille) => (
                        <span
                          key={pastille}
                          className="shrink-0 rounded-lg border border-bordure-carte px-2.5 py-1 text-[13px] font-medium text-encre whitespace-nowrap"
                        >
                          {pastille}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </>
            );

            return artisan.bio ? (
              <details className="group border-b border-bordure-carte">
                <summary className="cursor-pointer list-none py-5 flex items-start justify-between gap-2">
                  {intitule}
                  <IconeChevronBas classe="shrink-0 mt-0.5 text-encre-douce transition-transform group-open:rotate-180" />
                </summary>
                {/* `whitespace-pre-line` : conserve les retours à la ligne
                    de l'artisan (paragraphe puis liste à tirets), que le
                    HTML écraserait par défaut. `pr-[42px]` : le texte
                    s'arrête au bord GAUCHE du chevron, moins la marge qui
                    sépare son bord DROIT du bord de la fiche. */}
                <p className="pb-5 pl-[30px] pr-[42px] text-sm leading-relaxed text-encre whitespace-pre-line">
                  {artisan.bio}
                </p>
              </details>
            ) : (
              <div className="border-b border-bordure-carte py-5 flex items-start">
                {intitule}
              </div>
            );
          })()}

          {/* ----- 2. Joignabilité + calendrier des 7 prochains jours ----- */}
          {(dispo || artisan.horaires) && (
            <details className="group border-b border-bordure-carte">
              <summary className="cursor-pointer list-none py-5 flex items-center justify-between gap-2">
                <span className="text-[15px] flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 flex text-encre-douce" aria-hidden>
                    <IconeHorloge taille={20} />
                  </span>
                  {dispo ? (
                    <StatutJoignabilite
                      etat={dispo.etat}
                      precision={dispo.precision}
                      precisionAbrege={dispo.precisionAbrege}
                      couleur={dispo.couleur}
                      classe="text-[15px]"
                      etatGras
                    />
                  ) : (
                    <span className="truncate font-bold">Horaires</span>
                  )}
                </span>
                <IconeChevronBas classe="shrink-0 text-encre-douce transition-transform group-open:rotate-180" />
              </summary>
              {/* CALENDRIER GLISSANT — les 7 prochains jours, le jour
                  COURANT en tête et en gras, sans aucun trait horizontal.
                  La grille est portée par la LISTE, pas par chaque ligne :
                  les 7 lignes partagent donc les mêmes colonnes et
                  s'alignent parfaitement à la verticale.
                  LA COLONNE DU MILIEU (la date, « 25 juillet ») N'EST PAS
                  SUPPRIMÉE D'OFFICE : elle apparaît DÈS QUE LA LARGEUR LE
                  PERMET. Mesure faite : les trois colonnes réclament
                  281 px de contenu (jour 64 + 48 d'écart + date 61 + 48 +
                  horaires) et la liste dispose de la largeur de l'écran
                  moins 40 px de marges et 30 px de retrait. Elles
                  tiennent donc dès 321 px ; le seuil est posé à 360 pour
                  garder de la marge sur les mois longs (« 25 septembre »
                  est 14 px plus large que « 25 juillet »). Seul un écran
                  de 320 px s'en tient à deux colonnes — et là encore,
                  rien n'est tronqué. */}
              <ul className="pb-5 pl-[30px] text-sm grid grid-cols-[auto_1fr] min-[360px]:grid-cols-[auto_auto_1fr] gap-x-12">
                {septProchainsJours().map((jour) => (
                  <li
                    key={jour.libelleDate}
                    className={`contents ${
                      jour.aujourdHui ? "font-bold text-encre" : "text-encre-douce"
                    }`}
                  >
                    <span className="py-1">{jour.libelleJour}</span>
                    {/* La date : masquée sous 360 px, où les trois
                        colonnes ne tiennent pas. `display:none` la retire
                        de la grille — les deux colonnes restantes se
                        recalent d'elles-mêmes. */}
                    <span className="hidden min-[360px]:block py-1">
                      {jour.libelleDate}
                    </span>
                    {/* UNE LIGNE PAR CRÉNEAU ; jour non travaillé :
                        « Indisponible » (jamais « Fermé ») */}
                    <span className="py-1 flex flex-col">
                      {lignesJourCalendrier(artisan.horaires?.[jour.jour]).map(
                        (ligne) => (
                          <span key={ligne}>{ligne}</span>
                        )
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* ----- 3. Couvre ----- */}
          <details className="group border-b border-bordure-carte">
            <summary className="cursor-pointer list-none py-5 flex items-center justify-between gap-2">
              <span className="text-[15px] flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 flex text-encre-douce" aria-hidden>
                  <IconeEpingle taille={20} />
                </span>
                <span className="truncate">
                  <strong>
                    Couvre <VilleCouverte villeArtisan={villeArtisan} />
                  </strong>{" "}
                  <span className="text-encre-douce">+ les zones à proximité</span>
                </span>
              </span>
              <IconeChevronBas classe="shrink-0 text-encre-douce transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-5 pl-[30px] text-sm text-encre-douce">
              {communesCouvertes && communesCouvertes.noms.length > 0 ? (
                <>
                  {/* UNE seule colonne (le grand format en affiche deux) :
                      à 320 px, deux colonnes laisseraient 113 px par nom et
                      « Sainte-Foy-lès-Lyon » serait coupé. */}
                  <ul className="flex flex-col gap-y-2">
                    {communesCouvertes.noms.map((nom) => (
                      <li key={nom} className="flex items-center gap-2 min-w-0">
                        <IconeCocheListe taille={16} classe="shrink-0" />
                        <span className="truncate">{nom}</span>
                      </li>
                    ))}
                  </ul>
                  {communesCouvertes.autres > 0 && (
                    <p className="mt-2.5 font-medium">
                      + {communesCouvertes.autres} autres communes
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Intervient dans un rayon de {artisan.rayon_intervention_km} km
                  autour de {villeArtisan || "sa commune"}.
                </p>
              )}
            </div>
          </details>

          {/* ----- 4. Adresse — CONDITIONNELLE, et JAMAIS un accordéon :
                  ni <details>, ni chevron. L'adresse et la carte sont
                  toujours visibles, sans aucun encadrement. ----- */}
          {adresseComplete && (
            <section>
              <div className="py-5">
                <p className="text-[15px] flex items-center gap-2.5">
                  <span className="shrink-0 flex text-encre-douce" aria-hidden>
                    <IconeEpingle taille={20} />
                  </span>
                  <strong>Adresse</strong>
                </p>
                {/* L'ADRESSE EST UN LIEN : elle ouvre Google Maps (ou
                    l'application Maps sur téléphone). Les DEUX lignes
                    forment un seul lien, au style commun de la fiche :
                    souligné au survol seulement, flèche rose à la fin de
                    la DERNIÈRE ligne. */}
                <a
                  href={lienGoogleMaps ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ouvrir ${adresseComplete} dans Google Maps`}
                  className={`mt-1 flex flex-col items-start pl-[30px] text-[15px] text-encre-douce ${CLASSE_LIEN_FLECHE}`}
                >
                  {adresseVille ? (
                    <>
                      <span className="group-hover/lien:underline underline-offset-2">
                        {adresseRue}
                      </span>
                      <TexteLienFleche>{adresseVille}</TexteLienFleche>
                    </>
                  ) : (
                    <TexteLienFleche>{adresseRue}</TexteLienFleche>
                  )}
                </a>
              </div>
              {aCoordonnees && (
                // La carte : ratio 4:3, SANS aucun contour.
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                  {/* L'iframe DÉBORDE de 32 px en haut et en bas : son
                      centre reste celui de la fenêtre — le marqueur ne
                      bouge pas — tandis que le bandeau d'OpenStreetMap,
                      collé au bas du document embarqué, passe sous le
                      bord. L'attribution obligatoire (licence ODbL) est
                      reprise ci-dessous, en petit et en gris. */}
                  <iframe
                    title={`Carte — ${adresseComplete}`}
                    className="absolute inset-x-0 -top-8 w-full h-[calc(100%+64px)]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      artisan.longitude! - 0.012
                    }%2C${artisan.latitude! - 0.006}%2C${
                      artisan.longitude! + 0.012
                    }%2C${artisan.latitude! + 0.006}&layer=mapnik&marker=${
                      artisan.latitude
                    }%2C${artisan.longitude}`}
                  />
                  <p className="absolute bottom-0 right-0 bg-white/70 px-1.5 py-0.5 text-[10px] leading-none text-encre-douce">
                    ©{" "}
                    <a
                      href="https://www.openstreetmap.org/copyright"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-primaire transition-colors"
                    >
                      OpenStreetMap
                    </a>
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Le lien « Signaler cette fiche » n'est plus ici : il a rejoint
          la ligne d'infos, en haut de la fiche, comme en grand format.
          Le pied de page commun (layout) suit directement — la barre
          fixe ci-dessous ne le recouvre jamais (espace réservé). */}
      </div>

      {/* Dès 480 px, le pied de page vit DANS le bloc fiche (celui du
          layout est masqué) ; placé AVANT la barre : en fin de
          défilement il reste au-dessus d'elle. « mt-auto » : fiche
          plus courte que la colonne → pied de page et barre au fond
          (jamais de grand vide sous les boutons). */}
      <div className="hidden min-[480px]:block min-[560px]:hidden min-[480px]:mt-auto">
        <PiedDePage classe="min-[480px]:pt-12 min-[480px]:pb-4" />
      </div>

      {/* ===== Barre de contact : FIXE à l'écran sous 480 px
              (smartphone) ; dès 480 px, COLLANTE au bas du bloc fiche
              (intégrée au contour). Elle ne porte que les boutons
              Appeler / WhatsApp ; sa ligne supérieure est grise
              (aucune couleur de niveau). MASQUÉE ≥ 560 px : la
              présentation web y remonte Appeler / WhatsApp à côté des
              modules Google / Instagram. ===== */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 min-[480px]:sticky min-[480px]:inset-x-auto min-[480px]:z-10 min-[560px]:hidden ${
          telephoneAffiche || artisan.whatsapp ? "" : "hidden"
        }`}
      >
        {/* HAUTEUR VERROUILLÉE : `h-12` (48 px EXACTS) au lieu de
            `min-h-[48px]`, et `shrink-0` sur la rangée. La barre mesure
            donc 73 px (48 + 2 × 12 de marge + 1 de trait) à TOUTES les
            largeurs : seule la largeur des boutons s'adapte, jamais leur
            hauteur — aucun contenu ne peut plus la faire grandir.
            Le menu opaque : contour, texte et bordure TOUJOURS gris
            (aucune couleur de niveau). Le CONTOUR des deux boutons est
            désormais `border-bordure-carte`, exactement celui des mêmes
            boutons en grand format (il valait auparavant le gris du
            badge, légèrement différent). Seules les ICÔNES restent
            colorées : téléphone en bleu iOS, WhatsApp en vert. */}
        <div
          className="bg-fond border-t"
          style={{ borderTopColor: COULEURS.bordureCarte }}
        >
          <div className="max-w-[730px] mx-auto min-[480px]:max-w-none px-4 py-3 flex items-center gap-2 shrink-0">
            {telephoneAffiche && (
              <a
                href={lienTelephone(artisan.telephone!)}
                aria-label={`Appeler ${artisan.nom_affiche}`}
                className="flex-1 min-w-0 h-12 shrink-0 rounded-2xl border border-bordure-carte text-encre-douce text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-fond-doux transition-colors"
              >
                <span style={{ color: COULEURS.contactTelephone }}>
                  <IconeTelephone taille={20} />
                </span>{" "}
                Appeler
              </a>
            )}
            {artisan.whatsapp && (
              <a
                href={lienWhatsApp(
                  artisan.whatsapp,
                  `Bonjour ${artisan.nom_affiche}, je vous ai trouvé sur Roswel.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Écrire à ${artisan.nom_affiche} sur WhatsApp`}
                className="flex-1 min-w-0 h-12 shrink-0 rounded-2xl border border-bordure-carte text-encre-douce text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-fond-doux transition-colors"
              >
                <span style={{ color: COULEURS.contactWhatsApp }}>
                  <IconeWhatsApp taille={20} />
                </span>{" "}
                Whatsapp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================
          MISE EN PAGE ≥ 560 px — COMPOSANT UNIFIÉ (smartphone étiré
          560–767, tablette 768–1023 ET web ≥ 1024 : MÊME code, MÊME
          rendu ; seule la largeur est fluide).
          Bandeau gris (111 px, bas aligné sur le séparateur du moteur en
          mode double), fil d'Ariane (≥ 768 seulement) + nom, retour
          (< 768 seulement) + favori (compteur) + partage ; avatar
          chevauchant le bas du bandeau ; puis badge, 4 colonnes
          d'infos, modules Google/Instagram + Appeler/WhatsApp, sections,
          adresse conditionnelle (carte OpenStreetMap), pied de page.
          ================================================================== */}
      {/* `grow` en plus de `min-h-full` : quand la section qui contient
          ce bloc tire sa hauteur du FLEX (fiche seule sur une colonne,
          768–1023 px), un pourcentage ne se résout pas — il faut que le
          bloc GRANDISSE. Sans cela, le pied de page collé en bas par
          `mt-auto` ne descend pas jusqu'au bord de l'encadré. */}
      <div className="hidden min-[560px]:flex min-[560px]:flex-col min-[560px]:grow min-[560px]:min-h-full">
        {/* ----- Bandeau gris (doux) -----
            Gris INTERMÉDIAIRE : nettement lisible sur le blanc de la
            fiche, sans la lourdeur du #E5E5EA essayé auparavant (jugé
            trop foncé) — exactement à mi-chemin des deux.
            LISERÉ BLANC de 4 px à GAUCHE, à DROITE et EN HAUT — même
            épaisseur que le contour blanc de la photo (ring-4) : le gris
            ne touche plus le contour de la fiche. AUCUN liseré EN BAS
            (border-b-0) : le bas du bandeau reste exactement où il est,
            aligné sur le séparateur du moteur en mode double, et
            l'avatar continue de le chevaucher au bon endroit. */}
        <div className="relative z-20 shrink-0 h-[111px] rounded-t-2xl bg-[#EBEBEF] border-4 border-b-0 border-fond">
          {/* Avatar : cercle (indépendant) / carré arrondi (société),
              son CENTRE aligné sur le BAS du bandeau (chevauchement).
              MÊME TAILLE que l'avatar des cartes (104 px), contour blanc. */}
          <span
            className={`absolute left-6 bottom-0 translate-y-1/2 z-10 w-[104px] h-[104px] overflow-hidden bg-gradient-to-br from-degrade-debut to-degrade-fin flex items-center justify-center ring-4 ring-fond ${
              societe ? "rounded-2xl" : "rounded-full"
            }`}
          >
            {artisan.photo_url ? (
              <Image
                src={artisan.photo_url}
                alt={`Photo de ${artisan.nom_affiche}`}
                fill
                priority
                sizes="104px"
                className="object-cover"
              />
            ) : (
              <span
                className="text-3xl font-bold text-white/95 select-none"
                aria-hidden
              >
                {initiales || "?"}
              </span>
            )}
          </span>

          {/* Favori (s'élargit pour un compteur) + partage, en HAUT à
              droite : fond BLANC seul, SANS contour — posés sur le gris
              du bandeau, ils se détachent d'eux-mêmes ; un liseré y
              ferait deux boutons lourds. (Les CARTES, elles, gardent
              leur contour : là, le fond est déjà blanc.) */}
          <div className="absolute top-4 right-6 flex items-center gap-2">
            {/* RETOUR — SMARTPHONE SEULEMENT (560–767). Sur web et
                tablette (≥ 768), la LISTE des résultats reste visible à
                côté de la fiche : il n'y a rien à quoi revenir, donc pas
                de bouton. Sous 768, la fiche occupe tout l'écran — la
                flèche redevient indispensable. Elle se place à GAUCHE du
                cœur, dans le même gabarit que ses deux voisines (48 px,
                angles arrondis, sans contour) et à la même couleur. */}
            {/* Seuil en PIXELS (`min-[768px]:hidden`) et non `md:hidden` :
                voir l'explication sur le fil d'Ariane plus bas — les
                paliers nommés de Tailwind sont exprimés en `rem`, donc
                déplacés dès que le navigateur n'est pas réglé sur une
                taille de police de 16 px. Le bouton retour et le fil
                d'Ariane basculent au MÊME endroit, exactement à 768 px :
                sans cela, une plage intermédiaire afficherait les deux. */}
            <div className="min-[768px]:hidden">
              <BoutonRetour variante="bandeau" />
            </div>
            <BoutonFavoriCarte
              artisanId={artisan.id}
              nomArtisan={artisan.nom_affiche}
              userId={favori.userId}
              initialActif={favori.actif}
              variante="compteur"
              nombreFavoris={nombreFavoris}
              sansContour
            />
            <BoutonPartageFiche
              nomArtisan={artisan.nom_affiche}
              variante="carte"
              sansContour
              marque={MARQUE.nom}
              // LA FENÊTRE DE PARTAGE, ici seulement : ce bloc n'existe
              // qu'à partir de 560 px. L'exemplaire du bandeau
              // téléphone (plus haut, < 560 px) ne la reçoit pas — son
              // comportement d'origine est donc conservé tel quel.
              avecFenetre
              metier={metierLabelFil}
              commune={villeArtisan || undefined}
              // Le bouton est tout en haut du bandeau : la bulle
              // « Lien copié ! » descend, sinon elle sortirait de la fiche.
              bulleEnDessous
            />
          </div>

          {/* Fil d'Ariane : tout en BAS du bandeau, à droite de l'avatar.
              MASQUÉ SOUS 768 px (smartphone, même étiré) : la place
              manque entre l'avatar et les trois boutons du bandeau, et
              le fil se retrouverait écrasé sur trois ou quatre lignes.
              Il n'est masqué QU'À L'ÉCRAN : le balisage schema.org
              BreadcrumbList (<JsonLd> tout en haut du composant) est
              rendu quelle que soit la largeur — Google continue donc de
              lire le chemin « Accueil › Métier à Ville › fiche ».

              LE SEUIL EST EN PIXELS, PAS EN `md:`. Les paliers nommés de
              Tailwind v4 sont exprimés en `rem` (`md` = 48rem) : ils ne
              valent 768 px que si le navigateur est réglé sur une police
              de 16 px. Un visiteur qui a agrandi la police par défaut
              (réglage d'accessibilité courant : 18 ou 20 px) voyait donc
              `md` basculer à 864 ou 960 px — le fil d'Ariane
              disparaissait alors qu'on était encore bien au-dessus de
              768 px, et le seuil semblait dépendre de la fenêtre ou du
              mode d'affichage. `min-[768px]:` produit une largeur en
              pixels : le seuil est le même pour tout le monde, à toutes
              les largeurs et dans les deux modes (une ou deux colonnes).

              DEUX LIGNES AU MAXIMUM, ET UN SEUL FLUX. Les niveaux
              (Accueil / Métier / Ville) sont des LIENS utiles au
              référencement : ils restent toujours entiers — jamais
              abrégés, jamais coupés (`shrink-0` + `whitespace-nowrap`) —
              et passent simplement à la ligne suivante s'il le faut. Le
              nom de la page, lui, n'est pas un lien : c'est LUI qui
              absorbe la contrainte. Dernier de la file, il suit les liens
              dans le flux ; s'il ne tient pas, il descend d'une ligne, et
              s'il ne tient toujours pas il se termine par des points de
              suspension (`flex-auto min-w-0 truncate` : il occupe la
              place restante sur SA ligne et s'y tronque, au lieu d'être
              rejeté sur une troisième ligne invisible).
              `max-h` + `overflow-hidden` garantissent les deux lignes,
              quoi qu'il arrive.

              LA PLACE DES BOUTONS EST RÉSERVÉE PAR LE CADRE LUI-MÊME :
              le fil s'arrête à 132 px du bord droit du bandeau, soit les
              24 px de marge des boutons, leurs 104 px de large et 4 px de
              respiration. Aucune ligne ne peut donc passer sous le cœur
              ni sous le partage — c'est garanti par la géométrie, pas par
              la longueur du texte. */}
          <nav
            aria-label="Fil d'Ariane"
            className="hidden min-[768px]:block absolute left-[140px] right-[132px] bottom-3 text-[13px] leading-snug text-encre-douce max-h-[36px] overflow-hidden"
          >
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap hover:text-primaire transition-colors"
              >
                Accueil
              </Link>
              <span aria-hidden className="shrink-0">/</span>
              {lienRecherche ? (
                <>
                  <Link
                    href={lienRecherche}
                    className="shrink-0 whitespace-nowrap hover:text-primaire transition-colors"
                  >
                    {metierLabelFil}
                  </Link>
                  <span aria-hidden className="shrink-0">/</span>
                  <Link
                    href={lienRecherche}
                    className="shrink-0 whitespace-nowrap hover:text-primaire transition-colors"
                  >
                    {villeArtisan}
                  </Link>
                  <span aria-hidden className="shrink-0">/</span>
                </>
              ) : (
                <>
                  <span className="shrink-0 whitespace-nowrap">{metierLabelFil}</span>
                  <span aria-hidden className="shrink-0">/</span>
                </>
              )}
              {/* `grow basis-0 min-w-[12rem]` : le nom ne se voit accorder
                  une ligne à lui QUE s'il ne reste pas au moins 192 px
                  utiles au bout des liens. Sinon il termine leur ligne et
                  s'y tronque. C'est ce plancher qui évite les deux
                  travers : un nom écrasé en 40 px au bout de la ligne 1
                  alors qu'une ligne entière l'attend en dessous, et un
                  nom rejeté sur une TROISIÈME ligne — donc invisible —
                  quand les liens en occupent déjà deux. */}
              <span className="grow basis-0 min-w-[12rem] truncate text-encre-douce/80">
                {pageActuelle}
              </span>
            </p>
          </nav>
        </div>

        {/* ----- Corps de la fiche ----- */}
        <div className="px-6 pb-6">
          {/* Nom : SOUS le bandeau, à droite de l'avatar (aligné sur le
              fil d'Ariane au-dessus) — gros, gras, noir. */}
          {/* TAILLE ADAPTATIVE : 26 px tant que le nom tient sur une
              ligne, 20 px sur deux lignes sinon (interligne 25 px : les
              deux lignes font 50 px et restent au-dessus du bas de la
              photo, qui déborde de 52 px). Au-delà de deux lignes, la
              troncature reprend la main. Le seuil de bascule est calculé
              avant le rendu à partir de la largeur réelle des lettres —
              voir `src/lib/largeur-nom.ts` — et appliqué par une
              `@container` : c'est la largeur de CETTE rangée qui décide,
              donc la bonne taille dans tous les formats (fiche seule,
              deux colonnes, tablette) sans le moindre saut visuel. */}
          <div
            className={`${cascadeNom.classe} ml-[116px] min-h-12 flex items-center [container-type:inline-size]`}
          >
            <style>{cascadeNom.css}</style>
            {/* SEO — TOUJOURS <h2> ici : les DEUX mises en page de la
                fiche (celle < 768 px et celle-ci) coexistent dans le code
                de la page, seule la largeur d'écran décide laquelle
                s'affiche. Le <h1> est porté par la mise en page < 768 px
                (l'indexation de Google est « mobile d'abord ») : la page
                ne contient donc jamais deux <h1>. Rendu visuel identique. */}
            <h2 className="nom-artisan font-bold text-encre line-clamp-2 break-words">
              {artisan.nom_affiche}
            </h2>
          </div>

          {/* Contenu, aéré. UN SEUL espacement (gap-6 = 24 px) pour TOUS
              les blocs empilés : c'est ce qui garantit, sans réglage au
              cas par cas, des marges STRICTEMENT ÉGALES entre le badge et
              la ligne d'infos, entre la ligne d'infos et les blocs
              Google/Instagram, et entre ces blocs et le premier trait de
              séparation des sections. La marge du HAUT (mt-10 = 40 px)
              est plus large : elle sépare le bas de la photo, qui
              chevauche le bandeau, du badge de niveau. */}
          <div className="flex flex-col gap-6 mt-10">
          {/* Badge de niveau */}
          {niveau && (
            <p
              className="flex items-center gap-2 font-bold text-[15px]"
              style={{ color: niveau.couleur }}
            >
              <IconeBadgeVerifie taille={20} teinte={niveau.couleur} />
              {niveau.label}
            </p>
          )}

          {/* Ligne d'infos sur 4 colonnes : icône au-dessus de chaque
              intitulé (alignée à gauche), tiret vertical de séparation
              entre colonnes, PLUS de trait horizontal au-dessus/dessous.
              Composition : Ancienneté · N° SIREN · Internet · Problème.
              Le métier et la zone couverte ne sont plus ici : ils ont
              chacun leur SECTION plus bas, avec plus de place.
              Les 4 colonnes sont TOUJOURS présentes (jamais 3, jamais 5) :
              une information absente s'écrit « — », comme Google ou
              Instagram manquants sur les cartes. */}
          <div className="grid grid-cols-4">
            {[
              {
                label: "Ancienneté",
                valeur: ancienneteCourte,
                icone: <IconeCalendrierCoche taille={23} />,
              },
              {
                label: "N° SIREN",
                valeur: artisan.siren,
                icone: <IconeBouclierTrait taille={23} />,
              },
              {
                label: "Internet",
                // Site renseigné → lien « Voir le site » (nouvel onglet).
                // Sans site : un simple tiret — beaucoup d'artisans n'en
                // ont pas, et leur fiche Roswel EST leur vitrine.
                valeur: artisan.site_internet ? (
                  <a
                    href={artisan.site_internet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASSE_LIEN_FLECHE}
                  >
                    <TexteLienFleche>Voir le site</TexteLienFleche>
                  </a>
                ) : null,
                icone: <IconeMonde taille={23} />,
              },
              {
                label: "Problème",
                // Le signalement remonte du pied de la fiche jusqu'ici :
                // visible sans dérouler toute la page, mais discret.
                valeur: (
                  <BoutonSignalement artisanId={artisan.id} variante="lien" />
                ),
                icone: <IconeDrapeau taille={23} />,
              },
            ].map((colonne, index) => {
              const c = colonne as {
                label: string;
                valeur: ReactNode;
                icone: ReactNode;
              };
              return (
                <div
                  key={c.label}
                  className={`min-w-0 ${
                    index > 0
                      ? "pl-4 border-l border-bordure-carte-claire"
                      : "pr-4"
                  }`}
                >
                  <span className="flex text-encre-douce" aria-hidden>
                    {c.icone}
                  </span>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-encre-douce/70">
                    {c.label}
                  </p>
                  <div className="mt-0.5 text-[14px] font-medium text-encre truncate">
                    {c.valeur ?? <span aria-label="non renseigné">—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modules Google / Instagram + boutons Appeler / WhatsApp.
              TAILLES : logo 20 px et titre 15 px — celles d'avant ; la
              version agrandie (26 / 19) écrasait le reste de la fiche.
              HIÉRARCHIE des 3 lignes, alignées à GAUCHE :
                1. le TITRE (15 px gras) : l'identité de la plateforme ;
                2. le CHIFFRE qui compte, note ou abonnés (17 px gras) :
                   la ligne DOMINANTE, celle qu'on vient lire ;
                3. le volume, avis ou publications (13 px gris) : le
                   contexte, volontairement discret.
              RÉPARTITION INTERNE (c'est elle qui crée la hiérarchie, à
              hauteur d'encadré CONSTANTE) : 16 px de marge en haut et en
              bas, puis deux espaces dont LA SOMME EST FIXE (20 px) :
                • DÈS 768 px (le web) : 12 px sous le titre, 8 px entre
                  les lignes 2 et 3. Par rapport aux 16 + 4 d'avant, la
                  ligne 2 remonte de 4 px et se décolle d'autant de son
                  volume ; la ligne 3 (« 134 avis », « 310 publications »)
                  ne bouge pas d'un pixel et l'encadré garde sa taille.
                • SOUS 768 px : 16 + 4, comme avant — cette plage relève
                  du périmètre smartphone, elle ne suit donc PAS le
                  réglage web. (Sous 560 px, c'est un tout autre bloc qui
                  s'affiche, celui de la charte téléphone.)
              GABARIT : hauteur naturelle ≈ 100 px, soit MOINS que les
              deux boutons Appeler / WhatsApp empilés (48 + 12 + 48 =
              108). Ce sont donc EUX qui commandent la hauteur de la
              rangée : ils gardent leurs 48 px exacts, et les deux
              encadrés s'alignent dessus — mêmes hauteurs, mêmes bords,
              même contour (border-bordure-carte des deux côtés). */}
          {/* LARGEUR PLANCHER DES DEUX ENCADRÉS (min-w-[330px]) — sans
              elle, à 560 px la ligne « ★★★★★ 4,9 » de l'encadré Google
              (qui ne peut ni se replier ni se comprimer) débordait de
              13 px hors de son cadre. Chaque encadré exige 165 px, soit
              123 px de contenu pour 119 px de texte : la marge est
              tenue. Ce sont donc les BOUTONS Appeler / WhatsApp qui
              cèdent la place (ils perdent `shrink-0`), et seulement
              quand il le faut : à 560 px ils passent de 176 à 138 px,
              largement de quoi loger « Whatsapp » et son icône ; dès
              620 px ils retrouvent leurs 176 px et plus rien ne bouge.
              LE RÉGLAGE EST BORNÉ À < 768 px (`max-[768px]:` d'un côté,
              `min-[768px]:shrink-0` de l'autre) : au-delà, la rangée
              retrouve EXACTEMENT les règles d'avant — tablette et web
              ne bougent pas d'un pixel, y compris en mode double où la
              colonne fiche est étroite. */}
          <div className="flex gap-3 items-stretch">
            <div className="grid grid-cols-2 gap-3 flex-1 min-w-0 max-[768px]:min-w-[330px]">
              <a
                href={lienAvisGoogle(artisan)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl bg-white border border-bordure-carte hover:border-primaire py-4 px-4 text-left flex flex-col items-start justify-center transition-colors"
              >
                <IconeLienExterne
                  taille={19}
                  classe="absolute top-2.5 right-2.5 text-encre-douce group-hover:text-primaire transition-colors"
                />
                {/* Ligne 1 : logo + nom */}
                <p className="flex items-center gap-1.5 font-bold text-[15px] leading-none">
                  <IconeGoogle taille={20} /> Google
                </p>
                {aDesAvis ? (
                  <>
                    {/* Ligne 2 : étoiles + note */}
                    <p className="mt-4 min-[768px]:mt-3 flex items-center gap-2 text-[15px]">
                      <Etoiles note={Number(artisan.note_google)} />
                      <strong className="text-[15px] leading-none">
                        {formatNote.format(Number(artisan.note_google))}
                      </strong>
                    </p>
                    {/* Ligne 3 : nombre d'avis */}
                    <p className="mt-1 min-[768px]:mt-2 text-[13px] text-encre-douce">
                      {formatCompact.format(artisan.nombre_avis_google ?? 0)} avis
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-4 min-[768px]:mt-3 flex items-center gap-2 text-[15px]">
                      <Etoiles note={null} />
                    </p>
                    <p className="mt-1 min-[768px]:mt-2 text-[13px] text-encre-douce">
                      Avis à venir
                    </p>
                  </>
                )}
              </a>

              <a
                href={artisan.lien_instagram ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl bg-white border border-bordure-carte hover:border-primaire py-4 px-4 text-left flex flex-col items-start justify-center transition-colors"
              >
                <IconeLienExterne
                  taille={19}
                  classe="absolute top-2.5 right-2.5 text-encre-douce group-hover:text-primaire transition-colors"
                />
                {/* Ligne 1 : logo + nom */}
                <p className="flex items-center gap-1.5 font-bold text-[15px] leading-none">
                  <IconeInstagram
                    taille={20}
                    grise={artisan.abonnes_instagram == null}
                  />{" "}
                  Instagram
                </p>
                {/* Ligne 2 : abonnés — la ligne dominante. `nowrap` :
                    « 12,4 k abonnés » passait sur DEUX lignes et faisait
                    grandir l'encadré de 17 px, qui débordait alors la
                    hauteur des boutons Appeler / WhatsApp voisins. */}
                {artisan.abonnes_instagram != null ? (
                  <p className="mt-4 min-[768px]:mt-3 text-[15px] font-bold leading-none whitespace-nowrap">
                    {formatCompact.format(artisan.abonnes_instagram)} abonnés
                  </p>
                ) : (
                  <p className="mt-4 min-[768px]:mt-3 text-[15px] text-encre-douce leading-none whitespace-nowrap">
                    Abonnés à venir
                  </p>
                )}
                {/* Ligne 3 : publications */}
                <p className="mt-1 min-[768px]:mt-2 text-[13px] text-encre-douce">
                  {artisan.publications_instagram != null
                    ? `${formatCompact.format(artisan.publications_instagram)} publications`
                    : "publications à venir"}
                </p>
              </a>
            </div>

            {(telephoneAffiche || artisan.whatsapp) && (
              // grid-rows-2 : un SEUL moyen de contact garde la hauteur
              // qu'il aurait s'il y avait les deux boutons (il occupe la
              // 1re rangée, la 2de reste vide) — jamais étiré comme Google.
              <div className="grid grid-rows-2 gap-3 w-44 min-[768px]:shrink-0">
                {telephoneAffiche && (
                  <a
                    href={lienTelephone(artisan.telephone!)}
                    aria-label={`Appeler ${artisan.nom_affiche}`}
                    className="min-h-[48px] rounded-2xl border border-bordure-carte text-encre-douce text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-fond-doux transition-colors"
                  >
                    <span style={{ color: COULEURS.contactTelephone }}>
                      <IconeTelephone taille={20} />
                    </span>{" "}
                    Appeler
                  </a>
                )}
                {artisan.whatsapp && (
                  <a
                    href={lienWhatsApp(
                      artisan.whatsapp,
                      `Bonjour ${artisan.nom_affiche}, je vous ai trouvé sur Roswel.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Écrire à ${artisan.nom_affiche} sur WhatsApp`}
                    className="min-h-[48px] rounded-2xl border border-bordure-carte text-encre-douce text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-fond-doux transition-colors"
                  >
                    <span style={{ color: COULEURS.contactWhatsApp }}>
                      <IconeWhatsApp taille={20} />
                    </span>{" "}
                    Whatsapp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sections Métier · Services / Joignabilité / Couvre : PLUS
              d'encadrés — de simples LIGNES DE SÉPARATION horizontales,
              aérées, avec une icône devant chaque intitulé.
              ORDRE : d'abord CE QUE FAIT l'artisan (son métier), puis
              QUAND il répond, puis OÙ il se déplace.
              ALIGNEMENT du contenu déroulé : `pl-[30px]` = la largeur de
              l'icône (20) + son écart (10). Le contenu se cale donc sur
              le TEXTE de l'intitulé, jamais sur l'icône. */}
          <div className="flex flex-col border-t border-bordure-carte">
            {/* ----- 1. Métier · Services ----- */}
            {(() => {
              // Les métiers UN PAR UN (« Plombier », « Chauffagiste ») :
              // chacun devient une pastille, là où les cartes affichent
              // l'entrée du menu d'un seul tenant.
              const pastilles = libellesMetiersSepares(artisan.metiers);
              const intitule = (
                <span className="text-[16px] flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 flex text-encre-douce" aria-hidden>
                    <IconeCle taille={20} />
                  </span>
                  {/* « Métier » en gras (le sujet), « · Services » en gris
                      et sans gras (le complément) — même gris que le
                      « · jusqu'à 12h00 » du statut juste en dessous. */}
                  <span className="whitespace-nowrap shrink-0">
                    <strong>Métier</strong>{" "}
                    <span className="text-encre-douce">· Services</span>
                  </span>
                  {pastilles.length > 0 && (
                    <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      {pastilles.map((pastille) => (
                        <span
                          key={pastille}
                          className="shrink-0 rounded-lg border border-bordure-carte px-2.5 py-1 text-[13px] font-medium text-encre whitespace-nowrap"
                        >
                          {pastille}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              );

              // Sans texte de présentation, rien à déplier : la ligne
              // reste une ligne (ni chevron, ni accordéon vide).
              return artisan.bio ? (
                <details className="group border-b border-bordure-carte">
                  <summary className="cursor-pointer list-none py-6 flex items-center justify-between gap-2">
                    {intitule}
                    <IconeChevronBas classe="shrink-0 text-encre-douce transition-transform group-open:rotate-180" />
                  </summary>
                  {/* `whitespace-pre-line` : conserve les retours à la
                      ligne de l'artisan (paragraphe puis liste à tirets),
                      que le HTML écraserait par défaut.
                      `pr-[42px]` : le texte s'arrête au bord GAUCHE du
                      chevron, moins la marge qui sépare son bord DROIT du
                      contour de la fiche — 18 px de chevron + 24 px de
                      marge. L'écart est donc le même de part et d'autre
                      du chevron, et le texte ne passe jamais dessous. */}
                  <p className="pb-5 pl-[30px] pr-[42px] text-sm leading-relaxed text-encre whitespace-pre-line">
                    {artisan.bio}
                  </p>
                </details>
              ) : (
                <div className="border-b border-bordure-carte py-6 flex items-center">
                  {intitule}
                </div>
              );
            })()}

            {/* ----- 2. Joignabilité + calendrier des 7 prochains jours ----- */}
            {(dispo || artisan.horaires) && (
              <details className="group border-b border-bordure-carte">
                <summary className="cursor-pointer list-none py-6 flex items-center justify-between gap-2">
                  <span className="text-[16px] flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 flex text-encre-douce" aria-hidden>
                      <IconeHorloge taille={20} />
                    </span>
                    {dispo ? (
                      // L'ÉTAT en gras (« Joignable » / « Indisponible »),
                      // la précision (« · jusqu'à 12h00 ») en gris, sans gras
                      <StatutJoignabilite
                        etat={dispo.etat}
                        precision={dispo.precision}
                        precisionAbrege={dispo.precisionAbrege}
                        couleur={dispo.couleur}
                        classe="text-[16px]"
                        etatGras
                      />
                    ) : (
                      <span className="truncate font-bold">Horaires</span>
                    )}
                  </span>
                  <IconeChevronBas classe="shrink-0 text-encre-douce transition-transform group-open:rotate-180" />
                </summary>
                {/* CALENDRIER GLISSANT — toujours 7 lignes, la première
                    étant le jour COURANT, puis les six suivants (aucune
                    saisie, aucun entretien : il avance tout seul).
                    3 colonnes : jour de la semaine · date · horaires.
                    LA GRILLE EST PORTÉE PAR LA LISTE, pas par chaque
                    ligne : les 7 lignes partagent donc les MÊMES colonnes
                    et s'alignent parfaitement à la verticale (une grille
                    par ligne donnait des colonnes larges comme leur seul
                    contenu — « Samedi » et « Mercredi » ne tombaient pas
                    au même endroit). Chaque <li> est en `contents` : il
                    disparaît de la mise en page mais transmet sa couleur
                    et sa graisse à ses trois cellules.
                    AUCUN trait horizontal entre les jours : le rythme des
                    lignes suffit, les traits hachaient la lecture. */}
                <ul className="pb-5 pl-[30px] text-sm grid grid-cols-[auto_auto_1fr] gap-x-12">
                  {septProchainsJours().map((jour) => (
                    <li
                      key={jour.libelleDate}
                      className={`contents ${
                        jour.aujourdHui
                          ? "font-bold text-encre"
                          : "text-encre-douce"
                      }`}
                    >
                      <span className="py-1">{jour.libelleJour}</span>
                      <span className="py-1">{jour.libelleDate}</span>
                      {/* UNE LIGNE PAR CRÉNEAU ; jour non travaillé :
                          « Indisponible » (jamais « Fermé ») */}
                      <span className="py-1 flex flex-col">
                        {lignesJourCalendrier(artisan.horaires?.[jour.jour]).map(
                          (ligne) => (
                            <span key={ligne}>{ligne}</span>
                          )
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* ----- 3. Couvre ----- */}
            <details className="group border-b border-bordure-carte">
              <summary className="cursor-pointer list-none py-6 flex items-center justify-between gap-2">
                <span className="text-[16px] flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 flex text-encre-douce" aria-hidden>
                    <IconeEpingle taille={20} />
                  </span>
                  <span className="truncate">
                    <strong>
                      Couvre <VilleCouverte villeArtisan={villeArtisan} />
                    </strong>{" "}
                    {/* Le complément passe au GRIS de la charte — le même
                        que « · Services » ou « · retour lundi » : seul le
                        nom de la ville reste en noir et en gras. */}
                    <span className="text-encre-douce">
                      + les zones à proximité
                    </span>
                  </span>
                </span>
                <IconeChevronBas classe="shrink-0 text-encre-douce transition-transform group-open:rotate-180" />
              </summary>
              <div className="pb-5 pl-[30px] text-sm text-encre-douce">
                {communesCouvertes && communesCouvertes.noms.length > 0 ? (
                  <>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {communesCouvertes.noms.map((nom) => (
                        <li key={nom} className="flex items-center gap-2 min-w-0">
                          <IconeCocheListe taille={16} classe="shrink-0" />
                          <span className="truncate">{nom}</span>
                        </li>
                      ))}
                    </ul>
                    {communesCouvertes.autres > 0 && (
                      <p className="mt-2.5 font-medium">
                        + {communesCouvertes.autres} autres communes
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    Intervient dans un rayon de {artisan.rayon_intervention_km} km
                    autour de {villeArtisan || "sa commune"}.
                  </p>
                )}
              </div>
            </details>

            {/* ----- 4. Adresse — CONDITIONNELLE (seulement si l'artisan
                    en a renseigné une). MÊME présentation que les trois
                    lignes ci-dessus : épingle grise de 20 px, intitulé en
                    NOIR et en GRAS, mêmes marges hautes et basses (py-6).
                    Une DIFFÉRENCE, voulue : ce n'est PAS un accordéon —
                    ni <details>, ni chevron, rien à déplier. L'adresse et
                    la carte sont toujours visibles. Aucun encadrement non
                    plus : ni sur le bloc, ni autour de la carte. ----- */}
            {adresseComplete && (
              <section>
                <div className="py-6">
                  <p className="text-[16px] flex items-center gap-2.5">
                    <span className="shrink-0 flex text-encre-douce" aria-hidden>
                      <IconeEpingle taille={20} />
                    </span>
                    <strong>Adresse</strong>
                  </p>
                  {/* L'ADRESSE EST UN LIEN : elle ouvre Google Maps dans
                      un nouvel onglet (l'application Maps sur mobile). Les
                      DEUX lignes forment un seul et même lien ; le mot
                      « Adresse » au-dessus, lui, n'est pas cliquable.
                      GRIS de la charte — celui de « + les zones à
                      proximité ». Style de lien commun à la fiche :
                      souligné au survol seulement, flèche rose à la fin
                      de la DERNIÈRE ligne. Aligné sur le TEXTE
                      (pl-[30px]), comme les autres sections. */}
                  <a
                    href={lienGoogleMaps ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ouvrir ${adresseComplete} dans Google Maps`}
                    className={`mt-1 flex flex-col items-start pl-[30px] text-[16px] text-encre-douce ${CLASSE_LIEN_FLECHE}`}
                  >
                    {adresseVille ? (
                      <>
                        <span className="group-hover/lien:underline underline-offset-2">
                          {adresseRue}
                        </span>
                        <TexteLienFleche>{adresseVille}</TexteLienFleche>
                      </>
                    ) : (
                      <TexteLienFleche>{adresseRue}</TexteLienFleche>
                    )}
                  </a>
                </div>
                {aCoordonnees && (
                  // La carte : ratio 4:3, SANS aucun contour — un bloc
                  // posé librement sous l'adresse.
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    {/* L'iframe DÉBORDE de 32 px EN HAUT ET EN BAS (d'où
                        `-top-8` et `+64px` de hauteur) : son centre reste
                        donc EXACTEMENT celui de la fenêtre — le marqueur
                        ne bouge pas d'un pixel — tandis que le bandeau
                        d'OpenStreetMap (« Signaler un problème », « Faire
                        un don », « Conditions d'utilisation »…), collé au
                        bas du document embarqué, passe sous le bord et
                        n'est plus visible. L'attribution OBLIGATOIRE
                        (licence ODbL) est reprise ci-dessous, en petit et
                        en gris. */}
                    <iframe
                      title={`Carte — ${adresseComplete}`}
                      className="absolute inset-x-0 -top-8 w-full h-[calc(100%+64px)]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        artisan.longitude! - 0.012
                      }%2C${artisan.latitude! - 0.006}%2C${
                        artisan.longitude! + 0.012
                      }%2C${artisan.latitude! + 0.006}&layer=mapnik&marker=${
                        artisan.latitude
                      }%2C${artisan.longitude}`}
                    />
                    {/* Attribution ODbL — obligatoire, donc jamais
                        retirée, mais réduite au strict nécessaire : une
                        seule ligne, 10 px, gris, sur un fond à peine
                        voilé. */}
                    <p className="absolute bottom-0 right-0 bg-white/70 px-1.5 py-0.5 text-[10px] leading-none text-encre-douce">
                      ©{" "}
                      <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-primaire transition-colors"
                      >
                        OpenStreetMap
                      </a>
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          </div>
        </div>

        {/* Pied de page (signature Roswel), au fond de la colonne
            (mt-auto : la fiche courte ne laisse pas de grand vide).
            Le lien « Signaler » n'est plus ici : il a rejoint la colonne
            « Problème » de la ligne d'infos, en haut de la fiche.
            IL VIT DANS L'ENCADRÉ à TOUTES les largeurs ≥ 560 px —
            fiche seule sur une colonne comme mode deux colonnes :
            `mt-auto` le colle au BAS du bloc, au-dessus de la marge. */}
        <div className="mt-auto">
          <PiedDePage classe="pt-8 pb-4" />
        </div>
      </div>
    </>
  );
}
