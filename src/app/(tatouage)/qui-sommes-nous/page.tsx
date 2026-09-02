import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { BoutonCreerPortfolio } from "@/components/BoutonCreerPortfolio";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { LogoYokofolio } from "@/components/LogoYokofolio";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * QUI SOMMES-NOUS — « About »
 * ===========================
 * Adresse : /qui-sommes-nous (l'adresse n'a pas bougé à la nº 804 : les
 * adresses du site sont un sujet à part, voir le rapport de la passe).
 *
 * ⚠️⚠️ EXCEPTION DE MISE EN PAGE — LA RÈGLE, ET ELLE FAIT AUTORITÉ ICI
 * ==================================================================
 * CETTE PAGE A SA PROPRE MISE EN PAGE, PLUS LIBRE QUE LA CHARTE DU
 * RESTE DU SITE. C'EST UNE EXCEPTION ASSUMÉE, DÉCIDÉE PAR LE
 * PROPRIÉTAIRE À LA PASSE Nº 320 APRÈS AVOIR VU LE RÉSULTAT DE SON
 * PASSAGE À LA CHARTE. AUCUNE PASSE FUTURE NE DOIT L'Y RAMENER.
 *
 * ⚠️ « CES DEUX PAGES » N'EN FAIT PLUS QU'UNE : CELLE-CI. Le
 * propriétaire a LEVÉ l'exception pour /contact à la nº 800, de sa
 * main et nommément. L'exception ci-dessus vaut donc pour CETTE page,
 * entière.
 *
 * CE QUE CELA COUVRE ICI, NOMMÉMENT — pour qu'aucune relecture de
 * charte ne les prenne pour des oublis : les GRANDES TYPOGRAPHIES (le
 * titre en `clamp(2rem…2.9rem)`, le chapô à 17–19 px, les titres de
 * section à `clamp(1.35rem…1.8rem)`), le TEXTE CENTRÉ de l'ouverture
 * et les marges généreuses propres à la page.
 * La nº 319 avait tout ramené aux jetons du site : c'est ANNULÉ.
 *
 * ██ LE TEXTE EST CELUI DU PROPRIÉTAIRE, EN ANGLAIS, AU MOT PRÈS (nº 804) ██
 * ==================================================================
 * Le site devient anglais à la nº 804 (marché : Austin, Texas). Le
 * propriétaire a ÉCRIT LUI-MÊME le texte de cette page et l'a fait
 * poser TEL QUEL — titres compris : « Why "YokoFolio"? », « What We
 * Do », « What We Don't Do ». Aucune passe ne le réécrit de sa propre
 * initiative, comme pour ses versions françaises (nº 319, 321, 324,
 * 326) avant lui.
 *
 * ⚠️ CE QUI EST GARDÉ DE LA MISE EN PAGE D'AVANT, et c'est de la mise
 * en page, pas du texte : LES CINQ GRAS, posés sur les phrases qui
 * tiennent la même place que leurs aînées françaises — « Here, you're
 * in control. » · « Pick a style, location, and distance. » ·
 * « Looking for a tattoo? » · « Are you a tattoo artist? » · « The
 * final judgment is entirely yours. » ; et les deux appels de fin de
 * section en deux paragraphes à amorce grasse, comme avant (le
 * propriétaire les avait écrits en liste à tirets dans son message :
 * même texte, même ordre, la forme est celle de la page).
 *
 * ⚠️ « THE PINK HEART » : le texte du propriétaire dit que le cœur du
 * logo est ROSE. Il est ROUGE (#E11144) depuis les nº 762-763. Le mot
 * est posé tel quel parce que la consigne est « tel quel » ; le
 * rapport de la nº 804 le lui signale, et c'est à lui de trancher.
 *
 * TYPOGRAPHIE : les guillemets du propriétaire sont DROITS ("…"), et
 * ils s'écrivent `&quot;` en JSX ; les apostrophes s'écrivent `&apos;`
 * (règle de lint du dépôt). Son tiret long (« portfolio—the core »)
 * est gardé collé, comme il l'a écrit.
 * ⚠️ ET L'ESPACE QUI SUIT UN `</strong>` S'ÉCRIT `{" "}` : JSX rogne
 * l'espace de fin de ligne avant un retour à la ligne, et les mots se
 * collaient (« Tatoueur ?Crée », mesuré au banc de la nº 319). Même
 * piège APRÈS UN COMMENTAIRE JSX (nº 321) et AVANT un `<strong>` posé
 * sur sa propre ligne (nº 324).
 */

export const metadata: Metadata = {
  title: "About",
  description:
    `Why ${MARQUE_YOKOFOLIO.nom} exists: find a tattoo artist by style ` +
    "and city, and see their work in that exact style.",
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
      {/*  §1 (nº 799) — LE GARDE DE COPIE A DÉMÉNAGÉ. La nº 798 le
           montait ici, sur cette seule page ; il vit désormais dans
           l'habillage du groupe (src/app/(tatouage)/layout.tsx), donc
           sur tout le site — le défaut n'avait jamais été propre à
           cette page. Une seule écriture, un seul endroit. */}

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
          Why &quot;{MARQUE_YOKOFOLIO.nom}&quot;?
        </h1>

        {/*  LE TEXTE CI-DESSOUS EST CELUI DU PROPRIÉTAIRE, AU MOT PRÈS
             (nº 804). Seule la MISE EN PAGE est celle de la page :
             grandes typographies, ouverture centrée, sections aérées. */}
        <p className="mt-6 text-center text-[17px] sm:text-[19px] leading-[1.7] text-sombre-texte-doux text-pretty">
          &quot;Yoko&quot; comes from Japanese, meaning &quot;on its
          side.&quot; Take a look at the pink heart in our logo:
          it&apos;s tilted. &quot;Folio&quot; is short for
          portfolio—the core of our platform.{" "}
          {MARQUE_YOKOFOLIO.nom} is a tilted heart guiding you straight
          to portfolios that inspire.
        </p>

        <Section titre="What We Do">
          <p>Every great tattoo starts with a style.</p>
          <p>
            {/*  LE GRAS EST EN FIN DE PHRASE, et c'est le piège de cette
                 page : l'espace qui PRÉCÈDE un `<strong>` posé sur sa
                 propre ligne se fait avaler tout comme celle qui le
                 suit. D'où le `{" "}` explicite AVANT, et pas seulement
                 après (mesuré à la nº 324). */}
            Try searching for &quot;realism in Austin&quot; on Instagram:
            an algorithm decides what you see.{" "}
            <strong className="text-sombre-texte">
              Here, you&apos;re in control.
            </strong>
          </p>
          <p>
            <strong className="text-sombre-texte">
              Pick a style, location, and distance.
            </strong>{" "}
            You&apos;ll instantly see matching local tattoo artists, each
            with a dedicated portfolio showcasing their work in that exact
            style. No feed, no algorithm deciding for you. We focus purely
            on styles—and connect you directly to the artist&apos;s
            Instagram.
          </p>
          {/*  LES DEUX APPELS — un par public, dans le même moule : une
               AMORCE en gras qui dit à qui l'on parle, puis la phrase
               en style normal. Le propriétaire les a écrits en liste ;
               ils gardent ici la forme qu'ils ont depuis la nº 326.
               ⚠️ L'ESPACE APRÈS L'AMORCE S'ÉCRIT `{" "}`, ET C'EST ICI
               QUE LE DÉFAUT EST NÉ : « Tatoueur ?Crée » à la nº 319. */}
          <p>
            <strong className="text-sombre-texte">Looking for a tattoo?</strong>{" "}
            Search your style, find your artist.
          </p>
          <p>
            <strong className="text-sombre-texte">
              Are you a tattoo artist?
            </strong>{" "}
            Show your styles, build your portfolio, and get discovered.
          </p>
        </Section>

        <Section titre="What We Don't Do">
          <p>No reviews, no ratings.</p>
          <p>
            We believe no one should publicly judge or rate an
            artist&apos;s craft. Their portfolio speaks for itself.{" "}
            <strong className="text-sombre-texte">
              The final judgment is entirely yours.
            </strong>
          </p>
        </Section>

        <div className="mt-16 flex flex-col sm:flex-row gap-3">
          {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE :
               chercher un style est une navigation EN AVANT ; sans
               déclaration, la chaîne de restitution pouvait rendre la
               place mémorisée de l'accueil (le bas de la mosaïque).
               La page reste un composant serveur — seul le lien est
               client (LienAccueil, nº 429 + nº 446). */}
          {/*  §2 (nº 798) — LES MESURES DE LA nº 788, ET RIEN D'AUTRE :
               40 px de haut, 14 px de texte, comme les capsules de la
               page Sécurité. Couleur, survol, destination et
               espacement latéral (`px-7`) restent tels quels. */}
          <LienAccueil
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[40px] text-[14px] bg-primaire
                       hover:bg-primaire-fonce
                       text-white font-semibold transition-colors
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {/*  §2 (nº 324) — « UN STYLE », ET PLUS « un tatoueur » :
                 c'est ce que la page vient d'expliquer — on ne cherche
                 pas une personne, on cherche un style. En anglais
                 (nº 804), le mot reprend l'appel du texte du
                 propriétaire : « Search your style, find your artist ».
                 ⚠️ ET `TEXTES_TATOUAGE.titreRecherche` N'EST PAS
                 TOUCHÉ : ce libellé-là est celui du MOTEUR. Deux
                 endroits, deux phrases. */}
            Find your style
          </LienAccueil>
          {/*  §5 (nº 321) — LE SECOND BOUTON, UNE CAPSULE PLEINE, SANS
               AUCUN CONTOUR : fond `sombre-eleve`, texte blanc,
               `sombre-haut` au survol. Le rouge reste au bouton d'à
               côté, qui porte l'action finale.
               §3 (nº 324) — SA DESTINATION SUIT LE VISITEUR : pas de
               compte → la page de compte ; déjà connecté → « My
               favorites ». La règle vit dans `BoutonCreerPortfolio`.
               ⚠️ LES CLASSES ET LE LIBELLÉ SONT PASSÉS TELS QUELS AU
               COMPOSANT, qui n'en décide aucun ; le libellé vient de
               la config (`lienCreerPortfolio`), traduit avec elle. */}
          <BoutonCreerPortfolio
            className="inline-flex items-center justify-center rounded-full
                       px-7 min-h-[40px] text-[14px] bg-sombre-eleve
                       hover:bg-sombre-haut
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
