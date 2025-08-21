# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 8000, so you need to expose it
EXPOSE 8000

# The command will be specified in docker-compose, so this is optional
CMD [ "node", "server.js" ]