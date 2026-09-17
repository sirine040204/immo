import React from "react";
import { FolderX } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderX,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-gray-200 bg-gray-50", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
