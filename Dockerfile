# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build && npm run export
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "out", "-l", "3000"]
