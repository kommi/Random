import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, requireRole('OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.status) where.alertStatus = req.query.status;
    if (req.query.urgency) where.urgencyLevel = req.query.urgency;
    if (req.user!.role === 'OFFICER') {
      where.OR = [{ assignedOfficerId: req.user!.userId }, { assignedOfficerId: null }];
    }
    const [alerts, total] = await Promise.all([
      prisma.photoScanAlert.findMany({
        where, include: { matches: { include: { stolenItem: { include: { images: { where: { isPrimary: true }, take: 1 } } } }, orderBy: { rank: 'asc' } }, assignedOfficer: { select: { id: true, name: true } } },
        orderBy: [{ urgencyLevel: 'desc' }, { scannedAt: 'desc' }], skip, take: limit,
      }),
      prisma.photoScanAlert.count({ where }),
    ]);
    res.json({ alerts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { console.error('Get alerts error:', err); res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }); }
});

router.get('/stats', authenticate, requireRole('OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const officerFilter = req.user!.role === 'OFFICER' ? { assignedOfficerId: req.user!.userId } : {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [open, acknowledged, resolvedToday, falsePositives, highUrgencyOpen, allResolved] = await Promise.all([
      prisma.photoScanAlert.count({ where: { ...officerFilter, alertStatus: { in: ['PENDING', 'NOTIFIED'] } } }),
      prisma.photoScanAlert.count({ where: { ...officerFilter, alertStatus: 'ACKNOWLEDGED' } }),
      prisma.photoScanAlert.count({ where: { ...officerFilter, alertStatus: 'RESOLVED', resolvedAt: { gte: today } } }),
      prisma.photoScanAlert.count({ where: { ...officerFilter, alertStatus: 'FALSE_POSITIVE' } }),
      prisma.photoScanAlert.count({ where: { ...officerFilter, urgencyLevel: 'HIGH', alertStatus: { in: ['PENDING', 'NOTIFIED', 'ACKNOWLEDGED'] } } }),
      prisma.photoScanAlert.findMany({ where: { ...officerFilter, alertStatus: 'RESOLVED', officerAckedAt: { not: null }, resolvedAt: { not: null } }, select: { officerAckedAt: true, resolvedAt: true } }),
    ]);
    let avgResponseTimeMinutes = 0;
    if (allResolved.length > 0) {
      const totalMinutes = allResolved.reduce((sum, a) => sum + (a.resolvedAt!.getTime() - a.officerAckedAt!.getTime()) / 60000, 0);
      avgResponseTimeMinutes = Math.round(totalMinutes / allResolved.length);
    }
    res.json({ open, acknowledged, resolvedToday, falsePositives, today: resolvedToday, highUrgencyOpen, avgResponseTimeMinutes });
  } catch (err) { console.error('Stats error:', err); res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }); }
});

router.get('/map', authenticate, requireRole('OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.photoScanAlert.findMany({
      where: { scanLatitude: { not: null }, scanLongitude: { not: null } },
      select: { id: true, scanLatitude: true, scanLongitude: true, overallTPS: true, urgencyLevel: true, scannedAt: true, alertStatus: true },
      orderBy: { scannedAt: 'desc' }, take: 200,
    });
    res.json(alerts.map((a) => ({ id: a.id, lat: a.scanLatitude, lng: a.scanLongitude, tps: a.overallTPS, urgencyLevel: a.urgencyLevel, status: a.alertStatus, createdAt: a.scannedAt })));
  } catch (err) { console.error('Map error:', err); res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }); }
});

router.get('/:id', authenticate, requireRole('OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const alert = await prisma.photoScanAlert.findUnique({
      where: { id: req.params.id },
      include: {
        matches: { include: { stolenItem: { include: { images: true, identifiers: true, user: { select: { id: true, name: true, phone: true } } } }, matchedImage: true }, orderBy: { rank: 'asc' } },
        assignedOfficer: { select: { id: true, name: true, email: true, phone: true } },
        scannedBy: { select: { id: true, name: true } },
      },
    });
    if (!alert) return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
    res.json(alert);
  } catch (err) { console.error('Get alert error:', err); res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }); }
});

router.patch('/:id', authenticate, requireRole('OFFICER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['PENDING', 'NOTIFIED', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED', 'FALSE_POSITIVE'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status', code: 'VALIDATION_ERROR' });
    const updateData: any = {};
    if (status) {
      updateData.alertStatus = status;
      if (status === 'ACKNOWLEDGED') updateData.officerAckedAt = new Date();
      if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') updateData.resolvedAt = new Date();
    }
    if (notes) updateData.resolutionNotes = notes;
    const alert = await prisma.photoScanAlert.update({ where: { id: req.params.id }, data: updateData });
    res.json(alert);
  } catch (err) { console.error('Update alert error:', err); res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }); }
});

export default router;
