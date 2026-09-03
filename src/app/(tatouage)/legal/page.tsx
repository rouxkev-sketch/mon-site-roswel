import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
//  nº 811/814 — les adresses des pages éditoriales, écrites une fois.
import { CHEMIN_LEGAL, CHEMIN_TERMS } from "@/lib/chemins-editoriaux";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";
//  nº 811 — le lien qui précharge au geste et tire le rideau au clic.
import { LienAuGeste } from "@/components/LienAuGeste";
//  nº 814 — la section des pages de texte légal, partagée avec /terms ;
//  nº 815 — et la robe de leurs liens.
import { CLASSE_LIEN_LEGAL, SectionLegale } from "@/components/SectionLegale";

/**
 * LA PAGE LÉGALE DE YOKOFOLIO — « Legal Notice »
 * ==============================================
 * Adresse : /legal (nº 811 — « /mentions-legales » jusque-là ;
 * l'ancienne adresse redirige, définitivement, voir next.config et
 * lib/chemins-editoriaux). Le rideau de chargement : `loading.tsx` à
 * côté, comme les pages de mosaïque (nº 706) — sans squelette.
 *
 * ██ RÉÉCRITE EN ANGLAIS ET ADAPTÉE AUX ÉTATS-UNIS (nº 804) ██
 * ==================================================================
 * Le site devient anglais (marché : Austin, Texas). Cette page est
 * TRADUITE et ADAPTÉE « raisonnablement » — la consigne du
 * propriétaire — et tout ce qui mérite un juriste est LISTÉ dans
 * docs/A-VALIDER-AVOCAT.md, pas tranché ici.
 *
 * CE QUI A ÉTÉ RETIRÉ, parce que franco-français ou propre à l'Union
 * européenne, et que la page ne s'adresse plus à ce public :
 *  · la référence à la loi LCEN (article 6-III-2) qui justifiait de
 *    ne pas publier l'adresse d'un éditeur particulier — l'idée
 *    (identité remise aux hébergeurs, non publiée) RESTE, sans le
 *    numéro d'article ;
 *  · la section « Directeur de la publication », notion française sans
 *    équivalent utile ici ;
 *  · les articles du RGPD (6.1.b), l'article 82 de la loi Informatique
 *    et Libertés, la réclamation à la CNIL, et le paragraphe sur le
 *    « transfert hors de l'Union européenne » ;
 *  · SIREN et TVA intracommunautaire dans la clause de mise à jour.
 *
 * CE QUI RESTE, ET C'EST LE FOND : qui publie, qui héberge, ce qui est
 * collecté et pourquoi, combien de temps, comment on supprime son
 * compte, à qui appartiennent les photos, les liens sortants. Rien
 * n'est vendu, aucune publicité, aucune donnée revendue — ce sont des
 * FAITS sur le site, ils ne changent pas avec la langue.
 *
 * ⚠️ AUCUN FAIT NOUVEAU N'EST INVENTÉ (nº 804) : pas d'entité
 * américaine. La page dit ce que le site fait, et rien qu'elle ne
 * puisse tenir.
 *
 * ██ nº 814 — CONFORMITÉ AMÉRICAINE : DMCA, VIE PRIVÉE, TERMS ██
 * ==================================================================
 * Ce que la nº 804 remettait au juriste et que le propriétaire a
 * tranché depuis :
 *  · L'AGENT DMCA EXISTE : le propriétaire l'a enregistré au Copyright
 *    Office (« DMCA Designated Agent », registration DMCA-1079752 —
 *    AGENT_DMCA ci-dessous). La section « Copyright and DMCA » (ancre
 *    #dmca) décrit la notification (17 U.S.C. § 512(c)(3)), le retrait
 *    rapide, la contre-notification (§ 512(g)), la clôture des
 *    récidivistes (§ 512(i)) et la fausse déclaration (§ 512(f)).
 *  · LA VIE PRIVÉE (ancre #privacy) complète ce que le droit américain
 *    de base attend (CCPA : savoir, supprimer, corriger, ne pas être
 *    traité différemment ; « does not sell or share ») et dit les
 *    sous-traitants (Vercel, Supabase, Resend, Google pour la
 *    connexion) et les enfants (COPPA : pas de moins de 13 ans).
 *  · LE DROIT APPLICABLE vit dans les Terms of Use (/terms), avec les
 *    règles d'usage, les comptes, la garantie des artistes sur leurs
 *    photos et la limite de responsabilité. Cette page y renvoie.
 * Ce qui reste pour un juriste est dans docs/A-VALIDER-AVOCAT.md.
 *
 * ⚠️ LA BASE EST HÉBERGÉE AUX ÉTATS-UNIS depuis la nº 766 (projet
 * Supabase « USA Est ») : l'adresse de Supabase Inc. (Singapour) est
 * celle de la société, pas celle du serveur. La page dit les deux.
 *
 * Le jour où une société est créée : dénomination, forme, siège et
 * numéro d'enregistrement deviennent nécessaires. Tout est regroupé
 * dans un seul objet, ÉDITEUR, pour n'avoir qu'un endroit à reprendre.
 */

