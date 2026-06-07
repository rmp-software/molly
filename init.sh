#!/usr/bin/env bash
set -e

echo "Starting Postgres via Docker Compose..."
docker compose up -d

echo "Waiting for Postgres to accept connections..."
max_tries=30
try=0
until docker compose exec db pg_isready -U molly -d molly > /dev/null 2>&1; do
  try=$((try + 1))
  if [ "$try" -ge "$max_tries" ]; then
    echo "Error: Postgres did not become ready after ${max_tries}s. Aborting." >&2
    exit 1
  fi
  echo "  Postgres not ready yet, waiting 1s... (${try}/${max_tries})"
  sleep 1
done
echo "Postgres is ready."

echo "Installing npm dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate dev --name init

if [ -f "prisma/seed.ts" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Done! Run 'npm run dev' to start the development server."
