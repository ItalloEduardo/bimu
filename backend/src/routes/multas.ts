import { Router, Request, Response } from 'express';
import { pool } from '../database/pool';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const paga = req.query.paga as string | undefined;
    let query = `
      SELECT m.id, m.emprestimo_id, m.valor, m.data_aplicacao, m.paga, m.data_pagamento, m.created_at, m.updated_at,
             e.usuario_id, e.exemplar_id, e.data_emprestimo, e.data_prevista_devolucao,
             u.nome as usuario_nome, u.cpf as usuario_cpf,
             l.titulo as livro_titulo, ex.codigo as exemplar_codigo
      FROM multas m
      JOIN emprestimos e ON e.id = m.emprestimo_id
      JOIN usuarios u ON u.id = e.usuario_id
      JOIN exemplares ex ON ex.id = e.exemplar_id
      JOIN livros l ON l.id = ex.livro_id
    `;
    const params: unknown[] = [];
    if (paga !== undefined) {
      const pagaBool = paga === 'true';
      query += ' WHERE m.paga = $1';
      params.push(pagaBool);
    }
    query += ' ORDER BY m.data_aplicacao DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar multas' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      `SELECT m.id, m.emprestimo_id, m.valor, m.data_aplicacao, m.paga, m.data_pagamento, m.created_at, m.updated_at,
              e.usuario_id, e.exemplar_id, e.data_emprestimo, e.data_prevista_devolucao,
              u.nome as usuario_nome, u.cpf as usuario_cpf,
              l.titulo as livro_titulo, ex.codigo as exemplar_codigo
       FROM multas m
       JOIN emprestimos e ON e.id = m.emprestimo_id
       JOIN usuarios u ON u.id = e.usuario_id
       JOIN exemplares ex ON ex.id = e.exemplar_id
       JOIN livros l ON l.id = ex.livro_id
       WHERE m.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Multa não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar multa' });
  }
});

router.patch('/:id/pagar', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      `UPDATE multas SET paga = true, data_pagamento = CURRENT_TIMESTAMP WHERE id = $1 AND paga = false
       RETURNING id, emprestimo_id, valor, data_aplicacao, paga, data_pagamento, created_at, updated_at`,
      [id]
    );
    if (result.rows.length === 0) {
      const check = await pool.query('SELECT id FROM multas WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Multa não encontrada' });
      }
      return res.status(400).json({ error: 'Multa já está paga' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar pagamento da multa' });
  }
});

export default router;
