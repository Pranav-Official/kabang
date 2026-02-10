import type { Context } from 'hono'
import { fetchBangInfoByName, createKabang } from '../db-service'
import { bangCache } from '../cache'
import { isDatabaseConnected } from '../db'
import { BANG_REGEX } from '../utils'

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

// Handle special bangs (!kabang, !add)
// Returns a response if it's a special bang, null otherwise
export async function handleSpecialBang(c: Context, query: string): Promise<Response | null> {
  const match = query.match(BANG_REGEX)
  if (!match) return null

  const [, bang, terms] = match

  // !kabang - Redirect to dashboard
  if (bang.toLowerCase() === 'kabang') {
    return c.redirect('/dashboard', 307)
  }

  // !add <name> <url> - Create bookmark and redirect to URL
  if (bang.toLowerCase() === 'add') {
    const parts = terms.trim().split(/\s+/)
    
    if (parts.length < 2) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Format</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .message { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .error { color: #dc2626; }
            code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
            .back { margin-top: 1.5rem; }
            .back a { color: #4f46e5; text-decoration: none; }
            .back a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="message">
            <h2 class="error">❌ Invalid Format</h2>
            <p>Usage: <code>!add &lt;bookmark-name&gt; &lt;url&gt;</code></p>
            <p>Example: <code>!add github https://github.com</code></p>
            <div class="back">
              <a href="/dashboard">← Back to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `)
    }

    const bookmarkBang = parts[0]
    const bookmarkUrl = parts[1]

    // Validate URL
    try {
      new URL(bookmarkUrl)
    } catch {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid URL</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .message { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .error { color: #dc2626; }
            .back { margin-top: 1.5rem; }
            .back a { color: #4f46e5; text-decoration: none; }
            .back a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="message">
            <h2 class="error">❌ Invalid URL</h2>
            <p>The URL provided is not valid.</p>
            <div class="back">
              <a href="/dashboard">← Back to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `)
    }

    try {
      // Check if database is connected
      const connected = await isDatabaseConnected()
      if (!connected) {
        return c.html(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bookmark Error</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .message { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .error { color: #dc2626; }
              .back { margin-top: 1.5rem; }
              .back a { color: #4f46e5; text-decoration: none; }
              .back a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="message">
              <h2 class="error">⚠️ Database Unavailable</h2>
              <p>Cannot add bookmark at this time. Please try again later.</p>
              <div class="back">
                <a href="/dashboard">← Back to Dashboard</a>
              </div>
            </div>
          </body>
          </html>
        `)
      }

      // Check if bang already exists
      const existing = await getBangUrl(bookmarkBang)
      if (existing) {
        return c.html(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bookmark Exists</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .message { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .error { color: #dc2626; }
              code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
              .back { margin-top: 1.5rem; }
              .back a { color: #4f46e5; text-decoration: none; }
              .back a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="message">
              <h2 class="error">⚠️ Already Exists</h2>
              <p>The bang <code>!${bookmarkBang}</code> already exists.</p>
              <p>Try a different name or update it in the dashboard.</p>
              <div class="back">
                <a href="/dashboard">← Back to Dashboard</a>
              </div>
            </div>
          </body>
          </html>
        `)
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
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Database Error</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .message { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .error { color: #dc2626; }
            .back { margin-top: 1.5rem; }
            .back a { color: #4f46e5; text-decoration: none; }
            .back a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="message">
            <h2 class="error">⚠️ Database Error</h2>
            <p>Unable to create bookmark. The database connection was lost.</p>
            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Please try again later.</p>
            <div class="back">
              <a href="/dashboard">← Back to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `)
    }
  }

  return null
}
