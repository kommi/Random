import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('Test@1234', 12);

  const victim = await prisma.user.upsert({ where: { email: 'victim@test.com' }, update: {}, create: { email: 'victim@test.com', name: 'Priya Sharma', passwordHash, role: 'VICTIM', phone: '+91-9876543210' } });
  const buyer = await prisma.user.upsert({ where: { email: 'buyer@test.com' }, update: {}, create: { email: 'buyer@test.com', name: 'Rahul Mehta', passwordHash, role: 'BUYER', phone: '+91-9876543211' } });
  const officer = await prisma.user.upsert({ where: { email: 'officer@test.com' }, update: {}, create: { email: 'officer@test.com', name: 'Inspector Venkat', passwordHash, role: 'OFFICER', phone: '+91-9876543212' } });
  await prisma.user.upsert({ where: { email: 'admin@test.com' }, update: {}, create: { email: 'admin@test.com', name: 'Admin User', passwordHash, role: 'ADMIN', phone: '+91-9876543213' } });

  console.log('Users created');

  const items = [
    { scid: 'SC-2025-A7K92', category: 'GOLD' as const, title: 'Gold Mangalsutra with Diamond Pendant', description: 'Traditional gold mangalsutra with diamond-studded pendant, 22 karat gold, approximately 25 grams.', brand: 'Tanishq', model: 'Heritage Collection', color: 'Gold', estimatedValue: 175000, stolenAt: new Date('2025-11-15'), stolenLocation: 'Dilsukhnagar Market, Hyderabad', firNumber: 'HYD-2025-78234', identifiers: [{ type: 'HALLMARK' as const, value: 'BIS916XXX4K' }] },
    { scid: 'SC-2025-B3M17', category: 'GOLD' as const, title: 'Gold Chain Necklace 22K', description: 'Heavy gold chain necklace, 22 karat, rope pattern design, 40 grams weight.', brand: 'Manepally', model: 'Rope Chain', color: 'Gold', estimatedValue: 220000, stolenAt: new Date('2025-12-02'), stolenLocation: 'Abids Road, Hyderabad', firNumber: 'HYD-2025-81456', identifiers: [{ type: 'HALLMARK' as const, value: 'BIS916YYY7R' }] },
    { scid: 'SC-2026-C9P41', category: 'GOLD' as const, title: 'Gold Bangles Set (4 pieces)', description: 'Set of 4 gold bangles with meenakari work, 22 karat, total weight 60 grams.', brand: 'GRT Jewellers', model: 'Meenakari Set', color: 'Gold', estimatedValue: 330000, stolenAt: new Date('2026-01-10'), stolenLocation: 'Begumpet, Hyderabad', firNumber: 'HYD-2026-02341', identifiers: [{ type: 'HALLMARK' as const, value: 'BIS916ZZZ2M' }] },
    { scid: 'SC-2025-D4T88', category: 'VEHICLE' as const, title: 'Honda City 2023 White Sedan', description: 'Honda City ZX CVT Petrol, white color, 2023 model. Stolen from parking lot.', brand: 'Honda', model: 'City ZX', color: 'White', estimatedValue: 1450000, stolenAt: new Date('2025-10-20'), stolenLocation: 'Jubilee Hills, Hyderabad', firNumber: 'HYD-2025-67890', identifiers: [{ type: 'VIN' as const, value: 'MAHCM465XR1234567' }, { type: 'REGISTRATION' as const, value: 'TS09EA4521' }] },
    { scid: 'SC-2025-E2W55', category: 'VEHICLE' as const, title: 'Royal Enfield Classic 350 Black', description: 'Royal Enfield Classic 350 Signals edition, matte black, 2022 model.', brand: 'Royal Enfield', model: 'Classic 350', color: 'Black', estimatedValue: 210000, stolenAt: new Date('2025-12-15'), stolenLocation: 'Secunderabad Railway Station', firNumber: 'HYD-2025-89012', identifiers: [{ type: 'VIN' as const, value: 'MCDKH4512N9876543' }, { type: 'REGISTRATION' as const, value: 'TS07FA9832' }] },
    { scid: 'SC-2026-F8K23', category: 'VEHICLE' as const, title: 'TVS Jupiter Scooter Blue', description: 'TVS Jupiter ZX disc brake variant, starlight blue, 2024 model.', brand: 'TVS', model: 'Jupiter ZX', color: 'Blue', estimatedValue: 85000, stolenAt: new Date('2026-02-01'), stolenLocation: 'Ameerpet Metro Station', identifiers: [{ type: 'VIN' as const, value: 'MDWJA1C19R0654321' }, { type: 'REGISTRATION' as const, value: 'TS08GB1245' }] },
    { scid: 'SC-2025-G1L67', category: 'ELECTRONICS' as const, title: 'iPhone 15 Pro Max 256GB', description: 'Apple iPhone 15 Pro Max, Natural Titanium, 256GB storage.', brand: 'Apple', model: 'iPhone 15 Pro Max', color: 'Titanium', estimatedValue: 159900, stolenAt: new Date('2025-11-28'), stolenLocation: 'Inorbit Mall, Hyderabad', firNumber: 'HYD-2025-82345', identifiers: [{ type: 'IMEI' as const, value: '354987102345678' }] },
    { scid: 'SC-2026-H5N34', category: 'ELECTRONICS' as const, title: 'MacBook Pro 14-inch M3 Pro', description: 'Apple MacBook Pro 14-inch with M3 Pro chip, 18GB RAM, 512GB SSD.', brand: 'Apple', model: 'MacBook Pro 14 M3', color: 'Space Black', estimatedValue: 199900, stolenAt: new Date('2026-01-22'), stolenLocation: 'Hitech City, Hyderabad', firNumber: 'HYD-2026-04567', identifiers: [{ type: 'SERIAL' as const, value: 'C02ZH3XXLVDL' }] },
    { scid: 'SC-2025-J7R19', category: 'ACCESSORIES' as const, title: 'Louis Vuitton Neverfull MM Bag', description: 'Louis Vuitton Neverfull MM in Monogram canvas with cherry red lining.', brand: 'Louis Vuitton', model: 'Neverfull MM', color: 'Brown', estimatedValue: 145000, stolenAt: new Date('2025-09-18'), stolenLocation: 'GVK One Mall, Hyderabad', identifiers: [{ type: 'SERIAL' as const, value: 'SD4210' }] },
    { scid: 'SC-2026-K3Q76', category: 'OTHER' as const, title: 'Canon EOS R6 Mark II Camera', description: 'Canon EOS R6 Mark II mirrorless camera body with 24-105mm lens.', brand: 'Canon', model: 'EOS R6 Mark II', color: 'Black', estimatedValue: 265000, stolenAt: new Date('2026-02-14'), stolenLocation: 'Necklace Road, Hyderabad', firNumber: 'HYD-2026-06789', identifiers: [{ type: 'SERIAL' as const, value: '032024001234' }] },
  ];

  for (const itemData of items) {
    const { identifiers, ...rest } = itemData;
    const existing = await prisma.stolenItem.findUnique({ where: { scid: rest.scid } });
    if (existing) continue;
    await prisma.stolenItem.create({
      data: { ...rest, userId: victim.id,
        images: { create: [{ url: `/uploads/items/placeholder_${rest.scid}_1.jpg`, isPrimary: true }, { url: `/uploads/items/placeholder_${rest.scid}_2.jpg` }, { url: `/uploads/items/placeholder_${rest.scid}_3.jpg` }] },
        identifiers: { create: identifiers },
      },
    });
  }
  console.log('10 stolen items created');

  const allItems = await prisma.stolenItem.findMany({ include: { images: { where: { isPrimary: true }, take: 1 } }, orderBy: { createdAt: 'asc' } });

  const vlogs = [
    { idx: 0, tps: 85, imgSim: 0.91, idMatch: 80, meta: 75, ctx: 100, lat: 17.3616, lng: 78.4747 },
    { idx: 1, tps: 78, imgSim: 0.82, idMatch: 60, meta: 50, ctx: 70, lat: 17.3950, lng: 78.4867 },
    { idx: 3, tps: 55, imgSim: 0.68, idMatch: 0, meta: 50, ctx: 40, lat: 17.4325, lng: 78.4099 },
    { idx: 6, tps: 48, imgSim: 0.55, idMatch: 60, meta: 25, ctx: 20, lat: 17.4401, lng: 78.3489 },
    { idx: 8, tps: 22, imgSim: 0.25, idMatch: 0, meta: 25, ctx: 20, lat: 17.4156, lng: 78.4347 },
  ];
  for (const v of vlogs) {
    await prisma.verificationLog.create({ data: { scannedById: buyer.id, itemId: allItems[v.idx]?.id, imageSimilarity: v.imgSim, idMatchScore: v.idMatch, metadataScore: v.meta, contextScore: v.ctx, tps: v.tps, latitude: v.lat, longitude: v.lng } });
  }
  console.log('5 verification logs created');

  await prisma.photoScanAlert.create({
    data: { scanImageUrl: '/uploads/scans/scan_alert1.jpg', scanEmbedding: Array(1280).fill(0.01), scanLatitude: 17.3616, scanLongitude: 78.4747, scanLocation: 'Dilsukhnagar Market, Hyderabad', scannedById: buyer.id, topSimilarityScore: 0.91, overallTPS: 85, urgencyLevel: 'HIGH', alertStatus: 'NOTIFIED', assignedOfficerId: officer.id, officerNotifiedAt: new Date(),
      matches: { create: [{ stolenItemId: allItems[0].id, matchedImageId: allItems[0].images[0].id, similarityScore: 0.91, tps: 85, rank: 1 }, { stolenItemId: allItems[1].id, matchedImageId: allItems[1].images[0].id, similarityScore: 0.72, tps: 62, rank: 2 }] } },
  });
  await prisma.photoScanAlert.create({
    data: { scanImageUrl: '/uploads/scans/scan_alert2.jpg', scanEmbedding: Array(1280).fill(0.02), scanLatitude: 17.3950, scanLongitude: 78.4867, scanLocation: 'Abids Road, Hyderabad', scannedById: buyer.id, topSimilarityScore: 0.68, overallTPS: 55, urgencyLevel: 'MEDIUM', alertStatus: 'ACKNOWLEDGED', assignedOfficerId: officer.id, officerNotifiedAt: new Date(Date.now() - 3600000), officerAckedAt: new Date(Date.now() - 1800000),
      matches: { create: [{ stolenItemId: allItems[3].id, matchedImageId: allItems[3].images[0].id, similarityScore: 0.68, tps: 55, rank: 1 }] } },
  });
  await prisma.photoScanAlert.create({
    data: { scanImageUrl: '/uploads/scans/scan_alert3.jpg', scanEmbedding: Array(1280).fill(0.03), scanLatitude: 17.4325, scanLongitude: 78.4099, scanLocation: 'Jubilee Hills, Hyderabad', scannedById: buyer.id, topSimilarityScore: 0.88, overallTPS: 80, urgencyLevel: 'HIGH', alertStatus: 'RESOLVED', assignedOfficerId: officer.id, officerNotifiedAt: new Date(Date.now() - 86400000), officerAckedAt: new Date(Date.now() - 82800000), resolvedAt: new Date(Date.now() - 72000000), resolutionNotes: 'Item recovered. Buyer cooperated. FIR updated.',
      matches: { create: [{ stolenItemId: allItems[6].id, matchedImageId: allItems[6].images[0].id, similarityScore: 0.88, tps: 80, rank: 1 }] } },
  });
  console.log('3 photo scan alerts created');
  console.log('Seeding complete!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
