import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();
const uploadDir = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadDir, 'items');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG and PNG images are allowed'));
  },
});

function generateSCID(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) random += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SC-${year}-${random}`;
}

const itemDataSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  category: z.enum(['GOLD', 'VEHICLE', 'ELECTRONICS', 'ACCESSORIES', 'OTHER']),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  estimatedValue: z.number().optional(),
  stolenAt: z.string().transform((s) => new Date(s)),
  stolenLocation: z.string().min(2),
  firNumber: z.string().optional(),
  identifiers: z.array(z.object({
    type: z.enum(['HALLMARK', 'VIN', 'IMEI', 'SERIAL', 'REGISTRATION', 'OTHER']),
    value: z.string().min(1),
  })).optional(),
});

router.post('/', authenticate, requireRole('VICTIM', 'ADMIN'), upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length < 1) {
      return res.status(400).json({ error: 'At least 1 image is required', code: 'VALIDATION_ERROR' });
    }
    let itemData: any;
    try {
      itemData = itemDataSchema.parse(JSON.parse(req.body.itemData));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.errors });
      return res.status(400).json({ error: 'Invalid itemData JSON', code: 'VALIDATION_ERROR' });
    }
    const scid = generateSCID();
    const item = await prisma.stolenItem.create({
      data: {
        scid, userId: req.user!.userId, title: itemData.title, description: itemData.description,
        category: itemData.category, brand: itemData.brand, model: itemData.model, color: itemData.color,
        estimatedValue: itemData.estimatedValue, stolenAt: itemData.stolenAt, stolenLocation: itemData.stolenLocation,
        firNumber: itemData.firNumber,
        images: { create: files.map((file, index) => ({ url: `/uploads/items/${file.filename}`, isPrimary: index === 0 })) },
        identifiers: itemData.identifiers ? { create: itemData.identifiers.map((id: any) => ({ type: id.type, value: id.value })) } : undefined,
      },
      include: { images: true, identifiers: true },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.get('/mine', authenticate, requireRole('VICTIM', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.stolenItem.findMany({ where: { userId: req.user!.userId }, include: { images: true, identifiers: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.stolenItem.count({ where: { userId: req.user!.userId } }),
    ]);
    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await prisma.stolenItem.findUnique({
      where: { id: req.params.id },
      include: { images: true, identifiers: true, verifications: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!item) return res.status(404).json({ error: 'Item not found', code: 'NOT_FOUND' });
    res.json(item);
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/:id/status', authenticate, requireRole('VICTIM', 'OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'RECOVERED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status', code: 'VALIDATION_ERROR' });
    }
    const item = await prisma.stolenItem.update({ where: { id: req.params.id }, data: { status } });
    res.json(item);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.delete('/:id', authenticate, requireRole('VICTIM', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const item = await prisma.stolenItem.findUnique({ where: { id: req.params.id }, include: { images: true } });
    if (!item) return res.status(404).json({ error: 'Item not found', code: 'NOT_FOUND' });
    if (item.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized', code: 'FORBIDDEN' });
    }
    for (const image of item.images) {
      const filePath = path.join(uploadDir, image.url.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.stolenItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

export default router;
