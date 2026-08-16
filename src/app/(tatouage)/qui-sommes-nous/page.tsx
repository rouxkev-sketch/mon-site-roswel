import type { Metadata } from "next";
import Link from "next/link";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { BoutonCreerPortfolio } from "@/components/BoutonCreerPortfolio";
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
 * LE TEXTE CI-DESSOUS EST DE LA MAIN DU PROPRIÉTAIRE, AU MOT PRÈS —
 * aucune passe ne le réécrit de sa propre initiative. Il a été posé à
 * la nº 319, gardé par la nº 320 quand la mise en page a été annulée,
 * retouché en trois endroits à la nº 321-§4, puis RÉÉCRIT PAR LE
 * PROPRIÉTAIRE à la nº 324-§1.
 *
 * ⚠️ CE QUE LA nº 324 A CHANGÉ, et rien d'autre :
 *  · « aucune case ne pose cette question. Ici, c'est précisément
 *    celle qu'on te pose. » devient L'ALGORITHME : « c'est
 *    l'algorithme qui décide ce que tu verras. Ici, c'est toi. » ;
 *  · la phrase sur Instagram devient « YokoFolio n'a pas
 *    d'algorithme, il a des styles — et il te conduit jusqu'à
 *    l'Instagram de celui qui les tatoue. », en style normal ;
 *  · « Personne ne commente… ici » devient « Ici, personne ne
 *    commente… » — le lieu ouvre la phrase.
 * IL Y A DÉSORMAIS CINQ GRAS, dans cet ordre : « Ici, c'est toi. » ·
 * « Choisis un style, une ville et un rayon : » · « Tatoueur ? » ·
 * « Curieux ? » · « À toi de te faire ton avis. »
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
             (nº 319, conservé par la nº 320, retouché aux nº 321 et
             nº 324). Seule la MISE EN PAGE est revenue à celle d'avant :
             grandes typographies, ouverture centrée, sections aérées.
             ⚠️ §1 (nº 324) — LE CORPS EST RÉÉCRIT PAR LE PROPRIÉTAIRE.
             Ce qui change, et rien d'autre : « aucune case ne pose
             cette question » devient l'ALGORITHME (« c'est
             l'algorithme qui décide ce que tu verras. Ici, c'est
             toi. ») ; la phrase sur Instagram devient « YokoFolio n'a
             pas d'algorithme, il a des styles… » et repart en style
             normal ; « Personne ne commente… ici » devient « Ici,
             personne ne commente… ». CINQ passages en gras et en
             blanc, et cinq seulement. */}
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
            {/*  §1 (nº 324) — LE GRAS EST EN FIN DE PHRASE, et c'est
                 le piège de cette page : l'espace qui PRÉCÈDE un
                 `<strong>` posé sur sa propre ligne se fait avaler tout
                 comme celle qui le suit. D'où le `{" "}` explicite
                 AVANT, et pas seulement après. « verras.Ici » a été
                 mesuré, pas supposé. */}
            Essaie de chercher «&nbsp;du réalisme autour de Lyon&nbsp;»
            sur Instagram&nbsp;: c&apos;est l&apos;algorithme qui décide
            ce que tu verras.{" "}
            <strong className="text-sombre-texte">Ici, c&apos;est toi.</strong>
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
            {/*  §1 (nº 324) — LA PHRASE SUR INSTAGRAM, RÉÉCRITE. Elle
                 répond à l'algorithme nommé deux paragraphes plus
                 haut, et elle reste EN STYLE NORMAL — le gras de ce
                 passage est allé sur « Ici, c'est toi. ». */}
            {MARQUE_YOKOFOLIO.nom}{" "}
            n&apos;a pas d&apos;algorithme, il a des styles — et il te
            conduit jusqu&apos;à l&apos;Instagram de celui qui les
            tatoue.
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
            {/*  §1 (nº 324) — « ICI » PASSE EN TÊTE : la phrase disait
                 « Personne ne commente ni ne juge le travail d'un
                 tatoueur ici ». Le lieu ouvre désormais la phrase. */}
            Ici, personne ne commente ni ne juge le travail d&apos;un
            tatoueur. Son portfolio parle pour lui.{" "}
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
            {/*  §2 (nº 324) — « UN STYLE », ET PLUS « un tatoueur ».
                 C'est ce que la page vient d'expliquer sur six
                 paragraphes : on ne cherche pas une personne, on
                 cherche un style — la personne vient au bout. La
                 destination et l'habit ne bougent pas : c'est toujours
                 la capsule rose vers l'accueil.
                 ⚠️ ET `TEXTES_TATOUAGE.titreRecherche` N'EST PAS
                 TOUCHÉ : ce libellé-là est celui du MOTEUR, en tête de
                 ses deux champs, et le propriétaire n'a rien demandé
                 pour lui. Deux endroits, deux phrases. */}
            Chercher un style
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
          {/*  §3 (nº 324) — SA DESTINATION SUIT LE VISITEUR, et elle
               seule : pas de compte → la page de compte, qui s'ouvre
               sur « Créer mon compte » ; déjà connecté → « Ma
               sélection ». La règle vit dans `BoutonCreerPortfolio`,
               parce qu'elle demande de savoir qui regarde — ce que
               seule l'exécution sait.
               ⚠️ L'HABIT NE CHANGE PAS D'UN PIXEL : les classes du §5
               de la nº 321 sont passées telles quelles au composant,
               qui n'en décide aucune. Le libellé non plus. */}
          <BoutonCreerPortfolio
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[54px] bg-sombre-eleve hover:bg-sombre-haut
                       text-white font-semibold transition-colors
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {TEXTES_TATOUAGE.lienCreerPortfolio}
          </BoutonCreerPortfolio>
        </div>
      </main>
    </>
  );
}
