# Database Integration Guide

## 🎯 Recommended Stack

**Prisma + PostgreSQL** - Best for production

**Alternative:** Prisma + MongoDB (if you prefer NoSQL)

---

## Step 1: Install Prisma

```bash
cd /Users/anurag/Downloads/voice-bharat-main/backend/fort-knox-exchange

npm install prisma @prisma/client
npx prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` with `DATABASE_URL`

---

## Step 2: Choose a Database Host

### Option A: Vercel Postgres (Easiest)
1. Vercel Dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Add to `.env`: `DATABASE_URL="your-vercel-postgres-url"`

### Option B: Supabase (Free tier)
1. [supabase.com](https://supabase.com) → New Project
2. Settings → Database → Connection String
3. Use "Transaction" pooler URL

### Option C: Railway (PostgreSQL)
1. [railway.app](https://railway.app) → New Project → PostgreSQL
2. Copy `DATABASE_URL` from variables

---

## Step 3: Define Schema

Edit `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Auth providers
  accounts      Account[]
  sessions      Session[]
  
  // Trading
  trades        Trade[]
  orders        Order[]
  balances      Balance[]
  
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Balance {
  id        String   @id @default(cuid())
  userId    String
  asset     String   // BTC, ETH, USDT, etc.
  free      Float    @default(0)
  locked    Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, asset])
  @@map("balances")
}

model Trade {
  id         String   @id @default(cuid())
  userId     String
  symbol     String   // BTC-USDT
  side       String   // buy or sell
  price      Float
  quantity   Float
  total      Float
  fee        Float    @default(0)
  status     String   @default("completed") // completed, failed, pending
  executedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([symbol])
  @@map("trades")
}

model Order {
  id         String   @id @default(cuid())
  userId     String
  symbol     String   // BTC-USDT
  side       String   // buy or sell
  type       String   // market, limit, stop
  price      Float?
  quantity   Float
  filled     Float    @default(0)
  status     String   @default("open") // open, filled, cancelled, partial
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([symbol])
  @@index([status])
  @@map("orders")
}
```

---

## Step 4: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## Step 5: Use in API Routes

### Example: Save Trade to Database

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Update `src/app/api/trade/execute/route.ts`:
```typescript
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { symbol, side, type, price, quantity } = body;

  try {
    // Execute trade logic here...
    
    // Save to database
    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        symbol,
        side,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: parseFloat(price) * parseFloat(quantity),
        fee: 0.001 * parseFloat(price) * parseFloat(quantity), // 0.1% fee
      },
    });

    return Response.json({ success: true, trade });
  } catch (error) {
    console.error('Trade execution error:', error);
    return Response.json({ error: 'Trade failed' }, { status: 500 });
  }
}
```

---

## Step 6: Update NextAuth

Modify `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Add this
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  // ... rest of config
};
```

Install adapter:
```bash
npm install @auth/prisma-adapter
```

---

## 🔐 Production Deployment

### Environment Variables

Add to Vercel:
```env
DATABASE_URL=your-production-database-url
```

### Run Migrations on Deploy

Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma db push && next build"
  }
}
```

---

## 📊 Useful Queries

### Get User Trades
```typescript
const trades = await prisma.trade.findMany({
  where: { userId: session.user.id },
  orderBy: { executedAt: 'desc' },
  take: 50,
});
```

### Get User Balances
```typescript
const balances = await prisma.balance.findMany({
  where: { userId: session.user.id },
});
```

### Get Open Orders
```typescript
const orders = await prisma.order.findMany({
  where: {
    userId: session.user.id,
    status: 'open',
  },
});
```

---

## 🧪 Seed Data (Optional)

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@fortknox.com' },
    update: {},
    create: {
      email: 'demo@fortknox.com',
      name: 'Demo User',
    },
  });

  // Create initial balances
  await prisma.balance.createMany({
    data: [
      { userId: user.id, asset: 'USDT', free: 10000, locked: 0 },
      { userId: user.id, asset: 'BTC', free: 0.5, locked: 0 },
      { userId: user.id, asset: 'ETH', free: 5, locked: 0 },
    ],
  });

  console.log('Seed data created');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run: `npx prisma db seed`

---

## 📚 Next Steps

1. **Add API Routes** for reading trades/orders
2. **Real-time Updates** with Prisma subscriptions
3. **Indexes** for performance (already in schema)
4. **Backups** - Enable on your database provider
5. **Analytics** - Query trade volumes, popular pairs

**Need help?** Check [Prisma Docs](https://www.prisma.io/docs)
