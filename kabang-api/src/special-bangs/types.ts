import type { Context } from 'hono'

export type SpecialBangHandler = (c: Context, args: string) => Promise<Response>

export interface SpecialBangMetadata {
  name: string
  description: string
  category: string
  usage: string
}

export interface RegisteredSpecialBang {
  handler: SpecialBangHandler
  metadata: SpecialBangMetadata
}
