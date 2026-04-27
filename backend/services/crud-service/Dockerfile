FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

COPY . .

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3003

CMD ["node", "src/server.js"]