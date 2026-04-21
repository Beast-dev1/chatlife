FROM node:20-slim

WORKDIR /app

# Ensure OpenSSL is available for Prisma query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for prisma)
RUN npm install

# Copy prisma schema for generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

# Build TypeScript output used by npm start
RUN npm run build

EXPOSE 4000

# Default command - overridden by docker-compose
CMD ["npm", "start"]
