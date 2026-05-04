# ===========================
# Stage 1: Build dependencies
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ===========================
# Stage 2: Production image
# ===========================
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Create upload directories (audit fix #2)
RUN mkdir -p /app/uploads/notes /app/uploads/assignments \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "src/index.js"]
