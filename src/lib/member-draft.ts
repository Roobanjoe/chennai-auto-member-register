import type { MemberFormValues } from "./member-schema";

const STORAGE_KEY = "cm-auto-union:draft-member";
const PHOTO_KEY = "cm-auto-union:draft-photo";

export interface DraftPhoto {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
}

export type DraftValues = Partial<MemberFormValues>;

export function loadDraft(): DraftValues {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DraftValues) : {};
  } catch {
    return {};
  }
}

export function saveDraft(values: DraftValues) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PHOTO_KEY);
}

export function loadPhoto(): DraftPhoto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PHOTO_KEY);
    return raw ? (JSON.parse(raw) as DraftPhoto) : null;
  } catch {
    return null;
  }
}

export function savePhoto(photo: DraftPhoto | null) {
  if (typeof window === "undefined") return;
  if (!photo) {
    sessionStorage.removeItem(PHOTO_KEY);
  } else {
    sessionStorage.setItem(PHOTO_KEY, JSON.stringify(photo));
  }
}

export async function fileToDraftPhoto(file: File): Promise<DraftPhoto> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return { dataUrl, name: file.name, type: file.type, size: file.size };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
