import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 font-serif text-4xl leading-tight text-primary md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-8 text-muted">{description}</p> : null}
    </div>
  );
}
