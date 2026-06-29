import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Loader2, Pencil, Phone, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FIELD_LABELS, memberSchema, type MemberFormValues } from "@/lib/member-schema";
import {
  clearDraft,
  dataUrlToBlob,
  loadDraft,
  loadPhoto,
  type DraftPhoto,
} from "@/lib/member-draft";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [{ title: "முன்னோட்டம் — உறுப்பினர் பதிவு" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<MemberFormValues | null>(null);
  const [photo, setPhoto] = useState<DraftPhoto | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    const p = loadPhoto();
    const parsed = memberSchema.safeParse(draft);
    if (!parsed.success || !p) {
      toast.error("முதலில் பதிவு படிவத்தை நிரப்பவும்");
      navigate({ to: "/" });
      return;
    }
    setValues(parsed.data);
    setPhoto(p);
  }, [navigate]);

  const onSave = async () => {
    if (!values || !photo) return;
    setSaving(true);
    try {
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${values.member_no}.${ext}`;
      const blob = dataUrlToBlob(photo.dataUrl);
      const { error: upErr } = await supabase.storage
        .from("member-photos")
        .upload(path, blob, { contentType: photo.type, upsert: true });
      if (upErr) throw upErr;

      const { data: signed, error: signErr } = await supabase.storage
        .from("member-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
      if (signErr) throw signErr;

      const { error: insErr } = await supabase.from("members").insert({
        ...values,
        photo_url: signed.signedUrl,
      });
      if (insErr) throw insErr;

      toast.success("உறுப்பினர் பதிவு வெற்றிகரமாக சேமிக்கப்பட்டது.");
      clearDraft();
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("சேமிக்க முடியவில்லை: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!values || !photo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const dob = format(parseISO(values.dob), "dd/MM/yyyy");
  const renewal = format(parseISO(values.renewal_date), "dd/MM/yyyy");

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary sm:text-3xl">முன்னோட்டம்</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          விவரங்களை சரிபார்த்து உறுதிப்படுத்தவும். <span className="font-medium text-warning-foreground">பதிவு செய்யவும்</span> அழுத்தும் வரை தரவு சேமிக்கப்படாது.
        </p>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[280px_1fr]">
          <div className="relative bg-gradient-to-br from-primary-soft to-primary/10 p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <img
                src={photo.dataUrl}
                alt={values.name}
                className="h-44 w-36 rounded-xl object-cover shadow-card ring-4 ring-background"
              />
              <h3 className="mt-4 text-lg font-semibold text-primary-deep">{values.name}</h3>
              <p className="text-sm text-muted-foreground">{values.position}</p>
              <Badge className="mt-3 bg-accent text-accent-foreground hover:bg-accent">
                {values.blood_group}
              </Badge>
              <div className="mt-4 flex items-center gap-1 text-xs text-foreground/80">
                <Phone className="h-3.5 w-3.5" /> {values.mobile}
              </div>
              <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                உறுப்பினர் எண்: {values.member_no}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Row label={FIELD_LABELS.father_name} value={values.father_name} />
              <Row label={FIELD_LABELS.dob} value={dob} />
              <Row label={FIELD_LABELS.license_no} value={values.license_no} />
              <Row label={FIELD_LABELS.renewal_date} value={renewal} />
              <Row label={FIELD_LABELS.auto_stand} value={values.auto_stand} />
              <Row label={FIELD_LABELS.emergency_mobile} value={values.emergency_mobile} />
              <div className="sm:col-span-2">
                <Row label={FIELD_LABELS.address} value={values.address} multiline />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          disabled={saving}
        >
          <Pencil className="mr-2 h-4 w-4" /> திருத்து
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          பதிவு செய்யவும்
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        அனைத்து கட்டாய சரிபார்ப்புகளும் நிறைவடைந்தன
      </div>
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-foreground ${multiline ? "whitespace-pre-line" : "truncate"}`}>
        {value}
      </p>
    </div>
  );
}
