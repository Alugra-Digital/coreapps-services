FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/asset-service/package*.json ./services/asset-service/
WORKDIR /app/services/asset-service
RUN npm install

COPY services/asset-service /app/services/asset-service

EXPOSE 3013
CMD ["npm", "start"]
