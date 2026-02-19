FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/finance-service/package*.json ./services/finance-service/
WORKDIR /app/services/finance-service
RUN npm install

COPY services/finance-service /app/services/finance-service

EXPOSE 3003
CMD ["npm", "start"]
