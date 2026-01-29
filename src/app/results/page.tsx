"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Trophy, Medal, Award, Star, PartyPopper, RotateCcw } from "lucide-react"
import { Team, Vote } from "@/types/database"
import { supabase, VOTING_CATEGORIES } from "@/lib/supabase"
import { Confetti } from "@/components/confetti"
import { resetVoting } from "@/lib/voting-state"
import { useRouter } from "next/navigation"

interface TeamScore {
  team: Team
  totalScore: number
  averageScore: number
  voteCount: number
  categoryScores: Record<string, { total: number; count: number; average: number }>
}

export default function ResultsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [revealStage, setRevealStage] = useState(0)

  useEffect(() => {
    loadData()
    
    // Start reveal animation
    const timer1 = setTimeout(() => setRevealStage(1), 500)
    const timer2 = setTimeout(() => setRevealStage(2), 1500)
    const timer3 = setTimeout(() => setRevealStage(3), 2500)
    const timer4 = setTimeout(() => setShowConfetti(false), 6000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [teamsResult, votesResult] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('votes').select('*'),
      ])

      if (teamsResult.data) setTeams(teamsResult.data)
      if (votesResult.data) setVotes(votesResult.data)
    } catch {
      // Fallback to localStorage
      const storedTeams = localStorage.getItem('vibe-games-teams')
      const storedVotes = localStorage.getItem('vibe-games-votes')
      if (storedTeams) setTeams(JSON.parse(storedTeams))
      if (storedVotes) setVotes(JSON.parse(storedVotes))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset and start a new voting session?')) {
      resetVoting()
      router.push('/voting')
    }
  }

  // Calculate scores
  const teamScores: TeamScore[] = teams.map(team => {
    const teamVotes = votes.filter(v => v.team_id === team.id)
    
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

    return { team, totalScore, averageScore, voteCount: totalVotes, categoryScores }
  })

  const sortedTeams = [...teamScores].sort((a, b) => b.totalScore - a.totalScore)
  const winner = sortedTeams[0]
  const runnerUp = sortedTeams[1]
  const thirdPlace = sortedTeams[2]
  const others = sortedTeams.slice(3)

  const getInitials = (name: string) => 
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Results Yet</h2>
            <p className="text-muted-foreground">Teams need to be created and voted on first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {showConfetti && <Confetti />}
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-6"
          >
            <PartyPopper className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-yellow-500">Voting Complete!</span>
            <PartyPopper className="w-5 h-5 text-yellow-500" />
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">The Results Are In!</span>
          </h1>
        </motion.div>

        {/* Winner Section */}
        <AnimatePresence>
          {revealStage >= 1 && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="mb-12"
            >
              <Card className="relative overflow-hidden border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 via-background to-amber-500/10">
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-amber-500/20 animate-gradient" />
                
                <CardContent className="relative p-8 sm:p-12">
                  <div className="flex flex-col items-center text-center">
                    {/* Crown */}
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Crown className="w-16 h-16 text-yellow-500 mb-4" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-yellow-500 mb-6">WINNER</h2>
                    
                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.4 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl animate-pulse" />
                      <Avatar className="w-32 h-32 border-4 border-yellow-500 relative">
                        <AvatarImage src={winner.team.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white text-3xl font-bold">
                          {getInitials(winner.team.name)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    {/* Team Name */}
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-3xl sm:text-4xl font-bold mt-6 mb-2"
                    >
                      {winner.team.name}
                    </motion.h3>
                    
                    {/* Score */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="flex items-center gap-2 text-4xl font-bold text-yellow-500"
                    >
                      <Star className="w-8 h-8 fill-yellow-500" />
                      {winner.totalScore} points
                    </motion.div>
                    
                    {/* Project Idea */}
                    {winner.team.selected_idea && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-4 text-muted-foreground max-w-md"
                      >
                        {winner.team.selected_idea}
                      </motion.p>
                    )}
                    
                    {/* Category Breakdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg"
                    >
                      {VOTING_CATEGORIES.map(cat => (
                        <div key={cat.id} className="text-center p-3 rounded-lg bg-background/50">
                          <p className="text-xs text-muted-foreground">{cat.name}</p>
                          <p className="font-bold text-lg">
                            {winner.categoryScores[cat.id]?.average.toFixed(1) || '-'}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Runner Up & Third Place */}
        <AnimatePresence>
          {revealStage >= 2 && (runnerUp || thirdPlace) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid sm:grid-cols-2 gap-6 mb-8"
            >
              {/* Second Place */}
              {runnerUp && (
                <Card className="border-gray-400/30 bg-gradient-to-br from-gray-400/10 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Medal className="w-8 h-8 text-gray-400 absolute -top-2 -right-2 z-10" />
                        <Avatar className="w-16 h-16 border-2 border-gray-400">
                          <AvatarImage src={runnerUp.team.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold">
                            {getInitials(runnerUp.team.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-grow min-w-0">
                        <Badge className="mb-1 bg-gray-400/20 text-gray-400">2nd Place</Badge>
                        <h3 className="font-bold text-lg truncate">{runnerUp.team.name}</h3>
                        <p className="text-2xl font-bold text-gray-400">{runnerUp.totalScore} pts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Third Place */}
              {thirdPlace && (
                <Card className="border-amber-600/30 bg-gradient-to-br from-amber-600/10 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Award className="w-8 h-8 text-amber-600 absolute -top-2 -right-2 z-10" />
                        <Avatar className="w-16 h-16 border-2 border-amber-600">
                          <AvatarImage src={thirdPlace.team.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-600 to-amber-700 text-white font-bold">
                            {getInitials(thirdPlace.team.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-grow min-w-0">
                        <Badge className="mb-1 bg-amber-600/20 text-amber-600">3rd Place</Badge>
                        <h3 className="font-bold text-lg truncate">{thirdPlace.team.name}</h3>
                        <p className="text-2xl font-bold text-amber-600">{thirdPlace.totalScore} pts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Other Teams */}
        <AnimatePresence>
          {revealStage >= 3 && others.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 text-muted-foreground">Other Participants</h3>
              <div className="space-y-3">
                {others.map((item, index) => (
                  <motion.div
                    key={item.team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-muted-foreground w-8">
                            {index + 4}
                          </span>
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={item.team.avatar_url || undefined} />
                            <AvatarFallback className="bg-secondary">
                              {getInitials(item.team.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-semibold truncate">{item.team.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.voteCount} votes
                            </p>
                          </div>
                          <p className="text-xl font-bold">{item.totalScore} pts</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-12 text-center"
        >
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Start New Session
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
