"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Switch
      checked={theme === "dark"}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
    />
  )
}
