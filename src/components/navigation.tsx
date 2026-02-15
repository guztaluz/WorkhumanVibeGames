"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Users, UserPlus, Trophy, Crown, Settings2, Trash2, UsersRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { isVotingFinished } from "@/lib/voting-state"
import { getEventPhase, subscribeToEventPhase, type EventPhase } from "@/lib/event-state"
import { getAdminMode, setAdminMode, subscribeToAdminMode } from "@/lib/admin-state"
import { resetVoting } from "@/lib/voting-state"

const baseNavItems = [
  { href: "/", label: "Welcome", icon: Sparkles, step: 1 },
  { href: "/pairing", label: "Pairing", icon: UserPlus, step: 2 },
  { href: "/teams", label: "Teams", icon: Users, step: 3 },
  { href: "/voting", label: "Voting", icon: Trophy, step: 4 },
]

const resultsNavItem = { href: "/results", label: "Results", icon: Crown, step: 5 }

export function Navigation() {
  const pathname = usePathname()
  const [showResults, setShowResults] = useState(false)
  const [eventPhase, setEventPhase] = useState<EventPhase>("profiles")
  const [adminMode, setAdminModeState] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const adminDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAdminModeState(getAdminMode())
    const unsub = subscribeToAdminMode(setAdminModeState)
    return unsub
  }, [])

  useEffect(() => {
    if (!adminDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [adminDropdownOpen])

  const handleAdminToggle = () => {
    if (adminMode) {
      setAdminMode(false)
      window.location.reload()
    } else {
      setAdminMode(true)
      setAdminModeState(true)
    }
  }

  const handleResetAllData = async () => {
    if (!confirm("Reset all site data? This cannot be undone.")) return
    const keys = [
      "vibe-games-profiles",
      "vibe-games-teams",
      "vibe-games-votes",
      "vibe-games-event-phase",
      "vibe-games-my-profile-id",
      "vibe-games-voter-name",
      "vibe-games-voting-finished",
    ]
    keys.forEach((k) => localStorage.removeItem(k))
    try {
      const { supabase } = await import("@/lib/supabase")
      const { setEventPhase } = await import("@/lib/event-state")
      await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await setEventPhase("profiles")
    } catch {
      // Supabase may not be configured - still reset localStorage
      localStorage.setItem("vibe-games-event-phase", "profiles")
    }
    resetVoting()
    alert("All data has been reset.")
    window.location.href = "/"
  }

  const FAKE_NAMES = [
    "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Riley", "Casey", "Avery",
    "Quinn", "Parker", "Blake", "Dakota", "Skyler", "Reese", "Jamie", "Cameron",
    "Finley", "Rowan", "Sage", "Phoenix",
  ]

  const FAKE_EMOJIS = ["✨", "🚀", "💻", "🎨", "🎯", "🔥", "⚡", "🌟", "💡", "🎪", "🦄", "🌈", "🐱", "🦊", "🐼", "🦋", "🍀", "🌻", "🎸", "🏀"]

  const FAKE_SKILLS = ["just_starting", "getting_hang", "master"] as const

  const handleAddFakeProfiles = async () => {
    const fakeProfiles = FAKE_NAMES.map((name, i) => ({
      id: crypto.randomUUID(),
      name,
      avatar_url: `emoji:${FAKE_EMOJIS[i % FAKE_EMOJIS.length]}`,
      skill_level: FAKE_SKILLS[i % 3],
      created_at: new Date().toISOString(),
    }))
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase")
      if (isSupabaseConfigured()) {
        const rows = fakeProfiles.map((p) => ({
          name: p.name,
          avatar_url: p.avatar_url,
          skill_level: p.skill_level,
        }))
        const { error } = await supabase.from("profiles").insert(rows as never)
        if (error) throw error
      } else {
        const stored = localStorage.getItem("vibe-games-profiles")
        const existing = stored ? JSON.parse(stored) : []
        localStorage.setItem("vibe-games-profiles", JSON.stringify([...fakeProfiles, ...existing]))
      }
      setAdminDropdownOpen(false)
      alert(`Added ${fakeProfiles.length} fake profiles. Refreshing…`)
      window.location.reload()
    } catch (e) {
      console.error(e)
      const stored = localStorage.getItem("vibe-games-profiles")
      const existing = stored ? JSON.parse(stored) : []
      localStorage.setItem("vibe-games-profiles", JSON.stringify([...fakeProfiles, ...existing]))
      setAdminDropdownOpen(false)
      alert(`Added ${fakeProfiles.length} fake profiles. Refreshing…`)
      window.location.reload()
    }
  }

  const FAKE_TEAM_NAMES = [
    "Vibe Tribe", "Code Crushers", "Squad Goals", "Byte Squad", "Pixel Pioneers",
    "Debug Dynasty", "Flow Masters", "Syntax Kings", "Logic Legion", "Stack Overflowers",
  ]

  const FAKE_TEAM_EMOJIS = ["🚀", "⚡", "🎯", "🔥", "💻", "✨", "🌟", "🎨", "🏆", "🎪"]

  const handleAddFakeTeams = async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabase")
      const { pairProfiles } = await import("@/lib/pairing")
      const { PROJECT_IDEAS } = await import("@/lib/project-ideas")

      let profiles: { id: string; name: string }[]
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from("profiles").select("id, name")
        if (error) throw error
        profiles = (data as { id: string; name: string }[]) || []
      } else {
        const stored = localStorage.getItem("vibe-games-profiles")
        profiles = stored ? JSON.parse(stored) : []
      }

      if (profiles.length < 2) {
        alert("Add fake profiles first (Add 20 fake profiles), then try again.")
        return
      }

      const pairs = pairProfiles(profiles as never)
      const profileMap = new Map(profiles.map((p) => [p.id, p]))

      const teamsToCreate = pairs.map((pair, i) => {
        const memberNames = pair.profileIds
          .map((id) => profileMap.get(id)?.name)
          .filter(Boolean) as string[]
        const idea = PROJECT_IDEAS[i % PROJECT_IDEAS.length]
        const selectedIdea = `${idea.title}: ${idea.description}`
        return {
          name: FAKE_TEAM_NAMES[i % FAKE_TEAM_NAMES.length],
          avatar_url: `emoji:${FAKE_TEAM_EMOJIS[i % FAKE_TEAM_EMOJIS.length]}`,
          members: memberNames,
          selected_idea: selectedIdea,
        }
      })

      if (isSupabaseConfigured()) {
        const { error } = await supabase.from("teams").insert(teamsToCreate as never)
        if (error) throw error
      } else {
        const stored = localStorage.getItem("vibe-games-teams")
        const existing = stored ? JSON.parse(stored) : []
        const newTeams = teamsToCreate.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        }))
        localStorage.setItem("vibe-games-teams", JSON.stringify([...newTeams, ...existing]))
      }

      const { setEventPhase } = await import("@/lib/event-state")
      await setEventPhase("pairings")
      setAdminDropdownOpen(false)
      alert(`Added ${teamsToCreate.length} fake teams. Unlock Voting on the Teams page to test. Refreshing…`)
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert("Failed to add fake teams. Make sure you have profiles (add fake profiles first).")
    }
  }

  useEffect(() => {
    setShowResults(isVotingFinished())
    const handleVotingStateChange = (e: CustomEvent<{ finished: boolean }>) => {
      setShowResults(e.detail.finished)
    }
    window.addEventListener('voting-state-changed', handleVotingStateChange as EventListener)
    return () => {
      window.removeEventListener('voting-state-changed', handleVotingStateChange as EventListener)
    }
  }, [])

  useEffect(() => {
    getEventPhase().then(setEventPhase)
    const unsub = subscribeToEventPhase(setEventPhase)
    return unsub
  }, [])

  const navItems = showResults ? [...baseNavItems, resultsNavItem] : baseNavItems

  const isTeamsDisabled = eventPhase === "profiles"
  const isVotingDisabled = eventPhase !== "voting"

  const getDisabledReason = (href: string) => {
    if (href === "/teams" && isTeamsDisabled) return "Complete pairing first"
    if (href === "/voting" && isVotingDisabled) return "Complete pairing and create teams first"
    return ""
  }

  return (
    <motion.nav
      role="navigation"
      aria-label="Main navigation"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] sm:max-w-none sm:w-fit glass rounded-2xl shadow-xl border border-white/10 px-2 py-2"
    >
      <div className="flex items-center h-10 relative">
          {/* Nav items - scroll horizontally on small screens to prevent overflow */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth flex-nowrap [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20">
            <AnimatePresence mode="popLayout">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const isResultsTab = item.href === "/results"
                const isDisabled =
                  (item.href === "/teams" && isTeamsDisabled) ||
                  (item.href === "/voting" && isVotingDisabled)

                const content = (
                  <motion.div
                    whileHover={!isDisabled ? { scale: 1.05 } : undefined}
                    whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      isResultsTab && !isActive && "text-yellow-500 hover:text-yellow-400",
                      isDisabled && "text-foreground/50 opacity-75 pointer-events-none"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isResultsTab && !isActive && !isDisabled && "text-yellow-500")} />
                    <span className="font-medium">{item.step}. {item.label}</span>

                    {isActive && !isDisabled && (
                      <motion.div
                        initial={false}
                        className={cn(
                          "absolute inset-0 rounded-lg -z-10",
                          isResultsTab ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "bg-primary"
                        )}
                      />
                    )}
                  </motion.div>
                )

                const label = `${item.step}. ${item.label}`
                const disabledReason = getDisabledReason(item.href)
                const disabledAriaLabel = disabledReason ? `${label}, ${disabledReason}` : label

                return (
                  <motion.div
                    key={item.href}
                    className="shrink-0"
                    initial={isResultsTab ? { opacity: 0, scale: 0.8, x: 20 } : false}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                  >
                    {isDisabled ? (
                      <span
                        role="link"
                        aria-disabled="true"
                        aria-label={disabledAriaLabel}
                        tabIndex={-1}
                        className="relative block cursor-not-allowed"
                      >
                        {content}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="relative"
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                      >
                        {content}
                      </Link>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Admin toggle - stays visible when nav scrolls */}
          <div ref={adminDropdownRef} className="ml-2 pl-2 border-l border-border shrink-0">
            <button
              type="button"
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors opacity-60 hover:opacity-100"
              aria-label="Admin settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {adminDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 py-2 min-w-[200px] rounded-lg border border-border bg-popover shadow-lg z-50"
              >
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">Admin mode</p>
                  <button
                    type="button"
                    onClick={handleAdminToggle}
                    className={cn(
                      "mt-2 w-full py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      adminMode
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {adminMode ? "On — Click to turn off & refresh" : "Off — Click to turn on"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false)
                    handleAddFakeProfiles()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add 20 fake profiles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false)
                    handleAddFakeTeams()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
                >
                  <UsersRound className="w-4 h-4" />
                  Add fake teams
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false)
                    handleResetAllData()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset all data
                </button>
              </motion.div>
            )}
          </div>
        </div>
    </motion.nav>
  )
}
