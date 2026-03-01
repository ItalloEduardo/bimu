import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  POSTGRES_USER: z.string().default('bimu'),
  POSTGRES_PASSWORD: z.string().default('bimu_pass'),
  POSTGRES_DB: z.string().default('bimu'),
  POSTGRES_PORT: z.string().default('5433'),

  // MinIO
  MINIO_ENDPOINT: z.string().default('minio:9000'),
  MINIO_ROOT_USER: z.string().default('bimu'),
  MINIO_ROOT_PASSWORD: z.string().default('bimu_pass'),
  MINIO_USE_SSL: z
    .string()
    .default('false')
    .transform((v) => v?.toLowerCase() === 'true'),

  // API
  API_PORT: z.string().default('3000').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro na configuração das variáveis de ambiente:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
