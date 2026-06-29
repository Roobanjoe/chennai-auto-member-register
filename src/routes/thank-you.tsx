import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteLogo } from "@/components/SiteLogo";
import { RegistrationProgress } from "@/components/RegistrationProgress";

export const Route = createFileRoute("/thank-you")({
  head: () => ({ meta: [{ title: "நன்றி — பதிவு வெற்றி" }] }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <>
      <RegistrationProgress />
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-10 animate-in fade-in duration-500">

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-accent/15" />
      <div className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden />

      <Card className="w-full max-w-xl border-primary/10 shadow-card animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -m-2 rounded-full bg-primary/20 blur-xl" aria-hidden />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-card">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-semibold text-primary sm:text-4xl">நன்றி!</h1>

            <p className="mt-4 text-base leading-relaxed text-foreground/90">
              உங்கள் உறுப்பினர் பதிவு வெற்றிகரமாக நிறைவுபெற்றது.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              உங்கள் தகவல்கள் பாதுகாப்பாக பதிவு செய்யப்பட்டுள்ளன.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary-soft/60 px-4 py-3">
              <SiteLogo className="h-10 w-10 rounded-full ring-2 ring-primary/20" />
              <p className="text-left text-sm font-medium text-primary-deep">
                சென்னை மக்கள் ஆட்டோ <br className="sm:hidden" />
                ஓட்டுநர் தொழிற்சங்கம்
              </p>
            </div>

            <Button asChild className="mt-8 min-w-[200px]">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                முகப்புக்கு செல்க
              </Link>
            </Button>

            <div className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              உங்கள் பங்களிப்புக்கு நன்றி
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

