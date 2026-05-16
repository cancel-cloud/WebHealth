FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY dist ./dist

EXPOSE 9100

CMD ["node", "./dist/apps/worker/src/main.js"]
