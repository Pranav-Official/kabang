import { db, kabangs, isDatabaseConnected, retryPostgresConnection } from './db'
import { eq, asc } from 'drizzle-orm'
import type { Kabang, NewKabang } from './db'

// Helper to handle DB errors gracefully
async function withDbFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    // Check if DB is connected (async now)
    const connected = await isDatabaseConnected()
    if (!connected) {
      // Try to reconnect if using PostgreSQL
      const reconnected = await retryPostgresConnection()
      if (!reconnected) {
        console.log('Database unavailable, using fallback')
        return fallback
      }
    }
    return await operation()
  } catch (error: any) {
    // Check if it's a connection error - handle all connection-related errors
    const errorMessage = error.message || String(error)
    if (errorMessage.includes('connection') || 
        errorMessage.includes('Client has encountered a connection error') ||
        errorMessage.includes('Connection terminated unexpectedly') ||
        errorMessage.includes('not queryable') ||
        errorMessage.includes('pool')) {
      console.error('Database connection issue (handled gracefully):', errorMessage)
      // Don't crash - just return fallback
      return fallback
    }
    console.error('Database operation failed:', error)
    return fallback
  }
}

export async function fetchAllBangs(): Promise<Array<{ bang: string; url: string }>> {
  return withDbFallback(
    () => db.select({ bang: kabangs.bang, url: kabangs.url }).from(kabangs),
    []
  )
}

export async function fetchBangByName(bang: string): Promise<string | null> {
  return withDbFallback(
    async () => {
      const result = await db
        .select({ url: kabangs.url })
        .from(kabangs)
        .where(eq(kabangs.bang, bang))
      return result[0]?.url ?? null
    },
    null
  )
}

export async function fetchBangInfoByName(bang: string): Promise<{ id: number; bang: string; url: string; name: string; category: string | null; isDefault: boolean } | null> {
  return withDbFallback(
    async () => {
      const result = await db
        .select({ id: kabangs.id, bang: kabangs.bang, url: kabangs.url, name: kabangs.name, category: kabangs.category, isDefault: kabangs.isDefault })
        .from(kabangs)
        .where(eq(kabangs.bang, bang))
      return result[0] ?? null
    },
    null
  )
}

export async function fetchDefaultUrl(): Promise<string | null> {
  return withDbFallback(
    async () => {
      const result = await db
        .select({ url: kabangs.url })
        .from(kabangs)
        .where(eq(kabangs.isDefault, true))
      return result[0]?.url ?? null
    },
    null
  )
}

export async function getAllKabangs(): Promise<Kabang[]> {
  return withDbFallback(
    () => db.select().from(kabangs).orderBy(asc(kabangs.createdAt)),
    []
  )
}

export async function getKabangById(id: number): Promise<Kabang | undefined> {
  try {
    const connected = await isDatabaseConnected()
    if (!connected) return undefined
    
    const result = await db.select().from(kabangs).where(eq(kabangs.id, id))
    return result[0]
  } catch (error) {
    console.error('Error getting kabang by ID:', error)
    return undefined
  }
}

export async function createKabang(data: NewKabang): Promise<Kabang> {
  try {
    const connected = await isDatabaseConnected()
    if (!connected) {
      throw new Error('Database not connected')
    }
    
    if (data.isDefault) {
      await db.update(kabangs).set({ isDefault: false }).where(eq(kabangs.isDefault, true))
    }
    const result = await db.insert(kabangs).values(data).returning()
    return result[0]
  } catch (error) {
    console.error('Error creating kabang:', error)
    throw error
  }
}

export async function updateKabang(id: number, data: Partial<NewKabang>): Promise<Kabang | null> {
  try {
    const connected = await isDatabaseConnected()
    if (!connected) {
      throw new Error('Database not connected')
    }
    
    if (data.isDefault) {
      await db.update(kabangs).set({ isDefault: false }).where(eq(kabangs.isDefault, true))
    }
    const result = await db.update(kabangs).set(data).where(eq(kabangs.id, id)).returning()
    return result[0] ?? null
  } catch (error) {
    console.error('Error updating kabang:', error)
    throw error
  }
}

export async function deleteKabang(id: number): Promise<Kabang | null> {
  try {
    const connected = await isDatabaseConnected()
    if (!connected) {
      throw new Error('Database not connected')
    }
    
    const result = await db.delete(kabangs).where(eq(kabangs.id, id)).returning()
    return result[0] ?? null
  } catch (error) {
    console.error('Error deleting kabang:', error)
    throw error
  }
}

export type ExportBang = {
  name: string
  bang: string
  url: string
  category: string | null
  isDefault: boolean
}

export async function exportBangs(): Promise<ExportBang[]> {
  return withDbFallback(
    () => db.select({
      name: kabangs.name,
      bang: kabangs.bang,
      url: kabangs.url,
      category: kabangs.category,
      isDefault: kabangs.isDefault,
    }).from(kabangs),
    []
  )
}

export async function importBangs(bangs: ExportBang[]): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = []
  let imported = 0

  try {
    const connected = await isDatabaseConnected()
    if (!connected) {
      throw new Error('Database not connected')
    }

    for (const bang of bangs) {
      try {
        // Validate required fields
        if (!bang.name || !bang.bang || !bang.url) {
          errors.push(`Skipping invalid bang: ${JSON.stringify(bang)}`)
          continue
        }

        // Check if bang already exists
        const existing = await db
          .select({ id: kabangs.id })
          .from(kabangs)
          .where(eq(kabangs.bang, bang.bang))

        if (existing[0]) {
          // Update existing
          await db
            .update(kabangs)
            .set({
              name: bang.name,
              url: bang.url,
              category: bang.category,
              isDefault: bang.isDefault,
            })
            .where(eq(kabangs.id, existing[0].id))
        } else {
          // Insert new
          await db.insert(kabangs).values({
            name: bang.name,
            bang: bang.bang,
            url: bang.url,
            category: bang.category,
            isDefault: bang.isDefault,
          })
        }
        imported++
      } catch (error) {
        errors.push(`Error importing bang "${bang.bang}": ${error}`)
      }
    }
  } catch (error) {
    console.error('Error during import:', error)
    throw error
  }

  return { imported, errors }
}
