"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CLE = "roswel:cookies-info-vue";

/**
 * BANDEAU D'INFORMATION COOKIES (RGPD, §20)
 * -----------------------------------------
 * Roswel n'utilise QUE des cookies essentiels (rester connecté) :
 * pas de publicité, pas de traçage. Ces cookies-là ne demandent pas
 * de consentement — le bandeau informe, en toute transparence.
 * (Si un jour des outils de mesure d'audience sont ajoutés, il
 * faudra le transformer en vrai choix accepter/refuser.)
 */
export function BandeauCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dejaVu = true;
    try {
      dejaVu = localStorage.getItem(CLE) === "oui";
    } catch {
      // stockage indisponible : on n'insiste pas
    }
    if (!dejaVu) {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  if (!visible) return null;

  function fermer() {
    try {
      localStorage.setItem(CLE, "oui");
    } catch {
      // tant pis, le bandeau reviendra
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-3"
    >
      <div className="max-w-[730px] mx-auto rounded-3xl border border-bordure bg-fond shadow-lg p-4 flex flex-col gap-3">
        <p className="text-sm">
          Roswel n&apos;utilise que des cookies <strong>essentiels</strong>{" "}
          (rester connecté). Pas de publicité, pas de traçage.{" "}
          <Link
            href="/confidentialite"
            className="text-primaire underline underline-offset-2"
          >
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={fermer}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[44px] text-sm transition-colors"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
