import Link from "next/link";
import { genreMode, libelleTypeFiche } from "@/config/tatouage";
import {
  IconeAncre,
  IconeAvion,
  IconeCadenas,
  IconeUtilisateur,
} from "@/components/Icones";
import {
  libelleModesActifs,
  ligneDuMode,
  membresActifs,
  modesActifs,
  periodeCourte,
  type MembreEquipe,
  type ModeExerciceFiche,
  type StudioFiche,
} from "@/lib/modes-exercice";
import type { Tatoueur } from "@/lib/tatoueurs";
import {
  ligneFiche,
  ligneMaps,
  type LieuAffichable,
} from "@/lib/adresse";
import { PHOTO_PORTFOLIO, PORTRAIT_ROND } from "@/config/tatouage";

/**
 * LES TROIS BLOCS QUE PARTAGENT LES DEUX FICHES
 * ==============================================
 * La fiche pleine page et la fenêtre superposée montrent EXACTEMENT
 * la même chose — c'était déjà la règle, elle vaut plus que jamais
 * ici : les modes d'exercice, les adresses d'une enseigne et son
 * équipe sont trop structurants pour être écrits deux fois, avec le
 * risque que l'un des deux dérive.
 *
 *  · `sousLeNom`      — ce qui remplace « Artiste » / « Salon » ;
 *  · `LignesModes`    — une ligne par mode, icône ronde à gauche ;
 *  · `BlocAdresses`   — l'adresse, ou la liste des studios ;
 *  · `BlocEquipe`     — les résidents, puis les guests datés.
 */

/** L'icône ronde d'un mode — ou le logo du salon quand il est lié. */
function pastilleDuMode(mode: ModeExerciceFiche) {
  if (mode.salon_id && mode.salon_photo) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element --
         photo déposée par le salon, servie telle quelle. */
      <img
        src={mode.salon_photo}
        width={PHOTO_PORTFOLIO.largeur}
        height={PHOTO_PORTFOLIO.hauteur}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }
  if (mode.genre === "guest") return <IconeAvion taille={17} />;
  if (mode.genre === "domicile") return <IconeUtilisateur taille={17} />;
  if (mode.genre === "prive") return <IconeCadenas taille={17} />;
  return <IconeAncre taille={17} />;
}

/**
 * CE QUI S'ÉCRIT SOUS LE NOM.
 * · ARTISTE → SES MODES, et non plus le mot « Artiste » : « En
 *   salon », « En salon / Guest ». C'est ce qu'on veut savoir d'un
 *   artiste — pas sa catégorie administrative.
 *   (Le mot « Artiste » reste sur les CARTES de la mosaïque : là,
 *   c'est un repère de tri, pas une présentation.)
 * · STUDIO  → « Studio », quel que soit le nombre d'adresses.
 *   ⚠️ « MULTISALON » A DISPARU : un studio à trois adresses reste un
 *   studio. Le mot inventait une catégorie que personne ne cherche,
 *   et le nombre d'adresses se lit déjà dans le bloc « Adresses »,
 *   juste en dessous — c'est là qu'il a un sens.
 */
export function sousLeNom(tatoueur: Tatoueur): string {
  if (tatoueur.type_fiche === "artiste") {
    return libelleModesActifs(tatoueur.modes);
  }
  return libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement);
}

/**
 * LES MODES D'EXERCICE, UNE LIGNE CHACUN.
 * L'icône ronde à gauche — ou le LOGO DU SALON quand l'artiste y est
 * rattaché. Le nom du salon est alors le SEUL élément cliquable de la
 * ligne : le reste (l'adresse, les dates) est du texte, et se lit
 * comme tel. Une adresse saisie à la main ne mène nulle part, et ne
 * fait donc semblant de rien.
 */
