# ==========================================
# STAGE 1: Build (Compiling TypeScript)
# ==========================================
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies like typescript)
COPY package*.json ./
RUN npm install

# Copy the rest of your source code
COPY . .

# Compile the TypeScript code into JavaScript (outputs to /dist)
RUN npm run build

# ==========================================
# STAGE 2: Production (Running the App)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port your Express app uses
EXPOSE 8080

# Start the server using the production script
CMD ["npm", "run", "start"]
