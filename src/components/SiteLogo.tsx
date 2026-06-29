import { useSiteLogo } from "@/lib/site-logo";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  alt?: string;
};

/**
 * Site logo image sourced exclusively from Supabase Storage.
 * Renders a soft placeholder while loading or if the logo is not yet uploaded.
 */
export function SiteLogo({ className, alt = "சங்கம் சின்னம்" }: Props) {
  const { url, loading } = useSiteLogo();

  if (url) {
    return <img src={url} alt={alt} className={cn("object-cover", className)} />;
  }

  return (
    <div
      aria-label={alt}
      role="img"
      className={cn(
        "flex items-center justify-center bg-primary/10 text-[10px] font-semibold text-primary",
        className,
      )}
    >
      {loading ? "…" : "CN"}
    </div>
  );
}
