import express from 'express';
import cors from 'cors';
import { config } from './config';
import healthRouter from './routes/health';
import usuariosRouter from './routes/usuarios';
import livrosRouter from './routes/livros';
import exemplaresRouter from './routes/exemplares';
import emprestimosRouter from './routes/emprestimos';
import multasRouter from './routes/multas';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://192.168.1.7:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use('/health', healthRouter);
app.use('/usuarios', usuariosRouter);
app.use('/livros', livrosRouter);
app.use('/exemplares', exemplaresRouter);
app.use('/emprestimos', emprestimosRouter);
app.use('/multas', multasRouter);

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
