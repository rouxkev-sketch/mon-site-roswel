import type { Metadata } from "next";
import Link from "next/link";
import {
  ECRITURE_TITRE_SECTION,
  MARQUE_YOKOFOLIO,
  TEXTES_TATOUAGE,
  TRAIT_SEPARATION,
} from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { LogoYokofolio } from "@/components/LogoYokofolio";

/**
 * QUI SOMMES-NOUS
 * ================
 * Adresse : /qui-sommes-nous
 *
 * §1 et §2 (nº 319) — LA PAGE EST PASSÉE À LA CHARTE, ET SON TEXTE EST
 * CELUI DU PROPRIÉTAIRE, AU MOT PRÈS (gras compris — les `<strong>`).
 * Elle ne se distingue plus du reste du site :
 *  · les trois titres sont des TITRES DE SECTION, dans l'écriture
 *    unique du site (`ECRITURE_TITRE_SECTION`, celle des fiches et de
 *    « Ma sélection ») — plus de grande typographie propre à la page ;
 *  · les sections se séparent par LE TRAIT du site (`TRAIT_SEPARATION`,
 *    nº 315-§4), avec le rythme des fiches : 40 px de part et d'autre
 *    (`mt-10 pt-10`) ;
 *  · le corps de texte est celui de la lecture du site (15 px,
 *    `leading-relaxed`, gris doux) et le gras passe en blanc — la
 *    grammaire des fiches : l'accent est blanc sur gris, jamais une
 *    couleur neuve ;
 *  · AUCUN CONTOUR : le bouton « Rejoindre » perd sa bordure et son
 *    survol rose de contour (hors charte) — il devient une action
 *    intermédiaire, capsule à sa taille naturelle sur fond `eleve`,
 *    qui s'éclaircit d'un cran au survol. « Chercher un tatoueur »
 *    reste l'action finale : capsule rose pleine largeur, la seule de
 *    la page. Les `focus-visible` roses partent avec.
 *
 * ⚠️ AUCUNE VALEUR INVENTÉE : couleurs, arrondis, écritures et marges
 * viennent des jetons existants (sombre-*, primaire, TRAIT_SEPARATION,
 * ECRITURE_TITRE_SECTION, le rythme mt-10/pt-10 des fiches).
 *
 * TYPOGRAPHIE : les espaces insécables (&nbsp;) tiennent les
 * guillemets et les mots courts, comme partout sur le site.
 */

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    `Pourquoi ${MARQUE_YOKOFOLIO.nom} existe : chercher un tatoueur par ` +
    "style et par ville, et voir une image de son travail dans ce style.",
  alternates: { canonical: `${adresseDuSite()}/qui-sommes-nous` },
};

/** L'accent du texte — le gras passe en blanc, la grammaire du site. */
function Gras({ children }: { children: React.ReactNode }) {
  return <strong className="text-sombre-texte">{children}</strong>;
}

export default function PageQuiSommesNous() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[720px] px-4 sm:px-6 pt-10 pb-16">
        {/* L'ILLUSTRATION : le cœur du site — le texte du propriétaire
            le désigne (« Regarde le cœur rose du logo »), il reste donc
            en ouverture. */}
        <div className="flex justify-center">
          <LogoYokofolio
            variante="icone"
            hauteur={160}
            classe="h-[128px] w-[128px] sm:h-[160px] sm:w-[160px]"
          />
        </div>

        {/* ---------- Pourquoi « YokoFolio » ? ---------- */}
        <section className="mt-10">
          <h1 className={ECRITURE_TITRE_SECTION}>
            Pourquoi «&nbsp;{MARQUE_YOKOFOLIO.nom}&nbsp;»&nbsp;?
          </h1>
          <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-sombre-texte-doux">
            <p>
              «&nbsp;Yoko&nbsp;» vient du japonais, signifie
              «&nbsp;couché, sur le côté&nbsp;». Regarde le cœur rose du
              logo, il est incliné. «&nbsp;Folio&nbsp;» vient de
              portfolio&nbsp;: c&apos;est le cœur du site.{" "}
              {MARQUE_YOKOFOLIO.nom}, c&apos;est un cœur incliné qui
              t&apos;emmène vers des portfolios.
            </p>
          </div>
        </section>

        {/* ---------- Ce que fait le site ---------- */}
        <section className={`mt-10 pt-10 border-t ${TRAIT_SEPARATION}`}>
          <h2 className={ECRITURE_TITRE_SECTION}>Ce que fait le site</h2>
          <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-sombre-texte-doux">
            <p>
              Un tatouage commence par un style. {MARQUE_YOKOFOLIO.nom}{" "}
              classe les tatoueurs par style.
            </p>
            <p>
              Essaie de chercher «&nbsp;du réalisme autour de
              Lyon&nbsp;» sur Instagram&nbsp;: aucune case ne pose cette
              question. Ici, c&apos;est précisément celle qu&apos;on te
              pose.
            </p>
            <p>
              Choisis un style, une ville et un rayon&nbsp;: les
              tatoueurs qui correspondent s&apos;affichent, chacun avec
              un portfolio consacré à son travail dans le style
              recherché.
            </p>
            <p>
              {MARQUE_YOKOFOLIO.nom} ne remplace pas Instagram —{" "}
              <Gras>il t&apos;y conduit, avec le bon artiste au bout.</Gras>
            </p>
            {/*  ⚠️ L'ESPACE APRÈS LE GRAS EST UNE EXPRESSION ({" "}) :
                 écrit en espace nu, le compilateur l'avalait sur la
                 première de ces deux lignes (mesuré au banc —
                 « Tatoueur ?Crée ») et les mots se collaient. */}
            <p>
              <Gras>Tatoueur&nbsp;?</Gras>{" "}
              Crée ton portfolio&nbsp;: un style montré est un style
              trouvable.
            </p>
            <p>
              <Gras>Curieux&nbsp;?</Gras>{" "}
              Cherche, et découvre ton prochain tatouage.
            </p>
          </div>
        </section>

        {/* ---------- Ce qu'on ne fait pas ---------- */}
        <section className={`mt-10 pt-10 border-t ${TRAIT_SEPARATION}`}>
          <h2 className={ECRITURE_TITRE_SECTION}>Ce qu&apos;on ne fait pas</h2>
          <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-sombre-texte-doux">
            <p>Pas d&apos;avis, pas de notes.</p>
            <p>
              Personne ne commente ni ne juge le travail d&apos;un
              tatoueur ici. Son portfolio parle pour lui.{" "}
              <Gras>À toi de te faire ton avis.</Gras>
            </p>
          </div>
        </section>

        {/* ---------- Les deux sorties ----------
             L'ACTION FINALE de la page : la capsule rose pleine
             largeur, la seule. « Rejoindre » est une action
             intermédiaire : capsule à sa taille naturelle, fond
             `eleve` qui s'éclaircit au survol — AUCUN contour. */}
        <div className={`mt-10 pt-10 border-t ${TRAIT_SEPARATION} flex flex-col items-center gap-3`}>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full
                       min-h-[52px] bg-primaire hover:bg-primaire-fonce
                       text-white font-semibold transition-colors"
          >
            Chercher un tatoueur
          </Link>
          <Link
            href="/devenir-tatoueur"
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[52px] bg-sombre-eleve text-sombre-texte
                       hover:bg-sombre-haut font-semibold transition-colors"
          >
            {TEXTES_TATOUAGE.lienInscription}
          </Link>
        </div>
      </main>
    </>
  );
}
