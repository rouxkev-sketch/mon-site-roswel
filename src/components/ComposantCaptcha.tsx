"use client";

import { useEffect, useRef } from "react";

/**
 * VÉRIFICATION ANTI-ROBOTS INVISIBLE (étape 10)
 * ---------------------------------------------
 * Utilise Cloudflare Turnstile (l'équivalent moderne et gratuit du
 * reCAPTCHA invisible). Ne s'affiche QUE si la clé
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY est renseignée dans .env.local —
 * sans clé, le composant ne rend rien et le site fonctionne comme
 * avant (pratique en développement).
 * Activation complète : docs/ETAPE-10-COMPTE.md.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (jeton: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
    };
  }
}

export function ComposantCaptcha({
  surJeton,
}: {
  surJeton: (jeton: string | null) => void;
}) {
  const cle = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const conteneur = useRef<HTMLDivElement>(null);
  const dejaRendu = useRef(false);

  useEffect(() => {
    if (!cle || !conteneur.current || dejaRendu.current) return;
    dejaRendu.current = true;

    const rendre = () => {
      if (window.turnstile && conteneur.current) {
        window.turnstile.render(conteneur.current, {
          sitekey: cle,
          callback: (jeton) => surJeton(jeton),
          "error-callback": () => surJeton(null),
          "expired-callback": () => surJeton(null),
        });
      }
    };

    if (window.turnstile) {
      rendre();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = rendre;
    document.head.appendChild(script);
  }, [cle, surJeton]);

  if (!cle) return null;
  return <div ref={conteneur} className="min-h-[8px]" />;
}
