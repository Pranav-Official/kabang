import type { Context } from 'hono'
import type { SpecialBangMetadata } from '../types'

export const metadata: SpecialBangMetadata = {
  name: 'Kabang Dashboard',
  description: 'Open the Kabang dashboard',
  category: 'System',
  usage: '!!kabang'
}

export async function handler(c: Context, _args: string): Promise<Response> {
  return c.redirect('/dashboard', 307)
}
