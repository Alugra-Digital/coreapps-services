FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/inventory-service/package*.json ./services/inventory-service/
WORKDIR /app/services/inventory-service
RUN npm install

COPY services/inventory-service /app/services/inventory-service

EXPOSE 3005
CMD ["npm", "start"]
