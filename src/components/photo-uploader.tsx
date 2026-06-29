import { useCallback, useRef, useState } from "react";
import { ImagePlus, Trash2, RefreshCw, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftPhoto } from "@/lib/member-draft";
import { fileToDraftPhoto } from "@/lib/member-draft";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

interface Props {
  value: DraftPhoto | null;
  onChange: (photo: DraftPhoto | null) => void;
  error?: string | null;
}

export function PhotoUploader({ value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      setLocalError(null);
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!ACCEPT.includes(file.type)) {
        setLocalError("JPG, JPEG அல்லது PNG கோப்பு மட்டுமே அனுமதிக்கப்படும்");
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError("அதிகபட்ச அளவு 5 MB");
        return;
      }
      const photo = await fileToDraftPhoto(file);
      onChange(photo);
    },
    [onChange],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const displayError = localError ?? error ?? null;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-6 text-center transition",
          dragOver ? "border-primary bg-primary-soft/40" : "border-border",
          displayError && "border-destructive/60",
        )}
      >
        {value ? (
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:text-left">
            <img
              src={value.dataUrl}
              alt="உறுப்பினர் புகைப்படம்"
              className="h-32 w-32 rounded-xl object-cover shadow-card ring-2 ring-primary/20"
            />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024).toFixed(0)} KB
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                  <RefreshCw className="mr-1 h-4 w-4" /> மாற்று
                </Button>
                <Button type="button" size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onChange(null)}>
                  <Trash2 className="mr-1 h-4 w-4" /> நீக்கு
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                உறுப்பினரின் புகைப்படத்தை பதிவேற்றவும்.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, JPEG, PNG · அதிகபட்சம் 5 MB · இழுத்து விடவும் அல்லது தேர்வு செய்யவும்
              </p>
            </div>
            <Button type="button" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" /> புகைப்படத்தை தேர்வு செய்யவும்
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {displayError && <p className="mt-2 text-sm text-destructive">{displayError}</p>}
    </div>
  );
}
