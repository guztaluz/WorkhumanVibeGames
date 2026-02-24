"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  UserPlus,
  ArrowRight,
  Sparkles,
  Lock,
  Loader2,
  Users2,
  Zap,
  PartyPopper,
  Pencil,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Profile } from "@/types/database"
import { supabase } from "@/lib/supabase"
import { ProfileAvatar, getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import { cn } from "@/lib/utils"
import { setEventPhase, getEventPhase, subscribeToEventPhase, type EventPhase } from "@/lib/event-state"
import { getAdminMode, subscribeToAdminMode } from "@/lib/admin-state"
import { pairProfiles, pairLateJoiners } from "@/lib/pairing"
import { savePairs, appendPairs, fetchPairs } from "@/lib/pairs"
import { PhaseTransitionOverlay, usePreviousPhase } from "@/components/phase-transition-overlay"

const ADMIN_CODE = "vibegames2024"
const STORAGE_KEY = "vibe-games-profiles"
const MY_PROFILE_ID_KEY = "vibe-games-my-profile-id"

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

const WORK_LOCATION_OPTIONS: {
  value: Profile["work_location"]
  label: string
  emoji: string
}[] = [
  { value: "in_office", label: "In office", emoji: "🏢" },
  { value: "remote", label: "Remote", emoji: "🏠" },
]

function MiniProfile({
  profile,
  isAdmin,
  canDelete,
  onDelete,
}: {
  profile: Profile
  isAdmin: boolean
  canDelete: boolean
  onDelete: (id: string) => void
}) {
  const emoji = getEmojiFromAvatar(profile.avatar_url)
  const emojiBg = getEmojiBgFromAvatar(profile.avatar_url)
  const imageSrc =
    profile.avatar_url && !isEmojiAvatar(profile.avatar_url) ? profile.avatar_url : undefined
  const skillOpt = SKILL_OPTIONS.find((o) => o.value === profile.skill_level)
  const workOpt = WORK_LOCATION_OPTIONS.find((o) => o.value === (profile.work_location ?? "in_office"))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:bg-card transition-all min-w-[88px]"
    >
      {isAdmin && canDelete && (
        <button
          type="button"
          onClick={() => onDelete(profile.id)}
          className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors z-10"
          aria-label={`Delete ${profile.name}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
      {emoji ? (
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-2xl ring-2 ring-background",
            !emojiBg && "bg-primary/10"
          )}
          style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
        >
          {emoji}
        </div>
      ) : (
        <Avatar className="size-12 shrink-0 ring-2 ring-background">
          <AvatarImage src={imageSrc} alt={profile.name} />
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-medium text-sm">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="font-medium text-sm truncate max-w-full text-center px-1">{profile.name}</span>
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <span>{skillOpt?.emoji}</span>
        <span className="truncate max-w-[72px]">{skillOpt?.label}</span>
      </span>
      {workOpt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span>{workOpt.emoji}</span>
          <span className="truncate max-w-[72px]">{workOpt.label}</span>
        </span>
      )}
    </motion.div>
  )
}

function PairingPageContent() {
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
  const previousPhase = usePreviousPhase(eventPhase)
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarMode, setAvatarMode] = useState<"upload" | "url" | "emoji">("emoji")
  const [skillLevel, setSkillLevel] = useState<Profile["skill_level"]>("just_starting")
  const [workLocation, setWorkLocation] = useState<Profile["work_location"]>("in_office")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProceeding, setIsProceeding] = useState(false)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [storedPairs, setStoredPairs] = useState<{ profileIds: string[] }[]>([])

  const loadStoredPairs = useCallback(async () => {
    const pairs = await fetchPairs()
    setStoredPairs(pairs)
  }, [])

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
    getEventPhase().then((phase) => {
      setEventPhaseState(phase)
      if (phase !== "profiles") loadStoredPairs()
    })
    const stored = typeof window !== "undefined" ? localStorage.getItem(MY_PROFILE_ID_KEY) : null
    if (stored) setMyProfileId(stored)
  }, [loadProfiles, loadStoredPairs])

  // When we have myProfileId and profiles loaded, populate form for edit mode (once)
  const hasInitializedEdit = useRef(false)
  useEffect(() => {
    if (!myProfileId || profiles.length === 0 || hasInitializedEdit.current) return
    const myProfile = profiles.find((p) => p.id === myProfileId)
    if (myProfile) {
      hasInitializedEdit.current = true
      setName(myProfile.name)
      setAvatarUrl(myProfile.avatar_url)
      setSkillLevel(myProfile.skill_level)
      setWorkLocation(myProfile.work_location ?? "in_office")
      if (myProfile.avatar_url?.startsWith("emoji:")) {
        setAvatarMode("emoji")
      } else if (myProfile.avatar_url?.startsWith("data:")) {
        setAvatarMode("upload")
      } else if (myProfile.avatar_url?.startsWith("http")) {
        setAvatarMode("url")
      }
    }
  }, [myProfileId, profiles])

  useEffect(() => {
    if (useLocalStorage) return
    const channel = supabase
      .channel("pairing-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadProfiles)
      .on("postgres_changes", { event: "*", schema: "public", table: "pairs" }, loadStoredPairs)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [useLocalStorage, loadProfiles, loadStoredPairs])

  useEffect(() => {
    const unsub = subscribeToEventPhase(setEventPhaseState)
    return unsub
  }, [])

  const saveToStorage = (items: Profile[]) => {
    if (useLocalStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }

  // When my profile was deleted by admin, reset so user can create again
  useEffect(() => {
    if (!myProfileId || isLoading || profiles.length === 0) return
    const found = profiles.some((p) => p.id === myProfileId)
    if (!found) {
      setMyProfileId(null)
      hasInitializedEdit.current = false
      localStorage.removeItem(MY_PROFILE_ID_KEY)
      setName("")
      setAvatarUrl(null)
      setSkillLevel("just_starting")
      setAvatarMode("emoji")
    }
  }, [myProfileId, profiles, isLoading])

  const handleDeleteProfile = async (profileId: string) => {
    const wasMyProfile = profileId === myProfileId
    if (useLocalStorage) {
      const updated = profiles.filter((p) => p.id !== profileId)
      setProfiles(updated)
      saveToStorage(updated)
      if (wasMyProfile) {
        setMyProfileId(null)
        hasInitializedEdit.current = false
        localStorage.removeItem(MY_PROFILE_ID_KEY)
        setName("")
        setAvatarUrl(null)
        setSkillLevel("just_starting")
        setAvatarMode("emoji")
      }
    } else {
      const { error } = await supabase.from("profiles").delete().eq("id", profileId)
      if (!error) {
        setProfiles(profiles.filter((p) => p.id !== profileId))
        if (wasMyProfile) {
          setMyProfileId(null)
          hasInitializedEdit.current = false
          localStorage.removeItem(MY_PROFILE_ID_KEY)
          setName("")
          setAvatarUrl(null)
          setSkillLevel("just_starting")
          setAvatarMode("emoji")
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    const trimmedName = name.trim()
    const duplicateProfile = profiles.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== myProfileId
    )
    if (duplicateProfile) {
      setError("That name is already taken. Try adding your last initial!")
      return
    }

    setIsSubmitting(true)
    try {
      const avatarValue = avatarUrl || null
      const profileData: Omit<Profile, "id" | "created_at"> = {
        name: trimmedName,
        avatar_url: avatarValue,
        skill_level: skillLevel,
        work_location: workLocation,
      }

      if (myProfileId) {
        // Update existing profile
        if (useLocalStorage) {
          const updated = profiles.map((p) =>
            p.id === myProfileId
              ? { ...p, ...profileData }
              : p
          )
          setProfiles(updated)
          saveToStorage(updated)
        } else {
          const { error } = await supabase
            .from("profiles")
            .update(profileData as never)
            .eq("id", myProfileId)
          if (error) throw error
          loadProfiles()
        }
      } else {
        // Create new profile (one per user)
        if (useLocalStorage) {
          const profile: Profile = {
            ...profileData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
          const updated = [profile, ...profiles]
          setProfiles(updated)
          saveToStorage(updated)
          setMyProfileId(profile.id)
          localStorage.setItem(MY_PROFILE_ID_KEY, profile.id)
        } else {
          const { data, error } = await supabase
            .from("profiles")
            .insert(profileData as never)
            .select()
            .single()
          if (error) throw error
          if (data) {
            const created = data as Profile
            setProfiles([created, ...profiles])
            setMyProfileId(created.id)
            localStorage.setItem(MY_PROFILE_ID_KEY, created.id)
          }
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to save"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdminCreatePairs = async () => {
    setIsProceeding(true)
    try {
      const computed = pairProfiles(profiles)
      await savePairs(computed)
      setStoredPairs(computed)
      await setEventPhase("pairings")
      setEventPhaseState("pairings")
    } finally {
      setIsProceeding(false)
    }
  }

  const handlePairLateJoiners = async () => {
    setIsProceeding(true)
    try {
      const newPairs = pairLateJoiners(profiles, storedPairs)
      if (newPairs.length === 0) return
      await appendPairs(newPairs)
      setStoredPairs((prev) => [...prev, ...newPairs])
    } finally {
      setIsProceeding(false)
    }
  }

  const phaseComplete = eventPhase !== "profiles"
  const showAdminButton = isAdmin && profiles.length >= 2 && eventPhase === "profiles"
  const pairs = storedPairs
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const pairedIds = new Set(storedPairs.flatMap((p) => p.profileIds))
  const unpairedProfiles = profiles.filter((p) => !pairedIds.has(p.id))
  const showLateJoinerButton = isAdmin && phaseComplete && unpairedProfiles.length >= 2
  const myProfileIsUnpaired = myProfileId ? !pairedIds.has(myProfileId) : false
  const profileLocked = phaseComplete && !!myProfileId
  const myProfile = myProfileId ? profileMap.get(myProfileId) ?? profiles.find((p) => p.id === myProfileId) : null

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <PhaseTransitionOverlay previousPhase={previousPhase} currentPhase={eventPhase} isAdmin={isAdmin} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pairing</span>
          </div>
          <h1 className="font-display font-thin text-[55px] tracking-tight mb-4">
            who are you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Add your name, pick an avatar, and choose your vibe coding level. Everyone will see who&apos;s here in real time!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Profile form + Groups when created */}
          <div className="space-y-8">
            {/* Profile form or locked profile */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {profileLocked && myProfile ? (
                <Card className="border border-primary/30 bg-primary/5 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 relative">
                      <Lock className="w-5 h-5 text-primary" />
                      Your profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const emoji = getEmojiFromAvatar(myProfile.avatar_url)
                        const emojiBg = getEmojiBgFromAvatar(myProfile.avatar_url)
                        const imageSrc =
                          myProfile.avatar_url && !isEmojiAvatar(myProfile.avatar_url)
                            ? myProfile.avatar_url
                            : undefined
                        return emoji ? (
                          <div
                            className={cn(
                              "flex size-16 shrink-0 items-center justify-center rounded-full text-3xl ring-2 ring-background",
                              !emojiBg && "bg-primary/10"
                            )}
                            style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
                          >
                            {emoji}
                          </div>
                        ) : (
                          <Avatar className="size-16 shrink-0 ring-2 ring-background">
                            <AvatarImage src={imageSrc} alt={myProfile.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-medium text-lg">
                              {myProfile.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )
                      })()}
                      <div>
                        <p className="text-lg font-semibold">{myProfile.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{SKILL_OPTIONS.find((o) => o.value === myProfile.skill_level)?.emoji} {SKILL_OPTIONS.find((o) => o.value === myProfile.skill_level)?.label}</span>
                          <span>{WORK_LOCATION_OPTIONS.find((o) => o.value === (myProfile.work_location ?? "in_office"))?.emoji} {WORK_LOCATION_OPTIONS.find((o) => o.value === (myProfile.work_location ?? "in_office"))?.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Pairings have been created — your profile is locked.</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border bg-card overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 relative">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {myProfileId ? "Edit your profile" : "Create profile"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <ProfileAvatar
                        value={avatarUrl}
                        onChange={setAvatarUrl}
                        name={name}
                        avatarMode={avatarMode}
                        onModeChange={setAvatarMode}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="pairing-name">Your name *</Label>
                        <Input
                          id="pairing-name"
                          placeholder="e.g. Maria, John..."
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-secondary/50"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Where are you working?</Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {WORK_LOCATION_OPTIONS.map((opt) => (
                            <motion.button
                              key={opt.value}
                              type="button"
                              onClick={() => setWorkLocation(opt.value)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all ${
                                workLocation === opt.value
                                  ? "border-primary bg-primary/15 shadow-lg shadow-primary/10"
                                  : "border-border bg-secondary/30 hover:border-primary/40"
                              }`}
                            >
                              <span className="text-4xl">{opt.emoji}</span>
                              <span className="font-semibold text-sm">{opt.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          What&apos;s your vibe coding proficiency level?
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {SKILL_OPTIONS.map((opt) => (
                            <motion.button
                              key={opt.value}
                              type="button"
                              onClick={() => setSkillLevel(opt.value)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all ${
                                skillLevel === opt.value
                                  ? "border-primary bg-primary/15 shadow-lg shadow-primary/10"
                                  : "border-border bg-secondary/30 hover:border-primary/40"
                              }`}
                            >
                              <span className="text-4xl">{opt.emoji}</span>
                              <span className="font-semibold text-sm">{opt.label}</span>
                              <span className="text-xs text-muted-foreground">{opt.description}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {error && <p className="text-sm text-destructive">{error}</p>}

                      <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : myProfileId ? (
                          <>
                            <Pencil className="w-4 h-4 mr-2" />
                            Update profile
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create profile
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Groups - below profile when admin creates them */}
            {phaseComplete && pairs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <PartyPopper className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Groups created</h3>
                </div>
                <div className="space-y-3">
                  {pairs.map((pair, index) => {
                    const pairProfilesList = pair.profileIds
                      .map((id) => profileMap.get(id))
                      .filter(Boolean) as Profile[]
                    const names = pairProfilesList.map((p) => p.name)
                    const pairLabel =
                      names.length === 1
                        ? names[0]
                        : names.length === 2
                          ? `${names[0]} with ${names[1]}`
                          : `${names[0]}, ${names[1]} & ${names[2]}`
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex -space-x-2">
                          {pairProfilesList.map((p) => {
                            const emoji = getEmojiFromAvatar(p.avatar_url)
                            const emojiBg = getEmojiBgFromAvatar(p.avatar_url)
                            const imageSrc =
                              p.avatar_url && !isEmojiAvatar(p.avatar_url)
                                ? p.avatar_url
                                : undefined
                            return emoji ? (
                              <div
                                key={p.id}
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border text-lg",
                                  !emojiBg && "bg-card"
                                )}
                                style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
                              >
                                {emoji}
                              </div>
                            ) : (
                              <Avatar
                                key={p.id}
                                className="size-10 border-2 border-border"
                              >
                                <AvatarImage src={imageSrc} alt={p.name} />
                                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })}
                        </div>
                        <span className="font-medium text-sm flex-1 min-w-0">{pairLabel}</span>
                        {pairProfilesList.length > 0 && (() => {
                          const workOpt = WORK_LOCATION_OPTIONS.find(
                            (o) => o.value === (pairProfilesList[0].work_location ?? "in_office")
                          )
                          return workOpt ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                              <span>{workOpt.emoji}</span>
                              <span>{workOpt.label}</span>
                            </span>
                          ) : null
                        })()}
                      </motion.div>
                    )
                  })}
                </div>
                <div className="mt-6">
                  <Link href="/teams">
                    <Button size="lg" className="w-full group">
                      Go to Teams — name & pick challenges
                      <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Admin: Pair late joiners */}
            {showLateJoinerButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Late joiners
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {unpairedProfiles.length} unpaired player{unpairedProfiles.length !== 1 ? "s" : ""} can be paired now.
                </p>
                <Button
                  onClick={handlePairLateJoiners}
                  disabled={isProceeding}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {isProceeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Pairing late joiners...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Pair Late Joiners ({unpairedProfiles.length})
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Info for unpaired non-admin players */}
            {!isAdmin && phaseComplete && myProfileIsUnpaired && myProfileId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"
              >
                <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                  You&apos;re not paired yet — the host can add you in the next round.
                </p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Who's here live */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users2 className="w-6 h-6 text-primary" />
                Who&apos;s here ({profiles.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-8 rounded-xl border-2 border-dashed border-border"
              >
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nobody yet</h3>
                <p className="text-muted-foreground text-sm">
                  Be the first to join — create your profile on the left!
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {profiles.map((profile) => (
                    <MiniProfile
                      key={profile.id}
                      profile={profile}
                      isAdmin={isAdmin}
                      canDelete={!phaseComplete}
                      onDelete={handleDeleteProfile}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Admin: Create pairs button */}
            {showAdminButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Admin controls
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Everyone is in. Click to create pairs (high + low skill) — they will appear in the left column.
                </p>
                <Button
                  onClick={handleAdminCreatePairs}
                  disabled={isProceeding}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {isProceeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating pairs...
                    </>
                  ) : (
                    <>
                      <Users2 className="w-4 h-4 mr-2" />
                      Create Pairs
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {profiles.length >= 2 && !phaseComplete && !showAdminButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-border"
              >
                <p className="text-center text-sm text-muted-foreground">
                  {myProfileId
                    ? "Waiting for the host to create pairs. You can edit your profile on the left."
                    : "Waiting for the host to create pairs. Create your profile on the left!"}
                </p>
              </motion.div>
            )}

            {useLocalStorage && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <p className="text-yellow-500">
                  Demo mode (localStorage). Configure Supabase for real-time updates.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function PairingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PairingPageContent />
    </Suspense>
  )
}
