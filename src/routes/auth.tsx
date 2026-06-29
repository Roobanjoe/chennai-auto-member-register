import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/lib/admin-auth";
import { SiteLogo } from "@/components/SiteLogo";
import { ensureSiteLogoSeeded } from "@/lib/site-logo";


export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "நிர்வாகி உள்நுழைவு" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard" });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("பயனர் பெயரும் கடவுச்சொல்லும் தேவை");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) throw error;
      toast.success("வரவேற்கிறோம், நிர்வாகி");
      // One-time seed: ensure the site logo lives in Supabase Storage.
      void ensureSiteLogoSeeded(
        "https://chennai-auto-sangam-portal.lovable.app/__l5e/assets-v1/c323c763-ad48-4cfd-af66-29292d42e486/logo.png",
      );
      navigate({ to: "/dashboard" });

    } catch (err) {
      toast.error("உள்நுழைய முடியவில்லை. பயனர் பெயர் / கடவுச்சொல் சரிபார்க்கவும்.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-accent/20" />
      <div
        className="absolute -top-20 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-24 -right-16 -z-10 h-80 w-80 rounded-full bg-accent/25 blur-3xl"
        aria-hidden
      />

      <Card className="w-full max-w-md border-primary/10 shadow-card">
        <CardContent className="p-7 sm:p-9">
          <div className="flex flex-col items-center text-center">
            <SiteLogo className="h-16 w-16 rounded-full ring-2 ring-primary/20" />

            <h1 className="mt-4 text-lg font-semibold text-primary sm:text-xl">
              நிர்வாகி உள்நுழைவு
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              உறுப்பினர் தகவல்களை பார்க்க அங்கீகாரம் தேவை
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">பயனர் பெயர்</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cnautoadmin"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">கடவுச்சொல்</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              உள்நுழை
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            பாதுகாப்பான நிர்வாகி அணுகல்
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
