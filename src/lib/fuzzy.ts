/**
 * Lightweight subsequence fuzzy matcher.
 * Returns a score (higher is better) and the matched character indices,
 * or null when the query is not a subsequence of the target.
 */
export function fuzzyMatch(
  query: string,
  target: string,
): { score: number; indices: number[] } | null {
  const q = query.trim().toLowerCase()
  if (!q) return { score: 0, indices: [] }

  const t = target.toLowerCase()
  const indices: number[] = []
  let score = 0
  let ti = 0
  let lastMatch = -2

  for (let qi = 0; qi < q.length; qi++) {
    const char = q[qi]
    let found = -1
    for (; ti < t.length; ti++) {
      if (t[ti] === char) {
        found = ti
        break
      }
    }
    if (found === -1) return null

    // Reward consecutive matches and matches at word boundaries.
    if (found === lastMatch + 1) score += 8
    if (found === 0 || /[\s/\-_.]/.test(t[found - 1] ?? '')) score += 6
    score += 1

    indices.push(found)
    lastMatch = found
    ti = found + 1
  }

  // Prefer shorter targets when scores are otherwise close.
  score -= t.length * 0.05
  return { score, indices }
}
