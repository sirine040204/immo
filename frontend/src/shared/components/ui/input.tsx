import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

import { containsProfanity } from "@/shared/utils/moderation"

function Input({ className, type, onChange, ...props }: React.ComponentProps<"input">) {
  const [hasProfanity, setHasProfanity] = React.useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e)
    }
    // Only check for profanity on text-based inputs (not file, number, etc.)
    if (type !== 'file' && type !== 'password' && type !== 'email') {
      setHasProfanity(containsProfanity(e.target.value))
    }
  }

  return (
    <div className="w-full flex flex-col">
      <InputPrimitive
        type={type}
        data-slot="input"
        onChange={handleChange}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          hasProfanity && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500 bg-red-50",
          className
        )}
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

export { Input }
