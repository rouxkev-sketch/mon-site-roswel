"use client";

import { useState } from "react";

/**
 * L'INVITATION À NOTER (passerelle avis, §7)
 * ------------------------------------------
 * Aucun avis n'est stocké sur Roswel. Après un échange avec un
 * artisan, le particulier peut toucher les étoiles : cela ouvre
 * directement la fenêtre « écrire un avis » de la fiche GOOGLE de
 * l'artisan. Google gère tout (authenticité, modération, litiges).
 */
export function InvitationAvisGoogle({
  nomArtisan,
  placeId,
}: {
  nomArtisan: string;
  placeId: string;
}) {
  const [survolee, setSurvolee] = useState(0);

  function noter() {
    window.open(
      `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`,
      "_blank",
      "noopener"
    );
  }

  return (
    <div className="rounded-2xl border border-bordure bg-fond-doux p-4 text-center">
      <p className="text-sm font-semibold">
        Intervention terminée&nbsp;? Partagez votre expérience
      </p>
      <p className="text-xs text-encre-douce mt-0.5">
        Votre avis sera publié sur la fiche Google de {nomArtisan}.
      </p>
      <div className="flex justify-center gap-1 mt-2.5">
        {[1, 2, 3, 4, 5].map((etoile) => (
          <button
            key={etoile}
            type="button"
            aria-label={`Donner ${etoile} étoile${etoile > 1 ? "s" : ""} sur Google`}
            onClick={noter}
            onPointerEnter={() => setSurvolee(etoile)}
            onPointerLeave={() => setSurvolee(0)}
            className="w-11 h-11 text-2xl leading-none active:scale-90 transition-transform"
          >
            <span aria-hidden>{etoile <= survolee ? "⭐" : "☆"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
