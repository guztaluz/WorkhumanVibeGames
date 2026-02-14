"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

const LOGO_SOURCES = [
  (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
]

interface ToolLogoProps {
  name: string
  domain: string
  size?: "sm" | "lg"
}

export function ToolLogo({ name, domain, size = "sm" }: ToolLogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const sizeClass = size === "lg" ? "w-14 h-14 text-base" : "w-8 h-8 text-sm"
  const pixelSize = size === "lg" ? 56 : 32
  const showFallback = sourceIndex >= LOGO_SOURCES.length

  const handleError = () => {
    setSourceIndex((i) => i + 1)
  }

  if (showFallback) {
    return (
      <div
        className={cn(
          "rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold",
          sizeClass
        )}
      >
        {name[0]}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0",
        size === "lg" ? "w-14 h-14" : "w-8 h-8"
      )}
    >
      <Image
        src={LOGO_SOURCES[sourceIndex](domain)}
        alt=""
        width={pixelSize}
        height={pixelSize}
        className="object-contain"
        unoptimized
        onError={handleError}
      />
    </div>
  )
}
