import app from './index'

const port = process.env.PORT ? parseInt(process.env.PORT) : 5674

console.log(`Starting Kabang API server on port ${port}...`)

const server = Bun.serve({
  port,
  fetch: app.fetch,
})

console.log(`Server running at http://localhost:${server.port}`)
