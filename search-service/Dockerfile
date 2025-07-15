FROM node:18-alpine

# Install PostgreSQL client for database health checks (needed for seeding service)
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]