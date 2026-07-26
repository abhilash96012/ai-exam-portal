# Node.js 20 base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules if needed (e.g. sqlite3 or bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start backend server
CMD ["npm", "start"]
