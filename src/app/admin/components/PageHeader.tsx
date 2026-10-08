export function PageHeader({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2rem] leading-tight text-ink">{title}</h1>
        {intro && (
          <p className="mt-1 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-500">
            {intro}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
