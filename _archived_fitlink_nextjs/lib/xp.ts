// fitlink/lib/xp.ts
// XP values, streak multipliers, and level thresholds for the FitLink progress system.

// ── XP values per action ──────────────────────────────────────────────────────

export const XP = {
  WORKOUT_COMPLETE:    100,   // Completed a workout session (from planned workflow)
  WORKOUT_QUICK_LOG:  150,   // Logged a completed workout via quick-log form
  WORKOUT_TARGET_HIT:  50,   // Bonus: hit target during quick-logged workout
  TASK_COMPLETE:        50,   // Completed an assigned or self-created task
  HEALTH_LOG:         30,   // Logged health data (steps, water, sleep, etc.)
  NUTRITION_LOG:      20,   // Added food entries for the day
  STEPS_GOAL_HIT:     40,   // Hit daily step goal
  WATER_GOAL_HIT:     15,   // Hit daily water goal
  SLEEP_GOAL_HIT:     20,   // Hit sleep goal
  CALORIES_GOAL_HIT:  25,   // Logged at least 3 meals for the day
  WEIGHT_LOGGED:      10,   // Logged body weight
  STREAK_BONUS:       25,   // Daily streak bonus (multiplied by streak multiplier)
  FIRST_LOG_OF_DAY:   10,   // First health or nutrition log of the day
} as const

export type XpReason = keyof typeof XP

// ── Streak multipliers ────────────────────────────────────────────────────────
// Applied to STREAK_BONUS. Higher streaks earn more XP per day.

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 28) return 2.0
  if (streakDays >= 14) return 1.5
  if (streakDays >= 7)  return 1.25
  return 1.0
}

// ── Level thresholds ──────────────────────────────────────────────────────────
// Total XP required to *reach* each level (index = level number).

export const LEVEL_THRESHOLDS: readonly number[] = [
  0,      // Level 1 (start)
  200,    // Level 2
  500,    // Level 3
  1_000,  // Level 4
  2_000,  // Level 5
  3_500,  // Level 6
  5_500,  // Level 7
  8_000,  // Level 8
  11_500, // Level 9
  15_000, // Level 10
] as const

export const MAX_LEVEL = LEVEL_THRESHOLDS.length

// ── Level titles ─────────────────────────────────────────────────────────────

export const LEVEL_TITLES: Record<number, string> = {
  1:  'Beginner',
  2:  'Rookie',
  3:  'Consistent',
  4:  'Dedicated',
  5:  'Athlete',
  6:  'Champion',
  7:  'Elite',
  8:  'Master',
  9:  'Legend',
  10: 'FitLink Pro',
}

// ── Helper: compute level from total XP ──────────────────────────────────────

export function getLevelFromXp(totalXp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return Math.min(level, MAX_LEVEL)
}

// ── Helper: XP progress within the current level ─────────────────────────────
// Returns { current, required, pct } — how far through this level the user is.

export function getLevelProgress(totalXp: number): { current: number; required: number; pct: number } {
  const level     = getLevelFromXp(totalXp)
  const floorXp   = LEVEL_THRESHOLDS[level - 1] ?? 0
  const ceilingXp = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[MAX_LEVEL - 1]

  if (level >= MAX_LEVEL) {
    return { current: totalXp - floorXp, required: ceilingXp - floorXp, pct: 100 }
  }

  const current  = totalXp - floorXp
  const required = ceilingXp - floorXp
  const pct      = Math.min(100, Math.round((current / required) * 100))
  return { current, required, pct }
}

// ── Helper: compute streak from DailyProgressSnapshot records ─────────────────

export function computeStreakFromSnapshots(
  snapshots: { date: Date; streakCount: number }[],
): number {
  if (!snapshots.length) return 0
  // Snapshots ordered newest-first; return the most recent streakCount
  const sorted = [...snapshots].sort((a, b) => b.date.getTime() - a.date.getTime())
  return sorted[0].streakCount
}
