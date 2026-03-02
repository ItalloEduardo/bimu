import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database/pool';

const router = Router();

const createLivroSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  autor: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  editora: z.string().optional().nullable(),
  ano_publicacao: z.number().int().min(1000).max(2100).optional().nullable(),
});

const updateLivroSchema = createLivroSchema.partial();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, titulo, autor, isbn, editora, ano_publicacao, created_at, updated_at FROM livros ORDER BY titulo'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar livros' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      'SELECT id, titulo, autor, isbn, editora, ano_publicacao, created_at, updated_at FROM livros WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar livro' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createLivroSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const { titulo, autor, isbn, editora, ano_publicacao } = parsed.data;
    const result = await pool.query(
      `INSERT INTO livros (titulo, autor, isbn, editora, ano_publicacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, titulo, autor, isbn, editora, ano_publicacao, created_at, updated_at`,
      [titulo, autor ?? null, isbn ?? null, editora ?? null, ano_publicacao ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar livro' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const parsed = updateLivroSchema.safeParse(req.body);
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
      `UPDATE livros SET ${setClause} WHERE id = $1
       RETURNING id, titulo, autor, isbn, editora, ano_publicacao, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar livro' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query('DELETE FROM livros WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    res.status(204).send();
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23503') {
      return res.status(409).json({ error: 'Livro possui exemplares vinculados' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir livro' });
  }
});

export default router;
