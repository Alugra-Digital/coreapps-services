FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/analytics-service/package*.json ./services/analytics-service/
WORKDIR /app/services/analytics-service
RUN npm install

COPY services/analytics-service /app/services/analytics-service

EXPOSE 3010
CMD ["npm", "start"]
