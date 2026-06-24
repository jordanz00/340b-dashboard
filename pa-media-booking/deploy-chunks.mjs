#!/usr/bin/env node
/**
 * Print CDP deploy chunk commands for pa-media-booking files.
 * Usage: node deploy-chunks.mjs [fileIndex]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 3500;

const files = [
  'includes/class-admin.php',
  'includes/class-pa-booking.php',
  'pa-media-booking.php',
  'includes/class-rest.php',
  'includes/class-frontend.php',
  'assets/booking.js',
  'assets/booking.css',
];

const idx = parseInt(process.argv[2] ?? '0', 10);
const rel = files[idx];
const b64 = fs.readFileSync(path.join(__dirname, rel)).toString('base64');
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) {
  chunks.push(b64.slice(i, i + CHUNK));
}

const out = {
  rel,
  file: 'pa-media-booking/' + rel,
  chunks,
  total: chunks.length,
};
console.log(JSON.stringify(out));
