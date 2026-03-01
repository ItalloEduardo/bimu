import { Router, Request, Response } from 'express';
import { healthCheck as dbHealthCheck } from '../database/pool';
import { healthCheck as minioHealthCheck } from '../storage/minio';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const dbOk = await dbHealthCheck();
  const minioOk = await minioHealthCheck();

  const status = dbOk && minioOk ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'up' : 'down',
      minio: minioOk ? 'up' : 'down',
    },
  });
});

export default router;
