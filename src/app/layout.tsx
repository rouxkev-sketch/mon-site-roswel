import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CHARTE_CLAIRE } from "@/config/charte";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { variablesCssCouleurs } from "@/lib/theme";
import { DesinscriptionServiceWorker } from "@/components/DesinscriptionServiceWorker";
import { FiletDeReparation } from "@/components/FiletDeReparation";
import { DefinitionsIcones } from "@/components/Icones";
import { MemoireNavigation } from "@/components/MemoireNavigation";
import { GardeDesNavigations } from "@/components/GardeDesNavigations";
import "./globals.css";

// Police du site (moderne et très lisible sur mobile)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Informations affichées par les navigateurs et les moteurs de recherche
export const metadata: Metadata = {
  // L'adresse publique du site (sert aux liens absolus du référencement).
  // Passe par adresseDuSite() : jamais « localhost » en production —
  // repli sur le domaine du fichier de réglages + alerte explicite
  // si NEXT_PUBLIC_SITE_URL manque (voir src/lib/site.ts).
  metadataBase: new URL(adresseDuSite()),
  // LE TITRE D'ONGLET DE TOUT LE SITE.
  // ⚠️ PAS DE GABARIT DE MARQUE ICI (« %s · … ») : un gabarit posé à la
  // racine s'applique AUSSI au titre par défaut des produits en
  // dessous. Yokofolio annonçait donc « yokofolio — … · <ancien nom> »
  // dans l'onglet, malgré ses propres métadonnées. Chaque produit pose
  // son gabarit dans SA mise en page ; « %s » ne fait que laisser
  // passer le titre tel quel.
  title: {
    default: `${MARQUE_YOKOFOLIO.nom} — ${MARQUE_YOKOFOLIO.slogan}`,
    template: "%s",
  },
  description: TEXTES_TATOUAGE.descriptionSite,
  applicationName: MARQUE_YOKOFOLIO.nom,
  openGraph: {
    siteName: MARQUE_YOKOFOLIO.nom,
    type: "website",
    locale: "en_US",
  },
  // Réglages pour l'écran d'accueil des iPhone (mode application)
  appleWebApp: {
    capable: true,
    title: MARQUE_YOKOFOLIO.nom,
    statusBarStyle: "default",
  },
  // L'ICÔNE D'ONGLET DE TOUT LE SITE — le cœur de yokofolio.
  // Elle est posée ICI, à la racine, et pas seulement sur les pages de
  // yokofolio : un navigateur mémorise l'icône PAR ADRESSE DE SITE. Il
  // suffisait qu'une page en serve une autre pour que celle-ci revienne
  // dans l'onglet, même sur l'accueil.
  icons: {
    icon: [{ url: MARQUE_YOKOFOLIO.iconeOnglet, type: "image/png" }],
    shortcut: MARQUE_YOKOFOLIO.iconeOnglet,
    apple: [{ url: MARQUE_YOKOFOLIO.icone }],
  },
};

/*  Réglages d'affichage mobile (couleur de la barre du navigateur).
    ⚠️ CE BLANC N'EST PRESQUE JAMAIS CELUI QU'ON VOIT : le groupe
    (tatouage) déclare le sien (`COULEURS_SOMBRE.fond`, le bleu nuit),
    et il gagne sur toutes ses pages. Il ne reste donc que les deux
    pages sans groupe — la page introuvable et le tableau de bord des
    sondes. Mesuré à la nº 761 : barre BLANCHE sur la page introuvable,
    qui est pourtant sombre. C'est un reste du produit artisans, laissé
    tel quel parce que le changer changerait l'aspect du site — la
    question est posée au propriétaire. */
export const viewport: Viewport = {
  themeColor: CHARTE_CLAIRE.fond,
  width: "device-width",
  initialScale: 1,
};

