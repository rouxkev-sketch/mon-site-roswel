/**
 * L'HABILLAGE DE YOKOFOLIO — le fond sombre
 * =========================================
 * Toutes les pages de ce groupe (index, fiches, pages style + ville)
 * partagent le même fond anthracite et le même pied de page discret.
 * La barre, elle, est posée par chaque page : sur l'index elle porte
 * le moteur qui pilote la grille, ailleurs un moteur qui y ramène.
 *
 * POURQUOI UN GROUPE ENTRE PARENTHÈSES ? « (tatouage) » n'apparaît
 * PAS dans les adresses : l'index reste « /tatoueurs », la fiche
 * « /tatoueur/nom ». Les parenthèses servent uniquement à donner un
 * habillage commun à ces pages-là, sans toucher aux autres produits.
 *
 * L'en-tête et le pied de page BLANCS du produit artisans ne peuvent
 * PLUS atteindre ces adresses (passe nº 145-§1) : ils ne vivent plus
 * dans la mise en page racine — donc partout par défaut, à retirer
 * ensuite d'une liste d'adresses — mais dans celle de LEUR groupe,
 * src/app/(artisans)/layout.tsx. Une page de yokofolio ne peut plus
 * les porter par oubli.
 *
 * ⚠️ AUCUN LIEN VERS UN AUTRE PRODUIT. Les fichiers des artisans et de
 * l'agence restent dans le code, mais aucune page de yokofolio ne les
 * affiche ni n'y renvoie : yokofolio est une marque à part entière.
 */

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  COULEURS_SOMBRE,
  MARQUE_YOKOFOLIO,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { DefilementEnHaut } from "@/components/DefilementEnHaut";
import { ChargeurFavoris } from "@/components/ChargeurFavoris";
import { FournisseurSession } from "@/components/FournisseurSession";
import { FournisseurStyles } from "@/components/FournisseurStyles";
import { GardeSaisie } from "@/components/GardeSaisie";
import { RetourGaranti } from "@/components/RetourGaranti";
import { scriptAvantPeinture } from "@/lib/script-avant-peinture";
import { chargerStylesAjoutes } from "@/lib/styles-ajoutes";
import { SondeClavier } from "@/components/SondeClavier";
import { SondeNavigation } from "@/components/SondeNavigation";
import { SondeFiltres } from "@/components/SondeFiltres";
import { SondeVerre } from "@/components/SondeVerre";
import { SondeRetour } from "@/components/SondeRetour";
import { COMPTES_YOKOFOLIO } from "@/config/tatouage";
import { utilisateurDepuisCookies } from "@/lib/session-cookie";

/**
 * L'ICÔNE D'ONGLET — le CŒUR SEUL (public/yokofolio-icone.png).
 * Un logo large fait un mauvais favicon : à 16 pixels, il devient une
 * bouillie. Le cœur, carré, reste lisible.
 * Le fichier est déposé à la main par le propriétaire et affiché tel
 * quel : le code n'en fabrique aucune variante.
 */
const icone = MARQUE_YOKOFOLIO.iconeOnglet;

/**
 * LES MÉTADONNÉES DE YOKOFOLIO — elles remplacent celles de la racine
 * pour toutes les pages de ce groupe : titre d'onglet, nom
 * d'application, icône, et la carte d'identité de l'application
 * installable (`manifest`). Aucune trace d'un autre nom.
 */
export const metadata: Metadata = {
  title: {
    default: `${MARQUE_YOKOFOLIO.nom} — ${MARQUE_YOKOFOLIO.slogan}`,
    template: `%s · ${MARQUE_YOKOFOLIO.nom}`,
  },
  description: TEXTES_TATOUAGE.descriptionSite,
  applicationName: MARQUE_YOKOFOLIO.nom,
  openGraph: {
    siteName: MARQUE_YOKOFOLIO.nom,
    type: "website",
    locale: "fr_FR",
  },
  /**
   * LA GRANDE CARTE DE PARTAGE — et non plus la petite vignette
   * ------------------------------------------------------------
   * Sans rien déclarer, X (Twitter) affiche une carte `summary` : une
   * miniature CARRÉE de 120 px collée à gauche du texte. Pour un site
   * dont le produit EST l'image, c'est un gâchis — notre image de
   * partage y serait rognée en carré, puis réduite à un timbre.
   *
   * `summary_large_image` demande la GRANDE carte : l'image occupe
   * toute la largeur, au format 1200 × 630 (voir lib/image-partage).
   * C'est le seul réglage nécessaire — le titre, la description et
   * l'image sont repris d'Open Graph, qui les porte déjà.
   */
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: MARQUE_YOKOFOLIO.nom,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: icone, type: "image/png" }],
    shortcut: icone,
    apple: [{ url: MARQUE_YOKOFOLIO.icone }],
  },
};

