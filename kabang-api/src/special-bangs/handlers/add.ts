import type { Context } from 'hono'
import type { SpecialBangMetadata } from '../types'
import { bangCache } from '../../cache'
import { fetchBangInfoByName, createKabang } from '../../db-service'
import { isDatabaseConnected } from '../../db'
import { loadTemplate, TEMPLATES } from '../../templates'

export const metadata: SpecialBangMetadata = {
  name: 'Add Bookmark',
  description: 'Add a new bookmark (format: !!add <name> <url>)',
  category: 'System',
  usage: '!!add <bookmark-name> <url>'
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

export async function handler(c: Context, args: string): Promise<Response> {
  const parts = args.trim().split(/\s+/)
  
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
