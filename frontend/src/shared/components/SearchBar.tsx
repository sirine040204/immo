import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  wrapperClassName?: string;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <Input
          type="search"
          className={cn("pl-10", className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";
