import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { COULEURS, MARQUE } from "@/config/roswel";
import { variablesCssCouleurs } from "@/lib/theme";
import { EnregistrementServiceWorker } from "@/components/EnregistrementServiceWorker";
import "./globals.css";

// Police du site (moderne et très lisible sur mobile)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Informations affichées par les navigateurs et les moteurs de recherche
export const metadata: Metadata = {
  title: {
    default: `${MARQUE.nom} — ${MARQUE.slogan}`,
    template: `%s · ${MARQUE.nom}`,
  },
  description: MARQUE.description,
  applicationName: MARQUE.nom,
  // Réglages pour l'écran d'accueil des iPhone (mode application)
  appleWebApp: {
    capable: true,
    title: MARQUE.nom,
    statusBarStyle: "default",
  },
  // L'icône du site (favicon) est le fichier src/app/icon.svg,
  // détecté automatiquement par Next.js.
  // À l'arrivée du vrai logo : ajouter aussi un PNG 180x180
  // "apple-touch-icon" pour l'écran d'accueil des iPhone.
};

// Réglages d'affichage mobile (couleur de la barre du navigateur)
export const viewport: Viewport = {
  themeColor: COULEURS.fond,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Injecte les couleurs du fichier de réglages central dans la page */}
        <style
          id="roswel-couleurs"
          dangerouslySetInnerHTML={{ __html: variablesCssCouleurs() }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-fond text-encre">
        {children}
        {/* Active le mode "application installable" (PWA) */}
        <EnregistrementServiceWorker />
      </body>
    </html>
  );
}
