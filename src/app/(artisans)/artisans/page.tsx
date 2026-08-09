import { existsSync } from "fs";
import { join } from "path";
import Image from "next/image";
import Link from "next/link";
import {
  PASTILLES,
  SCORE_ANCIENNETE,
  SCORE_GOOGLE,
  SCORE_INSTAGRAM,
} from "@/config/roswel";
import { FormulaireRecherche } from "@/components/FormulaireRecherche";
import {
  IconeBadgeVerifie,
  IconeBouclierCoche,
  IconeGoogle,
  IconeInstagram,
} from "@/components/Icones";

/**
 * PAGE D'ACCUEIL (design maquette)
 * --------------------------------
 * 1. Zone hero : titre + sous-titre (gauche) et bloc « Vous êtes
 *    artisan ? » (droite) ; en dessous un grand encadré unique
 *    moteur + photo d'équipe.
 * 2. « Notre méthode » : grand encadré unique image + 4 modules.
 * 3. Pied de page (liens légaux).
 *
 * Photos attendues (déposées à la main par le propriétaire ; tant
 * qu'elles n'y sont pas, un fond assorti prend la place) :
 *   public/images/equipe-artisans.jpg   (hero)
 *   public/images/methode-cuisine.jpg    (bloc « Notre méthode »)
 */

/** Les badges présentés dans le module « Badges de confiance » */
const BADGES_PRESENTATION = [
  { label: PASTILLES.top.label, couleur: PASTILLES.top.couleur },
  { label: PASTILLES.recommande.label, couleur: PASTILLES.recommande.couleur },
];

/**
 * Les 3 modules « de score » du bloc « Notre méthode » (desktop) :
 * Google, entreprise vérifiée, Instagram. Le module « Badges de
 * confiance » est rendu à part (fond bleu). Le module « score sur
 * 100 » n'apparaît plus ici sur desktop : il est passé dans le titre.
 */
const MODULES_METHODE = [
  {
    cle: "google",
    icone: <IconeGoogle taille={40} />,
    titre: "Notes et avis",
    description: (
      <>
        Les avis Google sont analysés et{" "}
        <strong className="text-encre">
          contribuent jusqu&apos;à {SCORE_GOOGLE.maximum} points
        </strong>{" "}
        au score de confiance.
      </>
    ),
  },
  {
    cle: "entreprise",
    icone: <IconeBouclierCoche taille={40} />,
    titre: "Entreprise vérifiée",
    description: (
      <>
        Le SIREN est vérifié et l&apos;ancienneté{" "}
        <strong className="text-encre">
          contribue jusqu&apos;à {SCORE_ANCIENNETE.maximum} points
        </strong>{" "}
        au score de confiance.
      </>
    ),
  },
  {
    cle: "instagram",
    icone: <IconeInstagram taille={40} />,
    titre: "Abonnés et publications",
    description: (
      <>
        L&apos;activité Instagram est analysée et{" "}
        <strong className="text-encre">
          contribue jusqu&apos;à {SCORE_INSTAGRAM.maximum} points
        </strong>{" "}
        au score de confiance.
      </>
    ),
  },
];

/**
 * LE BLOC « VOUS ÊTES ARTISAN ? » (appel à l'action)
 * --------------------------------------------------
 * Réutilisé sur mobile (section pleine largeur, sous la méthode) et
 * sur desktop (à droite du titre, dans le hero). `compact` = titre +
 * bouton seulement. Le contenu est centré verticalement (h-full +
 * justify-center) : sur desktop le bloc s'étire sur la hauteur du
 * titre + sous-titre.
 */
