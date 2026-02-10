import { Hono } from 'hono'
import { fetchBangInfoByName, fetchDefaultUrl } from '../db-service'
import { bangCache } from '../cache'
import { BANG_REGEX, buildSearchUrl } from '../utils'

const router = new Hono()

async function getBangUrl(bang: string): Promise<string | null> {
  // Always try cache first
  let url = bangCache.get(bang)
  if (url) return url

  // If not in cache, try DB (with graceful failure)
  const result = await fetchBangInfoByName(bang)
  if (result) {
    bangCache.setFull({
      id: result.id,
      bang: result.bang,
      url: result.url,
      name: result.name,
      category: result.category,
      isDefault: result.isDefault
    })
    return result.url
  }
  return null
}

async function getDefaultUrl(): Promise<string | null> {
  // Always try cache first
  let url = bangCache.getDefault()
  if (url) return url

  // If not in cache, try DB (with graceful failure)
  url = await fetchDefaultUrl()
  if (url) {
    bangCache.setDefault(url)
  }
  return url
}

router.get('/', async (c) => {
  const query = c.req.query('q')

  if (!query) {
    return c.json({ error: 'Missing query parameter' }, 400)
  }

  const match = query.match(BANG_REGEX)
  let url: string | null
  let searchTerms: string

  if (match) {
    const [, bang, terms] = match
    
    searchTerms = terms
    url = await getBangUrl(bang)

    if (!url) {
      // Bang not found, use default search with entire query including the bang
      url = await getDefaultUrl()
      if (!url) {
        return c.json({ error: 'No default search engine configured' }, 404)
      }
      // Use the entire query as search terms (including the bang)
      searchTerms = query
    }
  } else {
    searchTerms = query
    url = await getDefaultUrl()

    if (!url) {
      return c.json({ error: 'No default search engine configured' }, 404)
    }
  }

  const redirectUrl = buildSearchUrl(url, searchTerms)
  c.header('Cache-Control', 'private, max-age=60')
  return c.redirect(redirectUrl, 307)
})

export default router
