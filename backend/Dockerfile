FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for prisma)
RUN npm install

# Copy prisma schema for generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

EXPOSE 4000

# Default command - overridden by docker-compose
CMD ["npm", "run", "dev"]
