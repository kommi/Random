import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { processPhotoScan } from '../services/photoMatchService';
import { calculateTPS, computeIdMatchScore, computeContextScore } from '../services/tpsService';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG and PNG images are allowed'));
  },
});

router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required', code: 'VALIDATION_ERROR' });
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;
    let scannedById: string | undefined;
    let isOfficer = false;
    try {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const payload = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET || 'secret') as any;
        scannedById = payload.userId;
        isOfficer = payload.role === 'OFFICER';
      }
    } catch {}
    const result = await processPhotoScan(req.file.buffer, req.file.originalname || 'scan.jpg', latitude, longitude, scannedById, isOfficer);
    res.json(result);
  } catch (err) {
    console.error('Photo verify error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

const idVerifySchema = z.object({
  type: z.enum(['HALLMARK', 'VIN', 'IMEI', 'SERIAL', 'REGISTRATION', 'OTHER']),
  value: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post('/id', async (req: Request, res: Response) => {
  try {
    const data = idVerifySchema.parse(req.body);
    const identifiers = await prisma.itemIdentifier.findMany({
      where: { type: data.type },
      include: { item: { include: { identifiers: true, images: { where: { isPrimary: true }, take: 1 } } } },
    });
    const matches: any[] = [];
    for (const identifier of identifiers) {
      if (identifier.item.status !== 'ACTIVE') continue;
      const idScore = computeIdMatchScore(data.value, identifier.value);
      if (idScore === 0) continue;
      const contextScore = computeContextScore(identifier.item.stolenAt);
      const tpsResult = calculateTPS({ imageSimilarity: 0, idMatchScore: idScore, metadataScore: 0, contextScore });
      matches.push({
        tps: tpsResult.tps, band: tpsResult.band, breakdown: tpsResult.breakdown,
        stolenItem: { scid: identifier.item.scid, title: identifier.item.title, category: identifier.item.category, stolenAt: identifier.item.stolenAt, identifierMatch: { type: identifier.type, score: idScore } },
      });
    }
    matches.sort((a, b) => b.tps - a.tps);
    const topTPS = matches[0]?.tps || 0;
    let urgencyLevel: string;
    if (topTPS >= 70) urgencyLevel = 'RED'; else if (topTPS >= 40) urgencyLevel = 'AMBER'; else if (matches.length > 0) urgencyLevel = 'YELLOW'; else urgencyLevel = 'GREEN';
    res.json({ urgencyLevel, overallTPS: topTPS, matches: matches.slice(0, 5), message: matches.length === 0 ? 'No matching identifiers found.' : `Found ${matches.length} potential match(es).` });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.errors });
    console.error('ID verify error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const where: any = { status: 'ACTIVE' };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { scid: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category && ['GOLD', 'VEHICLE', 'ELECTRONICS', 'ACCESSORIES', 'OTHER'].includes(category)) where.category = category;
    const [items, total] = await Promise.all([
      prisma.stolenItem.findMany({ where, include: { images: { where: { isPrimary: true }, take: 1 }, identifiers: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.stolenItem.count({ where }),
    ]);
    res.json({
      items: items.map((item) => ({ scid: item.scid, title: item.title, category: item.category, brand: item.brand, color: item.color, stolenAt: item.stolenAt, primaryImageUrl: item.images[0]?.url })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

export default router;
