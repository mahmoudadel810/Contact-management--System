### STAGE 1: Build ###
# Use a Node image to build the project
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy the package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

### STAGE 2: Serve ###
# Use a lightweight Nginx image to serve the built files
FROM nginx:stable-alpine

# Copy the built files from the build stage
COPY --from=build /usr/src/app/dist/contact-manager-client/browser /usr/share/nginx/html

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80