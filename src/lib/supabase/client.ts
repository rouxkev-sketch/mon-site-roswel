"use client";

import { createBrowserClient } from "@supabase/ssr";
import { infosConnexionSupabase } from "./env";
import { fetchAvecDelai } from "./delai";

/**
 * Client Supabase pour le NAVIGATEUR (pages côté visiteur).
 * À utiliser dans les composants marqués "use client".
 */
export function creerClientSupabaseNavigateur() {
  const { url, clePublishable } = infosConnexionSupabase();
  /*  §1 (nº 686) — LE DÉLAI DE GARDE. Le dossier de reprise le
      signalait déjà : Chrome coupe une requête pendante vers 30 s,
      Safari attend BIEN plus — et c'est la signature du vieux blocage
      jamais élucidé. Dix secondes valent des deux côtés. La note
      complète est dans `./delai`. */
  /*  ██ §2 (nº 796) — LE BATTEMENT DU NAVIGATEUR RESTE ALLUMÉ, ET
      C'EST LUI LE MAÎTRE ██
      ------------------------------------------------------------------
      ⚠️ NE PAS POSER `autoRefreshToken: false` ICI. Ça a été fait,
      mesuré, et ANNULÉ — le relevé est ci-dessous pour que personne ne
      recommence.

      L'IDÉE PARAISSAIT JUSTE. Deux rafraîchisseurs se partagent une
      seule session : le battement de fond du navigateur (une
      vérification toutes les 30 s) et le proxy, qui renouvelle avant
      chaque page. On a donc éteint le battement pour ne laisser que le
      proxy — le partage que décrit l'architecture Next + Supabase.

      LE BANC A DIT LE CONTRAIRE, sur le même parcours d'utilisateur
      connecté et le même réglage de jeton :
          battement ALLUMÉ  →   7 renouvellements ·  0 refus
          battement ÉTEINT  →  24 renouvellements · 22 refus
      Trois fois plus de trafic, et une avalanche de refus.

      POURQUOI, ET C'EST LA LEÇON DE CETTE PASSE : le proxy NE PEUT PAS
      être un maître. Il est refabriqué à CHAQUE REQUÊTE, et une seule
      navigation en émet une vingtaine (la page et ses préchargements) :
      vingt clients qui s'ignorent, vingt renouvellements du même jeton
      à la même milliseconde, dix-neuf refus (le jeton de reprise est à
      usage unique — README de @supabase/ssr). Le navigateur, lui, EST
      un maître par construction : un seul client pour toute la page
      (`createBrowserClient` rend un exemplaire unique) et une file
      d'attente interne qui fond les demandes simultanées en une seule
      (`refreshingDeferred` dans auth-js).
      ET SURTOUT, son battement fait le travail AU BON MOMENT : entre
      deux navigations, tranquillement, tout seul. Quand la rafale
      arrive, le jeton est déjà frais et AUCUN passage du proxy n'a
      besoin de renouveler quoi que ce soit. L'éteindre, c'était laisser
      la vingtaine de passages découvrir ensemble un jeton périmé.

      LE PROXY GARDE SON RÔLE, qui n'est pas celui-là : renouveler pour
      le visiteur qui ARRIVE, dont le navigateur n'a encore rien
      exécuté. C'est un filet, pas un maître — et depuis la §1 il ne
      peut plus détruire la session quand il perd la course. */
  return createBrowserClient(url, clePublishable, {
    global: { fetch: fetchAvecDelai() },
  });
}
