import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-stone-900 text-stone-50",
        secondary: "border-border bg-muted text-muted-foreground",
        // Verdict types
        verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
        falsified: "border-red-200 bg-red-50 text-red-800",
        inaccurate: "border-amber-200 bg-amber-50 text-amber-800",
        outdated: "border-indigo-200 bg-indigo-50 text-indigo-800",
        partial: "border-orange-200 bg-orange-50 text-orange-800",
        noevidence: "border-slate-200 bg-slate-50 text-slate-600",
        // Legacy alias
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
