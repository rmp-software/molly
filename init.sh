#!/usr/bin/env bash
set -e

echo "Starting Postgres via Docker Compose..."
docker compose up -d

echo "Waiting for Postgres to accept connections..."
until docker compose exec db pg_isready -U molly -d molly > /dev/null 2>&1; do
  echo "  Postgres not ready yet, waiting 1s..."
  sleep 1
done
echo "Postgres is ready."

echo "Installing npm dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate dev --name init

echo "Seeding database..."
npx prisma db seed

echo "Done! Run 'npm run dev' to start the development server."
