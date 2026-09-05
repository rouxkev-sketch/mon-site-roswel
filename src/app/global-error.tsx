"use client";

import { COULEURS_SOMBRE } from "@/config/tatouage";

/**
 * ██ nº 852-§1 — LE DOCUMENT D'ERREUR GLOBALE, ET SON `lang` ██
 * ==================================================================
 * LE DÉFAUT DIT PAR LE PROPRIÉTAIRE : sur Chrome mobile, le bandeau
 * « traduire cette page » se rouvre à chaque aller-retour entre fiches.
 * SA CAUSE PROBABLE, ET ELLE EST VÉRIFIÉE : le site n'avait PAS de page
 * d'erreur globale, et Next servait donc la sienne — un document dont
 * la balise racine est `<html id="__next_error__">`, SANS AUCUN `lang`.
 * On peut le lire dans le bâti : `.next/server/app/_global-error.html`.
 * Toute erreur globale remplaçait ainsi un document annoncé en anglais
 * par un document qui n'annonce rien, et Chrome, ne sachant plus quelle
 * langue il lit, propose de traduire. Le retour ramenait la page
 * suivante, l'aller la reperdait : le bandeau revenait à chaque fois.
 *
 * CE FICHIER FERME CE TROU : c'est LE SEUL endroit du site, avec la
 * mise en page racine, où une balise `<html>` s'écrit — et les deux
 * portent désormais le même `lang="en"`, stable.
 * ⚠️ UNE PAGE D'ERREUR GLOBALE REMPLACE LA MISE EN PAGE RACINE, tout
 * entière : ni la feuille de styles du site, ni ses variables de
 * couleurs ne sont là. Les couleurs sont donc posées EN LIGNE, et
 * lues dans la charte (`COULEURS_SOMBRE`) — aucune valeur inventée
 * ici, et rien qui dépende d'un fichier que l'erreur a peut-être
 * empêché de charger.
 * ⚠️ ELLE NE DOIT RIEN DEMANDER À LA BASE NI AU RÉSEAU : elle s'affiche
 * précisément quand quelque chose a cassé. Un titre, une phrase, un
 * bouton qui recharge — et c'est tout.
 */
export default function ErreurGlobale({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    //  §1 (nº 853) — LA MÊME INTERDICTION QUE PARTOUT : cette page-ci
    //  remplace la mise en page racine, elle doit donc porter les deux
    //  écritures elle-même (le pourquoi est écrit dans app/layout).
    <html lang="en" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: COULEURS_SOMBRE.fond,
          color: COULEURS_SOMBRE.texte,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "420px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.35 }}>
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: "12px",
              fontSize: "15px",
              color: COULEURS_SOMBRE.texteDoux,
            }}
          >
            The page could not be displayed. Try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              minHeight: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              backgroundColor: COULEURS_SOMBRE.texte,
              color: COULEURS_SOMBRE.fond,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
