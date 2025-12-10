FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Vì ta dùng docker-compose nên file setup_database.js có thể chạy tự động trong code server.js
# hoặc chạy thủ công nếu muốn.
EXPOSE 5000

CMD ["node", "server.js"]