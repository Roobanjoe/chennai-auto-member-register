## 1. Admin edit + delete persist to Supabase

**Delete** — already calls `supabase.from("members").delete()` and the row is removed from the DB. The only gap is the orphan photo left in Storage. Fix: also remove `member-photos/{member_no}.{ext}` (derived from `photo_url`) in the same handler, then invalidate the query.

**Edit** — currently a stub toast. Replace with a real flow:
- Add an `editing` state and an Edit dialog using the existing member schema + RHF/Zod (same shape as registration, minus the duplicate-check on the unchanged record).
- Photo: optional re-upload; if a new file is chosen, upload to Supabase Storage at the same path (`upsert: true`) and refresh the signed URL; otherwise keep `photo_url`.
- Save with `supabase.from("members").update({...}).eq("id", editing.id)`, then `qc.invalidateQueries(["members"])` so the table reflects DB state immediately.
- Show success/error toasts; disable buttons while saving.

Both actions run as the authenticated admin, so existing RLS policies cover them.

## 2. All site images served from Supabase Storage

Goal: no image (including the logo / favicon) is bundled from `src/assets` or `public/`. Everything resolves to a Supabase Storage URL.

Steps:
- Create a new **public** Storage bucket `site-assets` via `supabase--storage_create_bucket` (public so the logo can be referenced in `<link rel="icon">` and `<img>` without signed URLs). Add a public-read RLS policy on `storage.objects` for that bucket; writes restricted to authenticated users.
- Upload the existing logo PNG into `site-assets/logo.png` (one-time seed; I'll fetch the current CDN bytes and upload through the storage API in a small server function run once, or instruct via the Storage dashboard link).
- Add `src/lib/site-assets.ts` exporting `LOGO_URL` built from `${SUPABASE_URL}/storage/v1/object/public/site-assets/logo.png`.
- Replace the three `import logo from "../assets/logo.png.asset.json"` references (`__root.tsx`, `auth.tsx`, `thank-you.tsx`) and the favicon `<link>` to use `LOGO_URL`.
- Delete `src/assets/logo.png.asset.json` so nothing in the repo serves images anymore.
- Member photos already live in `member-photos` bucket — no change.

## Technical notes
- Storage delete uses `supabase.storage.from("member-photos").remove([path])`; derive `path` from the stored `photo_url` (last segment before `?`).
- Edit dialog reuses `memberSchema` but skips the "already registered" duplicate check (Check 1) for the current row; mobile-uniqueness check excludes `id = editing.id`.
- Public bucket policy:
  ```sql
  create policy "Public read site-assets"
    on storage.objects for select
    using (bucket_id = 'site-assets');
  create policy "Admins write site-assets"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'site-assets');
  ```
