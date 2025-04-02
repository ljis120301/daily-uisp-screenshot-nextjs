"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Toggle } from "@/components/ui/toggle"

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <a 
          className="flex items-center space-x-2 text-lg font-semibold transition-colors hover:text-primary" 
          href="/"
        >
          <span className="hidden sm:inline">UISP Screenshot Service</span>
          <span className="sm:hidden">UISP</span>
        </a>
        <Toggle
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
          className="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Toggle>
      </div>
    </header>
  )
} 