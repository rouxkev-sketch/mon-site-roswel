import type { Metadata } from "next";
import Link from "next/link";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { LogoYokofolio } from "@/components/LogoYokofolio";

/**
 * QUI SOMMES-NOUS
 * ================
 * Adresse : /qui-sommes-nous
 *
 * LA PAGE COMMENCE PAR LE NOM : « yoko », du japonais — couché, sur
 * le côté, comme le cœur rose penché du logo juste au-dessus ; et
 * « folio », de portfolio — la raison d'être du site. Le reste
 * rappelle ce qu'est yokofolio (un index de tatoueurs par style, une
 * passerelle vers leurs portfolios Instagram et TikTok) et ce qu'il
 * n'est pas (pas d'avis, pas de note, pas de classement payant). Ton
 * direct, tutoiement, aucune emphase commerciale.
 *
 * TYPOGRAPHIE : les espaces insécables (&nbsp;) tiennent les
 * guillemets et les mots courts — et chaque insertion de variable
 * garde son espace autour : AUCUN mot collé au rendu
 * (« yokofoliovient »), c'est vérifié par test.
 */

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    `Pourquoi ${MARQUE_YOKOFOLIO.nom} existe : chercher un tatoueur par ` +
    "style et par ville, et voir une image de son travail dans ce style.",
  alternates: { canonical: `${adresseDuSite()}/qui-sommes-nous` },
};

/** Une section : un titre net, du texte aéré. */
function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 sm:mt-16">
      <h2 className="text-[clamp(1.35rem,3vw,1.8rem)] font-bold leading-tight text-sombre-texte">
        {titre}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-[16px] sm:text-[17px] leading-[1.75] text-sombre-texte-doux">
        {children}
      </div>
    </section>
  );
}

export default function PageQuiSommesNous() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[720px] px-5 sm:px-6 pt-12 sm:pt-16 pb-24">
        {/* L'ILLUSTRATION : le cœur du site, en grand. C'est le seul
            visuel de la page, et il porte toute l'ouverture. */}
        <div className="flex justify-center">
          <LogoYokofolio
            variante="icone"
            hauteur={160}
            classe="h-[128px] w-[128px] sm:h-[160px] sm:w-[160px]"
          />
        </div>

        <h1 className="mt-10 text-center text-[clamp(2rem,5.5vw,2.9rem)] font-bold leading-[1.1] text-sombre-texte text-balance">
          Pourquoi «&nbsp;{MARQUE_YOKOFOLIO.nom}&nbsp;»&nbsp;?
        </h1>

        <p className="mt-6 text-center text-[17px] sm:text-[19px] leading-[1.7] text-sombre-texte-doux text-pretty">
          «&nbsp;Yoko&nbsp;» vient du japonais&nbsp;: couché, sur le
          côté — regarde le cœur rose du logo, il penche.
          «&nbsp;Folio&nbsp;» vient de portfolio&nbsp;: la raison
          d&apos;être du site. {MARQUE_YOKOFOLIO.nom}, c&apos;est un cœur
          penché qui t&apos;emmène vers des portfolios.
        </p>

        <Section titre="Ce que fait le site">
          <p>
            {MARQUE_YOKOFOLIO.nom} est un{" "}
            <strong className="text-sombre-texte">
              index de tatoueurs, par style
            </strong>
            . Tu choisis un style, une ville, un rayon — les tatoueurs qui
            correspondent s&apos;affichent, chacun avec une image de son
            travail dans le style demandé. Essaie de chercher
            «&nbsp;du réalisme autour de Lyon&nbsp;» sur Instagram ou
            TikTok&nbsp;: aucune case ne pose cette question. Ici, c&apos;est
            la seule qu&apos;on pose.
          </p>
          <p>
            Chaque fiche est une{" "}
            <strong className="text-sombre-texte">passerelle</strong>&nbsp;:
            elle t&apos;emmène vers le portfolio du tatoueur, sur Instagram
            et TikTok. Son travail reste chez lui — {MARQUE_YOKOFOLIO.nom} te
            met sur le chemin, il ne garde rien pour lui.
          </p>
          <p>
            Tatoueur&nbsp;? Crée ta fiche&nbsp;: un style montré, c&apos;est
            un style trouvable. Curieux&nbsp;? Cherche, compare, reviens.
          </p>
        </Section>

        <Section titre="Ce qu'on ne fait pas">
          <p>
            <strong className="text-sombre-texte">Pas d&apos;avis, pas de
            note.</strong> Personne ne commente ni ne juge le travail d&apos;un
            tatoueur ici — son portfolio parle pour lui, tu te fais ton idée.
          </p>
          <p>
            <strong className="text-sombre-texte">
              Pas de classement payant.
            </strong>{" "}
            Personne ne peut acheter sa place dans les résultats. Ce qui fait
            remonter une fiche, c&apos;est l&apos;intérêt qu&apos;elle
            suscite — rien d&apos;autre.
          </p>
          <p>
            <strong className="text-sombre-texte">
              Pas de photos confisquées.
            </strong>{" "}
            Les images appartiennent aux tatoueurs. Chacun choisit ce qui
            paraît, et peut tout retirer quand il veut — sans se justifier.
          </p>
        </Section>

        <div className="mt-16 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[54px] bg-primaire hover:bg-primaire-fonce
                       text-white font-semibold transition-colors
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            Chercher un tatoueur
          </Link>
          <Link
            href="/devenir-tatoueur"
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[54px] border border-sombre-bordure
                       text-sombre-texte hover:border-primaire hover:text-primaire
                       transition-colors"
          >
            {TEXTES_TATOUAGE.lienInscription}
          </Link>
        </div>
      </main>
    </>
  );
}
