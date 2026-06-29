import { z } from "zod";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const memberSchema = z.object({
  name: z.string().trim().min(1, { message: "பெயரை உள்ளிடவும்" }).max(100),
  position: z.string().trim().min(1, { message: "பதவியை உள்ளிடவும்" }).max(100),
  father_name: z.string().trim().min(1, { message: "தந்தை பெயரை உள்ளிடவும்" }).max(100),
  dob: z.string().min(1, { message: "பிறந்த தேதியை தேர்ந்தெடுக்கவும்" }),
  member_no: z.string().trim().min(1, { message: "உறுப்பினர் எண்ணை உள்ளிடவும்" }).max(50),
  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, { message: "சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்" }),
  emergency_mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, { message: "சரியான 10 இலக்க அவசர கைபேசி எண்ணை உள்ளிடவும்" }),
  blood_group: z.enum(BLOOD_GROUPS, { message: "இரத்த பிரிவை தேர்ந்தெடுக்கவும்" }),
  license_no: z.string().trim().min(1, { message: "ஓட்டுநர் உரிமம் எண்ணை உள்ளிடவும்" }).max(50),
  renewal_date: z.string().min(1, { message: "புதுப்பிக்க வேண்டிய நாளை தேர்ந்தெடுக்கவும்" }),
  auto_stand: z.string().trim().min(1, { message: "ஆட்டோ நிறுத்துமிடத்தை உள்ளிடவும்" }).max(150),
  address: z.string().trim().min(1, { message: "முகவரியை உள்ளிடவும்" }).max(500),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

export const FIELD_LABELS: Record<keyof MemberFormValues, string> = {
  name: "பெயர்",
  position: "பதவி",
  father_name: "தந்தை பெயர்",
  dob: "பிறந்த தேதி",
  member_no: "உறுப்பினர் எண்",
  mobile: "கைபேசி எண்",
  emergency_mobile: "அவசர கைபேசி எண்",
  blood_group: "இரத்த பிரிவு",
  license_no: "ஓட்டுநர் உரிமம் எண்",
  renewal_date: "புதுப்பிக்க வேண்டிய நாள்",
  auto_stand: "ஆட்டோ நிறுத்துமிடம்",
  address: "முகவரி",
};
