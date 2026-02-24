"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, PartyPopper, Vote, Users } from "lucide-react"
import type { EventPhase } from "@/lib/event-state"

const PHASE_ORDER: EventPhase[] = ["profiles", "pairings", "voting", "results"]

interface PhaseConfig {
  title: string
  subtitle: string
  icon: React.ReactNode
  route: string
  gradient: string
}

const PHASE_CONFIGS: Partial<Record<EventPhase, PhaseConfig>> = {
  pairings: {
    title: "Pairs Are Ready!",
    subtitle: "Time to meet your partner and form a team",
    icon: <Users className="w-16 h-16" />,
    route: "/teams",
    gradient: "from-blue-500 to-cyan-500",
  },
  voting: {
    title: "Voting Is Now Open!",
    subtitle: "Rate the teams and pick your favourites",
    icon: <Vote className="w-16 h-16" />,
    route: "/voting",
    gradient: "from-primary to-accent",
  },
  results: {
    title: "Results Are In!",
    subtitle: "Let's see who won",
    icon: <PartyPopper className="w-16 h-16" />,
    route: "/results",
    gradient: "from-yellow-500 to-amber-500",
  },
}

function isForwardTransition(from: EventPhase, to: EventPhase): boolean {
  return PHASE_ORDER.indexOf(to) > PHASE_ORDER.indexOf(from)
}

interface PhaseTransitionOverlayProps {
  previousPhase: EventPhase | null
  currentPhase: EventPhase
  isAdmin: boolean
}

export function PhaseTransitionOverlay({
  previousPhase,
  currentPhase,
  isAdmin,
}: PhaseTransitionOverlayProps) {
  const [active, setActive] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [config, setConfig] = useState<PhaseConfig | null>(null)

  const startTransition = useCallback(
    (cfg: PhaseConfig) => {
      setConfig(cfg)
      setActive(true)
      setCountdown(3)
    },
    []
  )

  useEffect(() => {
    if (
      !isAdmin &&
      previousPhase &&
      previousPhase !== currentPhase &&
      isForwardTransition(previousPhase, currentPhase)
    ) {
      const cfg = PHASE_CONFIGS[currentPhase]
      if (cfg) startTransition(cfg)
    }
  }, [previousPhase, currentPhase, isAdmin, startTransition])

  useEffect(() => {
    if (countdown === null || !active) return

    if (countdown === 0) {
      const timer = setTimeout(() => {
        setActive(false)
        if (config) window.location.href = config.route
      }, 400)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [countdown, active, config])

  return (
    <AnimatePresence>
      {active && config && (
        <motion.div
          key="phase-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className={`mb-6 rounded-full bg-gradient-to-br ${config.gradient} p-6 text-white shadow-2xl`}
          >
            {config.icon}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="font-display text-4xl sm:text-5xl font-bold text-center mb-2"
          >
            {config.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground text-center mb-12 max-w-md"
          >
            {config.subtitle}
          </motion.p>

          {/* Countdown */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {countdown !== null && countdown > 0 ? (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute font-display text-8xl font-bold bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}
                >
                  {countdown}
                </motion.span>
              ) : countdown === 0 ? (
                <motion.div
                  key="go"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`absolute font-display text-6xl font-bold bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}
                >
                  GO!
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Pulsing ring behind countdown */}
          <motion.div
            className={`absolute rounded-full border-2 border-current opacity-20`}
            style={{ width: 160, height: 160 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook to track phase transitions for use with PhaseTransitionOverlay.
 * Returns the previous phase value whenever `eventPhase` changes.
 * Ignores the first change (the initial subscription catch-up) so the
 * overlay doesn't fire on page load or after navigation.
 */
export function usePreviousPhase(eventPhase: EventPhase): EventPhase | null {
  const [prev, setPrev] = useState<EventPhase | null>(null)
  const [current, setCurrent] = useState<EventPhase>(eventPhase)
  const settled = useRef(false)

  useEffect(() => {
    if (eventPhase !== current) {
      if (settled.current) {
        setPrev(current)
      }
      setCurrent(eventPhase)
      settled.current = true
    }
  }, [eventPhase, current])

  return prev
}
