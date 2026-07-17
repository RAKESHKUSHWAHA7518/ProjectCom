FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Run as non-root user (node user exists in node:alpine with UID 1000)
USER node

EXPOSE 5000

CMD ["node", "server.js"]
