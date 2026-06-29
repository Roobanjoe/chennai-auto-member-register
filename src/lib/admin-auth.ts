// Admin auth helpers. The admin signs in with username + password; we map the
// username to the synthetic email used in Supabase Auth.
export const ADMIN_USERNAME = "cnautoadmin";
export const ADMIN_EMAIL = "cnautoadmin@cnauto.local";

export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  if (u === ADMIN_USERNAME) return ADMIN_EMAIL;
  // Allow direct email too, but block anything else from masquerading.
  if (u.includes("@")) return u;
  return `${u}@cnauto.local`;
}
