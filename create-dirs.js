const fs = require('fs');
const path = require('path');

const basePath = __dirname;

const dirs = [
  'backend',
  'backend/src',
  'backend/src/controllers',
  'backend/src/middleware',
  'backend/src/routes',
  'backend/src/services',
  'backend/src/utils',
  'backend/prisma',
  'frontend'
];

console.log('Creating directory structure in:', basePath);

dirs.forEach(dir => {
  const fullPath = path.join(basePath, dir);
  try {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Created: ${dir}`);
    } else {
      console.log(`✓ Already exists: ${dir}`);
    }
  } catch (err) {
    console.error(`✗ Error creating ${dir}:`, err.message);
  }
});

console.log('\nDirectory structure created successfully!');
