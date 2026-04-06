# Nova Request

A modern, browser-based API testing tool similar to Postman with sharing capabilities and auto-documentation.

![Live API Tester](https://via.placeholder.com/800x400?text=Live+API+Tester)

## Features

- 🚀 **API Request Builder** - Test GET, POST, PUT, DELETE, PATCH requests
- 📦 **Collections** - Organize endpoints into collections
- 🔗 **Share Collections** - Generate public shareable links
- 📚 **Auto Documentation** - Generate API docs from saved endpoints
- 🌙 **Dark Mode** - Beautiful dark/light theme support
- 📥 **Import/Export** - JSON import/export for collections
- 🔐 **Authentication** - Secure JWT-based authentication

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Zustand
- **Backend**: Node.js, Express.js, Prisma
- **Database**: PostgreSQL

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd Api-tester

# Create directories
node setup-directories.js
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/api_tester"

# Generate Prisma client and push schema
npm run db:push

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Open in Browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/api_tester"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## Project Structure

```
Api-tester/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   └── index.js        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create collection
- `GET /api/collections/:id` - Get collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection
- `GET /api/share/:shareId` - Get shared collection (public)

### Endpoints
- `GET /api/collections/:id/endpoints` - List endpoints
- `POST /api/collections/:id/endpoints` - Create endpoint
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint

### Request Proxy
- `POST /api/proxy` - Execute API request (avoids CORS)

### History
- `GET /api/history` - Get request history
- `DELETE /api/history` - Clear history

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Railway)

1. Push to GitHub
2. Create new Web Service
3. Set environment variables
4. Deploy

### Database (Supabase/Neon)

1. Create PostgreSQL database
2. Copy connection string
3. Update DATABASE_URL

## License

MIT License
