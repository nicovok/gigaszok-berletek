FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build --compile backend/index.ts --outfile berletek

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/berletek .
EXPOSE 3000
CMD ["./berletek"]
