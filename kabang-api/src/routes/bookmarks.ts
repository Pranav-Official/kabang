import { Hono } from 'hono'
import { getAllBookmarks, getBookmarkById, createBookmark, updateBookmark, deleteBookmark } from '../db-service'
import { isDatabaseConnected } from '../db'

const router = new Hono()

router.get('/', async (c) => {
  try {
    const bookmarks = await getAllBookmarks()
    return c.json(bookmarks)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return c.json({ error: 'Failed to fetch bookmarks' }, 500)
  }
})

router.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  const bookmark = await getBookmarkById(id)
  if (!bookmark) {
    return c.json({ error: 'Bookmark not found' }, 404)
  }

  return c.json(bookmark)
})

router.put('/:id', async (c) => {
  if (!(await isDatabaseConnected())) {
    return c.json({ error: 'Database unavailable. Cannot update bookmark at this time.' }, 503)
  }

  const id = parseInt(c.req.param('id'))
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { url, notes, category } = body as { url?: string; notes?: string; category?: string }

  if (url) {
    try {
      new URL(url)
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400)
    }
  }

  try {
    const bookmark = await updateBookmark(id, { url, notes, category })
    if (!bookmark) {
      return c.json({ error: 'Bookmark not found' }, 404)
    }
    return c.json(bookmark)
  } catch (error) {
    console.error('Error updating bookmark:', error)
    return c.json({ error: 'Failed to update bookmark' }, 500)
  }
})

router.delete('/:id', async (c) => {
  if (!(await isDatabaseConnected())) {
    return c.json({ error: 'Database unavailable. Cannot delete bookmark at this time.' }, 503)
  }

  const id = parseInt(c.req.param('id'))
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID format' }, 400)
  }

  try {
    const bookmark = await deleteBookmark(id)
    if (!bookmark) {
      return c.json({ error: 'Bookmark not found' }, 404)
    }
    return c.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return c.json({ error: 'Failed to delete bookmark' }, 500)
  }
})

export default router
