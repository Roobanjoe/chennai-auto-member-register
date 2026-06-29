import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday } from "date-fns";
import {
  Eye,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
  CalendarCheck,
  ImageUp,
  X,
  Phone,
  MapPin,
  Droplet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BLOOD_GROUPS, FIELD_LABELS, type MemberFormValues } from "@/lib/member-schema";
import { uploadSiteLogo } from "@/lib/site-logo";
import { SiteLogo } from "@/components/SiteLogo";
import type { Database } from "@/integrations/supabase/types";

type Member = Database["public"]["Tables"]["members"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "உறுப்பினர்கள் பட்டியல்" }] }),
  component: DashboardPage,
});

const ALL = "__all__";

function DashboardPage() {
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState<string>(ALL);
  const [standFilter, setStandFilter] = useState<string>(ALL);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });

  const stands = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((m) => m.auto_stand && s.add(m.auto_stand));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((m) => {
      if (q) {
        const hit =
          m.name.toLowerCase().includes(q) ||
          m.member_no.toLowerCase().includes(q) ||
          m.mobile.includes(q);
        if (!hit) return false;
      }
      if (bloodFilter !== ALL && m.blood_group !== bloodFilter) return false;
      if (standFilter !== ALL && m.auto_stand !== standFilter) return false;
      return true;
    });
  }, [data, search, bloodFilter, standFilter]);

  const todayCount = useMemo(
    () => (data ?? []).filter((m) => isToday(parseISO(m.created_at))).length,
    [data],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-primary sm:text-3xl">
            நிர்வாக பலகை
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            அனைத்து பதிவு செய்யப்பட்ட உறுப்பினர்கள்
          </p>
        </div>
        <div className="flex gap-2">
          <LogoUploader />
          <Button onClick={() => navigate({ to: "/" })}>
            <UserPlus className="mr-2 h-4 w-4" /> புதிய பதிவு
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="மொத்த உறுப்பினர்கள்"
          value={data?.length ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="இன்றைய பதிவுகள்"
          value={todayCount}
          loading={isLoading}
          accent
        />
      </div>

      <Card className="shadow-soft">
        <CardHeader className="gap-3 space-y-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base text-primary-deep">
              தேடல் & வடிகட்டி
            </CardTitle>
            <Badge variant="secondary" className="self-start sm:self-auto">
              {filtered.length} / {data?.length ?? 0}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="பெயர் / உறுப்பினர் எண் / கைபேசி"
                className="pl-9"
              />
            </div>
            <Select value={bloodFilter} onValueChange={setBloodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="இரத்த பிரிவு" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>எல்லா இரத்த பிரிவு</SelectItem>
                {BLOOD_GROUPS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={standFilter} onValueChange={setStandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ஆட்டோ நிறுத்துமிடம்" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>எல்லா நிறுத்துமிடம்</SelectItem>
                {stands.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              உறுப்பினர்கள் இல்லை
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onView={() => setViewing(m)}
                  onEdit={() => setEditing(m)}
                  onDelete={() => setDeleting(m)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ViewDialog member={viewing} onClose={() => setViewing(null)} />
      <EditDialog
        member={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["members"] });
        }}
      />
      <DeleteDialog
        member={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          qc.invalidateQueries({ queryKey: ["members"] });
        }}
      />
    </div>
  );
}

function MemberCard({
  member,
  onView,
  onEdit,
  onDelete,
}: {
  member: Member;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
      <div className="flex items-start gap-3">
        <img
          src={member.photo_url}
          alt={member.name}
          className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-primary/20"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
            <Badge variant="outline" className="shrink-0 border-primary/30 text-[10px] text-primary">
              {member.member_no}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{member.position}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <Badge variant="secondary" className="gap-1">
              <Droplet className="h-3 w-3" /> {member.blood_group}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Phone className="h-3 w-3" /> {member.mobile}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary/70" />
        <span className="truncate">{member.auto_stand}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <p className="text-[10px] text-muted-foreground">
          {format(parseISO(member.created_at), "dd/MM/yyyy")}
        </p>
        <div className="inline-flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onView} title="பார்">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="திருத்து">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            title="நீக்கு"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ViewDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {member && (
          <>
            <DialogHeader>
              <DialogTitle className="text-primary">{member.name}</DialogTitle>
              <DialogDescription>உறுப்பினர் எண்: {member.member_no}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
              <img
                src={member.photo_url}
                alt={member.name}
                className="h-44 w-36 rounded-xl object-cover shadow-card ring-2 ring-primary/20"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KV k={FIELD_LABELS.position} v={member.position} />
                <KV k={FIELD_LABELS.father_name} v={member.father_name} />
                <KV k={FIELD_LABELS.dob} v={format(parseISO(member.dob), "dd/MM/yyyy")} />
                <KV k={FIELD_LABELS.blood_group} v={member.blood_group} />
                <KV k={FIELD_LABELS.mobile} v={member.mobile} />
                <KV k={FIELD_LABELS.emergency_mobile} v={member.emergency_mobile} />
                <KV k={FIELD_LABELS.license_no} v={member.license_no} />
                <KV k={FIELD_LABELS.renewal_date} v={format(parseISO(member.renewal_date), "dd/MM/yyyy")} />
                <KV k={FIELD_LABELS.auto_stand} v={member.auto_stand} />
                <div className="sm:col-span-2">
                  <KV k={FIELD_LABELS.address} v={member.address} multiline />
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  member,
  onClose,
  onSaved,
}: {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MemberFormValues | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form when a new member is opened
  useMemo(() => {
    if (member) {
      setForm({
        name: member.name,
        position: member.position,
        father_name: member.father_name,
        dob: member.dob,
        member_no: member.member_no,
        mobile: member.mobile,
        emergency_mobile: member.emergency_mobile,
        blood_group: member.blood_group as MemberFormValues["blood_group"],
        license_no: member.license_no,
        renewal_date: member.renewal_date,
        auto_stand: member.auto_stand,
        address: member.address,
      });
    } else {
      setForm(null);
    }
  }, [member]);

  if (!member || !form) {
    return (
      <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const set = <K extends keyof MemberFormValues>(k: K, v: MemberFormValues[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", member.id);
      if (error) throw error;
      toast.success("உறுப்பினர் விவரம் புதுப்பிக்கப்பட்டது");
      onSaved();
    } catch (err) {
      toast.error("சேமிக்க முடியவில்லை: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">உறுப்பினர் திருத்தம்</DialogTitle>
          <DialogDescription>உறுப்பினர் எண்: {member.member_no}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={FIELD_LABELS.name}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.position}>
            <Input value={form.position} onChange={(e) => set("position", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.father_name}>
            <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.dob}>
            <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.member_no}>
            <Input value={form.member_no} onChange={(e) => set("member_no", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.mobile}>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label={FIELD_LABELS.emergency_mobile}>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={form.emergency_mobile}
              onChange={(e) => set("emergency_mobile", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label={FIELD_LABELS.blood_group}>
            <Select
              value={form.blood_group}
              onValueChange={(v) => set("blood_group", v as MemberFormValues["blood_group"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={FIELD_LABELS.license_no}>
            <Input value={form.license_no} onChange={(e) => set("license_no", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.renewal_date}>
            <Input
              type="date"
              value={form.renewal_date}
              onChange={(e) => set("renewal_date", e.target.value)}
            />
          </Field>
          <Field label={FIELD_LABELS.auto_stand} className="sm:col-span-2">
            <Input value={form.auto_stand} onChange={(e) => set("auto_stand", e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.address} className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="mr-1 h-4 w-4" /> ரத்து
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            சேமி
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: Member | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!member) return;
    setLoading(true);
    try {
      // 1. Remove members row in Supabase
      const { error } = await supabase.from("members").delete().eq("id", member.id);
      if (error) throw error;

      // 2. Best-effort: remove the photo from `member-photos` storage so we
      //    do not leave orphaned files behind. We try to derive the storage
      //    path from the public URL; ignore failures since the row is gone.
      try {
        const url = new URL(member.photo_url);
        const marker = "/member-photos/";
        const idx = url.pathname.indexOf(marker);
        if (idx !== -1) {
          const path = decodeURIComponent(url.pathname.slice(idx + marker.length));
          await supabase.storage.from("member-photos").remove([path]);
        }
      } catch {
        /* ignore storage cleanup errors */
      }

      toast.success("உறுப்பினர் நீக்கப்பட்டார்");
      onDeleted();
    } catch (err) {
      toast.error("நீக்க முடியவில்லை: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>உறுப்பினரை நீக்கவா?</DialogTitle>
          <DialogDescription>
            {member?.name} ({member?.member_no}) என்பவரை நீக்க உறுதியா? இந்த செயலை மீட்டெடுக்க
            முடியாது.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            ரத்து
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            நீக்கு
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogoUploader() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadSiteLogo(file, file.type || "image/png");
      toast.success("சங்கம் சின்னம் புதுப்பிக்கப்பட்டது");
      setFile(null);
      setOpen(false);
    } catch (err) {
      toast.error("பதிவேற்ற முடியவில்லை: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ImageUp className="mr-2 h-4 w-4" /> சின்னம்
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>சங்கம் சின்னம் புதுப்பிப்பு</DialogTitle>
          <DialogDescription>
            JPG / PNG கோப்பை தேர்ந்தெடுக்கவும். அனைத்து பக்கங்களிலும் காட்டப்படும்.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <SiteLogo className="h-full w-full" />
            )}
          </div>
          <Input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            ரத்து
          </Button>
          <Button onClick={upload} disabled={!file || uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            பதிவேற்று
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="shadow-soft transition-shadow hover:shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            accent ? "bg-accent text-accent-foreground" : "bg-primary-soft text-primary"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-primary" />
          ) : (
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KV({ k, v, multiline }: { k: string; v: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className={`mt-0.5 text-sm font-medium text-foreground ${multiline ? "whitespace-pre-line" : ""}`}>
        {v}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
