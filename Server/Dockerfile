# Use an official Node.js runtime as a parent image ,,, light weight node image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app's source
COPY . .

# The app binds to port 8000, so we'll expose that
EXPOSE 8000

# Command to run the app
CMD [ "npm", "start" ]