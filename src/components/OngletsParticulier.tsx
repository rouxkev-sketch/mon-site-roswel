import Link from "next/link";

const ONGLETS = [
  { cle: "favoris", href: "/favoris", icone: "❤️", label: "Favoris" },
  { cle: "compte", href: "/compte", icone: "👤", label: "Mon compte" },
] as const;

/**
 * LA BARRE DES ONGLETS DE L'ESPACE PARTICULIER (§14)
 * --------------------------------------------------
 * Collée en bas de l'écran (sous le pouce). Les pages qui l'affichent
 * gardent une marge basse (pb-24) pour ne rien masquer.
 */
export function OngletsParticulier({
  actif,
}: {
  actif: (typeof ONGLETS)[number]["cle"];
}) {
  return (
    <nav
      aria-label="Espace particulier"
      className="fixed bottom-0 inset-x-0 bg-fond/95 backdrop-blur border-t border-bordure"
    >
      <div className="max-w-[730px] mx-auto flex">
        {ONGLETS.map(({ cle, href, icone, label }) => (
          <Link
            key={cle}
            href={href}
            aria-current={actif === cle ? "page" : undefined}
            className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
              actif === cle
                ? "text-primaire font-semibold"
                : "text-encre-douce"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">{icone}</span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
