import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { extractEmbedding, matchEmbeddings } from './mlService';
import { calculateTPS, computeContextScore, TPSInput } from './tpsService';
import { createPhotoScanAlert } from './alertAssignmentService';
import { MATCH_THRESHOLDS, MAX_MATCHES_RETURNED, ALERT_COOLDOWN_MINUTES } from '../constants/matchThresholds';

const prisma = new PrismaClient();
const uploadDir = process.env.UPLOAD_DIR || './uploads';

export interface PhotoMatchResponse {
  urgencyLevel: 'GREEN' | 'YELLOW' | 'AMBER' | 'RED';
  overallTPS: number;
  topSimilarityScore: number;
  alertCreated: boolean;
  alertId?: string;
  matches: MatchResult[];
  message: string;
}

export interface MatchResult {
  rank: number;
  similarityScore: number;
  tps: number;
  tpsBand: string;
  breakdown: { imageSimilarity: number; idMatchScore: number; metadataScore: number; contextScore: number };
  stolenItem: {
    scid: string; title: string; category: string; stolenAt: Date;
    primaryImageUrl: string; identifiers: { type: string; value: string }[];
  };
}

export function maskIdentifier(value: string): string {
  if (value.length <= 5) return '***';
  return value.substring(0, 3) + '***' + value.substring(value.length - 2);
}

export async function blurImage(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath);
  const blurredFilename = `blurred_${uuidv4()}${ext}`;
  const blurredPath = path.join(uploadDir, 'scans', blurredFilename);
  await sharp(inputPath).blur(15).toFile(blurredPath);
  return `/uploads/scans/${blurredFilename}`;
}

