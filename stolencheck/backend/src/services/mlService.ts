import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function extractEmbedding(imagePath: string): Promise<number[]> {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  const response = await axios.post(`${ML_URL}/extract`, form, {
    headers: form.getHeaders(),
    timeout: 30000,
  });
  return response.data.embedding;
}

export async function matchEmbeddings(
  queryEmbedding: number[],
  candidates: number[][],
  topK: number = 5
): Promise<{ index: number; score: number }[]> {
  const response = await axios.post(`${ML_URL}/match`, {
    query_embedding: queryEmbedding, candidates, top_k: topK,
  }, { timeout: 30000 });
  return response.data.results;
}
