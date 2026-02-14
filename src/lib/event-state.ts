import { supabase } from "@/lib/supabase"

export type EventPhase = "profiles" | "pairings" | "voting"

const PHASE_STORAGE_KEY = "vibe-games-event-phase"

export async function getEventPhase(): Promise<EventPhase> {
  try {
    const { data, error } = await supabase
      .from("event_state")
      .select("current_phase")
      .eq("id", "default")
      .single()

    const row = data as { current_phase?: string } | null
    if (!error && row?.current_phase) {
      return row.current_phase as EventPhase
    }
  } catch {
    // Fallback to localStorage
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PHASE_STORAGE_KEY)
    return (stored as EventPhase) || "profiles"
  }
  return "profiles"
}

export async function setEventPhase(phase: EventPhase): Promise<void> {
  try {
    const { error } = await supabase
      .from("event_state")
      .upsert({ id: "default", current_phase: phase, updated_at: new Date().toISOString() } as never, {
        onConflict: "id",
      })

    if (!error) {
      if (typeof window !== "undefined") {
        localStorage.setItem(PHASE_STORAGE_KEY, phase)
        window.dispatchEvent(new CustomEvent("event-phase-changed", { detail: { phase } }))
      }
      return
    }
  } catch {
    // Fallback
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(PHASE_STORAGE_KEY, phase)
    window.dispatchEvent(new CustomEvent("event-phase-changed", { detail: { phase } }))
  }
}

export function subscribeToEventPhase(callback: (phase: EventPhase) => void): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<{ phase: EventPhase }>).detail.phase)
  }
  window.addEventListener("event-phase-changed", handler)

  if (typeof window !== "undefined") {
    getEventPhase().then(callback)
  }

  return () => window.removeEventListener("event-phase-changed", handler)
}
