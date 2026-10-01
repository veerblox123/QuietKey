import { mkdir, copyFile } from 'node:fs/promises';

const files = ['index.html', 'app.js', 'styles.css'];
await mkdir('www', { recursive: true });
await Promise.all(files.map(file => copyFile(file, `www/${file}`)));
