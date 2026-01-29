"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Users, Trophy, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { isVotingFinished } from "@/lib/voting-state"

const baseNavItems = [
  { href: "/", label: "Intro", icon: Sparkles },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/voting", label: "Voting", icon: Trophy },
]

const resultsNavItem = { href: "/results", label: "Results", icon: Crown }

export function Navigation() {
  const pathname = usePathname()
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    // Check initial state
    setShowResults(isVotingFinished())

    // Listen for voting state changes
    const handleVotingStateChange = (e: CustomEvent<{ finished: boolean }>) => {
      setShowResults(e.detail.finished)
    }

    window.addEventListener('voting-state-changed', handleVotingStateChange as EventListener)
    return () => {
      window.removeEventListener('voting-state-changed', handleVotingStateChange as EventListener)
    }
  }, [])

  const navItems = showResults ? [...baseNavItems, resultsNavItem] : baseNavItems

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl gradient-text">Vibe Games</span>
          </Link>

          <div className="flex items-center gap-1">
            <AnimatePresence mode="popLayout">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const isResultsTab = item.href === "/results"
                
                return (
                  <motion.div
                    key={item.href}
                    initial={isResultsTab ? { opacity: 0, scale: 0.8, x: 20 } : false}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                  >
                    <Link href={item.href} className="relative">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                          isResultsTab && !isActive && "text-yellow-500 hover:text-yellow-400"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isResultsTab && !isActive && "text-yellow-500")} />
                        <span className="font-medium">{item.label}</span>
                        
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className={cn(
                              "absolute inset-0 rounded-lg -z-10",
                              isResultsTab ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "bg-primary"
                            )}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
