# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock or pnpm-lock.yaml)
COPY package.json ./
COPY package-lock.json ./
# If you are using yarn, uncomment the next line and comment out the npm ci line
# COPY yarn.lock ./
# If you are using pnpm, uncomment the next line and comment out the npm ci line
# COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm ci
# If you are using yarn, uncomment the next line and comment out the npm ci line
# RUN yarn install --frozen-lockfile
# If you are using pnpm, uncomment the next line and comment out the npm ci line
# RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build
# If you are using yarn, uncomment the next line and comment out the npm run build line
# RUN yarn build
# If you are using pnpm, uncomment the next line and comment out the npm run build line
# RUN pnpm build


# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/package.json ./package.json
# If your next.config.js is in TypeScript (next.config.ts), you might need to copy the compiled version
# or ensure your production image can handle TypeScript. For simplicity, assuming next.config.js
# If you have next.config.ts, you will need to copy it and potentially install typescript in the final stage
# or better, ensure your build process outputs a next.config.js
COPY --from=builder /app/next.config.ts ./next.config.ts
# or next.config.js if you use JS

# Install production dependencies (if any, Next.js standalone output usually bundles them)
# If your 'npm run build' creates a standalone output (default in newer Next.js versions),
# you might not need to run npm install in the final stage.
# Check your Next.js output directory structure.
# RUN npm ci --omit=dev
# If you are using yarn, uncomment the next line and comment out the npm ci line
# RUN yarn install --production --frozen-lockfile
# If you are using pnpm, uncomment the next line and comment out the npm ci line
# RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

# Set the command to start the Next.js application
# The CMD should generally be npm start, which should be defined in your package.json scripts
# For Next.js, it's typically 'next start'
CMD ["npm", "start"] 