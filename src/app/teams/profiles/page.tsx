"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  ArrowRight,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Sparkles,
  Lock,
  PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Profile } from "@/types/database"
import { supabase } from "@/lib/supabase"
import { ProfileAvatar, getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import {
  getEventPhase,
  setEventPhase,
  subscribeToEventPhase,
  type EventPhase,
} from "@/lib/event-state"
import { getAdminMode, subscribeToAdminMode } from "@/lib/admin-state"

const ADMIN_CODE = "vibegames2024"

const SKILL_OPTIONS: {
  value: Profile["skill_level"]
  label: string
  emoji: string
  description: string
}[] = [
  { value: "just_starting", label: "Just starting", emoji: "🌱", description: "New to vibe coding" },
  {
    value: "getting_hang",
    label: "Getting the hang of it",
    emoji: "🔥",
    description: "Building confidence",
  },
  {
    value: "master",
    label: "Vibe coding master",
    emoji: "🏆",
    description: "I live in the flow",
  },
]

const STORAGE_KEY = "vibe-games-profiles"

function ProfileDisplay({ profile }: { profile: Profile }) {
  const emoji = getEmojiFromAvatar(profile.avatar_url)
  const emojiBg = getEmojiBgFromAvatar(profile.avatar_url)
  const imageSrc =
    profile.avatar_url && !isEmojiAvatar(profile.avatar_url) ? profile.avatar_url : undefined

  return (
    <>
      {emoji ? (
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-2xl",
            !emojiBg && "bg-primary/10"
          )}
          style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
          role="img"
          aria-label="Avatar"
        >
          {emoji}
        </div>
      ) : (
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={imageSrc} alt={profile.name} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </>
  )
}

function ProfilesPageContent() {
  const searchParams = useSearchParams()
  const [adminFromToggle, setAdminFromToggle] = useState(false)
  useEffect(() => {
    setAdminFromToggle(getAdminMode())
    const unsub = subscribeToAdminMode(setAdminFromToggle)
    return unsub
  }, [])
  const isAdmin = searchParams.get("admin") === ADMIN_CODE || adminFromToggle

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [eventPhase, setEventPhaseState] = useState<EventPhase>("profiles")
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarMode, setAvatarMode] = useState<"upload" | "url" | "emoji">("emoji")
  const [skillLevel, setSkillLevel] = useState<Profile["skill_level"]>("just_starting")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProceeding, setIsProceeding] = useState(false)

  const loadProfiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles((data as Profile[]) || [])
      setUseLocalStorage(false)
    } catch {
      setUseLocalStorage(true)
      const stored = localStorage.getItem(STORAGE_KEY)
      setProfiles(stored ? JSON.parse(stored) : [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()
    getEventPhase().then(setEventPhaseState)
  }, [loadProfiles])

  useEffect(() => {
    if (useLocalStorage) return
    const channel = supabase
      .channel("profiles-and-event")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadProfiles)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_state" }, () => {
        getEventPhase().then(setEventPhaseState)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [useLocalStorage, loadProfiles])

  useEffect(() => {
    const unsub = subscribeToEventPhase(setEventPhaseState)
    return unsub
  }, [])

  const saveToStorage = (items: Profile[]) => {
    if (useLocalStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    setIsSubmitting(true)
    try {
      const avatarValue = avatarUrl || null
      if (editingId) {
        if (useLocalStorage) {
          const updated = profiles.map((p) =>
            p.id === editingId
              ? { ...p, name: name.trim(), avatar_url: avatarValue, skill_level: skillLevel }
              : p
          )
          setProfiles(updated)
          saveToStorage(updated)
        } else {
          const { error } = await supabase
            .from("profiles")
            .update({
              name: name.trim(),
              avatar_url: avatarValue,
              skill_level: skillLevel,
            } as never)
            .eq("id", editingId)

          if (error) throw error
          const idx = profiles.findIndex((p) => p.id === editingId)
          const updated = [...profiles]
          updated[idx] = {
            ...updated[idx],
            name: name.trim(),
            avatar_url: avatarValue,
            skill_level: skillLevel,
          }
          setProfiles(updated)
        }
        setEditingId(null)
      } else {
        const newProfile: Omit<Profile, "id" | "created_at"> = {
          name: name.trim(),
          avatar_url: avatarValue,
          skill_level: skillLevel,
        }

        if (useLocalStorage) {
          const profile: Profile = {
            ...newProfile,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
          const updated = [profile, ...profiles]
          setProfiles(updated)
          saveToStorage(updated)
        } else {
          const { data, error } = await supabase
            .from("profiles")
            .insert(newProfile as never)
            .select()
            .single()

          if (error) throw error
          if (data) setProfiles([data as Profile, ...profiles])
        }
      }

      setName("")
      setAvatarUrl(null)
      setSkillLevel("just_starting")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (profile: Profile) => {
    setName(profile.name)
    setAvatarUrl(profile.avatar_url)
    setSkillLevel(profile.skill_level)
    if (profile.avatar_url?.startsWith("emoji:")) {
      setAvatarMode("emoji")
    } else if (profile.avatar_url?.startsWith("data:")) {
      setAvatarMode("upload")
    } else {
      setAvatarMode("url")
    }
    setEditingId(profile.id)
  }

  const handleRemove = async (id: string) => {
    if (useLocalStorage) {
      const updated = profiles.filter((p) => p.id !== id)
      setProfiles(updated)
      saveToStorage(updated)
    } else {
      const { error } = await supabase.from("profiles").delete().eq("id", id)
      if (!error) setProfiles(profiles.filter((p) => p.id !== id))
    }
    if (editingId === id) {
      setEditingId(null)
      setName("")
      setAvatarUrl(null)
      setSkillLevel("just_starting")
    }
  }

  const handleAdminProceed = async () => {
    setIsProceeding(true)
    try {
      await setEventPhase("pairings")
      setEventPhaseState("pairings")
    } finally {
      setIsProceeding(false)
    }
  }

  const phaseComplete = eventPhase === "pairings"
  const showAdminProceed = isAdmin && profiles.length >= 2 && !phaseComplete

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Phase complete banner */}
        {phaseComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/10 p-6 text-center"
          >
            <PartyPopper className="mx-auto mb-3 size-12 text-primary" />
            <h2 className="text-xl font-bold mb-2">Profiles complete!</h2>
            <p className="text-muted-foreground mb-4">
              Everyone&apos;s in. Head to pairings to create your teams!
            </p>
            <Link href="/teams">
              <Button size="lg" className="group">
                Go to Pairings
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Step 1</span>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">
            Create Your Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Add your name, pick an avatar, and choose your vibe coding level!
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Add/Edit form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-minimal border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {editingId ? "Edit Profile" : "Add Your Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ProfileAvatar
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    name={name}
                    avatarMode={avatarMode}
                    onModeChange={setAvatarMode}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>

                  {/* Skill level - selectable cards */}
                  <div className="space-y-3">
                    <Label>Vibe coding level</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {SKILL_OPTIONS.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          onClick={() => setSkillLevel(opt.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                            skillLevel === opt.value
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-card hover:border-primary/30"
                          }`}
                        >
                          <span className="text-3xl">{opt.emoji}</span>
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Profile"
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profiles list - only show when we have profiles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {profiles.length > 0 && (
              <h2 className="text-xl font-bold mb-4">
                Profiles ({profiles.length})
              </h2>
            )}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <Card className="card-minimal border-2 border-dashed border-border">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No profiles yet. Add the first one above!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                  >
                    <ProfileDisplay profile={profile} />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {SKILL_OPTIONS.find((o) => o.value === profile.skill_level)?.label}
                      </p>
                    </div>
                    {!phaseComplete && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(profile)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(profile.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Admin: Save & proceed */}
            {showAdminProceed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Admin controls
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  All profiles are in. Lock this step and move everyone to pairings.
                </p>
                <Button
                  onClick={handleAdminProceed}
                  disabled={isProceeding}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isProceeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Save & Proceed to Pairings
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Regular CTA when phase not locked and we have 2+ profiles */}
            {profiles.length >= 2 && !phaseComplete && !showAdminProceed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-border"
              >
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Waiting for the host to proceed. Add your profile above!
                </p>
                <Link href="/teams" className="block">
                  <Button variant="outline" size="lg" className="w-full group">
                    Preview Pairings
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {useLocalStorage && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <p className="text-yellow-500">
                  Running in demo mode (localStorage). Admin phase sync requires Supabase.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <ProfilesPageContent />
    </Suspense>
  )
}
