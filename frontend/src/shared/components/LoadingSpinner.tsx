import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex justify-center items-center p-4", className)}>
      <Loader2 
        className="animate-spin text-primary" 
        size={size} 
      />
    </div>
  );
}