const ÉDITEUR = {
  contact: "contact@yokofolio.com",
};

/**
 * L'AGENT DMCA (nº 814) — enregistré par le propriétaire au U.S.
 * Copyright Office. Le numéro d'enregistrement et l'adresse sont CEUX
 * DU REGISTRE : ils ne se changent pas ici sans changer le registre.
 * ⚠️ `contact` : c'était rouxkev@gmail.com, l'adresse enregistrée, avec
 * la consigne de la remplacer par contact@yokofolio.com QUAND LA BOÎTE
 * EXISTERAIT. ELLE EXISTE ET REÇOIT (redirection OVH vérifiée par le
 * propriétaire) : le remplacement est fait à la nº 835.
 * ⚠️ ET IL RESTE UNE CHOSE À FAIRE, HORS DU CODE : mettre à jour
 * l'enregistrement au U.S. Copyright Office. L'adresse AFFICHÉE ici
 * doit être celle qui FIGURE AU REGISTRE — c'est tout l'intérêt d'un
 * agent désigné. Tant que le registre porte l'ancienne, les deux se
 * contredisent.
 * Les coordonnées complètes de l'agent (adresse postale, téléphone)
 * sont au registre public du Copyright Office ; la page le dit et n'en
 * invente aucune.
 */
const AGENT_DMCA = {
  nom: "DMCA Designated Agent",
  enregistrement: "DMCA-1079752",
  contact: "contact@yokofolio.com",
};

const HÉBERGEURS = [
  {
    nom: "Vercel Inc.",
    role: "website hosting",
    adresse: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
    site: "https://vercel.com",
  },
  {
    nom: "Supabase Inc.",
    role: "database hosting (servers located in the United States)",
    adresse: "970 Toa Payoh North #07-04, Singapore 318992",
    site: "https://supabase.com",
  },
];

export const metadata: Metadata = {
  title: "Legal Notice",
  description: `Who publishes ${MARQUE_YOKOFOLIO.nom}, who hosts it, and what happens to the information that goes through it.`,
  alternates: { canonical: `${adresseDuSite()}${CHEMIN_LEGAL}` },
};

/*  nº 814 — la section (titre net, texte lisible, marges généreuses)
    vit dans `SectionLegale`, partagée avec « Terms of Use ». */

/** Un lien de la page : la robe des liens du texte légal — le BLEU
    des liens d'action depuis la nº 815 (voir `SectionLegale`). */
const CLASSE_LIEN = CLASSE_LIEN_LEGAL;