/**
 * LA COULEUR QUE LE NAVIGATEUR DONNE À CE QU'IL PEINT LUI-MÊME
 * -------------------------------------------------------------
 * Sa barre, l'encoche, et toute zone autour du document (l'élastique
 * de fin de défilement). Elle valait le fond CLAIR, hérité de la
 * racine — yokofolio est sombre, elle prend donc l'anthracite.
 * ⚠️ `themeColor` vit dans `viewport`, PAS dans `metadata` : posé dans
 * les métadonnées il est simplement ignoré, et la balise reste à la
 * valeur de la racine (mesuré : `#FFFFFF`). Les deux autres champs
 * sont redéclarés parce qu'un `viewport` d'enfant remplace celui du
 * parent, champ par champ.
 */
export const viewport: Viewport = {
  themeColor: COULEURS_SOMBRE.fond,
  width: "device-width",
  initialScale: 1,
};

export default async function MiseEnPageTatouage({
  children,
}: {
  children: React.ReactNode;
}) {
  // LA SESSION, LUE ICI MÊME, CÔTÉ SERVEUR : le HTML envoyé porte déjà
  // l'état connecté (nom du compte dans la barre) — c'est la moitié
  // « premier chargement » de la correction du clignotement, l'autre
  // moitié (navigations) vivant dans src/lib/use-utilisateur.ts.
  const magasin = await cookies();
  const utilisateur = utilisateurDepuisCookies(magasin.getAll());
  // ⚠️ POUR LA SONDE DU RETOUR, ET SEULEMENT POUR ELLE : l'en-tête que
  // le TÉLÉPHONE a réellement envoyé. C'est la seule façon de le savoir
  // — un `fetch` depuis la page en enverrait un autre.
  const entetes = await headers();
  const secFetchDest = entetes.get("sec-fetch-dest") ?? "(absent)";
  //  LE CATALOGUE DES STYLES, RELU AVANT LE RENDU (passe nº 122).
  //  Les styles nés d'une suggestion acceptée vivent en base ; ils sont
  //  posés ici, dans le registre du fichier de réglages, AVANT que la
  //  moindre page du groupe ne se rende — et transmis au navigateur
  //  juste en dessous, pour qu'il dise la même chose. Jamais bloquant :
  //  base injoignable, on garde les trente-huit du code.
  const stylesAjoutes = await chargerStylesAjoutes();

  return (
    <>
    {/* ⚠️ TEMPORAIRE — LA SONDE DE MESURE SUR VRAI IPHONE.
        Elle ne s'arme QUE si l'adresse porte `?sonde=1` ; sinon elle
        rend `null` et ne pose aucun écouteur. C'est le SEUL point de
        branchement : pour la retirer, supprimer cette ligne, son
        import, et le fichier src/components/SondeClavier.tsx.
        ⚠️ ELLE EST HORS DE L'ENVELOPPE `data-fond`, ET C'EST VOULU :
        quand la page de recherche est ouverte, cette enveloppe quitte
        le flux (voir globals.css) — la sonde y aurait disparu au
        moment précis où l'on veut la lire. */}
    <SondeClavier />
    {/* ⚠️ TEMPORAIRE — LA SONDE DE NAVIGATION (`?sonde-nav=1`). Elle
        MESURE chez le propriétaire (retour arrière, barre fixe,
        remontée des champs) et ne corrige rien. Pour la retirer :
        cette ligne, son import, et le fichier
        src/components/SondeNavigation.tsx.
        HORS de l'enveloppe `data-fond`, comme les autres sondes : la
        page de recherche la ferait disparaître au moment de lire. */}
    <SondeNavigation />
    {/* ⚠️ TEMPORAIRE — LA SONDE DES FILTRES (`?sonde-filtres=1`). Elle
        mesure le panneau réellement ouvert chez le propriétaire (marges
        gauche, haute à l'encre, basse) et DIT QUEL FICHIER le rend.
        Pour la retirer : cette ligne, son import, et le fichier
        src/components/SondeFiltres.tsx. */}
    <SondeFiltres />
    {/* ⚠️ TEMPORAIRE — LA SONDE DU VERRE (`?sonde-verre=1`). Elle dit
        pourquoi le flou de la barre est annulé chez le propriétaire :
        elle déroule la chaîne des parents et signale ce qui isole.
        Pour la retirer : cette ligne, son import, et le fichier
        src/components/SondeVerre.tsx. */}
    <SondeVerre />
    {/* ⚠️ L'ÉCOUTEUR GLOBAL DE REMONTÉE EST SUPPRIMÉ (nº 162-§1). La
        règle de la nº 155-§1 — « TOUS les champs du site remontent » —
        est annulée : la remontée ne sert qu'à dégager de la place SOUS
        un champ POUR SA LISTE DE SUGGESTIONS. Un champ sans liste n'en
        a aucun besoin, et le navigateur fait déjà le nécessaire, en
        plus discret. Les trois champs à liste l'arment eux-mêmes
        (ChampLocalisation, RechercheFicheInscrite). */}
    {/* ⚠️ TEMPORAIRE — LA SONDE DU RETOUR (`?sonde-retour=1`). Elle
        mesure le cache de navigation sur le vrai iPhone et ne corrige
        rien. Pour la retirer : cette ligne, son import, et le fichier
        src/components/SondeRetour.tsx. */}
    <SondeRetour
      secFetchDest={secFetchDest}
      enDeveloppement={process.env.NODE_ENV !== "production"}
    />
    <div
      // Marqueur du fond sombre — il double la règle CSS de
      // `globals.css`. La vraie garantie est le script plus bas, qui
      // écrit la couleur en dur sur `<html>` : dans Chromium la règle
      // CSS suffisait, sur iPhone non, et on ne parie plus dessus.
      // C'EST AUSSI LUI QUE VISE LA PAGE DE RECHERCHE : tant qu'elle
      // est ouverte, cette enveloppe — et donc tout le site — quitte
      // le flux, pour que le document n'appartienne plus qu'à elle.
      data-fond="sombre"
      className="min-h-screen flex flex-col bg-sombre-fond text-sombre-texte"
    >
      {/* TOUT CE QUI DOIT ÊTRE DÉCIDÉ AVANT LA PREMIÈRE PEINTURE —
          l'appareil, le fond anthracite, la reprise de session et la
          position de défilement. Script BLOQUANT : il s'exécute pendant
          l'analyse du HTML, avant le moindre pixel. Voir
          src/lib/script-avant-peinture.ts, qui explique pourquoi chacun
          de ces quatre points ne peut PAS être traité plus tard —
          c'était la page fantôme d'une seconde et la descente visible
          jusqu'à la bonne position. */}
      <script dangerouslySetInnerHTML={{ __html: scriptAvantPeinture() }} />
      {/* Une fiche ouverte sans historique derrière elle (navigateur
          fermé puis rouvert, lien partagé) reconstruit son étape de
          retour : le balayage depuis le bord ramène à la mosaïque au
          lieu de ne rien faire. N'affiche rien. */}
      <RetourGaranti />
      {/* Chaque navigation ouvre sa page TOUT EN HAUT (n'affiche rien,
          voir le composant pour la cause du bug qu'il corrige). */}
      <DefilementEnHaut />
      {/* LA GARDE DE SAISIE (passe nº 116) : pendant qu'un formulaire
          est en cours, TOUT lien qui quitterait la page — logo, menu,
          barre fixe, pied de page — ouvre d'abord la fenêtre
          « Modifications non enregistrées ». Inerte partout ailleurs. */}
      <GardeSaisie />
      <FournisseurSession utilisateur={utilisateur}>
        {/* LES CŒURS DÉJÀ POSÉS (passe nº 137) — une seule demande par
            page, qui allume d'un coup toute la mosaïque. Il n'affiche
            rien ; sans session, il ne demande même pas. */}
        <ChargeurFavoris />
        <FournisseurStyles styles={stylesAjoutes}>{children}</FournisseurStyles>
      </FournisseurSession>

      {/* LE PIED DE PAGE — refondu à la charte (passe nº 138).
          ⚠️ LE TRAIT DE SÉPARATION A DISPARU : c'était le dernier
          contour du site. Le pied se dit désormais comme tout le
          reste, PAR SON FOND — un cran plus clair que la page, d'un
          bord à l'autre de l'écran.

          LA HIÉRARCHIE, enfin : la MARQUE en blanc doux, son slogan en
          gris dessous — deux lignes, deux voix — puis les liens dans
          un seul et même traitement (gris doux, blanc au survol).
          L'ancienne ligne unique « YokoFolio — slogan. » mêlait tout
          au même gris que les liens : rien ne se détachait.

          SMARTPHONE : tout centré et empilé — la marque, puis les
          liens espacés régulièrement. ⚠️ LE BAS RESTE COURT (leçon de
          la passe nº 134, jamais confirmée sur l'iPhone du
          propriétaire) : 24 px sous les liens, plus la marge de
          sécurité des écrans à encoche — la page ne finit pas sur du
          vide.
          WEB : la marque à gauche, les liens à droite, alignés sur la
          ligne de base de la marque. */}
      <footer className="mt-auto bg-sombre-carte">
        <div
          className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                     pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-9
                     flex flex-col items-center gap-6 text-center
                     sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-3 sm:text-left"
        >
          <p className="leading-snug">
            <span className="block text-[14px] font-semibold text-sombre-texte">
              {MARQUE_YOKOFOLIO.nom}
            </span>
            <span className="mt-1 block text-[12.5px] text-sombre-texte-doux">
              {MARQUE_YOKOFOLIO.slogan}.
            </span>
          </p>
          {/* Discrets, mais TOUJOURS accessibles : les mentions légales
              sont obligatoires et doivent être joignables de n'importe
              quelle page. */}
          <nav
            aria-label="Liens du pied de page"
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3
                       text-[13px] text-sombre-texte-doux
                       sm:ml-auto sm:justify-end sm:gap-x-6 sm:gap-y-2"
          >
            <Link
              href="/qui-sommes-nous"
              className="hover:text-sombre-texte transition-colors"
            >
              Qui sommes-nous
            </Link>
            <Link
              href="/contact"
              className="hover:text-sombre-texte transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/mentions-legales"
              className="hover:text-sombre-texte transition-colors"
            >
              Mentions légales
            </Link>
            {/* LE COMPTE INSTAGRAM DU SITE — dernier de la ligne.
                ⚠️ L'ICÔNE EST CELLE DU PROPRIÉTAIRE (nº 141-§8) :
                public/icone-instagram.png, le glyphe noir affiché tel
                quel et éclairci par `invert` + opacité (le fichier
                n'est jamais retouché — c'est la règle de toutes ses
                images). Elle est posée dans un CERCLE GRIS un cran
                plus clair, pour se détacher du fond du pied.
                Nouvel onglet : on quitte le site, on ne l'abandonne
                pas. `noreferrer` va avec `_blank` — la page ouverte ne
                doit pas garder la main sur la nôtre. */}
            <a
              href={COMPTES_YOKOFOLIO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2
                         hover:text-sombre-texte transition-colors"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center
                           rounded-full bg-sombre-eleve"
              >
                {/* eslint-disable-next-line @next/next/no-img-element --
                    icône déposée par le propriétaire, affichée telle
                    quelle (le filtre CSS ne modifie pas le fichier). */}
                <img
                  src="/icone-instagram.png"
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 invert opacity-75"
                />
              </span>
              Instagram
            </a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
