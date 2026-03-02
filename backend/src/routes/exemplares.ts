import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database/pool';

const router = Router();

const statusExemplar = ['DISPONIVEL', 'EMPRESTADO', 'INDISPONIVEL'] as const;

const createExemplarSchema = z.object({
  livro_id: z.number().int().positive('Livro é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  status: z.enum(statusExemplar).default('DISPONIVEL'),
});

const updateExemplarSchema = z.object({
  livro_id: z.number().int().positive().optional(),
  codigo: z.string().min(1).optional(),
  status: z.enum(statusExemplar).optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const livroId = req.query.livro_id;
    const status = req.query.status;
    let query =
      `SELECT e.id, e.livro_id, e.codigo, e.status, e.created_at, e.updated_at,
        l.titulo as livro_titulo, l.autor as livro_autor
       FROM exemplares e
       JOIN livros l ON l.id = e.livro_id`;
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (livroId) {
      const id = parseInt(String(livroId), 10);
      if (!isNaN(id)) {
        conditions.push(`e.livro_id = $${params.length + 1}`);
        params.push(id);
      }
    }
    if (status && statusExemplar.includes(status as (typeof statusExemplar)[number])) {
      conditions.push(`e.status = $${params.length + 1}`);
      params.push(status);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY e.codigo';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar exemplares' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      `SELECT e.id, e.livro_id, e.codigo, e.status, e.created_at, e.updated_at,
        l.titulo as livro_titulo, l.autor as livro_autor
       FROM exemplares e
       JOIN livros l ON l.id = e.livro_id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exemplar não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar exemplar' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createExemplarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const { livro_id, codigo, status } = parsed.data;
    const result = await pool.query(
      `INSERT INTO exemplares (livro_id, codigo, status)
       VALUES ($1, $2, $3)
       RETURNING id, livro_id, codigo, status, created_at, updated_at`,
      [livro_id, codigo, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return res.status(409).json({ error: 'Código de exemplar já existe' });
    }
    if (pgErr.code === '23503') {
      return res.status(400).json({ error: 'Livro não encontrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar exemplar' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const parsed = updateExemplarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const fields = Object.keys(parsed.data) as (keyof typeof parsed.data)[];
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map((f) => parsed.data[f])];
    const result = await pool.query(
      `UPDATE exemplares SET ${setClause} WHERE id = $1
       RETURNING id, livro_id, codigo, status, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exemplar não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return res.status(409).json({ error: 'Código de exemplar já existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar exemplar' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query('DELETE FROM exemplares WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exemplar não encontrado' });
    }
    res.status(204).send();
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23503') {
      return res.status(409).json({ error: 'Exemplar possui empréstimos vinculados' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir exemplar' });
  }
});

export default router;
