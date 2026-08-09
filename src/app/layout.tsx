import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { COULEURS } from "@/config/roswel";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { variablesCssCouleurs } from "@/lib/theme";
import { EnregistrementServiceWorker } from "@/components/EnregistrementServiceWorker";
import { DefinitionsIcones } from "@/components/Icones";
import { MemoireNavigation } from "@/components/MemoireNavigation";
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
    locale: "fr_FR",
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

// Réglages d'affichage mobile (couleur de la barre du navigateur)
export const viewport: Viewport = {
  themeColor: COULEURS.fond,
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
 * (/mes-favoris, /apres-connexion, /rejoindre/<jeton>) n'y figuraient
 * pas : elles affichaient la barre fixe de l'ancien produit. L'habillage
 * est descendu dans src/app/(artisans)/layout.tsx, où il ne peut plus
 * atteindre que les pages de ce groupe.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      lang="fr"
      className={`${geistSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
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
        {/* CHAQUE PRODUIT POSE SON PROPRE HABILLAGE, dans la mise en
            page de SON groupe : (artisans) l'en-tête blanc et le pied
            complet, (tatouage) le fond sombre et son pied discret,
            (agence) sa barre de site vitrine. La racine, elle,
            n'impose plus rien à personne. */}
        {children}
        {/* Journal de navigation (bouton retour de la fiche) */}
        <MemoireNavigation />
        {/* Active le mode "application installable" (PWA) */}
        <EnregistrementServiceWorker />
      </body>
    </html>
  );
}
