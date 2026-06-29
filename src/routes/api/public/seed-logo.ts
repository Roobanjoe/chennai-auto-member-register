// One-shot bootstrap route to seed the logo into the `site-assets` bucket.
// Safe to leave: it no-ops once the file already exists.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/_seed-logo")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const existing = await supabaseAdmin.storage
          .from("site-assets")
          .list("", { search: "logo.png" });
        if (existing.data?.some((f) => f.name === "logo.png")) {
          return new Response(JSON.stringify({ ok: true, status: "already-present" }), {
            headers: { "content-type": "application/json" },
          });
        }
        const src = await fetch(
          "https://chennai-auto-sangam-portal.lovable.app/__l5e/assets-v1/c323c763-ad48-4cfd-af66-29292d42e486/logo.png",
        );
        if (!src.ok) {
          return new Response(JSON.stringify({ ok: false, fetch: src.status }), { status: 500 });
        }
        const buf = new Uint8Array(await src.arrayBuffer());
        const { error } = await supabaseAdmin.storage
          .from("site-assets")
          .upload("logo.png", buf, { contentType: "image/png", upsert: true });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({ ok: true, status: "uploaded" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
