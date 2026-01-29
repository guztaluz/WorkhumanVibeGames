"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react"
import { Team, Vote } from "@/types/database"
import { VOTING_CATEGORIES } from "@/lib/supabase"

interface LeaderboardProps {
  teams: Team[]
  votes: Vote[]
}

interface TeamScore {
  team: Team
  totalScore: number
  averageScore: number
  voteCount: number
  categoryScores: Record<string, { total: number; count: number; average: number }>
}

export function Leaderboard({ teams, votes }: LeaderboardProps) {
  // Calculate scores for each team
  const teamScores: TeamScore[] = teams.map(team => {
    const teamVotes = votes.filter(v => v.team_id === team.id)
    
    // Group votes by category
    const categoryScores: Record<string, { total: number; count: number; average: number }> = {}
    VOTING_CATEGORIES.forEach(cat => {
      const catVotes = teamVotes.filter(v => v.category === cat.id)
      const total = catVotes.reduce((sum, v) => sum + v.score, 0)
      const count = catVotes.length
      categoryScores[cat.id] = {
        total,
        count,
        average: count > 0 ? total / count : 0,
      }
    })

    const totalScore = Object.values(categoryScores).reduce((sum, c) => sum + c.total, 0)
    const totalVotes = teamVotes.length
    const averageScore = totalVotes > 0 ? totalScore / totalVotes : 0

    return {
      team,
      totalScore,
      averageScore,
      voteCount: totalVotes,
      categoryScores,
    }
  })

  // Sort by total score descending
  const sortedTeams = [...teamScores].sort((a, b) => b.totalScore - a.totalScore)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
      case 2:
        return 'from-gray-400/20 to-gray-400/5 border-gray-400/30'
      case 3:
        return 'from-amber-600/20 to-amber-600/5 border-amber-600/30'
      default:
        return 'from-secondary to-secondary/50 border-border/50'
    }
  }

  if (teams.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-muted-foreground text-sm">
            Teams will appear here once they&apos;re created
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedTeams.map((item, index) => {
            const rank = index + 1
            const initials = item.team.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <motion.div
                key={item.team.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`p-4 rounded-xl bg-gradient-to-r border ${getRankColor(rank)}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Team Info */}
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={item.team.avatar_url || undefined} alt={item.team.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-grow min-w-0">
                      <p className="font-semibold truncate">{item.team.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.voteCount} votes</span>
                        {item.averageScore > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              {item.averageScore.toFixed(1)} avg
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Total Score */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{item.totalScore}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>

                  {/* Category Breakdown (show for top 3) */}
                  {rank <= 3 && item.voteCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border/50"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {VOTING_CATEGORIES.map(cat => {
                          const catScore = item.categoryScores[cat.id]
                          return (
                            <div key={cat.id} className="text-center p-2 rounded-lg bg-background/50">
                              <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                              <p className="font-semibold">
                                {catScore.average > 0 ? catScore.average.toFixed(1) : '-'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Voting Stats */}
        {votes.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>{votes.length} total votes from {new Set(votes.map(v => v.voter_name.toLowerCase())).size} voters</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
