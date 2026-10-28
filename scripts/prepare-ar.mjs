import { cp, mkdir } from 'node:fs/promises';
const source = new URL('../node_modules/@8thwall/engine-binary/', import.meta.url);
const destination = new URL('../public/ar-engine/v1.0.0/', import.meta.url);
await mkdir(destination, { recursive: true });
await cp(new URL('dist/', source), destination, { recursive: true });
await cp(new URL('LICENSE', source), new URL('LICENSE.txt', destination));
