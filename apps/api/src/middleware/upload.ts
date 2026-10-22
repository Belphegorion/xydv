import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler';
import { logger } from '../config/logger';

// Setup Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // Explicitly disallow malicious or executable file types
  const disallowed = /\.(html|htm|svg|exe|js|mjs|cjs|bat|cmd|sh|php)$/i;
  if (disallowed.test(ext) || disallowed.test(file.originalname)) {
    return cb(
      new AppError(
        'Malicious or executable file types (.html, .svg, .exe, .js) are strictly prohibited',
        400,
      ),
    );
  }

  const allowedExt = /^\.(jpe?g|png|webp|gif|avif)$/i;
  const allowedMime = /^image\/(jpe?g|png|webp|gif|avif)$/i;

  if (allowedExt.test(ext) && allowedMime.test(mime)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, jpg, png, webp, gif, avif) are allowed', 400));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

/**
 * Validates binary magic bytes for image formats (JPEG, PNG, GIF, WEBP, AVIF).
 */
export function validateImageMagicBytes(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
      return true;
    // GIF: 47 49 46 38 ('GIF8')
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38)
      return true;
    // WEBP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (
      bytesRead >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    )
      return true;
    // AVIF: ftyp (bytes 4-7)
    if (bytesRead >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Middleware: Validates magic bytes of all uploaded files.
 */
export function validateUploadMagicBytes(req: Request, _res: Response, next: NextFunction): void {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const group of Object.values(req.files) as Express.Multer.File[][]) {
      files.push(...group);
    }
  }

  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) {
      if (!validateImageMagicBytes(file.path)) {
        for (const f of files) {
          try {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          } catch {}
        }
        return next(new AppError('Invalid image file format (magic bytes mismatch)', 400));
      }
    }
  }
  next();
}

/**
 * Upload helper: processes uploaded file(s) and returns public URLs.
 * If Cloudinary is configured, uploads the local file to Cloudinary and unlinks local temp.
 * Otherwise returns local `/uploads/<filename>` path.
 */
export async function getFileUrl(file: Express.Multer.File, baseUrl?: string): Promise<string> {
  if (file.path && fs.existsSync(file.path)) {
    if (!validateImageMagicBytes(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw new AppError('Invalid image file format (magic bytes mismatch)', 400);
    }
  }

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'xydv_products',
      });
      // Remove local copy after upload to cloudinary
      try {
        fs.unlinkSync(file.path);
      } catch {}
      return result.secure_url;
    } catch (err) {
      logger.warn('Cloudinary upload failed, falling back to local storage:', { error: err });
    }
  }

  // Fallback: local URL relative to API host
  const host = baseUrl || process.env.API_URL || 'http://localhost:5000';
  return `${host}/uploads/${file.filename}`;
}
