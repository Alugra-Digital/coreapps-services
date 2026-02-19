FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/notification-service/package*.json ./services/notification-service/
WORKDIR /app/services/notification-service
RUN npm install

COPY services/notification-service /app/services/notification-service

EXPOSE 3011
CMD ["npm", "start"]
