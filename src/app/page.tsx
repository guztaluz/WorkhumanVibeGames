"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Users, Trophy, Zap, Target, Palette, ArrowRight } from "lucide-react"
import Link from "next/link"

const rules = [
  {
    icon: Users,
    title: "Form Your Team",
    description: "Create a team with your colleagues. Give it a fun name and add all team members.",
  },
  {
    icon: Zap,
    title: "Pick a Crazy Idea",
    description: "Choose from our wild project suggestions or spin the wheel for a random concept!",
  },
  {
    icon: Palette,
    title: "Build with Vibe Coding",
    description: "Use AI-assisted vibe coding to bring your ridiculous product idea to life.",
  },
  {
    icon: Target,
    title: "Present Your Creation",
    description: "Show off your masterpiece to the group. Make us laugh, make us think!",
  },
  {
    icon: Trophy,
    title: "Vote & Win",
    description: "Rate other teams on design, UX, innovation, and more. May the best vibes win!",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 animate-gradient" />
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 w-32 h-32 bg-accent/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-1/4 w-24 h-24 bg-chart-3/20 rounded-full blur-xl"
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Product Design Challenge</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">Vibe Games</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Where ridiculous ideas meet AI-powered creativity. Build absurd products, vote on the best designs, and have fun doing it!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/teams">
              <Button size="lg" className="group animate-pulse-glow">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/voting">
              <Button size="lg" variant="outline">
                View Leaderboard
                <Trophy className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What is Vibe Games Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What is Vibe Games?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vibe Games is a fun team activity where product designers compete to create 
              the most creative (and ridiculous) vibe-coded projects. Think hackathon meets 
              improv comedy meets design challenge!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass border-primary/20">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Vibe Coding</h3>
                    <p className="text-muted-foreground text-sm">
                      Use AI tools to rapidly prototype your wild ideas
                    </p>
                  </div>
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Product Design</h3>
                    <p className="text-muted-foreground text-sm">
                      Focus on UX, UI, accessibility, and user flows
                    </p>
                  </div>
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-chart-3/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-chart-3" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Competition</h3>
                    <p className="text-muted-foreground text-sm">
                      Vote on multiple criteria and crown the champions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Follow these simple steps to participate in the Vibe Games
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6"
          >
            {rules.map((rule, index) => (
              <motion.div key={rule.title} variants={item}>
                <Card className="glass border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <rule.icon className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg">{rule.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Card className="glass border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-chart-3/10 animate-gradient" />
            <CardContent className="relative p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Vibe?</h2>
              <p className="text-muted-foreground mb-8">
                Create your team, pick a crazy idea, and let the games begin!
              </p>
              <Link href="/teams">
                <Button size="lg" className="group">
                  Create Your Team
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
