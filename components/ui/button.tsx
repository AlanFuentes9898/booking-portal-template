import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-brand-green)] text-[color:var(--color-brand-ink)] hover:brightness-95 shadow-sm",
        accent:
          "bg-[color:var(--color-brand-pink)] text-white hover:brightness-110 shadow-sm",
        outline:
          "border border-[color:var(--color-brand-ink)]/15 bg-transparent hover:bg-[color:var(--color-brand-green-soft)]/40",
        ghost:
          "bg-transparent hover:bg-[color:var(--color-brand-green-soft)]/40",
        link: "bg-transparent underline-offset-4 hover:underline text-[color:var(--color-brand-pink)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
