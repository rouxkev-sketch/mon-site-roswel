"use client";

import { useState } from "react";
import Link from "next/link";
import { defilerEnDouceur } from "@/lib/defilement-programme";
//  ⚠️ TEMPORAIRE (nº 218-§1) — la sonde du carrousel : elle veut
//  savoir CE QUI A ÉTÉ DEMANDÉ (style, catégorie, rendu) juste avant
//  ce que le carrousel reçoit. Sans `?sonde-carrousel=1`, ne coûte rien.
import { noter as noterSonde } from "@/lib/journal-carrousel";
import {
  ICONE_SITE,
  ICONES_RESEAUX,
  libelleFiltre,
  libelleStyle,
  PORTRAIT_ROND,
} from "@/config/tatouage";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import {
  PanneauPortfolio,
  SelecteurOngletAffiche,
  type OngletAffiche,
  type SerieChoisie,
} from "@/components/PortfolioDeLAffiche";
import {
  NATURE_PAR_DEFAUT,
  RENDU_PAR_DEFAUT,
  rendusDuPortfolio,
} from "@/lib/photos-tatoueur";
import type { StyleGalerie } from "@/lib/photo-tatoueur";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { libelleDuLien } from "@/lib/liens-fiche";
import { sousLeNom } from "@/components/BlocsFiche";
import {
  BlocAdressesFiche,
  BlocProfilsArtiste,
} from "@/components/BlocLieux";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * LE CONTENU D'UNE FICHE — UN SEUL EXEMPLAIRE, POUR LES DEUX ENVELOPPES
 * ==================================================================
 * (passe nº 199)
 *
 * LE DÉFAUT QU'IL SUPPRIME. Le contenu d'une fiche existait EN DOUBLE :
 * une fois dans la page (FicheTatoueur), une fois dans la fenêtre
 * superposée du web (FenetreFiche). Les deux se sont éloignés à chaque
 * passe — le sélecteur « Profil / Portfolio » de la nº 197 n'était
 * arrivé que dans la page, et le propriétaire l'a vu tout de suite :
 * ouvrir une fiche depuis la mosaïque ne montrait pas la même chose que
 * coller son adresse dans la barre du navigateur.
 *
 * DÉSORMAIS IL N'Y EN A QU'UN. Ce composant porte TOUT ce qui est du
 * CONTENU : les deux onglets, le sélecteur de catégorie, les vignettes
 * par style, « Aucune publication », et l'intégralité de l'onglet
 * « Profil » — identité, suivre, adresse, site, horaires, bio, réseaux,
 * équipe, les trois sections de badges, le signalement.
 *
 * CE QUI RESTE À CHAQUE ENVELOPPE, et rien d'autre : la façon de
 * s'ouvrir et de se fermer, et les boutons posés SUR la photo, dont la
 * position diffère (la page les place à gauche et à droite depuis la
 * nº 198, la fenêtre les garde groupés en haut à droite).
 */

