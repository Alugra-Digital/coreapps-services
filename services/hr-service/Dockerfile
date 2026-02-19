FROM node:20-alpine
WORKDIR /app

COPY services/shared ./shared
WORKDIR /app/shared
RUN npm install

RUN mkdir -p /app/services && ln -s /app/shared /app/services/shared

WORKDIR /app
COPY services/hr-service/package*.json ./services/hr-service/
WORKDIR /app/services/hr-service
RUN npm install

COPY services/hr-service /app/services/hr-service

EXPOSE 3004
CMD ["npm", "start"]
