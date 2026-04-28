FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage — serve with a lightweight static server
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
