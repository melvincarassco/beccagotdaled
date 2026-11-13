import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "dark" | "navy";
  size?: "sm" | "md" | "lg";
  href?: string;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium tracking-[0.18em] uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#02084B] disabled:opacity-50 disabled:pointer-events-none select-none";

    const sizeStyles = {
      sm: "text-[11px] px-4 py-2 rounded-none",
      md: "text-xs px-6 py-3 rounded-none",
      lg: "text-xs px-8 py-4 rounded-none",
    };

    const variantStyles = {
      primary:
        "bg-[#02084B] text-[#FEFDF6] hover:bg-[#040D44] shadow-sm hover:shadow-md border border-[#02084B]",
      secondary:
        "bg-[#FEFDF6] text-[#02084B] border border-[#DCD9C9] hover:border-[#02084B] hover:bg-[#F2EEEB]",
      outline:
        "bg-transparent text-[#02084B] border border-[#02084B]/40 hover:border-[#02084B] hover:bg-[#02084B]/5",
      ghost:
        "bg-transparent text-[#02084B] hover:text-[#C5A059] hover:bg-transparent tracking-[0.2em] underline-offset-8 hover:underline",
      dark:
        "bg-[#1A1A1A] text-[#FEFDF6] border border-[#1A1A1A] hover:bg-[#333333] shadow-sm",
      navy:
        "bg-[#040D44] text-[#FEFDF6] border border-[#02084B] hover:bg-[#02084B] shadow-sm",
    };

    const combinedClasses = cn(
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      className
    );

    if (href) {
      return (
        <Link href={href} className={combinedClasses}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </span>
          ) : (
            children
          )}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
