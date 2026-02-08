import { Hono } from 'hono'
import { getAllKabangs, getKabangById, createKabang, updateKabang, deleteKabang, exportBangs, importBangs, type ExportBang } from '../db-service'
import { bangCache } from '../cache'
import { validateCreateBody, validateUpdateBody } from '../validation'
import { parseIdParam } from '../utils'

const router = new Hono()

async function refreshCache(): Promise<void> {
  bangCache.clear()
  const allKabangs = await getAllKabangs()
  allKabangs.forEach(({ bang, url, name, category }) => {
    bangCache.setFull({ bang, url, name, category })
  })
  console.log(`Cache refreshed: ${bangCache.size()} bangs`)
}

router.get('/', async (c) => {
  const allKabangs = await getAllKabangs()
  return c.json(allKabangs)
})

router.get('/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))
  if (id === null) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  const kabang = await getKabangById(id)
  if (!kabang) {
    return c.json({ error: 'Kabang not found' }, 404)
  }

  return c.json(kabang)
})

router.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const validation = validateCreateBody(body)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  try {
    const kabang = await createKabang(validation.data)
    await refreshCache()
    return c.json(kabang, 201)
  } catch (error) {
    console.error('Error creating kabang:', error)
    return c.json({ error: 'Failed to create kabang. Bang or URL may already exist.' }, 409)
  }
})

router.put('/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))
  if (id === null) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const validation = validateUpdateBody(body)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  try {
    const kabang = await updateKabang(id, validation.data)
    if (!kabang) {
      return c.json({ error: 'Kabang not found' }, 404)
    }
    await refreshCache()
    return c.json(kabang)
  } catch (error) {
    console.error('Error updating kabang:', error)
    return c.json({ error: 'Failed to update kabang. Bang or URL may already exist.' }, 409)
  }
})

router.delete('/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))
  if (id === null) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  try {
    const kabang = await deleteKabang(id)
    if (!kabang) {
      return c.json({ error: 'Kabang not found' }, 404)
    }
    await refreshCache()
    return c.json({ message: 'Kabang deleted successfully' })
  } catch (error) {
    console.error('Error deleting kabang:', error)
    return c.json({ error: 'Failed to delete kabang' }, 500)
  }
})

router.get('/export/json', async (c) => {
  try {
    const bangs = await exportBangs()
    c.header('Content-Type', 'application/json')
    c.header('Content-Disposition', 'attachment; filename="kabangs.json"')
    return c.json(bangs)
  } catch (error) {
    console.error('Error exporting bangs:', error)
    return c.json({ error: 'Failed to export bangs' }, 500)
  }
})

router.post('/import/json', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  // Validate that body is an array
  if (!Array.isArray(body)) {
    return c.json({ error: 'Body must be an array of bangs' }, 400)
  }

  // Validate each item has required fields
  const bangs = body as ExportBang[]
  const invalidBangs = bangs.filter(
    (b) => !b.name || !b.bang || !b.url
  )
  
  if (invalidBangs.length > 0) {
    return c.json({ 
      error: 'Some bangs are missing required fields (name, bang, url)', 
      invalidBangs 
    }, 400)
  }

  try {
    const result = await importBangs(bangs)
    await refreshCache()
    return c.json({ 
      message: 'Import completed',
      imported: result.imported,
      errors: result.errors
    })
  } catch (error) {
    console.error('Error importing bangs:', error)
    return c.json({ error: 'Failed to import bangs' }, 500)
  }
})

export default router
