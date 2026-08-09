"use client";

import { createBrowserClient } from "@supabase/ssr";
import { infosConnexionSupabase } from "./env";

/**
 * Client Supabase pour le NAVIGATEUR (pages côté visiteur).
 * À utiliser dans les composants marqués "use client".
 */
export function creerClientSupabaseNavigateur() {
  const { url, clePublishable } = infosConnexionSupabase();
  return createBrowserClient(url, clePublishable);
}
