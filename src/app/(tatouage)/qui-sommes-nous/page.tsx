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
 * ⚠️⚠️ EXCEPTION DE MISE EN PAGE — LA RÈGLE, ET ELLE FAIT AUTORITÉ ICI
 * ==================================================================
 * CES DEUX PAGES ONT LEUR PROPRE MISE EN PAGE, PLUS LIBRE QUE LA
 * CHARTE DU RESTE DU SITE. C'EST UNE EXCEPTION ASSUMÉE, DÉCIDÉE PAR LE
 * PROPRIÉTAIRE À LA PASSE Nº 320 APRÈS AVOIR VU LE RÉSULTAT DE LEUR
 * PASSAGE À LA CHARTE. AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER.
 *
 * (« ces deux pages » : celle-ci et /contact, formulaire compris.)
 *
 * CE QUE CELA COUVRE, NOMMÉMENT — pour qu'aucune relecture de charte
 * ne les prenne pour des oublis : les GRANDES TYPOGRAPHIES (le titre
 * en `clamp(2rem…2.9rem)`, le chapô à 17–19 px, les titres de section
 * à `clamp(1.35rem…1.8rem)`), le TEXTE CENTRÉ de l'ouverture, les
 * marges généreuses propres à la page, et — côté /contact — les
 * contours des champs, le focus rose, les arrondis de 12 px, les
 * libellés AU-DESSUS des champs et le rond rose de confirmation.
 * La nº 319 avait tout ramené aux jetons du site : c'est ANNULÉ.
 *
 * CE QUI EST GARDÉ DE LA nº 319, ET SEULEMENT CELA : LE TEXTE
 * ci-dessous, au mot près, avec ses quatre passages en gras. Il est de
 * la main du propriétaire — aucune passe ne le réécrit.
 * ⚠️ TROIS RETOUCHES, ET TROIS SEULEMENT, À LA nº 321-§4 — toutes
 * demandées mot pour mot par le propriétaire, le reste du texte n'ayant
 * pas bougé d'un caractère :
 *  a) «&nbsp;Yoko&nbsp;» vient du japonais, IL signifie… (un « il »
 *     ajouté, pas en gras) ;
 *  b) « Choisis un style, une ville et un rayon : » PASSE EN GRAS ET EN
 *     BLANC — la suite de la phrase garde le gris du texte ;
 *  c) la phrase sur Instagram est réécrite (« …, il le complète, en
 *     t'y conduisant. ») ET REPASSE EN STYLE NORMAL.
 * Il y a donc toujours QUATRE gras, mais le premier a changé de phrase.
 * (Côté /contact : les deux libellés « Nom » et « E-mail », qui
 * restent DANS leur champ. Voir FormulaireContactYokofolio.)
 *
 * LA PAGE COMMENCE PAR LE NOM : « Yoko », du japonais — couché, sur
 * le côté, comme le cœur rose incliné du logo juste au-dessus ; et
 * « Folio », de portfolio — le cœur du site. Le reste dit ce que fait
 * YokoFolio (classer les tatoueurs par style, et conduire à leur
 * portfolio) et ce qu'il ne fait pas (ni avis, ni notes). Ton direct,
 * tutoiement, aucune emphase commerciale.
 *
 * TYPOGRAPHIE : les espaces insécables (&nbsp;) tiennent les
 * guillemets et les mots courts — et chaque insertion de variable
 * garde son espace autour : AUCUN mot collé au rendu
 * (« yokofoliovient »), c'est vérifié par test.
 * ⚠️ ET L'ESPACE QUI SUIT UN `</strong>` S'ÉCRIT `{" "}` : JSX rogne
 * l'espace de fin de ligne avant un retour à la ligne, et les mots se
 * collaient (« Tatoueur ?Crée », mesuré au banc de la nº 319).
 * ⚠️ MÊME PIÈGE APRÈS UN COMMENTAIRE JSX (mesuré au banc de la
 * nº 321) : un commentaire JSX est une ACCOLADE, comme une variable —
 * la première ligne de texte qui suit perd son espace de tête, et
 * « YokoFolio ne remplace pas » se rendait « YokoFolione remplace
 * pas ». Là encore, on écrit `{" "}` plutôt que de compter sur la mise
 * en forme du fichier.
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

        {/*  LE TEXTE CI-DESSOUS EST CELUI DU PROPRIÉTAIRE, AU MOT PRÈS
             (nº 319, conservé par la nº 320). Seule la MISE EN PAGE est
             revenue à celle d'avant : grandes typographies, ouverture
             centrée, sections aérées. */}
        <p className="mt-6 text-center text-[17px] sm:text-[19px] leading-[1.7] text-sombre-texte-doux text-pretty">
          {/*  §4-a (nº 321) — « IL SIGNIFIE », et le « il » n'est PAS
               en gras : c'est une correction de langue, pas une mise en
               avant. La phrase n'a pas d'autre changement. */}
          «&nbsp;Yoko&nbsp;» vient du japonais, il signifie
          «&nbsp;couché, sur le côté&nbsp;». Regarde le cœur rose du
          logo, il est incliné. «&nbsp;Folio&nbsp;» vient de
          portfolio&nbsp;: c&apos;est le cœur du site.{" "}
          {MARQUE_YOKOFOLIO.nom}, c&apos;est un cœur incliné qui
          t&apos;emmène vers des portfolios.
        </p>

        <Section titre="Ce que fait le site">
          <p>
            Un tatouage commence par un style. {MARQUE_YOKOFOLIO.nom}{" "}
            classe les tatoueurs par style.
          </p>
          <p>
            Essaie de chercher «&nbsp;du réalisme autour de Lyon&nbsp;»
            sur Instagram&nbsp;: aucune case ne pose cette question. Ici,
            c&apos;est précisément celle qu&apos;on te pose.
          </p>
          <p>
            {/*  §4-b (nº 321) — LA CONSIGNE PASSE EN GRAS ET EN BLANC,
                 ET ELLE SEULE : le gras s'arrête au deux-points, la
                 suite garde le gris du texte courant. C'est le geste
                 qu'on demande au visiteur — il se lit avant le reste
                 de la phrase, qui n'en est que la conséquence. */}
            <strong className="text-sombre-texte">
              Choisis un style, une ville et un rayon&nbsp;:
            </strong>{" "}
            les tatoueurs qui correspondent s&apos;affichent, chacun avec
            un portfolio consacré à son travail dans le style recherché.
          </p>
          <p>
            {/*  §4-c (nº 321) — CETTE PHRASE REPASSE EN STYLE NORMAL :
                 plus de gras, plus de blanc. Elle en portait depuis la
                 nº 319 (« il t'y conduit, avec le bon artiste au
                 bout. ») ; le gras a changé de phrase, il est allé sur
                 la consigne juste au-dessus. Le texte lui-même est
                 réécrit par le propriétaire. */}
            {MARQUE_YOKOFOLIO.nom}{" "}
            ne remplace pas Instagram, il le complète, en t&apos;y
            conduisant.
          </p>
          <p>
            <strong className="text-sombre-texte">Tatoueur&nbsp;?</strong>{" "}
            Crée ton portfolio&nbsp;: un style montré est un style
            trouvable.
          </p>
          <p>
            <strong className="text-sombre-texte">Curieux&nbsp;?</strong>{" "}
            Cherche, et découvre ton prochain tatouage.
          </p>
        </Section>

        <Section titre="Ce qu'on ne fait pas">
          <p>Pas d&apos;avis, pas de notes.</p>
          <p>
            Personne ne commente ni ne juge le travail d&apos;un tatoueur
            ici. Son portfolio parle pour lui.{" "}
            <strong className="text-sombre-texte">
              À toi de te faire ton avis.
            </strong>
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
          {/*  §5 (nº 321) — LE SECOND BOUTON : « Crée ton portfolio »,
               UNE CAPSULE PLEINE, SANS AUCUN CONTOUR.
               ------------------------------------------------------
               Il portait « Rejoindre » dans un cadre gris qui virait
               au rose au survol — deux choses que la charte refuse
               partout ailleurs : un contour, et du rose sur autre
               chose que l'action finale (ici, c'est le bouton rose à
               sa gauche qui la porte, et il ne change EN RIEN).
               Le voici en second rang, comme les actions
               intermédiaires du reste du site : fond `sombre-eleve`
               (#33333A), TEXTE BLANC, `sombre-haut` (#4A4A53) au
               survol, et rien autour. Le fond seul dit qu'il est
               cliquable — le rose reste au bouton d'à côté. */}
          <Link
            href="/devenir-tatoueur"
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[54px] bg-sombre-eleve hover:bg-sombre-haut
                       text-white font-semibold transition-colors
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {TEXTES_TATOUAGE.lienCreerPortfolio}
          </Link>
        </div>
      </main>
    </>
  );
}
