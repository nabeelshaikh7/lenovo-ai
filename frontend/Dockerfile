# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Make sure to update the .env file with the production API URL
RUN echo "VITE_API_BASE_URL=https://api.resumatch.tnsvc.xyz" > .env
RUN npm run build

# Stage 2: This stage is empty because Caddy will serve the files directly.
# We just needed Stage 1 to build the static files into the /app/dist directory.
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/dist .