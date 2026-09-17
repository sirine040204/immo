import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";

export type StatusVariant = "default" | "success" | "warning" | "destructive" | "info";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent",
  success: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
  destructive: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
};

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", variantStyles[variant], className)}
    >
      {status}
    </Badge>
  );
}
