FROM node:20-alpine
WORKDIR /app

# Copy shared to /app/shared (depth-3 imports from src/server.js resolve here)
COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

# Symlink /app/services/shared -> /app/shared (depth-4 imports from src/routes/*.js resolve here)
RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

# Install service dependencies
WORKDIR /app
COPY services/auth-service/package*.json ./services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install

# Copy service source
COPY services/auth-service /app/services/auth-service

EXPOSE 3001
CMD ["npm", "start"]
