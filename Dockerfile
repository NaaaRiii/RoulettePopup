# Stage 1: Build the application
FROM node:20 as builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:14

# Set working directory
WORKDIR /app

# Copy built application from the builder stage
COPY --from=builder /app ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
