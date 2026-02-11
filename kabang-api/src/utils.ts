import type { Context } from 'hono'
import { fetchBangInfoByName, createKabang } from './db-service'
import { bangCache } from './cache'
import { isDatabaseConnected } from './db'
import { loadTemplate, TEMPLATES } from './templates'

export const BANG_REGEX = /^!(\w+)\s*(.*)$/

export function parseIdParam(param: string): number | null {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

export function buildSearchUrl(template: string, query: string): string {
  return template.replace('{query}', encodeURIComponent(query).replace(/%20/g, '+'))
}

async function getBangUrl(bang: string): Promise<string | null> {
  let url = bangCache.get(bang)
  if (url) return url

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

// Handle special bangs (!kabang, !add, !sync)
// Returns a response if it's a special bang, null otherwise
export async function handleSpecialBang(c: Context, query: string): Promise<Response | null> {
  const match = query.match(BANG_REGEX)
  if (!match) return null

  const [, bang, terms] = match

  // !kabang - Redirect to dashboard
  if (bang.toLowerCase() === 'kabang') {
    return c.redirect('/dashboard', 307)
  }

  // !sync - Discard cache and reload from database
  if (bang.toLowerCase() === 'sync') {
    try {
      // Import getAllKabangs here to avoid circular dependency
      const { getAllKabangs } = await import('./db-service')
      
      // Clear cache
      bangCache.clear()
      
      // Reload from database
      const allKabangs = await getAllKabangs()
      
      if (allKabangs.length > 0) {
        allKabangs.forEach(({ id, bang, url, name, category, isDefault }) => {
          bangCache.setFull({ 
            id, 
            bang, 
            url, 
            name: name || bang, 
            category: category || null,
            isDefault: isDefault || false
          })
          if (isDefault && url) {
            bangCache.setPermanentDefault(url)
          }
        })
      }
      
      return c.html(loadTemplate(TEMPLATES.SYNC_SUCCESS, { count: String(allKabangs.length) }))
    } catch (error) {
      console.error('Error syncing cache:', error)
      return c.html(loadTemplate(TEMPLATES.SYNC_ERROR))
    }
  }

  // !add <name> <url> - Create bookmark and redirect to URL
  if (bang.toLowerCase() === 'add') {
    const parts = terms.trim().split(/\s+/)
    
    if (parts.length < 2) {
      return c.html(loadTemplate(TEMPLATES.ADD_INVALID_FORMAT))
    }

    const bookmarkBang = parts[0]
    const bookmarkUrl = parts[1]

    // Validate URL
    try {
      new URL(bookmarkUrl)
    } catch {
      return c.html(loadTemplate(TEMPLATES.ADD_INVALID_URL))
    }

    try {
      // Check if database is connected
      const connected = await isDatabaseConnected()
      if (!connected) {
        return c.html(loadTemplate(TEMPLATES.ADD_DB_ERROR))
      }

      // Check if bang already exists
      const existing = await getBangUrl(bookmarkBang)
      if (existing) {
        return c.html(loadTemplate(TEMPLATES.ADD_EXISTS, { bookmarkName: bookmarkBang }))
      }

      // Create the bookmark
      await createKabang({
        name: bookmarkBang,
        bang: bookmarkBang,
        url: bookmarkUrl,
        category: 'Bookmarks',
        isDefault: false
      })

      // Refresh cache
      bangCache.setFull({
        id: 0,
        bang: bookmarkBang,
        url: bookmarkUrl,
        name: bookmarkBang,
        category: 'Bookmarks',
        isDefault: false
      })

      // Redirect to the bookmarked URL
      return c.redirect(bookmarkUrl, 307)
    } catch (error) {
      console.error('Error creating bookmark:', error)
      return c.html(loadTemplate(TEMPLATES.ADD_DB_CONNECTION_ERROR))
    }
  }

  return null
}
