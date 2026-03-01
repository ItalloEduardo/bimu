import { Pool, PoolClient } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Obtém uma conexão do pool.
 * Para operações transacionais (RCC-03, RCC-04, RCC-06), use withTransaction.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Executa uma função dentro de uma transação.
 * Garante BEGIN, COMMIT em sucesso e ROLLBACK em erro.
 * Nível de isolamento: READ COMMITTED (padrão PostgreSQL, RCC-08).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verifica se o pool consegue conectar ao banco.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export { pool };
