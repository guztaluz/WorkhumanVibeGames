"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { TeamForm } from "@/components/team-form"
import { TeamCard } from "@/components/team-card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Trophy, RefreshCw, Lock, Loader2, PartyPopper } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Team, Profile, CreateTeamSafeResult } from "@/types/database"
import { supabase } from "@/lib/supabase"
import { setEventPhase, getEventPhase, subscribeToEventPhase } from "@/lib/event-state"
import { getAdminMode, subscribeToAdminMode } from "@/lib/admin-state"
import { pairProfiles } from "@/lib/pairing"

const ADMIN_CODE = "vibegames2024"
const PROFILES_STORAGE_KEY = "vibe-games-profiles"
const MY_PROFILE_ID_KEY = "vibe-games-my-profile-id"

function TeamsPageContent() {
  const searchParams = useSearchParams()
  const [adminFromToggle, setAdminFromToggle] = useState(false)
  useEffect(() => {
    setAdminFromToggle(getAdminMode())
    const unsub = subscribeToAdminMode(setAdminFromToggle)
    return unsub
  }, [])
  const isAdmin = searchParams.get("admin") === ADMIN_CODE || adminFromToggle
  const [teams, setTeams] = useState<Team[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [eventPhase, setEventPhaseState] = useState<string>("profiles")
  const [isUnlockingVoting, setIsUnlockingVoting] = useState(false)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [partnerCreatedNotice, setPartnerCreatedNotice] = useState(false)

  const loadProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setProfiles((data as Profile[]) || [])
    } catch {
      const stored = localStorage.getItem(PROFILES_STORAGE_KEY)
      setProfiles(stored ? JSON.parse(stored) : [])
    }
  }, [])

  useEffect(() => {
    loadTeams()

    // Real-time subscription: when any team is created/updated/deleted,
    // reload teams so the UI updates instantly (e.g. partner creates the team)
    const channel = supabase
      .channel("teams-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          loadTeams()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    getEventPhase().then(setEventPhaseState)
    const unsub = subscribeToEventPhase(setEventPhaseState)
    return unsub
  }, [])

  useEffect(() => {
    if (eventPhase === "pairings" || eventPhase === "voting") {
      loadProfiles()
    }
  }, [eventPhase, loadProfiles])

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(MY_PROFILE_ID_KEY) : null
    if (stored) setMyProfileId(stored)
  }, [])

  const loadTeams = async () => {
    setIsLoading(true)
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
      setUseLocalStorage(false)
    } catch {
      // Fallback to localStorage if Supabase is not configured
      console.log('Using localStorage fallback')
      setUseLocalStorage(true)
      const stored = localStorage.getItem('vibe-games-teams')
      if (stored) {
        setTeams(JSON.parse(stored))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: Omit<Team, 'id' | 'created_at'>) => {
    if (useLocalStorage) {
      // localStorage fallback
      const newTeam: Team = {
        ...teamData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      const updatedTeams = [newTeam, ...teams]
      setTeams(updatedTeams)
      localStorage.setItem('vibe-games-teams', JSON.stringify(updatedTeams))
      setSelectedIdea(null)
    } else {
      // Use the safe RPC function that prevents duplicate teams for paired members
      // Cast needed because the Database type lacks full GenericSchema compliance (no Relationships/Views)
      const { data, error } = await supabase
        .rpc('create_team_safe' as never, {
          p_name: teamData.name,
          p_avatar_url: teamData.avatar_url,
          p_members: teamData.members,
          p_selected_idea: teamData.selected_idea,
        } as never) as unknown as { data: CreateTeamSafeResult | null; error: Error | null }

      if (error) throw error

      if (data && data.success) {
        // Team created successfully
        setTeams([data.team as Team, ...teams])
        setSelectedIdea(null)
      } else if (data && !data.success && data.reason === 'member_already_in_team') {
        // Partner already created the team — show friendly notice and refresh teams
        setPartnerCreatedNotice(true)
        await loadTeams()
        setSelectedIdea(null)
      }
    }
  }

  const handleUnlockVoting = async () => {
    setIsUnlockingVoting(true)
    try {
      await setEventPhase("voting")
      setEventPhaseState("voting")
    } finally {
      setIsUnlockingVoting(false)
    }
  }

  const showAdminUnlockVoting = isAdmin && eventPhase !== "voting"

  const pairs = (eventPhase === "pairings" || eventPhase === "voting") ? pairProfiles(profiles) : []
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const myPair = myProfileId ? pairs.find((p) => p.profileIds.includes(myProfileId)) : null
  const myPairMemberProfiles = myPair
    ? myPair.profileIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile => !!p)
    : []
  const myPairMemberNames = myPairMemberProfiles.map((p) => p.name)

  const myPairTeam = teams.find((team) => {
    if (myPairMemberNames.length === 0) return false
    const teamMemberSet = new Set(team.members)
    return myPairMemberNames.every((name) => teamMemberSet.has(name))
  })

  const isPhaseLocked = eventPhase === "profiles"
  const showCreateForm = !isPhaseLocked && !myPairTeam

  if (isPhaseLocked) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-border bg-card p-12"
          >
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Teams will be available soon</h2>
            <p className="text-muted-foreground mb-6">
              Teams will be available after the host creates pairs. Head to Pairing to create your profile!
            </p>
            <Link href="/pairing">
              <Button size="lg">Go to Pairing</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Teams</span>
          </div>
          <h1 className="font-display font-thin text-[55px] tracking-tight mb-4">Create Your Team</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Form your squad, pick a ridiculous project idea, and get ready to vibe code your way to victory!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form & Idea Generator */}
          <div className="space-y-8">
            {/* Notice: partner already created the team */}
            {partnerCreatedNotice && myPairTeam && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3"
              >
                <PartyPopper className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Your partner already set up the team!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Great minds think alike. Your team is ready to go.
                  </p>
                </div>
              </motion.div>
            )}

            {myPairTeam ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
              >
                <h3 className="font-semibold mb-2">Your team</h3>
                <TeamCard team={myPairTeam} index={0} profiles={profiles} />
              </motion.div>
            ) : showCreateForm ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <TeamForm
                  onSubmit={handleCreateTeam}
                  selectedIdea={selectedIdea}
                  onSelectIdea={setSelectedIdea}
                  initialMemberProfiles={myPairMemberProfiles.length > 0 ? myPairMemberProfiles : undefined}
                />
              </motion.div>
            ) : null}
          </div>

          {/* Right Column - Created Teams */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Teams ({teams.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={loadTeams}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-secondary/30 animate-pulse"
                  />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-8 rounded-xl border-2 border-dashed border-border"
              >
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                <p className="text-muted-foreground text-sm">
                  Create the first team to get the games started!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <TeamCard key={team.id} team={team} index={index} profiles={profiles} />
                ))}
              </div>
            )}

            {/* Admin: Unlock Voting */}
            {showAdminUnlockVoting && (
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
                  Unlock Voting so participants can vote on team projects.
                </p>
                <Button
                  onClick={handleUnlockVoting}
                  disabled={isUnlockingVoting}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {isUnlockingVoting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock Voting
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Proceed to Voting CTA */}
            {teams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-border"
              >
                <Link href="/voting">
                  <Button size="lg" className="w-full group">
                    Proceed to Voting
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Ready to present and vote on projects!
                </p>
              </motion.div>
            )}

            {/* Local Storage Notice */}
            {useLocalStorage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm"
              >
                <p className="text-yellow-500">
                  Running in demo mode (localStorage). Configure Supabase for full functionality.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <TeamsPageContent />
    </Suspense>
  )
}
