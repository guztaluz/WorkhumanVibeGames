"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ArrowRight, Shuffle, Trophy, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Profile } from "@/types/database"
import { Team } from "@/types/database"
import { getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { pairProfiles } from "@/lib/pairing"
import { PROJECT_IDEAS } from "@/lib/project-ideas"

const PROFILES_STORAGE_KEY = "vibe-games-profiles"
const TEAMS_STORAGE_KEY = "vibe-games-teams"

function formatIdea(idea: (typeof PROJECT_IDEAS)[0]) {
  return `${idea.title}: ${idea.description}`
}

export default function PairingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [teamNames, setTeamNames] = useState<Record<number, string>>({})
  const [teamIdeas, setTeamIdeas] = useState<Record<number, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pairs = pairProfiles(profiles)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profilesRes, teamsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("teams").select("*").order("created_at", { ascending: false }),
      ])

      if (profilesRes.error) throw profilesRes.error
      if (teamsRes.error) throw teamsRes.error

      setProfiles((profilesRes.data as Profile[]) || [])
      setTeams((teamsRes.data as Team[]) || [])
      setUseLocalStorage(false)
    } catch {
      setUseLocalStorage(true)
      const storedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY)
      const storedTeams = localStorage.getItem(TEAMS_STORAGE_KEY)
      setProfiles(storedProfiles ? JSON.parse(storedProfiles) : [])
      setTeams(storedTeams ? JSON.parse(storedTeams) : [])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamNameChange = (pairIndex: number, value: string) => {
    setTeamNames((prev) => ({ ...prev, [pairIndex]: value }))
  }

  const handleTeamIdeaChange = (pairIndex: number, value: string) => {
    setTeamIdeas((prev) => ({ ...prev, [pairIndex]: value }))
  }

  const handleRandomIdea = (pairIndex: number) => {
    const idea = PROJECT_IDEAS[Math.floor(Math.random() * PROJECT_IDEAS.length)]
    handleTeamIdeaChange(pairIndex, formatIdea(idea))
  }

  const allTeamsComplete = pairs.every(
    (_, i) => teamNames[i]?.trim() && teamIdeas[i]
  )

  const handleSaveAll = async () => {
    if (!allTeamsComplete) {
      setError("Please fill in team name and select an idea for each team")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newTeams: Omit<Team, "id" | "created_at">[] = pairs.map((pair, i) => {
        const memberNames = pair.profileIds
          .map((id) => profileMap.get(id)?.name)
          .filter(Boolean) as string[]
        return {
          name: teamNames[i].trim(),
          avatar_url: null,
          members: memberNames,
          member_ids: pair.profileIds,
          selected_idea: teamIdeas[i],
        }
      })

      if (useLocalStorage) {
        const created: Team[] = newTeams.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        }))
        const updated = [...created, ...teams]
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated))
        setTeams(updated)
      } else {
        const { data, error } = await supabase
          .from("teams")
          .insert(newTeams as never[])
          .select()

        if (error) throw error
        if (data) setTeams([...(data as Team[]), ...teams])
      }

      setTeamNames({})
      setTeamIdeas({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save teams")
    } finally {
      setIsSaving(false)
    }
  }

  if (profiles.length < 2 && !isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <Card className="card-minimal border-2 border-dashed border-border">
            <CardContent className="py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Need more profiles</h2>
              <p className="text-muted-foreground mb-6">
                Add at least 2 profiles before creating teams.
              </p>
              <Link href="/teams/profiles">
                <Button>Go to Profiles</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Step 2</span>
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">
            Create Teams
          </h1>
          <p className="text-lg text-muted-foreground">
            Name your team and pick a project challenge. Teams are paired by skill level.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {pairs.map((pair, index) => {
              const pairProfiles = pair.profileIds
                .map((id) => profileMap.get(id))
                .filter(Boolean) as Profile[]
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-minimal border border-border bg-card">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {pairProfiles.map((p) => {
                            const emoji = getEmojiFromAvatar(p.avatar_url)
                            const emojiBg = getEmojiBgFromAvatar(p.avatar_url)
                            const imageSrc =
                              p.avatar_url &&
                              !isEmojiAvatar(p.avatar_url)
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
                                className="w-10 h-10 border-2 border-border"
                              >
                                <AvatarImage src={imageSrc} alt={p.name} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {pairProfiles.map((p) => p.name).join(" & ")}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`team-name-${index}`}>Team name</Label>
                        <Input
                          id={`team-name-${index}`}
                          placeholder="e.g. Vibe Coders"
                          value={teamNames[index] ?? ""}
                          onChange={(e) =>
                            handleTeamNameChange(index, e.target.value)
                          }
                          className="bg-secondary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Project challenge</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRandomIdea(index)}
                          >
                            <Shuffle className="w-4 h-4 mr-1" />
                            Random
                          </Button>
                        </div>
                        <select
                          value={teamIdeas[index] ?? ""}
                          onChange={(e) =>
                            handleTeamIdeaChange(index, e.target.value)
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Select a challenge...</option>
                          {PROJECT_IDEAS.map((idea) => {
                            const full = formatIdea(idea)
                            return (
                              <option key={idea.id} value={full}>
                                {idea.title}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSaveAll}
                disabled={!allTeamsComplete || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save All Teams"
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {teams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-border"
              >
                <Link href="/voting">
                  <Button size="lg" className="w-full group">
                    Proceed to Voting
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Ready to present and vote on projects!
                </p>
              </motion.div>
            )}

            {useLocalStorage && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <p className="text-yellow-500">
                  Running in demo mode (localStorage). Configure Supabase for full functionality.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
