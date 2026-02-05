import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { fetchAllBangs } from './db-service'
import { bangCache } from './cache'
import kabangsRouter from './routes/kabangs'
import searchRouter from './routes/search'

const app = new Hono()

// Middleware
app.use(compress())
if (process.env.NODE_ENV !== 'production') {
  app.use(logger())
}

// Initialize cache
async function initializeCache(): Promise<void> {
  const allBangs = await fetchAllBangs()
  allBangs.forEach(({ bang, url }) => bangCache.set(bang, url))
  console.log(`Cache initialized: ${bangCache.size()} bangs`)
}

initializeCache().catch(console.error)

// Routes
app.get('/', (c) => c.text('Hello Hono!'))
app.route('/kabangs', kabangsRouter)
app.route('/search', searchRouter)

export default app
