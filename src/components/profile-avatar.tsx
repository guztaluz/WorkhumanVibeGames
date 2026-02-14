"use client"

import { useRef, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, Link2, Smile, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

import { Theme as EmojiTheme } from "emoji-picker-react"
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

export function isEmojiAvatar(value: string | null): boolean {
  return !!value?.startsWith("emoji:")
}

export function getEmojiFromAvatar(value: string | null): string | null {
  if (!value?.startsWith("emoji:")) return null
  const rest = value.slice(6)
  const colonIdx = rest.indexOf(":#")
  if (colonIdx >= 0) return rest.slice(0, colonIdx) || null
  return rest || null
}

/** Returns hex color for emoji avatar background, or null for default */
export function getEmojiBgFromAvatar(value: string | null): string | null {
  if (!value?.startsWith("emoji:")) return null
  const rest = value.slice(6)
  const colonIdx = rest.indexOf(":#")
  if (colonIdx < 0) return null
  const hex = rest.slice(colonIdx + 2)
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex : null
}

interface ProfileAvatarProps {
  value: string | null
  onChange: (value: string | null) => void
  name: string
  className?: string
  avatarMode: "upload" | "url" | "emoji"
  onModeChange: (mode: "upload" | "url" | "emoji") => void
}

export function ProfileAvatar({
  value,
  onChange,
  name,
  className,
  avatarMode,
  onModeChange,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"
  const emoji = getEmojiFromAvatar(value)
  const emojiBg = getEmojiBgFromAvatar(value)
  const imageSrc = value && !isEmojiAvatar(value) ? value : undefined

  const buildEmojiValue = (e: string | null, bg: string | null) => {
    if (!e) return null
    if (bg && /^[0-9a-fA-F]{6}$/.test(bg)) return `emoji:${e}:#${bg}`
    return `emoji:${e}`
  }

  useEffect(() => {
    if (!showEmojiPicker) return
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmojiPicker])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (result.length > 500_000) {
          alert("Image is too large. Please choose a smaller image (under 500KB).")
          return
        }
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const modes = [
    { id: "upload" as const, icon: Upload, label: "Upload" },
    { id: "url" as const, icon: Link2, label: "URL" },
    { id: "emoji" as const, icon: Smile, label: "Emoji" },
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col items-center">
        {emoji ? (
          <div
            className={cn(
              "flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 text-4xl",
              !emojiBg && "bg-primary/5"
            )}
            style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
            role="img"
            aria-label="Avatar"
          >
            {emoji}
          </div>
        ) : (
          <Avatar className="size-20 shrink-0 border-2 border-primary/20">
            <AvatarImage src={imageSrc} alt={name || "Avatar"} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="w-full mt-4 space-y-2">
          <div className="flex justify-center gap-2 flex-wrap">
            {modes.map((m) => (
              <Button
                key={m.id}
                type="button"
                variant={avatarMode === m.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onModeChange(m.id)}
                className="gap-1.5"
              >
                <m.icon className="size-4" />
                {m.label}
              </Button>
            ))}
          </div>
          {avatarMode === "upload" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="size-4 mr-2" />
                Choose image...
              </Button>
            </>
          )}
          {avatarMode === "url" && (
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={
                value && !isEmojiAvatar(value) && value.startsWith("http")
                  ? value
                  : ""
              }
              onChange={(e) => onChange(e.target.value || null)}
              className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
          {avatarMode === "emoji" && (
            <div className="flex gap-2 w-full flex-col sm:flex-row">
              <div ref={pickerRef} className="relative flex-1 min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full gap-2"
                >
                  <Smile className="size-4" />
                  {emoji ? (
                    <span className="text-2xl">{emoji}</span>
                  ) : (
                    "Pick emoji"
                  )}
                </Button>
                {showEmojiPicker && (
                  <div className="absolute left-0 top-full z-50 mt-2 rounded-xl overflow-hidden border border-border bg-popover shadow-lg">
                  <EmojiPicker
                    onEmojiClick={({ emoji: e }) => {
                      onChange(buildEmojiValue(e, emojiBg))
                      setShowEmojiPicker(false)
                    }}
                    theme={EmojiTheme.DARK}
                    width={320}
                    height={360}
                  />
                  </div>
                )}
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <input
                  id="emoji-bg-color"
                  type="color"
                  value={emojiBg ? `#${emojiBg}` : "#6366f1"}
                  onChange={(e) => {
                    const hex = e.target.value.slice(1)
                    onChange(buildEmojiValue(emoji, hex))
                  }}
                  disabled={!emoji}
                  className="size-9 min-w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-color-swatch-wrapper]:p-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => emoji && document.getElementById("emoji-bg-color")?.click()}
                  disabled={!emoji}
                  className="gap-1.5 flex-1"
                >
                  <Palette className="size-4 shrink-0" />
                  <span className="truncate">Background</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
