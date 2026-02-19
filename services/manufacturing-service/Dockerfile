FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/manufacturing-service/package*.json ./services/manufacturing-service/
WORKDIR /app/services/manufacturing-service
RUN npm install

COPY services/manufacturing-service /app/services/manufacturing-service

EXPOSE 3012
CMD ["npm", "start"]
