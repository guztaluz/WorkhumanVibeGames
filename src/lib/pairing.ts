import type { Profile } from "@/types/database"
import type { SkillLevel, WorkLocation } from "@/types/database"

const SKILL_ORDER: Record<SkillLevel, number> = {
  just_starting: 1,
  getting_hang: 2,
  master: 3,
}

/** Default work_location for profiles that don't have it (e.g. from localStorage or old data). */
const DEFAULT_WORK_LOCATION: WorkLocation = "in_office"

function getWorkLocation(profile: Profile): WorkLocation {
  return profile.work_location ?? DEFAULT_WORK_LOCATION
}

/**
 * Pairs profiles within a single work-location group: each team has at least one
 * higher-skilled and one lower-skilled member. For odd N, creates one team of 3.
 * Special case: if only one person in the group, we still show them as a group of 1
 * (e.g. the only remote person).
 */
function pairWithinGroup(profiles: Profile[]): { profileIds: string[] }[] {
  if (profiles.length === 0) return []
  if (profiles.length === 1) return [{ profileIds: [profiles[0].id] }]

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

/**
 * Pairs profiles so that in-office people are paired with in-office, and remote with remote.
 * Within each group, keeps the same skill-based logic: each team has at least one
 * higher-skilled and one lower-skilled member.
 */
export function pairLateJoiners(
  allProfiles: Profile[],
  existingPairs: { profileIds: string[] }[]
): { profileIds: string[] }[] {
  const pairedIds = new Set(existingPairs.flatMap((p) => p.profileIds))
  const unpaired = allProfiles.filter((p) => !pairedIds.has(p.id))
  if (unpaired.length < 2) return []
  return pairProfiles(unpaired)
}

export function pairProfiles(profiles: Profile[]): { profileIds: string[] }[] {
  if (profiles.length < 2) return []

  const byLocation = new Map<WorkLocation, Profile[]>()
  for (const p of profiles) {
    const loc = getWorkLocation(p)
    if (!byLocation.has(loc)) byLocation.set(loc, [])
    byLocation.get(loc)!.push(p)
  }

  const allPairs: { profileIds: string[] }[] = []
  for (const group of byLocation.values()) {
    allPairs.push(...pairWithinGroup(group))
  }

  return allPairs
}