/**
 * ⚠️ CETTE MISE EN PAGE NE PORTE PLUS AUCUN HABILLAGE DE PRODUIT
 * (passe nº 145-§1). Elle ne contient que ce qui appartient VRAIMENT à
 * tout le monde : la balise <html>, la police, les couleurs, le
 * journal de navigation et le mode application.
 *
 * L'en-tête blanc, le pied de page et le bandeau cookies du produit
 * ARTISANS vivaient ici et s'appliquaient donc partout par défaut ;
 * une liste d'adresses tenue à la main devait ensuite les retirer des
 * pages de yokofolio — et trois adresses nées après cette liste
 * (/my-favorites, /after-login, /join/<jeton>) n'y figuraient
 * pas : elles affichaient la barre fixe de l'ancien produit. L'habillage
 * est descendu dans la mise en page du groupe (artisans) — groupe
 * SUPPRIMÉ à la passe nº 760, avec cet habillage. La racine ne porte
 * donc plus rien, et il n'y a plus qu'un habillage à poser.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //  nº 357 — PLUS AUCUNE LECTURE DE REQUÊTE ICI : une seule ligne de
  //  cookies dans la racine rendait TOUT le site dynamique — la cause
  //  signée des éjections (verdict nº 356). Le nu total (nº 354) se
  //  décide désormais côté client, dans les deux composants ci-dessous.
  return (
    // `suppressHydrationWarning` : le détecteur d'appareil de yokofolio
    // (src/app/(tatouage)/layout.tsx) pose `data-appareil` sur <html>
    // AVANT que React ne compare la page au HTML du serveur. Sans cette
    // ligne, React signale ce décalage d'attribut à chaque chargement
    // (le badge « 1 Issue » en développement). L'avertissement n'est
    // coupé QUE sur cette balise-ci, pour ce cas voulu et documenté.
    //
    // `data-scroll-behavior="smooth"` : le site déclare un défilement
    // doux global (html { scroll-behavior: smooth }, pour les ancres du
    // site vitrine). Depuis Next 16, le routeur ne NEUTRALISE PLUS ce
    // réglage pendant ses navigations : chaque remise en haut de page
    // (ouvrir une fiche, revenir en arrière…) devenait une ANIMATION,
    // que le premier rendu interrompait à quelques pixels du but — les
    // pages s'ouvraient « légèrement remontées ». Cet attribut demande
    // à Next de repasser en défilement immédiat LE TEMPS de ses
    // navigations, comme avant ; les ancres gardent leur douceur.
    <html
      lang="en"
      /*  ██ §1 (nº 853) — LA TRADUCTION AUTOMATIQUE EST INTERDITE ██
          SIXIÈME SIGNALEMENT du propriétaire : le bandeau « traduire
          cette page » de Chrome revient à chaque aller-retour entre
          fiches, au doigt. La nº 852 avait fermé le trou du `lang`
          manquant (la page d'erreur de Next) ; le bandeau, lui, reste —
          Chrome ne juge pas seulement sur le `lang` déclaré, il LIT la
          page, et un portfolio plein de noms de villes et de styles
          français lui suffit à proposer sa traduction.
          LE PROPRIÉTAIRE TRANCHE : on l'interdit. Deux écritures, et
          les deux sont les écritures officielles de Chrome :
           · `notranslate` SUR LA RACINE — la classe que le moteur de
             traduction lit avant tout le reste ;
           · la balise `<meta name="google" content="notranslate">`,
             juste en dessous, dans l'en-tête de TOUTES les pages (elle
             vit dans la mise en page racine, il n'y en a pas deux).
          ⚠️ RIEN NE PEUT L'EFFACER AU RENDU CLIENT : aucune ligne du
          site n'écrit `className` ni `classList` sur `<html>` (vérifié
          — le script d'avant peinture n'y pose que des ATTRIBUTS de
          données et un style), et React ne réécrit pas une classe qu'il
          a lui-même rendue. La page d'erreur globale, elle, porte les
          deux à son tour (app/global-error).
          ⚠️ CE N'EST PAS UNE PERTE POUR LE VISITEUR ÉTRANGER : le menu
          « Traduire » du navigateur reste accessible à la main ; c'est
          la PROPOSITION automatique qui s'arrête. */
      className={`notranslate ${geistSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/*  §1 (nº 853) — L'INTERDICTION, EN TOUTES LETTRES (voir la
             note de la racine, juste au-dessus). */}
        <meta name="google" content="notranslate" />
        {/* Injecte les couleurs du fichier de réglages central dans la
            page. L'identifiant est NEUTRE : cette feuille sert les
            trois produits (artisans, agence, yokofolio) — un nom de
            marque y était la dernière trace lisible dans le code
            source des pages de yokofolio. */}
        <style
          id="variables-couleurs"
          dangerouslySetInnerHTML={{ __html: variablesCssCouleurs() }}
        />
      </head>
      {/* Le fond est piloté par globals.css : blanc pur sur smartphone,
          gris très clair dès 768 px (les cartes et la fiche restent
          blanches et flottent dessus). */}
      <body className="min-h-full flex flex-col text-encre">
        {/* Dégradés SVG partagés (icône Instagram…), définis une
            seule fois hors de tout sous-arbre masqué */}
        <DefinitionsIcones />
        {/* L'HABILLAGE SE POSE DANS LA MISE EN PAGE DU GROUPE, jamais
            ici : (tatouage) porte le fond sombre et son pied discret.
            Les deux autres groupes — (artisans) et (agence) — ont été
            supprimés à la passe nº 760. La racine, elle, n'impose
            rien à personne. */}
        {children}
        {/* Journal de navigation (bouton retour de la fiche) */}
        <MemoireNavigation />
        {/*  §1 (nº 441, refondu nº 706) — la garde des navigations :
            l'avalement du re-clic (332-§1) et l'exemption des liens
            qui ne naviguent pas (nº 627). Le TRAIT de chargement
            qu'elle portait est supprimé (nº 706) — l'attente se dit
            désormais par les squelettes des pages. Elle porte sa
            propre frontière <Suspense> — le prérendu de « / » ne lui
            doit rien. */}
        <GardeDesNavigations />
        {/*  §1 (nº 791) — LE SERVICE WORKER EST RETIRÉ (enquête nº 738).
            Ces deux composants n'affichent rien :
             · le premier RETIRE le programme d'arrière-plan que les
               navigateurs des visiteurs ont encore, et vide ses caches.
               Il est TEMPORAIRE : ne plus enregistrer ne désinstalle
               rien, il faut désinscrire — voir son fichier ;
             · le second est LE FILET DE RÉPARATION (nº 546), et il n'a
               jamais dépendu du service worker : il rattrape un
               document ancien qui réclame des morceaux de programme
               d'une mise en ligne périmée. C'est LUI la protection des
               mises en ligne côté visiteur, et il reste. */}
        <DesinscriptionServiceWorker />
        <FiletDeReparation />
      </body>
    </html>
  );
}
