import type { Context } from 'hono'
import type { SpecialBangHandler, SpecialBangMetadata, RegisteredSpecialBang } from './types'

// Import all handlers
import * as kabangHandler from './handlers/kabang'
import * as syncHandler from './handlers/sync'
import * as addHandler from './handlers/add'

// Registry map
const registry = new Map<string, RegisteredSpecialBang>()

// Register a special bang
export function registerSpecialBang(
  name: string, 
  handler: SpecialBangHandler, 
  metadata: SpecialBangMetadata
): void {
  registry.set(name.toLowerCase(), { handler, metadata })
}

// Get a handler by name
export function getSpecialBangHandler(name: string): SpecialBangHandler | null {
  const registered = registry.get(name.toLowerCase())
  return registered?.handler || null
}

// Get metadata for a special bang
export function getSpecialBangMetadata(name: string): SpecialBangMetadata | null {
  const registered = registry.get(name.toLowerCase())
  return registered?.metadata || null
}

// Get all registered special bangs
export function getAllSpecialBangs(): Map<string, SpecialBangMetadata> {
  const result = new Map<string, SpecialBangMetadata>()
  for (const [name, registered] of registry.entries()) {
    result.set(name, registered.metadata)
  }
  return result
}

// Check if a bang is registered
export function isSpecialBang(name: string): boolean {
  return registry.has(name.toLowerCase())
}

// Dispatch to a handler
export async function dispatchSpecialBang(
  c: Context, 
  name: string, 
  args: string
): Promise<Response | null> {
  const handler = getSpecialBangHandler(name)
  if (!handler) {
    return null
  }
  return await handler(c, args)
}

// Initialize registry with built-in handlers
export function initializeSpecialBangs(): void {
  registerSpecialBang('kabang', kabangHandler.handler, kabangHandler.metadata)
  registerSpecialBang('sync', syncHandler.handler, syncHandler.metadata)
  registerSpecialBang('add', addHandler.handler, addHandler.metadata)
}

// Auto-initialize on import
initializeSpecialBangs()
