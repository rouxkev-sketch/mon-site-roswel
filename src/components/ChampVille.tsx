"use client";

import { useEffect, useRef, useState } from "react";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { OPTION_LISTE, PANNEAU_LISTE } from "@/components/champs-recherche";
import { usePlacementMenu } from "@/components/placement-menu";
import { slugifier } from "@/lib/slug";
import { formatVille, nomVilleCourt } from "@/lib/villes";

/** Une commune telle que proposée dans la liste de suggestions */
export type VilleChoisie = {
  code_insee: string;
  nom: string;
  slug: string;
  code_postal: string; // le premier code postal de la commune
};

type Suggestion = {
  code_insee: string;
  nom: string;
  slug: string;
  codes_postaux: string[];
};

// Paris, Marseille et Lyon sont découpées en arrondissements : on ne
// propose QUE les arrondissements (l'entrée « ville entière » ferait
// doublon et porterait un code postal trompeur).
const VILLES_A_ARRONDISSEMENTS = ["75056", "13055", "69123"];

/**
 * CHAMP « VILLE » AVEC SUGGESTIONS
 * --------------------------------
 * Dès 2 lettres tapées, propose des communes lues dans la base
 * (insensible aux accents grâce aux slugs) : la ville principale
 * d'abord, puis ses arrondissements dans l'ordre (Lyon, Lyon 1er,
 * Lyon 2e…). La personne DOIT choisir dans la liste : c'est ce qui
 * garantit les coordonnées GPS exactes pour la recherche par rayon.
 */
