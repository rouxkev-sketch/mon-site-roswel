import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * LES MENTIONS LÉGALES DE YOKOFOLIO
 * =================================
 * Adresse : /mentions-legales
 *
 * Obligatoires en France dès la mise en ligne (LCEN, article 6-III).
 * Elles décrivent un site SANS MODÈLE ÉCONOMIQUE : rien n'est vendu,
 * aucune commission n'est prise, aucune publicité n'est affichée.
 *
 * ⚠️ L'ADRESSE PERSONNELLE N'EST PAS PUBLIÉE, et c'est légal : une
 * personne physique qui édite un site à titre NON PROFESSIONNEL peut
 * n'en donner que le nom, le prénom et l'hébergeur (article 6-III-2 de
 * la LCEN), à condition d'avoir communiqué son identité complète à
 * l'hébergeur. C'est écrit noir sur blanc plus bas.
 *
 * Le jour où une société est créée : dénomination, forme juridique,
 * capital, siège, SIREN et TVA deviennent obligatoires. Tout est
 * regroupé dans un seul objet, ÉDITEUR, pour n'avoir qu'un endroit à
 * reprendre.
 */

const ÉDITEUR = {
  contact: "contact@yokofolio.com",
};

const HÉBERGEURS = [
  {
    nom: "Vercel Inc.",
    role: "hébergement du site",
    adresse: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    site: "https://vercel.com",
  },
  {
    nom: "Supabase Inc.",
    role: "hébergement de la base de données",
    adresse: "970 Toa Payoh North #07-04, Singapour 318992",
    site: "https://supabase.com",
  },
];

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Éditeur, hébergement et traitement des données du site ${MARQUE_YOKOFOLIO.nom}.`,
  alternates: { canonical: `${adresseDuSite()}/mentions-legales` },
};

/** Une section : titre net, texte lisible, marges généreuses. */
function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-sombre-bordure pt-7 first:border-0 first:pt-0">
      <h2 className="text-[clamp(1.05rem,2.2vw,1.25rem)] font-bold text-sombre-texte">
        {titre}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-sombre-texte-doux">
        {children}
      </div>
    </section>
  );
}

export default function PageMentionsLegales() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[760px] px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight text-sombre-texte">
          Mentions légales
        </h1>
        <p className="mt-3 text-[15px] text-sombre-texte-doux">
          Qui édite {MARQUE_YOKOFOLIO.nom}, qui l&apos;héberge, et ce que
          deviennent les informations qui y passent.
        </p>

        <div className="mt-10 flex flex-col gap-7">
          <Section titre="Éditeur du site">
            <p>
              <strong className="text-sombre-texte">
                Site édité à titre personnel et non professionnel.
              </strong>
              <br />
              Contact :{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>
            </p>
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              est édité SANS MODÈLE ÉCONOMIQUE : le site ne vend rien, ne
              prend aucune commission, n&apos;affiche aucune publicité et ne
              revend aucune donnée.
            </p>
            <p>
              Conformément à l&apos;article 6-III-2 de la loi n° 2004-575 du
              21 juin 2004 pour la confiance dans l&apos;économie numérique,
              l&apos;éditeur a transmis ses éléments d&apos;identification
              personnelle à l&apos;hébergeur. Ces éléments ne sont donc pas
              publiés sur le site ; ils sont communiqués sur réquisition de
              l&apos;autorité judiciaire.
            </p>
          </Section>

          <Section titre="Directeur de la publication">
            <p>L&apos;éditeur du site.</p>
          </Section>

          <Section titre="Hébergement">
            <p>Le site et ses données sont hébergés par :</p>
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
                    className="text-primaire hover:underline"
                  >
                    {h.site.replace("https://", "")}
                  </a>
                </li>
              ))}
            </ul>
            {/*  §3-e (nº 322) — LE TRANSFERT HORS D'EUROPE, DIT EN
                 TOUTES LETTRES. Les deux adresses ci-dessus le
                 montraient déjà (Californie, Singapour), mais une
                 adresse n'est pas une information sur le TRAITEMENT :
                 le RGPD demande que le transfert hors UE soit annoncé
                 pour lui-même. */}
            <p>
              Ces deux hébergeurs sont établis hors de l&apos;Union
              européenne : les données du site sont donc traitées aux
              États-Unis et à Singapour.
            </p>
          </Section>

          <Section titre="Données personnelles">
            <p>
              Un visiteur qui se contente de chercher un tatoueur ne crée aucun
              compte et ne donne aucune information : {MARQUE_YOKOFOLIO.nom} ne
              lui demande rien.
            </p>
            {/*  §3-a (nº 322) — LE COMPTE VISITEUR. C'ÉTAIT LE MANQUE LE
                 PLUS IMPORTANT DE CETTE PAGE : le paragraphe ci-dessus
                 affirmait qu'un visiteur ne crée aucun compte, et ce
                 n'est plus vrai depuis « Ma sélection ». Les trois
                 données nommées ici sont EXACTEMENT les trois tables du
                 site — `tatoueurs_suivis`, `favoris_photos` et
                 `visites_selection` — et toutes trois disparaissent
                 avec le compte (`on delete cascade` sur `auth.users`),
                 ce qui est précisément ce que la dernière phrase
                 promet. */}
            <p>
              Un VISITEUR qui veut garder une sélection crée un compte avec une
              adresse e-mail. Le site conserve alors les portfolios qu&apos;il
              suit, les photos qu&apos;il a mises en favori, et la date de sa
              dernière visite — uniquement pour lui afficher sa sélection et
              lui signaler ce qui est nouveau depuis son dernier passage. Rien
              de cela n&apos;est vendu, cédé, ni utilisé à des fins
              publicitaires. Base légale : l&apos;exécution du service demandé
              (article 6.1.b du RGPD). Conservation : tant que le compte
              existe, puis suppression.
            </p>
            <p>
              Un TATOUEUR qui crée son portfolio fournit un nom, une ville, une
              adresse e-mail, ses styles, ses images et ses liens vers ses
              réseaux. Ces informations servent uniquement à afficher sa fiche
              et à le contacter au sujet de celle-ci. Elles ne sont ni vendues,
              ni cédées, ni utilisées à des fins publicitaires.
            </p>
            <p>
              Base légale : l&apos;exécution du service demandé (article 6.1.b
              du RGPD) pour les informations du portfolio. Conservation : tant
              que le portfolio existe, puis suppression.
            </p>
            {/*  §3-f (nº 322) — LA RELECTURE DES PHOTOS. Elle existe
                 (une fiche modifiée repasse en validation), et c'est un
                 ACCÈS de l'éditeur aux images déposées : une page qui
                 dit ce que deviennent les informations doit le dire.
                 Elle est posée juste après la fiche, dont elle parle,
                 et avant le formulaire de contact, qui est un autre
                 traitement. */}
            <p>
              Les photos déposées sur un portfolio sont relues avant
              d&apos;être publiées. L&apos;éditeur du site y a donc accès, à
              cette seule fin.
            </p>
            {/*  §3-d (nº 322) — LE FORMULAIRE DE CONTACT : trois champs,
                 une seule raison d'être. Il ne relevait d'aucun des
                 paragraphes précédents — ni fiche, ni sélection — d'où
                 son paragraphe à lui. */}
            <p>
              Le formulaire de contact recueille un nom, une adresse e-mail et
              un message. Ils servent uniquement à répondre, et ne sont
              conservés que le temps nécessaire à cet échange.
            </p>
            <p>
              <strong className="text-sombre-texte">
                Droit d&apos;accès, de rectification et de SUPPRESSION.
              </strong>{" "}
              {/*  §3-b (nº 322) — LA SUPPRESSION SE FAIT DEPUIS LE
                   COMPTE, ET ELLE PASSE EN PREMIER. La page n'offrait
                   qu'une voie, l'e-mail — c'était sous-estimer ce que
                   le site sait faire : l'écran Sécurité
                   (`BlocSuppressions`) supprime une fiche ou le compte
                   entier, sans demander à personne, et il est ouvert à
                   TOUT compte connecté, visiteur compris. La voie de
                   l'e-mail RESTE, juste après : elle sert à qui ne
                   peut plus se connecter. */}
              Un compte peut être supprimé à tout moment par son titulaire,
              DIRECTEMENT DEPUIS SON COMPTE, sans avoir à le demander à
              personne. Un tatoueur peut demander à tout moment la correction
              ou la
              suppression complète de sa fiche et de son compte, par simple
              e-mail à{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>
              . La suppression est effectuée sans condition et sans délai
              inutile. Il dispose aussi d&apos;un droit d&apos;opposition, de
              limitation et de portabilité, et peut adresser une réclamation à
              la CNIL (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primaire hover:underline"
              >
                cnil.fr
              </a>
              ).
            </p>
          </Section>

          <Section titre="Cookies">
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              ne dépose AUCUN cookie publicitaire et n&apos;utilise aucun outil
              de mesure d&apos;audience qui suivrait les visiteurs d&apos;un
              site à l&apos;autre.
            </p>
            <p>
              Seuls sont utilisés les cookies strictement nécessaires au
              fonctionnement du site : ils maintiennent la session d&apos;un
              tatoueur connecté à son espace. Ceux-là sont dispensés de
              consentement (article 82 de la loi Informatique et Libertés).
              Naviguer sans compte n&apos;en dépose aucun.
            </p>
          </Section>

          <Section titre="Les photos appartiennent aux tatoueurs">
            <p>
              Chaque image publiée sur une fiche reste la PROPRIÉTÉ ENTIÈRE du
              tatoueur qui l&apos;a déposée. {MARQUE_YOKOFOLIO.nom}{" "}
              ne revendique aucun droit sur ces images : le site les affiche
              pour présenter le travail de leur auteur, et pour rien
              d&apos;autre.
            </p>
            <p>
              En déposant une image, un tatoueur déclare en être l&apos;auteur
              ou disposer des droits nécessaires, et autorise son affichage sur
              le site. Cette autorisation cesse dès la suppression de la fiche.
            </p>
            <p>
              Reproduire ces images ailleurs sans l&apos;accord de leur auteur
              est une contrefaçon. Toute personne qui constate la publication
              d&apos;une image sans autorisation peut écrire à{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>{" "}
              : elle sera retirée.
            </p>
            <p>
              Le nom {MARQUE_YOKOFOLIO.nom}, son logo et le code du site
              restent, eux, la propriété de l&apos;éditeur.
            </p>
          </Section>

          <Section titre="Liens vers Instagram et TikTok">
            <p>
              {/*  ⚠️ LE `{" "}` APRÈS LE NOM DE MARQUE : sans lui, on
                   lisait « yokofolion'en est ni l'éditeur ». Voir
                   BlocSuppressions pour la règle. */}
              Les fiches renvoient vers les comptes des tatoueurs sur des sites
              tiers. {MARQUE_YOKOFOLIO.nom}{" "}
              n&apos;en est ni l&apos;éditeur ni
              le responsable : une fois le lien suivi, ce sont les conditions et
              la politique de confidentialité de ces plateformes qui
              s&apos;appliquent.
            </p>
          </Section>

          <Section titre="Mise à jour">
            <p>
              Ces mentions décrivent un site édité par un particulier, à titre
              non professionnel. Si une société est créée pour porter{" "}
              {MARQUE_YOKOFOLIO.nom}, elles seront mises à jour en conséquence
              (dénomination, forme juridique, capital, siège social, numéro
              SIREN et TVA intracommunautaire).
            </p>
          </Section>
        </div>

        {/*  §3-g (nº 322) — LA DATE DE DERNIÈRE MISE À JOUR.
             ------------------------------------------------------------
             Elle ferme le CONTENU, avant le lien de retour, qui est de la
             navigation et non du texte légal.
             ⚠️ AUCUNE VALEUR NOUVELLE : l'écriture est mot pour mot celle
             du chapô de cette page (`text-[15px] text-sombre-texte-doux`),
             et la marge celle qui sépare déjà le chapô de la pile de
             sections (`mt-10`). La page ne gagne pas un jeton, pas une
             taille, pas une couleur — c'est la consigne de la nº 322. */}
        <p className="mt-10 text-[15px] text-sombre-texte-doux">
          Dernière mise à jour : 16 août 2026
        </p>

        {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE : ce
             bouton finit le parcours et va EN AVANT ; sans les deux
             déclarations (nº 429 et nº 446), l'arrivée pouvait rendre
             la place mémorisée de l'accueil — le bas. La page reste
             serveur, seul le lien est client. */}
        {/*  §2 (nº 799) — LES MESURES DE LA nº 788, COMME LES DEUX
             CAPSULES DE « QUI SOMMES-NOUS » À LA nº 798. Cette
             capsule-ci était à 48 px et NE DÉCLARAIT AUCUNE TAILLE DE
             TEXTE : elle héritait donc celle du corps, 16 px. Elle
             passe à 40 px et 14 px.
             ⚠️ RIEN D'AUTRE NE CHANGE : ni `px-6`, ni le contour, ni
             le survol qui le fait virer au rose. Le propriétaire a
             demandé la hauteur et la typo. */}
        <LienAccueil
          className="mt-12 inline-flex items-center justify-center rounded-full
                     px-6 min-h-[40px] text-[14px] border border-sombre-bordure
                     text-sombre-texte hover:border-primaire hover:text-primaire
                     transition-colors"
        >
          Retour à l&apos;accueil
        </LienAccueil>
      </main>
    </>
  );
}
