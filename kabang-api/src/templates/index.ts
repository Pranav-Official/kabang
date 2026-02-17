import { readFileSync } from 'fs'
import { join } from 'path'

const TEMPLATES_DIR = join(process.cwd(), 'src', 'templates')

// Simple template cache
const templateCache = new Map<string, string>()

export function loadTemplate(filename: string, variables?: Record<string, string>): string {
  // Check cache first
  let content = templateCache.get(filename)
  
  if (!content) {
    try {
      const filepath = join(TEMPLATES_DIR, filename)
      content = readFileSync(filepath, 'utf-8')
      templateCache.set(filename, content)
    } catch (error) {
      console.error(`Failed to load template: ${filename}`, error)
      return `<html><body><h1>Error</h1><p>Failed to load template: ${filename}</p></body></html>`
    }
  }
  
  // Replace variables
  if (variables) {
    let result = content
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }
  
  return content
}

// Template names
export const TEMPLATES = {
  ADD_INVALID_FORMAT: 'add-invalid-format.html',
  ADD_INVALID_URL: 'add-invalid-url.html',
  ADD_DB_ERROR: 'add-db-error.html',
  ADD_EXISTS: 'add-exists.html',
  ADD_DB_CONNECTION_ERROR: 'add-db-connection-error.html',
  ADD_SUCCESS: 'add-success.html',
  SYNC_SUCCESS: 'sync-success.html',
  SYNC_ERROR: 'sync-error.html',
  MARK_INVALID_FORMAT: 'mark-invalid-format.html',
  MARK_INVALID_URL: 'mark-invalid-url.html',
  MARK_DB_ERROR: 'mark-db-error.html',
  MARK_DB_CONNECTION_ERROR: 'mark-db-connection-error.html',
} as const
