// Loads ID card template images from Supabase Storage (site-assets bucket).
// Mirrors the site-logo pattern: download → object URL → cache, with a one-time
// seed-from-bundled-asset path so the templates land in Supabase the first
// time an admin opens the ID card page.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import frontAsset from "@/assets/id-card-front.jpg.asset.json";
import backAsset from "@/assets/id-card-back.jpg.asset.json";

const BUCKET = "site-assets";
const FRONT = "id-card-front.jpg";
const BACK = "id-card-back.jpg";

type Cache = { front: string | null; back: string | null };
let cache: Cache = { front: null, back: null };
let inflight: Promise<Cache> | null = null;
const listeners = new Set<(c: Cache) => void>();

async function downloadOne(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return URL.createObjectURL(data);
}

async function fetchAll(): Promise<Cache> {
  const [front, back] = await Promise.all([downloadOne(FRONT), downloadOne(BACK)]);
  return { front, back };
}

export function loadIdCardTemplates(force = false): Promise<Cache> {
  if (cache.front && cache.back && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = fetchAll().then((c) => {
    cache = c;
    inflight = null;
    listeners.forEach((l) => l(c));
    return c;
  });
  return inflight;
}

async function uploadOne(path: string, fallbackUrl: string) {
  try {
    const res = await fetch(fallbackUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
  } catch (err) {
    console.warn("[id-card-templates] seed failed", path, err);
  }
}

/** Seed missing templates from bundled CDN assets, then refresh cache. */
export async function ensureIdCardTemplatesSeeded() {
  const current = await loadIdCardTemplates();
  const tasks: Promise<void>[] = [];
  if (!current.front) tasks.push(uploadOne(FRONT, frontAsset.url));
  if (!current.back) tasks.push(uploadOne(BACK, backAsset.url));
  if (tasks.length === 0) return current;
  await Promise.all(tasks);
  return loadIdCardTemplates(true);
}

export function useIdCardTemplates() {
  const [c, setC] = useState<Cache>(cache);
  const [loading, setLoading] = useState(!(cache.front && cache.back));

  useEffect(() => {
    let active = true;
    const listener = (next: Cache) => {
      if (!active) return;
      setC(next);
      setLoading(false);
    };
    listeners.add(listener);
    ensureIdCardTemplatesSeeded().then((next) => {
      if (!active) return;
      setC(next);
      setLoading(false);
    });
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { front: c.front, back: c.back, loading };
}
