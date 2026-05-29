import { PrismaClient, UrgencyLevel } from '@prisma/client';
import { sendPushNotification } from './notificationService';

const prisma = new PrismaClient();

interface MatchData {
  scanImageUrl: string;
  scanEmbedding: number[];
  scanLatitude?: number;
  scanLongitude?: number;
  scanLocation?: string;
  scannedById?: string;
  topSimilarityScore: number;
  overallTPS: number;
  matches: { stolenItemId: string; matchedImageId: string; similarityScore: number; tps: number; rank: number }[];
}

export async function createPhotoScanAlert(matchData: MatchData, urgencyLevel: UrgencyLevel): Promise<string> {
  const officers = await prisma.user.findMany({
    where: { role: 'OFFICER' },
    include: { assignedPhotoAlerts: { where: { alertStatus: { in: ['PENDING', 'NOTIFIED', 'ACKNOWLEDGED', 'DISPATCHED'] } } } },
  });
  const assignedOfficer = officers.sort((a, b) => a.assignedPhotoAlerts.length - b.assignedPhotoAlerts.length)[0] || null;

  const alert = await prisma.photoScanAlert.create({
    data: {
      scanImageUrl: matchData.scanImageUrl, scanEmbedding: matchData.scanEmbedding,
      scanLatitude: matchData.scanLatitude, scanLongitude: matchData.scanLongitude,
      scanLocation: matchData.scanLocation, scannedById: matchData.scannedById,
      topSimilarityScore: matchData.topSimilarityScore, overallTPS: matchData.overallTPS,
      urgencyLevel, alertStatus: assignedOfficer ? 'NOTIFIED' : 'PENDING',
      assignedOfficerId: assignedOfficer?.id,
      officerNotifiedAt: assignedOfficer ? new Date() : undefined,
      matches: { create: matchData.matches.map((m) => ({ stolenItemId: m.stolenItemId, matchedImageId: m.matchedImageId, similarityScore: m.similarityScore, tps: m.tps, rank: m.rank })) },
    },
  });

  if (assignedOfficer?.expoPushToken) {
    if (urgencyLevel === 'HIGH') {
      await sendPushNotification(assignedOfficer.expoPushToken, '🚨 STOLEN ITEM DETECTED',
        `High-confidence match at ${matchData.scanLocation || 'unknown location'}. Score: ${Math.round(matchData.topSimilarityScore * 100)}%`,
        { alertId: alert.id, type: 'HIGH_ALERT' }, { sound: 'default', priority: 'high', badge: 1 });
    } else {
      await sendPushNotification(assignedOfficer.expoPushToken, '⚠️ Possible Stolen Item',
        `Moderate match found. Score: ${Math.round(matchData.topSimilarityScore * 100)}%`,
        { alertId: alert.id, type: 'MEDIUM_ALERT' }, { priority: 'normal' });
    }
  }

  for (const match of matchData.matches) {
    const stolenItem = await prisma.stolenItem.findUnique({ where: { id: match.stolenItemId }, include: { user: true } });
    if (stolenItem?.user?.expoPushToken) {
      await sendPushNotification(stolenItem.user.expoPushToken, 'Your item may have been spotted!',
        `Someone scanned an item similar to your ${stolenItem.title}. Police have been alerted.`,
        { alertId: alert.id, itemId: stolenItem.id, type: 'ITEM_SPOTTED' });
    }
  }

  return alert.id;
}
