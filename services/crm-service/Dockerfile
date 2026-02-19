FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/crm-service/package*.json ./services/crm-service/
WORKDIR /app/services/crm-service
RUN npm install

COPY services/crm-service /app/services/crm-service

EXPOSE 3002
CMD ["npm", "start"]
