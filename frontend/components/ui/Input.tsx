"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...rest },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-200/70"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          "w-full rounded-md border bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500",
          "border-white/10 backdrop-blur-md transition-all",
          "focus:border-blue-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-blue-400/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-rose-400/50 focus:border-rose-400/80 focus:ring-rose-400/30" : "",
          className,
        ].join(" ")}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-[11px] tracking-wide text-rose-300/90"
          style={{ textShadow: "0 0 8px rgba(244,63,94,0.45)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
});
