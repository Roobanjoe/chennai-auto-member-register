import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogIn, LogOut, ShieldCheck, UserPlus, Users } from "lucide-react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteLogo } from "@/components/SiteLogo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">பக்கம் கிடைக்கவில்லை</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          தேடிய பக்கம் இல்லை அல்லது நகர்த்தப்பட்டுள்ளது.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            முகப்புக்கு செல்லவும்
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          பக்கத்தை ஏற்ற முடியவில்லை
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ஏதோ சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            மீண்டும் முயற்சி
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            முகப்பு
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் — உறுப்பினர் பதிவு" },
      { name: "description", content: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் உறுப்பினர் பதிவு முறை" },
      { property: "og:title", content: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் — உறுப்பினர் பதிவு" },
      { name: "twitter:title", content: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் — உறுப்பினர் பதிவு" },
      { property: "og:description", content: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் உறுப்பினர் பதிவு முறை" },
      { name: "twitter:description", content: "சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம் உறுப்பினர் பதிவு முறை" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Meera+Inimai&family=Tiro+Tamil:ital@0;1&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ta">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppHeader() {
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setAuthed(!!session);
      router.invalidate();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <SiteLogo className="h-12 w-12 shrink-0 rounded-full ring-2 ring-primary/20 transition-transform hover:scale-105 sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight text-primary sm:text-base">
            சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம்
          </h1>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            உறுப்பினர் பதிவு முறை
          </p>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-primary-soft hover:text-primary sm:px-3 sm:text-sm"
            activeProps={{
              className:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">பதிவு</span>
          </Link>
          {authed ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-primary-soft hover:text-primary sm:px-3 sm:text-sm"
                activeProps={{
                  className:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                }}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">உறுப்பினர்கள்</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 gap-1.5 px-2.5 text-xs text-foreground/80 hover:bg-destructive/10 hover:text-destructive sm:text-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">வெளியேறு</span>
              </Button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-background px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft sm:px-3 sm:text-sm"
              activeProps={{
                className:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">நிர்வாகி</span>
              <LogIn className="h-3.5 w-3.5 sm:hidden" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
