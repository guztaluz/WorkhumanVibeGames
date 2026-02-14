"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Lightbulb, Users, Lock, Check, Loader2 } from "lucide-react"
import { Team, Vote } from "@/types/database"
import { VOTING_CATEGORIES, VotingCategory } from "@/lib/supabase"

interface VotingCardProps {
  team: Team
  voterName: string
  existingVotes: Vote[]
  onVote: (teamId: string, category: VotingCategory, score: number) => Promise<void>
  disabled?: boolean
}

export function VotingCard({ team, voterName, existingVotes, onVote, disabled }: VotingCardProps) {
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
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/20">
              <AvatarImage src={team.avatar_url || undefined} alt={team.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow min-w-0">
              <CardTitle className="text-lg mb-1 truncate">{team.name}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-3 h-3" />
                <span>{team.members.join(', ')}</span>
              </div>
            </div>

            {hasVoted && (
              <Badge variant="secondary" className="flex-shrink-0">
                <Check className="w-3 h-3 mr-1" />
                Voted
              </Badge>
            )}
          </div>
          
          {team.selected_idea && (
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-secondary/50">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{team.selected_idea}</p>
            </div>
          )}
        </CardHeader>
        
        {!isTeamMember && (
          <CardContent className="space-y-4">
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
