#!/bin/bash

# Apply migration and regenerate Prisma client
echo "Applying database migration..."
npx prisma migrate deploy

echo "Regenerating Prisma client..."
npx prisma generate

echo "Building application..."
pnpm run build
