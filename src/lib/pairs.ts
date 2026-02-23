import { supabase } from "@/lib/supabase"
import type { Pair } from "@/types/database"

const PAIRS_STORAGE_KEY = "vibe-games-pairs"

export async function savePairs(
  pairs: { profileIds: string[] }[]
): Promise<void> {
  try {
    await supabase
      .from("pairs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    const rows = pairs.map((p) => ({ profile_ids: p.profileIds }))
    const { error } = await supabase.from("pairs").insert(rows as never)
    if (error) throw error

    if (typeof window !== "undefined") {
      localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify(pairs))
    }
  } catch {
    if (typeof window !== "undefined") {
      localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify(pairs))
    }
  }
}

export async function appendPairs(
  pairs: { profileIds: string[] }[]
): Promise<void> {
  try {
    const rows = pairs.map((p) => ({ profile_ids: p.profileIds }))
    const { error } = await supabase.from("pairs").insert(rows as never)
    if (error) throw error

    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(PAIRS_STORAGE_KEY)
      const prev = existing ? (JSON.parse(existing) as { profileIds: string[] }[]) : []
      localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify([...prev, ...pairs]))
    }
  } catch {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(PAIRS_STORAGE_KEY)
      const prev = existing ? (JSON.parse(existing) as { profileIds: string[] }[]) : []
      localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify([...prev, ...pairs]))
    }
  }
}

export async function fetchPairs(): Promise<{ profileIds: string[] }[]> {
  try {
    const { data, error } = await supabase
      .from("pairs")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error
    if (data && data.length > 0) {
      return (data as Pair[]).map((row) => ({ profileIds: row.profile_ids }))
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PAIRS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as { profileIds: string[] }[]
    }
  }

  return []
}
