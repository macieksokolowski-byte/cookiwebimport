ARG BUILD_FROM=node:20-alpine
FROM ${BUILD_FROM}

ENV NODE_ENV=production
ENV DATA_DIR=/data
WORKDIR /app

# Instalacja narzędzi pomocniczych
RUN apk add --no-cache curl bash

# Kopiowanie definicji zależności
COPY package*.json ./
RUN npm ci --only=production

# Kopiowanie kodu aplikacji
COPY . .

# Uprawnienia do skryptu startowego
RUN chmod +x /app/run.sh

EXPOSE 3000

CMD [ "/app/run.sh" ]
