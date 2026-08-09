import Link from "next/link";
import { CHEMINS_AGENCE, PIED_AGENCE } from "@/config/agence";
import { MARQUE } from "@/config/roswel";
import { LogoComplet } from "@/components/Logo";

/**
 * LE PIED DE PAGE
 * ================
 * Gris très léger, sobre, franchement séparé du blanc de la page —
 * la façon dont Apple termine ses pages : on comprend qu'on est
 * arrivé au bas sans qu'un trait ait besoin de le dire.
 *
 * Un seul trait, tout en bas, entre les liens et la ligne de
 * copyright : c'est assez.
 */
export function PiedAgence() {
  return (
    <footer className="mt-24 sm:mt-32 bg-[#F5F5F7]">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
          <div className="max-w-sm">
            <Link
              href={CHEMINS_AGENCE.accueil}
              aria-label="Accueil Roswel"
              className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primaire"
            >
              <LogoComplet tailleIcone={36} classe="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-[15px] leading-relaxed text-black/55">
              {PIED_AGENCE.accroche}
            </p>
          </div>

          <nav aria-label="Liens légaux">
            <ul className="flex flex-col gap-3.5">
              {PIED_AGENCE.liens.map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className="text-[15px] text-black/65 hover:text-primaire transition-colors
                               rounded focus-visible:outline-2 focus-visible:outline-offset-4
                               focus-visible:outline-primaire"
                  >
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 pt-7 border-t border-black/10 text-[13px] text-black/40">
          © {new Date().getFullYear()} {MARQUE.nom}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