export function ContenuFiche({
  tatoueur,
  groupes,
  studioCourant,
  demonstration = false,
  apercu = false,
  natureCherchee = "",
  renduCherche = "",
  surSerieChoisie,
  suiviAuDepart = false,
}: {
  tatoueur: Tatoueur;
  /** LE PORTFOLIO GROUPÉ PAR STYLE — l'enveloppe le calcule (elle en a
      besoin pour sa photo), le contenu s'en sert pour ses vignettes. */
  groupes: StyleGalerie[];
  /** LE STUDIO REGARDÉ (« ?studio=<id> »), quand l'enveloppe en connaît
      un — la page le lit dans l'adresse, la fenêtre superposée n'en a
      pas. `null` est donc une valeur ordinaire, pas un oubli. */
  studioCourant?: string | null;
  demonstration?: boolean;
  /** Vrai dans l'espace tatoueur (« Ma fiche ») : ni suivi, ni
      signalement, ni mise hors ligne. */
  apercu?: boolean;
  /** LA CATÉGORIE ET LE RENDU CHERCHÉS (nº 217-§3) — l'onglet
      « Portfolio » s'ouvre alors sur EUX, et non sur « Réalisations ·
      Noir et gris » par défaut. Arriver d'une recherche de flashs et
      trouver le panneau posé sur les réalisations, c'était le même
      mélange de catégories que dans le carrousel, un cran plus loin. */
  natureCherchee?: string;
  renduCherche?: string;
  /** Un toucher sur une vignette : l'enveloppe montre CETTE série —
      style + catégorie + rendu (nº 204-§3) — et remonte en haut
      (nº 197-§4). */
  surSerieChoisie: (serie: SerieChoisie) => void;
  /** SUIT-ON DÉJÀ CE TATOUEUR ? — lu par le SERVEUR (nº 208-§1) : le
      bouton naît dans le bon état, il ne se corrige plus à l'écran. */
  suiviAuDepart?: boolean;
}) {
  /**
   * LES DEUX ONGLETS DE L'AFFICHE (nº 197-§1)
   * « Profil » montre le contenu de la fiche ; « Portfolio » montre les
   * styles publiés, catégorie par catégorie.
   */
  const [onglet, setOnglet] = useState<OngletAffiche>("profil");
  /** La catégorie regardée dans l'onglet « Portfolio » (nº 197-§2) —
      celle qu'on cherchait s'il y en avait une (nº 217-§3). */
  const [categorie, setCategorie] = useState<string>(
    natureCherchee || NATURE_PAR_DEFAUT
  );
  /** LE RENDU regardé (nº 204-§3) — le panneau le ramène de lui-même
      au seul rendu présent quand il n'y en a qu'un. */
  const [rendu, setRendu] = useState<string>(
    renduCherche || RENDU_PAR_DEFAUT
  );

  /**
   * §7 (nº 208) — AU DOIGT, CHANGER D'ONGLET REMONTE LA PAGE
   * ==================================================================
   * La limite entre la photo et le contenu vient se poser PILE SOUS LA
   * BARRE FIXE : ni dessous (le sélecteur qu'on vient de toucher
   * disparaîtrait derrière elle), ni avec un vide au-dessus.
   * On mesure les deux — le repère du contenu, et la hauteur réelle de
   * la barre (`[data-barre-fixe]`, qui vaut 64 px sur une fiche mais
   * n'est pas écrite ici : elle se lit).
   * ⚠️ SEULEMENT SUR LES VRAIS MOBILES : sur le web, la colonne défile
   * toute seule et la rangée y est déjà posée (§4) ; dans la fenêtre
   * superposée, le corps est gelé et un défilement de page ne veut
   * rien dire.
   * ⚠️ `defilerSansGeste` : ce mouvement n'est pas un geste du doigt —
   * sans cela, la barre y lirait une intention et se replierait
   * (nº 154-§6A).
   */
  /**
   * LA REMONTÉE, ÉCRITE UNE FOIS (nº 218-§2)
   * ------------------------------------------------------------------
   * Elle servait au seul sélecteur Profil / Portfolio ; « Réalisation »
   * et « Flash » changent tout autant ce qu'on regarde, et devaient
   * remonter au MÊME endroit, au pixel. Une seule fonction, deux
   * appelants : impossible qu'ils s'arrêtent à deux hauteurs.
   */
  function remonterSousLaBarre() {
    if (document.documentElement.dataset.appareil !== "mobile") return;
    noterSonde("REMONTÉE demandée (mobile)");
    //  ⚠️ LA LIMITE, C'EST LE BAS DE LA PHOTO (nº 209-§5a) — et non le
    //  haut du contenu, qui vient plus bas (l'écart entre les deux
    //  colonnes) : la page s'arrêtait donc trop haut, au-dessus du
    //  bloc Profil / Portfolio. L'enveloppe marque sa photo
    //  (`data-photo-fiche`), le contenu partagé la lit — il n'a ainsi
    //  aucune géométrie d'enveloppe écrite chez lui.
    const photo = document
      .querySelector("[data-photo-fiche]")
      ?.getBoundingClientRect();
    if (!photo) return;
    const barre = document
      .querySelector("[data-barre-fixe]")
      ?.getBoundingClientRect().height;
    //  Départ progressif, arrivée amortie, aucun rebond (§5b).
    defilerEnDouceur(
      Math.max(0, window.scrollY + photo.bottom - (barre ?? 0))
    );
  }

  /** Changer d'onglet : le contenu change, la page remonte. */
  function choisirOnglet(suivant: OngletAffiche) {
    noterSonde(`SÉLECTEUR onglet → « ${suivant} »`);
    setOnglet(suivant);
    remonterSousLaBarre();
  }

  /** Changer de catégorie (nº 218-§2) : les vignettes changent
      entièrement, la page remonte au MÊME endroit que ci-dessus. */
  function choisirCategorie(suivante: string) {
    noterSonde(`SÉLECTEUR catégorie → « ${suivante} » (rendu « ${rendu} »)`);
    setCategorie(suivante);
    remonterSousLaBarre();
  }

  const avatarProfil = (
    <span
      /*  ⚠️ AUCUN CONTOUR (nº 222-§1a) : la charte de la fiche ne
           cercle rien. La photo se détache par son fond, pas par un
           liseré. */
      className="flex h-[92px] w-[92px] shrink-0 items-center justify-center
                 overflow-hidden rounded-full bg-sombre-eleve"
    >
      {tatoueur.photo_profil ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={tatoueur.photo_profil}
          alt={`Photo de ${tatoueur.nom}`}
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-[32px] font-bold text-sombre-texte-doux">
          {tatoueur.nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );

  const noteDemonstration = (classes: string) => (
    <p
      className={`${classes} rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte`}
    >
      Fiche de DÉMONSTRATION : ce tatoueur n&apos;existe pas, et
      l&apos;image est un aplat de couleur — aucune photo de tatouage
      n&apos;est publiée sans l&apos;accord de son auteur.
    </p>
  );

  /**
   * §2 (nº 222) — LES LIENS, SOUS LA PHOTO
   * ==================================================================
   * UNE SEULE FAMILLE, UNE SEULE FORME : les liens libres que
   * l'artiste a créés (son site, sa page de liens), puis Instagram et
   * TikTok. Chacun porte SON ICÔNE À GAUCHE, toutes de la même taille,
   * et le bloc commence par une colonne d'icônes — quel que soit le
   * nombre de rangées.
   *
   * ⚠️ LES DEUX BADGES-PHARES ONT DISPARU. Instagram et TikTok
   * vivaient dans deux capsules de 68 px, cerclées de rose, avec un
   * halo : trois choses que la charte de cette passe interdit
   * désormais (aucun contour, le rose réservé au badge sélectionné, au
   * bouton d'action finale et à la ligne du sélecteur actif). Ce sont
   * des liens, ils se lisent comme les autres.
   *
   * ILS SE REGROUPENT : un seul lien libre et Instagram tiennent sur
   * une ligne — `flex-wrap` ne laisse aucune ligne à moitié vide.
   */
  const lienEnLigne = (
    cle: string,
    href: string,
    libelle: string,
    icone: React.ReactNode
  ) => (
    <a
      key={cle}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 text-[15px] leading-snug
                 text-sombre-texte-doux transition-colors hover:text-primaire"
    >
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {icone}
      </span>
      <span className="min-w-0 truncate">{libelle}</span>
    </a>
  );

  /**
   * §2 (nº 224) — LES TROIS FICHIERS D'ICÔNES, ET EUX SEULS.
   * ==================================================================
   * `icone-instagram.png`, `icone-tiktok.png`, `site.png` — déposés à
   * la main par le propriétaire, servis tels quels. Le lien libre
   * portait `IconeWorld`, un tracé SVG dessiné par le site : ce
   * n'était pas le bon fichier.
   *
   * ⚠️ LES DEUX FAMILLES NE SE TRAITENT PAS PAREIL, parce que les
   * fichiers ne sont pas de même nature :
   *  · les icônes de RÉSEAU sont des logos en couleur → servis tels
   *    quels, aucune retouche ;
   *  · `site.png` est un GLYPHE NOIR sur fond transparent, comme les
   *    autres images de ce dossier → `invert` l'éclaircit et
   *    l'opacité le cale sur le gris du texte (jamais en touchant au
   *    fichier — la règle permanente du projet).
   * Colonne de 18 px inchangée (nº 223).
   */
  const iconeFichier = (fichier: string, glyphe: boolean) => (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône déposée par le propriétaire, affichée telle quelle (le
       filtre CSS ne modifie pas le fichier). */
    <img
      src={fichier}
      alt=""
      width={18}
      height={18}
      className={`h-[18px] w-[18px] ${glyphe ? "invert opacity-60" : ""}`}
    />
  );

  /** LES LIENS, DANS L'ORDRE : les libres d'abord, les réseaux
      ensuite. Un lien absent n'occupe aucune place. */
  const liens = [
    tatoueur.site_web &&
      lienEnLigne(
        "site",
        tatoueur.site_web,
        tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web),
        iconeFichier(ICONE_SITE, true)
      ),
    tatoueur.page_de_liens &&
      lienEnLigne(
        "liens",
        tatoueur.page_de_liens,
        tatoueur.titre_page_de_liens || libelleDuLien(tatoueur.page_de_liens),
        iconeFichier(ICONE_SITE, true)
      ),
    tatoueur.lien_instagram &&
      lienEnLigne(
        "instagram",
        tatoueur.lien_instagram,
        "Instagram",
        iconeFichier(ICONES_RESEAUX.instagram, false)
      ),
    tatoueur.lien_tiktok &&
      lienEnLigne("tiktok", tatoueur.lien_tiktok, "TikTok", iconeFichier(ICONES_RESEAUX.tiktok, false)),
  ].filter(Boolean);

  /** LES TROIS SECTIONS DE BADGES — Styles, Technique, Composition.
      UN SEUL format ET UNE SEULE couleur de badge partout : les styles
      ne portent plus de nuance rose, seul leur survol dit qu'ils se
      cliquent. Un groupe vide n'affiche pas son titre. */
  const groupesBadges: Array<{
    titre: string;
    slugs: string[];
    versPages?: boolean;
  }> = [
    { titre: "Styles", slugs: tatoueur.styles, versPages: true },
    //  ⚠️ LES TITRES SONT CEUX DU PROPRIÉTAIRE (nº 222-§6) :
    //  « Techniques maîtrisées », « Types de projets », « Besoins
    //  particuliers ». « Technique » et « Besoins » disaient la
    //  catégorie du formulaire, pas ce que le visiteur lit.
    { titre: "Techniques maîtrisées", slugs: tatoueur.filtres_technique ?? [] },
    { titre: "Types de projets", slugs: tatoueur.filtres_composition ?? [] },
    // LES BESOINS — au même format que les deux autres : ce ne
    // sont pas des goûts, mais ils se lisent au même endroit.
    { titre: "Besoins particuliers", slugs: tatoueur.filtres_besoins ?? [] },
    // LE RENDU — le seul groupe que PERSONNE n'a coché : il se DÉDUIT
    // des tags des photos déposées (voir rendusDuPortfolio), tout
    // comme le filtre du moteur le lit. Un portfolio entièrement en
    // noir et gris n'affiche donc qu'une pastille, et une fiche dont
    // aucune photo n'est taguée (avant la migration nº 31) n'affiche
    // pas la section du tout.
    { titre: "Rendu", slugs: rendusDuPortfolio(tatoueur.galerie) },
  ];

  /** LA LIGNE DE SÉPARATION DES BLOCS — un gris TRÈS sombre, discret
      mais lisible sur l'anthracite (réservée à cette page).
      ELLE VA D'UN BORD À L'AUTRE DU BLOC. Sur smartphone, la page
      porte 16 px de marge latérale : la ligne s'arrêtait donc à 16 px
      des deux bords pendant que la photo, elle, touchait l'écran —
      un trait suspendu au milieu de rien. Elle ressort maintenant de
      ces marges (`-mx-4`) et les rend à son contenu (`px-4`) : le
      trait traverse, le texte ne bouge pas d'un pixel. */
  /** DEUX ADRESSES OU PLUS ? Le sélecteur « Adresse / Autre adresse »
      s'affiche alors, et il REMPLACE la ligne de séparation — deux
      traits l'un sur l'autre feraient un cadre. La règle est écrite
      ici parce que c'est l'enveloppe qui sépare ses sections. */
  const aPlusieursAdresses =
    tatoueur.type_fiche !== "artiste" && (tatoueur.studios ?? []).length > 1;

  /** LE PREMIER GROUPE DE BADGES REMPLI — le seul à porter une ligne
      de séparation (nº 222-§6) : les suivants ne se distinguent plus
      que par l'espacement et la typographie. */
  const premierGroupeRempli = groupesBadges.findIndex(
    (groupe) => groupe.slugs.length > 0
  );

  const separation =
    "border-t border-sombre-bordure/60 mobile:-mx-4 mobile:px-4";

  return (
    <>
      {demonstration && noteDemonstration("mb-6")}

      {/*  LA RANGÉE DU HAUT (nº 205) — les deux onglets à gauche
           (les mots nus et la capsule de verre qui glisse, §1), et
           « SUIVRE » à droite (§2) : même ligne, même hauteur, quel
           que soit l'onglet actif. C'est le SEUL bouton Suivre de la
           fiche. Absent de l'aperçu : on ne se suit pas soi-même.
           À 390 px, tout tient sur une seule ligne : les mots à
           gauche, la capsule naturelle de Suivre à droite. */}
      {/*  ⚠️ ELLE NE DÉFILE PAS (nº 207-§4, web) : la colonne de
           lecture défile sous elle. Le fond vient de l'enveloppe
           (`bg-inherit`) — anthracite sur la page, carte dans la
           fenêtre superposée : le contenu partagé n'écrit aucune
           couleur qui lui serait propre. */}
      {/*  ⚠️ LE FOND VIENT D'UNE VARIABLE (nº 209-§6), pas de
           `bg-inherit` : celui-ci ne prend que le fond du PARENT
           DIRECT, et les blocs collants n'ont pas tous la colonne pour
           parent — on voyait donc le contenu défiler en transparence
           derrière eux. `--fond-colonne` est posée par l'enveloppe
           (anthracite sur la page, carte dans la fenêtre) et traverse
           tout l'arbre : les bandeaux sont opaques, partout. */}
      <div
        className="relative flex items-center justify-between gap-3
                   lg:sticky lg:top-0 lg:z-[2] bg-[var(--fond-colonne)]"
      >
        {/*  LE CAPOT — la colonne de la fenêtre superposée porte un
             rembourrage haut (24 px) : sans lui, le contenu défilerait
             VISIBLEMENT dans cette bande, au-dessus de la rangée. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full hidden h-8 bg-[var(--fond-colonne)] lg:block"
        />
        <SelecteurOngletAffiche valeur={onglet} surChoix={choisirOnglet} />
        {!apercu && (
          <BoutonSuivre
            tatoueurId={tatoueur.id}
            nomTatoueur={tatoueur.nom}
            suiviAuDepart={suiviAuDepart}
          />
        )}
      </div>

      {onglet === "portfolio" && (
        <PanneauPortfolio
          groupes={groupes}
          nature={categorie}
          surNature={choisirCategorie}
          rendu={rendu}
          surRendu={(suivant) => {
            noterSonde(
              `SÉLECTEUR rendu → « ${suivant} » (catégorie « ${categorie} »)`
            );
            setRendu(suivant);
          }}
          nomTatoueur={tatoueur.nom}
          surSerie={(serie) => {
            noterSonde(
              `VIGNETTE demandée · style « ${serie.style} » · catégorie ` +
                `« ${serie.nature} » · rendu « ${serie.rendu} »`
            );
            surSerieChoisie(serie);
          }}
        />
      )}

      {onglet === "profil" && (
        <>
          {/* ==========================================================
              §1 — L'IDENTITÉ
              ==========================================================
              ⚠️ `items-start`, ET C'EST LA RÈGLE DE MISE EN PAGE
              (nº 222-§1e) : le haut du nom ne dépasse JAMAIS le haut de
              la photo. Le bloc était centré verticalement — un nom sur
              deux lignes remontait donc AU-DESSUS d'elle. Calé en haut,
              il commence à sa hauteur et se prolonge SOUS elle s'il est
              long, en gardant son alignement sur le bord gauche DU
              TEXTE (sa colonne), jamais sur celui de la photo.
              ⚠️ ET UNE MARGE AU-DESSUS (nº 222-§1b) : la photo touchait
              la rangée Profil / Portfolio / Suivre. */}
          <div className="mt-7 flex items-start gap-5">
            {avatarProfil}
            <div className="min-w-0 flex-1">
              {/*  LE NOM — une taille de titre de profil, DEUX LIGNES
                   AU PLUS, puis des points de suspension (nº 222-§1c
                   et §1d). La passe de finition ajustera la valeur. */}
              {/*  20 px au doigt, 22 px au large — l'échelle d'un
                   titre de profil : nettement au-dessus du sous-titre,
                   sans crier, et deux lignes d'un nom long tiennent à
                   390 px. */}
              <h1 className="line-clamp-2 text-[20px] lg:text-[22px] font-bold tracking-tight text-sombre-texte leading-[1.25]">
                {tatoueur.nom}
              </h1>
              {/*  LE SOUS-TITRE — UN LIEU, UN RÔLE, RIEN D'AUTRE
                   (nº 222-§1f) : « EN SALON · RÉSIDENT ». La règle vit
                   dans `sousTitreArtiste` (lib/modes-exercice). */}
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sombre-texte-doux">
                {sousLeNom(tatoueur)}
              </p>
            </div>
          </div>

          {/* ==========================================================
              §2 — LES LIENS, SOUS LA PHOTO
              ==========================================================
              Les liens libres d'abord, les réseaux ensuite ; chacun son
              icône à gauche, toutes de la même taille. `flex-wrap` les
              regroupe : rien ne descend d'une ligne s'il peut monter. */}
          {liens.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3.5">
              {liens}
            </div>
          )}

          {/* §3 — LA BIOGRAPHIE, sous les liens. Retours à la ligne
              saisis respectés, mots sans espace coupés proprement. */}
          {tatoueur.bio && (
            <p className="mt-7 text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
              {tatoueur.bio}
            </p>
          )}

          {/* ==========================================================
              §4 et §5 — OÙ TRAVAILLE CETTE FICHE
              ==========================================================
              UN LIEU montre ses ADRESSES (photo, adresse, horaires,
              équipe) — avec le sélecteur « Adresse / Autre adresse »
              quand il y en a plusieurs, et une simple ligne de
              séparation sinon.
              UN ARTISTE montre ses PROFILS, dans l'ordre imposé
              (nº 222-§1g) : à domicile, en studio, en salon, guest.
              ⚠️ LA LIGNE DE SÉPARATION EST POSÉE ICI, jamais dans le
              bloc : c'est l'enveloppe qui sépare ses sections, et le
              sélecteur remplace le trait quand il s'affiche. */}
          {tatoueur.type_fiche === "artiste" ? (
            <div className={`mt-10 pt-10 ${separation}`}>
              <BlocProfilsArtiste tatoueur={tatoueur} />
            </div>
          ) : (
            <div
              className={
                aPlusieursAdresses ? "mt-10" : `mt-10 pt-10 ${separation}`
              }
            >
              <BlocAdressesFiche
                tatoueur={tatoueur}
                studioCourantId={studioCourant}
              />
            </div>
          )}

          {/* ==========================================================
              §6 — LES BADGES, PUIS LE SIGNALEMENT
              ==========================================================
              ⚠️ PLUS AUCUN TRAIT ENTRE LES BLOCS DE BADGES
              (nº 222-§6) : ils se distinguent par l'espacement et la
              typographie, et par rien d'autre. Le premier prend la
              ligne qui le sépare de ce qui précède ; les suivants
              s'enchaînent.
              ⚠️ ET LES BADGES N'ONT PLUS DE CONTOUR (charte) : chaque
              niveau s'éclaircit — la page, le bloc, le badge. */}
          {groupesBadges.map((groupe, rang) =>
            groupe.slugs.length > 0 ? (
              <div
                key={groupe.titre}
                className={
                  rang === premierGroupeRempli
                    ? `mt-10 pt-10 ${separation}`
                    : "mt-9"
                }
              >
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
                  {groupe.titre}
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {groupe.slugs.map((slug) =>
                    groupe.versPages ? (
                      <li key={slug}>
                        <Link
                          href={`/tatouage/${slug}/${tatoueur.ville_slug}`}
                          className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                     bg-sombre-eleve text-[13px] font-medium text-sombre-texte
                                     transition-colors hover:bg-sombre-haut"
                        >
                          {libelleStyle(slug)}
                        </Link>
                      </li>
                    ) : (
                      <li
                        key={slug}
                        className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                   bg-sombre-eleve text-[13px] font-medium text-sombre-texte"
                      >
                        {libelleFiltre(slug)}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : null
          )}

          {/* LE SIGNALEMENT — DERRIÈRE L'UNIQUE TRAIT qui suit les
              badges (nº 222-§6). En dessous, la mise hors ligne : un
              lien PUBLIC et un pouvoir d'ADMINISTRATION n'ont rien à
              faire sur la même ligne (le composant ne rend rien tant
              que le SERVEUR n'a pas reconnu l'administrateur). */}
          {!apercu && (
            <div
              className={`mt-10 pt-10 ${separation} flex flex-col items-start gap-4`}
            >
              <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} />
              <BoutonHorsLigne idFiche={tatoueur.id} nom={tatoueur.nom} />
            </div>
          )}
        </>
      )}
    </>
  );
}
