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
 * L'en-tête et le pied de page BLANCS du produit artisans sont écartés
 * pour ces adresses par CadreSitePublic (src/components) : ils vivent
 * dans la mise en page racine, une mise en page imbriquée ne peut donc
 * pas les remplacer — il faut décider à la racine.
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
import { SondeRetour } from "@/components/SondeRetour";
import { IconeInstagram } from "@/components/Icones";
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

      {/* LE PIED DE PAGE — deux mises en page, un seul contenu.
          SMARTPHONE (< 640 px) : tout est CENTRÉ et empilé — la marque,
          puis les liens sur leur propre ligne, espacés régulièrement.
          ⚠️ LE BAS EST RESSERRÉ (passe nº 134) : après la ligne des
          liens, la page se terminait sur 40 px de vide — la dernière
          chose qu'on voyait était une marge. 24 px suffisent à
          détacher les liens du bord ; le haut passe à 32 px et
          l'écart marque → liens à 20 px, pour que l'ensemble reste
          équilibré sans finir sur du vide.
          WEB (≥ 640 px) : la présentation d'origine, inchangée — la
          marque à gauche, les liens à droite, sur une ligne. */}
      <footer className="border-t border-sombre-bordure mt-auto">
        <div
          className="mx-auto w-full max-w-[1760px] px-4 sm:px-6 text-[13px] text-sombre-texte-doux
                     pt-8 pb-6 flex flex-col items-center gap-5 text-center
                     sm:py-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:text-left"
        >
          <p>
            {MARQUE_YOKOFOLIO.nom} — {MARQUE_YOKOFOLIO.slogan}.
          </p>
          {/* Discrets, mais TOUJOURS accessibles : les mentions légales
              sont obligatoires et doivent être joignables de n'importe
              quelle page. */}
          <nav
            aria-label="Liens du pied de page"
            className="flex flex-wrap justify-center gap-x-10 gap-y-3
                       sm:ml-auto sm:justify-end sm:gap-x-5 sm:gap-y-2"
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
            {/* LE COMPTE INSTAGRAM DU SITE — dernier de la ligne, dans
                le MÊME traitement que ses voisins : gris doux, blanc au
                survol. L'icône est prise en `monochrome` pour cela : le
                dégradé officiel, à côté de trois liens gris, aurait
                fait tache dans un pied de page qui se veut discret.
                Nouvel onglet : on quitte le site, on ne l'abandonne
                pas. `noreferrer` va avec `_blank` — la page ouverte ne
                doit pas garder la main sur la nôtre. */}
            <a
              href={COMPTES_YOKOFOLIO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5
                         hover:text-sombre-texte transition-colors"
            >
              <IconeInstagram taille={15} monochrome />
              Instagram
            </a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
