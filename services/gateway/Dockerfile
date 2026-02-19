FROM node:20-alpine
WORKDIR /app
COPY services/gateway/package*.json ./services/gateway/
COPY services/shared ./services/shared
WORKDIR /app/services/shared
RUN npm install --omit=dev
WORKDIR /app/services/gateway
RUN npm install
COPY services/gateway /app/services/gateway
EXPOSE 3000
CMD ["npm", "start"]
