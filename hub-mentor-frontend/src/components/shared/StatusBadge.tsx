import { cn } from "@/lib/utils";

/**
 * Consistent status pill across tables. Maps the app's booking/payment/enquiry
 * statuses to a color family; unknown statuses fall back to slate.
 */
const STYLES: Record<string, string> = {
  // enquiry / booking lifecycle
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  // payment
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  // enquiry resolution
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const StatusBadge = ({ status, className }: { status?: string; className?: string }) => {
  const key = (status ?? "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        STYLES[key] ?? "bg-slate-100 text-slate-600 ring-slate-500/20",
        className,
      )}
    >
      {status || "—"}
    </span>
  );
};

export default StatusBadge;
