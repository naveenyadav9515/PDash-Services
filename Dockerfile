FROM node:24-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
