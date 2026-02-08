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

# Seed the database with base collection
RUN bun run seed

# Expose the API port
EXPOSE 5674

# Start the API server
CMD ["bun", "run", "src/server.ts"]
