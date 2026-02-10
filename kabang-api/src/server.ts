import app from './index'

// Catch all unhandled errors to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message)
  // Don't exit - keep the server running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit - keep the server running
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 5674

console.log(`Starting Kabang API server on port ${port}...`)

const server = Bun.serve({
  port,
  fetch: app.fetch,
})

console.log(`Server running at http://localhost:${server.port}`)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.stop()
  process.exit(0)
})
