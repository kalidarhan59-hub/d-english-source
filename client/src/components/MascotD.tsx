import { cn } from "@/lib/utils";

type MascotDProps = {
  size?: "sm" | "md" | "lg";
  mood?: "calm" | "proud" | "hint";
  className?: string;
  alt?: string;
};

const sizeClasses = {
  sm: "h-16 w-14",
  md: "h-36 w-28 sm:h-44 sm:w-36",
  lg: "h-[260px] w-[208px] sm:h-[350px] sm:w-[280px] lg:h-[430px] lg:w-[344px]",
};

export function MascotD({ size = "md", mood = "calm", className, alt = "Пантера D, помощник D-English" }: MascotDProps) {
  return (
    <div className={cn("relative shrink-0", sizeClasses[size], className)}>
      <div className={cn("absolute inset-2 rounded-full bg-primary/20 blur-2xl", mood === "proud" && "bg-primary/35")} aria-hidden="true" />
      <img
        src="/manus-storage/d-english-panther-d_ad8d3b1f.png"
        alt={alt}
        className={cn("relative h-full w-full object-contain object-bottom drop-shadow-[0_18px_22px_rgba(8,8,8,0.22)]", mood === "proud" && "mascot-proud")}
      />
    </div>
  );
}
