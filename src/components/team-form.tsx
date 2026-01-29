"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, X, Upload, Loader2 } from "lucide-react"
import { Team } from "@/types/database"

interface TeamFormProps {
  onSubmit: (team: Omit<Team, 'id' | 'created_at'>) => Promise<void>
  selectedIdea: string | null
}

export function TeamForm({ onSubmit, selectedIdea }: TeamFormProps) {
  const [teamName, setTeamName] = useState("")
  const [memberInput, setMemberInput] = useState("")
  const [members, setMembers] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddMember = () => {
    if (memberInput.trim() && !members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()])
      setMemberInput("")
    }
  }

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter(m => m !== member))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMember()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }

    if (members.length === 0) {
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
        avatar_url: avatarUrl || null,
        members,
        selected_idea: selectedIdea,
      })
      // Reset form
      setTeamName("")
      setMembers([])
      setAvatarUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team")
    } finally {
      setIsLoading(false)
    }
  }

  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TM'

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
          {/* Team Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={teamName || "Team"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <Label htmlFor="avatar" className="text-sm text-muted-foreground mb-2 block">
                Team Avatar (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="avatar"
                  type="url"
                  placeholder="Paste image URL..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" size="icon" disabled>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
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

          {/* Team Members */}
          <div className="space-y-2">
            <Label htmlFor="members">Team Members *</Label>
            <div className="flex gap-2">
              <Input
                id="members"
                placeholder="Add member name..."
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-grow bg-secondary/50"
              />
              <Button type="button" onClick={handleAddMember} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {members.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {members.map((member) => (
                  <motion.div
                    key={member}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 flex items-center gap-1"
                    >
                      {member}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Selected Idea Display */}
          {selectedIdea && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Selected Project Idea:</p>
              <p className="text-sm font-medium">{selectedIdea}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !teamName.trim() || members.length === 0 || !selectedIdea}
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
