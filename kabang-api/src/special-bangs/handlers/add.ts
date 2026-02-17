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

    // Show success page with redirect
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${bookmarkUrl}">
        <title>Bang Created</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
          }
          .icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { color: #333; margin-bottom: 0.5rem; }
          p { color: #666; }
          .bang-name { 
            color: #667eea; 
            font-weight: bold; 
            font-family: monospace;
            background: #f0f0f0;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
          }
          a { color: #667eea; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Bang Created!</h1>
          <p>Created bang <span class="bang-name">!${bookmarkBang}</span></p>
          <p>Redirecting to <a href="${bookmarkUrl}">${bookmarkUrl}</a>...</p>
          <p><small>Click the link if you are not redirected automatically.</small></p>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return c.html(loadTemplate(TEMPLATES.ADD_DB_CONNECTION_ERROR))
  }
}
