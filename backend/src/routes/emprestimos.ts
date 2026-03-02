import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../database/pool';

const router = Router();

const realizarEmprestimoSchema = z.object({
  usuario_id: z.number().int().positive('Usuário é obrigatório'),
  exemplar_id: z.number().int().positive('Exemplar é obrigatório'),
  data_prevista_devolucao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const usuarioId = req.query.usuario_id;
    let query = `
      SELECT e.id, e.usuario_id, e.exemplar_id, e.data_emprestimo, e.data_prevista_devolucao,
             e.data_devolucao, e.status, e.created_at, e.updated_at,
             u.nome as usuario_nome, u.cpf as usuario_cpf,
             ex.codigo as exemplar_codigo, ex.status as exemplar_status,
             l.titulo as livro_titulo, l.autor as livro_autor
      FROM emprestimos e
      JOIN usuarios u ON u.id = e.usuario_id
      JOIN exemplares ex ON ex.id = e.exemplar_id
      JOIN livros l ON l.id = ex.livro_id
    `;
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (status) {
      conditions.push(`e.status = $${params.length + 1}`);
      params.push(status);
    }
    if (usuarioId) {
      const id = parseInt(String(usuarioId), 10);
      if (!isNaN(id)) {
        conditions.push(`e.usuario_id = $${params.length + 1}`);
        params.push(id);
      }
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY e.data_emprestimo DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar empréstimos' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await pool.query(
      `SELECT e.id, e.usuario_id, e.exemplar_id, e.data_emprestimo, e.data_prevista_devolucao,
              e.data_devolucao, e.status, e.created_at, e.updated_at,
              u.nome as usuario_nome, u.cpf as usuario_cpf,
              ex.codigo as exemplar_codigo, ex.status as exemplar_status,
              l.titulo as livro_titulo, l.autor as livro_autor
       FROM emprestimos e
       JOIN usuarios u ON u.id = e.usuario_id
       JOIN exemplares ex ON ex.id = e.exemplar_id
       JOIN livros l ON l.id = ex.livro_id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar empréstimo' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = realizarEmprestimoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }
    const { usuario_id, exemplar_id, data_prevista_devolucao } = parsed.data;

    const emprestimo = await withTransaction(async (client) => {
      const exemplarResult = await client.query(
        'SELECT id, status FROM exemplares WHERE id = $1 FOR UPDATE',
        [exemplar_id]
      );
      if (exemplarResult.rows.length === 0) {
        throw new Error('EXEMPLAR_NAO_ENCONTRADO');
      }
      if (exemplarResult.rows[0].status !== 'DISPONIVEL') {
        throw new Error('EXEMPLAR_INDISPONIVEL');
      }

      const usuarioResult = await client.query(
        'SELECT id, limite_emprestimos, ativo FROM usuarios WHERE id = $1',
        [usuario_id]
      );
      if (usuarioResult.rows.length === 0) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
      }
      if (!usuarioResult.rows[0].ativo) {
        throw new Error('USUARIO_INATIVO');
      }

      const countResult = await client.query(
        'SELECT COUNT(*) as total FROM emprestimos WHERE usuario_id = $1 AND status = $2',
        [usuario_id, 'ATIVO']
      );
      const totalAtivos = parseInt(countResult.rows[0].total, 10);
      const limite = usuarioResult.rows[0].limite_emprestimos;
      if (totalAtivos >= limite) {
        throw new Error('LIMITE_ATINGIDO');
      }

      const insertResult = await client.query(
        `INSERT INTO emprestimos (usuario_id, exemplar_id, data_prevista_devolucao)
         VALUES ($1, $2, $3)
         RETURNING id, usuario_id, exemplar_id, data_emprestimo, data_prevista_devolucao, status, created_at, updated_at`,
        [usuario_id, exemplar_id, data_prevista_devolucao]
      );

      await client.query(
        "UPDATE exemplares SET status = 'EMPRESTADO' WHERE id = $1",
        [exemplar_id]
      );

      return insertResult.rows[0];
    });

    res.status(201).json(emprestimo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'EXEMPLAR_NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'Exemplar não encontrado' });
    }
    if (msg === 'EXEMPLAR_INDISPONIVEL') {
      return res.status(409).json({ error: 'Exemplar não está disponível para empréstimo' });
    }
    if (msg === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (msg === 'USUARIO_INATIVO') {
      return res.status(400).json({ error: 'Usuário está inativo' });
    }
    if (msg === 'LIMITE_ATINGIDO') {
      return res.status(400).json({ error: 'Usuário atingiu o limite de empréstimos ativos' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar empréstimo' });
  }
});

router.post('/:id/devolver', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const emprestimo = await withTransaction(async (client) => {
      const empResult = await client.query(
        'SELECT id, exemplar_id, status FROM emprestimos WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (empResult.rows.length === 0) {
        throw new Error('NAO_ENCONTRADO');
      }
      if (empResult.rows[0].status !== 'ATIVO') {
        throw new Error('JA_DEVOLVIDO');
      }

      const exemplarId = empResult.rows[0].exemplar_id;

      await client.query(
        "UPDATE emprestimos SET status = 'DEVOLVIDO', data_devolucao = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      await client.query(
        "UPDATE exemplares SET status = 'DISPONIVEL' WHERE id = $1",
        [exemplarId]
      );

      const updated = await client.query(
        `SELECT e.id, e.usuario_id, e.exemplar_id, e.data_emprestimo, e.data_prevista_devolucao,
                e.data_devolucao, e.status, e.created_at, e.updated_at
         FROM emprestimos e WHERE e.id = $1`,
        [id]
      );
      return updated.rows[0];
    });

    res.json(emprestimo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }
    if (msg === 'JA_DEVOLVIDO') {
      return res.status(400).json({ error: 'Empréstimo já foi devolvido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao devolver empréstimo' });
  }
});

export default router;
