import { COULEURS, MARQUE } from "@/config/roswel";

/**
 * LOGO PROVISOIRE (placeholder)
 * -----------------------------
 * Dessiné en attendant le fichier image définitif : carré arrondi
 * rose à dégradé + coche blanche, comme la maquette.
 *
 * Quand le vrai logo sera fourni :
 *  1. déposer le fichier dans /public (ex. /public/logo.png)
 *  2. remplacer le contenu de ce composant par une balise <Image>
 * Le reste du site n'aura pas besoin de changer.
 */

// L'icône seule : carré arrondi + coche
export function LogoIcone({ taille = 40 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 512 512"
      role="img"
      aria-label={`Logo ${MARQUE.nom}`}
    >
      <defs>
        <linearGradient id="rw-degrade" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={COULEURS.degradeDebut} />
          <stop offset="1" stopColor={COULEURS.degradeFin} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#rw-degrade)" />
      <path
        d="M136 270 L224 354 L376 176"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="58"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Le logo complet : icône + nom « roswel » en minuscules
export function LogoComplet({ tailleIcone = 36 }: { tailleIcone?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoIcone taille={tailleIcone} />
      <span
        className="font-semibold tracking-tight text-encre"
        style={{ fontSize: tailleIcone * 0.82 }}
      >
        {MARQUE.nomLogo}
      </span>
    </span>
  );
}
