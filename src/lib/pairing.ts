import type { Profile } from "@/types/database"
import type { SkillLevel } from "@/types/database"

const SKILL_ORDER: Record<SkillLevel, number> = {
  just_starting: 1,
  getting_hang: 2,
  master: 3,
}

/**
 * Pairs profiles so each team has at least one higher-skilled and one lower-skilled member.
 * For odd N, creates one team of 3 with the remaining profiles.
 */
export function pairProfiles(profiles: Profile[]): { profileIds: string[] }[] {
  if (profiles.length < 2) return []

  const sorted = [...profiles].sort(
    (a, b) => SKILL_ORDER[b.skill_level] - SKILL_ORDER[a.skill_level]
  )

  const pairs: { profileIds: string[] }[] = []
  let i = 0
  let j = sorted.length - 1

  while (i < j) {
    if (i + 2 === j) {
      pairs.push({
        profileIds: [sorted[i].id, sorted[i + 1].id, sorted[j].id],
      })
      break
    }
    pairs.push({
      profileIds: [sorted[i].id, sorted[j].id],
    })
    i++
    j--
  }

  return pairs
}
