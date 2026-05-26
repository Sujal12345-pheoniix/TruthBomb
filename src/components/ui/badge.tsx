import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-stone-900 text-stone-50",
        secondary: "border-border bg-muted text-muted-foreground",
        verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
        falsified: "border-red-200 bg-red-50 text-red-800",
        inaccurate: "border-amber-200 bg-amber-50 text-amber-800",
        partial: "border-blue-200 bg-blue-50 text-blue-800",
        none: "border-stone-200 bg-stone-50 text-stone-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
