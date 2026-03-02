import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database/pool';

const router = Router();

const createUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional().nullable(),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  limite_emprestimos: z.number().int().min(1).max(10).default(3),
  ativo: z.boolean().default(true),
});

const updateUsuarioSchema = createUsuarioSchema.partial();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, cpf, limite_emprestimos, ativo, created_at, updated_at FROM usuarios ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      'SELECT id, nome, email, cpf, limite_emprestimos, ativo, created_at, updated_at FROM usuarios WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const { nome, email, cpf, limite_emprestimos, ativo } = parsed.data;
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, cpf, limite_emprestimos, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, cpf, limite_emprestimos, ativo, created_at, updated_at`,
      [nome, email ?? null, cpf, limite_emprestimos, ativo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return res.status(409).json({ error: 'CPF ou e-mail já cadastrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const parsed = updateUsuarioSchema.safeParse(req.body);
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
      `UPDATE usuarios SET ${setClause} WHERE id = $1
       RETURNING id, nome, email, cpf, limite_emprestimos, ativo, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return res.status(409).json({ error: 'CPF ou e-mail já cadastrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(204).send();
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23503') {
      return res.status(409).json({ error: 'Usuário possui empréstimos vinculados' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
