"use client";

const inputBase =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.9rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none";

type Base = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: Base) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputBase} ${mono ? "font-mono text-[0.84rem]" : ""}`}
      />
      {hint && (
        <span className="mt-1 block text-[0.76rem] leading-relaxed text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: Base & { rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${inputBase} resize-y leading-relaxed`}
      />
      {hint && (
        <span className="mt-1 block text-[0.76rem] leading-relaxed text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

/** Multi-line value stored as an array of lines (address, opening hours, paragraphs). */
export function LinesField({
  label,
  value,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <TextArea
      label={label}
      value={value.join("\n")}
      onChange={(v) => onChange(v.split("\n").map((l) => l.trim()).filter(Boolean))}
      rows={rows}
      hint={hint ?? "One per line."}
    />
  );
}

export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-display text-[1.2rem] text-ink">{title}</h2>
      {description && (
        <p className="mt-1 mb-4 max-w-[62ch] text-[0.86rem] leading-relaxed text-slate-500">
          {description}
        </p>
      )}
      <div className={description ? "space-y-4" : "mt-4 space-y-4"}>{children}</div>
    </section>
  );
}
