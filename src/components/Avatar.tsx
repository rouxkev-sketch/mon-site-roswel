import Image from "next/image";

/**
 * La photo d'un artisan, en carré arrondi.
 * Sans photo (artisans de démonstration, fiche en cours de création),
 * on affiche ses initiales sur le dégradé de la marque — jamais de
 * case vide ni d'image cassée.
 */
export function Avatar({
  nom,
  photoUrl,
  taille = 64,
  arrondi = "rounded-2xl",
}: {
  nom: string;
  photoUrl: string | null;
  taille?: number;
  arrondi?: string; // ex. "rounded-3xl" pour les grandes cartes
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={`Photo de ${nom}`}
        width={taille}
        height={taille}
        className={`${arrondi} object-cover shrink-0`}
        style={{ width: taille, height: taille }}
      />
    );
  }

  const initiales = nom
    .split(/\s+/)
    .filter((mot) => /^[\p{L}]/u.test(mot)) // on ignore « - », « & »…
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();

  return (
    <div
      aria-hidden
      className={`${arrondi} bg-gradient-to-br from-degrade-debut to-degrade-fin text-white font-bold flex items-center justify-center shrink-0 select-none`}
      style={{ width: taille, height: taille, fontSize: taille * 0.34 }}
    >
      {initiales || "?"}
    </div>
  );
}
