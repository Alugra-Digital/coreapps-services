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
COPY services/integration-service/package*.json ./services/integration-service/
WORKDIR /app/services/integration-service
RUN npm install

# Copy service source
COPY services/integration-service /app/services/integration-service

EXPOSE 3014
CMD ["npm", "start"]
