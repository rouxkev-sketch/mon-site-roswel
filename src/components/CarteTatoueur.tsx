"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { libelleTypeFiche, PHOTO_PORTFOLIO, PORTRAIT_ROND } from "@/config/tatouage";
import {
  lireDisposition,
  lireDispositionServeur,
  souscrireDisposition,
} from "@/lib/disposition-grille";
import { legendeDeCarte, photoChoisie, photoPourStyle } from "@/lib/photo-tatoueur";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { ligneCarte } from "@/lib/adresse";
import { pincementRecent, usePincement } from "@/components/ZoomPincement";
import type { Tatoueur } from "@/lib/tatoueurs";
import { essai } from "@/lib/interrupteurs-mesure";

/**
 * LA CARTE D'UN TATOUEUR
 * ======================
 * NI CONTOUR, NI CADRE : une image, et son nom dessous. La carte ne
 * s'annonce pas, elle laisse voir. C'est le parti pris des galeries
 * d'aujourd'hui — ce qui tient la grille, c'est le rythme des images,
 * pas des rectangles dessinés autour.
 *
 * L'ombre est DOUCE au repos et se creuse au survol : elle donne du
 * relief sans jamais faire un contour. AUCUN grossissement de la photo
 * au survol — le curseur main suffit à dire que la carte se clique.
 *
 * SOUS L'IMAGE : LE PORTRAIT ROND, puis deux lignes de texte — le
 * nom, puis la ville, et rien de plus. Le portrait fait EXACTEMENT la
 * hauteur de ces deux lignes. Il disparaît en deux colonnes sur
 * smartphone, où la carte est trop étroite pour lui.
 * La seule chose posée DANS l'image est une pastille sombre ALLÉGÉE,
 * angle bas DROIT : « Artiste » ou « Salon ». Ni styles, ni icône de
 * réseau — les réseaux vivent sur la fiche.
 *
 * LA PHOTO SUIT LE STYLE CHERCHÉ (voir `photoPourStyle`) : qui cherche
 * « réalisme » voit le réalisme de ce tatoueur, pas sa première image.
 *
 * TOUTE LA CARTE EST CLIQUABLE et mène à la fiche, par le lien étiré
 * en fond (`after:absolute after:inset-0`).
 *
 * SMARTPHONE (variante `mobile:`) : la grille imite Instagram — image
 * aux ANGLES DROITS, bord à bord, nom un cran plus discret (la ville
 * ne change pas). La photo s'AGRANDIT AU PINCEMENT à deux doigts
 * (usePincement) : le lien étiré recouvre l'image, c'est donc LA
 * CARTE ENTIÈRE qui écoute les doigts, et SEULE LA PHOTO qui grossit.
 * Un pincement n'ouvre JAMAIS la fiche : seul le tap simple navigue
 * (garde `pincementRecent` dans `auClic`).
 */
