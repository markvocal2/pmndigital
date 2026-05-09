"use client";

import { type ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export function Button({
  loading,
  variant = "primary",
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "ghost") {
    return (
      <button
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md border border-white/10",
          "bg-white/[0.02] px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-200/80",
          "transition hover:border-blue-400/30 hover:bg-white/[0.06] hover:text-blue-100",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        ].join(" ")}
        disabled={isDisabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={[
        "group relative inline-flex w-full items-center justify-center overflow-hidden rounded-md",
        "border border-blue-400/30 bg-gradient-to-r from-blue-500/20 via-blue-400/30 to-cyan-400/20",
        "px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-50",
        "shadow-[0_0_24px_rgba(59,130,246,0.25)]",
        "transition-all hover:border-blue-400/60 hover:from-blue-500/30 hover:via-blue-400/40 hover:to-cyan-400/30",
        "hover:shadow-[0_0_36px_rgba(59,130,246,0.45)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2.5">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200/40 border-t-blue-100" />
          <span>Processing</span>
        </span>
      ) : (
        children
      )}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.18] to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
    </button>
  );
}