export function LignesModes({ modes }: { modes: ModeExerciceFiche[] | null | undefined }) {
  const actifs = modesActifs(modes);
  if (actifs.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {actifs.map((mode) => {
        const { avant, nomSalon, apres } = ligneDuMode(mode);
        const lie = Boolean(nomSalon && mode.salon_slug);
        return (
          <li key={mode.id} className="flex items-start gap-2.5">
            <span
              className="mt-[1px] flex h-[26px] w-[26px] shrink-0 items-center
                         justify-center overflow-hidden rounded-full
                         bg-sombre-eleve text-sombre-texte-doux"
              aria-hidden="true"
            >
              {pastilleDuMode(mode)}
            </span>
            <p className="min-w-0 text-[15px] leading-snug text-sombre-texte-doux">
              {avant}
              {lie ? (
                <Link
                  href={`/tatoueur/${mode.salon_slug}`}
                  className="font-semibold text-sombre-texte transition-colors
                             hover:text-primaire active:text-primaire"
                >
                  {nomSalon}
                </Link>
              ) : (
                nomSalon && <span className="font-semibold">{nomSalon}</span>
              )}
              {apres}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * LE STUDIO QU'ON REGARDE — celui dont on lit l'adresse ET les
 * horaires. Écrit ici, à côté de `BlocAdresses` qui applique la même
 * règle : une enseigne à trois adresses ne doit pas annoncer l'heure
 * de Lyon sur la page de Bordeaux.
 *  · celui que l'adresse désigne (`?studio=<id>`) ;
 *  · sinon le principal ;
 *  · sinon le premier.
 */
export function studioAffiche(
  tatoueur: Tatoueur,
  studioCourantId?: string | null
): StudioFiche | null {
  const studios = (tatoueur.studios ?? []).slice().sort((a, b) => a.ordre - b.ordre);
  if (studios.length === 0) return null;
  return (
    studios.find((studio) => studio.id === studioCourantId) ??
    studios.find((studio) => studio.principal) ??
    studios[0]
  );
}

/** La recherche Google Maps d'un lieu — l'adresse COMPLÈTE, code
    postal et pays compris (voir `ligneMaps`). Un plan n'est pas un
    affichage : sans le code ni le pays, une adresse étrangère tombe
    sur une rue homonyme à l'autre bout du monde. */
function rechercheMaps(lieu: LieuAffichable): string {
  return encodeURIComponent(ligneMaps(lieu));
}

/** Un studio, ramené au format que lit lib/adresse. */
function lieuDuStudio(studio: StudioFiche): LieuAffichable {
  return {
    adresse: studio.adresse,
    code_postal: studio.code_postal,
    ville: studio.ville,
    region: studio.region,
    pays: studio.pays,
    code_pays: studio.code_pays,
  };
}

/** ⚠️ CE QUE LE VISITEUR LIT (passe nº 114) : rue, ville, code de
    l'État si le pays l'écrit, pays. PAS DE CODE POSTAL — le lien
    Google Maps posé à côté l'emmène, il n'a pas à le recopier. */
function adresseDuStudio(studio: StudioFiche): string {
  return ligneFiche(lieuDuStudio(studio));
}

/**
 * LE BLOC DES ADRESSES D'UN SALON — épuré, SANS MENU NI BOUTON.
 * UNE SEULE ADRESSE : une ligne, un lien Google Maps, comme partout
 * ailleurs sur le site.
 * PLUSIEURS : une LISTE VERTICALE. La première ligne est celle de la
 * fiche consultée (« Studio actuel »), et ouvre la carte ; les
 * suivantes nomment les autres studios de l'enseigne et mènent à
 * leur page. Aucun repli, aucun déroulant : trois adresses tiennent
 * en trois lignes, et se lisent d'un coup d'œil.
 */
export function BlocAdresses({
  tatoueur,
  /** Le studio regardé, quand l'adresse porte `?studio=<id>`. */
  studioCourantId,
}: {
  tatoueur: Tatoueur;
  studioCourantId?: string | null;
}) {
  const studios = (tatoueur.studios ?? []).slice().sort((a, b) => a.ordre - b.ordre);

  // AUCUN STUDIO ENREGISTRÉ (fiche d'avant la migration nº 26, ou
  // artiste) : on retombe sur l'adresse de la fiche elle-même.
  if (studios.length === 0) {
    const lieu: LieuAffichable = {
      adresse: tatoueur.adresse,
      code_postal: tatoueur.code_postal,
      ville: tatoueur.ville_nom,
      region: tatoueur.region,
      pays: tatoueur.pays,
      code_pays: tatoueur.code_pays,
    };
    const ligne = ligneFiche(lieu);
    if (!ligne) return null;
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${rechercheMaps(lieu)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-[15px] leading-snug text-sombre-texte-doux
                   transition-colors hover:text-primaire active:text-primaire"
      >
        {ligne}
      </a>
    );
  }

  const courant =
    studios.find((studio) => studio.id === studioCourantId) ??
    studios.find((studio) => studio.principal) ??
    studios[0];
  const autres = studios.filter((studio) => studio.id !== courant.id);

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${rechercheMaps(
          lieuDuStudio(courant)
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-[15px] leading-snug text-sombre-texte-doux
                   transition-colors hover:text-primaire active:text-primaire"
      >
        {autres.length > 0 && (
          <span className="text-sombre-texte">Salon actuel : </span>
        )}
        {adresseDuStudio(courant)}
      </a>

      {autres.map((studio) => (
        <Link
          key={studio.id}
          href={`/tatoueur/${tatoueur.slug}?studio=${studio.id}`}
          className="w-fit text-[15px] leading-snug text-sombre-texte-doux
                     transition-colors hover:text-primaire active:text-primaire"
        >
          <span className="text-sombre-texte">
            Autre adresse : {studio.nom ?? tatoueur.nom}
          </span>{" "}
          — {adresseDuStudio(studio)}
        </Link>
      ))}
    </div>
  );
}

/** Un avatar rond d'équipe, avec l'initiale en repli. */
function avatarMembre(membre: MembreEquipe, taille: string) {
  return (
    <span
      className={`flex ${taille} shrink-0 items-center justify-center
                 overflow-hidden rounded-full border border-sombre-bordure
                 bg-sombre-eleve`}
    >
      {membre.photo ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par l'artiste, servie telle quelle. */
        <img
          src={membre.photo}
          alt=""
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-[15px] font-bold text-sombre-texte-doux">
          {membre.nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/**
 * LE BLOC ÉQUIPE — ultra-épuré, et c'est tout l'enjeu.
 * Un avatar rond, un nom à sa droite, rien d'autre : ni statut, ni
 * date d'entrée, ni intitulé administratif. Les RÉSIDENTS d'abord ;
 * les INVITÉS dessous, sous leur propre titre, avec LEURS DATES
 * posées au-dessus de l'avatar — c'est la seule information qui
 * manque vraiment à leur sujet.
 *
 * QUI EN SORT, ET TOUT SEUL : l'artiste passé hors ligne, celui qui a
 * supprimé sa fiche, et le guest dont la session est terminée. Rien
 * n'est stocké — la liste est déduite à la lecture (voir la vue
 * `equipe_salon` de la migration nº 26).
 */
export function BlocEquipe({
  equipe,
  titreClasse,
}: {
  equipe: MembreEquipe[] | null | undefined;
  /** Le style de titre de la fiche qui l'accueille. */
  titreClasse: string;
}) {
  const membres = membresActifs(equipe);
  if (membres.length === 0) return null;
  const residents = membres.filter((membre) => membre.genre !== "guest");
  const invites = membres.filter((membre) => membre.genre === "guest");

  return (
    <section>
      <h2 className={titreClasse}>Équipe</h2>

      {residents.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
          {residents.map((membre) => (
            <li key={membre.artiste_id}>
              {membre.slug ? (
                <Link
                  href={`/tatoueur/${membre.slug}`}
                  className="flex items-center gap-3 transition-colors
                             hover:text-primaire active:text-primaire"
                >
                  {avatarMembre(membre, "h-11 w-11")}
                  <span className="text-[15px] font-medium text-sombre-texte">
                    {membre.nom}
                  </span>
                </Link>
              ) : (
                <span className="flex items-center gap-3">
                  {avatarMembre(membre, "h-11 w-11")}
                  <span className="text-[15px] font-medium text-sombre-texte">
                    {membre.nom}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {invites.length > 0 && (
        <>
          <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-sombre-texte-doux">
            Guest
          </h3>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-4">
            {invites.map((membre) => (
              <li key={membre.artiste_id} className="flex flex-col gap-1.5">
                {/* LES DATES AU-DESSUS DE L'AVATAR : c'est la seule
                    chose qu'on a besoin de savoir d'un invité, et
                    elle se lit avant le visage. */}
                <span className="text-[12.5px] font-medium text-primaire">
                  {periodeCourte(membre).replace(/^\(du |\)$/g, "").replace(" au ", " — ")}
                </span>
                {membre.slug ? (
                  <Link
                    href={`/tatoueur/${membre.slug}`}
                    className="flex items-center gap-3 transition-colors
                               hover:text-primaire active:text-primaire"
                  >
                    {avatarMembre(membre, "h-11 w-11")}
                    <span className="text-[15px] font-medium text-sombre-texte">
                      {membre.nom}
                    </span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-3">
                    {avatarMembre(membre, "h-11 w-11")}
                    <span className="text-[15px] font-medium text-sombre-texte">
                      {membre.nom}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Le genre d'un mode, pour les tests et l'affichage court. */
export { genreMode };
