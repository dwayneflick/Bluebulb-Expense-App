import { cn } from "@/lib/utils";
import { ExpenseRequestStatus } from "@workspace/api-client-react";

interface StatusBadgeProps {
  status: ExpenseRequestStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'draft':
      colorClass = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case 'pending_manager':
    case 'pending':
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Pending Manager";
      break;
    case 'pending_internal_control':
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Pending Int. Control";
      break;
    case 'pending_finance_manager':
      colorClass = "bg-purple-50 text-purple-700 border-purple-200";
      label = "Pending Finance Mgr";
      break;
    case 'pending_payment':
      colorClass = "bg-orange-50 text-orange-700 border-orange-200";
      label = "Pending Payment";
      break;
    case 'paid':
    case 'approved':
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case 'rejected':
      colorClass = "bg-red-50 text-red-700 border-red-200";
      break;
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize whitespace-nowrap", colorClass, className)}>
      {label}
    </span>
  );
}
