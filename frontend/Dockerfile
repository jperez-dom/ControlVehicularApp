FROM node:18

WORKDIR /usr/src/app

# Cache de dependencias
COPY package*.json ./
RUN npm install

# No copiamos src: en Dev se monta por volumen
EXPOSE 3000

# El comando real lo define docker-compose (npm run dev)
