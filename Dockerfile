FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install --ignore-scripts

# Copy application code
COPY . .

# Build the application
RUN pnpm run build

# Command will be provided by smithery.yaml
CMD ["node", "dist/stdio.js"]