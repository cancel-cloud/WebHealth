FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY dist/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

COPY dist ./dist

EXPOSE 9100

CMD ["node", "./dist/apps/worker/src/main.js"]
