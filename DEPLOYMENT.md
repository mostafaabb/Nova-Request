# Deployment Guide - Live API Tester

This guide covers deploying the Live API Tester to production using popular cloud platforms.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Vercel)      │     │  (Render/Railway)│     │   (Supabase)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1. Database Setup (Supabase)

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your database URL from Settings → Database → Connection String
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`

### Option B: Neon

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string from Dashboard

### Option C: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy PostgreSQL
3. Copy the connection URL

---

## 2. Backend Deployment (Render)

### Step 1: Prepare Repository

Push your backend code to GitHub:

```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/yourusername/api-tester-backend.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. New → Web Service
3. Connect your repository
4. Configure:
   - **Name**: `api-tester-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run db:generate`
   - **Start Command**: `npm start`

### Step 3: Environment Variables

Add these in Render's Environment settings:

```env
DATABASE_URL=postgresql://...your-supabase-url...
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Alternative: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add PostgreSQL service
4. Set environment variables
5. Deploy

---

## 3. Frontend Deployment (Vercel)

### Step 1: Prepare Repository

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/yourusername/api-tester-frontend.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import your frontend repository
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (or `frontend` if monorepo)

### Step 3: Environment Variables

Add in Vercel's Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

### Step 4: Deploy

Click Deploy and wait for the build to complete.

---

## 4. Post-Deployment Steps

### Initialize Database

After deploying the backend, the database tables will be created automatically via Prisma.

If needed, manually push schema:
```bash
DATABASE_URL="your-production-url" npx prisma db push
```

### Verify Deployment

1. Check backend health: `https://your-backend.onrender.com/api/health`
2. Visit frontend and try registering an account
3. Create a collection and test an API endpoint

---

## 5. Production Configuration

### Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] CORS configured for your frontend domain only
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Database SSL enabled

### Performance Optimization

**Backend (Render/Railway):**
- Upgrade to paid tier for no cold starts
- Enable auto-scaling if needed

**Frontend (Vercel):**
- Image optimization enabled
- Edge caching automatic

**Database (Supabase):**
- Enable connection pooling
- Set appropriate pool size

---

## 6. Environment Variables Reference

### Backend Production `.env`

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# JWT Authentication (Required)
JWT_SECRET="generate-a-random-32-char-string-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="production"

# CORS - Your frontend domain
FRONTEND_URL="https://your-app.vercel.app"
```

### Frontend Production `.env.local`

```env
# Backend API URL
NEXT_PUBLIC_API_URL="https://your-backend.onrender.com/api"
```

---

## 7. Monitoring & Logging

### Render
- View logs in Dashboard → Logs
- Set up alerts for downtime

### Vercel
- Built-in analytics in Dashboard
- Real-time logs available

### Database
- Supabase has built-in logs and metrics
- Monitor query performance

---

## 8. Custom Domain Setup

### Vercel (Frontend)
1. Settings → Domains
2. Add your domain
3. Update DNS records as shown

### Render (Backend)
1. Settings → Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update DNS records

### Update Environment Variables
After custom domains, update:
- Backend `FRONTEND_URL` to your frontend domain
- Frontend `NEXT_PUBLIC_API_URL` to your API domain

---

## 9. Cost Estimates

### Free Tier (Development/Small Projects)
- **Vercel**: Free (100GB bandwidth/month)
- **Render**: Free (with cold starts, sleeps after 15min inactivity)
- **Supabase**: Free (500MB database, 50MB file storage)

### Production Tier
- **Vercel Pro**: $20/month
- **Render Starter**: $7/month (no cold starts)
- **Supabase Pro**: $25/month

---

## 10. Troubleshooting

### Backend not connecting to database
- Verify DATABASE_URL is correct
- Check SSL settings (`?sslmode=require`)
- Ensure database allows external connections

### CORS Errors
- Verify FRONTEND_URL matches your actual frontend domain
- Include protocol (`https://`)

### JWT Errors
- Ensure same JWT_SECRET in both environments
- Token format: `Bearer <token>` in Authorization header

### Build Failures
- Check Node.js version (requires 18+)
- Run locally first to catch errors

---

## Quick Commands Reference

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio (local database viewer)
npm run db:studio

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
