import { Hono } from 'hono'
import { fetchBangByName, fetchDefaultUrl } from '../db-service'
import { bangCache } from '../cache'
import { BANG_REGEX, buildSearchUrl } from '../utils'

const router = new Hono()

async function getBangUrl(bang: string): Promise<string | null> {
  let url = bangCache.get(bang)
  if (url) return url

  url = await fetchBangByName(bang)
  if (url) {
    bangCache.set(bang, url)
  }
  return url
}

async function getDefaultUrl(): Promise<string | null> {
  let url = bangCache.getDefault()
  if (url) return url

  url = await fetchDefaultUrl()
  bangCache.setDefault(url)
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
    
    // Special case: !kabang redirects to the dashboard
    if (bang.toLowerCase() === 'kabang') {
      return c.redirect('/dashboard', 307)
    }
    
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
