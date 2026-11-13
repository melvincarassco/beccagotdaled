import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "dark";
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
      "inline-flex items-center justify-center font-medium tracking-[0.15em] uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059] disabled:opacity-50 disabled:pointer-events-none select-none";

    const sizeStyles = {
      sm: "text-[11px] px-4 py-2 rounded-none",
      md: "text-xs px-6 py-3 rounded-none",
      lg: "text-xs px-8 py-4 rounded-none",
    };

    const variantStyles = {
      primary:
        "bg-[#C5A059] text-white hover:bg-[#B38F46] shadow-sm hover:shadow-md border border-[#C5A059]",
      secondary:
        "bg-[#FAF7F2] text-[#22201E] border border-[#D9CEB2] hover:border-[#C5A059] hover:bg-[#F5EFEB]",
      outline:
        "bg-transparent text-[#22201E] border border-[#22201E]/40 hover:border-[#22201E] hover:bg-[#22201E]/5",
      ghost:
        "bg-transparent text-[#22201E] hover:text-[#C5A059] hover:bg-transparent tracking-[0.18em] underline-offset-8 hover:underline",
      dark:
        "bg-[#22201E] text-[#FAF7F2] border border-[#22201E] hover:bg-[#35322E] shadow-sm",
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
