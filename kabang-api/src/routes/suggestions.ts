import { Hono } from 'hono'
import { bangCache } from '../cache'
import { BANG_REGEX } from '../utils'
import { getAllSpecialBangs } from '../special-bangs'

const router = new Hono()

function fuzzyMatch(query: string, target: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerTarget = target.toLowerCase()

  if (lowerTarget === lowerQuery) return 1.0
  if (lowerTarget.startsWith(lowerQuery)) return 0.9
  if (lowerTarget.includes(lowerQuery)) return 0.7

  let score = 0
  let queryIdx = 0

  for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
    if (lowerTarget[i] === lowerQuery[queryIdx]) {
      score++
      queryIdx++
    }
  }

  if (queryIdx === lowerQuery.length) {
    return 0.5 * (score / lowerTarget.length)
  }

  return 0
}

router.get('/', async (c) => {
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '5', 10)

  // OpenSearch format: [query, suggestions[], descriptions[], urls[]]
  const openSearchResponse: [string, string[], string[], string[]] = [
    query,
    [],
    [],
    []
  ]

  // If a bang is already detected (!bang), check if it's a valid bang
  const bangMatch = query.match(BANG_REGEX)
  if (bangMatch) {
    const detectedBang = bangMatch[1]
    const bangUrl = bangCache.get(detectedBang)
    if (bangUrl) {
      // Valid bang detected, return empty suggestions
      c.header('Cache-Control', 'private, max-age=5')
      return c.json(openSearchResponse)
    }
  }

  // If query doesn't start with !, don't suggest
  if (!query.startsWith('!')) {
    c.header('Cache-Control', 'private, max-age=5')
    return c.json(openSearchResponse)
  }

  const allBangs = bangCache.getAllBangs()
  const searchTerm = query.slice(1).toLowerCase()

  // Get regular bangs
  let scoredBangs = allBangs
    .map(b => {
      const nameScore = fuzzyMatch(searchTerm, b.name)
      const bangScore = fuzzyMatch(searchTerm, b.bang)
      const maxScore = Math.max(nameScore, bangScore)

      return {
        bang: b.bang,
        name: b.name,
        url: b.url,
        category: b.category,
        score: maxScore,
        isSpecial: false
      }
    })
    .filter(b => b.score > 0)

  // Get special bangs (those with !! prefix)
  const specialBangEntries = Object.entries(getAllSpecialBangs())
    .map(([key, value]) => {
      const nameScore = fuzzyMatch(searchTerm, value.name)
      const bangScore = fuzzyMatch(searchTerm, key)
      const maxScore = Math.max(nameScore, bangScore)

      return {
        bang: key,
        name: value.name,
        url: '',
        category: value.category,
        score: maxScore,
        isSpecial: true,
        description: value.description
      }
    })
    .filter(b => b.score > 0)

  // Combine and sort all bangs
  scoredBangs = [...scoredBangs, ...specialBangEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // Map to OpenSearch format - suggestions with name/category descriptions
  // Special bangs use !! prefix, regular bangs use ! prefix
  openSearchResponse[1] = scoredBangs.map(b => b.isSpecial ? `!!${b.bang}` : `!${b.bang}`)
  openSearchResponse[2] = scoredBangs.map(b => `${b.name}${b.category ? ` (${b.category})` : ''}`)

  c.header('Cache-Control', 'private, max-age=5')
  return c.json(openSearchResponse)
})

export default router
