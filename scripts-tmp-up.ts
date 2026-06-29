import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const url = "https://xinytnhvpvrfurtroiuf.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
console.log("key prefix:", key.slice(0, 12), "len:", key.length);
const s = createClient(url, key);
const buf = readFileSync("/tmp/logo.png");
const { data, error } = await s.storage.from("site-assets").upload("logo.png", buf, { contentType: "image/png", upsert: true });
console.log({ data, error });
