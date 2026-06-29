// Resolves the site logo URL from Supabase Storage (`site-assets/logo.png`).
// All site images must come from Supabase, never from local/public assets.
// We download the object as a blob (RLS allows public SELECT on this bucket)
// and expose it as an object URL. If the logo has not been uploaded yet, the
// hook returns a `missing` state so the admin can seed it from the dashboard.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "site-assets";
const PATH = "logo.png";

let cachedUrl: string | null = null;
let inflight: Promise<string | null> | null = null;
const listeners = new Set<(url: string | null) => void>();

async function fetchLogoUrl(): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(PATH);
  if (error || !data) return null;
  const url = URL.createObjectURL(data);
  return url;
}

export function loadSiteLogo(force = false): Promise<string | null> {
  if (cachedUrl && !force) return Promise.resolve(cachedUrl);
  if (inflight && !force) return inflight;
  inflight = fetchLogoUrl().then((url) => {
    cachedUrl = url;
    inflight = null;
    listeners.forEach((l) => l(url));
    return url;
  });
  return inflight;
}

export function invalidateSiteLogo() {
  if (cachedUrl) URL.revokeObjectURL(cachedUrl);
  cachedUrl = null;
  return loadSiteLogo(true);
}

export function useSiteLogo() {
  const [url, setUrl] = useState<string | null>(cachedUrl);
  const [loading, setLoading] = useState(!cachedUrl);

  useEffect(() => {
    let active = true;
    const listener = (u: string | null) => {
      if (!active) return;
      setUrl(u);
      setLoading(false);
    };
    listeners.add(listener);
    loadSiteLogo().then((u) => {
      if (!active) return;
      setUrl(u);
      setLoading(false);
    });
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { url, loading };
}

/** Uploads a logo file to Supabase Storage. Requires authenticated session. */
export async function uploadSiteLogo(file: File | Blob, contentType = "image/png") {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(PATH, file, { upsert: true, contentType });
  if (error) throw error;
  await invalidateSiteLogo();
}

/**
 * One-time seed used right after admin login: if no logo exists in the bucket,
 * fetch the current bundled asset and upload it so future loads come from
 * Supabase Storage only.
 */
export async function ensureSiteLogoSeeded(fallbackUrl: string) {
  const existing = await loadSiteLogo();
  if (existing) return;
  try {
    const res = await fetch(fallbackUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    await uploadSiteLogo(blob, blob.type || "image/png");
  } catch (err) {
    console.warn("[site-logo] seed failed", err);
  }
}
