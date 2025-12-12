import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "warning" | "success";
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  variant = "default",
}: MetricCardProps) {
  const variants = {
    default: "border-border/50",
    primary: "border-primary/30 bg-primary/5",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
  };

  const iconVariants = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel p-4 space-y-3 transition-all duration-300 hover:border-primary/50",
        variants[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("w-5 h-5", iconVariants[variant])} />
        {trend && (
          <span
            className={cn(
              "font-mono text-xs",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "→"}
          </span>
        )}
      </div>
      <div>
        <p className="font-mono text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </p>
        {subValue && (
          <p className="font-mono text-xs text-primary mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