export default function PageMentionsLegales() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[760px] px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight text-sombre-texte">
          Legal Notice
        </h1>
        <p className="mt-3 text-[15px] text-sombre-texte-doux">
          Who publishes {MARQUE_YOKOFOLIO.nom}, who hosts it, and what
          happens to the information that goes through it.
        </p>

        <div className="mt-10 flex flex-col gap-7">
          <SectionLegale titre="Publisher">
            <p>
              <strong className="text-sombre-texte">
                This site is published by an individual, on a personal,
                non-commercial basis.
              </strong>
              <br />
              Contact:{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className={CLASSE_LIEN}
              >
                {ÉDITEUR.contact}
              </a>
            </p>
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              is published WITHOUT A BUSINESS MODEL: the site sells nothing,
              takes no commission, shows no advertising and sells no data.
            </p>
            <p>
              The publisher&apos;s full identity has been provided to the
              hosting providers below. It is not published on the site; it
              will be disclosed upon a lawful request from a competent
              authority.
            </p>
          </SectionLegale>

          <SectionLegale titre="Hosting">
            <p>The site and its data are hosted by:</p>
            <ul className="flex flex-col gap-3">
              {HÉBERGEURS.map((h) => (
                <li key={h.nom}>
                  <strong className="text-sombre-texte">{h.nom}</strong> —{" "}
                  {h.role}
                  <br />
                  {h.adresse}
                  <br />
                  <a
                    href={h.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASSE_LIEN}
                  >
                    {h.site.replace("https://", "")}
                  </a>
                </li>
              ))}
            </ul>
            <p>The site&apos;s data is processed in the United States.</p>
          </SectionLegale>

          {/*  nº 814 — LE TITRE DIT « PRIVACY », ET LA SECTION A UNE
               ANCRE (#privacy) : c'est la politique de confidentialité
               du site — celle que l'écran de consentement Google et les
               Terms of Use désignent. Le contenu de la nº 322/804 est
               intact ; les trois paragraphes ajoutés (sous-traitants,
               droits, enfants) le suivent. */}
          <SectionLegale titre="Personal information (privacy policy)" id="privacy">
            <p>
              A visitor who simply searches for a tattoo artist creates no
              account and provides no information: {MARQUE_YOKOFOLIO.nom}{" "}
              asks for nothing.
            </p>
            {/*  LE COMPTE VISITEUR (nº 322). Les trois données nommées ici
                 sont EXACTEMENT les trois tables du site —
                 `tatoueurs_suivis`, `favoris_photos` et
                 `visites_selection` — et toutes trois disparaissent avec
                 le compte (`on delete cascade` sur `auth.users`), ce qui
                 est précisément ce que la dernière phrase promet. */}
            <p>
              A VISITOR who wants to keep a selection creates an account with
              an email address. The site then stores the portfolios they
              follow, the photos they saved, and the date of their last
              visit — only to show them their favorites and flag what is new
              since their last visit. None of this is sold, shared, or used
              for advertising. Retention: as long as the account exists,
              then deletion.
            </p>
            <p>
              A TATTOO ARTIST who creates a portfolio provides a name, a
              city, an email address, their styles, their images and links
              to their social accounts. This information is used only to
              display the portfolio and to contact them about it. It is
              neither sold, nor shared, nor used for advertising. Retention:
              as long as the portfolio exists, then deletion.
            </p>
            {/*  LA RELECTURE DES PHOTOS (nº 322). Elle existe (une fiche
                 modifiée repasse en validation), et c'est un ACCÈS de
                 l'éditeur aux images déposées : une page qui dit ce que
                 deviennent les informations doit le dire. */}
            <p>
              Photos submitted to a portfolio are reviewed before they are
              published. The publisher therefore has access to them, for
              that sole purpose.
            </p>
            <p>
              The contact form collects a name, an email address and a
              message. They are used only to reply, and kept only as long as
              needed for that exchange.
            </p>
            <p>
              <strong className="text-sombre-texte">
                Access, correction and DELETION.
              </strong>{" "}
              {/*  LA SUPPRESSION SE FAIT DEPUIS LE COMPTE, ET ELLE PASSE EN
                   PREMIER (nº 322) : l'écran Sécurité (`BlocSuppressions`)
                   supprime une fiche ou le compte entier, sans demander à
                   personne, et il est ouvert à TOUT compte connecté,
                   visiteur compris. La voie de l'e-mail RESTE, juste
                   après : elle sert à qui ne peut plus se connecter. */}
              An account can be deleted at any time by its owner, DIRECTLY
              FROM THE ACCOUNT, without asking anyone. A tattoo artist can
              also request, at any time, the correction or the complete
              deletion of their portfolio and account, by simply emailing{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className={CLASSE_LIEN}
              >
                {ÉDITEUR.contact}
              </a>
              . Deletion is carried out without conditions and without undue
              delay. Anyone can also ask what information the site holds
              about them, and have it corrected.
            </p>
            {/*  nº 814 — LES SOUS-TRAITANTS, NOMMÉS. Une politique de
                 confidentialité américaine dit QUI traite les données
                 pour le compte de l'éditeur. Ce sont des FAITS du site :
                 Vercel et Supabase (section « Hosting »), Resend
                 (lib/email — les courriels transactionnels), Google (la
                 connexion, nº 783 : Supabase reçoit l'adresse et le nom
                 du compte Google, rien de plus n'est demandé). */}
            <p>
              <strong className="text-sombre-texte">Who processes it.</strong>{" "}
              Four providers handle this information on the
              publisher&apos;s behalf, and for nothing else: Vercel (the
              site), Supabase (the database and the login), Resend (the
              emails the site sends — account confirmation, password reset,
              contact-form receipts) and Google, if you choose to log in
              with your Google account: Google then gives the site the
              email address and name of that account, and the site asks
              Google for nothing else.
            </p>
            {/*  nº 814 — LES DROITS, QUEL QUE SOIT L'ÉTAT. Le CCPA
                 (Californie) et ses cousins (Texas, etc.) demandent : le
                 droit de savoir, de supprimer, de corriger ; ne pas être
                 traité différemment pour l'avoir demandé ; « does not
                 sell or share » ; la vérification d'un mandataire ; et
                 un délai de réponse (45 jours au CCPA). Le site n'atteint
                 sûrement aucun de leurs seuils (docs/A-VALIDER-AVOCAT.md,
                 point 5) : il tient ces règles QUAND MÊME, parce qu'elles
                 sont déjà ce qu'il fait. */}
            <p>
              <strong className="text-sombre-texte">
                Your rights, whatever state you live in.
              </strong>{" "}
              You can ask what information the site holds about you, get a
              copy of it, have it corrected, or have it deleted — from the
              account, or by email. Requests are answered within forty-five
              days, and exercising these rights never changes how the site
              treats you. If someone writes on your behalf, the site checks
              with you first. {MARQUE_YOKOFOLIO.nom} does not sell personal
              information and does not share it for advertising, and never
              has: there is nothing for a &quot;Do Not Track&quot; or Global
              Privacy Control signal to opt out of.
            </p>
            {/*  nº 814 — LES ENFANTS (COPPA) : le site ne vise pas les
                 moins de 13 ans et n'en sait rien ; un compte demande
                 18 ans (Terms of Use). La page le DIT, enfin (point 6 du
                 document au juriste). */}
            <p>
              <strong className="text-sombre-texte">Children.</strong> The
              site is not meant for children under 13 and knowingly
              collects nothing from them; creating an account requires
              being at least 18 (see the Terms of Use). If you believe a
              child has created an account, write to{" "}
              <a href={`mailto:${ÉDITEUR.contact}`} className={CLASSE_LIEN}>
                {ÉDITEUR.contact}
              </a>
              : it will be deleted.
            </p>
          </SectionLegale>

          <SectionLegale titre="Cookies">
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              sets NO advertising cookies and uses no analytics tool that
              would track visitors from one site to another.
            </p>
            <p>
              Only the cookies strictly necessary for the site to work are
              used: they keep a logged-in user&apos;s session open. Browsing
              without an account sets none.
            </p>
          </SectionLegale>

          <SectionLegale titre="The photos belong to the tattoo artists">
            <p>
              Every image published on a portfolio remains the FULL PROPERTY
              of the tattoo artist who submitted it. {MARQUE_YOKOFOLIO.nom}{" "}
              claims no rights over these images: the site displays them to
              present their author&apos;s work, and for nothing else.
            </p>
            <p>
              By submitting an image, a tattoo artist declares that they are
              its author or hold the necessary rights, and authorizes its
              display on the site. This authorization ends as soon as the
              portfolio is deleted.
            </p>
            {/*  nº 814 — LE SIGNALEMENT PASSE PAR L'AGENT DMCA (section
                 suivante), plus par la boîte de contact : une seule
                 porte, celle du registre. La promesse ne change pas —
                 l'image est retirée. */}
            <p>
              Reproducing these images elsewhere without their author&apos;s
              consent is copyright infringement. Anyone who notices an image
              published without authorization can report it to the
              site&apos;s designated agent — the procedure is in the{" "}
              <a href="#dmca" className={CLASSE_LIEN}>
                Copyright and DMCA
              </a>{" "}
              section below — and it will be taken down.
            </p>
            <p>
              The name {MARQUE_YOKOFOLIO.nom}, its logo and the site&apos;s
              code remain the property of the publisher.
            </p>
          </SectionLegale>

          {/*  ██ nº 814 — LA SECTION DMCA ██
               La procédure de notification et de retrait du Digital
               Millennium Copyright Act (17 U.S.C. § 512), telle que le
               « safe harbor » l'exige : l'agent désigné et son
               enregistrement (§ 512(c)(2)), les six éléments d'une
               notification (§ 512(c)(3)), le retrait rapide et l'avis à
               l'artiste, la contre-notification et la remise en ligne
               (§ 512(g)), la clôture des récidivistes (§ 512(i)), la
               fausse déclaration (§ 512(f)). Les listes sont écrites en
               phrases numérotées, pas en puces : un seul paragraphe par
               étape, lisible d'une traite. */}
          <SectionLegale titre="Copyright and DMCA" id="dmca">
            <p>
              {MARQUE_YOKOFOLIO.nom} respects copyright and follows the
              notice-and-takedown procedure of the Digital Millennium
              Copyright Act (17 U.S.C. § 512). Its designated agent is
              registered with the U.S. Copyright Office:
            </p>
            <p>
              <strong className="text-sombre-texte">{AGENT_DMCA.nom}</strong>{" "}
              — Registration {AGENT_DMCA.enregistrement}
              <br />
              Email:{" "}
              <a href={`mailto:${AGENT_DMCA.contact}`} className={CLASSE_LIEN}>
                {AGENT_DMCA.contact}
              </a>
              <br />
              The agent&apos;s full contact details are on file in the
              Copyright Office&apos;s DMCA Designated Agent Directory.
            </p>
            <p>
              <strong className="text-sombre-texte">Sending a notice.</strong>{" "}
              If you believe a photo published on the site infringes a
              copyright you own or represent, email the agent with: (1) the
              work you say is infringed; (2) the photo or portfolio
              concerned and where it is on the site (its address); (3) your
              name, mailing address, phone number and email; (4) a statement
              that you believe in good faith that the use is not authorized
              by the copyright owner, their agent, or the law; (5) a
              statement, under penalty of perjury, that the information in
              the notice is accurate and that you are the owner or
              authorized to act on the owner&apos;s behalf; (6) your
              physical or electronic signature.
            </p>
            <p>
              <strong className="text-sombre-texte">What happens next.</strong>{" "}
              The photo is taken down or made inaccessible promptly, and the
              artist who published it is told why, with a copy of the
              notice. An account that infringes repeatedly is closed.
            </p>
            <p>
              <strong className="text-sombre-texte">Counter-notification.</strong>{" "}
              If your photo was removed and you believe it was a mistake or
              a misidentification, email the agent with: (1) the photo
              concerned and where it was; (2) a statement, under penalty of
              perjury, that you believe in good faith it was removed by
              mistake or misidentification; (3) your name, address and phone
              number; (4) your consent to the jurisdiction of the federal
              district court for your district — or, if you live outside
              the United States, of any judicial district in which the
              publisher may be found — and your agreement to accept service
              of process from the person who sent the notice; (5) your
              physical or electronic signature. The counter-notification is
              forwarded to that person; unless they tell the agent within
              ten business days that they have filed a court action, the
              photo can be put back within ten to fourteen business days.
            </p>
            <p>
              Knowingly misrepresenting that content is infringing, or that
              it was removed by mistake, can make you liable for damages
              (17 U.S.C. § 512(f)).
            </p>
          </SectionLegale>

          <SectionLegale titre="Links to Instagram and TikTok">
            <p>
              {/*  ⚠️ LE `{" "}` APRÈS LE NOM DE MARQUE : sans lui, on
                   lisait « yokofolion'en est ni l'éditeur ». Voir
                   BlocSuppressions pour la règle. */}
              Portfolios link to the artists&apos; accounts on third-party
              sites. {MARQUE_YOKOFOLIO.nom}{" "}
              neither publishes nor is responsible for them: once you follow
              a link, the terms and privacy policy of those platforms apply.
            </p>
          </SectionLegale>

          {/*  nº 814 — LE RENVOI AUX TERMS OF USE : les règles (usage,
               comptes, garantie des artistes, responsabilité, droit
               applicable) vivent là-bas ; cette page en fait partie. */}
          <SectionLegale titre="Terms of Use">
            <p>
              The rules for using the site — accounts, portfolios, the
              artists&apos; photos, liability and governing law — are in
              the{" "}
              <LienAuGeste href={CHEMIN_TERMS} className={CLASSE_LIEN}>
                Terms of Use
              </LienAuGeste>
              . This notice is part of them.
            </p>
          </SectionLegale>

          <SectionLegale titre="Updates">
            <p>
              This notice describes a site published by an individual, on a
              non-commercial basis. If a company is created to operate{" "}
              {MARQUE_YOKOFOLIO.nom}, it will be updated accordingly (company
              name, legal form, registered office, registration number).
            </p>
          </SectionLegale>
        </div>

        {/*  LA DATE DE DERNIÈRE MISE À JOUR (nº 322). Elle ferme le
             CONTENU, avant le lien de retour, qui est de la navigation et
             non du texte légal. Même écriture que le chapô, même marge
             que la pile de sections : la page ne gagne aucun jeton.
             ⚠️ ELLE CHANGE À LA nº 804 : le contenu a changé de fond
             (adaptation américaine), la date le dit. La nº 814 (DMCA,
             vie privée, Terms) tombe le même jour : même date. */}
        <p className="mt-10 text-[15px] text-sombre-texte-doux">
          Last updated: September 2, 2026
        </p>

        {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE : ce
             bouton finit le parcours et va EN AVANT. La page reste
             serveur, seul le lien est client.
             §2 (nº 799) — LES MESURES DE LA nº 788 : 40 px et 14 px,
             comme les capsules de « Qui sommes-nous ». */}
        <LienAccueil
          className="mt-12 inline-flex items-center justify-center rounded-full
                     px-6 min-h-[40px] text-[14px] border border-sombre-bordure
                     text-sombre-texte hover:border-primaire hover:text-primaire
                     transition-colors"
        >
          Back to home
        </LienAccueil>
      </main>
    </>
  );
}
