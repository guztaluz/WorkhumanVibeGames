"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { VotingCard } from "@/components/voting-card"
import { Leaderboard } from "@/components/leaderboard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, User, RefreshCw, AlertCircle, CheckCircle2, PartyPopper, Trash2, ShieldAlert } from "lucide-react"
import { Team, Vote } from "@/types/database"
import { supabase, VotingCategory } from "@/lib/supabase"
import { setVotingFinished, resetVoting } from "@/lib/voting-state"
import Link from "next/link"

// Admin code for accessing finish voting controls
const ADMIN_CODE = "vibegames2024"
const RESET_PASSWORD = "resetvibes"

function VotingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === ADMIN_CODE
  
  const [teams, setTeams] = useState<Team[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [voterName, setVoterName] = useState("")
  const [savedVoterName, setSavedVoterName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadData()
    
    // Load saved voter name from localStorage
    const saved = localStorage.getItem('vibe-games-voter-name')
    if (saved) {
      setVoterName(saved)
      setSavedVoterName(saved)
    }
  }, [])

  // Set up real-time subscription for votes
  useEffect(() => {
    if (useLocalStorage) return

    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          // Reload votes when changes occur
          loadVotes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [useLocalStorage])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Try Supabase
      const [teamsResult, votesResult] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('votes').select('*'),
      ])

      if (teamsResult.error) throw teamsResult.error
      if (votesResult.error) throw votesResult.error

      setTeams(teamsResult.data || [])
      setVotes(votesResult.data || [])
      setUseLocalStorage(false)
    } catch {
      // Fallback to localStorage
      console.log('Using localStorage fallback')
      setUseLocalStorage(true)
      
      const storedTeams = localStorage.getItem('vibe-games-teams')
      const storedVotes = localStorage.getItem('vibe-games-votes')
      
      if (storedTeams) setTeams(JSON.parse(storedTeams))
      if (storedVotes) setVotes(JSON.parse(storedVotes))
    } finally {
      setIsLoading(false)
    }
  }

  const loadVotes = useCallback(async () => {
    if (useLocalStorage) {
      const storedVotes = localStorage.getItem('vibe-games-votes')
      if (storedVotes) setVotes(JSON.parse(storedVotes))
      return
    }

    const { data } = await supabase.from('votes').select('*')
    if (data) setVotes(data)
  }, [useLocalStorage])

  const handleSaveVoterName = () => {
    if (voterName.trim()) {
      localStorage.setItem('vibe-games-voter-name', voterName.trim())
      setSavedVoterName(voterName.trim())
    }
  }

  const handleVote = async (teamId: string, category: VotingCategory, score: number) => {
    if (!savedVoterName) return

    if (useLocalStorage) {
      // localStorage fallback
      const existingVoteIndex = votes.findIndex(
        v => v.voter_name.toLowerCase() === savedVoterName.toLowerCase() &&
             v.team_id === teamId &&
             v.category === category
      )

      let updatedVotes: Vote[]
      if (existingVoteIndex >= 0) {
        // Update existing vote
        updatedVotes = [...votes]
        updatedVotes[existingVoteIndex] = {
          ...updatedVotes[existingVoteIndex],
          score,
        }
      } else {
        // Add new vote
        const newVote: Vote = {
          id: crypto.randomUUID(),
          voter_name: savedVoterName,
          team_id: teamId,
          category,
          score,
          created_at: new Date().toISOString(),
        }
        updatedVotes = [...votes, newVote]
      }

      setVotes(updatedVotes)
      localStorage.setItem('vibe-games-votes', JSON.stringify(updatedVotes))
    } else {
      // Use Supabase with upsert
      const { error } = await supabase
        .from('votes')
        .upsert(
          {
            voter_name: savedVoterName,
            team_id: teamId,
            category,
            score,
          } as never,
          {
            onConflict: 'voter_name,team_id,category',
          }
        )

      if (error) throw error
      // Real-time subscription will update the votes
    }
  }

  const handleFullReset = async () => {
    const password = prompt('Enter reset password to delete ALL data:')
    if (password !== RESET_PASSWORD) {
      if (password !== null) {
        alert('Incorrect password!')
      }
      return
    }

    const confirmReset = confirm(
      '⚠️ WARNING: This will permanently delete:\n\n' +
      '• All teams\n' +
      '• All votes\n' +
      '• Reset the session state\n\n' +
      'This cannot be undone. Are you sure?'
    )

    if (!confirmReset) return

    setIsResetting(true)
    try {
      if (useLocalStorage) {
        // Clear localStorage
        localStorage.removeItem('vibe-games-teams')
        localStorage.removeItem('vibe-games-votes')
        localStorage.removeItem('vibe-games-voter-name')
      } else {
        // Clear Supabase tables
        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      }

      // Reset voting state
      resetVoting()
      
      // Clear local state
      setTeams([])
      setVotes([])
      setVoterName('')
      setSavedVoterName('')
      localStorage.removeItem('vibe-games-voter-name')

      alert('✅ All data has been reset successfully!')
      
      // Reload the page to ensure clean state
      window.location.href = '/voting?admin=' + ADMIN_CODE
    } catch (error) {
      console.error('Reset failed:', error)
      alert('Failed to reset. Check console for details.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Voting</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Vote for the Best Projects</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Rate each team across multiple categories. The leaderboard updates in real-time!
          </p>
        </motion.div>

        {/* Voter Identification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass border-border/50 max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Your Name</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your name to vote..."
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveVoterName()}
                  className="bg-secondary/50"
                />
                <Button onClick={handleSaveVoterName} disabled={!voterName.trim()}>
                  {savedVoterName ? 'Update' : 'Save'}
                </Button>
              </div>
              {savedVoterName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Voting as: <span className="text-primary font-medium">{savedVoterName}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {!savedVoterName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 max-w-md mx-auto"
          >
            <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-yellow-500">
              Enter your name above to start voting
            </p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-secondary/30 animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-xl bg-secondary/30 animate-pulse" />
          </div>
        ) : teams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No teams to vote on yet</h3>
            <p className="text-muted-foreground mb-6">
              Teams need to be created before voting can begin.
            </p>
            <Link href="/teams">
              <Button>Create a Team</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Voting Cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Teams ({teams.length})</h2>
                <Button variant="ghost" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {teams.map((team) => (
                <VotingCard
                  key={team.id}
                  team={team}
                  voterName={savedVoterName}
                  existingVotes={votes}
                  onVote={handleVote}
                  disabled={!savedVoterName}
                />
              ))}
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:sticky lg:top-24 lg:h-fit space-y-4"
            >
              <Leaderboard teams={teams} votes={votes} />

              {/* Finish Voting Button - Admin Only */}
              {isAdmin && votes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Admin: Ready to reveal results?</p>
                          <p className="text-xs text-muted-foreground">
                            {votes.length} votes from {new Set(votes.map(v => v.voter_name.toLowerCase())).size} voters
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          if (confirm('Finish voting and reveal the results?')) {
                            setVotingFinished(true)
                            router.push('/results')
                          }
                        }}
                      >
                        <PartyPopper className="w-4 h-4 mr-2" />
                        Finish Voting & Show Results
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Admin Reset Button - Danger Zone */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <ShieldAlert className="w-5 h-5 text-destructive" />
                        <div>
                          <p className="font-medium text-destructive">Danger Zone</p>
                          <p className="text-xs text-muted-foreground">
                            Reset everything and start fresh
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="destructive"
                        className="w-full" 
                        onClick={handleFullReset}
                        disabled={isResetting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isResetting ? 'Resetting...' : 'Reset All Data'}
                      </Button>
                    </CardContent>
                  </Card>
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
                    Running in demo mode (localStorage). Configure Supabase for real-time sync.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function VotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Trophy className="w-12 h-12 text-primary animate-pulse" />
      </div>
    }>
      <VotingContent />
    </Suspense>
  )
}
