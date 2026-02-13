import type { Context } from 'hono'
import type { SpecialBangMetadata } from '../types'
import { createBookmark } from '../../db-service'
import { isDatabaseConnected } from '../../db'
import { loadTemplate, TEMPLATES } from '../../templates'

export const metadata: SpecialBangMetadata = {
  name: 'Bookmark',
  description: 'Save a bookmark with notes (format: !!mark "notes" <url>)',
  category: 'Bookmarks',
  usage: '!!mark "meeting notes about project" https://example.com'
}

// Parse arguments: "notes" url
// Handles both: !!mark "notes" url  and  !!mark url "notes"
function parseArgs(args: string): { notes: string | null; url: string | null } {
  const trimmed = args.trim()
  
  if (!trimmed) {
    return { notes: null, url: null }
  }
  
  // Try to extract quoted text
  const quoteMatch = trimmed.match(/^["'](.+?)["']\s+(.+)$/)
  if (quoteMatch) {
    return { 
      notes: quoteMatch[1].trim(), 
      url: quoteMatch[2].trim() 
    }
  }
  
  // Try: url "notes" format
  const urlFirstMatch = trimmed.match(/^(.+?)\s+["'](.+?)["']$/)
  if (urlFirstMatch) {
    return { 
      url: urlFirstMatch[1].trim(), 
      notes: urlFirstMatch[2].trim() 
    }
  }
  
  // Just URL with no notes
  // Check if first word looks like a URL
  const firstWord = trimmed.split(/\s+/)[0]
  if (firstWord.startsWith('http://') || firstWord.startsWith('https://')) {
    return { notes: null, url: firstWord }
  }
  
  // Last word might be URL
  const lastWord = trimmed.split(/\s+/).pop()
  if (lastWord && (lastWord.startsWith('http://') || lastWord.startsWith('https://'))) {
    return { notes: trimmed.slice(0, -lastWord.length).trim(), url: lastWord }
  }
  
  return { notes: null, url: null }
}

export async function handler(c: Context, args: string): Promise<Response> {
  const { notes, url } = parseArgs(args)
  
  if (!url) {
    return c.html(loadTemplate(TEMPLATES.MARK_INVALID_FORMAT))
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return c.html(loadTemplate(TEMPLATES.MARK_INVALID_URL))
  }

  try {
    // Check if database is connected
    const connected = await isDatabaseConnected()
    if (!connected) {
      return c.html(loadTemplate(TEMPLATES.MARK_DB_ERROR))
    }

    // Create the bookmark
    await createBookmark({
      url,
      notes,
      category: null
    })

    // Refresh the page by returning HTML with meta refresh
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${url}">
        <title>Bookmark Saved</title>
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
          a { color: #667eea; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Bookmark Saved!</h1>
          <p>Redirecting to <a href="${url}">${url}</a>...</p>
          <p><small>Click the link if you are not redirected automatically.</small></p>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return c.html(loadTemplate(TEMPLATES.MARK_DB_CONNECTION_ERROR))
  }
}
