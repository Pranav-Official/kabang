# Use official Bun image (compatible with Docker and Podman)
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy entire project
COPY . .

# Install dependencies for both packages
WORKDIR /app/kabang-ui
RUN bun install

WORKDIR /app/kabang-api
RUN bun install

# Build the UI (this also copies it to the API's public folder)
RUN bun run build-ui

# Expose the API port
EXPOSE 5674

# Health check to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:5674/api/bangs').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the API server (with seed on startup)
CMD ["sh", "-c", "bun run seed && bun run src/server.ts"]
