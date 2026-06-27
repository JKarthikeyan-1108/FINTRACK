FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine

# Non-root user for security
RUN addgroup -S fintrack && adduser -S fintrack -G fintrack

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create startup script that inits DB then starts server
RUN printf '#!/bin/sh\necho "Initializing DB..."\nnode config/initDB.js && echo "DB ready"\nexec node server.js\n' > /app/start.sh && chmod +x /app/start.sh
RUN chown -R fintrack:fintrack /app

USER fintrack
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["/app/start.sh"]
