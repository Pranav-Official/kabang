import type { Context } from 'hono'
import { dispatchSpecialBang, getAllSpecialBangs } from './special-bangs'

export const BANG_REGEX = /^!!?(\w+)\s*(.*)$/
export const SPECIAL_BANG_REGEX = /^!!(\w+)\s*(.*)$/

// Export special bangs metadata for suggestions
export const SPECIAL_BANGS = getAllSpecialBangs()

export function parseIdParam(param: string): number | null {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

export function buildSearchUrl(template: string, query: string): string {
  return template.replace('{query}', encodeURIComponent(query).replace(/%20/g, '+'))
}

// Handle special bangs (!!kabang, !!add, !!sync)
// Returns a response if it's a special bang, null otherwise
export async function handleSpecialBang(c: Context, query: string): Promise<Response | null> {
  const match = query.match(SPECIAL_BANG_REGEX)
  if (!match) return null

  const [, bang, terms] = match

  // Dispatch to the registered handler
  return await dispatchSpecialBang(c, bang, terms)
}
