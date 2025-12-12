import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "processing" | "warning" | "offline";
  label?: string;
  showPulse?: boolean;
}

export function StatusIndicator({ status, label, showPulse = true }: StatusIndicatorProps) {
  const statusColors = {
    online: "bg-success",
    processing: "bg-primary",
    warning: "bg-warning",
    offline: "bg-destructive",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[status])} />
        {showPulse && (status === "online" || status === "processing") && (
          <div
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              statusColors[status],
              "opacity-40"
            )}
          />
        )}
      </div>
      {label && (
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
