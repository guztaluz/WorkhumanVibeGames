// Simple state management for voting status
// In a production app, you'd store this in Supabase

const VOTING_FINISHED_KEY = 'vibe-games-voting-finished'

export const setVotingFinished = (finished: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOTING_FINISHED_KEY, JSON.stringify(finished))
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('voting-state-changed', { detail: { finished } }))
  }
}

export const isVotingFinished = (): boolean => {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(VOTING_FINISHED_KEY)
  return stored ? JSON.parse(stored) : false
}

export const resetVoting = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VOTING_FINISHED_KEY)
    window.dispatchEvent(new CustomEvent('voting-state-changed', { detail: { finished: false } }))
  }
}
