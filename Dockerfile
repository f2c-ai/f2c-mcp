FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

COPY bun.lock ./
# Install dependencies
RUN bun install

# Copy application code
COPY . .

# Build the application
RUN bun run build

# Command will be provided by smithery.yaml
CMD ["node", "dist/stdio.js"]
