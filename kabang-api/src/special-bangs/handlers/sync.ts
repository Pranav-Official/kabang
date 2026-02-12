import type { Context } from 'hono'
import type { SpecialBangMetadata } from '../types'
import { bangCache } from '../../cache'
import { getAllKabangs } from '../../db-service'
import { loadTemplate, TEMPLATES } from '../../templates'

export const metadata: SpecialBangMetadata = {
  name: 'Sync Cache',
  description: 'Refresh cache from database',
  category: 'System',
  usage: '!!sync'
}

export async function handler(c: Context, _args: string): Promise<Response> {
  try {
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
