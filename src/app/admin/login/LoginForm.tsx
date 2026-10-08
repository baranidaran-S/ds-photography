"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  /* Eight wrong tries now closes the account for fifteen minutes, so being able
     to read back what you typed is worth the button. */
  const [showPassword, setShowPassword] = useState(false);
  const formId = useId();
  /* Where the sign-in button was last pressed, so the ring spreads from the
     finger rather than from the middle. The id restarts the animation when the
     same spot is pressed twice. */
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(
    null,
  );

  function press(event: React.PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setRipple({
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      // a counter rather than a clock: two presses inside a millisecond would
      // share a key and the second would not animate
      id: (ripple?.id ?? 0) + 1,
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Could not sign in. Please try again.");
        setBusy(false);
        return;
      }

      // `next` comes from proxy.ts when an admin page bounced us here
      const next = params.get("next") ?? "/admin/dashboard";
      startTransition(() => {
        router.replace(next.startsWith("/admin") ? next : "/admin/dashboard");
        router.refresh();
      });
    } catch {
      setError("Network problem. Check your connection and try again.");
      setBusy(false);
    }
  }

  const working = busy || pending;

  return (
    <form onSubmit={onSubmit} className="on-dark mt-7 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block font-heading text-[0.62rem] font-semibold tracking-[0.2em] text-cream/55 uppercase"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="w-full rounded-lg border border-cream/15 bg-night/50 px-3.5 py-2.5 text-[0.92rem] text-cream placeholder:text-cream/25 transition-colors duration-300 focus:border-brand/70 focus:bg-night/70 focus:ring-2 focus:ring-brand/25 focus:outline-none"
          placeholder="admin@dsphotography.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-heading text-[0.62rem] font-semibold tracking-[0.2em] text-cream/55 uppercase"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-cream/15 bg-night/50 px-3.5 py-2.5 text-[0.92rem] text-cream placeholder:text-cream/25 transition-colors duration-300 focus:border-brand/70 focus:bg-night/70 focus:ring-2 focus:ring-brand/25 focus:outline-none pr-11"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls={`${formId}-password`}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-cream/35 transition-[color,transform] duration-200 hover:text-brand active:scale-90"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-[1.1rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12" />
              <circle cx="12" cy="12" r="2.6" />
              {!showPassword && <path d="m4 20 16-16" />}
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-accent/20 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-cream ring-1 ring-accent/40"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={working}
        onPointerDown={press}
        className="relative mt-1 w-full overflow-hidden rounded-lg bg-brand py-3 font-heading text-[0.74rem] font-bold tracking-[0.14em] text-night uppercase shadow-[0_10px_30px_-12px_rgb(214_178_108/0.7)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-brand-light active:scale-[0.985] active:shadow-[0_4px_14px_-8px_rgb(214_178_108/0.7)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ripple && (
          <span
            key={ripple.id}
            aria-hidden
            onAnimationEnd={() => setRipple(null)}
            style={{ left: ripple.x, top: ripple.y }}
            /* Sized past the button's own corners so the ring leaves it rather
               than stopping short. Skipped for anyone who asked for less
               movement. */
            className="pointer-events-none absolute size-[28rem] animate-[ripple_.55s_ease-out] rounded-full bg-night/35 motion-reduce:hidden"
          />
        )}
        <span className="relative">{working ? "Signing in…" : "Sign in"}</span>
      </button>
    </form>
  );
}
