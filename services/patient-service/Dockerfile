FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev 

# Copy source code
COPY . .

ENV NODE_ENV=production

# Patient service listens on 8080 (see docker-compose and k8s manifests)
EXPOSE 8080

# server entrypoint lives at src/server.js in the project
CMD ["node", "src/server.js"]
