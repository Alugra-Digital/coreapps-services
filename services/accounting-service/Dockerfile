FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/accounting-service/package*.json ./services/accounting-service/
WORKDIR /app/services/accounting-service
RUN npm install

COPY services/accounting-service /app/services/accounting-service

EXPOSE 3006
CMD ["npm", "start"]
