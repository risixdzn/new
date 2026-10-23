function subsequenceMatch(
  q: string,
  t: string,
): { score: number; indices: number[] } | null {
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

    if (found === lastMatch + 1) score += 8
    if (found === 0 || /[\s/\-_.]/.test(t[found - 1] ?? '')) score += 6
    score += 1

    indices.push(found)
    lastMatch = found
    ti = found + 1
  }

  score -= t.length * 0.05
  return { score, indices }
}

export function fuzzyMatch(
  query: string,
  target: string,
): { score: number; indices: number[] } | null {
  const q = query.trim().toLowerCase()
  if (!q) return { score: 0, indices: [] }

  const t = target.toLowerCase()

  // Split into words so "api call" matches both "API" and "Call" individually
  // rather than requiring the entire phrase as a character subsequence.
  const words = q.split(/\s+/)
  if (words.length === 1) {
    return subsequenceMatch(q, t)
  }

  let totalScore = 0
  for (const word of words) {
    const m = subsequenceMatch(word, t)
    if (!m) return null
    totalScore += m.score
  }

  return { score: totalScore, indices: [] }
}
