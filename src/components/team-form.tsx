"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Loader2 } from "lucide-react"
import { Team } from "@/types/database"
import { Profile } from "@/types/database"
import { ProfileAvatar, getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import { IdeaGenerator } from "@/components/idea-generator"
import { cn } from "@/lib/utils"

interface TeamFormProps {
  onSubmit: (team: Omit<Team, 'id' | 'created_at'>) => Promise<void>
  selectedIdea: string | null
  onSelectIdea: (idea: string) => void
  /** When set, members are read-only (from pairing) - no add/remove */
  initialMemberProfiles?: Profile[]
}

export function TeamForm({ onSubmit, selectedIdea, onSelectIdea, initialMemberProfiles }: TeamFormProps) {
  const membersLocked = !!initialMemberProfiles?.length
  const [teamName, setTeamName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarMode, setAvatarMode] = useState<"upload" | "url" | "emoji">("emoji")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }

    const memberNames = membersLocked
      ? (initialMemberProfiles!.map((p) => p.name) as string[])
      : []
    if (memberNames.length === 0) {
      setError("Please add at least one team member")
      return
    }

    if (!selectedIdea) {
      setError("Please select a project idea first")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name: teamName.trim(),
        avatar_url: avatarUrl,
        members: memberNames,
        selected_idea: selectedIdea,
      })
      // Reset form
      setTeamName("")
      setAvatarUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Create Your Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Avatar - same as Profile: upload, URL, or emoji */}
          <div className="space-y-2">
            <Label>Team Avatar (optional)</Label>
            <ProfileAvatar
              value={avatarUrl}
              onChange={setAvatarUrl}
              name={teamName || "Team"}
              avatarMode={avatarMode}
              onModeChange={setAvatarMode}
            />
          </div>

          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              placeholder="Enter a creative team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          {/* Team Members - read-only from pairing */}
          {membersLocked && initialMemberProfiles && (
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {initialMemberProfiles.map((profile) => {
                  const emoji = getEmojiFromAvatar(profile.avatar_url)
                  const emojiBg = getEmojiBgFromAvatar(profile.avatar_url)
                  const imageSrc =
                    profile.avatar_url && !isEmojiAvatar(profile.avatar_url)
                      ? profile.avatar_url
                      : undefined
                  return (
                    <div
                      key={profile.id}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/60 bg-card/80 min-w-[80px]"
                    >
                      {emoji ? (
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full text-xl ring-2 ring-background",
                            !emojiBg && "bg-primary/10"
                          )}
                          style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
                        >
                          {emoji}
                        </div>
                      ) : (
                        <Avatar className="size-10 shrink-0 ring-2 ring-background">
                          <AvatarImage src={imageSrc} alt={profile.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-medium text-xs">
                            {profile.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium text-sm truncate max-w-full text-center">
                        {profile.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Idea Generator - Random + Pick from ideas */}
          <IdeaGenerator
            onSelectIdea={onSelectIdea}
            selectedIdea={selectedIdea}
          />

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !teamName.trim() ||
              (membersLocked ? !initialMemberProfiles?.length : false) ||
              !selectedIdea
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Team...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Create Team
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
