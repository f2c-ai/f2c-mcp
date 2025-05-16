FROM node:22.12-alpine AS builder
 
COPY ./ /app
 
WORKDIR /app
 
RUN --mount=type=cache,target=/root/.npm npm install
RUN npm run build
 
FROM node:22.12-alpine AS release
 
WORKDIR /app
 
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/chatmcp.yaml /app/chatmcp.yaml
 
ENV NODE_ENV=production
 
RUN npm ci --ignore-scripts --omit-dev
 
ENTRYPOINT ["node", "dist/stdio.js"]