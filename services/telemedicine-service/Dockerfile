# Telemedicine service Docker image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy service code
COPY . .

ENV NODE_ENV=production

# Service listens on 5005 by default (can be overridden via PORT env)
EXPOSE 5005

CMD ["node", "src/server.js"]