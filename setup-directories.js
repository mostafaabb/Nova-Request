const fs = require('fs');
const path = require('path');

// All directories to create
const directories = [
  'backend',
  'backend/src',
  'backend/src/controllers',
  'backend/src/middleware',
  'backend/src/routes',
  'backend/src/services',
  'backend/src/utils',
  'backend/prisma',
  'frontend',
  'frontend/src',
  'frontend/src/app',
  'frontend/src/app/auth',
  'frontend/src/app/auth/login',
  'frontend/src/app/auth/register',
  'frontend/src/app/dashboard',
  'frontend/src/app/collections',
  'frontend/src/app/collections/[id]',
  'frontend/src/app/share',
  'frontend/src/app/share/[shareId]',
  'frontend/src/app/docs',
  'frontend/src/app/docs/[collectionId]',
  'frontend/src/components',
  'frontend/src/components/ui',
  'frontend/src/components/layout',
  'frontend/src/components/request',
  'frontend/src/components/response',
  'frontend/src/components/collections',
  'frontend/src/hooks',
  'frontend/src/lib',
  'frontend/src/store',
  'frontend/src/types',
  'frontend/public'
];

const baseDir = __dirname;

console.log('Creating directories...\n');

directories.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`- Exists: ${dir}`);
  }
});

console.log('\n✅ All directories created successfully!');
console.log('\nNext steps:');
console.log('1. cd backend && npm install');
console.log('2. cd frontend && npm install');
console.log('3. Copy .env.example to .env and configure');
console.log('4. Run: npm run db:push (in backend)');
console.log('5. Run: npm run dev (in both backend and frontend)');
