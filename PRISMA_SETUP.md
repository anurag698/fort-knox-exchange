# Database Setup Guide - Fort Knox Exchange

This guide will help you set up PostgreSQL with Prisma for the Fort Knox Exchange platform.

## Quick Start Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL**:
   ```bash
   # macOS (with Homebrew)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE fortknox;
   CREATE USER fortknox_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE fortknox TO fortknox_user;
   \q
   ```

3. **Update Environment Variable**:
   Edit `.env.local` and update the DATABASE_URL:
   ```
   DATABASE_URL="postgresql://fortknox_user:your_secure_password@localhost:5432/fortknox?schema=public"
   ```

4. **Run Migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### Option 2: Prisma Cloud Database (Easiest)

1. **Create Free Database**:
   ```bash
   npx create-db
   ```
   
2. Follow prompts to create a free Prisma Postgres database

3. Copy the connection string to `.env.local`

### Option 3: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

### Option 4: Neon (Serverless Postgres - Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create new project
3. Copy connection string
4. Update `.env.local`

## Database Schema

Our schema includes:

- **User**: Account information, preferences, API keys
- **Session**: Active user sessions
- **Balance**: User balances for each cryptocurrency
- **Trade**: Completed trade history
- **Order**: Active and historical orders
- **Market**: Trading pair metadata
- **PriceAlert**: Price notification system

## Migrations

After updating the schema, run:
```bash
npx prisma migrate dev --name description_of_changes
```

## Prisma Studio (Database GUI)

View and edit your database:
```bash
npx prisma studio
```

Access at: http://localhost:5555

## Seed Data (Optional)

Create `prisma/seed.ts` to populate initial data:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample markets
  await prisma.market.createMany({
    data: [
      { id: 'BTC-USDT', baseAsset: 'BTC', quoteAsset: 'USDT', minQuantity: 0.0001, maxQuantity: 1000, minPrice: 1, maxPrice: 1000000 },
      { id: 'ETH-USDT', baseAsset: 'ETH', quoteAsset: 'USDT', minQuantity: 0.001, maxQuantity: 10000, minPrice: 0.1, maxPrice: 100000 },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run seed:
```bash
npx prisma db seed
```

## Production Deployment

For production on Vercel:

1. Add DATABASE_URL to Vercel environment variables
2. Prisma will automatically generate client during build
3. Use connection pooling for serverless environments:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"
   ```

## Troubleshooting

**Connection Issues**:
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in DATABASE_URL
- Check firewall/security groups for cloud databases

**Migration Errors**:
- Reset database: `npx prisma migrate reset` (⚠️ deletes all data)
- Force push schema: `npx prisma db push`

**Prisma Client Errors**:
- Regenerate client: `npx prisma generate`
- Clear node_modules: `rm -rf node_modules && npm install`

## Next Steps

1. Set up your preferred database option
2. Run migrations
3. Update API routes to use Prisma (see updated routes in `src/app/api/`)
4. Test with `npx prisma studio`
