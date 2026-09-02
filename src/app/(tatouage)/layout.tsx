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
 * PLUS atteindre ces adresses (passe nº 145-§1) : ils étaient d'abord
 * descendus de la mise en page racine — où ils s'appliquaient partout
 * par défaut — dans celle de LEUR groupe, puis ce groupe entier a été
 * SUPPRIMÉ à la passe nº 760.
 *
 * ⚠️ IL N'Y A PLUS D'AUTRE PRODUIT DANS CE CODE (nº 760). Les fichiers
 * des artisans et de l'agence n'y sont plus ; leurs adresses rendent
 * la page introuvable. Yokofolio est seul.
 */

import type { Metadata, Viewport } from "next";
import {
  COULEURS_SOMBRE,
  MARQUE_YOKOFOLIO,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { DefilementEnHaut } from "@/components/DefilementEnHaut";
import { IconeDuLien } from "@/components/IconeReseau";
import { LienAuGeste } from "@/components/LienAuGeste";
import { ChargeurFavoris } from "@/components/ChargeurFavoris";
import { FournisseurSession } from "@/components/FournisseurSession";
import { FournisseurStyles } from "@/components/FournisseurStyles";
import { JournalDeBord } from "@/components/JournalDeBord";
import { GardeAvatars } from "@/components/GardeAvatars";
import { GardeSaisie } from "@/components/GardeSaisie";
//  §1 (nº 799) — la copie rend du texte, sur TOUT le site.
import { CopieTexteNu } from "@/components/CopieTexteNu";
import { RetourGaranti } from "@/components/RetourGaranti";
import { scriptAvantPeinture } from "@/lib/script-avant-peinture";
import { chargerStylesAjoutes } from "@/lib/styles-ajoutes";
import { SondeNavigation } from "@/components/SondeNavigation";
import { VoileDeLaPage } from "@/components/VoileDeLaPage";
//  §1 (nº 679) — la sonde de vitesse : `?sonde-vitesse=1`. Éteinte,
//  elle rend `null` ET n'arme pas son module — pas un écouteur.
import { SondeVitesse } from "@/components/SondeVitesse";
import { COMPTES_YOKOFOLIO } from "@/config/tatouage";
//  nº 811/814 — les adresses des pages éditoriales, écrites une fois.
import {
  CHEMIN_ABOUT,
  CHEMIN_CONTACT,
  CHEMIN_LEGAL,
  CHEMIN_TERMS,
} from "@/lib/chemins-editoriaux";

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
    locale: "en_US",
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
  /*  ██ nº 357 — CETTE MISE EN PAGE NE LIT PLUS LA REQUÊTE ██
      Le verdict de la nº 356 (trois jours d'épreuves sur le téléphone
      du propriétaire) : le RENDU DYNAMIQUE est la cause des éjections
      de retour sur Chrome iPhone. Or une seule lecture de cookies ou
      d'en-têtes ICI rendait TOUTES les pages du groupe dynamiques.
      Ce qui a déménagé, et où :
       · LA SESSION — plus lue au serveur : la barre s'amortit par le
         script d'avant peinture + la garde CSS (`data-compte`,
         globals.css) — aucun état faux peint, promesse nº 203 tenue
         autrement (voir EnTeteTatouage et FournisseurSession) ;
       · `sec-fetch-dest` (sonde du retour) et LE NU TOTAL (nº 354)
         — deux instruments de banc, tous deux retirés à la nº 790 :
         leur verdict est rendu. */
  const utilisateur = null;
  // LE DRAPEAU « DÉJÀ CONNECTÉ SUR CE NAVIGATEUR » (nº 203-§1a) — un
  // cookie, donc lisible ICI : le bouton « Se connecter » de la barre
  // est juste dès le HTML, sans correction après l'hydratation.


  /*  LE CATALOGUE DES STYLES, RELU AU RENDU (passe nº 122). Les styles
      nés d'une suggestion acceptée vivent en base ; ils sont posés ici,
      dans le registre du fichier de réglages, et transmis au navigateur
      juste en dessous, pour qu'il dise la même chose. Jamais bloquant :
      base injoignable, on garde les quarante et un du code.
      ██ §1 (nº 673) — CETTE NOTE DISAIT UNE CHOSE FAUSSE, ET ELLE A
      COÛTÉ QUATRE PASSES ██
      ------------------------------------------------------------------
      ELLE AFFIRMAIT : « posés ici AVANT que la moindre page du groupe ne
      se rende ». C'EST FAUX, et c'est la cause du défaut des styles.
      Dans l'App Router, une MISE EN PAGE et sa PAGE se rendent EN
      PARALLÈLE — c'est même le principe : les segments sont des frères
      dans l'arbre, rendus concurremment pour qu'aucun n'attende l'autre.
      Rien ne garantit que ce `await` finisse avant que la page n'aille
      lire le registre.
      CE QUE ÇA DONNAIT : une page de recherche rendue pendant cette
      lecture voyait un registre VIDE, n'y trouvait pas « neo-japonais »
      (un style né d'une suggestion), le JETAIT, et servait « Toutes les
      réalisations ». Intermittent par nature — il fallait une instance
      froide ou une base lente.
      CE QUI CHANGE ICI : rien. Cette ligne reste, et elle sert toujours
      à DEUX choses (remplir le registre pour le reste de la mise en
      page, et transmettre la liste au navigateur). C'est LA PAGE qui
      attend désormais son catalogue elle-même — voir le §1 de la
      nº 673 dans `_accueil/rendu.tsx`. Les deux appels ne font qu'une
      requête : la fonction déduplique et met en cache. */
  const stylesAjoutes = await chargerStylesAjoutes();

  return (
    <>
    {/* LE JOURNAL DE BORD (nº 272-§2) — PERMANENT, lui : le témoin
        qui survit à l'écran noir. Il note côté serveur (fichier
        journal-de-bord.ndjson — voir la route, désormais réservée au
        compte admin) les chargements, navigations, erreurs et bascules
        de session, au fil de l'eau ; et son coupe-circuit arrête les
        boucles de redirection au lieu de laisser le site clignoter
        jusqu'à mourir. Aucun rendu, aucun effet sur le site.
        ⚠️ IL RESTE APRÈS LE MÉNAGE DE LA nº 790, et c'est délibéré : il
        ne vise AUCUN défaut précis (il enregistre tout ce qui arrive),
        et il est le SEUL à dire ce que le serveur voyait au même
        instant. Il s'allume au tableau de bord `/dev`. */}
    <JournalDeBord />
    {/*  §2 (nº 293) — LE VOILE DE LA PAGE. Monté une seule fois pour
        tout le site tatouage : il ne rend rien tant qu'aucune fenêtre
        ni aucun menu ne l'a demandé, et il vit dans un PORTAIL au
        corps du document — donc frère des plaques de verre, jamais
        leur ancêtre (le piège du nº 234).
        HORS de l'enveloppe `data-fond`, comme les sondes. */}
    <VoileDeLaPage />
    {/* ██ §3 (nº 790) — CE QUI VIVAIT ICI, ET QUI EST PARTI ██
        ------------------------------------------------------------
        Douze sondes se montaient à cet endroit, chacune posée pour UN
        défaut précis, et chacune ayant rendu son verdict depuis :
        clavier (734-736), filtres (167), verre (169), bascule (173),
        carrousel (218), cartes (224), remontée (330), historique
        (331), clic (335), retour, boîte noire et ses deux témoins
        (654-670). Leur liste « CHANTIERS OUVERTS — À RETIRER AVANT LA
        MISE EN LIGNE » vivait dans lib/navigation-session ; elle est
        soldée. Le rapport de la passe dit qui part et pourquoi.
        IL EN RESTE DEUX, et pour la même raison toutes les deux :
        elles ne visent aucun défaut, ce sont des INSTRUMENTS DE MESURE
        que les passes suivantes (les préchargements) vont employer. Elles n'affichent rien tant qu'on ne les arme pas. */}
    {/* ⚠️ LA SONDE DE NAVIGATION (`?sonde-nav=1`). Elle MESURE chez le
        propriétaire (retour arrière, barre fixe, remontée des champs)
        et ne corrige rien. HORS de l'enveloppe `data-fond`, comme la
        sonde de vitesse : la page de recherche la ferait disparaître
        au moment de lire. */}
    <SondeNavigation />
    {/*  §1 (nº 679) — LA SONDE DE VITESSE (`?sonde-vitesse=1`), ici
         pour la même raison : elle doit couvrir TOUTES les pages du
         groupe, donc vivre dans la mise en page. Éteinte, elle rend
         `null` avant tout et n'arme rien. */}
    <SondeVitesse />
    {/*  ██ §1 (nº 799) — LA COPIE REND DU TEXTE, PARTOUT ██
         La nº 798 a posé ce garde sur la seule page « Qui sommes-nous ».
         Or le défaut n'a jamais été à elle : le fond sombre est posé
         sur l'enveloppe du site juste en dessous, et c'est LUI que le
         navigateur recopiait dans le presse-papiers, avec la taille
         des titres. Le propriétaire l'a revu sur « Mentions légales » ;
         il l'aurait vu sur n'importe quelle page.
         Il monte donc ICI, à la racine du groupe : une seule écriture
         pour tout le site (piège nº 378), et l'exception des champs de
         saisie vaut du même coup partout — un copier-coller depuis un
         champ garde le comportement du navigateur.
         ⚠️ IL NE REND RIEN et n'ajoute aucune règle de style : la
         feuille CSS ne bouge pas. La note complète est chez lui. */}
    <CopieTexteNu />
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
      {/*  ██ §4 (nº 466) — LE ROSE RAVIVÉ, POUR CE PRODUIT SEUL ██
           Les trois variables `--rw-primaire*` sont SURCHARGÉES ici
           avec les valeurs de la charte tatouage (COULEURS_SOMBRE —
           le rouge #E11144 sur le bleu nuit depuis la nº 762, voir la
           note du jeton). Le
           `:root` du <head> (variables-couleurs, layout racine) garde
           les valeurs de la couche claire (config/charte.ts, nº 761) :
           ce <style> venant APRÈS dans le document, il gagne à
           spécificité égale — mais UNIQUEMENT sur les pages qui rendent
           ce layout. ⚠️ IL RESTE DEUX PAGES SANS GROUPE — la page
           introuvable et le tableau de bord des sondes : elles gardent
           le rose clair, mesuré à la nº 761. Rendu par le serveur,
           avant tout contenu : aucun éclair de l'ancienne couleur
           (nº 439). `primaire-clair` n'est pas surchargé — il ne sert
           que des fonds clairs, hors de ce produit. */}
      <style
        id="rose-tatouage"
        dangerouslySetInnerHTML={{
          __html:
            `:root{--rw-primaire:${COULEURS_SOMBRE.primaire};` +
            `--rw-primaire-fonce:${COULEURS_SOMBRE.primaireFonce};` +
            `--rw-primaire-voile:${COULEURS_SOMBRE.primaireVoile};}`,
        }}
      />
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
      {/* LA GARDE DES AVATARS (passe nº 739) : un avatar dont le
          fichier n'arrive pas ENTIER n'est jamais laissé à l'écran en
          moitié de photo — une reprise qui contourne les caches, sinon
          le repli « sans photo ». N'affiche rien. */}
      <GardeAvatars />
      <FournisseurSession utilisateur={utilisateur} pretServeur={false}>
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
            aria-label="Footer links"
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3
                       text-[13px] text-sombre-texte-doux
                       sm:ml-auto sm:justify-end sm:gap-x-6 sm:gap-y-2"
          >
            {/*  ██ §1 (nº 793) — LE PIED DE PAGE NE PRÉCHARGE PLUS ██
                 ------------------------------------------------------
                 MESURÉ AVANT DE TOUCHER À QUOI QUE CE SOIT : sur CHAQUE
                 page du site, ces trois liens partaient chercher leur
                 page à l'avance — et pas une fois, quatre à six fois
                 chacun. Quatorze requêtes par page vue, pour trois
                 pages où personne ne va en cherchant un tatoueur.
                 C'était la moitié du gaspillage relevé à l'enquête
                 nº 740 (« le pied de page ~4 »).
                 ⚠️ CE QU'ON PERD, ET C'EST TOUT : un aller-retour de
                 réseau au clic, sur trois pages qu'on ouvre une fois
                 dans sa vie. Le lien fonctionne exactement pareil.
                 ⚠️ LE PRÉCHARGEMENT DES CARTES N'EST PAS CONCERNÉ : lui
                 est vital (nº 744), et il ne se règle pas ici.
                 ██ nº 811 — LE GESTE PRÉCHARGE, LE CLIC TIRE LE RIDEAU ██
                 La règle de la nº 793 tient : rien n'est demandé à
                 l'entrée dans la vue (mesuré : 0 requête). Mais ces
                 trois pages ont reçu leur rideau (`loading.tsx`,
                 nº 811), et un rideau ne peut tomber que si le routeur
                 tient déjà la page — sinon elle paraît d'un coup au
                 bout de l'aller-retour, écran figé pendant ce temps
                 (mesuré). `LienAuGeste` : au survol ou au focus
                 clavier, la page se met en réserve (trois requêtes,
                 une fois) et paraît au clic sans attendre ; au doigt,
                 où rien ne précède le clic, le rideau est tiré AU CLIC
                 par-dessus la page (le même que le `loading.tsx`),
                 jusqu'à l'arrivée. */}
            <LienAuGeste
              href={CHEMIN_ABOUT}
              className="hover:text-sombre-texte transition-colors"
            >
              About
            </LienAuGeste>
            <LienAuGeste
              href={CHEMIN_CONTACT}
              className="hover:text-sombre-texte transition-colors"
            >
              Contact
            </LienAuGeste>
            <LienAuGeste
              href={CHEMIN_LEGAL}
              className="hover:text-sombre-texte transition-colors"
            >
              Legal
            </LienAuGeste>
            {/*  nº 814 — LES CONDITIONS D'UTILISATION (Terms of Use),
                 quatrième page éditoriale : même lien, même règle de
                 préchargement, même rideau. */}
            <LienAuGeste
              href={CHEMIN_TERMS}
              className="hover:text-sombre-texte transition-colors"
            >
              Terms
            </LienAuGeste>
            {/* LE COMPTE INSTAGRAM DU SITE — dernier de la ligne.
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
              {/*  §1 (nº 240) — LA MÊME ÉCRITURE QUE SUR LES FICHES
                   (IconeDuLien) : le tracé dessiné dans le code, en
                   `currentColor` — il prend le gris de ce lien et son
                   survol sans un réglage. Le fichier image et le
                   disque blanc des nº 227-235 sont partis. */}
              <IconeDuLien reseau="instagram" taille={20} />
              Instagram
            </a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
