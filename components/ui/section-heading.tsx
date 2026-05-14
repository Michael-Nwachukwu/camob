import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-[28px] font-bold leading-[1.15] text-ink tracking-display md:text-[44px] md:leading-[1.1]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-[1.55] text-body md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