function BlocDevenirArtisan({
  arrondi,
  compact = false,
}: {
  arrondi: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`${arrondi} bg-gradient-to-br from-degrade-debut to-degrade-fin p-6 text-white shadow-lg shadow-primaire/25 h-full flex flex-col justify-center`}
    >
      <h2
        className="font-bold leading-tight"
        style={{ fontSize: "clamp(22px, calc(1.6vw + 16.9px), 28px)" }}
      >
        Vous êtes artisan&nbsp;?
      </h2>
      {!compact && (
        <>
          <p className="text-[15px] font-semibold mt-2">
            Rejoignez Roswel gratuitement&nbsp;:
          </p>
          <ul className="mt-1.5 space-y-1 text-[14.5px] leading-snug text-white/95 list-disc pl-5">
            <li>votre réputation devient votre meilleur atout</li>
            <li>Recevez les demandes clients directement sur WhatsApp.</li>
          </ul>
        </>
      )}
      <Link
        href="/devenir-artisan"
        className="mt-4 inline-flex items-center justify-center w-full min-h-[50px] rounded-full bg-white hover:bg-[#F8F8FA] active:bg-[#ECECF0] text-primaire-fonce font-bold text-[15px] shadow-sm transition-colors duration-200"
      >
        Créer ma fiche gratuitement
      </Link>
    </div>
  );
}

