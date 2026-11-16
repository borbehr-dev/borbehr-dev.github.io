import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.cwd(), 'dist');
fs.rmSync(target, { recursive: true, force: true });
console.log('dist/ очищен');
