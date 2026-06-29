import { useEffect, useMemo, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, IdCard, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PhotoUploader } from "@/components/photo-uploader";
import {
  BLOOD_GROUPS,
  memberSchema,
  type MemberFormValues,
} from "@/lib/member-schema";
import {
  loadDraft,
  loadPhoto,
  saveDraft,
  savePhoto,
  type DraftPhoto,
} from "@/lib/member-draft";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "உறுப்பினர் பதிவு — சென்னை மக்கள் ஆட்டோ ஓட்டுநர் தொழிற்சங்கம்" },
      { name: "description", content: "புதிய உறுப்பினரை பதிவு செய்யவும்" },
    ],
  }),
  component: RegisterPage,
});

const DEFAULTS: MemberFormValues = {
  name: "",
  position: "",
  father_name: "",
  dob: "",
  member_no: "",
  mobile: "",
  emergency_mobile: "",
  blood_group: "O+",
  license_no: "",
  renewal_date: "",
  auto_stand: "",
  address: "",
};

const STEPS = [
  {
    key: "personal",
    title: "தனிப்பட்ட விவரங்கள்",
    description: "உங்களை பற்றி சொல்லுங்கள்",
    icon: UserRound,
    fields: ["name", "father_name", "dob", "mobile", "emergency_mobile", "blood_group"] as Array<keyof MemberFormValues>,
  },
  {
    key: "driver",
    title: "ஓட்டுநர் விவரங்கள்",
    description: "உரிமம் மற்றும் சங்க தகவல்",
    icon: IdCard,
    fields: ["position", "member_no", "license_no", "renewal_date", "auto_stand", "address"] as Array<keyof MemberFormValues>,
  },
  {
    key: "photo",
    title: "புகைப்படம்",
    description: "உறுப்பினர் புகைப்படத்தை பதிவேற்றவும்",
    icon: Camera,
    fields: [] as Array<keyof MemberFormValues>,
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<DraftPhoto | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  // Hydrate from sessionStorage once mounted
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft).length) {
      form.reset({ ...DEFAULTS, ...draft });
    }
    const p = loadPhoto();
    if (p) setPhoto(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change
  useEffect(() => {
    const sub = form.watch((values) => saveDraft(values as Partial<MemberFormValues>));
    return () => sub.unsubscribe();
  }, [form]);

  useEffect(() => {
    savePhoto(photo);
  }, [photo]);

  const current = STEPS[step];

  const goNext = async () => {
    if (current.fields.length) {
      const ok = await form.trigger(current.fields as Path<MemberFormValues>[]);
      if (!ok) return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const onSubmit = async (values: MemberFormValues) => {
    setPhotoError(null);
    if (!photo) {
      setPhotoError("உறுப்பினரின் புகைப்படத்தை பதிவேற்றவும்.");
      toast.error("புகைப்படம் தேவை");
      return;
    }
    setValidating(true);
    try {
      // Duplicate check 1: name + dob + mobile
      const { data: dup1, error: e1 } = await supabase
        .from("members")
        .select("id")
        .eq("name", values.name)
        .eq("dob", values.dob)
        .eq("mobile", values.mobile)
        .maybeSingle();
      if (e1) throw e1;
      if (dup1) {
        toast.error("நீங்கள் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளீர்கள்.");
        return;
      }
      // Duplicate check 2: mobile only
      const { data: dup2, error: e2 } = await supabase
        .from("members")
        .select("id")
        .eq("mobile", values.mobile)
        .maybeSingle();
      if (e2) throw e2;
      if (dup2) {
        toast.error("இந்த கைபேசி எண் ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது.");
        return;
      }
      // Duplicate check 3: member_no
      const { data: dup3, error: e3 } = await supabase
        .from("members")
        .select("id")
        .eq("member_no", values.member_no)
        .maybeSingle();
      if (e3) throw e3;
      if (dup3) {
        toast.error("இந்த உறுப்பினர் எண் ஏற்கனவே உள்ளது.");
        return;
      }
      saveDraft(values);
      savePhoto(photo);
      navigate({ to: "/preview" });
    } catch (err) {
      console.error(err);
      toast.error("சரிபார்ப்பின் போது சிக்கல்: " + (err as Error).message);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6 sm:pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary sm:text-3xl">உறுப்பினர் பதிவு</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          மூன்று எளிய படிகளில் உறுப்பினரை பதிவு செய்யவும்
        </p>
      </div>

      <Stepper step={step} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-6"
          noValidate
        >
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <current.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg text-primary-deep">{current.title}</CardTitle>
                  <CardDescription>{current.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {step === 0 && <PersonalStep form={form} />}
              {step === 1 && <DriverStep form={form} />}
              {step === 2 && (
                <PhotoUploader value={photo} onChange={setPhoto} error={photoError} />
              )}
            </CardContent>
          </Card>

          {/* Desktop nav */}
          <div className="hidden items-center justify-between sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || validating}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> பின்செல்
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                அடுத்து <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={validating}>
                {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                சமர்ப்பிக்கவும்
              </Button>
            )}
          </div>

          {/* Mobile sticky nav */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || validating}
              >
                பின்செல்
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" className="flex-1" onClick={goNext}>
                  அடுத்து
                </Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={validating}>
                  {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  சமர்ப்பி
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary-soft text-primary",
                !done && !active && "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className={cn("truncate text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>
                படி {i + 1}
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("ml-1 h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

type FormProps = { form: ReturnType<typeof useForm<MemberFormValues>> };

function PersonalStep({ form }: FormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="name" label="பெயர்" placeholder="முழுப் பெயர்" />
      <TextField form={form} name="father_name" label="தந்தை பெயர்" placeholder="தந்தை பெயர்" />
      <DateField form={form} name="dob" label="பிறந்த தேதி" />
      <BloodGroupField form={form} />
      <TextField form={form} name="mobile" label="கைபேசி எண்" placeholder="10 இலக்கம்" inputMode="numeric" maxLength={10} />
      <TextField form={form} name="emergency_mobile" label="அவசர கைபேசி எண்" placeholder="10 இலக்கம்" inputMode="numeric" maxLength={10} />
    </div>
  );
}

function DriverStep({ form }: FormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="position" label="பதவி" placeholder="உ.ம். ஓட்டுநர்" />
      <TextField form={form} name="member_no" label="உறுப்பினர் எண்" placeholder="உ.ம். CM-001" />
      <TextField form={form} name="license_no" label="ஓட்டுநர் உரிமம் எண்" />
      <DateField form={form} name="renewal_date" label="புதுப்பிக்க வேண்டிய நாள்" />
      <TextField form={form} name="auto_stand" label="ஆட்டோ நிறுத்துமிடம்" />
      <div className="sm:col-span-2">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>முகவரி</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="முழு முகவரி" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function TextField({
  form,
  name,
  label,
  placeholder,
  inputMode,
  maxLength,
}: FormProps & {
  name: keyof MemberFormValues;
  label: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              inputMode={inputMode}
              maxLength={maxLength}
              {...field}
              onChange={(e) => {
                const v = inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value;
                field.onChange(v);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField({
  form,
  name,
  label,
}: FormProps & { name: "dob" | "renewal_date"; label: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const date = field.value ? parseISO(field.value) : undefined;
        return (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    {date ? format(date, "dd/MM/yyyy") : "தேதியை தேர்ந்தெடுக்கவும்"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear() + 15}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function BloodGroupField({ form }: FormProps) {
  const options = useMemo(() => BLOOD_GROUPS, []);
  return (
    <FormField
      control={form.control}
      name="blood_group"
      render={({ field }) => (
        <FormItem>
          <FormLabel>இரத்த பிரிவு</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="தேர்ந்தெடுக்கவும்" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((bg) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
