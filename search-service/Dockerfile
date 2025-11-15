FROM node:20.19.5-alpine3.22 as Build
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm install @nestjs/cli typescript -g
RUN npm run build

FROM node:20.19.5-alpine3.22 as Production
WORKDIR /usr/src/app
# Install PostgreSQL client for database health checks (needed for seeding service)
RUN apk add --no-cache postgresql-client
COPY --from=Build /usr/src/app/node_modules ./node_modules
COPY --from=Build /usr/src/app/dist ./dist
COPY --from=Build /usr/src/app/tsconfig.json ./tsconfig.json
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]