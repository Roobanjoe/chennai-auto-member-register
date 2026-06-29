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
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { FIELD_LABELS } from "@/lib/member-schema";
import type { Database } from "@/integrations/supabase/types";

type Member = Database["public"]["Tables"]["members"]["Row"];

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "உறுப்பினர்கள் பட்டியல்" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.member_no.toLowerCase().includes(q) ||
        m.mobile.includes(q),
    );
  }, [data, search]);

  const todayCount = useMemo(
    () => (data ?? []).filter((m) => isToday(parseISO(m.created_at))).length,
    [data],
  );

  const onDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from("members").delete().eq("id", deleting.id);
      if (error) throw error;
      toast.success("உறுப்பினர் நீக்கப்பட்டார்");
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err) {
      toast.error("நீக்க முடியவில்லை: " + (err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-primary sm:text-3xl">உறுப்பினர்கள்</h2>
          <p className="mt-1 text-sm text-muted-foreground">அனைத்து பதிவு செய்யப்பட்ட உறுப்பினர்கள்</p>
        </div>
        <Button onClick={() => navigate({ to: "/" })}>
          <UserPlus className="mr-2 h-4 w-4" /> புதிய பதிவு
        </Button>
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
        <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base text-primary-deep">தேடல்</CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="பெயர், உறுப்பினர் எண் அல்லது கைபேசி எண்"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              உறுப்பினர்கள் இல்லை
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>புகைப்படம்</TableHead>
                    <TableHead>உறுப்பினர் எண்</TableHead>
                    <TableHead>பெயர்</TableHead>
                    <TableHead>கைபேசி எண்</TableHead>
                    <TableHead>ஆட்டோ நிறுத்துமிடம்</TableHead>
                    <TableHead>பதிவு தேதி</TableHead>
                    <TableHead className="text-right">செயல்கள்</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <img
                          src={m.photo_url}
                          alt={m.name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{m.member_no}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.mobile}</TableCell>
                      <TableCell>{m.auto_stand}</TableCell>
                      <TableCell>{format(parseISO(m.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setViewing(m)} title="பார்">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toast.info("திருத்தல் விரைவில் வரும்")}
                            title="திருத்து"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleting(m)}
                            title="நீக்கு"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="text-primary">{viewing.name}</DialogTitle>
                <DialogDescription>உறுப்பினர் எண்: {viewing.member_no}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
                <img
                  src={viewing.photo_url}
                  alt={viewing.name}
                  className="h-44 w-36 rounded-xl object-cover shadow-card ring-2 ring-primary/20"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KV k={FIELD_LABELS.position} v={viewing.position} />
                  <KV k={FIELD_LABELS.father_name} v={viewing.father_name} />
                  <KV k={FIELD_LABELS.dob} v={format(parseISO(viewing.dob), "dd/MM/yyyy")} />
                  <KV k={FIELD_LABELS.blood_group} v={viewing.blood_group} />
                  <KV k={FIELD_LABELS.mobile} v={viewing.mobile} />
                  <KV k={FIELD_LABELS.emergency_mobile} v={viewing.emergency_mobile} />
                  <KV k={FIELD_LABELS.license_no} v={viewing.license_no} />
                  <KV k={FIELD_LABELS.renewal_date} v={format(parseISO(viewing.renewal_date), "dd/MM/yyyy")} />
                  <KV k={FIELD_LABELS.auto_stand} v={viewing.auto_stand} />
                  <div className="sm:col-span-2">
                    <KV k={FIELD_LABELS.address} v={viewing.address} multiline />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>உறுப்பினரை நீக்கவா?</DialogTitle>
            <DialogDescription>
              {deleting?.name} ({deleting?.member_no}) என்பவரை நீக்க உறுதியா? இந்த செயலை மீட்டெடுக்க முடியாது.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              ரத்து
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              நீக்கு
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    <Card className="shadow-soft">
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
