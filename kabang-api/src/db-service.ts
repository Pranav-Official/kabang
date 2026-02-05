import { db } from './db'
import { kabangs } from './schema'
import { eq } from 'drizzle-orm'
import type { Kabang, NewKabang } from './schema'

export async function fetchAllBangs(): Promise<Array<{ bang: string; url: string }>> {
  return db.select({ bang: kabangs.bang, url: kabangs.url }).from(kabangs)
}

export async function fetchBangByName(bang: string): Promise<string | null> {
  const result = await db
    .select({ url: kabangs.url })
    .from(kabangs)
    .where(eq(kabangs.bang, bang))
    .get()
  return result?.url ?? null
}

export async function fetchDefaultUrl(): Promise<string | null> {
  const result = await db
    .select({ url: kabangs.url })
    .from(kabangs)
    .where(eq(kabangs.isDefault, true))
    .get()
  return result?.url ?? null
}

export async function getAllKabangs(): Promise<Kabang[]> {
  return db.select().from(kabangs)
}

export async function getKabangById(id: number): Promise<Kabang | undefined> {
  return db.select().from(kabangs).where(eq(kabangs.id, id)).get()
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
