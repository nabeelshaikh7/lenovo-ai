# Use a Node.js runtime as the base image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Expose the default Vite development port
EXPOSE 5173

# The command to start the development server
CMD HOST=0.0.0.0 npm run dev -- --host 0.0.0.0