export default function Accueil() {
  const photoExiste = existsSync(
    join(process.cwd(), "public", "images", "equipe-artisans.jpg")
  );
  const photoMethodeExiste = existsSync(
    join(process.cwd(), "public", "images", "methode-cuisine.jpg")
  );

  return (
    // « accueil-large » : (1) dès 768 px, la barre de menu s'aligne sur
    // ce contenu (max 992 px) ; (2) toute la page prend le fond gris
    // clair (à toutes les tailles) — voir globals.css. Le fond gris est
    // posé sur le <body>, pas ici, pour englober aussi le pied de page.
    <main className="accueil-large flex-1 flex flex-col">
      {/* ===== 1. Image d'accueil avec titre par-dessus (MOBILE) =====
           (alignée sur la largeur du contenu, comme le reste du site)
           Version mobile INCHANGÉE : masquée dès 768 px, où la refonte
           desktop deux colonnes ci-dessous prend le relais. */}
      {/* Photo BORD À BORD (pleine largeur) sur toute la plage d'étirement,
          y compris à l'approche de 768 — plus de plafond 730 ni de marges
          latérales sur la photo. */}
      <section className="relative w-full min-[640px]:hidden">
        {/* Hauteur FLUIDE (remplace h-[430px] fixe) : la photo grandit
            avec la largeur (~430 px à 320 → ~510 px à 730) au lieu de
            rester figée — jamais écrasée en bandeau à l'approche de 768. */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(430px, calc(19.5vw + 368px), 510px)" }}
        >
          {photoExiste ? (
            <Image
              src="/images/equipe-artisans.jpg"
              alt="L'équipe des artisans Roswel"
              fill
              priority
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-cover object-bottom"
            />
          ) : (
            // Fond de remplacement tant que la photo n'est pas déposée
            // dans public/images/equipe-artisans.jpg
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #F4EFE9 0%, #EDE5DD 55%, #E3D8CE 100%)",
              }}
            />
          )}

          {/* Titre CENTRÉ + sous-titre rose, directement sur l'image, dans
              la zone vide en haut (au-dessus des têtes). C'est la SEULE
              présentation du titre TANT QU'ON N'A PAS atteint la bascule
              « grand écran » (640 px) : plus de couple H1-gauche /
              sous-titre-droite avant 640 — les deux ne coexistent jamais.
              Tailles fluides, pour rester dans l'espace haut de la photo. */}
          {/* MARGE HAUTE FLUIDE, mais SEULEMENT à l'approche de la
              bascule. Aux largeurs de téléphone courantes (jusqu'à
              430 px) elle vaut 28 px, exactement comme avant. Au-delà, la
              photo grandit plus vite que sa hauteur ne suit : les visages
              remontent vers le titre. La marge se réduit donc
              progressivement — 28 px jusqu'à 430, ~20 px à 500, ~13 px à
              560, 4 px juste avant la bascule (640) — pour que le bloc
              titre + sous-titre reste au-dessus des têtes jusqu'au bout.
              Trois nombres à retoucher si la photo demande plus ou moins
              de dégagement : 77.36 (constante), 11.48 (pente) et les deux
              bornes du clamp. */}
          <div
            className="absolute inset-x-0 top-0 px-5 text-center"
            style={{ paddingTop: "clamp(4px, calc(77.36px - 11.48vw), 28px)" }}
          >
            {/* Police FLUIDE calée pour GRANDIR jusqu'à 768 (~26 px à 320
                → ~33 px à 730) au lieu de plafonner tôt (34 px dès 493).
                Plafond 33 px calé pour limiter le saut à 768 (héro desktop
                ~28 px), la disposition changeant à ce point. */}
            <h1
              className="font-bold text-encre leading-[1.18]"
              style={{ fontSize: "clamp(26px, calc(1.7vw + 20.5px), 33px)" }}
            >
              Le moteur de recherche
              <br />
              d&apos;artisans de confiance.
            </h1>
            {/* Sous-titre : GRIS #474747 en poids NORMAL (plus de rose gras).
                La police est LÉGÈREMENT agrandie (~+8 %) pour compenser la
                perte de gras et garder sa présence sur la photo — tout en
                restant nettement en retrait du titre (~62 % de sa taille).
                Seul « Sans publicité. » garde le ROSE, à la même taille. */}
            <p
              className="leading-snug mt-3 mx-auto max-w-[24em]"
              style={{ fontSize: "clamp(16.2px, calc(0.927vw + 13.23px), 20px)" }}
            >
              <span className="font-normal" style={{ color: "#474747" }}>
                Un score sur 100 basé sur les avis Google,
                <br />
                Instagram et l&apos;ancienneté vérifiée.
              </span>
              <br />
              <span className="text-primaire font-medium">Sans publicité.</span>
            </p>
          </div>

        </div>

        {/* ===== 2. Moteur de recherche, débordant sur la photo =====
            Chevauchement FLUIDE (remplace -mt-14 fixe) : proportionnel à
            la largeur pour rester cohérent quand le moteur s'élargit. */}
        <div
          className="relative z-10 px-4"
          style={{ marginTop: "clamp(-66px, -9vw, -56px)" }}
        >
          <FormulaireRecherche />
        </div>
      </section>

      {/* ===== 1 bis. HERO DESKTOP / IPAD (≥ 768 px) — refonte 2026 =====
           Rangée 1 : titre + sous-titre à GAUCHE, bloc rose « Vous êtes
           artisan ? » à DROITE (même hauteur que le titre + sous-titre,
           contenu centré). Rangée 2 : un GRAND ENCADRÉ UNIQUE = moteur
           (gauche, plus étroit) + photo d'équipe (droite, plus large),
           fusionnés sans bordure entre eux. Invisible sur mobile.
           `relative z-20` : quand le menu déroulant du moteur s'ouvre, il
           déborde l'encadré et doit passer au-dessus de la section
           « méthode » qui suit. */}
      {/* Ce héro « grand écran » complet (moteur à gauche / photo à droite,
          titre + barre rose + sous-titre au-dessus) est désormais affiché
          DÈS 640 px (et non plus 768) : le smartphone étiré (640–767) adopte
          la présentation 1440. Ses points de bascule internes sont abaissés
          de md (768) à 640 en conséquence ; ≥ 768 reste identique. */}
      <section className="relative z-20 hidden min-[640px]:block w-full">
        <div className="max-w-[1192px] mx-auto px-4 pt-7 lg:pt-9 pb-6 lg:pb-8">
          {/* --- Rangée 1 : titre SEUL (gauche) + bloc artisan (droite) ---
              Aucun sous-titre sous le H1. La rangée est bornée par le H1 ;
              le bloc de droite (barre horizontale) s'aligne exactement sur
              sa hauteur (items-stretch). Colonnes : on donne plus de place
              au bloc pour que « titre + bouton » tiennent sur une ligne. */}
          <div className="grid items-stretch gap-x-6 min-[640px]:grid-cols-[auto_auto_1fr] min-[640px]:gap-x-0">
            <div className="flex flex-col justify-center min-w-0">
              {/* SEO — UN SEUL <h1> par page : ce titre reprend MOT POUR MOT
                  celui du héro smartphone, qui porte le <h1> (l'indexation
                  de Google est « mobile d'abord »). Ici, c'est donc un <p>
                  avec exactement la même typographie : rendu identique à
                  l'écran, pas de titre en double dans le code de la page. */}
              <p
                className="font-bold whitespace-nowrap"
                style={{
                  // Police FLUIDE : ~28 px à 768 → 44 px à 1160 (plafond).
                  // Borne basse abaissée à 22 px pour que le héro « grand
                  // écran » tienne aussi de 640 à 767 px (smartphone étiré)
                  // sans débordement. ≥ 768 px inchangé (la formule ≥ 28 px
                  // domine, la borne basse ne joue pas).
                  fontSize: "clamp(22px, 3.68vw, 44px)",
                  lineHeight: "1.05",
                  letterSpacing: "-0.034em",
                  color: "#1A2340",
                }}
              >
                Le moteur de recherche
                <br />
                d&apos;artisans de confiance
                {/* Point final présent à partir de l'iPad (md) : iPad ET
                    desktop. Reste absent sur mobile (héro séparé). */}
                <span className="hidden min-[640px]:inline">.</span>
              </p>
            </div>

            {/* iPad + desktop (≥ 768) : à droite du H1, une barre verticale
                ROSE de séparation, puis le sous-titre (déplacé depuis la
                photo). Le rectangle « Vous êtes artisan ? » a été retiré
                (iPad ET desktop). Le sous-titre reprend la typo et le GRIS de
                « Pour un score de confiance sur 100. » (font-medium, #6E6E72) ;
                « Sans publicité. » reste ROSE. */}
            <div
              className="hidden min-[640px]:block self-stretch my-1 mx-6 w-[3px] rounded-full bg-primaire"
              aria-hidden
            />
            <div className="hidden min-[640px]:flex items-center min-w-0">
              {/* EXACTEMENT 2 lignes forcées (retour après « Google, ») :
                  la ligne 2 (la plus longue) s'étend jusqu'au bord droit de
                  l'encadré. `whitespace-nowrap` empêche tout retour
                  automatique. La taille est réglée PAR PLAGE — l'iPad est plus
                  étroit que le web : md (iPad portrait), lg (iPad paysage),
                  xl (web) — pour que la ligne 2 atteigne ce bord sans déborder. */}
              <p
                className="font-medium whitespace-nowrap"
                style={{
                  // Police FLUIDE unique (remplace les paliers 14/16/18/27),
                  // CALÉE pour que la fin de la ligne 2 (la plus longue) tombe
                  // sur le BORD DROIT de l'encadré moteur+photo en dessous, à
                  // toutes les largeurs : la taille suit la largeur de colonne
                  // (elle-même ≈ 0,592·largeur − 72), gap constant ~4 px.
                  // Borne basse abaissée à 11 px : de 640 à 767 px (smartphone
                  // étiré) la formule continue de s'appliquer pour que la
                  // ligne 2 tombe sur le bord droit de l'image sans déborder.
                  // ≥ 768 px inchangé (la formule ≥ 16,6 px domine).
                  fontSize: "clamp(11px, calc(2.596vw - 3.32px), 27.6px)",
                  color: "#6E6E72",
                  lineHeight: "1.3",
                }}
              >
                Un score sur 100 basé sur les avis Google,
                <br />
                Instagram et l&apos;ancienneté vérifiée.{" "}
                <span className="text-primaire">Sans publicité.</span>
              </p>
            </div>
          </div>

          {/* --- Rangée 2 : GRAND ENCADRÉ moteur + photo ---
              PAS d'overflow-hidden sur le grand encadré : sinon le menu
              déroulant « Quel artisan ? » du moteur serait rogné.
              On arrondit donc chaque cellule séparément (gauche = moteur,
              droite = photo), et seule la cellule photo masque son
              débordement (pour clipper l'image en coins arrondis). */}
          <div className="mt-8 grid min-[640px]:grid-cols-[474fr_686fr] rounded-2xl border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)]">
            {/* Moteur (partie gauche, plus étroite). Champs empilés en
                pleine largeur, généreusement aérés. Pas de bordure propre :
                c'est le grand encadré qui la porte. `relative z-10` +
                coins arrondis à gauche ; surtout PAS d'overflow-hidden,
                pour que le menu déroulant puisse s'afficher par-dessus. */}
            <div className="relative z-10 bg-fond rounded-l-2xl p-[clamp(24px,3.36vw,40px)] flex flex-col justify-center">
              <FormulaireRecherche
                disposition="empile"
                idVille="champ-ville-desktop"
                enTete={
                  <p
                    className="text-[12px] font-bold uppercase"
                    style={{ color: "#1A2340", letterSpacing: "0.08em" }}
                  >
                    Confiance vérifiée
                  </p>
                }
                classeCarte="w-full flex flex-col gap-5"
              />
            </div>

            {/* Photo (partie droite, plus large), en cover. Le sous-titre
                du site est désormais posé ICI, centré sur la photo.
                overflow-hidden + coins arrondis à droite pour clipper
                proprement l'image. */}
            {/* Cet encadré appartient au héro desktop/iPad (section
                « hidden md:block ») : il n'est PAS affiché sur mobile
                (< 768 px), qui a son propre héro. Hauteur, par plage :
                • base min-h 460 : simple valeur de repli, jamais visible
                  (l'encadré est masqué sous 768) — laissée telle quelle ;
                • iPad (768–1279, md:min-h-340) : hauteur d'ORIGINE rétablie.
                  Le contenu du moteur dépassant 340, l'encadré suit ce
                  contenu (aucun grand vide) et retrouve ses proportions
                  initiales ;
                • desktop (≥ 1280, xl:min-h-0) : la hauteur suit le moteur
                  (INCHANGÉ).
                Cadrage photo : centré (origine) sur iPad ; seul le desktop
                l'abaisse (xl:object-[50%_70%]). */}
            <div className="relative min-h-[460px] min-[640px]:min-h-0 overflow-hidden rounded-r-2xl">
              {/* CADRAGE JUSTE APRÈS LA BASCULE.
                  À 640 px, la cellule photo est nettement plus HAUTE que
                  large : « object-cover » l'ajuste alors sur la HAUTEUR,
                  donc toute la hauteur de la photo est visible — y compris
                  le vide au-dessus des têtes — et seuls les côtés sont
                  rognés. Ce calque déborde par le HAUT (`top` négatif) :
                  la zone à couvrir devient plus haute, la photo est donc
                  agrandie d'autant, ce qui ROGNE davantage les côtés et
                  fait SORTIR le vide du haut par le bord supérieur. Les
                  visages remontent dans le cadre.
                  Le débordement se referme progressivement quand la
                  fenêtre s'élargit — ~75 px à 640, ~52 px à 768, ~6 px à
                  1024, plus rien au-delà : la cellule devient alors assez
                  large pour que « cover » rogne en hauteur de lui-même, et
                  les bords gauche et droit redeviennent visibles. */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{ top: "calc(-1 * clamp(0px, calc(190px - 18vw), 120px))" }}
              >
              {photoExiste ? (
                <Image
                  src="/images/equipe-artisans.jpg"
                  alt="L'équipe des artisans Roswel"
                  fill
                  priority
                  sizes="58vw"
                  // Cadrage UNIQUE (format grand écran fluide) dès 768 px :
                  // 50% 88% — le même qu'en web, abaissé pour montrer les mains
                  // et outils des artisans. (base object-center inerte :
                  // encadré masqué < 768.) À ajuster sur la vraie photo si besoin.
                  className="object-cover object-center min-[640px]:object-[50%_88%]"
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(160deg, #F4EFE9 0%, #EDE5DD 55%, #E3D8CE 100%)",
                  }}
                />
              )}
              </div>

              {/* Le sous-titre du site n'est plus sur la photo : il a été
                  déplacé à droite du H1 (rangée 1), sur iPad ET desktop. */}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. « Notre méthode » (bloc explicatif) =====
           Mobile : titre + 5 modules empilés (INCHANGÉ). Desktop : un
           titre « Notre méthode. Pour un score… » puis un GRAND ENCADRÉ
           UNIQUE = image (gauche) + 4 modules empilés séparés par un
           trait fin (droite). */}
      <section className="px-5 md:px-4 pt-9 md:pt-2 pb-2 md:pb-14 max-w-[730px] md:max-w-[1192px] w-full mx-auto">
        {/* Titre MOBILE : une seule phrase, entièrement en gras et noir. */}
        <h2
          className="md:hidden leading-snug font-bold"
          style={{ color: "#1A2340", fontSize: "clamp(21px, calc(1.5vw + 16px), 26px)" }}
        >
          Notre méthode objective pour un score de confiance sur 100
        </h2>
        {/* Titre DESKTOP : « Notre méthode. » (noir gras) + « Pour un
            score de confiance sur 100. » (gris, poids intermédiaire), sur
            la même ligne. */}
        <h2
          className="hidden md:block font-bold leading-tight"
          style={{
            // Police FLUIDE, cohérente avec le H1 mais BORNE BASSE plus haute
            // (24 px) pour rester bien lisible aux petites largeurs : ~24 px
            // jusqu'à ~950 px, puis grandit jusqu'à 30 px à 1160 (plafond).
            fontSize: "clamp(24px, 2.52vw, 30px)",
            color: "#1A2340",
          }}
        >
          Notre méthode.{" "}
          <span className="font-medium" style={{ color: "#6E6E72" }}>
            Pour un score de confiance sur 100.
          </span>
        </h2>

        {/* MOBILE : 4 modules empilés (le bloc « score sur 100 » vit
            désormais dans le titre, comme sur desktop) */}
        <div className="md:hidden flex flex-col gap-3 mt-5">
          <article className="flex items-start gap-3.5 rounded-2xl bg-fond border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)] p-4">
            <span className="shrink-0 mt-0.5">
              <IconeGoogle taille={40} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px]">Notes et avis</h3>
              <p className="text-sm text-encre-douce mt-0.5">
                Les avis Google sont analysés et{" "}
                <strong className="text-encre">
                  contribuent jusqu&apos;à {SCORE_GOOGLE.maximum} points
                </strong>{" "}
                au score de confiance.
              </p>
            </div>
          </article>

          <article className="flex items-start gap-3.5 rounded-2xl bg-fond border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)] p-4">
            <span className="shrink-0 mt-0.5">
              <IconeBouclierCoche taille={40} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px]">Entreprise vérifiée</h3>
              <p className="text-sm text-encre-douce mt-0.5">
                Le SIREN est vérifié et l&apos;ancienneté{" "}
                <strong className="text-encre">
                  contribue jusqu&apos;à {SCORE_ANCIENNETE.maximum} points
                </strong>{" "}
                au score de confiance.
              </p>
            </div>
          </article>

          <article className="flex items-start gap-3.5 rounded-2xl bg-fond border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)] p-4">
            <span className="shrink-0 mt-0.5">
              <IconeInstagram taille={40} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px]">Abonnés et publications</h3>
              <p className="text-sm text-encre-douce mt-0.5">
                L&apos;activité Instagram est analysée et{" "}
                <strong className="text-encre">
                  contribue jusqu&apos;à {SCORE_INSTAGRAM.maximum} points
                </strong>{" "}
                au score de confiance.
              </p>
            </div>
          </article>

          <article className="flex items-start gap-3.5 rounded-2xl bg-fond border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)] p-4">
            <span className="shrink-0 mt-0.5">
              <IconeBadgeVerifie taille={40} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px]">Badges de confiance</h3>
              <p className="text-sm text-encre-douce mt-0.5">
                Repérez les artisans avec le meilleur score de confiance
                grâce à nos badges.
              </p>
              <span className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {BADGES_PRESENTATION.map(({ label, couleur }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap"
                    style={{ color: couleur }}
                  >
                    <span className="shrink-0 flex" aria-hidden>
                      <IconeBadgeVerifie taille={18} teinte={couleur} />
                    </span>
                    {label}
                  </span>
                ))}
              </span>
            </div>
          </article>
        </div>

        {/* DESKTOP : grand encadré unique = image (gauche) + modules (droite) */}
        <div className="hidden md:grid md:grid-cols-[640fr_520fr] mt-6 overflow-hidden rounded-2xl border border-bordure-carte-claire shadow-[0_1px_4px_rgba(16,27,51,0.06)]">
          {/* Image (partie gauche). Déposée à la main :
              public/images/methode-cuisine.jpg. */}
          <div className="relative min-h-[360px]">
            {photoMethodeExiste ? (
              <Image
                src="/images/methode-cuisine.jpg"
                alt="Une cliente cherche un artisan de confiance depuis sa cuisine"
                fill
                sizes="47vw"
                className="object-cover object-center"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(160deg, #EFE9E2 0%, #E7DDD3 55%, #DED2C6 100%)",
                }}
              />
            )}
          </div>

          {/* Modules (partie droite) : rangées séparées par un trait fin,
              sans encadré individuel. Le module « Badges » garde son fond
              bleu clair (petite boîte distinctive en bas). */}
          <div className="bg-fond p-[clamp(28px,3.36vw,40px)] flex flex-col justify-center">
            {MODULES_METHODE.map((m, i) => (
              <div
                key={m.cle}
                className={`flex items-start gap-4 ${
                  i === 0
                    ? ""
                    : "mt-5 pt-5 border-t border-bordure-carte-claire"
                }`}
              >
                <span className="shrink-0 mt-0.5">{m.icone}</span>
                <div>
                  <h3
                    className="font-bold text-[17px]"
                    style={{ color: "#1A2340" }}
                  >
                    {m.titre}
                  </h3>
                  <p className="text-sm text-encre-douce mt-1 leading-[1.5]">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Module « Badges de confiance » : même style que les 3 autres
                (pas de fond, séparé par le même trait fin). Les 2 badges
                sont empilés sur 2 lignes distinctes. */}
            <div className="mt-5 pt-5 border-t border-bordure-carte-claire flex items-start gap-4">
              <span className="shrink-0 mt-0.5">
                <IconeBadgeVerifie taille={40} />
              </span>
              <div>
                <h3
                  className="font-bold text-[17px]"
                  style={{ color: "#1A2340" }}
                >
                  Badges de confiance
                </h3>
                <p className="text-sm text-encre-douce mt-1 leading-[1.5]">
                  Repérez les artisans avec le meilleur score de confiance
                  grâce à nos badges.
                </p>
                {/* Les 2 badges empilés, chacun sur sa propre ligne, même
                    taille / graisse / alignement. */}
                <div className="mt-2.5 flex flex-col gap-2">
                  {BADGES_PRESENTATION.map(({ label, couleur }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap"
                      style={{ color: couleur }}
                    >
                      <span className="shrink-0 flex" aria-hidden>
                        <IconeBadgeVerifie taille={18} teinte={couleur} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. Appel à l'action artisans (MOBILE uniquement) =====
           Sur desktop, ce bloc vit à droite du titre dans le hero : on le
           masque donc dès 768 px. */}
      <section className="px-5 py-7 max-w-[730px] w-full mx-auto md:hidden">
        <BlocDevenirArtisan arrondi="rounded-3xl" compact />
      </section>

      {/* Le pied de page commun est posé par le layout */}
    </main>
  );
}