export async function processPhotoScan(
  imageBuffer: Buffer, originalFilename: string,
  latitude?: number, longitude?: number, scannedById?: string, isOfficer: boolean = false
): Promise<PhotoMatchResponse> {
  const ext = path.extname(originalFilename) || '.jpg';
  const scanFilename = `${uuidv4()}${ext}`;
  const scanPath = path.join(uploadDir, 'scans', scanFilename);
  fs.mkdirSync(path.dirname(scanPath), { recursive: true });
  fs.writeFileSync(scanPath, imageBuffer);
  const scanImageUrl = `/uploads/scans/${scanFilename}`;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await extractEmbedding(scanPath);
  } catch (err) {
    console.error('ML service error:', err);
    return { urgencyLevel: 'GREEN', overallTPS: 0, topSimilarityScore: 0, alertCreated: false, matches: [], message: 'Unable to process image. Please try again.' };
  }

  const candidateImages = await prisma.image.findMany({
    where: { embedding: { not: null }, item: { status: 'ACTIVE' } },
    include: { item: { include: { identifiers: true, images: { where: { isPrimary: true }, take: 1 } } } },
  });

  if (candidateImages.length === 0) {
    return { urgencyLevel: 'GREEN', overallTPS: 0, topSimilarityScore: 0, alertCreated: false, matches: [], message: 'This item appears clean. No matches found in our database.' };
  }

  const candidateEmbeddings = candidateImages.map((img) => img.embedding as number[]);
  let matchResults: { index: number; score: number }[];
  try {
    matchResults = await matchEmbeddings(queryEmbedding, candidateEmbeddings, MAX_MATCHES_RETURNED * 2);
  } catch (err) {
    console.error('ML match error:', err);
    return { urgencyLevel: 'GREEN', overallTPS: 0, topSimilarityScore: 0, alertCreated: false, matches: [], message: 'Unable to process match. Please try again.' };
  }

  const filtered = matchResults.filter((r) => r.score >= MATCH_THRESHOLDS.LOW_CONFIDENCE);
  if (filtered.length === 0) {
    return { urgencyLevel: 'GREEN', overallTPS: 0, topSimilarityScore: 0, alertCreated: false, matches: [], message: 'This item appears clean. No significant matches found.' };
  }

  filtered.sort((a, b) => b.score - a.score);
  const topMatches = filtered.slice(0, MAX_MATCHES_RETURNED);

  const matchResultsFull: MatchResult[] = [];
  for (let i = 0; i < topMatches.length; i++) {
    const match = topMatches[i];
    const candidateImage = candidateImages[match.index];
    const item = candidateImage.item;
    const contextScore = computeContextScore(item.stolenAt);
    const tpsInput: TPSInput = { imageSimilarity: match.score, idMatchScore: 0, metadataScore: 0, contextScore };
    const tpsResult = calculateTPS(tpsInput);
    const primaryImage = item.images[0];
    let primaryImageUrl = primaryImage?.url || candidateImage.url;

    if (!isOfficer && primaryImage) {
      try {
        const fullPath = path.join(uploadDir, primaryImage.url.replace('/uploads/', ''));
        if (fs.existsSync(fullPath)) primaryImageUrl = await blurImage(fullPath);
      } catch {}
    }

    const identifiers = item.identifiers.map((id) => ({ type: id.type, value: isOfficer ? id.value : maskIdentifier(id.value) }));
    matchResultsFull.push({
      rank: i + 1, similarityScore: Math.round(match.score * 100) / 100,
      tps: tpsResult.tps, tpsBand: tpsResult.band, breakdown: tpsResult.breakdown,
      stolenItem: { scid: item.scid, title: item.title, category: item.category, stolenAt: item.stolenAt, primaryImageUrl, identifiers },
    });
  }

  const topScore = topMatches[0].score;
  let urgencyLevel: 'GREEN' | 'YELLOW' | 'AMBER' | 'RED';
  if (topScore >= MATCH_THRESHOLDS.HIGH_CONFIDENCE) urgencyLevel = 'RED';
  else if (topScore >= MATCH_THRESHOLDS.MEDIUM_CONFIDENCE) urgencyLevel = 'AMBER';
  else urgencyLevel = 'YELLOW';

  const overallTPS = matchResultsFull[0]?.tps || 0;
  let alertCreated = false;
  let alertId: string | undefined;

  if (urgencyLevel === 'RED' || urgencyLevel === 'AMBER') {
    const alertUrgency = urgencyLevel === 'RED' ? 'HIGH' : 'MEDIUM';
    const topItem = candidateImages[topMatches[0].index].item;
    const recentAlert = await prisma.photoScanAlert.findFirst({
      where: { matches: { some: { stolenItemId: topItem.id } }, scannedAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000) } },
    });
    if (!recentAlert) {
      try {
        alertId = await createPhotoScanAlert({
          scanImageUrl, scanEmbedding: queryEmbedding, scanLatitude: latitude, scanLongitude: longitude,
          scannedById, topSimilarityScore: topScore, overallTPS,
          matches: matchResultsFull.map((m, idx) => ({
            stolenItemId: candidateImages[topMatches[idx].index].item.id,
            matchedImageId: candidateImages[topMatches[idx].index].id,
            similarityScore: m.similarityScore, tps: m.tps, rank: m.rank,
          })),
        }, alertUrgency as any);
        alertCreated = true;
      } catch (err) { console.error('Alert creation error:', err); }
    }
  }

  try {
    await prisma.verificationLog.create({
      data: { scannedById, itemId: candidateImages[topMatches[0].index].item.id, imageSimilarity: topScore, idMatchScore: 0, metadataScore: 0, contextScore: matchResultsFull[0]?.breakdown.contextScore || 0, tps: overallTPS, latitude, longitude },
    });
  } catch (err) { console.error('Verification log error:', err); }

  const messages: Record<string, string> = {
    GREEN: 'This item appears clean.', YELLOW: 'Low confidence match. Likely safe.',
    AMBER: 'Proceed with caution. Moderate match found.', RED: 'DO NOT PURCHASE. High probability stolen. Police alerted.',
  };

  return { urgencyLevel, overallTPS, topSimilarityScore: Math.round(topScore * 100) / 100, alertCreated, alertId, matches: matchResultsFull, message: messages[urgencyLevel] };
}
