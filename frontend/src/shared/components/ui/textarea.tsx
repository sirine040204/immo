import * as React from "react"

import { cn } from "@/shared/utils/cn"
import { containsProfanity } from "@/shared/utils/moderation"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    const [hasProfanity, setHasProfanity] = React.useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e)
      }
      setHasProfanity(containsProfanity(e.target.value))
    }

    return (
      <div className="w-full flex flex-col">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasProfanity && "border-red-500 focus-visible:ring-red-500 bg-red-50",
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {hasProfanity && (
          <p className="text-red-500 text-xs mt-1.5 font-medium animate-in fade-in slide-in-from-top-1">
            ⚠️ Langage inapproprié détecté. Veuillez modifier votre texte.
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
