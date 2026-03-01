import express from 'express';
import { config } from './config';
import healthRouter from './routes/health';

const app = express();

app.use(express.json());

app.use('/health', healthRouter);

app.get('/', (_req, res) => {
  res.json({
    name: 'BIMU API',
    version: '1.0.0',
    description: 'Biblioteca Municipal Unificada - Sistema de gerenciamento de biblioteca compartilhada',
  });
});

app.listen(config.API_PORT, () => {
  console.log(`BIMU API rodando na porta ${config.API_PORT}`);
});
