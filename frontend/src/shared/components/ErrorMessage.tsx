import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <div className={cn("rounded-md bg-destructive/15 p-4", className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-destructive">{title}</h3>
          <div className="mt-2 text-sm text-destructive/90">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
