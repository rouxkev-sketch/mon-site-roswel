"use client";

import { useState } from "react";
import Link from "next/link";
import {
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
import { HorairesStudio } from "@/components/HorairesStudio";
import { aDesHoraires } from "@/lib/horaires-studio";
import {
  BlocAdresses,
  BlocEquipe,
  LignesModes,
  sousLeNom,
  studioAffiche,
} from "@/components/BlocsFiche";
import { IconeWorld } from "@/components/Icones";
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
  surSerieChoisie,
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
  /** Un toucher sur une vignette : l'enveloppe montre CETTE série —
      style + catégorie + rendu (nº 204-§3) — et remonte en haut
      (nº 197-§4). */
  surSerieChoisie: (serie: SerieChoisie) => void;
}) {
  /**
   * LES DEUX ONGLETS DE L'AFFICHE (nº 197-§1)
   * « Profil » montre le contenu de la fiche ; « Portfolio » montre les
   * styles publiés, catégorie par catégorie.
   */
  const [onglet, setOnglet] = useState<OngletAffiche>("profil");
  /** La catégorie regardée dans l'onglet « Portfolio » (nº 197-§2). */
  const [categorie, setCategorie] = useState<string>(NATURE_PAR_DEFAUT);
  /** LE RENDU regardé (nº 204-§3) — le panneau le ramène de lui-même
      au seul rendu présent quand il n'y en a qu'un. */
  const [rendu, setRendu] = useState<string>(RENDU_PAR_DEFAUT);

  const avatarProfil = (
    <span
      className="flex h-[92px] w-[92px] shrink-0 items-center justify-center
                 overflow-hidden rounded-full border border-sombre-bordure
                 bg-sombre-eleve"
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

  /** L'icône RONDE officielle d'un réseau — fichier du propriétaire,
      affiché tel quel, détouré d'un FIN CERCLE BLANC sur les DEUX
      réseaux (Instagram aussi est sombre sur notre fond). 44 px :
      c'est elle qui donne sa présence au bouton-phare. */
  const iconeReseau = (reseau: "instagram" | "tiktok" | "youtube") => (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône officielle déposée par le propriétaire, affichée telle
       quelle. */
    <img
      src={ICONES_RESEAUX[reseau]}
      alt=""
      width={44}
      height={44}
      className="w-11 h-11 shrink-0 rounded-full ring-1 ring-white/25"
    />
  );

  /** INSTAGRAM ET TIKTOK — LES DEUX BOUTONS-PHARES DE LA FICHE.
      C'est LA visite qu'on veut déclencher : le portfolio entier vit
      sur ces comptes. Alors ils se détachent de tout le reste :
      SEULS éléments de la fiche au liseré ROSE et au léger halo —
      l'œil va droit sur eux, sans criard.

      LA GÉOMÉTRIE, REPRISE À ZÉRO — trois colonnes, pas deux.
      Le texte était centré dans LA PLACE QUI RESTAIT à droite de
      l'icône, et le badge n'avait aucune marge à droite : le libellé
      tombait donc trop à droite, et il frôlait le bord. Désormais une
      grille `44px | 1fr | 44px` : l'icône occupe la colonne de
      gauche, une colonne FANTÔME de même largeur lui répond à droite,
      et le texte vit dans la colonne du milieu — donc EXACTEMENT au
      centre du badge, quel que soit le libellé. Les marges se
      déduisent : 16 px de chaque côté (px-4), 12 px entre les
      colonnes (gap-3), soit 72 px avant et après la zone de texte.
      Hauteur portée à 68 px : ce sont les boutons les plus importants
      de la fiche, ils en ont la présence. */
  const badgeReseau = (reseau: "instagram" | "tiktok" | "youtube") => {
    const lien =
      reseau === "instagram"
        ? tatoueur.lien_instagram
        : reseau === "tiktok"
          ? tatoueur.lien_tiktok
          : tatoueur.lien_youtube;
    if (!lien) return null;
    const nomReseau =
      reseau === "instagram"
        ? "Instagram"
        : reseau === "tiktok"
          ? "TikTok"
          : "YouTube";
    return (
      <a
        href={lien}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${nomReseau} de ${tatoueur.nom} (nouvel onglet)`}
        className="grid w-full h-[68px] grid-cols-[44px_1fr_44px] items-center gap-3
                   rounded-2xl px-4
                   border border-primaire/40 bg-sombre-eleve
                   shadow-[0_10px_32px_rgba(238,61,111,0.10)]
                   transition-[border-color,background-color,box-shadow]
                   hover:border-primaire hover:bg-primaire/10
                   hover:shadow-[0_12px_36px_rgba(238,61,111,0.22)]
                   active:bg-primaire/15"
      >
        {iconeReseau(reseau)}
        <span className="min-w-0 truncate text-center text-[16px] font-semibold text-sombre-texte">
          Voir son {nomReseau}
        </span>
        {/* LA COLONNE FANTÔME — elle ne montre rien, elle ÉQUILIBRE :
            sans elle, le texte ne peut pas être au centre du badge. */}
        <span aria-hidden="true" />
      </a>
    );
  };

  /** L'adresse et le site — chacun SA ligne, à la taille de la bio,
      dans le GRIS DOUX des titres de sections (« Styles ») : texte et
      icône d'une seule voix. Les icônes du propriétaire (adresse.png /
      site.png, des glyphes noirs) passent en clair par `invert`, et
      l'opacité les cale sur ce même gris. */
  const iconeInfo = (fichier: string) => (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône déposée par le propriétaire, affichée telle quelle (le
       filtre CSS ne modifie pas le fichier). */
    <img
      src={fichier}
      alt=""
      width={16}
      height={16}
      className="w-4 h-4 shrink-0 invert opacity-60"
    />
  );

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
    { titre: "Technique", slugs: tatoueur.filtres_technique ?? [] },
    { titre: "Types de projets", slugs: tatoueur.filtres_composition ?? [] },
    // LES BESOINS — au même format que les deux autres : ce ne
    // sont pas des goûts, mais ils se lisent au même endroit.
    { titre: "Besoins", slugs: tatoueur.filtres_besoins ?? [] },
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
  /** LE STUDIO DONT ON LIT LES HORAIRES — le même que celui dont on
      lit l'adresse (voir `studioAffiche`). */
  const studioDesHoraires = studioAffiche(tatoueur, studioCourant);

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
      <div className="flex items-center justify-between gap-3">
        <SelecteurOngletAffiche valeur={onglet} surChoix={setOnglet} />
        {!apercu && (
          <BoutonSuivre tatoueurId={tatoueur.id} nomTatoueur={tatoueur.nom} />
        )}
      </div>

      {onglet === "portfolio" && (
        <PanneauPortfolio
          groupes={groupes}
          nature={categorie}
          surNature={setCategorie}
          rendu={rendu}
          surRendu={setRendu}
          nomTatoueur={tatoueur.nom}
          surSerie={surSerieChoisie}
        />
      )}

      {onglet === "profil" && (
        <>
          {/* 1. L'IDENTITÉ — LE NOM D'ABORD, sa nature ensuite.
              C'est l'ordre de lecture des bonnes pages de profil : on
              lit un NOM, puis on apprend ce qu'il est. Le nom revient
              donc AU-DESSUS, à une taille de titre de profil — plus
              de bandeau publicitaire : 1,45 rem à 1,75 rem, resserré,
              sur une interligne courte. Sous lui, « ARTISTE » ou
              « SALON » en capitales minuscules et espacées : une
              étiquette, pas un titre. */}
          <div className="flex items-center gap-5">
            {avatarProfil}
            <div className="min-w-0">
              <h1 className="text-[clamp(1.45rem,2.1vw,1.75rem)] font-bold tracking-tight text-sombre-texte leading-[1.15]">
                {tatoueur.nom}
              </h1>
              <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
                {sousLeNom(tatoueur)}
              </p>
            </div>
          </div>

          {/* « SUIVRE » A REJOINT LA RANGÉE DU HAUT (nº 205-§2) — à
              droite du sélecteur Profil / Portfolio, visible quel que
              soit l'onglet. Il n'existe plus qu'un seul exemplaire,
              là-haut. */}

          {/* 2-3. OÙ, puis LE SITE. À DROITE DE L'ICÔNE : LA
              LOCALISATION ELLE-MÊME. Le mot « adresse » y figurait —
              une étiquette qui répétait l'icône et volait la place de
              l'information. C'est donc le lieu qui vient là, DANS LE
              GRIS DE L'ICÔNE (texte et icône d'une seule voix, comme
              la ligne du site juste dessous) et qui passe AU ROSE au
              survol ou au toucher : la couleur ne sert plus à
              signaler, elle sert à répondre.
              Le MODE D'EXERCICE ne disparaît que lorsqu'il ne dit
              rien de plus que l'adresse (le cas des salons) ; « en
              salon », « sur zone » ou « itinérant » restent, en
              petit, sous le lieu qu'ils qualifient.
              Le retrait n'est plus un décalage écrit en dur : il
              résulte de l'alignement, le texte se cale tout seul sur
              l'icône, quelle que soit la taille de celle-ci. */}
          <div className="mt-7 flex flex-col gap-3.5">
            <div className="flex items-start gap-2.5">
              {/* L'ÉPINGLE ne sert qu'aux ADRESSES : les modes
                  d'exercice portent déjà, chacun, leur propre icône
                  ronde — deux icônes sur la même ligne se disputent
                  l'œil sans rien apprendre de plus. */}
              {!(
                tatoueur.type_fiche === "artiste" &&
                (tatoueur.modes ?? []).length > 0
              ) && (
                <span className="mt-[3px] flex shrink-0">
                  {iconeInfo("/adresse.png")}
                </span>
              )}
              <div className="min-w-0 flex flex-col gap-1">
                {/* UN ARTISTE MONTRE SES MODES D'EXERCICE — une ligne
                    chacun, avec son icône ronde (ou le logo du salon
                    auquel il est rattaché). UN SALON montre ses
                    ADRESSES. C'est la même place, et deux natures
                    d'information différentes. */}
                {tatoueur.type_fiche === "artiste" &&
                (tatoueur.modes ?? []).length > 0 ? (
                  <LignesModes modes={tatoueur.modes} />
                ) : (
                  <BlocAdresses tatoueur={tatoueur} studioCourantId={studioCourant} />
                )}
              </div>
            </div>
            {tatoueur.site_web && (
              <a
                href={tatoueur.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2.5 text-[15px] leading-snug
                           text-sombre-texte-doux hover:text-primaire transition-colors"
              >
                {/* L'ICÔNE « WORLD » remplace site.png : posée en
                    masque, à la MÊME taille (17 px), elle prend la
                    couleur de la ligne — donc elle passe au rose avec
                    le texte au survol, ce que l'ancienne image ne
                    faisait pas. */}
                <IconeWorld taille={16} />
                {/* LE TITRE CHOISI PAR LE TATOUEUR (passe nº 116) —
                    et, pour une fiche d'avant la migration nº 51, le
                    libellé d'avant (service ou domaine). */}
                {tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web)}
              </a>
            )}
            {/* LA PAGE DE LIENS — SA PROPRE LIGNE, SON PROPRE LIBELLÉ
                (passe nº 102). Elle partageait le champ du site : on
                ne pouvait montrer que l'un des deux. Elle a désormais
                sa colonne, et elle s'affiche sous le site avec le nom
                du service — « Linktree », « Beacons » — que
                `libelleDuLien` lit dans l'adresse. Même icône que le
                site : les deux mènent ailleurs, sur le web. */}
            {tatoueur.page_de_liens && (
              <a
                href={tatoueur.page_de_liens}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2.5 text-[15px] leading-snug
                           text-sombre-texte-doux hover:text-primaire transition-colors"
              >
                <IconeWorld taille={16} />
                {tatoueur.titre_page_de_liens ||
                  libelleDuLien(tatoueur.page_de_liens)}
              </a>
            )}
          </div>

          {/* 4. LA BIO — retours à la ligne SAISIS respectés
              (whitespace-pre-line), mots sans espace coupés proprement
              (overflow-wrap) : jamais de débordement. */}
          {tatoueur.bio && (
            <p className="mt-6 text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
              {tatoueur.bio}
            </p>
          )}

          {/* 5-6. INSTAGRAM puis TIKTOK — des badges au format des
              sections, PLEINE LARGEUR (jusqu'à la marge droite du
              bloc, comme la bio), l'icône ronde cerclée de blanc posée
              avec sa marge d'air égale. */}
          <div className="mt-8 flex flex-col gap-3">
            {badgeReseau("instagram")}
            {badgeReseau("tiktok")}
            {/* ⚠️ PLUS DE BADGE YOUTUBE (passe nº 101). YouTube a
                quitté le produit : le formulaire ne le propose plus.
                Le publier quand même reviendrait à afficher un lien
                que son propriétaire ne peut PLUS ni corriger ni
                retirer — un cul-de-sac sur sa propre fiche.
                ⚠️ LA DONNÉE N'EST PAS PERDUE : la colonne
                `lien_youtube` garde son contenu, et le formulaire ne
                l'écrit plus jamais. Rétablir l'affichage tiendrait en
                une ligne, ici. */}
          </div>


          {/* LES HORAIRES — juste sous les réseaux, AVANT l'équipe :
              « c'est ouvert ? » précède toujours « qui y travaille ? ».
              Réservé aux studios : un artiste reçoit sur rendez-vous,
              il n'a pas d'heures d'ouverture au public. */}
          {tatoueur.type_fiche !== "artiste" &&
            aDesHoraires(studioDesHoraires?.horaires) && (
            <div className={`mt-8 pt-7 ${separation}`}>
              <HorairesStudio
                horaires={studioDesHoraires?.horaires}
                fuseau={studioDesHoraires?.fuseau}
                titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
              />
            </div>
          )}

          {/* L'ÉQUIPE — SOUS les adresses, et seulement pour un
              salon : c'est la deuxième chose qu'on vient y chercher,
              juste après « où est-ce ? ». Rien n'est stocké : les
              avatars se déduisent des rattachements validés, et
              disparaissent d'eux-mêmes quand un artiste passe hors
              ligne, supprime sa fiche, ou termine sa session guest. */}
          {(tatoueur.equipe ?? []).length > 0 && (
            <div className={`mt-8 pt-7 ${separation}`}>
              <BlocEquipe
                equipe={tatoueur.equipe}
                titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
              />
            </div>
          )}

          {/* 7-9. LES TROIS SECTIONS — chacune ouverte par une ligne
              de séparation discrète (l'apanage de cette page), un
              titre plus affirmé, puis ses badges — tous de la même
              robe neutre. */}
          {groupesBadges.map(
            (groupe) =>
              groupe.slugs.length > 0 && (
                <div key={groupe.titre} className={`mt-8 pt-7 ${separation}`}>
                  <h2 className="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                    {groupe.titre}
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {groupe.slugs.map((slug) =>
                      groupe.versPages ? (
                        <li key={slug}>
                          <Link
                            href={`/tatouage/${slug}/${tatoueur.ville_slug}`}
                            className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                       border border-sombre-bordure bg-sombre-eleve
                                       text-[13px] font-medium text-sombre-texte
                                       hover:border-primaire hover:text-primaire transition-colors"
                          >
                            {libelleStyle(slug)}
                          </Link>
                        </li>
                      ) : (
                        <li
                          key={slug}
                          className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                     border border-sombre-bordure bg-sombre-eleve
                                     text-[13px] font-medium text-sombre-texte"
                        >
                          {libelleFiltre(slug)}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )
          )}

          {/* 10. LE SIGNALEMENT — dernier bloc, derrière sa ligne.
              Pas d'aperçu : l'espace tatoueur ne se signale pas
              lui-même. EN DESSOUS, et non plus à côté : la mise hors
              ligne, action d'ADMINISTRATION — le composant ne rend
              rien tant que le SERVEUR n'a pas reconnu l'administrateur.
              CÔTE À CÔTE, les deux se ressemblaient trop : un lien
              PUBLIC (signaler) et un pouvoir d'ADMINISTRATION (retirer
              la fiche du site) n'ont rien à faire sur la même ligne.
              L'un reste un lien de texte gris ; l'autre descend d'un
              cran et prend la robe d'un BOUTON cerclé de rouge — on ne
              peut plus les confondre, ni les cliquer l'un pour
              l'autre. */}
          {!apercu && (
            <div
              className={`mt-8 pt-6 ${separation} flex flex-col items-start gap-4`}
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
