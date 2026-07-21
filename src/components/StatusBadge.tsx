import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-status-pending/10 text-status-pending border-status-pending/20",
  },
  active: {
    label: "Active",
    className: "bg-status-active/10 text-status-active border-status-active/20",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed/10 text-status-completed border-status-completed/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  },
  open: {
    label: "Open",
    className: "bg-status-active/10 text-status-active border-status-active/20",
  },
  paid: {
    label: "Open",
    className: "bg-status-active/10 text-status-active border-status-active/20",
  },
  declined: {
    label: "Declined",
    className: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  },
  unconfirmed: {
    label: "Unconfirmed",
    className: "bg-status-pending/10 text-status-pending border-status-pending/20",
  },
  "in_progress": {
    label: "In Progress",
    className: "bg-status-active/10 text-status-active border-status-active/20",
  },
  draft: {
    label: "Draft",
    className: "bg-muted/10 text-muted-foreground border-muted/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? "unknown";
  const config =
    statusConfig[normalized] || {
      label: status || "Unknown",
      className: "bg-muted/10 text-muted-foreground border-muted/20",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
