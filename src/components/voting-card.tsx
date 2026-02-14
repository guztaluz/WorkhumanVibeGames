"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Lightbulb, Lock, Check, Loader2 } from "lucide-react"
import { Team, Vote, Profile } from "@/types/database"
import { VOTING_CATEGORIES, VotingCategory } from "@/lib/supabase"
import { getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import { cn } from "@/lib/utils"

interface VotingCardProps {
  team: Team
  voterName: string
  existingVotes: Vote[]
  onVote: (teamId: string, category: VotingCategory, score: number) => Promise<void>
  disabled?: boolean
  profiles?: Profile[]
}

export function VotingCard({ team, voterName, existingVotes, onVote, disabled, profiles = [] }: VotingCardProps) {
  const [votes, setVotes] = useState<Record<VotingCategory, number>>({} as Record<VotingCategory, number>)
  const [submitting, setSubmitting] = useState<VotingCategory | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  // Check if this voter is a team member
  const isTeamMember = team.members.some(
    member => member.toLowerCase() === voterName.toLowerCase()
  )

  // Load existing votes
  useEffect(() => {
    const voterVotes = existingVotes.filter(
      v => v.voter_name.toLowerCase() === voterName.toLowerCase() && v.team_id === team.id
    )
    const voteMap: Record<string, number> = {}
    voterVotes.forEach(v => {
      voteMap[v.category] = v.score
    })
    setVotes(voteMap as Record<VotingCategory, number>)
    setHasVoted(voterVotes.length > 0)
  }, [existingVotes, voterName, team.id])

  const handleStarClick = async (category: VotingCategory, score: number) => {
    if (disabled || isTeamMember) return
    
    setSubmitting(category)
    try {
      await onVote(team.id, category, score)
      setVotes(prev => ({ ...prev, [category]: score }))
      setHasVoted(true)
    } catch (error) {
      console.error('Failed to submit vote:', error)
    } finally {
      setSubmitting(null)
    }
  }

  const initials = team.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberProfiles = team.members
    .map((name) => profiles.find((p) => p.name === name))
    .filter((p): p is Profile => !!p)

  const totalScore = Object.values(votes).reduce((a, b) => a + b, 0)
  const votedCategories = Object.keys(votes).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={disabled || isTeamMember ? 'opacity-60' : ''}
    >
      <Card className="glass border-border/50 overflow-hidden">
        {isTeamMember && (
          <div className="bg-yellow-500/20 px-4 py-2 flex items-center gap-2 text-sm text-yellow-500">
            <Lock className="w-4 h-4" />
            You cannot vote for your own team
          </div>
        )}
        
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Team name, avatar, member avatars */}
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20 shrink-0">
                <AvatarImage src={team.avatar_url || undefined} alt={team.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold truncate">{team.name}</h3>
                  {hasVoted && (
                    <Badge variant="secondary" className="shrink-0">
                      <Check className="w-3 h-3 mr-1" />
                      Voted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 shrink-0">
                    {(memberProfiles.length > 0 ? memberProfiles : team.members).map((pOrName, i) => {
                      const p = typeof pOrName === "string" ? null : pOrName
                      const name = typeof pOrName === "string" ? pOrName : pOrName.name
                      const emoji = p ? getEmojiFromAvatar(p.avatar_url) : null
                      const emojiBg = p ? getEmojiBgFromAvatar(p.avatar_url) : null
                      const imageSrc = p && p.avatar_url && !isEmojiAvatar(p.avatar_url) ? p.avatar_url : undefined
                      return emoji ? (
                        <div
                          key={i}
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border text-lg",
                            !emojiBg && "bg-card"
                          )}
                          style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
                          title={name}
                        >
                          {emoji}
                        </div>
                      ) : (
                        <Avatar key={i} className="size-10 border-2 border-border shrink-0" title={name}>
                          <AvatarImage src={imageSrc} alt={name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                            {name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                  <span className="font-medium text-sm text-muted-foreground truncate">
                    {team.members.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Idea */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-sm">Project Idea</span>
              </div>
              {team.selected_idea ? (
                <p className="text-muted-foreground text-sm leading-relaxed p-3 rounded-lg bg-secondary/50">
                  {team.selected_idea}
                </p>
              ) : (
                <p className="text-muted-foreground/60 text-sm italic">No idea selected</p>
              )}
            </div>
          </div>
        </CardHeader>
        
        {!isTeamMember && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {VOTING_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                  {submitting === category.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      disabled={disabled || submitting !== null}
                      onClick={() => handleStarClick(category.id, star)}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (votes[category.id] || 0)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted-foreground hover:text-yellow-500/50'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            </div>

            {votedCategories > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-border mt-4"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Your total score ({votedCategories}/{VOTING_CATEGORIES.length} categories)
                  </span>
                  <span className="font-bold text-primary">
                    {totalScore} / {VOTING_CATEGORIES.length * 5}
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}
