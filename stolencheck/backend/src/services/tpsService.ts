export interface TPSInput {
  imageSimilarity: number;
  idMatchScore: number;
  metadataScore: number;
  contextScore: number;
}

export interface TPSResult {
  tps: number;
  band: 'GREEN' | 'AMBER' | 'RED';
  breakdown: { imageSimilarity: number; idMatchScore: number; metadataScore: number; contextScore: number };
}

export function calculateTPS(input: TPSInput): TPSResult {
  const tps = Math.min(100, Math.max(0, Math.round(
    (input.imageSimilarity * 100) * 0.40 + input.idMatchScore * 0.35 + input.metadataScore * 0.15 + input.contextScore * 0.10
  )));
  let band: 'GREEN' | 'AMBER' | 'RED';
  if (tps >= 70) band = 'RED'; else if (tps >= 40) band = 'AMBER'; else band = 'GREEN';
  return { tps, band, breakdown: { imageSimilarity: Math.round(input.imageSimilarity * 100), idMatchScore: input.idMatchScore, metadataScore: input.metadataScore, contextScore: input.contextScore } };
}

export function computeContextScore(stolenAt: Date): number {
  const daysSince = Math.floor((Date.now() - stolenAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince < 7) return 100;
  if (daysSince < 30) return 70;
  if (daysSince < 90) return 40;
  return 20;
}

export function computeMetadataScore(
  scannedMeta: { brand?: string; model?: string; color?: string; category?: string },
  itemMeta: { brand?: string | null; model?: string | null; color?: string | null; category: string }
): number {
  let score = 0;
  if (scannedMeta.brand && itemMeta.brand && scannedMeta.brand.toLowerCase() === itemMeta.brand.toLowerCase()) score += 25;
  if (scannedMeta.model && itemMeta.model && scannedMeta.model.toLowerCase() === itemMeta.model.toLowerCase()) score += 25;
  if (scannedMeta.color && itemMeta.color && scannedMeta.color.toLowerCase() === itemMeta.color.toLowerCase()) score += 25;
  if (scannedMeta.category && scannedMeta.category === itemMeta.category) score += 25;
  return score;
}

export function computeIdMatchScore(queryValue: string, storedValue: string): number {
  if (queryValue === storedValue) return 100;
  if (levenshtein(queryValue, storedValue) <= 2) return 60;
  return 0;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
