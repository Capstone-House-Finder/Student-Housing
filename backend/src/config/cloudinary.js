import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root (same as app.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// Configure Cloudinary with environment variables
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
} else {
    console.warn('Cloudinary environment variables not fully configured. Photo uploads may fail.');
    console.warn(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗'}`);
    console.warn(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✓' : '✗'}`);
    console.warn(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✓' : '✗'}`);
}

export { cloudinary };