export function CarteTatoueur({
  tatoueur,
  styleRecherche = "",
  renduRecherche = "",
  prioritaire = false,
  surOuverture,
  surApproche,
}: {
  tatoueur: Tatoueur;
  /** Le style demandé dans le moteur, s'il y en a un. */
  styleRecherche?: string;
  /** LE RENDU demandé, s'il n'en reste qu'un allumé : chercher de la
      couleur et tomber sur du noir et gris serait un mensonge
      d'affichage. */
  renduRecherche?: string;
  /** LES PREMIÈRES CARTES DE LA GRILLE. Leur photo est celle que
      Google mesure (le « plus grand élément affiché ») : elle ne doit
      PAS être différée — voir GrilleTatoueurs. */
  prioritaire?: boolean;
  /** GRAND ÉCRAN (≥ 1024 px) : ouvre la FENÊTRE de fiche par-dessus la
      grille au lieu de naviguer (mécanique d'Instagram). Le lien reste
      un vrai lien : clic du milieu, Ctrl+clic et moteurs de recherche
      vont toujours à la page /tatoueur/nom. */
  surOuverture?: () => void;
  /** LE SURVOL (web) : la grille en profite pour demander d'avance la
      fiche complète — au clic, la fenêtre a déjà tout. N'a aucun effet
      visible. */
  surApproche?: () => void;
}) {
  const photo = photoPourStyle(tatoueur, styleRecherche, renduRecherche);
  /** LA PHOTO EXACTE QU'ON REGARDE — c'est ELLE que le cœur
      enregistre, pas « une photo de ce tatoueur ». Absente quand la
      galerie est vide (fiche d'avant le portfolio catalogué, ou fiche
      de démonstration) : le cœur ne s'affiche alors pas — enregistrer
      une image qui n'existe pas en base n'aurait aucun sens. */
  const photoEnregistrable = photoChoisie(
    tatoueur,
    styleRecherche,
    renduRecherche
  );
  /** En « une colonne » (bouton de disposition, vrais mobiles), le
      nom et la localité GRANDISSENT sous la grande image. */
  const disposition = useSyncExternalStore(
    souscrireDisposition,
    lireDisposition,
    lireDispositionServeur
  );
  const uneColonne = disposition === "une";

  /** LE ZOOM AU PINCEMENT (vrais mobiles) : la carte écoute, la photo
      grossit — voir ZoomPincement.tsx pour la mécanique. */
  const zoneCarte = useRef<HTMLElement>(null);
  const cadrePhoto = useRef<HTMLDivElement>(null);
  const gestesPincement = usePincement({ ecoute: zoneCarte, cible: cadrePhoto });

  /** L'ESSAI DE NAVIGATION DE DOCUMENT est-il allumé ? (voir auClic)
      Lu une seule fois, pendant le rendu. Le serveur répond toujours
      « non » : rien ne dépend de cette valeur dans le HTML rendu, il n'y
      a donc aucune discordance d'hydratation. */
  const [essaiDocument] = useState(() => essai("document"));

  /** L'ADRESSE DE LA FICHE — elle EMPORTE le style cherché (?style=…) :
      la fiche ouvre alors son carrousel sur la photo de CE style, la
      continuité exacte de la photo de la carte. Calculée une fois : le
      lien l'affiche, et la navigation de document du smartphone s'en
      sert aussi. */
  const adresseFiche = (() => {
    const suite = new URLSearchParams();
    if (styleRecherche) suite.set("style", styleRecherche);
    if (renduRecherche) suite.set("rendu", renduRecherche);
    const requete = suite.toString();
    return requete
      ? `/tatoueur/${tatoueur.slug}?${requete}`
      : `/tatoueur/${tatoueur.slug}`;
  })();

  /** LA BALISE DE POPULARITÉ : chaque clic vers la fiche est signalé
      au serveur (qui dédoublonne par visiteur sur 24 h et écarte les
      robots — voir /api/tatoueur/clic). `sendBeacon` : l'envoi part
      sans retarder la navigation, et survit même au départ de la
      page. Jamais bloquant, jamais d'erreur visible. */
  function signalerClic() {
    try {
      const corps = new Blob([JSON.stringify({ slug: tatoueur.slug })], {
        type: "application/json",
      });
      if (!navigator.sendBeacon?.("/api/tatoueur/clic", corps)) {
        fetch("/api/tatoueur/clic", {
          method: "POST",
          body: JSON.stringify({ slug: tatoueur.slug }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Navigateur sans balise : le clic ne sera pas compté, c'est tout.
    }
  }

  /** N'intercepte QUE le clic simple, sur les APPAREILS À SOURIS
      (toute largeur de fenêtre — la fenêtre superposée sait s'y
      adapter) : toute autre combinaison (nouvel onglet, clic du
      milieu…) garde le lien, et les vrais mobiles naviguent vers la
      page. Le clic est COMPTÉ dans tous les cas — SAUF au sortir d'un
      pincement : agrandir une photo n'est pas choisir une fiche. */
  function auClic(evenement: React.MouseEvent) {
    if (pincementRecent()) {
      evenement.preventDefault();
      return;
    }
    signalerClic();
    // Nouvel onglet, clic du milieu… : on ne touche à rien.
    if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;

    /**
     * SUR SMARTPHONE : UNE VRAIE NAVIGATION DE DOCUMENT.
     * ===================================================
     * ⚠️ ET C'EST LA CORRECTION DE L'ÉCRAN GRIS, APRÈS HUIT PASSES.
     * Mesuré sur l'iPhone du propriétaire : au retour par BALAYAGE DU
     * DOIGT, la première image arrive 384 à 398 ms après le geste ; au
     * BOUTON du navigateur, 57 ms. Même page, mêmes dix-huit cartes,
     * mosaïque DÉJÀ rendue, aucune requête réseau — et le fil principal
     * LIBRE tout du long (49 à 68 tics de minuterie pendant l'attente,
     * plus grand trou 22 à 35 ms). Éteindre le pincement, la réserve de
     * hauteur ou la mémoire de la mosaïque n'y change rien.
     *
     * Notre code ne bloque donc rien. Ce qui manque, c'est L'IMAGE que
     * le navigateur révèle pendant le glissement. Il la prend dans la
     * CAPTURE de la page précédente — et il n'en garde une QUE si cette
     * page est un vrai document. Or `<Link>` fait une navigation
     * INTERNE : aucun document n'est créé, aucune capture n'existe, et
     * le navigateur montre son fond par défaut, le gris.
     *
     * On rend donc la main au navigateur : `location.assign`, comme un
     * lien ordinaire. Il crée un document, garde sa capture, et le
     * balayage révèle la mosaïque telle qu'on l'a quittée. Le cache de
     * retour redevient utilisable par la même occasion (`no-store` a été
     * retiré à la passe 108) — c'est lui qui rendra la page vivante,
     * position comprise.
     *
     * ⚠️ SMARTPHONE UNIQUEMENT. Sur le web, la fiche s'ouvre en fenêtre
     * superposée (`surOuverture`) : la grille n'est jamais démontée, il
     * n'y a pas de geste de retour, et rien de tout cela ne s'applique.
     *
     * ⚠️ ET RIEN N'A ÉTÉ SUPPRIMÉ EN FACE. Le cache de retour n'est
     * jamais garanti (mémoire, onglets, âge) : quand il ne sert pas, le
     * document est RECONSTRUIT — et c'est exactement le cas que la
     * mémoire de la mosaïque, la réserve de hauteur et le script avant
     * peinture savent traiter depuis les passes 107 à 113. Ils restent
     * le filet.
     */
    if (document.documentElement.dataset.appareil === "mobile") {
      // ⚠️ ET DANS TOUS LES CAS ON S'ARRÊTE ICI : sur un vrai mobile, la
      // fenêtre superposée du web n'a rien à faire. Sans cet arrêt, le
      // lien ouvrait la fenêtre au lieu de naviguer — mesuré.
      if (essaiDocument) {
        evenement.preventDefault();
        window.location.assign(adresseFiche);
      }
      return;
    }

    if (!surOuverture) return;
    evenement.preventDefault();
    surOuverture();
  }

  return (
    <article
      ref={zoneCarte}
      // Son identité, pour la retrouver après un changement de
      // disposition (voir src/lib/carte-du-haut.ts).
      data-carte={tatoueur.id}
      className="group relative flex flex-col"
      // Le doigt garde le défilement ; le pincement, non — il zoome
      // la photo (jamais la page).
      style={{ touchAction: "pan-x pan-y" }}
      onPointerEnter={surApproche}
      {...gestesPincement}
    >
      {/* L'ENVELOPPE DE LA PHOTO — elle ne bouge JAMAIS. C'est elle
          qui porte le badge : le pincement ne transforme que le cadre
          intérieur, le badge reste donc à sa place et à sa taille,
          comme le badge de style des fiches. */}
      <div className="relative">
        {/* La photo : 4:5, elle porte la carte. Angles DROITS partout —
            la grille assume le rythme des images, sans coins adoucis.
            C'est CE CADRE ENTIER que le pincement agrandit (il passe
            par-dessus ses voisines le temps du geste, puis se range). */}
        <div
          ref={cadrePhoto}
          className="relative w-full aspect-4/5 overflow-hidden rounded-none
                     bg-sombre-eleve
                     shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                     transition-shadow duration-300
                     group-hover:shadow-[0_12px_34px_rgba(0,0,0,0.55)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element --
              les images de démonstration sont des SVG dessinés à la
              volée ; l'optimiseur de Next n'a rien à y gagner. */}
          <img
            src={photo}
            // CE QUE MONTRE VRAIMENT LA CARTE : le nom, la ville, et le
            // style (avec le rendu quand la photo est taguée) — voir
            // `legendeDeCarte`.
            alt={legendeDeCarte(tatoueur, styleRecherche, renduRecherche)}
            // LES PREMIÈRES CARTES NE SONT PAS DIFFÉRÉES : l'image
            // mesurée par Google ne doit pas attendre le défilement.
            loading={prioritaire ? "eager" : "lazy"}
            fetchPriority={prioritaire ? "high" : undefined}
            // LA PLACE EST RÉSERVÉE AVANT L'ARRIVÉE DE LA PHOTO. Le
            // cadre au-dessus impose déjà le format 4:5, mais déclarer
            // les dimensions intrinsèques rend la réserve indépendante
            // de la feuille de style : si elle tarde, la page ne bouge
            // pas davantage.
            width={PHOTO_PORTFOLIO.largeur}
            height={PHOTO_PORTFOLIO.hauteur}
            className="w-full h-full object-cover"
          />
        </div>

        {/* LE BADGE « Artiste » / « Salon » — DANS l'image, angle bas
            DROIT. UNE PASTILLE SOMBRE, ALLÉGÉE : le noir à 38 %
            seulement, avec un flou d'arrière-plan qui va chercher la
            couleur de la photo en dessous. AUCUN CONTOUR : le liseré
            blanc qu'il portait dessinait un objet là où l'on voulait
            juste une ombre posée — il se voyait plus que le texte.
            Le texte reste blanc : il se lit sur une photo sombre
            comme sur une photo claire, sans jamais s'imposer.
            LE CALAGE, tenu au pixel : `inline-flex` + `justify-center`
            + `items-center`, une HAUTEUR FIXE et `leading-none`. Le
            texte est alors centré pour de bon, horizontalement comme
            verticalement — les 10 px de retrait sont exactement les
            mêmes à gauche et à droite, et la hauteur de ligne ne
            décale plus le mot vers le haut. */}
        <span
          className="absolute bottom-2 right-2 inline-flex h-[22px]
                     items-center justify-center rounded-full
                     bg-black/38 backdrop-blur-md
                     px-2.5 text-[11.5px] font-semibold leading-none
                     text-white pointer-events-none select-none"
        >
          {libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement)}
        </span>

        {/* LE CŒUR — DANS l'image, angle HAUT DROIT : l'angle opposé
            au badge, celui que tous les sites d'images réservent à ce
            geste. Il est posé APRÈS le lien étiré dans l'ordre du
            document et porte `z-10` : le doigt le trouve avant la
            carte, et n'ouvre donc jamais la fiche par erreur. */}
        {photoEnregistrable && (
          <div className="absolute top-2 right-2">
            <BoutonCoeurPhoto photoId={photoEnregistrable.id} />
          </div>
        )}
      </div>

      {/* SOUS LA CARTE : le portrait, puis deux lignes de texte.
          Sur mobile, l'image touche les bords : le texte reprend une
          marge intérieure, et le nom descend d'un cran (la ville,
          elle, ne bouge pas).

          LE PORTRAIT ROND, À GAUCHE — il donne un visage à chaque
          carte, ce qu'une photo de tatouage ne fait jamais.

          ⚠️ SA TAILLE EST DONNÉE EN PIXELS, LARGEUR ET HAUTEUR — et
          c'est la seule façon d'en garantir un CERCLE. La version
          précédente demandait « la hauteur du bloc de texte »
          (`self-stretch`) et « la largeur = la hauteur »
          (`aspect-square`) : deux règles qui se mordent la queue. Dans
          une rangée, le navigateur calcule les LARGEURS d'abord, les
          hauteurs ensuite ; au moment de choisir la largeur du
          portrait, la hauteur à copier n'existe pas encore. Il prenait
          donc la largeur du contenu — quelques pixels — puis
          l'étirait en hauteur : le rectangle vertical de la capture.
          Aucune largeur de carte, aucune longueur de nom ne peut
          désormais l'aplatir.

          LES DEUX LIGNES ONT UNE HAUTEUR DE LIGNE FIXE (19 px, 21 px
          en une colonne sur smartphone) et sont limitées à UNE ligne :
          le bloc de texte mesure donc toujours 40 px (44 px), soit
          exactement le portrait. Le haut du cercle est au haut du nom,
          son bas au bas de la localité — nom court, nom long ou nom
          très long tronqué, la mesure ne bouge pas.
          EN DEUX COLONNES SUR SMARTPHONE, il disparaît : la carte n'y
          fait que 190 px de large, le portrait mangerait le nom. */}
      <div className="pt-3 px-0.5 mobile:px-4 mobile:pt-2.5 flex items-center gap-2.5">
        <span
          className={`shrink-0 h-10 w-10 flex items-center
                     justify-center overflow-hidden rounded-full
                     bg-sombre-eleve ${
                       uneColonne ? "mobile:h-11 mobile:w-11" : "mobile:hidden"
                     }`}
        >
          {tatoueur.photo_profil ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               photo déposée par le tatoueur, servie telle quelle. */
            <img
              src={tatoueur.photo_profil}
              alt=""
              loading="lazy"
              width={PORTRAIT_ROND}
              height={PORTRAIT_ROND}
              className="h-full w-full object-cover"
            />
          ) : (
            /* LE REPLI DES FICHES D'AVANT LA PHOTO DE PROFIL :
               l'initiale, comme partout ailleurs sur le site. */
            <span
              aria-hidden="true"
              className="text-[13px] font-bold text-sombre-texte-doux"
            >
              {tatoueur.nom.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        {/* LE BLOC DE TEXTE — deux lignes, hauteur au pixel : 19 + 2 +
            19 = 40 px (21 + 2 + 21 = 44 px en une colonne sur
            smartphone). C'est cette hauteur que le portrait reprend. */}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <h3
          className={`font-semibold text-[15px] text-sombre-texte leading-[19px] line-clamp-1 ${
            uneColonne
              ? "mobile:text-[17px] mobile:leading-[21px]"
              : "mobile:text-[14px]"
          }`}
        >
          {/* Le lien de fiche s'étire sur TOUTE la carte. Il EMPORTE
              le style cherché (?style=…) : la page de fiche ouvre
              alors son carrousel sur la photo de CE style — la
              continuité exacte de la photo de la carte. */}
          <Link
            href={adresseFiche}
            // ⚠️ SUR SMARTPHONE, LE PRÉCHARGEMENT NE SERT PLUS À RIEN :
            // le clic part en navigation de document, et ce que Next
            // précharge (la charge du routeur) ne peut pas la servir.
            // Dix-huit cartes, dix-huit demandes inutiles. Le web, lui,
            // garde son préchargement — sa fenêtre s'en sert vraiment.
            prefetch={essaiDocument ? false : undefined}
            onClick={auClic}
            className="outline-none after:absolute after:inset-0 after:content-['']
                       focus-visible:underline"
          >
            {tatoueur.nom}
          </Link>
        </h3>
        <p
          className={`text-sombre-texte-doux leading-[19px] line-clamp-1 ${
            uneColonne
              ? "text-[14.5px] mobile:leading-[21px]"
              : "text-[13px]"
          }`}
        >
          {/* ⚠️ VILLE ET PAYS, RIEN D'AUTRE (passe nº 114) — et le code
              de l'État pour les pays qui l'écrivent : « Miami, FL,
              États-Unis ». La règle vit dans lib/adresse, jamais ici. */}
          {ligneCarte({
            ville: tatoueur.ville_nom,
            region: tatoueur.region,
            pays: tatoueur.pays,
            code_pays: tatoueur.code_pays,
          })}
        </p>
        </div>
      </div>
    </article>
  );
}