export function ChampVille({
  surChoix,
  etiquette = "Ville d'intervention",
  texteIndicatif = "Ex. Villeurbanne, Lyon…",
  villeInitiale = null,
  sansBordure = false,
  id = "champ-ville",
  avecCodePostal = true,
  compact = false,
  actionValider,
  retraitDroite = 0,
  sombre = false,
  entreeToutLePays,
  suffixeVille,
  piedPanneau,
  garderOuvertApresChoix = false,
}: {
  surChoix: (ville: VilleChoisie | null) => void;
  /** null = pas d'étiquette visible (le champ reste nommé pour les lecteurs d'écran) */
  etiquette?: string | null;
  texteIndicatif?: string;
  /** La ville déjà sélectionnée à l'arrivée (menu compact, formulaire) */
  villeInitiale?: VilleChoisie | null;
  /** true = champ nu, posé dans un encadré partagé (menu compact) */
  sansBordure?: boolean;
  /** id du champ (unique par instance : le moteur d'accueil est
      dupliqué mobile / desktop, il faut deux id distincts). */
  id?: string;
  /** Afficher le code postal DANS LE CHAMP une fois la ville choisie
      (« Écully (69130) »). Faux = nom seul (« Écully ») — moteur de la
      page de résultats, où la place est comptée. La LISTE de
      suggestions, elle, garde toujours le code postal : il sert à
      distinguer deux communes de même nom. */
  avecCodePostal?: boolean;
  /** Padding resserré (moteur des résultats) */
  compact?: boolean;
  /** BOUTON DE VALIDATION EXTÉRIEUR (la loupe posée dans le champ, à
      droite) : le champ dépose ici sa façon de valider, et le bouton
      n'a plus qu'à l'appeler. Une liste de suggestions ouverte ? on
      retient la première. Sinon on reconfirme la ville déjà choisie —
      c'est ce qui relance la recherche. */
  actionValider?: React.MutableRefObject<(() => void) | null>;
  /** Place à réserver À DROITE dans le champ, en pixels : le moteur des
      résultats y pose sa loupe de validation. Le texte saisi s'arrête
      avant elle au lieu de passer dessous. */
  retraitDroite?: number;
  /** Habillage SOMBRE (index des tatoueurs) : mêmes comportements,
      seules les couleurs changent. Les pages artisans ne passent
      jamais cette option et restent claires, à l'identique. */
  sombre?: boolean;
  /** « TOUTE LA FRANCE » (yokofolio). Ce libellé est la PREMIÈRE
      suggestion de la liste, offerte dès le toucher : la porte de
      sortie pour revenir à la France entière. Le choisir efface la
      ville (`surChoix(null)`). Le CHAMP, lui, ne l'affiche JAMAIS :
      sans ville choisie il reste vide, et c'est son fantôme
      (« Où ? ») qui parle — un texte indicatif, pas une valeur.
      Les pages artisans ne passent jamais cette option : leur champ se
      comporte exactement comme avant. */
  entreeToutLePays?: string;
  /** Texte AJOUTÉ À L'AFFICHAGE après le nom de la ville choisie —
      yokofolio y met le rayon en cours (« · 50 km »). Purement
      visuel : il disparaît dès qu'on touche le champ pour ressaisir,
      et il suit son propre état (changer le rayon met l'affichage à
      jour sans toucher à la ville). Jamais appliqué au libellé
      « Toute la France », qui n'a pas de rayon. */
  suffixeVille?: string;
  /** CONTENU POSÉ EN BAS DU PANNEAU de suggestions (yokofolio y met le
      RAYON, une fois la ville choisie). Le panneau s'ouvre dès le
      toucher quand ce contenu existe. Les pages artisans ne passent
      jamais cette option : leur panneau reste inchangé. */
  piedPanneau?: React.ReactNode;
  /** Le panneau RESTE OUVERT après le choix d'une ville — c'est ce qui
      montre le pied (le rayon) juste au moment où il devient utile.
      Il se referme comme d'habitude : clic ailleurs, Échap, départ du
      champ. Jamais utilisé par les pages artisans. */
  garderOuvertApresChoix?: boolean;
}) {
  /** Le texte AFFICHÉ dans le champ pour une ville choisie */
  const texteChamp = (nom: string, codePostal?: string | null) =>
    avecCodePostal ? formatVille(nom, codePostal) : nomVilleCourt(nom);

  const [texte, setTexte] = useState(
    villeInitiale
      ? texteChamp(villeInitiale.nom, villeInitiale.code_postal)
      : ""
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [listeOuverte, setListeOuverte] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [probleme, setProbleme] = useState<string | null>(null);
  // Compteur pour ignorer les réponses arrivées en retard
  const numeroRequete = useRef(0);
  // Vrai UNIQUEMENT après une vraie frappe de l'utilisateur. Tant
  // que c'est faux, aucune recherche : ni au chargement de la page
  // (champ pré-rempli du menu compact — le message « Aucune commune
  // trouvée » ne doit JAMAIS y apparaître), ni après un choix dans
  // la liste (le texte posé par la sélection n'est pas une frappe).
  const saisieUtilisateur = useRef(false);
  // Une ville est actuellement sélectionnée (champ pré-rempli ou
  // choix dans la liste) : le prochain toucher vide le champ d'un
  // coup, prêt pour une nouvelle saisie (clavier déjà ouvert).
  // Sans ville, le champ est VIDE (fantôme « Où ? ») — il n'y a rien
  // à effacer.
  const [selectionActive, setSelectionActive] = useState(
    Boolean(villeInitiale)
  );
  // La ville actuellement sélectionnée, et la sélection mise de côté
  // au moment du vidage : si l'utilisateur quitte le champ sans
  // avoir choisi de nouvelle ville, l'ancienne est RESTAURÉE.
  const villeCourante = useRef<VilleChoisie | null>(villeInitiale);
  const memoire = useRef<{ texte: string; ville: VilleChoisie | null } | null>(
    null
  );

  // LA LISTE NE DOIT JAMAIS PASSER SOUS LE BORD DE L'ÉCRAN.
  // Sur smartphone, le champ est souvent bas dans la page et le
  // clavier mange la moitié de la hauteur : sans plafond, on ne voyait
  // que les deux premières communes et il fallait faire défiler LA
  // PAGE — en perdant le champ de vue. Même calcul que le menu des
  // métiers (usePlacementMenu) : hauteur plafonnée à la place
  // réellement disponible, défilement INTERNE au-delà, et ouverture
  // vers le haut quand le bas est trop juste.
  const champ = useRef<HTMLInputElement>(null);
  const { hauteurMax, ouvreVersLeHaut } = usePlacementMenu(listeOuverte, champ);
  /** La racine (champ + panneau) : sert à fermer au toucher EXTÉRIEUR. */
  const racine = useRef<HTMLDivElement>(null);
  /** VRAI pendant qu'un doigt (ou un clic) est DANS le panneau : le
      blur du champ ne doit alors RIEN fermer — un geste de défilement
      ou un tap en cours ne sont pas des départs. */
  const interactionPanneau = useRef(false);

  // FERMETURE AU TOUCHER EXTÉRIEUR — le pendant tactile du blur : sur
  // smartphone, le champ peut avoir perdu le focus alors que la liste
  // est restée ouverte (voir onBlur). Un toucher hors du champ et du
  // panneau referme et restaure, comme un départ classique.
  // (Sans tableau de dépendances : l'écouteur voit toujours l'état frais.)
  useEffect(() => {
    if (!listeOuverte) return;
    function auPointeurDehors(evenement: PointerEvent) {
      if (racine.current?.contains(evenement.target as Node)) return;
      setListeOuverte(false);
      restaurerSiAbandon();
      // Saisie abandonnée sans ville : le champ redevient VIDE, le
      // fantôme « Où ? » reprend la parole.
      if (entreeToutLePays && !villeCourante.current) {
        setTexte("");
        setSelectionActive(false);
      }
    }
    document.addEventListener("pointerdown", auPointeurDehors);
    return () => document.removeEventListener("pointerdown", auPointeurDehors);
  });

  // À chaque frappe (avec un léger délai), on interroge la base.
  // (Quand le texte est trop court, le nettoyage de la liste est
  // fait directement dans onChange, pas ici.)
  useEffect(() => {
    // Pas de frappe réelle (montage, valeur initiale, sélection) :
    // rien à chercher, et surtout aucun message à afficher.
    if (!saisieUtilisateur.current) return;
    const recherche = slugifier(texte);
    if (recherche.length < 2) return;

    const minuteur = setTimeout(async () => {
      const numero = ++numeroRequete.current;
      setChargement(true);
      try {
        const supabase = creerClientSupabaseNavigateur();
        // On ramène large (30) puis on trie proprement côté page :
        // avec une limite trop courte, la base pouvait renvoyer
        // « Paris 10e…19e » en oubliant « Paris » et « Paris 1er ».
        const { data, error } = await supabase
          .from("communes")
          .select("code_insee, nom, slug, codes_postaux")
          .like("slug", `${recherche}%`)
          .order("slug", { ascending: true })
          .limit(30);

        if (numero !== numeroRequete.current) return; // réponse périmée
        if (error) throw new Error(error.message);

        // Ordre : correspondance exacte, puis ordre naturel des noms
        // (« Lyon 1er », « Lyon 2e »… « Lyon 10e » — le tri numérique
        // évite le piège 10e avant 1er). Les entrées « ville entière »
        // de Paris/Marseille/Lyon sont écartées (doublon).
        const triees = (data ?? [])
          .filter(
            (commune) => !VILLES_A_ARRONDISSEMENTS.includes(commune.code_insee)
          )
          .sort(
            (a, b) =>
              Number(b.slug === recherche) - Number(a.slug === recherche) ||
              a.nom.localeCompare(b.nom, "fr", { numeric: true })
          )
          .slice(0, 8);
        setSuggestions(triees);
        setProbleme(
          triees.length === 0 ? "Aucune commune trouvée avec ce nom." : null
        );
        setListeOuverte(true);
      } catch {
        if (numero !== numeroRequete.current) return;
        setSuggestions([]);
        setProbleme("Connexion impossible : réessaie dans un instant.");
        setListeOuverte(true);
      } finally {
        if (numero === numeroRequete.current) setChargement(false);
      }
    }, 200);

    return () => clearTimeout(minuteur);
  }, [texte]);

  // Déposé à CHAQUE rendu (sans tableau de dépendances) : la fonction
  // voit toujours l'état courant du champ.
  useEffect(() => {
    if (!actionValider) return;
    actionValider.current = () => {
      if (listeOuverte && suggestions.length > 0) {
        choisir(suggestions[0]);
        return;
      }
      if (villeCourante.current) surChoix(villeCourante.current);
    };
    return () => {
      if (actionValider) actionValider.current = null;
    };
  });

  function choisir(commune: Suggestion) {
    const codePostal = commune.codes_postaux[0] ?? "";
    const ville: VilleChoisie = {
      code_insee: commune.code_insee,
      nom: commune.nom,
      slug: commune.slug,
      code_postal: codePostal,
    };
    saisieUtilisateur.current = false; // pas de recherche sur ce changement
    villeCourante.current = ville;
    memoire.current = null; // une NOUVELLE ville remplace l'ancienne
    setTexte(texteChamp(commune.nom, codePostal)); // « Nom (CP) » ou « Nom »
    setSelectionActive(true);
    // `garderOuvertApresChoix` : le panneau reste là, allégé de ses
    // suggestions — c'est le moment où son pied (le rayon) sert.
    setListeOuverte(garderOuvertApresChoix);
    setSuggestions([]);
    setProbleme(null);
    surChoix(ville);
  }

  /**
   * « TOUTE LA FRANCE » : la ville est effacée et le champ redevient
   * VIDE — c'est son fantôme (« Où ? ») qui le dit, le libellé ne
   * s'écrit plus dans le champ. La grille derrière, elle, repasse à
   * la France entière : le clic a un effet immédiat et visible.
   */
  function choisirToutLePays() {
    if (!entreeToutLePays) return;
    saisieUtilisateur.current = false; // pas de recherche sur ce changement
    villeCourante.current = null;
    memoire.current = null;
    setTexte("");
    setSelectionActive(false);
    setListeOuverte(false);
    setSuggestions([]);
    setProbleme(null);
    champ.current?.blur(); // le clavier se referme, le choix est fait
    surChoix(null);
  }

  /** Ville déjà choisie + nouveau toucher → on repart de zéro,
      en gardant l'ancienne sélection de côté (restaurée au départ
      du champ si aucune nouvelle ville n'est choisie) */
  function viderPourNouvelleSaisie() {
    if (!selectionActive) return;
    memoire.current = { texte, ville: villeCourante.current };
    setSelectionActive(false);
    saisieUtilisateur.current = false;
    setTexte("");
    setSuggestions([]);
    setProbleme(null);
    setListeOuverte(false);
    surChoix(null);
  }

  /**
   * UN TOUCHER SUR LE CHAMP — vider, puis ouvrir la liste.
   *
   * Appelé par `onFocus` ET par `onClick`, et ce n'est pas une
   * redondance : après avoir choisi une commune dans la liste, LE
   * CHAMP GARDE LE FOCUS (le choix se fait sur `pointerdown`, qui
   * empêche justement le focus de partir). Un second clic ne
   * déclenchait donc aucun `focus`… et la liste ne se rouvrait plus.
   * Il fallait quitter le champ puis y revenir pour qu'elle réponde.
   */
  function auToucher() {
    // Ville déjà sélectionnée : un seul toucher vide le champ
    // (le clavier s'ouvre en même temps, prêt à taper)
    viderPourNouvelleSaisie();
    // DÈS LE TOUCHER, AVANT LA MOINDRE FRAPPE : la liste s'ouvre sur
    // « Toute la France » (et sur le pied — le rayon — s'il existe).
    // C'est la porte de sortie, offerte tout de suite — on ne devrait
    // pas avoir à deviner qu'elle existe.
    if (entreeToutLePays || piedPanneau || suggestions.length > 0) {
      setListeOuverte(true);
    }
  }

  /** Départ du champ sans nouveau choix → l'ancienne ville revient */
  function restaurerSiAbandon() {
    if (!memoire.current) return;
    const { texte: ancienTexte, ville } = memoire.current;
    memoire.current = null;
    saisieUtilisateur.current = false; // pas de recherche sur la restauration
    villeCourante.current = ville;
    setTexte(ancienTexte);
    setSelectionActive(true);
    setSuggestions([]);
    setProbleme(null);
    surChoix(ville);
  }

  return (
    <div ref={racine} className={sansBordure ? "relative h-full" : "relative"}>
      {etiquette !== null && (
        <label htmlFor={id} className="block text-sm font-medium mb-1.5">
          {etiquette}
        </label>
      )}
      <input
        id={id}
        ref={champ}
        type="text"
        inputMode="text"
        // Empêche la bulle native du navigateur/OS (autocomplétion,
        // autocorrection façon « Écully ✕ ») de se superposer à NOTRE
        // menu de suggestions : on ne garde que le dropdown maison.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        aria-label={etiquette ?? "Ville d'intervention"}
        placeholder={texteIndicatif}
        value={
          suffixeVille && selectionActive && villeCourante.current
            ? texte + suffixeVille
            : texte
        }
        onChange={(evenement) => {
          const valeur = evenement.target.value;
          saisieUtilisateur.current = true; // vraie frappe : recherche permise
          setSelectionActive(false);
          setTexte(valeur);
          surChoix(null); // le texte a changé : plus de ville validée
          if (slugifier(valeur).length < 2) {
            // Trop court pour chercher : on referme la liste
            setSuggestions([]);
            setProbleme(null);
            setListeOuverte(false);
          }
        }}
        onFocus={auToucher}
        onClick={auToucher}
        onBlur={() => {
          // Le doigt est DANS le panneau (défilement ou tap en cours) :
          // on ne ferme rien — le choix arrive par le tap complet, et
          // le départ réel est couvert par l'écouteur extérieur.
          if (interactionPanneau.current) return;
          setListeOuverte(false);
          // Parti sans choisir de nouvelle ville (clic ailleurs,
          // clavier refermé, saisie non validée) : restauration
          restaurerSiAbandon();
          // Saisie abandonnée sans ville : le champ redevient VIDE
          // (fantôme « Où ? ») plutôt que de garder un texte qui ne
          // correspond à aucune commune.
          if (entreeToutLePays && !villeCourante.current) {
            setTexte("");
            setSelectionActive(false);
          }
        }}
        style={retraitDroite ? { paddingRight: retraitDroite } : undefined}
        className={
          sansBordure
            ? `w-full h-full min-h-[48px] bg-transparent ${compact ? "px-3" : "px-4"} text-base outline-none overflow-hidden text-ellipsis ${
                sombre
                  ? "text-sombre-texte placeholder:text-sombre-texte-doux"
                  : "placeholder:text-encre-douce"
              }`
            : `w-full min-h-[48px] rounded-2xl border px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25 overflow-hidden text-ellipsis ${
                sombre
                  ? "border-sombre-bordure bg-sombre-eleve text-sombre-texte placeholder:text-sombre-texte-doux"
                  : "border-bordure-champ bg-fond placeholder:text-encre-douce"
              }`
        }
      />

      {/* La liste de suggestions, sous le champ */}
      {listeOuverte &&
        (suggestions.length > 0 || probleme || entreeToutLePays || piedPanneau) && (
        <div
          className={`${PANNEAU_LISTE} ${
            sombre ? "border-sombre-bordure bg-sombre-carte text-sombre-texte" : ""
          } ${ouvreVersLeHaut ? "bottom-full mb-1 mt-0" : ""}`}
          onPointerDown={() => {
            interactionPanneau.current = true;
            window.setTimeout(() => {
              interactionPanneau.current = false;
            }, 400);
          }}
        >
        <ul
          role="listbox"
          aria-label="Communes proposées"
          // Hauteur PLAFONNÉE à la place réellement disponible dans la
          // fenêtre : la liste ne dépasse jamais le bas (ni le haut) de
          // l'écran — au-delà, elle défile SUR ELLE-MÊME, sans jamais
          // faire défiler la page.
          style={{ maxHeight: hauteurMax ? `${hauteurMax}px` : undefined }}
          // Barre de défilement VISIBLE (defilement-visible) : quand la
          // liste dépasse la place disponible, il faut voir tout de
          // suite qu'il reste des communes plus bas. C'est l'exception
          // assumée à la règle « jamais d'ascenseur affiché ».
          className="overflow-y-auto overscroll-contain defilement-visible"
        >
          {/* « TOUTE LA FRANCE » EN PREMIER, TOUJOURS — avant les
              communes, et même quand aucune ne correspond. C'est la
              porte de sortie : on retire la ville sans avoir à effacer
              le champ à la main. */}
          {entreeToutLePays && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={villeCourante.current === null}
                // À la SOURIS : choisir dès l'appui (le champ garde le
                // focus). AU DOIGT : ne rien faire à l'appui — un appui
                // qui devient un défilement ne doit pas choisir ; le
                // tap complet passe par onClick.
                onPointerDown={(evenement) => {
                  if (evenement.pointerType === "mouse") {
                    evenement.preventDefault();
                    choisirToutLePays();
                  }
                }}
                onClick={() => choisirToutLePays()}
                className={`${OPTION_LISTE} ${
                  sombre ? "hover:bg-sombre-eleve active:bg-sombre-eleve" : ""
                }`}
              >
                <span className="font-medium">{entreeToutLePays}</span>
              </button>
            </li>
          )}
          {probleme && (
            <li
              className={`px-4 py-3 text-sm ${
                sombre ? "text-sombre-texte-doux" : "text-encre-douce"
              }`}
            >
              {probleme}
            </li>
          )}
          {suggestions.map((commune) => (
            <li key={commune.code_insee}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                // À la SOURIS : choisir dès l'appui (sinon le blur du
                // champ fermait la liste avant le clic). AU DOIGT : le
                // geste décide — défiler ne choisit pas, le tap complet
                // choisit (onClick) ; le blur est neutralisé par le
                // drapeau du panneau.
                onPointerDown={(evenement) => {
                  if (evenement.pointerType === "mouse") {
                    evenement.preventDefault();
                    choisir(commune);
                  }
                }}
                onClick={() => choisir(commune)}
                className={`${OPTION_LISTE} ${
                  sombre ? "hover:bg-sombre-eleve active:bg-sombre-eleve" : ""
                }`}
              >
                {/* Format unique « Nom (code postal) » : sans numéro de
                    département, sans mention d'arrondissement */}
                <span className="font-medium">
                  {formatVille(commune.nom, commune.codes_postaux[0])}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {/* LE PIED DU PANNEAU (yokofolio : le rayon) — hors de la liste
            défilante, toujours visible en bas du panneau. */}
        {piedPanneau}
        </div>
      )}

      {chargement && (
        <p className="absolute right-3 top-[42px] text-xs text-encre-douce">…</p>
      )}
    </div>
  );
}
