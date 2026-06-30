import { useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IdCardFront, IdCardBack } from "@/components/IdCard";
import { useIdCardTemplates } from "@/lib/id-card-templates";
import { generateIdCardPdf } from "@/lib/id-card-pdf";
import type { Database } from "@/integrations/supabase/types";

type Member = Database["public"]["Tables"]["members"]["Row"];

export const Route = createFileRoute("/_authenticated/id-card/$memberId")({
  head: () => ({ meta: [{ title: "உறுப்பினர் அடையாள அட்டை" }] }),
  component: IdCardPage,
});

function IdCardPage() {
  const { memberId } = useParams({ from: "/_authenticated/id-card/$memberId" });
  const { front: frontTpl, back: backTpl, loading: tplLoading } = useIdCardTemplates();
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .maybeSingle();
      if (error) throw error;
      return data as Member | null;
    },
  });

  const download = async () => {
    if (!frontRef.current || !backRef.current || !member) return;
    setDownloading(true);
    try {
      await generateIdCardPdf(
        frontRef.current,
        backRef.current,
        `id-card-${member.member_no}.pdf`,
      );
      toast.success("PDF பதிவிறக்கப்பட்டது");
    } catch (err) {
      toast.error("PDF உருவாக்க முடியவில்லை: " + (err as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || tplLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-muted-foreground">உறுப்பினர் கிடைக்கவில்லை.</p>
        <Button asChild variant="link">
          <Link to="/dashboard">திரும்பு</Link>
        </Button>
      </div>
    );
  }

  if (!frontTpl || !backTpl) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-muted-foreground">
          அட்டை வார்ப்புருக்கள் ஏற்றப்படவில்லை. மீண்டும் முயற்சிக்கவும்.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" /> திரும்பு
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold text-primary">அடையாள அட்டை</h2>
          <p className="text-sm text-muted-foreground">
            {member.name} • உறுப்பினர் எண் {member.member_no}
          </p>
        </div>
        <Button onClick={download} disabled={downloading} size="lg">
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          PDF பதிவிறக்கம்
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">முகப்பு</p>
          <IdCardFront ref={frontRef} member={member} templateUrl={frontTpl} />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">பின்புறம்</p>
          <IdCardBack ref={backRef} member={member} templateUrl={backTpl} />
        </div>
      </div>
    </div>
  );
}
