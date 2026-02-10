import { db, kabangs } from './db'
import { eq } from 'drizzle-orm'
import type { Kabang, NewKabang } from './db'

export async function fetchAllBangs(): Promise<Array<{ bang: string; url: string }>> {
  return db.select({ bang: kabangs.bang, url: kabangs.url }).from(kabangs)
}

export async function fetchBangByName(bang: string): Promise<string | null> {
  const result = await db
    .select({ url: kabangs.url })
    .from(kabangs)
    .where(eq(kabangs.bang, bang))
  return result[0]?.url ?? null
}

export async function fetchDefaultUrl(): Promise<string | null> {
  const result = await db
    .select({ url: kabangs.url })
    .from(kabangs)
    .where(eq(kabangs.isDefault, true))
  return result[0]?.url ?? null
}

export async function getAllKabangs(): Promise<Kabang[]> {
  return db.select().from(kabangs)
}

export async function getKabangById(id: number): Promise<Kabang | undefined> {
  const result = await db.select().from(kabangs).where(eq(kabangs.id, id))
  return result[0]
}

export async function createKabang(data: NewKabang): Promise<Kabang> {
  if (data.isDefault) {
    await db.update(kabangs).set({ isDefault: false }).where(eq(kabangs.isDefault, true))
  }
  const result = await db.insert(kabangs).values(data).returning()
  return result[0]
}

export async function updateKabang(id: number, data: Partial<NewKabang>): Promise<Kabang | null> {
  if (data.isDefault) {
    await db.update(kabangs).set({ isDefault: false }).where(eq(kabangs.isDefault, true))
  }
  const result = await db.update(kabangs).set(data).where(eq(kabangs.id, id)).returning()
  return result[0] ?? null
}

export async function deleteKabang(id: number): Promise<Kabang | null> {
  const result = await db.delete(kabangs).where(eq(kabangs.id, id)).returning()
  return result[0] ?? null
}

export type ExportBang = {
  name: string
  bang: string
  url: string
  category: string | null
  isDefault: boolean
}

export async function exportBangs(): Promise<ExportBang[]> {
  return db.select({
    name: kabangs.name,
    bang: kabangs.bang,
    url: kabangs.url,
    category: kabangs.category,
    isDefault: kabangs.isDefault,
  }).from(kabangs)
}

export async function importBangs(bangs: ExportBang[]): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = []
  let imported = 0

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

  return { imported, errors }
}
